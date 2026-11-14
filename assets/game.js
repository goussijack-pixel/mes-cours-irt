/* ===== GAME : XP, niveaux, séries, badges, récompenses, menu, réglages ===== */
(function () {
"use strict";
var G = window.G || {};
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var ic = function (id) { return '<svg class="i" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
function loadJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? Object.assign(d, v) : d; } catch (e) { return d; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
var PK = "rev:player", GK = "rev:global";
var PL = loadJSON(PK, { name: "", days: {}, badges: {}, goal: 120, streak: 0, lastDay: "", best: 0, perfect: 0, opened: {} });
var P = loadJSON(GK, { theme: "auto", fs: "m", motion: "full", snd: true, vib: true });
function today(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function motion() { return document.documentElement.dataset.motion || "full"; }

/* ---------- Niveaux ---------- */
function need(n) { return 75 * n * (n - 1); }              // XP totale pour atteindre le niveau n
function levelOf(xp) { var n = 1; while (need(n + 1) <= xp) n++; return { n: n, cur: xp - need(n), span: need(n + 1) - need(n), pct: Math.round((xp - need(n)) / (need(n + 1) - need(n)) * 100) }; }
function totalXP() { var t = 0; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("rev:meta:") === 0) { try { t += JSON.parse(localStorage.getItem(k)).xp || 0; } catch (e) {} } } return t; }
function courseXP(S) {
  var xp = 0; (G.eps || []).forEach(function (e) { if (S.ep[e.id] === "ok") xp += e.xp || 100; });
  xp += (S.ch || []).length * 40; xp += (S.quizPts || 0) * 10; return xp;
}
function rankOf(xp) { var max = G.xpMax || 1, p = xp / max, th = [0, .1, .3, .55, .8], r = 0; th.forEach(function (t, i) { if (p >= t) r = i; }); return { i: r, name: (G.ranks || [])[r] || "", next: (G.ranks || [])[r + 1] || "", nextXp: r < 4 ? Math.ceil(th[r + 1] * max) : max }; }

/* ---------- Sons (synthèse, aucun fichier) ---------- */
var AC = null;
function tone(f, t0, d, type, vol) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.type = type || "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, AC.currentTime + t0); g.gain.linearRampToValueAtTime(vol || .12, AC.currentTime + t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + t0 + d); o.connect(g); g.connect(AC.destination); o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + d + .05); } catch (e) {} }
function sfx(kind) { if (!P.snd) return;
  if (kind === "ok") { tone(660, 0, .12, "triangle"); tone(990, .08, .18, "triangle"); }
  else if (kind === "no") { tone(220, 0, .18, "sawtooth", .06); tone(170, .1, .22, "sawtooth", .06); }
  else if (kind === "win") { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, i * .09, .35, "triangle", .1); }); }
  else if (kind === "lvl") { [392, 523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, i * .07, .5, "square", .05); tone(f / 2, i * .07, .5, "triangle", .06); }); }
  else if (kind === "tap") tone(1200, 0, .04, "sine", .04);
}
function vib(p) { if (!P.vib) return; try { navigator.vibrate && navigator.vibrate(p || 10); } catch (e) {} }

/* ---------- Effets ---------- */
function sparks(x, y, n) { if (motion() === "off") return; var cols = [getComputedStyle(document.body).getPropertyValue("--acc"), getComputedStyle(document.body).getPropertyValue("--acc2"), "#fff"];
  for (var i = 0; i < (n || 26); i++) { var s = document.createElement("i"), a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 140; s.className = "spark"; s.style.left = x + "px"; s.style.top = y + "px"; s.style.background = cols[i % 3]; s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d + "px"); document.body.appendChild(s); setTimeout(function (s) { return function () { s.remove(); }; }(s), 1200); } }
