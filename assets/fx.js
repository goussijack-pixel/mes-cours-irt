/* ===== FX : animations d'ambiance par matière (canvas 2D, hors-ligne) ===== */
(function () {
"use strict";
var R = Math.random, PI = Math.PI, TAU = PI * 2;
function css(v) { return getComputedStyle(document.body).getPropertyValue(v).trim() || "#888"; }
function rgba(hex, a) {
  hex = hex.replace("#", ""); if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
  var n = parseInt(hex.slice(0, 6), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
}
function pick(a) { return a[Math.floor(R() * a.length)]; }
function lerp(a, b, k) { return a + (b - a) * k; }
function ease(k) { return 1 - Math.pow(1 - k, 3); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

var E = {};

/* --- Hub : constellation de matières --- */
E.constellation = { init: function (s) {
  var cols = (document.body.dataset.colors || "").split(",").filter(Boolean); if (!cols.length) cols = [s.acc, s.acc2];
  s.n = []; for (var i = 0; i < Math.min(70, Math.floor(s.w * s.h / 9000)); i++) s.n.push({ x: R() * s.w, y: R() * s.h, vx: (R() - .5) * .25, vy: (R() - .5) * .25, r: 1 + R() * 2.4, c: pick(cols) });
}, draw: function (c, s) {
  c.clearRect(0, 0, s.w, s.h);
  for (var i = 0; i < s.n.length; i++) { var a = s.n[i]; a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > s.w) a.vx *= -1; if (a.y < 0 || a.y > s.h) a.vy *= -1;
    for (var j = i + 1; j < s.n.length; j++) { var b = s.n[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 120) { c.strokeStyle = rgba(a.c, (1 - d / 120) * .35); c.lineWidth = 1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); } } }
  s.n.forEach(function (a) { c.fillStyle = a.c; c.shadowColor = a.c; c.shadowBlur = 12; c.beginPath(); c.arc(a.x, a.y, a.r, 0, TAU); c.fill(); }); c.shadowBlur = 0;
} };

/* --- C : cellules mémoire et pointeurs --- */
E.memory = { init: function (s) {
  s.cw = 74; s.ch = 40; s.cols = Math.max(3, Math.floor(s.w / (s.cw + 10))); s.rows = Math.max(3, Math.floor(s.h / (s.ch + 26)));
  s.cells = []; for (var r = 0; r < s.rows; r++) for (var k = 0; k < s.cols; k++) s.cells.push({ x: 14 + k * (s.cw + 10), y: 18 + r * (s.ch + 26), v: Math.floor(R() * 256), a: 0x7ffe10 + (r * s.cols + k) * 4 });
  s.from = 0; s.to = 1; s.t = 0;
}, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.t += dt / 1400;
  if (s.t > 1) { s.t = 0; s.from = s.to; s.to = Math.floor(R() * s.cells.length); s.cells[s.to].v = Math.floor(R() * 256); }
  c.font = "11px " + s.mono; c.textAlign = "center";
  s.cells.forEach(function (o, i) {
    var hot = i === s.to && s.t > .7, src = i === s.from;
    c.strokeStyle = hot ? s.acc2 : src ? s.acc : rgba(s.acc, .35); c.lineWidth = hot || src ? 2 : 1;
    c.fillStyle = hot ? rgba(s.acc2, .14) : rgba(s.acc, .05); rr(c, o.x, o.y, s.cw, s.ch, 6); c.fill(); c.stroke();
    c.fillStyle = rgba(s.ink, .85); c.font = "bold 14px " + s.mono; c.fillText(String(o.v), o.x + s.cw / 2, o.y + 25);
    c.fillStyle = rgba(s.ink, .35); c.font = "9px " + s.mono; c.fillText("0x" + o.a.toString(16), o.x + s.cw / 2, o.y + s.ch + 12);
  });
  var A = s.cells[s.from], B = s.cells[s.to], k = ease(Math.min(1, s.t / .7));
  var ax = A.x + s.cw / 2, ay = A.y, bx = B.x + s.cw / 2, by = B.y, mx = (ax + bx) / 2, my = Math.min(ay, by) - 50;
  c.strokeStyle = s.acc2; c.lineWidth = 2.2; c.shadowColor = s.acc2; c.shadowBlur = 10; c.beginPath();
  for (var i = 0; i <= 30 * k; i++) { var u = i / 30, x = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx, y = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke(); c.shadowBlur = 0; c.fillStyle = s.acc2; c.font = "bold 12px " + s.mono; c.fillText("*p", mx, my + 10);
} };

/* --- Java : vapeur et mots-clés --- */
E.steam = { init: function (s) { s.p = []; s.words = ["class", "new", "extends", "public", "static", "void", "@Override", "interface", "try", "catch", "String", "this", "super", "final"]; }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.T = (s.T || 0) + dt / 1000;
  for (var k = 0; k < 4; k++) { c.beginPath(); var bx = s.w * (.55 + k * .1); for (var y = s.h; y > s.h * .1; y -= 6) { var x = bx + Math.sin(y / 38 + s.T * 1.4 + k) * (18 + (s.h - y) * .08); y === s.h ? c.moveTo(x, y) : c.lineTo(x, y); }
    var g = c.createLinearGradient(0, s.h, 0, s.h * .1); g.addColorStop(0, rgba(s.acc, .45)); g.addColorStop(1, rgba(s.acc2, 0)); c.strokeStyle = g; c.lineWidth = 10 - k * 2; c.lineCap = "round"; c.stroke(); }
  if (R() < dt / 500) s.p.push({ x: s.w * (.15 + R() * .8), y: s.h + 10, w: pick(s.words), v: .3 + R() * .5, a: 0 });
  c.font = "600 14px " + s.mono;
  s.p = s.p.filter(function (o) { o.y -= o.v * dt / 16; o.a = Math.min(1, o.a + .02); var f = Math.min(o.a, o.y / (s.h * .5)); c.fillStyle = rgba(s.acc2, Math.max(0, f) * .7); c.fillText(o.w, o.x, o.y); return o.y > -20; });
} };

/* --- POO : objets en orbite --- */
E.orbits = { init: function (s) { s.o = [{ r: .26, n: 2, sp: .5 }, { r: .38, n: 3, sp: -.32 }, { r: .5, n: 4, sp: .2 }]; s.T = 0; }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.T += dt / 1000; var cx = s.w * .72, cy = s.h * .42, M = Math.min(s.w, s.h * 1.6);
  var g = c.createRadialGradient(cx, cy, 0, cx, cy, 60); g.addColorStop(0, rgba(s.acc, .9)); g.addColorStop(1, rgba(s.acc, 0)); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 60, 0, TAU); c.fill();
  c.fillStyle = s.paper; c.beginPath(); c.arc(cx, cy, 26, 0, TAU); c.fill(); c.strokeStyle = s.acc; c.lineWidth = 2; c.stroke();
  c.fillStyle = s.ink; c.font = "bold 11px " + s.mono; c.textAlign = "center"; c.fillText("Classe", cx, cy + 4);
  s.o.forEach(function (o, k) { var rx = M * o.r, ry = rx * .42; c.setLineDash([3, 6]); c.strokeStyle = rgba(s.ink, .18); c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, rx, ry, -.35, 0, TAU); c.stroke(); c.setLineDash([]);
    for (var i = 0; i < o.n; i++) { var a = s.T * o.sp + i * TAU / o.n, x = cx + Math.cos(a) * rx * Math.cos(-.35) - Math.sin(a) * ry * Math.sin(-.35), y = cy + Math.cos(a) * rx * Math.sin(-.35) + Math.sin(a) * ry * Math.cos(-.35);
      var col = k % 2 ? s.acc2 : s.acc; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.beginPath(); c.arc(x, y, 6 + k * 1.5, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.fillStyle = rgba(s.ink, .6); c.font = "10px " + s.mono; c.fillText("obj" + (k * 4 + i + 1), x, y - 12); } });
} };

