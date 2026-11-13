/* ===== PROFIL + SONS : profil de l'étudiant, mot de passe local, zone rouge, bruitages =====
   Le mot de passe est haché (SHA-256 + sel) et stocké sur l'appareil. Il protège contre un effacement
   accidentel ou par une autre personne qui utilise l'appareil ; ce n'est pas un coffre-fort
   (quelqu'un qui efface les données du navigateur efface tout). */
(function () {
"use strict";
var KEY = "rev:profil", GK = "rev:global", PK = "rev:player";
var $ = function (s, r) { return (r || document).querySelector(s); };
function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function prefs() { return load(GK, { snd: true, motion: "full" }); }

/* ---------- Vitesse des animations (réglage global) ----------
   « Posée » (défaut) ralentit toutes les animations CSS d'environ 1,8× ; « Normale » = vitesse d'origine.
   Les séquences pilotées en JavaScript (intro, terminal Auto-IA) multiplient leurs durées par PROFIL.lent(). */
var VITESSES = { posee: 0.55, normale: 1, vive: 1.35 };
function vitesse() { return VITESSES[prefs().speed || "posee"] || 0.55; }
function lent() { return 1 / vitesse(); }
function ralentir(a) { try { if (a.__vit) return; var t = a.effect && a.effect.getTiming && a.effect.getTiming(); if (a.transitionProperty !== undefined && t && t.duration < 300) return; a.playbackRate = vitesse(); a.__vit = 1; } catch (e) {} }
function ralentirTout() { try { document.getAnimations().forEach(ralentir); } catch (e) {} }
["animationstart", "transitionrun"].forEach(function (ev) {
  document.addEventListener(ev, function (e) { try { e.target.getAnimations().forEach(ralentir); } catch (er) {} }, true);
});
document.addEventListener("DOMContentLoaded", ralentirTout); window.addEventListener("load", ralentirTout);

/* ---------- Sons synthétisés (aucun fichier, fonctionne hors-ligne) ---------- */
var AC = null;
function ctx() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; } return AC; }
function tone(f, t0, d, type, vol, f2) { var c = ctx(); if (!c) return; try { var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0; o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .08, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05); } catch (e) {} }
function noise(t0, d, f1, f2, vol, q) { var c = ctx(); if (!c) return; try { var n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), ch = b.getChannelData(0); for (var i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1; var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0; s.buffer = b; fl.type = "bandpass"; fl.Q.value = q || 1.2; fl.frequency.setValueAtTime(f1, t); fl.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .12, t + d * .3); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(t); s.stop(t + d + .05); } catch (e) {} }
var SOUNDS = {
  tap: function () { tone(1350, 0, .045, "sine", .045); },
  nav: function () { noise(0, .22, 900, 3800, .07, 1.4); tone(880, .02, .08, "triangle", .03); },
  open: function () { noise(0, .28, 500, 2600, .08); },
  close: function () { noise(0, .22, 2600, 500, .06); },
  toggle: function () { tone(700, 0, .05, "square", .03); tone(1050, .05, .06, "square", .03); },
  type: function () { tone(1800 + Math.random() * 600, 0, .025, "square", .018); },
  pen: function () { noise(0, .16, 2500, 5200, .05, 3); },
  chime: function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, i * .07, .9, "sine", .05); tone(f * 2, i * .07 + .02, .5, "triangle", .015); }); },
  riser: function () { noise(0, 1.1, 300, 6000, .06, .8); tone(220, 0, 1.1, "sawtooth", .02, 880); },
  sparkle: function () { for (var i = 0; i < 7; i++) tone(1500 + i * 220, i * .045, .22, "sine", .03); },
  beep: function () { tone(880, 0, .12, "square", .04); },
  go: function () { tone(1320, 0, .25, "square", .05); },
  launch: function () { noise(0, 1.4, 120, 1800, .14, .6); tone(80, 0, 1.2, "sawtooth", .05, 40); },
  danger: function () { tone(220, 0, .18, "sawtooth", .05); tone(185, .16, .26, "sawtooth", .05); },
  success: function () { [659, 880, 1175].forEach(function (f, i) { tone(f, i * .08, .3, "triangle", .07); }); }
};
function sfx(k) { if (prefs().snd === false) return; var f = SOUNDS[k]; if (f) f(); }
function audioReady() { var c = ctx(); return !!c && c.state === "running"; }