function floatXP(n, el) { var r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 }; var f = document.createElement("div"); f.className = "xpfloat"; f.textContent = "+" + n + " XP"; f.style.left = (r.left + r.width / 2 - 30) + "px"; f.style.top = (r.top - 6) + "px"; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1300); }
function countUp(el, to, ms) { var from = +el.dataset.cv || 0; el.dataset.cv = to; if (motion() === "off" || from === to) { el.textContent = to.toLocaleString("fr-FR"); return; } var t0 = performance.now(); (function f(t) { var k = Math.min(1, (t - t0) / (ms || 1100)), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString("fr-FR"); if (k < 1) requestAnimationFrame(f); })(t0); }

var RQ = [];
function reward(o) {
  if ($(".reward")) { RQ.push(o); return; }
  var d = document.createElement("div"); d.className = "reward"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", o.title);
  d.innerHTML = '<div class="rays"></div><div class="box"><div class="medal"><div>' + ic(o.icon || "i-trophy") + '</div></div><div class="k">' + esc(o.kicker || "Mission accomplie") + "</div><h2>" + esc(o.title) + "</h2>" + (o.xp ? '<div class="gain">+<span data-c>0</span> XP</div>' : "") + "<p>" + esc(o.text || "") + '</p><button class="btn red" data-rclose>' + esc(o.btn || "Continuer") + ic("i-next") + "</button></div>";
  document.body.appendChild(d); sfx(o.snd || "win"); vib([20, 40, 60]);
  var c = $("[data-c]", d); if (c) setTimeout(function () { countUp(c, o.xp, 900); }, 450);
  setTimeout(function () { var m = $(".medal", d).getBoundingClientRect(); sparks(m.left + m.width / 2, m.top + m.height / 2, 40); }, 380);
  d.addEventListener("click", function (e) { if (e.target.closest("[data-rclose]") || e.target === d) { d.remove(); if (o.then) o.then(); if (RQ.length) setTimeout(function () { reward(RQ.shift()); }, 250); } });
}

/* ---------- Badges ---------- */
var BADGES = [
  ["first", "i-flag", "Premier pas", "1 épreuve maîtrisée"], ["five", "i-medal", "Sur la lancée", "5 épreuves maîtrisées"], ["twenty", "i-trophy", "Machine à corriger", "20 épreuves maîtrisées"],
  ["fifty", "i-crown", "Légende de la L2", "50 épreuves maîtrisées"], ["quizp", "i-star", "Sans faute", "Un quiz à 100 %"], ["s3", "i-flame", "En feu", "3 jours d’affilée"],
  ["s7", "i-flame", "Inarrêtable", "7 jours d’affilée"], ["poly", "i-layers", "Polyvalent", "3 matières commencées"], ["explo", "i-rocket", "Explorateur", "10 matières ouvertes"],
  ["early", "i-sun", "Lève-tôt", "Réviser avant 7 h"], ["night", "i-moon", "Oiseau de nuit", "Réviser après 23 h"], ["full", "i-sparkle", "Matière bouclée", "100 % dans une matière"],
  ["goal", "i-target", "Objectif atteint", "Objectif du jour rempli"], ["lvl5", "i-bolt", "Niveau 5", "Atteindre le niveau 5"]];
function allMeta() { var r = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("rev:meta:") === 0) { try { r.push(JSON.parse(localStorage.getItem(k))); } catch (e) {} } } return r; }
function checkBadges() {
  var M = allMeta(), done = 0, started = 0, full = false; M.forEach(function (m) { done += m.done || 0; if ((m.xp || 0) > 0) started++; if (m.pct >= 100) full = true; });
  var h = new Date().getHours(), xp = totalXP(), cond = { first: done >= 1, five: done >= 5, twenty: done >= 20, fifty: done >= 50, quizp: PL.perfect > 0, s3: PL.streak >= 3, s7: PL.streak >= 7, poly: started >= 3,
    explo: Object.keys(PL.opened || {}).length >= 10, early: h < 7 && PL.days[today()] > 0, night: h >= 23 && PL.days[today()] > 0, full: full, goal: (PL.days[today()] || 0) >= PL.goal, lvl5: levelOf(xp).n >= 5 };
  var fresh = []; BADGES.forEach(function (b) { if (cond[b[0]] && !PL.badges[b[0]]) { PL.badges[b[0]] = Date.now(); fresh.push(b); } });
  saveJSON(PK, PL); return fresh;
}
function badgesHTML() { return '<div class="badges">' + BADGES.map(function (b) { var on = PL.badges[b[0]]; return '<div class="bdg' + (on ? " on" : "") + '"><div class="bi">' + ic(on ? b[1] : "i-lock") + "</div><b>" + b[2] + "</b><small>" + b[3] + "</small></div>"; }).join("") + "</div>"; }