/* --- Git : graphe de commits --- */
E.gitgraph = { init: function (s) { s.T = 0; s.lanes = [s.h * .35, s.h * .6, s.h * .82]; }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.T += dt / 1000; var span = 9, t = s.T % span, step = Math.max(46, s.w / 11), x0 = 20, L = s.lanes;
  var ev = [[0, 0], [1, 0], [2, 0], [2.5, 1], [3.5, 1], [4, 0], [4.5, 2], [5.5, 1], [6, 2], [6.5, 0, "merge1"], [7.5, 0, "merge2"], [8.5, 0]];
  function X(i) { return x0 + i * step; }
  c.lineWidth = 3; c.lineCap = "round";
  var shown = ev.filter(function (e) { return e[0] <= t; });
  // lignes
  [0, 1, 2].forEach(function (ln) { var pts = shown.filter(function (e) { return e[1] === ln; }); if (pts.length < 1) return; var col = [s.acc, s.acc2, s.ink2][ln];
    c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 8; c.beginPath(); c.moveTo(X(ln ? pts[0][0] - .5 : 0), L[ln ? 0 : 0]);
    if (ln) c.bezierCurveTo(X(pts[0][0] - .25), L[0], X(pts[0][0] - .25), L[ln], X(pts[0][0]), L[ln]);
    pts.forEach(function (e) { c.lineTo(X(e[0]), L[ln]); }); c.stroke(); c.shadowBlur = 0; });
  if (t > 6.5) { c.strokeStyle = s.acc2; c.beginPath(); c.moveTo(X(5.5), L[1]); c.bezierCurveTo(X(6.2), L[1], X(6.2), L[0], X(6.5), L[0]); c.stroke(); }
  if (t > 7.5) { c.strokeStyle = s.ink2; c.beginPath(); c.moveTo(X(6), L[2]); c.bezierCurveTo(X(7.2), L[2], X(7.2), L[0], X(7.5), L[0]); c.stroke(); }
  shown.forEach(function (e) { var col = [s.acc, s.acc2, s.ink2][e[1]], age = Math.min(1, (t - e[0]) * 3); c.fillStyle = s.paper; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(X(e[0]), L[e[1]], 7 * ease(age), 0, TAU); c.fill(); c.stroke();
    if (e[2]) { c.fillStyle = rgba(s.ink, .6); c.font = "10px " + s.mono; c.fillText("merge", X(e[0]) - 14, L[0] - 14); } });
  c.fillStyle = rgba(s.ink, .5); c.font = "11px " + s.mono; c.fillText("main", 6, L[0] - 16);
  if (t > 2.5) c.fillText("feature", X(2.5) - 10, L[1] + 22); if (t > 4.5) c.fillText("fix", X(4.5) - 4, L[2] + 22);
} };

/* --- Linux : terminal qui tape --- */
E.typing = { init: function (s) { s.lines = [["$ ", "whoami"], ["", "leroi"], ["$ ", "ls -l /etc/passwd"], ["", "-rw-r--r-- 1 root root 2847 /etc/passwd"], ["$ ", "chmod 754 script.sh"], ["$ ", "grep -c bash /etc/passwd"], ["", "3"], ["$ ", "sudo apt update"], ["", "Lecture des listes de paquets... Fait"], ["$ ", "ps aux | grep sshd"], ["$ ", "echo \"révisions OK\" >> journal.txt"], ["$ ", "df -h /home"]]; s.i = 0; s.k = 0; s.buf = []; s.acc0 = 0; }, draw: function (c, s, dt) {
  s.acc0 += dt; var L = s.lines[s.i % s.lines.length], full = L[0] + L[1], speed = L[0] ? 55 : 8;
  while (s.acc0 > speed) { s.acc0 -= speed; s.k++; if (s.k > full.length + (L[0] ? 14 : 4)) { s.buf.push(full); s.i++; s.k = 0; L = s.lines[s.i % s.lines.length]; full = L[0] + L[1]; } }
  c.clearRect(0, 0, s.w, s.h); var lh = 22, maxL = Math.floor((s.h - 20) / lh) - 1; var show = s.buf.slice(-maxL); c.font = "14px " + s.mono;
  var x = Math.max(14, s.w * .38);
  show.forEach(function (t, j) { var y = 26 + j * lh, a = .25 + .6 * (j + 1) / show.length; if (t.indexOf("$ ") === 0) { c.fillStyle = rgba(s.acc, a); c.fillText("$", x, y); c.fillStyle = rgba(s.ink, a); c.fillText(t.slice(2), x + 14, y); } else { c.fillStyle = rgba(s.ink2, a * .9); c.fillText(t, x, y); } });
  var y = 26 + show.length * lh, part = full.slice(0, Math.min(full.length, s.k));
  if (L[0]) { c.fillStyle = s.acc; c.fillText("$", x, y); c.fillStyle = s.ink; c.fillText(part.slice(2), x + 14, y); } else { c.fillStyle = s.ink2; c.fillText(part, x, y); }
  if ((performance.now() / 500 | 0) % 2) { c.fillStyle = s.acc; c.fillRect(x + (L[0] ? 14 : 0) + c.measureText(L[0] ? part.slice(2) : part).width + 2, y - 13, 8, 16); }
} };

