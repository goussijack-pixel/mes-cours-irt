/* ===== MOTIVATION : notifications d'encouragement dans l'app (hors-ligne) =====
   Une notification glisse du haut de l'écran de temps en temps (au plus 3 par page, 4 min d'écart minimum),
   jamais deux fois le même message avant d'avoir vu toute la banque. Désactivable dans Réglages. */
(function () {
"use strict";
var M = [
 ["🔥", "Discipline", "La motivation te fait commencer. La discipline te fait finir. Ce soir, choisis la discipline."],
 ["🧠", "Petit mais tous les jours", "30 minutes par jour pendant un an = plus de 180 heures. C'est plus qu'un module complet de master."],
 ["🚀", "Ton futur toi", "L'ingénieur IA que tu veux devenir te regarde. Il te remercie pour chaque séance que tu fais maintenant."],
 ["💰", "Gagner de l'argent avec l'IA", "Les entreprises paient pour des problèmes résolus, pas pour des diplômes. Chaque projet terminé est une preuve que tu sais résoudre."],
 ["📈", "Intérêts composés", "Ton savoir fonctionne comme les intérêts composés de ton TD : 1 % de mieux chaque jour, c'est 37 fois mieux en un an."],
 ["🎯", "Objectif 14", "Chaque devoir compte. Un point gagné aujourd'hui, c'est une marche de plus vers l'université en France."],
 ["🌍", "Le monde t'attend", "Un ingénieur IA formé au Bénin peut travailler pour Paris, Londres ou New York depuis Cotonou. Ton talent n'a pas de frontière."],
 ["🧩", "Les maths", "Les maths ne sont pas ton ennemie : c'est le langage secret de l'IA. Chaque formule comprise est une clé de plus."],
 ["⚡", "Commence petit", "Tu n'as pas envie ? Fais seulement 5 minutes. Le plus dur, c'est d'ouvrir le cours ; la suite vient toute seule."],
 ["🏆", "Les meilleurs", "Les meilleurs ne sont pas ceux qui n'échouent jamais, ce sont ceux qui recommencent plus vite."],
 ["🛠️", "Construis", "Lire un cours, c'est bien. Coder un projet, c'est 10 fois mieux. Ouvre ton éditeur ce soir."],
 ["🌱", "Patience", "Le bambou pousse sous terre pendant des années, puis grandit de 20 mètres en quelques semaines. Tes efforts invisibles comptent."],
 ["🎓", "Doctorat", "Un docteur en IA a commencé exactement là où tu es : par des bases solides. Tu es en train de poser les fondations."],
 ["🤖", "Claude et ChatGPT", "Ces IA ont été construites par des gens qui ont commencé par un print(\"Hello\"). Toi aussi, tu es sur ce chemin."],
 ["💡", "Comprendre", "Ne retiens pas : comprends. Ce que tu comprends, tu ne l'oublies jamais vraiment."],
 ["⏳", "Le temps", "Dans un an, tu auras un an de plus. La seule question : avec quelles compétences ?"],
 ["🥇", "Premier de la classe", "Être premier, ce n'est pas être un génie : c'est réviser un peu plus régulièrement que les autres."],
 ["🧭", "Ta boussole", "Quand tu doutes, relis ton objectif : ingénieur IA, master en France, projets utiles pour le Bénin."],
 ["💪", "Pas abandonner", "Tu as le droit d'être fatigué. Repose-toi, mais n'abandonne pas."],
 ["📚", "Les épreuves", "Chaque épreuve corrigée de l'app, c'est un examen que tu as déjà vu avant le jour J."],
 ["🎮", "Niveau suivant", "Tu montes de niveau dans l'app comme dans la vie : un point d'XP à la fois."],
 ["🌟", "Fierté", "Regarde le chemin parcouru depuis la rentrée. Tu sais déjà des choses que tu ignorais en septembre."],
 ["🔑", "Python", "Python est la clé de l'IA. Chaque ligne que tu écris aujourd'hui t'ouvre une porte de plus demain."],
 ["🏗️", "Architecture logicielle", "Un modèle d'IA sans bon logiciel autour ne sert à rien. Ton option AL fait de toi quelqu'un de rare."],
 ["💼", "Le stage", "Les recruteurs cherchent quelqu'un qui apprend vite et termine ce qu'il commence. Ton GitHub le prouvera."],
 ["🧪", "L'erreur", "Une erreur est une donnée. Le machine learning apprend de ses erreurs : fais pareil."],
 ["🌙", "Le soir", "Ce soir, une séance d'une heure. Demain, tu seras content de l'avoir faite."],
 ["☀️", "Le matin", "Commence ta journée par une petite victoire : un quiz de 5 minutes."],
 ["📱", "Moins de défilement", "20 minutes de moins sur les réseaux, c'est un module Auto-IA de plus chaque jour."],
 ["🏃", "Le corps", "Bouge, dors, mange bien. Ton cerveau est la machine la plus importante de ton parcours."],
 ["🎯", "Une chose à la fois", "Ne pense pas aux 95 modules. Pense seulement au prochain."],
 ["🔁", "Révision espacée", "Revois aujourd'hui ce que tu as appris il y a une semaine : c'est le secret des mémoires d'éléphant."],
 ["💎", "Rareté", "Il y a beaucoup de développeurs. Il y a peu de développeurs qui comprennent les maths de l'IA. Deviens rare."],
 ["🧱", "Brique par brique", "Personne ne construit une maison en un jour, mais chaque jour on peut poser une brique."],
 ["🦁", "Courage", "Le courage, ce n'est pas ne pas avoir peur des maths. C'est ouvrir le cours quand même."],
 ["🌐", "Anglais", "L'anglais multiplie tes opportunités. Ton cours d'anglais du lundi, mercredi et vendredi est un investissement."],
 ["📊", "Ta moyenne", "Va voir ta jauge dans l'onglet Moyenne : que te faut-il pour atteindre ton objectif ?"],
 ["🧑‍🏫", "Explique", "Explique à un ami ce que tu as appris aujourd'hui. Si tu peux l'expliquer simplement, tu le maîtrises."],
 ["🏅", "Les certifications", "Une certification gratuite en moins d'un mois, c'est une ligne de plus sur ton CV avant le stage."],
 ["🧠", "Neurones", "À chaque exercice, ton cerveau renforce ses connexions, exactement comme un réseau de neurones qui s'entraîne."],
 ["💸", "Valeur", "Ton salaire futur sera proportionnel aux problèmes que tu sais résoudre. Entraîne-toi à résoudre."],
 ["🔭", "Vision", "Les grandes réussites commencent par une vision claire. La tienne : ingénieur IA reconnu, utile à son pays."],
 ["📝", "Note-le", "Écris chaque soir une chose apprise. Dans 6 mois, relis le carnet : tu seras impressionné."],
 ["⚙️", "Systèmes", "Ne compte pas sur la motivation : construis un système. Tes 4 soirs de formation sont ton système."],
 ["🎵", "Concentration", "25 minutes sans téléphone, puis 5 minutes de pause. Le Pomodoro fait des miracles."],
 ["🏔️", "La montée", "Si c'est difficile, c'est que tu montes. Les descentes sont faciles."],
 ["🤝", "Entraide", "Révise avec tes amis qui visent aussi l'IA. Seul on va vite, ensemble on va loin."],
 ["🧮", "Les probas", "Les probabilités sont le cœur de l'IA moderne. Chaque exercice de probas est un pas vers le machine learning."],
 ["📦", "Docker", "Un modèle dans une image Docker, c'est un modèle prêt pour la production. Tu apprends déjà ça en L2 !"],
 ["🌍", "Pour le Bénin", "Agriculture, santé, Mobile Money, langues locales : le Bénin a besoin d'ingénieurs IA. Pourquoi pas toi ?"],
 ["🛫", "Partir en France", "Le dossier pour l'université partenaire se construit maintenant, semestre après semestre."],
 ["💭", "Rêve et plan", "Un rêve sans plan reste un rêve. Ton plan est dans l'onglet Auto-IA."],
 ["🔥", "Série", "Ne casse pas ta série ! Une petite séance vaut mieux que zéro."],
 ["🧗", "Inconfort", "Tu progresses vraiment quand l'exercice te résiste un peu. C'est là que ton cerveau grandit."],
 ["📖", "Lire du code", "Lis le code des autres. Les meilleurs développeurs lisent autant qu'ils écrivent."],
 ["🎤", "Soutenance", "Chaque projet que tu termines est une soutenance que tu prépares déjà."],
 ["🧑‍💻", "Portfolio", "Ton GitHub est ton CV de développeur. Ajoute quelque chose cette semaine."],
 ["🏦", "Indépendance", "Une compétence rare, c'est une liberté : choisir où vivre, pour qui travailler, combien gagner."],
 ["🎓", "Expert", "Après le master, une spécialisation pointue fera de toi l'expert qu'on appelle quand c'est difficile."],
 ["💯", "15 de moyenne", "15, ce n'est pas réservé aux génies : c'est le résultat d'une méthode. Tu as la méthode dans cette app."],
 ["🤔", "Curiosité", "Pose-toi toujours la question : comment ça marche, vraiment ? C'est la question des ingénieurs."],
 ["📐", "Rigueur", "Une virgule mal placée, un signe oublié : la rigueur d'aujourd'hui évitera les bugs de demain."],
 ["🕹️", "Jeu", "Traite ta formation comme un jeu vidéo : chaque module est un niveau, chaque devoir un boss."],
 ["🌄", "Nouveau départ", "Hier, tu n'as rien fait ? Peu importe. Aujourd'hui est un nouveau départ."],
 ["🛡️", "Ne te compare pas", "Compare-toi à toi-même d'hier, jamais aux autres."],
 ["🎒", "Prêt", "Être prêt pour le stage, c'est avoir 2 projets publiés, 1 certification et un CV propre. Tu y arrives."],
 ["🧠", "Repos", "Dormir n'est pas perdre du temps : c'est pendant le sommeil que ton cerveau range ce que tu as appris."],
 ["🎯", "Priorités", "Commence par la matière au plus gros coefficient. C'est là que chaque point vaut le plus."],
 ["🔋", "Énergie", "Fatigué après l'anglais ? Les lundis, mercredis et vendredis, une simple relecture de mémo suffit."],
 ["🌊", "Régularité", "La goutte d'eau creuse la pierre, non par sa force, mais par sa régularité."],
 ["🧠", "Deep learning", "Le deep learning, c'est des multiplications de matrices et une descente de gradient. Tu les as déjà vues !"],
 ["💬", "Pose des questions", "Il n'y a pas de question bête. Il y a seulement des questions qu'on n'a pas osé poser."],
 ["🏆", "Petite victoire", "Valide un seul module aujourd'hui. Les grandes victoires sont faites de petites victoires."],
 ["🔍", "Détails", "Les meilleurs ingénieurs vérifient tout deux fois. Relis tes copies avant de les rendre."],
 ["🚪", "Opportunités", "Les opportunités arrivent à ceux qui sont prêts. Prépare-toi maintenant pour qu'elles te trouvent."],
 ["⛰️", "Persévérance", "Tous ceux qui ont réussi ont eu envie d'abandonner au moins une fois. Ils ne l'ont pas fait."],
 ["🧑‍🔬", "Recherche", "Un jour, tu liras des articles de recherche en IA. Aujourd'hui, chaque chapitre te rapproche de ce jour."],
 ["📅", "Planifie", "Regarde ton calendrier : quels sont tes 4 soirs de formation cette semaine ?"],
 ["💡", "Idée de projet", "Ouvre l'onglet Projets de l'Auto-IA : 115 idées t'attendent, du plus simple au plus ambitieux."],
 ["🌟", "Crois en toi", "Tu es capable de bien plus que ce que tu imagines. Les résultats viendront avec le travail."],
 ["🧭", "Cap", "Le cap est fixé : réussir l'école ET devenir ingénieur IA. Les deux en même temps, c'est possible."],
 ["⏱️", "Une heure", "Une heure par soir, 4 fois par semaine, pendant 3 ans : plus de 600 heures de formation en IA. Énorme."],
 ["🔥", "Envie", "Rappelle-toi pourquoi tu as commencé."],
 ["🎓", "Diplôme", "Le diplôme ouvre la porte. Les compétences te font rester et monter."],
 ["💼", "Freelance", "Avec des compétences solides en IA, tu pourras proposer des missions aux entreprises, même pendant tes études."],
 ["🧠", "Mémo", "Avant de dormir, relis un mémo de 2 minutes. Ton cerveau travaillera pendant la nuit."],
 ["🎯", "Focus", "Une seule matière à la fois. Le multitâche est l'ennemi de l'apprentissage."],
 ["🌱", "Croissance", "Tu n'es pas « nul en maths » : tu n'es simplement pas encore fort en maths. « Pas encore » change tout."],
 ["🚀", "Décollage", "Tout grand projet commence par un premier module. Le tien est peut-être ce soir."],
 ["🏁", "Finir", "Mieux vaut un projet modeste terminé qu'un projet génial abandonné."],
 ["🧠", "Bases", "Les bases solides font les experts. Ne saute jamais une notion que tu n'as pas comprise."],
 ["💸", "Investissement", "Le meilleur investissement que tu puisses faire, c'est en toi-même. Chaque heure d'étude rapporte."],
 ["🌍", "Impact", "Imagine une IA qui aide les agriculteurs du Bénin à protéger leurs récoltes. Tu peux la construire."],
 ["📈", "Progrès", "Ne cherche pas la perfection, cherche le progrès."],
 ["🧑‍🎓", "Fierté de tes parents", "Chaque note que tu améliores, c'est un sourire de plus pour ceux qui croient en toi."],
 ["🔓", "Débloque", "Bloqué sur un exercice ? Relis la notion, fais un dessin, puis réessaie. C'est comme ça qu'on apprend."],
 ["🏅", "Badge", "Un devoir validé = un badge. Combien en auras-tu à la fin du semestre ?"],
 ["🌠", "Ambition", "Vise la lune. Même si tu la manques, tu atterriras parmi les étoiles."],
 ["🧠", "Tu es capable", "{p}, tu es plus capable que tu ne le crois. Continue."],
 ["🔥", "Aujourd'hui", "{p}, la meilleure version de toi est en train de se construire. Une séance à la fois."]
];
var KEY = "rev:motiv", GK = "rev:global";
function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function on() { return load(GK, {}).motiv !== false; }
var shown = 0, timer = null, CSS = ".mv{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));z-index:700;width:min(440px,calc(100% - 20px));transform:translate(-50%,-140%);display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 12px 14px 14px;border-radius:20px;background:color-mix(in srgb,#0E1226 92%,transparent);color:#EEF1FF;border:1px solid #2F3670;box-shadow:0 20px 50px -20px #000,0 0 0 1px rgba(124,92,255,.15);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:transform .9s cubic-bezier(.2,.9,.2,1.1);font-family:var(--f-x,system-ui);overflow:hidden;cursor:pointer}" +
  ".mv.in{transform:translate(-50%,0)}.mv .e{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:1.4rem;background:linear-gradient(135deg,#7C5CFF,#22D3EE);animation:mvPop 1.2s cubic-bezier(.2,.9,.2,1.4)}" +
  "@keyframes mvPop{from{transform:scale(0) rotate(-30deg)}}.mv b{display:block;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#A5B4FC}.mv p{margin:2px 0 0;font-size:.88rem;line-height:1.35}.mv .x{background:none;border:0;color:#7C86B0;font-size:1.2rem;cursor:pointer;padding:4px 6px}" +
  ".mv i{position:absolute;left:0;bottom:0;height:3px;width:100%;background:linear-gradient(90deg,#7C5CFF,#22D3EE);transform-origin:left;animation:mvBar 12s linear forwards}@keyframes mvBar{to{transform:scaleX(0)}}";
function show() {
  if (!on() || shown >= 3 || document.hidden || document.querySelector(".mv, .pf-ov, .intro:not([hidden]), .boot, .reward")) return;
  var st = load(KEY, { last: 0, seen: [] });
  if (Date.now() - st.last < 4 * 60e3) return;
  var pool = M.map(function (_, i) { return i; }).filter(function (i) { return st.seen.indexOf(i) < 0; });
  if (!pool.length) { st.seen = []; pool = M.map(function (_, i) { return i; }); }
  var i = pool[Math.floor(Math.random() * pool.length)], m = M[i], pr = window.PROFIL && PROFIL.get(), name = (pr && pr.prenom) || "Champion";
  st.seen.push(i); st.last = Date.now(); save(KEY, st); shown++;
  if (!document.getElementById("mv-css")) { var s = document.createElement("style"); s.id = "mv-css"; s.textContent = CSS; document.head.appendChild(s); }
  var d = document.createElement("div"); d.className = "mv"; d.setAttribute("role", "status");
  d.innerHTML = '<span class="e">' + m[0] + '</span><div><b>' + m[1] + '</b><p></p></div><button class="x" aria-label="Fermer">✕</button><i></i>';
  d.querySelector("p").textContent = m[2].replace("{p}", name);
  document.body.appendChild(d); requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add("in"); }); });
  if (window.PROFIL) PROFIL.sfx("chime");
  var close = function () { d.classList.remove("in"); setTimeout(function () { d.remove(); }, 1000); };
  d.addEventListener("click", close); setTimeout(close, 12000 * (window.PROFIL && PROFIL.lent ? PROFIL.lent() : 1));
}
function plan(ms) { clearTimeout(timer); timer = setTimeout(function () { show(); plan(5 * 60e3); }, ms); }
document.addEventListener("visibilitychange", function () { if (!document.hidden) plan(20000); });
plan(document.querySelector("[data-intro]") ? 16000 : 12000);
window.MOTIV = { show: function () { var st = load(KEY, {}); st.last = 0; save(KEY, st); shown = 0; show(); }, count: M.length };
})();
