/* ===== Moteur des guides de révision (hors-ligne, mobile) ===== */
(function () {
"use strict";
var G = window.G || {};
var KEY = "rev:" + G.slug;
var GKEY = "rev:global";
function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? Object.assign(d, v) : d; } catch (e) { return d; } }
var S = load(KEY, { ep: {}, ch: [], quizBest: 0, quizPts: 0, last: "" });
var GM = window.GAME || null;
var P = GM ? GM.P : load(GKEY, { theme: "auto", fs: "m" });
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function saveP() { if (GM) return GM.save(); try { localStorage.setItem(GKEY, JSON.stringify(P)); } catch (e) {} }
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var reduced = function () { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
var vib = function (p) { if (GM) return GM.vib(p); try { navigator.vibrate && navigator.vibrate(p || 10); } catch (e) {} };
var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
var norm = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var ic = function (id) { return '<svg class="i" aria-hidden="true"><use href="#' + id + '"/></svg>'; };

/* ---------- Thème ---------- */
function applyTheme() {
  if (GM) return GM.applyP();
  var t = P.theme;
  if (t === "auto") { try { t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch (e) { t = "light"; } }
  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.fs = P.fs;
  var m = $('meta[name="theme-color"]'); if (m) m.content = t === "dark" ? "#0C1422" : "#EEF1F5";
  var b = $("[data-theme-btn]"); if (b) b.innerHTML = ic(t === "dark" ? "i-sun" : "i-moon");
}
window.__applyTheme = applyTheme;

/* ---------- Toast & confettis ---------- */
function toast(t) {
  $$(".toast").forEach(function (x) { x.remove(); });
  var d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
  document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2400);
}
function confetti() {
  if (reduced()) return;
  var cols = ["#D7263D", "#FFD23F", "#14866D", "#2453A6", "#13213A"];
  for (var i = 0; i < 30; i++) {
    var c = document.createElement("i"); c.className = "cf";
    c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % 5];
    c.style.animationDelay = Math.random() * .3 + "s"; c.style.animationDuration = 1.1 + Math.random() * .6 + "s";
    document.body.appendChild(c); (function (c) { setTimeout(function () { c.remove(); }, 2300); })(c);
  }
}

/* ---------- Copier ---------- */
function copyText(t) {
  function fb() { var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); }
  try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).catch(fb); else fb(); } catch (e) { fb(); }
}

/* ---------- Surligneur animé ---------- */
var io = null;
function watchMarks(root) {
  var ms = $$("mark.hl:not(.on), .rv:not(.in)", root);
  if (!ms.length) return;
  if (!("IntersectionObserver" in window) || reduced()) { ms.forEach(function (m) { m.classList.add(m.tagName === "MARK" ? "on" : "in"); }); return; }
  if (!io) io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add(e.target.tagName === "MARK" ? "on" : "in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -12% 0px" });
  ms.forEach(function (m) { io.observe(m); });
}

/* ---------- Progression ---------- */
var EPS = G.eps || [], CHS = G.chs || [];
function stats() {
  var done = EPS.filter(function (e) { return S.ep[e.id] === "ok"; }).length;
  var rev = EPS.filter(function (e) { return S.ep[e.id] === "rev"; }).length;
  var chd = S.ch.length;
  var tot = EPS.length + CHS.length;
  var pct = tot ? Math.round((done + chd) / tot * 100) : 0;
  return { done: done, rev: rev, chd: chd, pct: pct };
}
var XP0 = null;
function syncMeta() {
  var s = stats(), xp = GM ? GM.courseXP(S) : 0;
  try { localStorage.setItem("rev:meta:" + G.slug, JSON.stringify({ pct: s.pct, done: s.done, rev: s.rev, chd: s.chd, t: Date.now(), last: S.last, xp: xp, xpMax: G.xpMax || 0 })); } catch (e) {}
}
function paintProgress() {
  var s = stats();
  var fg = $(".ring .fg"); if (fg) { var L = 2 * Math.PI * 40; fg.style.strokeDasharray = L; fg.style.strokeDashoffset = L * (1 - s.pct / 100); }
  var t = $(".ring text"); if (t) t.textContent = s.pct + "%";
  $$("[data-stat]").forEach(function (el) { el.textContent = s[el.dataset.stat]; });
  $$("[data-epstate]").forEach(function (el) {
    var st = S.ep[el.dataset.epstate];
    el.innerHTML = st === "ok" ? '<span class="tag ok">' + ic("i-check") + "Maîtrisée</span>" : st === "rev" ? '<span class="tag rev">' + ic("i-flag") + "À revoir</span>" : "";
  });
  $$("[data-chstate]").forEach(function (el) { el.classList.toggle("done", S.ch.indexOf(el.dataset.chstate) >= 0); });
  $$("[data-epmark]").forEach(function (b) { b.setAttribute("aria-pressed", S.ep[b.dataset.epmark.split(":")[0]] === b.dataset.epmark.split(":")[1]); });
  syncMeta();
  if (GM) { var xp = GM.paintCourse(S); if (XP0 !== null && xp > XP0) GM.gain(xp - XP0, window.__xpEl || null); XP0 = xp; window.__xpEl = null; }
}