/* --- SQL : tables et jointure --- */
E.tables = { init: function (s) { s.T = 0; }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.T += dt / 1000; var rows = 6, rh = 24, tw = Math.min(190, s.w * .34), x1 = s.w - tw * 2 - 50, x2 = s.w - tw - 20, y0 = 30;
  if (s.w < 500) { x1 = s.w * .08; x2 = s.w - tw - 12; }
  var A = ["id", "nom", "ville"], B = ["id_cli", "montant", "date"], hit = Math.floor(s.T * 1.2) % rows, hit2 = (hit * 7 + 2) % rows;
  function tab(x, head, name, hl) { c.fillStyle = rgba(s.acc, .9); rr(c, x, y0, tw, rh, 6); c.fill(); c.fillStyle = s.paper; c.font = "bold 11px " + s.mono; c.fillText(name, x + 8, y0 + 16);
    for (var r = 0; r < rows; r++) { var y = y0 + rh * (r + 1); c.fillStyle = r === hl ? rgba(s.acc2, .3) : r % 2 ? rgba(s.ink, .04) : rgba(s.ink, .08); c.fillRect(x, y, tw, rh); c.strokeStyle = rgba(s.ink, .1); c.strokeRect(x, y, tw, rh);
      c.fillStyle = rgba(s.ink, r === hl ? .95 : .55); c.font = "11px " + s.mono; c.fillText(head[0] === "id" ? String(100 + r) : String(100 + (r * 7 + 2) % rows), x + 8, y + 16); c.fillText(head[0] === "id" ? ["Awa", "Kofi", "Léa", "Yao", "Ines", "Moussa"][r] : (r + 1) * 2500 + " F", x + tw * .42, y + 16); } }
  tab(x1, A, "CLIENT", hit2); tab(x2, B, "COMMANDE", hit);
  var ya = y0 + rh * (hit2 + 1.5), yb = y0 + rh * (hit + 1.5); c.strokeStyle = s.acc2; c.lineWidth = 2; c.shadowColor = s.acc2; c.shadowBlur = 8; c.beginPath(); c.moveTo(x1 + tw, ya); c.bezierCurveTo(x1 + tw + 40, ya, x2 - 40, yb, x2, yb); c.stroke(); c.shadowBlur = 0;
  c.fillStyle = rgba(s.ink, .55); c.font = "11px " + s.mono; c.fillText("JOIN ON client.id = commande.id_cli", x1, y0 + rh * (rows + 2));
} };

/* --- UML : diagramme dessiné au feutre --- */
E.diagram = { init: function (s) { s.T = 0; var w = s.w, h = s.h, bx = Math.max(12, w - 330); s.box = [[bx, 30, 120, 70, "Etudiant"], [bx + 190, 30, 120, 70, "Cours"], [bx + 95, h * .55, 130, 70, "Inscription"]]; }, draw: function (c, s, dt) {
  s.T += dt / 1000; var t = s.T % 8; c.clearRect(0, 0, s.w, s.h); c.lineWidth = 2.4; c.lineCap = "round"; c.lineJoin = "round";
  function wob(x1, y1, x2, y2, k) { c.beginPath(); c.moveTo(x1, y1); var n = 10; for (var i = 1; i <= n * k; i++) { var u = i / n; c.lineTo(lerp(x1, x2, u) + Math.sin(i * 3.1) * .8, lerp(y1, y2, u) + Math.cos(i * 2.3) * .8); } c.stroke(); }
  s.box.forEach(function (b, i) { var k = Math.max(0, Math.min(1, t - i * .8)); if (!k) return; c.strokeStyle = i === 2 ? s.acc2 : s.acc;
    var P = [[b[0], b[1], b[0] + b[2], b[1]], [b[0] + b[2], b[1], b[0] + b[2], b[1] + b[3]], [b[0] + b[2], b[1] + b[3], b[0], b[1] + b[3]], [b[0], b[1] + b[3], b[0], b[1]]];
    P.forEach(function (p, j) { var kk = Math.max(0, Math.min(1, k * 4 - j)); if (kk) wob(p[0], p[1], p[2], p[3], kk); });
    if (k > .9) { wob(b[0], b[1] + 24, b[0] + b[2], b[1] + 24, 1); c.fillStyle = s.ink; c.font = "700 20px " + s.disp; c.textAlign = "center"; c.fillText(b[4], b[0] + b[2] / 2, b[1] + 18); c.textAlign = "left"; } });
  var k2 = Math.max(0, Math.min(1, (t - 2.8) / .8)); if (k2) { c.strokeStyle = s.ink2; var a = s.box[0], b = s.box[1]; wob(a[0] + a[2], a[1] + 45, b[0], b[1] + 45, k2); if (k2 >= 1) { c.fillStyle = s.ink2; c.font = "700 16px " + s.disp; c.fillText("0..*", a[0] + a[2] + 6, a[1] + 40); c.fillText("1..*", b[0] - 30, b[1] + 40); } }
  var k3 = Math.max(0, Math.min(1, (t - 3.8) / .8)); if (k3) { var m = s.box[2]; c.setLineDash([6, 6]); wob(m[0] + m[2] / 2, m[1], m[0] + m[2] / 2, s.box[0][1] + 48, k3); c.setLineDash([]); }
} };

/* --- XML : arbre de balises --- */
E.xmltree = { init: function (s) { s.T = 0; s.nodes = [[0, "<ecole>"], [1, "<etudiant id=\"12\">"], [2, "<nom>Awa</nom>"], [2, "<note>16</note>"], [1, "<etudiant id=\"13\">"], [2, "<nom>Kofi</nom>"], [2, "<note>14</note>"], [1, "</etudiant>"], [0, "</ecole>"]]; }, draw: function (c, s, dt) {
  s.T += dt / 1000; var t = s.T % 9, n = Math.min(s.nodes.length, Math.floor(t * 1.4)); c.clearRect(0, 0, s.w, s.h); c.font = "14px " + s.mono; var x0 = Math.max(16, s.w * .4), lh = Math.min(30, (s.h - 30) / s.nodes.length);
  for (var i = 0; i < n; i++) { var d = s.nodes[i][0], y = 28 + i * lh, x = x0 + d * 26, a = Math.min(1, (t * 1.4 - i)); c.globalAlpha = a;
    if (d) { c.strokeStyle = rgba(s.acc, .4); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 18, y - 22); c.lineTo(x - 18, y - 5); c.lineTo(x - 4, y - 5); c.stroke(); }
    var txt = s.nodes[i][1], m = txt.match(/^(<\/?)([\w]+)(.*?)(\/?>)(.*)$/); if (m) { c.fillStyle = rgba(s.ink, .5); c.fillText(m[1], x, y); var w = c.measureText(m[1]).width; c.fillStyle = s.acc; c.fillText(m[2], x + w, y); w += c.measureText(m[2]).width; c.fillStyle = s.acc2; c.fillText(m[3], x + w, y); w += c.measureText(m[3]).width; c.fillStyle = rgba(s.ink, .5); c.fillText(m[4], x + w, y); w += c.measureText(m[4]).width; c.fillStyle = s.ink; c.fillText(m[5], x + w, y); }
    c.globalAlpha = 1; }
} };