/* ---------- Gain d'XP (appelé quand la progression change) ---------- */
function gain(delta, el) {
  if (delta <= 0) return;
  var d = today(); var before = levelOf(totalXP() - delta);
  if (PL.lastDay !== d) { var y = new Date(); y.setDate(y.getDate() - 1); PL.streak = PL.lastDay === today(y) ? (PL.streak || 0) + 1 : 1; PL.lastDay = d; PL.best = Math.max(PL.best || 0, PL.streak); }
  PL.days[d] = (PL.days[d] || 0) + delta; saveJSON(PK, PL);
  floatXP(delta, el); sfx("ok");
  var after = levelOf(totalXP()); paintChrome();
  var fresh = checkBadges();
  setTimeout(function () {
    if (after.n > before.n) reward({ kicker: "Niveau supérieur", title: "Niveau " + after.n, icon: "i-bolt", text: "Tu passes au niveau " + after.n + ". Continue comme ça !", snd: "lvl", btn: "Génial" });
    else if (fresh.length) reward({ kicker: "Badge débloqué", title: fresh[0][2], icon: fresh[0][1], text: fresh[0][3], btn: "Super" });
  }, 700);
}

/* ---------- Habillage : puce XP, carte joueur ---------- */
function paintChrome() {
  var xp = totalXP(), L = levelOf(xp);
  $$("[data-lv]").forEach(function (el) { el.textContent = L.n; });
  $$(".xpchip").forEach(function (el) { el.style.setProperty("--p", L.pct); });
  $$("[data-xptot]").forEach(function (el) { countUp(el, xp); });
  $$("[data-streak]").forEach(function (el) { el.textContent = PL.lastDay === today() || PL.lastDay === today(new Date(Date.now() - 864e5)) ? (PL.streak || 0) : 0; });
  $$("[data-goalbar]").forEach(function (el) { el.style.width = Math.min(100, Math.round((PL.days[today()] || 0) / PL.goal * 100)) + "%"; });
  $$("[data-goaltxt]").forEach(function (el) { el.textContent = (PL.days[today()] || 0) + " / " + PL.goal + " XP"; });
  $$("[data-pname]").forEach(function (el) { el.textContent = PL.name || "Champion"; });
  $$("[data-lvlbar]").forEach(function (el) { el.style.width = L.pct + "%"; });
  $$("[data-lvltxt]").forEach(function (el) { el.textContent = L.cur + " / " + L.span + " XP vers le niveau " + (L.n + 1); });
  $$("[data-badges]").forEach(function (el) { el.innerHTML = badgesHTML(); });
  $$("[data-bcount]").forEach(function (el) { el.textContent = Object.keys(PL.badges).length + " / " + BADGES.length; });
}
function paintCourse(S) {
  var xp = courseXP(S), R = rankOf(xp), max = G.xpMax || 1;
  var fg = $(".ring2 .fg"); if (fg) { var C = 2 * Math.PI * 42; fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C * (1 - Math.min(1, xp / max)); }
  $$("[data-cxp]").forEach(function (el) { countUp(el, xp); });
  $$("[data-cpct]").forEach(function (el) { countUp(el, Math.round(xp / max * 100)); });
  $$("[data-rank]").forEach(function (el) { el.textContent = R.name; });
  $$("[data-rnext]").forEach(function (el) { el.textContent = R.i < 4 ? (R.nextXp - xp) + " XP pour devenir « " + R.next + " »" : "Grade maximal atteint !"; });
  $$(".ranks span").forEach(function (sp, i) { sp.classList.toggle("on", i <= R.i); });
  $$("[data-cbar]").forEach(function (el) { el.style.width = Math.min(100, xp / max * 100) + "%"; });
  (G.eps || []).forEach(function (e) { var a = $('.ep[data-id="' + e.id + '"]'); if (a) a.classList.toggle("won", S.ep[e.id] === "ok"); });
  return xp;
}

