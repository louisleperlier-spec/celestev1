#!/usr/bin/env node
// La Recette — generate-assets
// -----------------------------------------------------------------------------
// Le mécanisme RÉEL de génération des assets d'une app iOS, sans simulateur ni
// Photoshop. Deux pipelines :
//
//   1) icon   — à partir d'UNE source vectorielle ou raster (SVG, ou PNG 1024²),
//               produit l'icône App Store (1024² opaque), l'icône adaptative
//               Android, le logo de splash, le favicon web + le snippet app.json.
//
//   2) screenshots — à partir de VRAIES captures (device / Expo Go), les encadre
//               (coins arrondis, marge, légende localisée, cadre optionnel) et les
//               compose aux tailles Apple EXACTES (ex. 1290×2796), par langue.
//
// Ce que ce script NE fait PAS (et ne prétend jamais faire) : inventer une capture
// d'écran qui n'existe pas. Pas de device / pas de capture ⇒ le skill `assets`
// bascule en « capture guidée » (Claude guide l'humain écran par écran), JAMAIS en
// faux mockup (guideline Apple 2.3).
//
// Dépendance : `sharp` (traitement d'image natif). Il n'est PAS livré avec La Recette
// (node_modules est gitignore → absent chez le client). C'est donc une étape EXPLICITE
// du pipeline : installe-le dans le dossier de l'app avant de générer les assets —
//   npm i sharp        (compilation native : compter 1-2 min la 1re fois)
// Si l'install échoue (proxy/réseau/toolchain), le skill `assets` REQUALIFIE en
// « capture guidée » plutôt que de mentir sur une génération impossible.
//
// Cross-platform : Node ESM pur, chemins via `node:path`, zéro bash-isme.
//
// Exemples :
//   node scripts/generate-assets.mjs icon --src ./brand/icon.svg --out ./assets/images
//   node scripts/generate-assets.mjs screenshots --in ./raw --lang fr --size 1290x2796 \
//        --captions ./captions.json --bg "#0C0C0F" --caption-color "#F2F2F7"
//   node scripts/generate-assets.mjs sizes
// -----------------------------------------------------------------------------

import {
  mkdirSync, existsSync, readdirSync, readFileSync, statSync,
} from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// ---- Petit parseur d'arguments -----------------------------------------------

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true; // flag booléen
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function die(msg) {
  console.error(`\n  ✖ ${msg}\n`);
  process.exit(1);
}

// ---- Chargement de sharp (depuis plusieurs emplacements probables) -----------

function loadSharp(appDir) {
  const require = createRequire(import.meta.url);
  // `sharp` n'est PAS livré par La Recette (node_modules gitignore) → on le cherche
  // là où il aura été installé côté app/cwd. Aucune « présence garantie » ici.
  const candidates = [
    'sharp', // si installé dans le cwd / hoisté
    appDir ? path.join(appDir, 'node_modules', 'sharp') : null,
    path.join(process.cwd(), 'node_modules', 'sharp'),
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      const mod = require(c);
      return mod.default || mod;
    } catch { /* on tente le suivant */ }
  }
  die(
    'Le module « sharp » n\'est pas installé.\n' +
    '    Installe-le dans le dossier de ton app (étape normale du pipeline assets) :\n' +
    '        npm i sharp\n' +
    '    ⏳ C\'est une lib native : compte 1-2 min de compilation la 1re fois, c\'est normal.\n' +
    '    Si l\'install échoue (proxy/réseau/toolchain), on ne bloque pas : on bascule en\n' +
    '    « capture guidée » (voir le skill `assets`) — Claude génère l\'icône autrement / te\n' +
    '    guide écran par écran, plutôt que de promettre une génération impossible.'
  );
}

// ---- Tailles de screenshots Apple (portrait, en pixels) ----------------------
// Références App Store Connect 2024-2026. À recroiser avec la doc live avant une
// vraie soumission — Apple fait évoluer ses exigences.