/* --- Web : maquette qui se construit --- */
E.layout = { init: function (s) { s.T = 0; }, draw: function (c, s, dt) {
  s.T += dt / 1000; var t = s.T % 7; c.clearRect(0, 0, s.w, s.h); var W = Math.min(340, s.w * .62), H = Math.min(240, s.h * .72), x = s.w - W - 16, y = 22;
  c.fillStyle = rgba(s.ink, .06); c.strokeStyle = rgba(s.ink, .25); rr(c, x, y, W, H, 10); c.fill(); c.stroke(); c.fillStyle = rgba(s.ink, .12); c.fillRect(x, y + 20, W, 1);
  ["#FF5F57", "#FEBC2E", "#28C840"].forEach(function (col, i) { c.fillStyle = col; c.beginPath(); c.arc(x + 12 + i * 12, y + 10, 4, 0, TAU); c.fill(); });
  var blocks = [[.05, .14, .9, .1, s.acc], [.05, .28, .55, .28, s.acc2], [.64, .28, .31, .28, s.acc], [.05, .62, .28, .3, s.ink2], [.36, .62, .28, .3, s.ink2], [.67, .62, .28, .3, s.ink2]];
  blocks.forEach(function (b, i) { var k = ease(Math.max(0, Math.min(1, (t - .4 - i * .5) * 2))); if (!k) return; c.fillStyle = rgba(b[4], .18 + .5 * k * (i < 3 ? 1 : .4)); rr(c, x + b[0] * W, y + b[1] * H + (1 - k) * 14, b[2] * W, b[3] * H, 6); c.fill(); });
  var cx = x + W * (.2 + .6 * (.5 + .5 * Math.sin(t * 1.3))), cy = y + H * (.4 + .3 * Math.cos(t * 1.7)); c.fillStyle = s.ink; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy + 16); c.lineTo(cx + 4, cy + 12); c.lineTo(cx + 9, cy + 18); c.lineTo(cx + 11, cy + 17); c.lineTo(cx + 7, cy + 11); c.lineTo(cx + 12, cy + 11); c.closePath(); c.fill();
  c.font = "11px " + s.mono; c.fillStyle = rgba(s.ink, .5); c.fillText("<div class=\"hero\">", x, y + H + 18);
} };

/* --- Réseaux : paquets qui circulent --- */
E.network = { init: function (s) { s.n = []; var k = Math.max(9, Math.min(18, Math.floor(s.w / 55))); for (var i = 0; i < k; i++) s.n.push({ x: s.w * (.1 + .85 * R()), y: s.h * (.08 + .8 * R()) });
  s.e = []; s.n.forEach(function (a, i) { var d = s.n.map(function (b, j) { return [Math.hypot(a.x - b.x, a.y - b.y), j]; }).sort(function (p, q) { return p[0] - q[0]; }); for (var q = 1; q <= 2; q++) s.e.push([i, d[q][1]]); }); s.p = []; }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); c.lineWidth = 1; s.e.forEach(function (e) { var a = s.n[e[0]], b = s.n[e[1]]; c.strokeStyle = rgba(s.acc, .22); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); });
  if (R() < dt / 180) s.p.push({ e: pick(s.e), k: 0, v: .0006 + R() * .0008, col: R() < .5 ? s.acc : s.acc2 });
  s.p = s.p.filter(function (p) { p.k += p.v * dt; var a = s.n[p.e[0]], b = s.n[p.e[1]], x = lerp(a.x, b.x, p.k), y = lerp(a.y, b.y, p.k); c.fillStyle = p.col; c.shadowColor = p.col; c.shadowBlur = 12; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); c.shadowBlur = 0; return p.k < 1; });
  s.n.forEach(function (a, i) { c.fillStyle = s.paper; c.strokeStyle = i % 4 ? s.acc : s.acc2; c.lineWidth = 2; c.beginPath(); c.arc(a.x, a.y, i % 4 ? 6 : 9, 0, TAU); c.fill(); c.stroke(); });
  c.font = "10px " + s.mono; c.fillStyle = rgba(s.ink, .45); c.fillText("192.168.1.0/24", s.n[0].x + 12, s.n[0].y - 10);
} };

/* --- Windows Server : tuiles vivantes --- */
E.tiles = { init: function (s) { s.sz = 46; s.g = 8; s.cols = Math.ceil(s.w / (s.sz + s.g)); s.rows = Math.ceil(s.h / (s.sz + s.g)); s.f = {}; }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); if (R() < dt / 120) s.f[Math.floor(R() * s.cols * s.rows)] = 1;
  for (var r = 0; r < s.rows; r++) for (var k = 0; k < s.cols; k++) { var id = r * s.cols + k, x = k * (s.sz + s.g) + 6, y = r * (s.sz + s.g) + 6, v = s.f[id] || 0, dist = Math.hypot(k / s.cols - .85, r / s.rows - .2);
    var base = Math.max(0, .22 - dist * .28); c.fillStyle = rgba((k + r) % 3 ? s.acc : s.acc2, base + v * .55); rr(c, x, y, s.sz, s.sz * (1 - .0 * v), 6); c.fill();
    if (v) { s.f[id] = Math.max(0, v - dt / 1300); if (!s.f[id]) delete s.f[id]; } }
} };