/* ---------- Visionneuse de l'original ---------- */
function openViewer(id) {
  var d = (G.docs || {})[id]; if (!d) return;
  var z = 1;
  var v = document.createElement("div"); v.className = "viewer"; v.setAttribute("role", "dialog"); v.setAttribute("aria-label", "Document original");
  var imgs = ""; for (var i = 1; i <= d.n; i++) imgs += '<img loading="lazy" decoding="async" src="' + G.base + "docs/" + id + "/p-" + i + '.jpg" alt="Page ' + i + ' sur ' + d.n + '">';
  v.innerHTML = '<div class="vb"><button class="ib" data-vclose aria-label="Fermer">' + ic("i-x") + '</button><b>' + esc(d.t) + '</b><button class="ib" data-z="-1" aria-label="Dézoomer">' + ic("i-minus") + '</button><button class="ib" data-z="1" aria-label="Zoomer">' + ic("i-plus") + '</button>' +
    (d.pdf ? '<a class="ib" href="' + G.base + "docs/" + id + '.pdf" target="_blank" rel="noopener" aria-label="Ouvrir le PDF">' + ic("i-pdf") + "</a>" : "") + '</div><div class="pages">' + imgs + '</div><div class="pg">1 / ' + d.n + "</div>";
  document.body.appendChild(v); document.body.style.overflow = "hidden";
  var pages = $(".pages", v), pg = $(".pg", v);
  pages.addEventListener("scroll", function () {
    var ims = $$("img", pages), y = pages.scrollTop + pages.clientHeight / 3, k = 1;
    ims.forEach(function (im, j) { if (im.offsetTop <= y) k = j + 1; });
    pg.textContent = k + " / " + d.n;
  }, { passive: true });
  function close() { v.remove(); document.body.style.overflow = ""; if (location.hash.indexOf("~doc") > 0) history.back(); }
  v.addEventListener("click", function (e) {
    if (e.target.closest("[data-vclose]")) return close();
    var zb = e.target.closest("[data-z]");
    if (zb) { z = Math.max(1, Math.min(3, z + (+zb.dataset.z) * .5)); pages.style.setProperty("--z", z); }
  });
  history.pushState(null, "", location.hash + "~doc");
  window.__closeViewer = function () { v.remove(); document.body.style.overflow = ""; };
}