const APPLE_SIZES = {
  // iPhone — le set 6.9"/6.7" est le socle exigé aujourd'hui.
  '6.9':  { w: 1290, h: 2796, label: 'iPhone 6.9"/6.7" (16 Pro Max, 15 Pro Max, 14 Plus…)' },
  '6.9b': { w: 1320, h: 2868, label: 'iPhone 6.9" (variante 16 Pro Max)' },
  '6.5':  { w: 1242, h: 2688, label: 'iPhone 6.5" (11 Pro Max, XS Max)' },
  '5.5':  { w: 1242, h: 2208, label: 'iPhone 5.5"' },
  // iPad — requis seulement si l'app supporte l'iPad.
  'ipad13': { w: 2064, h: 2752, label: 'iPad 13" (M4)' },
  'ipad129': { w: 2048, h: 2732, label: 'iPad 12.9"' },
};

function resolveSize(sizeArg) {
  if (!sizeArg || sizeArg === true) return { w: 1290, h: 2796 }; // défaut = 6.9"/6.7"
  if (APPLE_SIZES[sizeArg]) return APPLE_SIZES[sizeArg];
  const m = String(sizeArg).toLowerCase().match(/^(\d+)x(\d+)$/);
  if (!m) die(`Taille invalide : « ${sizeArg} ». Utilise WxH (ex. 1290x2796) ou un preset (voir « sizes »).`);
  return { w: parseInt(m[1], 10), h: parseInt(m[2], 10) };
}

// ---- Utilitaires -------------------------------------------------------------

function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }

function isSvg(file) { return path.extname(file).toLowerCase() === '.svg'; }

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Charge une source (SVG rasterisé à haute densité, ou raster tel quel) → sharp.
function loadSource(sharp, srcPath) {
  if (!existsSync(srcPath)) die(`Source introuvable : ${srcPath}`);
  const buf = readFileSync(srcPath);
  if (isSvg(srcPath)) {
    // Densité élevée pour rasteriser net à 1024 même si le viewBox est petit.
    return sharp(buf, { density: 512 });
  }
  return sharp(buf);
}

// Découpe un texte en lignes qui tiennent dans maxWidth (heuristique de largeur
// de glyphe ~0.55·fontSize). Simple, robuste, sans dépendance de mesure de police.
function wrapText(text, fontSize, maxWidth, maxLines = 3) {
  const charW = fontSize * 0.55;
  const maxChars = Math.max(6, Math.floor(maxWidth / charW));
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = w;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines);
}

// ============================================================================
// PIPELINE 1 — ICÔNE + SPLASH
// ============================================================================