/* --- Cyber : pluie de code --- */
E.matrix = { init: function (s) { s.fs = 15; s.cols = Math.ceil(s.w / s.fs); s.y = []; for (var i = 0; i < s.cols; i++) s.y.push(R() * -50); s.ch = "01ABCDEF<>/{}#$%&*=+;:!?ACCESDENIEDROOT0x7F"; s.acc0 = 0; }, draw: function (c, s, dt) {
  s.acc0 += dt; if (s.acc0 < 50) return; s.acc0 = 0;
  c.fillStyle = rgba(s.paper, .16); c.fillRect(0, 0, s.w, s.h); c.font = "bold " + s.fs + "px " + s.mono;
  for (var i = 0; i < s.cols; i++) { var ch = s.ch[Math.floor(R() * s.ch.length)], x = i * s.fs, y = s.y[i] * s.fs, hot = i % 7 === 3;
    c.fillStyle = R() < .06 ? "#fff" : hot ? s.acc2 : s.acc; c.globalAlpha = .55 + R() * .45; c.fillText(ch, x, y); c.globalAlpha = 1;
    if (y > s.h && R() > .975) s.y[i] = 0; s.y[i]++; }
}, clear: false };

/* --- Électronique : circuit imprimé --- */
E.circuit = { init: function (s) { s.tr = []; for (var i = 0; i < 16; i++) { var x = R() * s.w, y = R() * s.h, pts = [[x, y]]; for (var k = 0; k < 5; k++) { var l = 30 + R() * 90; if (k % 2) y += (R() < .5 ? -1 : 1) * l; else x += (R() < .5 ? -1 : 1) * l; pts.push([x, y]); } s.tr.push({ p: pts, k: R(), v: .00025 + R() * .0004 }); } }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h);
  s.tr.forEach(function (t, i) { c.strokeStyle = rgba(s.acc2, .3); c.lineWidth = 2.5; c.lineJoin = "round"; c.beginPath(); t.p.forEach(function (p, j) { j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke();
    [t.p[0], t.p[t.p.length - 1]].forEach(function (p) { c.fillStyle = s.paper; c.strokeStyle = s.acc; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], 4.5, 0, TAU); c.fill(); c.stroke(); });
    t.k = (t.k + t.v * dt) % 1; var segs = t.p.length - 1, f = t.k * segs, j = Math.floor(f), u = f - j, a = t.p[j], b = t.p[j + 1], x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u);
    c.fillStyle = s.acc; c.shadowColor = s.acc; c.shadowBlur = 16; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); c.shadowBlur = 0; });
  c.font = "bold 13px " + s.mono; c.fillStyle = rgba(s.acc, .8); c.fillText("A·B + C̄ = S", s.w - 130, s.h - 30);
} };

/* --- Assembleur : dump hexadécimal --- */
E.hexdump = { init: function (s) { s.l = []; s.off = 0x400; s.acc0 = 0; s.ins = ["mov ax, 0x4C00", "int 21h", "push bp", "mov bp, sp", "add ax, bx", "cmp cx, 0", "jne boucle", "loop etiq", "xor ax, ax", "call afficher", "ret", "inc si", "lea dx, msg", "shl al, 1"]; }, draw: function (c, s, dt) {
  s.acc0 += dt; if (s.acc0 > 160) { s.acc0 = 0; var b = []; for (var i = 0; i < 6; i++) b.push(("0" + Math.floor(R() * 256).toString(16).toUpperCase()).slice(-2)); s.l.push(["0040:" + ("000" + s.off.toString(16).toUpperCase()).slice(-4), b.join(" "), pick(s.ins)]); s.off += 6; if (s.l.length > 40) s.l.shift(); }
  c.clearRect(0, 0, s.w, s.h); c.font = "15px " + s.mono; var lh = 20, n = Math.floor((s.h - 20) / lh), show = s.l.slice(-n), x = Math.max(10, s.w * .3);
  c.shadowColor = s.acc; c.shadowBlur = 8;
  show.forEach(function (r, j) { var y = 22 + j * lh, a = .2 + .8 * (j + 1) / show.length; c.fillStyle = rgba(s.acc, a * .55); c.fillText(r[0], x, y); c.fillStyle = rgba(s.acc, a); c.fillText(r[1], x + 92, y); if (s.w > 520) { c.fillStyle = rgba(s.acc2, a); c.fillText(r[2], x + 260, y); } });
  c.shadowBlur = 0; c.fillStyle = rgba(s.acc, .9); c.font = "bold 13px " + s.mono; var regs = ["AX=" + (Math.random() * 65535 | 0).toString(16).toUpperCase(), "BX=0012", "CX=00" + (s.off % 255).toString(16).toUpperCase(), "IP=" + s.off.toString(16).toUpperCase()];
  regs.forEach(function (r, i) { c.fillText(r, 14, s.h - 60 + i * 16); });
} };

/* --- Analyse : séries de Fourier qui convergent --- */
E.curves = { init: function (s) { s.T = 0; }, draw: function (c, s, dt) {
  s.T += dt / 1000; var N = 1 + Math.floor(s.T * 1.2) % 14, cy = s.h * .5, A = s.h * .26, k = 2 * PI / (s.w * .5); c.clearRect(0, 0, s.w, s.h);
  c.strokeStyle = rgba(s.ink, .25); c.lineWidth = 1; c.beginPath(); c.moveTo(0, cy); c.lineTo(s.w, cy); c.stroke();
  c.strokeStyle = rgba(s.ink, .18); c.setLineDash([4, 6]); c.beginPath(); for (var x = 0; x < s.w; x += 2) { var v = Math.sin(x * k) >= 0 ? 1 : -1; x ? c.lineTo(x, cy - v * A * .78) : c.moveTo(x, cy - v * A * .78); } c.stroke(); c.setLineDash([]);
  c.strokeStyle = s.acc; c.lineWidth = 2.6; c.shadowColor = s.acc; c.shadowBlur = 6; c.beginPath();
  for (x = 0; x < s.w; x += 2) { var y = 0; for (var n = 1; n <= 2 * N - 1; n += 2) y += Math.sin(n * x * k) / n; y *= 4 / PI; x ? c.lineTo(x, cy - y * A * .78) : c.moveTo(x, cy - y * A * .78); } c.stroke(); c.shadowBlur = 0;
  c.fillStyle = s.acc2; c.font = "italic 600 18px " + s.disp; c.fillText("S" + N + "(x) = (4/π) Σ sin((2k+1)x)/(2k+1)", 14, s.h - 22);
} };