// Bruitages automatiques sur boutons, onglets et liens de navigation
document.addEventListener("click", function (e) {
  var t = e.target, el = t.closest("button, a, label.stp, .opt, [role='switch']");
  if (!el || el.closest("[data-nosfx]") || el.hasAttribute("data-menu") || el.hasAttribute("data-set") || el.hasAttribute("data-sw")) return;
  if (el.closest(".tabs, .fo-tabs")) sfx("nav");
  else if (el.matches("[data-cog], .cov summary")) sfx("toggle");
  else sfx("tap");
}, true);
document.addEventListener("toggle", function (e) { if (e.target.tagName === "DETAILS") sfx(e.target.open ? "open" : "close"); }, true);

/* ---------- Mot de passe ---------- */
function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
function hash(pwd, salt) {
  var data = salt + "|" + pwd;
  if (window.crypto && crypto.subtle && window.TextEncoder) return crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)).then(hex).catch(function () { return fnv(data); });
  return Promise.resolve(fnv(data));
}
function fnv(data) {   // repli sans WebCrypto (même empreinte à chaque appel)
  var h = 2166136261; for (var r = 0; r < 2000; r++) for (var i = 0; i < data.length; i++) { h ^= data.charCodeAt(i) + r; h = Math.imul(h, 16777619) >>> 0; }
  return "fnv-" + h.toString(16);
}
function newSalt() { var a = new Uint8Array(12); try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 12; i++) a[i] = Math.random() * 256; } return hex(a.buffer); }
function get() { return load(KEY, null); }
function verify(pwd) { var p = get(); if (!p || !p.hash) return Promise.resolve(true); return hash(pwd, p.salt).then(function (h) { return h === p.hash; }); }

/* ---------- Interface ---------- */
var CSS = "" +
".pf-ov{position:fixed;inset:0;z-index:900;display:grid;place-items:center;padding:16px;background:radial-gradient(circle at 50% 30%,#1B1446,#04050C 70%);overflow-y:auto;animation:pfIn .45s ease}" +
".pf-ov.dg{background:rgba(20,2,6,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}" +
"@keyframes pfIn{from{opacity:0}}" +
".pf-box{width:min(460px,100%);background:#0E1226;color:#EEF1FF;border:1px solid #2A3160;border-radius:24px;padding:22px 18px;box-shadow:0 30px 80px -30px #000;font-family:var(--f-x,system-ui);animation:pfUp .5s cubic-bezier(.2,.8,.2,1)}" +
"@keyframes pfUp{from{transform:translateY(24px) scale(.97);opacity:0}}" +
".pf-box h2{font-family:var(--f-t,system-ui);font-size:1.45rem;margin:4px 0 6px;line-height:1.15}" +
".pf-box p{color:#A9B2D6;margin:0 0 12px;font-size:.92rem;line-height:1.4}" +
".pf-k{font-size:.7rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7DD3FC}" +
".pf-g{display:grid;gap:10px}.pf-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
".pf-f{display:grid;gap:4px;font-size:.78rem;font-weight:700;color:#A9B2D6}" +
".pf-f input,.pf-f select{width:100%;min-width:0;padding:12px;border-radius:12px;border:1.5px solid #2A3160;background:#070A18;color:#fff;font:inherit;font-size:.95rem}" +
".pf-f input:focus,.pf-f select:focus{outline:none;border-color:#7C5CFF;box-shadow:0 0 0 3px rgba(124,92,255,.25)}" +
".pf-row{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}.pf-row button{flex:1 1 140px}" +
".pf-b{min-height:48px;border:0;border-radius:14px;font:inherit;font-weight:800;cursor:pointer;color:#fff;background:linear-gradient(135deg,#7C5CFF,#22D3EE)}" +
".pf-b.gh{background:#1A2042;color:#DDE3FF}.pf-b.red{background:linear-gradient(135deg,#DC2626,#F43F5E)}.pf-b[disabled]{opacity:.45;cursor:not-allowed}" +
".pf-err{color:#FCA5A5;font-size:.82rem;min-height:1.2em;margin-top:6px}" +
".pf-dg{border:2px solid #EF4444;background:#1A0A10}.pf-dg .pf-k{color:#FCA5A5}.pf-dg h2{color:#FECACA}" +
".pf-av{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;font-family:var(--f-t,system-ui);font-size:1.6rem;font-weight:800;background:linear-gradient(135deg,#7C5CFF,#22D3EE);margin-bottom:8px}" +
".pf-steps{display:flex;gap:6px;margin:4px 0 14px}.pf-steps i{flex:1;height:4px;border-radius:99px;background:#2A3160}.pf-steps i.on{background:linear-gradient(90deg,#7C5CFF,#22D3EE)}" +
".pf-note{font-size:.72rem;color:#7C86B0;margin-top:10px;line-height:1.35}";
function css() { if ($("#pf-css")) return; var s = document.createElement("style"); s.id = "pf-css"; s.textContent = CSS; document.head.appendChild(s); }
function overlay(html, danger) { css(); var o = document.createElement("div"); o.className = "pf-ov" + (danger ? " dg" : ""); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.innerHTML = html; document.body.appendChild(o); var f = o.querySelector("input"); if (f) setTimeout(function () { f.focus(); }, 300); return o; }

