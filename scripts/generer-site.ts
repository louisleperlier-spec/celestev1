/**
 * Site public de NÉA (hébergement Expo, `npm run site`) : accueil, Confidentialité, Conditions, Support.
 * Les pages légales reprennent mot pour mot les textes de l'app (src/data/legal.ts) : URL exigées par l'App Store.
 * L'accueil (`site/index.html`) peut être remplacé par une page faite à la main : il n'est créé que s'il manque.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CONDITIONS, CONFIDENTIALITE, type SectionLegale } from '../src/data/legal';

const DOSSIER = join(__dirname, '..', 'site');
const COURRIEL = 'nea.coach.app@gmail.com';
const MAJ = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

const echapper = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const STYLE = `
:root{--bg:#1D1E23;--carte:#2D3038;--txt:#F5F5F7;--txt2:#ADB0BA;--or:#FF6B1A}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--txt);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:var(--or);text-decoration:none}a:hover{text-decoration:underline}
.page{max-width:760px;margin:0 auto;padding:28px 20px 60px}
.haut{display:flex;align-items:center;gap:12px;margin-bottom:28px}.haut img{width:44px;height:44px;border-radius:12px}
.marque{font-weight:800;letter-spacing:.3em;font-size:18px}
h1{font-size:clamp(30px,6vw,44px);font-weight:900;line-height:1.1;margin-bottom:8px}
.maj{color:var(--txt2);font-size:14px;margin-bottom:28px}
section{background:var(--carte);border-radius:20px;padding:18px 20px;margin-bottom:12px}
h2{font-size:17px;font-weight:700;margin-bottom:6px;color:var(--or)}
p{color:#DCDDE2;font-size:15.5px}
footer{color:var(--txt2);font-size:13.5px;text-align:center;padding:30px 20px 40px}footer a{margin:0 8px}
`;

function gabarit(titre: string, corps: string): string {
  return `<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titre} · NÉA Coach</title><meta name="theme-color" content="#1D1E23"><link rel="icon" href="img/icone.png"><style>${STYLE}</style></head>
<body><div class="page"><a class="haut" href="index.html"><img src="img/icone.png" alt=""><span class="marque">NÉA</span></a>${corps}</div>
<footer><a href="index.html">Accueil</a><a href="confidentialite.html">Confidentialité</a><a href="conditions.html">Conditions</a><a href="support.html">Support</a>
<br><br>NÉA, application éditée par Louis Leperlier, Québec, Canada · <a href="mailto:${COURRIEL}">${COURRIEL}</a></footer></body></html>`;
}

const sections = (s: readonly SectionLegale[]) => s.map(([h, p]) => `<section><h2>${echapper(h)}</h2><p>${echapper(p)}</p></section>`).join('\n');

const legale = (titre: string, s: readonly SectionLegale[]) =>
  gabarit(titre, `<h1>${titre}</h1><p class="maj">Dernière mise à jour : ${MAJ}</p>${sections(s)}`);

const SUPPORT: SectionLegale[] = [
  ['Nous écrire', `Une question, un bogue, une idée ? Écris-nous à ${COURRIEL} : on te répond en général sous 48 h.`],
  ['Supprimer ton compte', 'Dans l’app : Profil → Abonnement et compte → Supprimer mon compte. Toutes tes données sont effacées de façon définitive.'],
  ['Gérer ton abonnement NÉA Plus', 'Sur ton iPhone : Réglages → ton nom → Abonnements → NÉA Coach. Tu peux y annuler le renouvellement automatique au moins 24 h avant la fin de la période en cours.'],
  ['Apple Santé et Apple Watch', 'Pour la VFC, le sommeil et la fréquence cardiaque, autorise NÉA dans l’app Santé → Partage → Apps → NÉA Coach. L’app de la montre s’installe depuis l’app Watch de l’iPhone.'],
  ['Notifications', 'Active-les dans Réglages → Notifications → NÉA Coach, puis choisis tes alertes dans l’app : Profil → Alertes santé.'],
];

const ACCUEIL = gabarit(
  'Ton coach. Ton rythme.',
  `<h1>Ton coach.<br><span style="color:var(--or)">Ton rythme.</span></h1>
<p class="maj">Programme sur mesure, séances guidées rep par rep et récupération suivie avec ton Apple Watch. Bientôt sur l’App Store.</p>
<img src="img/axel.webp" alt="Axel, coach NÉA" style="display:block;height:280px;margin:10px auto 24px">
<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:12px">${[1, 2, 3, 4, 5]
    .map((i) => `<img src="img/ecran${i}.webp" alt="" style="height:420px;border-radius:18px">`)
    .join('')}</div>`,
);

mkdirSync(DOSSIER, { recursive: true });
writeFileSync(join(DOSSIER, 'confidentialite.html'), legale('Politique de confidentialité', CONFIDENTIALITE));
writeFileSync(join(DOSSIER, 'conditions.html'), legale("Conditions d'utilisation", CONDITIONS));
writeFileSync(join(DOSSIER, 'support.html'), gabarit('Support', `<h1>Support</h1><p class="maj">On est là pour t’aider.</p>${sections(SUPPORT)}`));
if (!existsSync(join(DOSSIER, 'index.html'))) writeFileSync(join(DOSSIER, 'index.html'), ACCUEIL);
console.log('Site généré dans site/');