/* ---------- Minuteur d'épreuve ---------- */
var TM = null;
function startTimer(min) {
  stopTimer();
  var end = Date.now() + min * 60000, paused = 0, left = min * 60000;
  var el = document.createElement("div"); el.className = "timer"; el.setAttribute("role", "timer");
  el.innerHTML = '<span data-t></span><button data-tp aria-label="Pause">' + ic("i-pause") + '</button><button data-tx aria-label="Arrêter">' + ic("i-x") + "</button>";
  document.body.appendChild(el);
  function fmt(ms) { var s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0"); }
  function tick() {
    if (!paused) left = end - Date.now();
    $("[data-t]", el).textContent = fmt(left);
    el.classList.toggle("low", left < 5 * 60000);
    if (left <= 0) { stopTimer(); vib([200, 100, 200]); toast("Temps écoulé : pose le stylo et compare avec le corrigé."); }
  }
  el.addEventListener("click", function (e) {
    if (e.target.closest("[data-tx]")) return stopTimer();
    if (e.target.closest("[data-tp]")) {
      if (paused) { end = Date.now() + left; paused = 0; e.target.closest("[data-tp]").innerHTML = ic("i-pause"); }
      else { paused = 1; e.target.closest("[data-tp]").innerHTML = ic("i-play"); }
    }
  });
  TM = { el: el, iv: setInterval(tick, 500) }; tick();
}
function stopTimer() { if (TM) { clearInterval(TM.iv); TM.el.remove(); TM = null; } }

/* ---------- Quiz ---------- */
var QZ = null;
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function quizStart() {
  var pool = G.quiz || [];
  QZ = { qs: shuffle(pool).slice(0, Math.min(15, pool.length)).map(function (q) { return { q: q, order: shuffle(q.o.map(function (_, k) { return k; })) }; }), i: 0, picked: null, score: 0, wrong: [] };
}
function quizRender() {
  var box = $('[data-v="quiz"] .qz'); if (!box) return;
  var pool = G.quiz || [];
  if (!pool.length) { box.innerHTML = '<p class="empty">Pas encore de quiz pour cette matière.</p>'; return; }
  if (!QZ) {
    box.innerHTML = '<div class="sheet" style="padding:18px"><h2 style="font-size:1.25rem">Quiz express</h2><p class="lead" style="margin:6px 0 14px">' + Math.min(15, pool.length) + " questions tirées au hasard parmi " + pool.length + ". Chaque réponse est corrigée et expliquée tout de suite.</p>" +
      '<button class="btn red wide" data-qstart>' + ic("i-play") + "Lancer le quiz</button>" + (S.quizBest ? '<p class="lead" style="margin:10px 0 0;text-align:center">Meilleur score : ' + S.quizBest + "</p>" : "") + "</div>";
    return;
  }
  var n = QZ.qs.length;
  if (QZ.i >= n) {
    var pct = Math.round(QZ.score / n * 100);
    if (!QZ.counted) { QZ.counted = 1; var best = QZ.score + " / " + n; if (!S.quizBest || QZ.score / n > parseInt(S.quizBest) / parseInt(S.quizBest.split("/")[1])) S.quizBest = best; S.quizPts = Math.max(S.quizPts || 0, QZ.score); save(); if (GM && pct === 100) { GM.PL.perfect = (GM.PL.perfect || 0) + 1; try { localStorage.setItem("rev:player", JSON.stringify(GM.PL)); } catch (e) {} } paintProgress(); if (GM && pct >= 70) GM.reward({ kicker: "Quiz terminé", title: QZ.score + " / " + n, icon: pct === 100 ? "i-crown" : "i-star", text: pct === 100 ? "Sans faute ! Tu maîtrises." : "Belle série. Chaque bonne réponse vaut 10 XP (ton meilleur score compte).", btn: "Voir le détail" }); else if (pct >= 80) confetti(); }
    var msg = pct === 100 ? "Sans faute. Tu es prêt pour l’épreuve." : pct >= 70 ? "Solide. Revois juste les points ci-dessous." : pct >= 40 ? "Ça avance. Relis les explications, puis rejoue." : "Pas grave : relis le cours et les corrigés, puis rejoue.";
    box.innerHTML = '<div class="score"><svg viewBox="0 0 170 120" aria-hidden="true"><ellipse cx="85" cy="60" rx="76" ry="48" fill="none" stroke="var(--red)" stroke-width="3.5" class="draw" style="--len:400" transform="rotate(-6 85 60)"/></svg><div class="big" style="margin-top:-96px">' + QZ.score + '<span style="font-size:.45em;color:var(--ink2)"> / ' + n + "</span></div><p style=\"margin-top:52px\">" + msg + "</p></div>" +
      '<div class="row" style="margin-top:12px"><button class="btn red" data-qagain>' + ic("i-retry") + "Rejouer</button></div>" +
      (QZ.wrong.length ? '<h3 style="margin:22px 0 8px">À revoir</h3>' + QZ.wrong.map(function (q) { return '<div class="co reponse" style="margin-bottom:10px"><div class="b"><p>' + q.q + "</p><p><b>" + q.o[q.a] + "</b></p><p>" + q.e + "</p></div></div>"; }).join("") : "");
    return;
  }
  var it = QZ.qs[QZ.i], q = it.q, p = QZ.picked;
  box.innerHTML = '<div class="qhead"><span>Question ' + (QZ.i + 1) + " sur " + n + "</span><span>" + QZ.score + " bonne" + (QZ.score > 1 ? "s" : "") + '</span></div><div class="qbar"><i style="width:' + (QZ.i / n * 100) + '%"></i></div>' +
    '<div class="qq">' + q.q + '</div><div class="opts">' + it.order.map(function (k, pos) {
      var c = ""; if (p !== null) { if (k === q.a) c = "ok"; else if (k === p) c = "no"; }
      return '<button class="opt ' + c + '" data-qk="' + k + '"' + (p !== null ? " disabled" : "") + '><span class="l">' + "ABCDE"[pos] + "</span><span>" + q.o[k] + "</span></button>";
    }).join("") + "</div>" +
    (p !== null ? '<div class="why ' + (p === q.a ? "ok" : "no") + '"><b>' + (p === q.a ? "Exact. " : "Raté. ") + "</b>" + q.e + '</div><button class="btn red wide" style="margin-top:14px" data-qnext>' + (QZ.i + 1 < n ? "Question suivante" : "Voir mon score") + ic("i-next") + "</button>" : "");
}

/* ---------- Recherche ---------- */
var IDX = null;
function buildIdx() {
  IDX = [];
  $$("[data-v]").forEach(function (sec) {
    var v = sec.dataset.v, ttl = sec.dataset.title || "";
    if (v === "search" || v === "quiz" || v === "reglages") return;
    $$("p, li, h2, h3, td, pre, .k", sec).forEach(function (el) {
      var t = el.textContent.replace(/\s+/g, " ").trim(); if (t.length < 3) return;
      IDX.push({ v: v, ttl: ttl, t: t, n: norm(t), el: el });
    });
  });
}
function snip(t, q) {
  var n = norm(t), k = n.indexOf(q); if (k < 0) return esc(t.slice(0, 120));
  var a = Math.max(0, k - 50), b = Math.min(t.length, k + q.length + 80);
  return (a ? "…" : "") + esc(t.slice(a, k)) + '<mark class="f">' + esc(t.slice(k, k + q.length)) + "</mark>" + esc(t.slice(k + q.length, b)) + (b < t.length ? "…" : "");
}
function searchRender() {
  var inp = $("[data-q]"), res = $("[data-res]"); if (!inp) return;
  var q = norm(inp.value.trim());
  if (q.length < 2) { res.innerHTML = '<p class="empty">Tape au moins 2 lettres. La recherche couvre le cours, les énoncés, les corrigés et le mémo.</p>'; return; }
  if (!IDX) buildIdx();
  var seen = {}, r = [];
  IDX.forEach(function (x, i) { if (x.n.indexOf(q) >= 0 && r.length < 50) { var key = x.v + "|" + x.t.slice(0, 60); if (!seen[key]) { seen[key] = 1; r.push(i); } } });
  if (!r.length) { res.innerHTML = '<p class="empty">Aucun résultat pour « ' + esc(inp.value) + " ». Essaie un mot plus court.</p>"; return; }
  res.innerHTML = '<p class="lead">' + r.length + (r.length === 50 ? "+" : "") + " résultat" + (r.length > 1 ? "s" : "") + '</p><ul class="sres">' + r.map(function (i) { var x = IDX[i]; return '<li><a href="#/' + x.v + '" data-hit="' + i + '"><span class="w">' + esc(x.ttl) + '</span><div class="s">' + snip(x.t, q) + "</div></a></li>"; }).join("") + "</ul>";
}

/* ---------- Routeur ---------- */
var cur = null;
function show(v, opts) {
  var sec = $('[data-v="' + v + '"]') || $('[data-v="home"]'); v = sec.dataset.v;
  $$("[data-v]").forEach(function (s) { s.hidden = s !== sec; });
  sec.classList.remove("view"); void sec.offsetWidth; sec.classList.add("view");
  var tab = sec.dataset.tab || v;
  $$(".tabs a").forEach(function (a) { if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  var ttl = $(".top .ttl small"); if (ttl) ttl.textContent = sec.dataset.title || G.title;
  var isRead = /^(ch-|ep-)/.test(v);
  document.body.classList.toggle("reading", isRead);
  $$(".rbar").forEach(function (b) { b.hidden = b.dataset.for !== v; });
  if (v.indexOf("ep-") === 0 || v.indexOf("ch-") === 0) { S.last = v; save(); syncMeta(); }
  if (v === "quiz") quizRender();
  if (v === "search") { searchRender(); setTimeout(function () { var i = $("[data-q]"); i && i.focus(); }, 60); }
  if (v === "reglages") paintSettings();
  if (!(opts && opts.keep)) window.scrollTo(0, 0);
  watchMarks(sec);
  if (GM) GM.reveal(sec);
  cur = v;
}
function route() {
  if (location.hash.indexOf("~doc") > 0) return;
  if (window.__closeViewer) { window.__closeViewer(); window.__closeViewer = null; return; }
  var h = location.hash.replace(/^#\/?/, "").split("~")[0];
  show(h || "home");
}

/* ---------- Réglages ---------- */
function paintSettings() {
  var s = $('[data-v="reglages"] .st'); if (!s) return;
  if (GM) { s.innerHTML = GM.settingsHTML(true); return; }
  s.innerHTML = '<div class="set"><div class="lab">Thème</div><div class="seg">' + [["auto", "Auto"], ["light", "Clair"], ["dark", "Sombre"]].map(function (x) { return '<button data-set-theme="' + x[0] + '" aria-pressed="' + (P.theme === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div></div>" +
    '<div class="set"><div class="lab">Taille du texte</div><div class="seg">' + [["s", "Petit"], ["m", "Normal"], ["l", "Grand"]].map(function (x) { return '<button data-set-fs="' + x[0] + '" aria-pressed="' + (P.fs === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div></div>" +
    '<div class="set"><div class="lab">Progression de cette matière</div><button class="btn gh" data-reset style="color:var(--red)">' + ic("i-retry") + "Remettre à zéro</button></div>";
}

/* ---------- Évènements ---------- */
document.addEventListener("click", function (e) {
  var t = e.target;
  var c = t.closest("[data-copy]");
  if (c) { var pre = c.closest("figure").querySelector("pre"); var txt = $$(".ln", pre).filter(function (l) { return !l.classList.contains("o"); }).map(function (l) { return l.textContent; }).join("\n"); copyText(txt); c.classList.add("done"); c.innerHTML = ic("i-check") + "Copié"; vib(); setTimeout(function () { c.classList.remove("done"); c.innerHTML = ic("i-copy") + "Copier"; }, 1500); return; }
  var d = t.closest("[data-doc]"); if (d) { e.preventDefault(); openViewer(d.dataset.doc); return; }
  var tm = t.closest("[data-timer]"); if (tm) { startTimer(+tm.dataset.timer); toast("Chrono lancé : " + tm.dataset.timer + " min. Bon courage !"); return; }
  var all = t.closest("[data-openall]"); if (all) { var box = all.closest(".part"); var ds = $$("details.q", box); var open = ds.some(function (x) { return !x.open; }); ds.forEach(function (x) { x.open = open; }); all.innerHTML = ic(open ? "i-minus" : "i-eye") + (open ? "Tout replier" : "Tout afficher"); watchMarks(box); return; }
  var mk = t.closest("[data-epmark]");
  if (mk) { window.__xpEl = mk; var a = mk.dataset.epmark.split(":"); if (S.ep[a[0]] === a[1]) delete S.ep[a[0]]; else S.ep[a[0]] = a[1]; save(); paintProgress(); vib(14); if (a[1] === "ok" && S.ep[a[0]] === "ok") { var ex = (EPS.filter(function (z) { return z.id === a[0]; })[0] || {}).xp || 100; if (GM) GM.reward({ kicker: "Mission accomplie", title: "Épreuve maîtrisée", icon: "i-trophy", xp: ex, text: "Ton grade progresse. Enchaîne avec la suivante !" }); else { toast("Épreuve maîtrisée. Bravo !"); confetti(); } } else if (S.ep[a[0]] === "rev") toast("Ajoutée à « À revoir »."); return; }
  var chd = t.closest("[data-chdone]");
  if (chd) { window.__xpEl = chd; var id = chd.dataset.chdone; if (S.ch.indexOf(id) < 0) { S.ch.push(id); save(); toast("Chapitre terminé."); confetti(); } paintProgress(); var nx = chd.dataset.next; location.hash = nx ? "#/" + nx : "#/cours"; return; }
  var f = t.closest("[data-filter]");
  if (f) { $$("[data-filter]").forEach(function (b) { b.setAttribute("aria-pressed", b === f); }); var k = f.dataset.filter; $$(".eplist .ep").forEach(function (x) { var st = S.ep[x.dataset.id]; x.parentElement.hidden = !(k === "all" || x.dataset.k === k || (k === "rev" && st === "rev") || (k === "todo" && !st)); }); return; }
  if (t.closest("[data-qstart]") || t.closest("[data-qagain]")) { quizStart(); quizRender(); return; }
  var qk = t.closest("[data-qk]");
  if (qk && QZ && QZ.picked === null) { QZ.picked = +qk.dataset.qk; var q = QZ.qs[QZ.i].q; if (QZ.picked === q.a) { QZ.score++; vib(10); GM && GM.sfx("ok"); } else { QZ.wrong.push(q); vib([30, 40, 30]); GM && GM.sfx("no"); } quizRender(); var w = $(".why"); w && w.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" }); return; }
  if (t.closest("[data-qnext]")) { QZ.i++; QZ.picked = null; quizRender(); window.scrollTo(0, 0); return; }
  if (t.closest("[data-theme-btn]")) { var cur2 = document.documentElement.dataset.theme; P.theme = cur2 === "dark" ? "light" : "dark"; saveP(); applyTheme(); return; }
  var st = t.closest("[data-set-theme]"); if (st) { P.theme = st.dataset.setTheme; saveP(); applyTheme(); paintSettings(); return; }
  var sf = t.closest("[data-set-fs]"); if (sf) { P.fs = sf.dataset.setFs; saveP(); applyTheme(); paintSettings(); return; }
  var rs = t.closest("[data-reset]"); if (rs) { if (rs.dataset.armed) { S = { ep: {}, ch: [], quizBest: 0, quizPts: 0, last: "" }; save(); XP0 = 0; paintProgress(); toast("Progression remise à zéro."); paintSettings(); } else { rs.dataset.armed = 1; rs.textContent = "Appuie encore pour confirmer"; } return; }
  var hit = t.closest("[data-hit]");
  if (hit) { e.preventDefault(); var x = IDX[+hit.dataset.hit]; location.hash = "#/" + x.v; setTimeout(function () { var dd = x.el.closest("details"); if (dd) dd.open = true; x.el.scrollIntoView({ block: "center" }); x.el.style.transition = "background .6s"; x.el.style.background = "var(--hl-soft)"; setTimeout(function () { x.el.style.background = ""; }, 1600); }, 80); return; }
});
document.addEventListener("input", function (e) { if (e.target.matches("[data-q]")) searchRender(); });
document.addEventListener("toggle", function (e) { if (e.target.matches && e.target.matches("details.q") && e.target.open) watchMarks(e.target); }, true);
window.addEventListener("hashchange", route);
window.addEventListener("scroll", function () {
  var p = $(".top .prog"); if (!p) return;
  if (!document.body.classList.contains("reading")) { p.style.width = 0; return; }
  var h = document.documentElement.scrollHeight - innerHeight; p.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + "%";
}, { passive: true });
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (P.theme === "auto") applyTheme(); }); } catch (e) {}
window.addEventListener("storage", function (e) { if (e.key === GKEY) { P = load(GKEY, P); applyTheme(); } });

if (location.hash.indexOf("~doc") > 0) { try { history.replaceState(null, "", location.hash.split("~")[0]); } catch (e) { location.hash = location.hash.split("~")[0]; } }
applyTheme(); paintProgress(); route();
})();