function onboard(done, edit) {
  var p = get() || {}, step = 0;
  var o = overlay('<form class="pf-box" novalidate><div class="pf-k">' + (edit ? "Mon profil" : "Bienvenue dans Mes Cours IRT") + '</div><div class="pf-steps"><i class="on"></i><i></i></div><div data-s></div><div class="pf-err" data-err></div><div class="pf-row" data-btns></div></form>');
  var box = $("[data-s]", o), err = $("[data-err]", o), btns = $("[data-btns]", o);
  function s0() {
    box.innerHTML = '<h2>' + (edit ? "Tes informations" : "Créons ton profil d’étudiant") + '</h2><p>Il personnalise l’app, ta vitrine de réalisations et protège ta progression.</p><div class="pf-g"><div class="pf-g2"><label class="pf-f">Prénom<input name="prenom" maxlength="30" autocomplete="given-name" value="' + esc(p.prenom) + '"></label><label class="pf-f">Nom<input name="nom" maxlength="30" autocomplete="family-name" value="' + esc(p.nom) + '"></label></div>' +
      '<label class="pf-f">École<input name="ecole" maxlength="60" value="' + esc(p.ecole || "ESGIS Bénin") + '"></label><div class="pf-g2"><label class="pf-f">Classe<input name="classe" maxlength="30" value="' + esc(p.classe || "L2 IRT") + '"></label><label class="pf-f">Option<select name="option">' +
      ["Architecture Logicielle (AL)", "Sécurité Informatique (SI)", "Systèmes, Réseaux et Cloud (SRC)", "Pas encore choisie"].map(function (x) { return "<option" + ((p.option || "Architecture Logicielle (AL)") === x ? " selected" : "") + ">" + x + "</option>"; }).join("") + '</select></label></div>' +
      '<div class="pf-g2"><label class="pf-f">Rentrée en L2<select name="rentree">' + [2024, 2025, 2026, 2027, 2028].map(function (y) { return '<option value="' + y + '"' + (String(p.rentree || 2026) === String(y) ? " selected" : "") + ">Sept. " + y + "</option>"; }).join("") + '</select></label>' +
      '<label class="pf-f">Ton objectif<input name="objectif" maxlength="60" value="' + esc(p.objectif || "Ingénieur IA") + '"></label></div></div>';
    btns.innerHTML = (edit ? '<button type="button" class="pf-b gh" data-x>Annuler</button>' : "") + '<button class="pf-b">Continuer</button>';
  }
  function s1() {
    o.querySelectorAll(".pf-steps i")[1].classList.add("on");
    box.innerHTML = '<h2>' + (edit && p.hash ? "Changer de mot de passe" : "Ton mot de passe") + '</h2><p>Il sera demandé avant toute action dangereuse (effacer ta progression, importer par-dessus). 4 caractères minimum.</p><div class="pf-g">' +
      (edit && p.hash ? '<label class="pf-f">Mot de passe actuel<input type="password" name="old" autocomplete="current-password"></label>' : "") +
      '<label class="pf-f">' + (edit && p.hash ? "Nouveau mot de passe (vide = inchangé)" : "Mot de passe") + '<input type="password" name="p1" autocomplete="new-password"></label><label class="pf-f">Confirmation<input type="password" name="p2" autocomplete="new-password"></label></div><p class="pf-note">Stocké sur cet appareil sous forme chiffrée (empreinte SHA-256). Si tu l’oublies, il faudra effacer les données du navigateur : note-le dans un endroit sûr.</p>';
    btns.innerHTML = '<button type="button" class="pf-b gh" data-back>Retour</button><button class="pf-b">' + (edit ? "Enregistrer" : "Créer mon profil") + '</button>';
  }
  s0();
  o.addEventListener("click", function (e) { if (e.target.closest("[data-x]")) { o.remove(); } if (e.target.closest("[data-back]")) { step = 0; err.textContent = ""; s0(); } });
  $("form", o).addEventListener("submit", function (e) {
    e.preventDefault(); err.textContent = ""; var f = e.target;
    if (step === 0) {
      var pr = f.prenom.value.trim(); if (!pr) { err.textContent = "Écris au moins ton prénom."; sfx("danger"); return; }
      ["prenom", "nom", "ecole", "classe", "option", "rentree", "objectif"].forEach(function (k) { p[k] = f[k].value.trim(); });
      step = 1; s1(); sfx("nav"); return;
    }
    var p1 = f.p1.value, p2 = f.p2.value, keep = edit && p.hash && !p1;
    if (!keep && p1.length < 4) { err.textContent = "4 caractères minimum."; sfx("danger"); return; }
    if (!keep && p1 !== p2) { err.textContent = "Les deux mots de passe ne correspondent pas."; sfx("danger"); return; }
    var chk = edit && p.hash ? verify(f.old.value) : Promise.resolve(true);
    chk.then(function (ok) {
      if (!ok) { err.textContent = "Mot de passe actuel incorrect."; sfx("danger"); return; }
      var fin = function () { p.cree = p.cree || new Date().toISOString(); save(KEY, p); var pl = load(PK, {}); pl.name = p.prenom; save(PK, pl); sfx("success"); o.remove(); if (done) done(p); };
      if (keep) return fin();
      p.salt = newSalt(); hash(p1, p.salt).then(function (h) { p.hash = h; fin(); });
    });
  });
}