/* --- Maths financières : courbe des intérêts composés + bougies --- */
E.ticker = { init: function (s) { s.T = 0; s.cd = []; var v = 100; for (var i = 0; i < 60; i++) { var o = v; v *= 1 + (R() - .44) * .06; s.cd.push([o, v, Math.max(o, v) * (1 + R() * .02), Math.min(o, v) * (1 - R() * .02)]); } }, draw: function (c, s, dt) {
  s.T += dt / 1000; c.clearRect(0, 0, s.w, s.h); var off = (s.T * 14) % 16, mn = Infinity, mx = -Infinity; s.cd.forEach(function (d) { mn = Math.min(mn, d[3]); mx = Math.max(mx, d[2]); });
  var Y = function (v) { return s.h * .85 - (v - mn) / (mx - mn) * s.h * .55; };
  s.cd.forEach(function (d, i) { var x = s.w - (s.cd.length - i) * 16 + off; if (x < -10) return; var up = d[1] >= d[0]; c.strokeStyle = c.fillStyle = up ? rgba(s.acc, .55) : rgba(s.acc2, .55); c.beginPath(); c.moveTo(x, Y(d[2])); c.lineTo(x, Y(d[3])); c.stroke(); c.fillRect(x - 4, Y(Math.max(d[0], d[1])), 8, Math.max(2, Math.abs(Y(d[0]) - Y(d[1])))); });
  if (off < 14 * dt / 1000 + .5) { var l = s.cd[s.cd.length - 1][1], v = l * (1 + (R() - .44) * .06); s.cd.push([l, v, Math.max(l, v) * 1.01, Math.min(l, v) * .99]); s.cd.shift(); }
  var k = (s.T % 6) / 6; c.strokeStyle = s.acc2; c.lineWidth = 2.5; c.shadowColor = s.acc2; c.shadowBlur = 10; c.beginPath();
  for (var x = 0; x <= s.w * k; x += 3) { var y = s.h * .9 - (Math.pow(1.095, x / s.w * 12) - 1) / (Math.pow(1.095, 12) - 1) * s.h * .7; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.shadowBlur = 0;
  c.fillStyle = s.acc2; c.font = "600 13px " + s.mono; c.fillText("Cn = C(1+i)^n   i = 9,5 %", 14, 24);
} };

/* --- Probabilités : planche de Galton --- */
E.galton = { init: function (s) { s.rows = 9; s.b = []; s.bins = new Array(s.rows + 1).fill(0); s.acc0 = 0; s.cx = s.w * (s.w > 600 ? .7 : .55); s.gap = Math.min(26, s.w / 22); }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); var g = s.gap, top = 26;
  for (var r = 0; r < s.rows; r++) for (var k = 0; k <= r; k++) { c.fillStyle = rgba(s.ink, .35); c.beginPath(); c.arc(s.cx + (k - r / 2) * g, top + r * g, 2.4, 0, TAU); c.fill(); }
  s.acc0 += dt; if (s.acc0 > 110) { s.acc0 = 0; s.b.push({ r: 0, k: 0, u: 0 }); }
  var by = top + s.rows * g + 8, maxb = Math.max.apply(null, s.bins) || 1, bh = s.h - by - 10;
  s.bins.forEach(function (n, i) { var x = s.cx + (i - s.rows / 2) * g, h = n / Math.max(maxb, 12) * bh; var gr = c.createLinearGradient(0, s.h, 0, s.h - h); gr.addColorStop(0, rgba(s.acc, .9)); gr.addColorStop(1, rgba(s.acc2, .9)); c.fillStyle = gr; c.fillRect(x - g * .38, s.h - 10 - h, g * .76, h); });
  s.b = s.b.filter(function (o) { o.u += dt / 120; while (o.u >= 1 && o.r < s.rows) { o.u -= 1; o.r++; if (R() < .5) o.k++; }
    if (o.r >= s.rows) { s.bins[o.k]++; return false; }
    var x0 = s.cx + (o.k - o.r / 2) * g, y0 = top + o.r * g, x1 = s.cx + (o.k + .5 - (o.r + 1) / 2) * g, x = lerp(x0, x1 + (R() < .5 ? -0 : 0), o.u), y = lerp(y0, y0 + g, o.u) - Math.sin(o.u * PI) * 6;
    c.fillStyle = s.acc2; c.shadowColor = s.acc2; c.shadowBlur = 10; c.beginPath(); c.arc(x, y - 6, 4, 0, TAU); c.fill(); c.shadowBlur = 0; return true; });
  if (maxb > 60) s.bins = s.bins.map(function (n) { return Math.floor(n * .5); });
  c.fillStyle = rgba(s.ink, .5); c.font = "12px " + s.mono; c.fillText("X ~ B(9 ; 0,5)  →  N(μ, σ)", 12, s.h - 16);
} };

/* --- Comptabilité : débit / crédit qui s'équilibrent --- */
E.ledger = { init: function (s) { s.T = 0; s.rows = [["601 Achats", 250000, 0], ["4452 TVA récup.", 45000, 0], ["401 Fournisseur", 0, 295000], ["521 Banque", 0, 0]]; }, draw: function (c, s, dt) {
  s.T += dt / 1000; var t = s.T % 8, W = Math.min(360, s.w * .7), x = s.w - W - 14, y = 26, lh = 30; c.clearRect(0, 0, s.w, s.h);
  c.strokeStyle = rgba(s.ink, .35); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + W, y + 6); c.moveTo(x + W * .55, y - 14); c.lineTo(x + W * .55, y + lh * 5); c.moveTo(x + W * .78, y - 14); c.lineTo(x + W * .78, y + lh * 5); c.stroke();
  c.font = "bold 12px " + s.mono; c.fillStyle = s.ink2; c.fillText("Compte", x, y); c.fillText("Débit", x + W * .58, y); c.fillText("Crédit", x + W * .8, y);
  var sd = 0, sc = 0; c.font = "13px " + s.mono;
  s.rows.forEach(function (r, i) { var k = Math.max(0, Math.min(1, t - i * .9)); if (!k || (!r[1] && !r[2])) return; var yy = y + lh * (i + 1); c.globalAlpha = k; c.fillStyle = s.ink; c.fillText(r[0], x, yy);
    var d = Math.round(r[1] * ease(k)), cr = Math.round(r[2] * ease(k)); sd += d; sc += cr; c.fillStyle = s.acc; if (r[1]) c.fillText(d.toLocaleString("fr-FR"), x + W * .57, yy); c.fillStyle = s.acc2; if (r[2]) c.fillText(cr.toLocaleString("fr-FR"), x + W * .79, yy); c.globalAlpha = 1; });
  var yy = y + lh * 4.4; c.strokeStyle = s.ink; c.beginPath(); c.moveTo(x + W * .55, yy - 18); c.lineTo(x + W, yy - 18); c.stroke(); c.font = "bold 13px " + s.mono; c.fillStyle = s.acc; c.fillText(sd.toLocaleString("fr-FR"), x + W * .57, yy); c.fillStyle = s.acc2; c.fillText(sc.toLocaleString("fr-FR"), x + W * .79, yy);
  var ok = sd === sc && sd > 0, tilt = ok ? 0 : Math.max(-.25, Math.min(.25, (sd - sc) / 300000)); var bx = x + W * .3, byy = y + lh * 6.4; c.save(); c.translate(bx, byy); c.rotate(tilt);
  c.strokeStyle = ok ? s.acc : s.ink2; c.lineWidth = 3; c.beginPath(); c.moveTo(-70, 0); c.lineTo(70, 0); c.stroke(); [-70, 70].forEach(function (p) { c.beginPath(); c.arc(p, 12, 16, 0, PI); c.stroke(); }); c.restore();
  c.fillStyle = ok ? s.acc : s.ink2; c.fillRect(bx - 2, byy, 4, 40); if (ok) { c.font = "bold 13px " + s.mono; c.fillText("ÉQUILIBRE ✓", bx - 44, byy + 58); }
} };