async function cmdIcon(flags) {
  const src = flags.src || flags.source;
  if (!src) die('Donne la source :  --src ./brand/icon.svg   (SVG vectoriel, ou PNG carré 1024×1024)');
  const appDir = flags.app ? path.resolve(flags.app) : null;
  const outDir = path.resolve(flags.out || './assets/images');
  const bg = flags.bg || '#FFFFFF';           // fond opaque de l'icône App Store
  const splashBg = flags['splash-bg'] || bg;  // couleur d'écran splash

  const sharp = loadSharp(appDir);
  ensureDir(outDir);

  // Avertit si la source raster n'est pas carrée (l'icône DOIT l'être).
  if (!isSvg(src)) {
    const meta = await loadSource(sharp, src).metadata();
    if (meta.width !== meta.height) {
      console.warn(`  ⚠️  La source n'est pas carrée (${meta.width}×${meta.height}). L'icône iOS doit être 1:1 — recadre-la.`);
    }
    if ((meta.width || 0) < 1024) {
      console.warn(`  ⚠️  Source de ${meta.width}px : sous 1024, l'icône App Store sera floue. Fournis du 1024² (ou du SVG).`);
    }
  }

  const outputs = [];

  // 1) Icône App Store / app — 1024², OPAQUE (Apple refuse l'alpha sur l'icône).
  await loadSource(sharp, src)
    .resize(1024, 1024, { fit: 'cover' })
    .flatten({ background: bg })
    .png()
    .toFile(path.join(outDir, 'icon.png'));
  outputs.push('icon.png            1024×1024  (opaque — icône App Store & app)');

  // 2) Icône adaptative Android — foreground, alpha conservé (marge de sécurité).
  await loadSource(sharp, src)
    .resize(864, 864, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 80, bottom: 80, left: 80, right: 80, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outDir, 'adaptive-icon.png'));
  outputs.push('adaptive-icon.png   1024×1024  (Android, transparent, avec marge)');

  // 3) Logo de splash — centré, transparent, pour se poser sur `backgroundColor`.
  await loadSource(sharp, src)
    .resize(576, 576, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 224, bottom: 224, left: 224, right: 224, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outDir, 'splash-icon.png'));
  outputs.push('splash-icon.png     1024×1024  (logo de splash, transparent)');

  // 4) Favicon web.
  await loadSource(sharp, src)
    .resize(48, 48, { fit: 'cover' })
    .flatten({ background: bg })
    .png()
    .toFile(path.join(outDir, 'favicon.png'));
  outputs.push('favicon.png         48×48      (web)');

  const rel = (name) => `./${path.relative(appDir || process.cwd(), path.join(outDir, name)).split(path.sep).join('/')}`;

  console.log(`\n  ✅ Assets d'icône générés dans : ${outDir}\n`);
  for (const o of outputs) console.log(`     • ${o}`);
  console.log(`
  À brancher dans app.json / app.config.js (Expo SDK 54) :

  {
    "expo": {
      "icon": "${rel('icon.png')}",
      "web": { "favicon": "${rel('favicon.png')}" },
      "android": {
        "adaptiveIcon": {
          "foregroundImage": "${rel('adaptive-icon.png')}",
          "backgroundColor": "${splashBg}"
        }
      },
      "plugins": [
        ["expo-splash-screen", {
          "image": "${rel('splash-icon.png')}",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "${splashBg}"
        }]
      ]
    }
  }

  Après branchement : self-verify (tsc --noEmit + expo export) puis /preview pour voir le boot réel.
`);
}

// ============================================================================
// PIPELINE 2 — SCREENSHOTS APP STORE
// ============================================================================

// Compose UNE capture sur un canvas WxH : fond, légende, coins arrondis, cadre opt.
async function composeShot(sharp, inputPath, opts) {
  const { W, H, bg, caption, captionColor, margin, radius, topBand, frameBuf } = opts;

  // Zone de contenu (sous la bande de légende).
  const contentTop = caption ? topBand : margin;
  const availW = W - margin * 2;
  const availH = H - contentTop - margin;

  // 1) Capture redimensionnée pour tenir dans la zone (aspect préservé).
  let shot = sharp(inputPath).rotate(); // respecte l'orientation EXIF
  shot = shot.resize(availW, availH, { fit: 'inside', withoutEnlargement: false });
  let shotBuf = await shot.png().toBuffer();
  let m = await sharp(shotBuf).metadata();
  let sw = m.width, sh = m.height;

  // 2) Coins arrondis (masque SVG en dest-in).
  const r = Math.min(radius, Math.floor(Math.min(sw, sh) / 2));
  const maskSvg = `<svg width="${sw}" height="${sh}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${sw}" height="${sh}" rx="${r}" ry="${r}" fill="#fff"/></svg>`;
  shotBuf = await sharp(shotBuf)
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const layers = [];
  const left = margin + Math.floor((availW - sw) / 2);
  const top = contentTop + Math.floor((availH - sh) / 2);
  layers.push({ input: shotBuf, top, left });

  // 3) Cadre device optionnel (PNG à écran transparent), aligné sur la capture.
  if (frameBuf) {
    const framed = await sharp(frameBuf)
      .resize(sw + Math.round(sw * 0.06), sh + Math.round(sh * 0.06), { fit: 'fill' })
      .png()
      .toBuffer();
    const fm = await sharp(framed).metadata();
    layers.push({
      input: framed,
      top: contentTop + Math.floor((availH - fm.height) / 2),
      left: margin + Math.floor((availW - fm.width) / 2),
    });
  }

  // 4) Légende localisée (texte vectoriel en SVG, centré dans la bande du haut).
  if (caption) {
    const fontSize = Math.round(W * 0.045);
    const lineH = Math.round(fontSize * 1.2);
    const lines = wrapText(caption, fontSize, W - margin * 2, 3);
    const blockH = lines.length * lineH;
    const startY = Math.round((topBand - blockH) / 2) + Math.round(fontSize * 0.8);
    const tspans = lines.map((ln, i) =>
      `<tspan x="${W / 2}" y="${startY + i * lineH}">${xmlEscape(ln)}</tspan>`
    ).join('');
    const textSvg =
      `<svg width="${W}" height="${topBand}" xmlns="http://www.w3.org/2000/svg">` +
      `<text text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" ` +
      `font-size="${fontSize}" font-weight="700" fill="${captionColor}">${tspans}</text></svg>`;
    layers.push({ input: Buffer.from(textSvg), top: 0, left: 0 });
  }

  return sharp({ create: { width: W, height: H, channels: 4, background: bg } })
    .composite(layers)
    .png()
    .toBuffer();
}

