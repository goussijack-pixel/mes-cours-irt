// Service worker : le cœur de l'app (pages, styles, scripts, polices) est mis en cache à l'installation ;
// les documents originaux (scans, PDF) sont mis en cache à leur première ouverture, dans un cache séparé
// qui survit aux mises à jour (ou tous d'un coup avec « Tout télécharger pour le hors-ligne »).
const V = 'revisions-l2-44714b9934', D = 'revisions-docs-v1';
const FILES = ["./", "assets/app.css", "assets/docs-list.json", "assets/engine.js", "assets/fonts/caveat-vf.woff2", "assets/fonts/chakra-petch-400.woff2", "assets/fonts/chakra-petch-700.woff2", "assets/fonts/dm-serif-display-400.woff2", "assets/fonts/fira-code-vf.woff2", "assets/fonts/fira-sans-400.woff2", "assets/fonts/fira-sans-700.woff2", "assets/fonts/fraunces-vf.woff2", "assets/fonts/ibm-plex-mono-400.woff2", "assets/fonts/ibm-plex-mono-700.woff2", "assets/fonts/ibm-plex-sans-vf.woff2", "assets/fonts/instrument-serif-400.woff2", "assets/fonts/inter-tight-vf.woff2", "assets/fonts/lexend-vf.woff2", "assets/fonts/libre-baskerville-400.woff2", "assets/fonts/libre-baskerville-700.woff2", "assets/fonts/manrope-vf.woff2", "assets/fonts/nunito-vf.woff2", "assets/fonts/orbitron-vf.woff2", "assets/fonts/outfit-vf.woff2", "assets/fonts/playfair-display-vf.woff2", "assets/fonts/red-hat-display-vf.woff2", "assets/fonts/share-tech-mono-400.woff2", "assets/fonts/sora-vf.woff2", "assets/fonts/source-code-pro-vf.woff2", "assets/fonts/space-grotesk-vf.woff2", "assets/fonts/space-mono-400.woff2", "assets/fonts/space-mono-700.woff2", "assets/fonts/syne-vf.woff2", "assets/fonts/ubuntu-400.woff2", "assets/fonts/ubuntu-700.woff2", "assets/fonts/ubuntu-mono-400.woff2", "assets/fonts/ubuntu-mono-700.woff2", "assets/fonts/unbounded-vf.woff2", "assets/fonts/vt323-400.woff2", "assets/fx.js", "assets/game.js", "assets/hub-fonts.css", "assets/icon-192.png", "assets/icon-512.png", "assets/icon.svg", "assets/motiv.js", "assets/profil.js", "assets/sync.js", "assets/th-algo-c.css", "assets/th-assembleur.css", "assets/th-bdd-sql.css", "assets/th-cap-ia.css", "assets/th-comm-anglais.css", "assets/th-compta.css", "assets/th-cyber.css", "assets/th-dev-web.css", "assets/th-docker.css", "assets/th-electronique.css", "assets/th-git.css", "assets/th-hub.css", "assets/th-igp.css", "assets/th-java.css", "assets/th-linux.css", "assets/th-maths-analyse.css", "assets/th-maths-appliquees.css", "assets/th-maths-ia.css", "assets/th-poo.css", "assets/th-proba-ro.css", "assets/th-python-ia.css", "assets/th-reseaux.css", "assets/th-uml-merise.css", "assets/th-windows-server.css", "assets/th-xml.css", "formation.html", "guides/algo-c.html", "guides/assembleur.html", "guides/bdd-sql.html", "guides/cap-ia.html", "guides/comm-anglais.html", "guides/compta.html", "guides/cyber.html", "guides/dev-web.html", "guides/docker.html", "guides/electronique.html", "guides/git.html", "guides/igp.html", "guides/java.html", "guides/legacy-archi-pro.html", "guides/legacy-certifs-ia.html", "guides/legacy-docker.html", "guides/legacy-frameworks-web.html", "guides/legacy-igp.html", "guides/legacy-java.html", "guides/legacy-poo.html", "guides/legacy-python-ia.html", "guides/linux.html", "guides/maths-analyse.html", "guides/maths-appliquees.html", "guides/maths-ia.html", "guides/poo.html", "guides/proba-ro.html", "guides/python-ia.html", "guides/reseaux.html", "guides/uml-merise.html", "guides/windows-server.html", "guides/xml.html", "index.html", "manifest.webmanifest"];
const isDoc = u => new URL(u, self.location).pathname.indexOf('/docs/') >= 0;
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    for (let i = 0; i < FILES.length; i += 20) {
      await Promise.all(FILES.slice(i, i + 20).map(f => c.add(encodeURI(f)).catch(() => null)));
    }
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const d = await caches.open(D);
    for (const k of await caches.keys()) {
      if (k === V || k === D) continue;
      if (k.indexOf('revisions-l2-') === 0) {          // on garde les documents déjà téléchargés par l'ancienne version
        const old = await caches.open(k);
        for (const req of await old.keys()) if (isDoc(req.url)) { const r = await old.match(req); if (r) await d.put(req, r); }
      }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(isDoc(e.request.url) ? D : V);
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }
    catch (err) { const core = await caches.open(V); return (await core.match('./index.html')) || Response.error(); }
  })());
});