/* --- Gestion de projet : Gantt --- */
E.gantt = { init: function (s) { s.T = 0; s.tk = [[0, 3, 0], [3, 4, 1], [3, 2, 0], [7, 3, 1], [5, 2, 0], [10, 2, 1], [8, 3, 0]]; }, draw: function (c, s, dt) {
  s.T += dt / 1000; var t = s.T % 9, x0 = Math.max(16, s.w * .3), u = (s.w - x0 - 16) / 13, rh = Math.min(26, (s.h - 50) / s.tk.length); c.clearRect(0, 0, s.w, s.h);
  for (var d = 0; d <= 12; d++) { c.strokeStyle = rgba(s.ink, d % 3 ? .06 : .14); c.beginPath(); c.moveTo(x0 + d * u, 14); c.lineTo(x0 + d * u, 20 + s.tk.length * rh); c.stroke(); }
  s.tk.forEach(function (b, i) { var k = ease(Math.max(0, Math.min(1, (t - i * .45) * 1.6))); if (!k) return; var y = 22 + i * rh; c.fillStyle = b[2] ? s.acc : rgba(s.acc2, .75); rr(c, x0 + b[0] * u - (1 - k) * 40, y, b[1] * u * k, rh * .62, 5); c.fill();
    c.fillStyle = rgba(s.ink, .6); c.font = "11px " + s.mono; c.fillText("T" + (i + 1), x0 - 26, y + rh * .48); });
  var nx = x0 + (t / 9) * 12 * u; c.strokeStyle = s.acc; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(nx, 10); c.lineTo(nx, 26 + s.tk.length * rh); c.stroke(); c.setLineDash([]);
  c.fillStyle = s.acc; c.beginPath(); var my = 30 + s.tk.length * rh; c.moveTo(x0 + 12 * u, my - 8); c.lineTo(x0 + 12 * u + 8, my); c.lineTo(x0 + 12 * u, my + 8); c.lineTo(x0 + 12 * u - 8, my); c.fill();
  c.fillStyle = rgba(s.ink, .55); c.font = "11px " + s.mono; c.fillText("chemin critique", x0, my + 4);
} };

/* --- Communication & anglais : bulles --- */
E.bubbles = { init: function (s) { s.w2 = [["Bonjour", "Hello"], ["Réunion", "Meeting"], ["Rapport", "Report"], ["Merci", "Thank you"], ["Logiciel", "Software"], ["Réseau", "Network"], ["Échéance", "Deadline"], ["Compétence", "Skill"]]; s.b = []; s.acc0 = 0; }, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.acc0 += dt; if (s.acc0 > 1100) { s.acc0 = 0; var p = pick(s.w2); s.b.push({ x: s.w * (.3 + R() * .62), y: s.h + 30, t: R() < .5 ? p : [p[1], p[0]], v: .25 + R() * .25, a: 0, en: R() < .5 }); }
  s.b = s.b.filter(function (o) { o.y -= o.v * dt / 16; o.a += dt / 1000; var fl = o.a > 1.4 ? 1 : 0, txt = o.t[fl], f = Math.min(1, o.y / (s.h * .4)); c.globalAlpha = Math.max(0, f);
    c.font = "italic 700 17px " + s.disp; var w = c.measureText(txt).width + 28; c.fillStyle = fl ? s.acc : s.sheet; c.strokeStyle = s.acc; c.lineWidth = 1.5; rr(c, o.x - w / 2, o.y - 18, w, 34, 17); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(o.x - 6, o.y + 16); c.lineTo(o.x - 14, o.y + 26); c.lineTo(o.x + 4, o.y + 16); c.fill();
    c.fillStyle = fl ? s.paper : s.ink; c.textAlign = "center"; c.fillText(txt, o.x, o.y + 5); c.textAlign = "left"; c.globalAlpha = 1; return o.y > -40; });
} };