function loadCaptions(flags) {
  if (!flags.captions || flags.captions === true) return null;
  const p = path.resolve(flags.captions);
  if (!existsSync(p)) die(`Fichier de légendes introuvable : ${p}`);
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { die(`Légendes JSON invalides (${p}) : ${e.message}`); }
}

// Résout la légende d'un fichier donné, en supportant un JSON plat OU par langue.
function captionFor(captions, lang, fileName) {
  if (!captions) return null;
  const base = captions[lang] && typeof captions[lang] === 'object' ? captions[lang] : captions;
  return base[fileName] || base[path.parse(fileName).name] || null;
}

const IMG_RE = /\.(png|jpe?g|webp)$/i;

async function cmdScreenshots(flags) {
  const inDir = path.resolve(flags.in || flags.input || die('Donne le dossier des captures : --in ./raw'));
  if (!existsSync(inDir)) die(`Dossier de captures introuvable : ${inDir}`);
  const appDir = flags.app ? path.resolve(flags.app) : null;
  const outRoot = path.resolve(flags.out || './assets/store/screenshots');
  const size = resolveSize(flags.size);
  const bg = flags.bg || '#F2F2F6';
  const captionColor = flags['caption-color'] || '#1C1C1E';
  const margin = parseInt(flags.margin || Math.round(size.w * 0.075), 10);
  const radius = parseInt(flags.radius || Math.round(size.w * 0.037), 10);
  const topBand = parseInt(flags.top || (flags['no-caption'] ? margin : Math.round(size.h * 0.11)), 10);
  const frameBuf = flags.frame && flags.frame !== true && existsSync(path.resolve(flags.frame))
    ? readFileSync(path.resolve(flags.frame)) : null;

  const sharp = loadSharp(appDir);
  const captions = loadCaptions(flags);

  // Détermine les langues : --lang explicite, sinon les sous-dossiers, sinon 'en'.
  let jobs = []; // { lang, files: [absPath] }
  if (flags.lang && flags.lang !== true) {
    const files = readdirSync(inDir).filter((f) => IMG_RE.test(f));
    jobs.push({ lang: flags.lang, dir: inDir, files });
  } else {
    const subdirs = readdirSync(inDir).filter((f) => {
      try { return statSync(path.join(inDir, f)).isDirectory(); } catch { return false; }
    });
    if (subdirs.length) {
      for (const d of subdirs) {
        const dir = path.join(inDir, d);
        jobs.push({ lang: d, dir, files: readdirSync(dir).filter((f) => IMG_RE.test(f)) });
      }
    } else {
      jobs.push({ lang: 'en', dir: inDir, files: readdirSync(inDir).filter((f) => IMG_RE.test(f)) });
    }
  }

  const totalFiles = jobs.reduce((n, j) => n + j.files.length, 0);
  if (totalFiles === 0) {
    die(
      `Aucune capture trouvée dans ${inDir}.\n` +
      "    Ce script ENCADRE de vraies captures — il n'en invente pas.\n" +
      "    Pas de capture ⇒ passe en « capture guidée » (voir le skill `assets`) : Claude te dit,\n" +
      "    écran par écran, quoi capturer sur ton iPhone (Expo Go ou build réel), puis relance ici."
    );
  }

  let made = 0;
  for (const job of jobs) {
    const outDir = path.join(outRoot, job.lang);
    ensureDir(outDir);
    const files = job.files.sort();
    for (const f of files) {
      const caption = flags['no-caption'] ? null : captionFor(captions, job.lang, f);
      const out = await composeShot(sharp, path.join(job.dir, f), {
        W: size.w, H: size.h, bg, caption, captionColor, margin, radius, topBand, frameBuf,
      });
      const outName = `${path.parse(f).name}.png`;
      await sharp(out).toFile(path.join(outDir, outName));
      made++;
      console.log(`     • ${job.lang}/${outName}   ${size.w}×${size.h}${caption ? '   « ' + caption + ' »' : ''}`);
    }
  }

  console.log(`
  ✅ ${made} screenshot(s) composé(s) à ${size.w}×${size.h} dans : ${outRoot}
     Langues : ${jobs.map((j) => j.lang).join(', ')}

  Rappel Apple 2.3 : ces images doivent rester FIDÈLES à la vraie app (ce sont de vraies captures
  encadrées — pas de mockup trompeur). Place-les dans App Store Connect via /app-store (GATE 2b).
`);
}