/* ---------- Menu tiroir ---------- */
function drawer(open) {
  var dr = $(".drawer"), sc = $(".scrim"); if (!dr) return;
  if (open === undefined) open = !dr.classList.contains("on");
  dr.classList.toggle("on", open); sc.classList.toggle("on", open); dr.setAttribute("aria-hidden", !open);
  if (open) { $$(".dl[data-pct]", dr).forEach(function (a) { var m = loadJSON("rev:meta:" + a.dataset.pct, {}); var s = $(".pc", a); if (s) s.textContent = (m.pct || 0) + " %"; }); }
}

/* ---------- Réglages ---------- */
function seg(name, cur, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-set="' + name + '" data-val="' + o[0] + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + o[1] + "</button>"; }).join("") + "</div>"; }
function sw(name, on) { return '<button class="sw" role="switch" data-sw="' + name + '" aria-checked="' + !!on + '" aria-label="' + name + '"></button>'; }
function settingsHTML(withCourse) {
  var pr = window.PROFIL && PROFIL.get();
  return '<div class="setc"><h3>Profil</h3>' + (pr ? '<div class="set" style="padding:12px 0"><div class="lab"><span class="pf-mini">' + esc(PROFIL.initials(pr)) + '</span><span>' + esc((pr.prenom || "") + " " + (pr.nom || "")) + '<small>' + esc([pr.classe, pr.option, pr.ecole].filter(Boolean).join(" · ")) + '</small></span></div><button class="btn gh sm" data-profil-edit>' + ic("i-pen") + 'Modifier</button></div>' : "") + '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-user") + '<span>Ton pseudo<small>Affiché sur ta carte de joueur</small></span></div><input class="inp" data-pname-in maxlength="24" placeholder="Ex. Leroi" value="' + esc(PL.name || "") + '"></div>' +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-target") + "<span>Objectif quotidien<small>XP à gagner chaque jour</small></span></div>" + seg("goal", PL.goal, [[60, "Cool · 60"], [120, "Sérieux · 120"], [250, "Intense · 250"]]) + "</div></div>" +
    '<div class="setc"><h3>Affichage</h3><div class="set" style="padding:12px 0"><div class="lab">' + ic("i-palette") + "<span>Ambiance<small>« Univers » = le design propre à chaque matière</small></span></div>" + seg("theme", P.theme, [["auto", "Univers"], ["light", "Clair"], ["dark", "Sombre"]]) + "</div>" +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-text") + "<span>Taille du texte</span></div>" + seg("fs", P.fs, [["s", "Petit"], ["m", "Normal"], ["l", "Grand"]]) + "</div>" +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-wave") + "<span>Animations<small>« Légères » économise la batterie</small></span></div>" + seg("motion", P.motion, [["full", "Complètes"], ["lite", "Légères"], ["off", "Aucune"]]) + "</div>" +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-clock") + "<span>Vitesse des animations<small>« Posée » = fluide et lente, pour profiter de chaque effet</small></span></div>" + seg("speed", P.speed || "posee", [["posee", "Posée"], ["normale", "Normale"], ["vive", "Vive"]]) + "</div>" +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-sparkle") + "<span>Messages de motivation<small>Une notification d’encouragement de temps en temps</small></span></div>" + sw("motiv", P.motiv !== false) + "</div></div>" +
    '<div class="setc"><h3>Sensations</h3><div class="set" style="padding:12px 0"><div class="lab">' + ic(P.snd ? "i-sound" : "i-mute") + "<span>Sons de jeu<small>Bonne réponse, mission, niveau</small></span></div>" + sw("snd", P.snd) + "</div>" +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-vibrate") + "<span>Vibrations<small>Sur téléphone</small></span></div>" + sw("vib", P.vib) + "</div></div>" +
    '<div class="setc sync"><h3>Synchroniser mes appareils</h3>' +
    '<p class="synhint">Ta progression (cours, notes, moyenne, Auto-IA, profil) reste sur cet appareil. Pour la retrouver ailleurs : <b>1.</b> ici, touche « Créer mon code » ; <b>2.</b> envoie-le-toi (WhatsApp, mail…) ; <b>3.</b> sur l’autre appareil, colle-le dans « Recevoir ».</p>' +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-upload") + "<span>Envoyer cette progression<small data-synfo>Code texte compressé, à coller sur l’autre appareil</small></span></div><button class=\"btn sm\" data-syncmake>" + ic("i-copy") + "Créer mon code</button></div>" +
    '<div class="synbox" data-synbox hidden><textarea readonly data-syncout rows="3"></textarea><div class="synrow"><button class="btn gh sm" data-synccopy>' + ic("i-copy") + 'Copier</button><button class="btn gh sm" data-syncshare>' + ic("i-upload") + 'Partager</button><button class="btn gh sm" data-export>' + ic("i-download") + 'Fichier .json</button></div></div>' +
    '<div class="set" style="padding:12px 0 6px"><div class="lab">' + ic("i-download") + "<span>Recevoir une progression<small>Colle le code reçu, ou choisis le fichier .json</small></span></div><label class=\"btn gh sm\">" + ic("i-file") + 'Fichier<input type="file" accept="application/json,.json,.txt" data-import hidden></label></div>' +
    '<textarea data-syncin rows="2" placeholder="Colle ici le code qui commence par IRT…"></textarea><button class="btn sm wide" data-syncload>' + ic("i-check") + 'Remplacer par ce code</button>' +
    '<p class="synhint" data-synmsg></p>' +
    (hasBackup() ? '<div class="set" style="padding:10px 0"><div class="lab">' + ic("i-retry") + "<span>Annuler la dernière réception<small>Revenir à la progression d’avant</small></span></div><button class=\"btn gh sm\" data-syncundo>" + ic("i-retry") + "Annuler</button></div>" : "") +
    '</div><div class="setc"><h3>Remise à zéro</h3>' +
    (withCourse ? '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-retry") + "<span>Remettre cette matière à zéro</span></div><button class=\"btn gh sm\" data-reset style=\"color:var(--red)\">" + ic("i-retry") + "Réinitialiser</button></div>" : "") +
    '<div class="set" style="padding:12px 0"><div class="lab">' + ic("i-trash") + "<span>Tout effacer<small>Progression, XP et badges de toutes les matières</small></span></div><button class=\"btn gh sm\" data-wipe style=\"color:var(--red)\">" + ic("i-trash") + "Tout effacer</button></div></div>" +
    '<div class="setc"><h3>À propos</h3><p style="padding:6px 0 14px;color:var(--ink2);font-size:.9em">Mes Cours IRT · L2 ESGIS. Fonctionne sans Internet une fois installé. Les corrigés sont des propositions détaillées : en cas de doute, la parole de ton enseignant prime.</p></div>';
}
function applyP() {
  var h = document.documentElement, t = P.theme === "auto" ? (h.dataset.native || "dark") : P.theme;
  h.dataset.theme = t; h.dataset.fs = P.fs; h.dataset.motion = P.motion;
  try { var m = $('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(document.body).getPropertyValue("--paper").trim(); } catch (e) {}
  var b = $("[data-theme-btn]"); if (b) b.innerHTML = ic(t === "dark" ? "i-sun" : "i-moon");
  try { window.dispatchEvent(new Event("themechange")); } catch (e) {}
}
/* ---------- Synchronisation : tout ce qui commence par rev: (sauf la copie de secours) ---------- */
var BK = "rev~backup";
function hasBackup() { try { return !!localStorage.getItem(BK); } catch (e) { return false; } }
function snapshot() { var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("rev:") === 0) o[k] = localStorage.getItem(k); } return o; }
function payload() { return JSON.stringify({ app: "mes-cours-irt", v: 2, at: new Date().toISOString(), from: /Android|iPhone/i.test(navigator.userAgent) ? "téléphone" : "ordinateur", data: snapshot() }); }
function b64(bytes) { var s = "", i; for (i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(s); }
function unb64(t) { var s = atob(t), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function pipe(bytes, Stream) { return new Response(new Blob([bytes]).stream().pipeThrough(new Stream("gzip"))).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
function makeCode() { var raw = new TextEncoder().encode(payload());
  if (window.CompressionStream) return pipe(raw, CompressionStream).then(function (z) { return "IRT2." + b64(z); }).catch(function () { return "IRT1." + b64(raw); });
  return Promise.resolve("IRT1." + b64(raw)); }
function readCode(code) { code = (code || "").replace(/\s+/g, "");
  return Promise.resolve().then(function () {
    if (code.indexOf("IRT2.") === 0) { if (!window.DecompressionStream) throw new Error("navigateur"); return pipe(unb64(code.slice(5)), DecompressionStream).then(function (u) { return new TextDecoder().decode(u); }); }
    if (code.indexOf("IRT1.") === 0) return new TextDecoder().decode(unb64(code.slice(5)));
    if (code.charAt(0) === "{") return code;
    throw new Error("format"); }).then(function (t) { var j = JSON.parse(t); if (!j || j.app !== "mes-cours-irt" || !j.data) throw new Error("format"); return j; }); }
function replaceAll(o) { Object.keys(localStorage).filter(function (k) { return k.indexOf("rev:") === 0; }).forEach(function (k) { localStorage.removeItem(k); });
  Object.keys(o).forEach(function (k) { if (k.indexOf("rev:") === 0 && typeof o[k] === "string") localStorage.setItem(k, o[k]); }); }
function applyImport(j) { var before = snapshot(); try { localStorage.setItem(BK, JSON.stringify(before)); } catch (e) {}
  try { replaceAll(j.data); }
  catch (e) { try { replaceAll(before); } catch (e2) {} throw new Error("stockage"); } }   // stockage plein : on remet l'ancienne progression
function undoImport() { try { var o = JSON.parse(localStorage.getItem(BK)); Object.keys(localStorage).filter(function (k) { return k.indexOf("rev:") === 0; }).forEach(function (k) { localStorage.removeItem(k); }); Object.keys(o).forEach(function (k) { localStorage.setItem(k, o[k]); }); localStorage.removeItem(BK); return true; } catch (e) { return false; } }
function when(iso) { try { var d = new Date(iso); return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return "?"; } }
function synMsg(t, bad) { var m = $("[data-synmsg]"); if (m) { m.textContent = t; m.style.color = bad ? "var(--red)" : "var(--green, #2bb673)"; } }
function exportData() { try { saveFile(); } catch (e) { synMsg("Impossible de créer le fichier ici : utilise plutôt « Créer mon code ».", true); } }
function saveFile() {
  var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([payload()], { type: "application/json" }));
  a.download = "progression-mes-cours-irt-" + today() + ".json"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function importData(file, done) {
  var r = new FileReader(); r.onload = function () { readCode(String(r.result).trim()).then(function (j) { applyImport(j); done(true); }).catch(function () { done(false); }); };
  r.onerror = function () { done(false); }; r.readAsText(file);
}
function confirmImport(j) { var n = Object.keys(j.data).length; return confirm("Progression créée le " + when(j.at) + " sur ton " + (j.from || "autre appareil") + " (" + n + " éléments).\n\nElle va REMPLACER la progression de cet appareil. Une copie de secours est gardée : tu pourras annuler.\n\nContinuer ?"); }

/* ---------- Texte qui apparaît mot à mot, révélations, ripple, tilt ---------- */
function split() { $$(".split:not([data-done])").forEach(function (el) { el.dataset.done = 1; var words = el.textContent.split(/(\s+)/); el.innerHTML = words.map(function (w, i) { return /^\s+$/.test(w) ? w : '<span class="w" style="animation-delay:' + (.15 + i * .04) + 's">' + esc(w) + "</span>"; }).join(""); }); }
var rio = null;
function reveal(root) { var els = $$(".md>*:not(.rv2), .eplist>li, .chl>li, .tiles .tile, .grid>li", root || document).filter(function (e) { return !e.classList.contains("rv2"); });
  if (motion() === "off" || !("IntersectionObserver" in window)) return; rio = rio || new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
  els.forEach(function (e, i) { var r = e.getBoundingClientRect(); if (r.top < innerHeight) return; e.classList.add("rv2"); rio.observe(e); }); }
document.addEventListener("pointerdown", function (e) { var b = e.target.closest(".btn, .opt, .fchip"); if (!b || motion() === "off") return; var r = b.getBoundingClientRect(), s = document.createElement("span"), d = Math.max(r.width, r.height); s.className = "rip"; s.style.width = s.style.height = d + "px"; s.style.left = (e.clientX - r.left - d / 2) + "px"; s.style.top = (e.clientY - r.top - d / 2) + "px"; if (getComputedStyle(b).position === "static") b.style.position = "relative"; b.style.overflow = "hidden"; b.appendChild(s); setTimeout(function () { s.remove(); }, 650); }, { passive: true });
if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  document.addEventListener("pointermove", function (e) { var c = e.target.closest(".cc, .tile"); if (!c || motion() !== "full") return; var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = "perspective(800px) rotateX(" + (-y * 5) + "deg) rotateY(" + (x * 6) + "deg) translateY(-3px)"; c.style.setProperty("--mx", (x + .5) * 100 + "%"); c.style.setProperty("--my", (y + .5) * 100 + "%"); }, { passive: true });
  document.addEventListener("pointerout", function (e) { var c = e.target.closest(".cc, .tile"); if (c && !c.contains(e.relatedTarget)) c.style.transform = ""; }, { passive: true });
}

/* ---------- Clics communs ---------- */
document.addEventListener("click", function (e) {
  var t = e.target;
  if (t.closest("[data-menu]")) { drawer(); sfx("tap"); return; }
  if (t.closest(".scrim") || t.closest("[data-dclose]")) { drawer(false); return; }
  if (t.closest(".drawer a")) { drawer(false); }
  var s = t.closest("[data-set]"); if (s) { var n = s.dataset.set, v = s.dataset.val; if (n === "goal") { PL.goal = +v; saveJSON(PK, PL); } else { P[n] = v; saveJSON(GK, P); applyP(); } $$('[data-set="' + n + '"]').forEach(function (b) { b.setAttribute("aria-pressed", b === s); }); paintChrome(); sfx("tap"); return; }
  var w = t.closest("[data-sw]"); if (w) { var k = w.dataset.sw; P[k] = k === "motiv" ? P[k] === false : !P[k]; saveJSON(GK, P); w.setAttribute("aria-checked", P[k]); if (k === "snd" && P.snd) sfx("ok"); if (k === "vib") vib(30); return; }
  if (t.closest("[data-export]")) { exportData(); return; }
  if (t.closest("[data-syncmake]")) { var mk = t.closest("[data-syncmake]"); mk.disabled = true; makeCode().then(function (c) { var o = $("[data-syncout]"); o.value = c; $("[data-synbox]").hidden = false; o.select(); var f = $("[data-synfo]"); if (f) f.textContent = "Code prêt (" + Math.ceil(c.length / 1024) + " Ko) : copie-le ou partage-le"; mk.disabled = false; sfx("ok"); }); return; }
  if (t.closest("[data-synccopy]")) { var o2 = $("[data-syncout]"); (navigator.clipboard ? navigator.clipboard.writeText(o2.value) : Promise.reject()).then(function () { synMsg("✓ Code copié. Colle-le dans un message à toi-même (WhatsApp, mail…)."); }, function () { o2.select(); try { document.execCommand("copy"); synMsg("✓ Code copié."); } catch (er) { synMsg("Sélectionne le code et copie-le à la main.", true); } }); return; }
  if (t.closest("[data-syncshare]")) { var c2 = $("[data-syncout]").value; if (navigator.share) navigator.share({ title: "Ma progression Mes Cours IRT", text: c2 }).catch(function () {}); else synMsg("Le partage direct n’existe pas ici : utilise « Copier ».", true); return; }
  if (t.closest("[data-syncload]")) { var v = ($("[data-syncin]") || {}).value; if (!v || !v.trim()) { synMsg("Colle d’abord le code reçu dans la case.", true); return; } readCode(v).then(function (j) { if (!confirmImport(j)) return; applyImport(j); synMsg("✓ Progression reçue. Rechargement…"); setTimeout(function () { location.reload(); }, 700); }, function (er) { synMsg(er && er.message === "stockage" ? "Mémoire de l’appareil pleine : rien n’a été changé. Libère de la place puis réessaie." : er && er.message === "navigateur" ? "Ce navigateur est trop ancien pour lire ce code : envoie plutôt le fichier .json." : "Code incomplet ou invalide : vérifie qu’il a été copié en entier.", true); }); return; }
  if (t.closest("[data-syncundo]")) { if (confirm("Revenir à la progression d’avant la dernière réception ?") && undoImport()) location.reload(); return; }
  if (t.closest("[data-profil-edit]") && window.PROFIL) { PROFIL.onboard(function () { location.reload(); }, true); return; }
  var wp = t.closest("[data-wipe]"); if (wp) { if (wp.dataset.armed) { Object.keys(localStorage).filter(function (k) { return k.indexOf("rev:") === 0 && k !== GK && k !== "rev:profil"; }).forEach(function (k) { localStorage.removeItem(k); }); location.reload(); } else { wp.dataset.armed = 1; wp.textContent = "Appuie encore pour tout effacer"; } return; }
});
document.addEventListener("change", function (e) { if (e.target.matches("[data-import]") && e.target.files[0]) { if (!confirm("Ce fichier va remplacer la progression de cet appareil (une copie de secours est gardée). Continuer ?")) { e.target.value = ""; return; } importData(e.target.files[0], function (ok) { if (ok) location.reload(); else alert("Fichier invalide : choisis un export de Mes Cours IRT."); }); } });
document.addEventListener("input", function (e) { if (e.target.matches("[data-pname-in]")) { PL.name = e.target.value.trim().slice(0, 24); saveJSON(PK, PL); paintChrome(); } });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") { drawer(false); RQ = []; $$(".reward").forEach(function (x) { x.remove(); }); } });
window.addEventListener("storage", function (e) { if (e.key === PK) { PL = loadJSON(PK, PL); paintChrome(); } if (e.key === GK) { P = loadJSON(GK, P); applyP(); } });

if (G.slug) { PL.opened = PL.opened || {}; PL.opened[G.slug] = 1; saveJSON(PK, PL); }
window.GAME = { P: P, PL: PL, gain: gain, reward: reward, sfx: sfx, vib: vib, paintChrome: paintChrome, paintCourse: paintCourse, courseXP: courseXP, levelOf: levelOf, totalXP: totalXP, drawer: drawer, settingsHTML: settingsHTML, applyP: applyP, split: split, reveal: reveal, sparks: sparks, countUp: countUp, badgesHTML: badgesHTML, checkBadges: checkBadges, save: function () { saveJSON(GK, P); } };
applyP();
document.addEventListener("DOMContentLoaded", function () { split(); paintChrome(); reveal(); });
})();