/* --- Docker : conteneurs qui s'empilent + docker ps en direct --- */
E.containers = { init: function (s) {
  s.cw = 58; s.chh = 26; s.cols = Math.max(3, Math.floor((s.w * .62) / (s.cw + 6))); s.stack = []; s.fall = null; s.acc0 = 0;
  s.names = ["nginx", "api", "redis", "mysql", "worker", "python", "node", "grafana"]; s.log = []; s.lk = 0;
}, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.acc0 += dt; var base = s.h - 18, x0 = s.w - (s.cols * (s.cw + 6)) - 10;
  c.strokeStyle = rgba(s.acc, .35); c.lineWidth = 1; c.beginPath(); c.moveTo(x0 - 8, base + 6); c.lineTo(s.w - 4, base + 6); c.stroke();
  if (!s.fall && s.acc0 > 700) { s.acc0 = 0;
    if (s.stack.length >= s.cols * Math.max(2, Math.floor((s.h - 60) / (s.chh + 4)))) s.stack = s.stack.slice(s.cols);
    var k = s.stack.length % s.cols, r = Math.floor(s.stack.length / s.cols), nm = pick(s.names);
    s.fall = { k: k, r: r, y: -30, n: nm, c: R() < .5 ? s.acc : s.acc2 };
    s.log.push("$ docker run -d --name " + nm + "-" + (100 + Math.floor(R() * 900)) + " " + nm + ":latest"); if (s.log.length > 7) s.log.shift(); }
  s.stack.forEach(function (o) { var x = x0 + o.k * (s.cw + 6), y = base - (o.r + 1) * (s.chh + 4);
    c.fillStyle = rgba(o.c, .16); c.strokeStyle = o.c; c.lineWidth = 1.4; rr(c, x, y, s.cw, s.chh, 3); c.fill(); c.stroke();
    c.strokeStyle = rgba(o.c, .45); for (var q = 1; q < 5; q++) { c.beginPath(); c.moveTo(x + q * s.cw / 5, y + 4); c.lineTo(x + q * s.cw / 5, y + s.chh - 4); c.stroke(); }
    c.fillStyle = s.ink; c.font = "9px " + s.mono; c.textAlign = "center"; c.fillText(o.n, x + s.cw / 2, y + s.chh / 2 + 3); c.textAlign = "left"; });
  if (s.fall) { var f = s.fall, ty = base - (f.r + 1) * (s.chh + 4); f.y += dt * .35; if (f.y >= ty) { f.y = ty; s.stack.push(f); s.fall = null; }
    else { var fx = x0 + f.k * (s.cw + 6); c.strokeStyle = rgba(s.ink2, .5); c.beginPath(); c.moveTo(fx + s.cw / 2, 0); c.lineTo(fx + s.cw / 2, f.y); c.stroke();
      c.fillStyle = rgba(f.c, .3); c.strokeStyle = f.c; rr(c, fx, f.y, s.cw, s.chh, 3); c.fill(); c.stroke(); } }
  c.font = "11px " + s.mono; s.log.forEach(function (l, i) { c.fillStyle = rgba(s.acc, .25 + .75 * (i + 1) / s.log.length); c.fillText(l.slice(0, Math.floor(s.w / 7.2)), 12, 22 + i * 17); });
} };

/* --- Python IA : réseau de neurones et propagation --- */
E.neural = { init: function (s) {
  var L = [4, 6, 6, 3], x0 = s.w * .38, x1 = s.w - 30; s.L = L.map(function (n, li) { var x = lerp(x0, x1, li / (L.length - 1)), arr = [];
    for (var i = 0; i < n; i++) arr.push({ x: x, y: s.h * (i + 1) / (n + 1), v: R() }); return arr; });
  s.p = []; s.acc0 = 0; s.code = ["import numpy as np", "model.fit(X, y)", "loss = mse(y, y_hat)", "w -= lr * grad", "for epoch in range(100):", "df = pd.read_csv('notes.csv')", "acc = 0.97 ✓", "print('Courage, futur ingénieur IA !')"]; s.ci = 0; s.ct = 0;
}, draw: function (c, s, dt) {
  c.clearRect(0, 0, s.w, s.h); s.acc0 += dt;
  if (s.acc0 > 260) { s.acc0 = 0; var li = 0, a = pick(s.L[0]); s.p.push({ li: li, a: a, b: pick(s.L[1]), t: 0 }); }
  for (var l = 0; l < s.L.length - 1; l++) s.L[l].forEach(function (a) { s.L[l + 1].forEach(function (b) { c.strokeStyle = rgba(s.ink2, .12); c.lineWidth = 1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }); });
  s.p = s.p.filter(function (p) { p.t += dt / 520; var x = lerp(p.a.x, p.b.x, ease(Math.min(1, p.t))), y = lerp(p.a.y, p.b.y, ease(Math.min(1, p.t)));
    c.strokeStyle = rgba(s.acc, .55); c.lineWidth = 1.6; c.beginPath(); c.moveTo(p.a.x, p.a.y); c.lineTo(x, y); c.stroke();
    c.fillStyle = s.acc2; c.shadowColor = s.acc2; c.shadowBlur = 10; c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.fill(); c.shadowBlur = 0;
    if (p.t >= 1) { p.b.v = 1; if (p.li + 2 < s.L.length) { s.p.push({ li: p.li + 1, a: p.b, b: pick(s.L[p.li + 2]), t: 0 }); } return false; } return true; });
  s.L.forEach(function (layer) { layer.forEach(function (n) { n.v = Math.max(.15, n.v - dt / 1600); c.fillStyle = rgba(s.acc, .15 + .7 * n.v); c.strokeStyle = s.acc; c.lineWidth = 1.4; c.beginPath(); c.arc(n.x, n.y, 7, 0, TAU); c.fill(); c.stroke(); }); });
  s.ct += dt; if (s.ct > 1600) { s.ct = 0; s.ci = (s.ci + 1) % s.code.length; }
  c.font = "12px " + s.mono; for (var i = 0; i < 6; i++) { var k = (s.ci + i) % s.code.length; c.fillStyle = rgba(i === 5 ? s.acc2 : s.acc, .2 + .14 * i); c.fillText(">>> " + s.code[k], 12, 24 + i * 19); }
} };

/* ---------- Pilote ---------- */
function mode() { return document.documentElement.dataset.motion || "full"; }
function mount(cv, name) {
  var fx = E[name]; if (!fx || !cv.getContext) return;
  var c = cv.getContext("2d"), s = {}, raf = 0, last = 0, vis = true, running = false;
  function colors() { s.acc = css("--acc"); s.acc2 = css("--acc2"); s.ink = css("--ink"); s.ink2 = css("--ink2"); s.paper = css("--paper"); s.sheet = css("--sheet"); s.mono = css("--f-c") || "monospace"; s.disp = css("--f-t") || "serif"; }
  function size() { var r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); s.w = r.width; s.h = r.height; cv.width = r.width * d; cv.height = r.height * d; c.setTransform(d, 0, 0, d, 0, 0); colors(); fx.init(s); }
  function frame(now) { if (!running) return; var dt = Math.min(64, now - (last || now)) * (window.PROFIL ? PROFIL.vitesse() : 1); last = now; fx.draw(c, s, dt); raf = requestAnimationFrame(frame); }
  function start() { if (running || mode() === "off" || !vis || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  size();
  if (mode() === "off") { for (var i = 0; i < 90; i++) fx.draw(c, s, 33); return; }
  if (mode() === "lite") { for (var j = 0; j < 120; j++) fx.draw(c, s, 33); return; }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; vis ? start() : stop(); }).observe(cv);
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); }, 200); });
  window.addEventListener("themechange", function () { colors(); fx.init(s); });
  start();
}
window.FX = { mount: mount, list: Object.keys(E) };
document.addEventListener("DOMContentLoaded", function () { [].forEach.call(document.querySelectorAll("canvas[data-fx]"), function (cv) { mount(cv, cv.dataset.fx); }); });
})();