// ============================================================================
// AIDE / TAILLES
// ============================================================================

function cmdSizes() {
  console.log('\n  Tailles de screenshots Apple (portrait) — presets acceptés par --size :\n');
  for (const [key, s] of Object.entries(APPLE_SIZES)) {
    console.log(`     --size ${key.padEnd(8)} ${String(s.w + '×' + s.h).padEnd(11)} ${s.label}`);
  }
  console.log(`
  Défaut si --size absent : 1290×2796 (le socle iPhone 6.9"/6.7" exigé aujourd'hui).
  Tu peux aussi passer une taille brute :  --size 1290x2796
  ⚠️  Recroise TOUJOURS avec App Store Connect live avant soumission — Apple fait évoluer les exigences.
`);
}

function usage() {
  console.log(`
  La Recette — generate-assets

  Icône + splash (à partir d'une source SVG vectorielle, ou d'un PNG carré 1024²) :
    node scripts/generate-assets.mjs icon --src <fichier> [--out ./assets/images]
         [--bg "#FFFFFF"] [--splash-bg "#0C0C0F"] [--app <dossier-app>]

  Screenshots App Store (encadre de VRAIES captures, par langue) :
    node scripts/generate-assets.mjs screenshots --in <dossier> [--out ./assets/store/screenshots]
         [--size 1290x2796|6.9|6.5|ipad13] [--lang fr] [--bg "#F2F2F6"]
         [--captions <captions.json>] [--caption-color "#1C1C1E"]
         [--frame <cadre.png>] [--no-caption] [--margin N] [--radius N] [--top N]

    • --in avec des sous-dossiers (en/, fr/) ⇒ une passe par langue.
    • --captions accepte un JSON plat { "01-home.png": "Titre" } ou par langue
      { "fr": { "01-home.png": "Titre" }, "en": { ... } }.

  Presets de tailles Apple :
    node scripts/generate-assets.mjs sizes
`);
}

// ============================================================================
// ENTRÉE
// ============================================================================

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));
  const cmd = positional[0];

  try {
    switch (cmd) {
      case 'icon': await cmdIcon(flags); break;
      case 'screenshots': case 'screens': await cmdScreenshots(flags); break;
      case 'sizes': cmdSizes(); break;
      case undefined: case 'help': case '--help': case '-h': usage(); break;
      default: die(`Commande inconnue : « ${cmd} ». Lance sans argument pour l'aide.`);
    }
  } catch (e) {
    die(`Échec : ${e && e.message ? e.message : e}`);
  }
}

main();
