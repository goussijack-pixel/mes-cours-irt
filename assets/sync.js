/* Synchronisation automatique entre appareils (téléphone, ordinateur, site installé).
   - Ton code personnel ne quitte jamais l'appareil : on en tire (PBKDF2) un identifiant et une clé AES.
   - La progression (clés localStorage « rev:… ») est chiffrée sur l'appareil, puis stockée dans un coffre Supabase.
   - Sans Internet, tout marche en local ; les changements partent dès que la connexion revient.
   - Fusion clé par clé : la modification la plus récente gagne (les suppressions aussi). */
(function () {
  "use strict";
  var URL_API = "https://lchtfoqepageaqnynrki.supabase.co/rest/v1/rpc/";
  var CLE_PUBLIQUE = "sb_publishable_sYSmQXJc5E0S3s5be011UQ_27KddrJB"; // clé « publishable » : publique par conception
  var K_CONF = "rev~sync", K_MT = "rev~mt", K_ASK = "rev~syncask";   // préfixe « rev~ » : jamais synchronisé lui-même
  var S = window.localStorage, quiet = 0, conf = null, mt = {}, busy = false, again = false, timer = null, t0 = Date.now();
  var etat = { actif: false, statut: "désactivée", derniere: null, erreur: null };

  function lireJSON(k, d) { try { var v = S.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function ecrireJSON(k, v) { try { quiet++; S.setItem(k, JSON.stringify(v)); } catch (e) {} finally { quiet--; } }
  conf = lireJSON(K_CONF, null); mt = lireJSON(K_MT, {});
  etat.actif = !!(conf && conf.id && conf.k);

  /* ---- Horodatage de chaque modification locale ---- */
  var setI = Storage.prototype.setItem, remI = Storage.prototype.removeItem;
  function marque(k, mort) { if (quiet || typeof k !== "string" || k.indexOf("rev:") !== 0) return; mt[k] = [Date.now(), mort ? 1 : 0]; ecrireJSON(K_MT, mt); planifier(4000); }
  // Seul un vrai changement de valeur est daté (l'app réécrit souvent les mêmes données au chargement)
  Storage.prototype.setItem = function (k, v) { var avant = this === S ? this.getItem(k) : null; var r = setI.call(this, k, v); if (this === S && avant !== String(v)) marque(String(k), false); return r; };
  Storage.prototype.removeItem = function (k) { var existait = this === S && this.getItem(k) !== null; var r = remI.call(this, k); if (existait) marque(String(k), true); return r; };
  function poser(k, v) { quiet++; try { if (v === null) remI.call(S, k); else setI.call(S, k, v); } finally { quiet--; } }

  /* ---- Cryptographie ---- */
  var enc = new TextEncoder(), dec = new TextDecoder();
  function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function b64(u) { var s = "", i; for (i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); }
  function unb64(t) { var s = atob(t), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function deriver(code) {
    return crypto.subtle.importKey("raw", enc.encode(code.normalize("NFC")), "PBKDF2", false, ["deriveBits"]).then(function (base) {
      return crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode("mes-cours-irt/sync/v1"), iterations: 250000, hash: "SHA-256" }, base, 512);
    }).then(function (bits) { var u = new Uint8Array(bits); return { id: hex(u.slice(0, 32)), k: b64(u.slice(32)) }; });
  }
  function cle() { return crypto.subtle.importKey("raw", unb64(conf.k), "AES-GCM", false, ["encrypt", "decrypt"]); }
  function chiffrer(obj) { var iv = crypto.getRandomValues(new Uint8Array(12));
    return cle().then(function (k) { return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, enc.encode(JSON.stringify(obj))); })
      .then(function (c) { var u = new Uint8Array(12 + c.byteLength); u.set(iv); u.set(new Uint8Array(c), 12); return b64(u); }); }
  function dechiffrer(t) { var u = unb64(t);
    return cle().then(function (k) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: u.slice(0, 12) }, k, u.slice(12)); })
      .then(function (p) { return JSON.parse(dec.decode(p)); }); }

  /* ---- Coffre distant ---- */
  function rpc(nom, corps) {
    return fetch(URL_API + nom, { method: "POST", headers: { "apikey": CLE_PUBLIQUE, "Content-Type": "application/json" }, body: JSON.stringify(corps) })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) { var err = new Error(j && j.message === "conflit" ? "conflit" : "serveur"); throw err; } return j; }); });
  }

  /* ---- État local ---- */
  function cles() { var L = []; for (var i = 0; i < S.length; i++) { var k = S.key(i); if (k && k.indexOf("rev:") === 0) L.push(k); } return L; }
  function local() { var d = {}; cles().forEach(function (k) { d[k] = S.getItem(k); }); return { d: d, m: mt }; }

  // Fusion : pour chaque clé, la version la plus récente gagne.
  // 1re activation sur un appareil : la progression déjà synchronisée gagne pour les éléments communs ; ce qui n'existe qu'ici est gardé et envoyé.
  function fusionner(dist, premiere) {
    var change = false, aPousser = false, loc = local(), dm = dist.m || {}, dd = dist.d || {};
    var toutes = {}; Object.keys(loc.d).concat(Object.keys(dd), Object.keys(dm), Object.keys(loc.m)).forEach(function (k) { if (k.indexOf("rev:") === 0) toutes[k] = 1; });
    Object.keys(toutes).forEach(function (k) {
      var lt = (loc.m[k] || [0])[0], rt = (dm[k] || [0])[0];
      var rv = dm[k] && dm[k][1] ? null : (k in dd ? dd[k] : null), lv = k in loc.d ? loc.d[k] : null;
      var prendre = premiere ? (k in dd || !!dm[k]) : rt > lt;
      if (prendre) { if (rv !== lv) { poser(k, rv); change = true; } mt[k] = dm[k] || [Date.now(), 0]; }
      else if (lt > rt || (lv !== null && !(k in dd)) || rv !== lv) aPousser = true;
    });
    // Données présentes avant l'activation, jamais datées : on les date maintenant pour que tous les appareils convergent
    var now = Date.now(); cles().forEach(function (k) { if (!mt[k]) { mt[k] = [now, 0]; aPousser = true; } });
    ecrireJSON(K_MT, mt);
    return { change: change, aPousser: aPousser };
  }

  function dire(statut, erreur) { etat.statut = statut; etat.erreur = erreur || null; try { window.dispatchEvent(new CustomEvent("syncstate", { detail: etat })); } catch (e) {} }

  function synchroniser(premiere) {
    if (!etat.actif) return Promise.resolve(false);
    if (!navigator.onLine) { dire("hors ligne : tes changements partiront au retour d'Internet"); return Promise.resolve(false); }
    if (busy) { again = true; return Promise.resolve(false); }
    busy = true; dire("synchronisation…");
    var recu = false;
    function tour(n) {
      return rpc("coffre_lire", { p_id: conf.id }).then(function (rows) {
        var row = rows && rows[0];
        var p = row ? dechiffrer(row.data) : Promise.resolve({ d: {}, m: {} });
        return p.then(function (dist) {
          var f = fusionner(dist, premiere || !conf.rev);
          if (f.change) recu = true;
          var rev = row ? Number(row.rev) : 0;
          if (!f.aPousser && row) { conf.rev = rev; ecrireJSON(K_CONF, conf); return; }
          return chiffrer(local()).then(function (blob) { return rpc("coffre_ecrire", { p_id: conf.id, p_data: blob, p_rev: rev }); })
            .then(function (nv) { conf.rev = Number(nv); ecrireJSON(K_CONF, conf); })
            .catch(function (e) { if (e.message === "conflit" && n < 3) return tour(n + 1); throw e; });
        });
      });
    }
    return tour(0).then(function () {
      etat.derniere = Date.now(); conf.last = etat.derniere; ecrireJSON(K_CONF, conf); dire("à jour");
      if (recu) apresReception(); return recu;
    }).catch(function (e) {
      dire(e && e.name === "OperationError" ? "code incorrect pour ce coffre" : "échec (" + (e && e.message || "réseau") + "), nouvel essai bientôt", true);
      planifier(60000); return false;
    }).then(function (r) { busy = false; if (again) { again = false; planifier(1500); } return r; });
  }
  function planifier(ms) { if (!etat.actif) return; clearTimeout(timer); timer = setTimeout(function () { synchroniser(false); }, ms); }

  function apresReception() {
    var j = 0; try { j = +sessionStorage.getItem("rev~syncreload") || 0; } catch (e) {}
    if (Date.now() - t0 < 15000 && Date.now() - j > 30000) { try { sessionStorage.setItem("rev~syncreload", String(Date.now())); } catch (e) {} location.reload(); return; }
    toast("Ta progression a été mise à jour depuis un autre appareil.", "Rafraîchir", function () { location.reload(); });
  }

  /* ---- Activation / désactivation ---- */
  function activer(code) {
    code = String(code || "");
    if (code.length < 6) return Promise.reject(new Error("Le code doit faire au moins 6 caractères."));
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("Ce navigateur ne permet pas le chiffrement (ouvre l'app en https)."));
    dire("préparation du code…");
    return deriver(code).then(function (d) {
      conf = { id: d.id, k: d.k, rev: 0, last: null }; ecrireJSON(K_CONF, conf); etat.actif = true; ecrireJSON(K_ASK, 1);
      return synchroniser(true);
    });
  }
  function desactiver(effacerCoffre) {
    var p = effacerCoffre && conf && navigator.onLine ? rpc("coffre_effacer", { p_id: conf.id }).catch(function () {}) : Promise.resolve();
    return p.then(function () { conf = null; etat.actif = false; try { quiet++; remI.call(S, K_CONF); } finally { quiet--; } dire("désactivée"); });
  }

  /* ---- Petites interfaces : toast et fenêtre du 1er lancement ---- */
  function toast(msg, action, fn) {
    var t = document.createElement("div");
    t.setAttribute("role", "status");
    t.style.cssText = "position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:99999;max-width:92vw;background:var(--sheet,#111);color:var(--ink,#fff);border:1px solid var(--line,#333);border-radius:14px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:600 14px/1.4 system-ui,sans-serif;display:flex;gap:12px;align-items:center";
    t.textContent = msg;
    if (action) { var b = document.createElement("button"); b.textContent = action; b.style.cssText = "border:0;border-radius:10px;padding:8px 12px;background:var(--acc,#3b82f6);color:#fff;font-weight:700"; b.onclick = function () { t.remove(); fn(); }; t.appendChild(b); }
    document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.remove(); }, 12000);
  }
  function fenetreCode(titre, texte, apres) {
    var o = document.createElement("div");
    o.style.cssText = "position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px";
    o.innerHTML = '<form style="width:100%;max-width:380px;background:var(--sheet,#111);color:var(--ink,#fff);border:1px solid var(--line,#333);border-radius:18px;padding:20px;font:15px/1.5 system-ui,sans-serif">' +
      '<h3 style="margin:0 0 6px;font-size:18px"></h3><p style="margin:0 0 12px;color:var(--ink2,#aaa);font-size:13.5px"></p>' +
      '<input type="password" autocomplete="off" minlength="6" required placeholder="Ton code personnel (6 caractères ou plus)" style="width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid var(--line,#333);background:var(--paper,#000);color:var(--ink,#fff);font-size:16px">' +
      '<p data-err style="color:#ef4444;font-size:13px;min-height:18px;margin:6px 0"></p>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-later style="border:1px solid var(--line,#333);background:none;color:inherit;border-radius:10px;padding:10px 14px">Plus tard</button>' +
      '<button style="border:0;background:var(--acc,#3b82f6);color:#fff;border-radius:10px;padding:10px 16px;font-weight:700">Activer</button></div></form>';
    o.querySelector("h3").textContent = titre; o.querySelector("p").textContent = texte;
    var f = o.querySelector("form"), inp = o.querySelector("input"), err = o.querySelector("[data-err]");
    o.querySelector("[data-later]").onclick = function () { ecrireJSON(K_ASK, 1); o.remove(); };
    f.onsubmit = function (e) { e.preventDefault(); err.textContent = "Chiffrement du code…";
      activer(inp.value).then(function () { o.remove(); toast("Synchronisation activée sur cet appareil."); if (apres) apres(); }, function (x) { err.textContent = x.message; }); };
    document.body.appendChild(o); setTimeout(function () { inp.focus(); }, 50);
  }

  window.SYNC = { etat: etat, activer: activer, desactiver: desactiver, maintenant: function () { return synchroniser(false); }, demander: fenetreCode };

  /* ---- Démarrage ---- */
  addEventListener("online", function () { planifier(1000); });
  document.addEventListener("visibilitychange", function () { planifier(document.visibilityState === "visible" ? 800 : 100); });
  setInterval(function () { if (document.visibilityState === "visible") synchroniser(false); }, 120000);
  if (etat.actif) planifier(300);
  else document.addEventListener("DOMContentLoaded", function () {
    // 1re ouverture sur cet appareil : on propose le code une seule fois (après la création du profil)
    if (lireJSON(K_ASK, 0) || !lireJSON("rev:profil", null)) return;
    setTimeout(function () { fenetreCode("Synchroniser tes appareils", "Entre ton code personnel : ta progression sera la même sur ton téléphone, ton ordinateur et le site. Il est chiffré et ne quitte jamais cet appareil.", function () { location.reload(); }); }, 2500);
  });
})();