/* Zone rouge : mot de passe + mot de confirmation tapé en entier */
function guard(o, onOk) {
  var p = get();
  if (!p || !p.hash) { onboard(function () { guard(o, onOk); }); return; }
  sfx("danger");
  var ov = overlay('<form class="pf-box pf-dg" novalidate><div class="pf-k">⚠ Zone rouge · action irréversible</div><h2>' + esc(o.title) + '</h2><p>' + esc(o.text) + '</p><div class="pf-g"><label class="pf-f">Ton mot de passe<input type="password" name="pw" autocomplete="current-password"></label><label class="pf-f">Tape « ' + esc(o.word || "EFFACER") + ' » pour confirmer<input name="w" autocomplete="off" autocapitalize="characters"></label></div><div class="pf-err" data-err></div><div class="pf-row"><button type="button" class="pf-b gh" data-x>Annuler</button><button class="pf-b red" data-go disabled>' + esc(o.btn || "Effacer définitivement") + '</button></div></form>', true);
  var f = $("form", ov), go = $("[data-go]", ov), err = $("[data-err]", ov), tries = 0;
  f.addEventListener("input", function () { go.disabled = !(f.pw.value && f.w.value.trim().toUpperCase() === (o.word || "EFFACER")); });
  ov.addEventListener("click", function (e) { if (e.target.closest("[data-x]")) ov.remove(); });
  f.addEventListener("submit", function (e) {
    e.preventDefault(); if (go.disabled) return;
    verify(f.pw.value).then(function (ok) {
      if (!ok) { tries++; err.textContent = "Mot de passe incorrect" + (tries >= 3 ? " (3 essais : réessaie plus tard)." : "."); sfx("danger"); f.pw.value = ""; go.disabled = true; if (tries >= 3) setTimeout(function () { ov.remove(); }, 1200); return; }
      ov.remove(); onOk();
    });
  });
}

// Protège les boutons d'effacement du QG et des guides (avant leur propre gestionnaire)
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-wipe], [data-reset]");
  if (!b || b.dataset.auth) return;
  e.preventDefault(); e.stopImmediatePropagation();
  var wipe = b.hasAttribute("data-wipe");
  guard({ title: wipe ? "Tout effacer ?" : "Remettre cette matière à zéro ?", text: wipe ? "Progression, XP et badges de TOUTES les matières seront supprimés de cet appareil. C’est définitif." : "Toute ta progression dans cette matière sera supprimée. C’est définitif." },
    function () { b.dataset.auth = 1; b.dataset.armed = 1; b.click(); });
}, true);

function initials(p) { return ((p.prenom || "?")[0] + ((p.nom || "")[0] || "")).toUpperCase(); }
window.PROFIL = { get: get, onboard: onboard, guard: guard, verify: verify, initials: initials, sfx: sfx, audioReady: audioReady, esc: esc, vitesse: vitesse, lent: lent, ralentirTout: ralentirTout };
})();
