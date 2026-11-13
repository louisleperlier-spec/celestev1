// Extrait les textes français affichables de src/ (littéraux et gabarits), pour le dictionnaire anglais.
// Usage : node scripts/extraire-textes.cjs > sortie.json
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const fichiers = [];
(function marcher(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) marcher(p);
    else if (/\.tsx?$/.test(f) && !/\.d\.ts$/.test(f)) fichiers.push(p);
  }
})('src');
const EXCLUS = /(^|\/)(images|exercicesAxel|randosImages|yogaImages|succesImages)\.ts$/;
const textes = new Map();
const affichable = (s) => /[a-zA-ZÀ-ÿ]{2}/.test(s) && (/[À-ÿ]/.test(s) || /\s/.test(s.trim()) || /^[A-ZÀ-Ý][a-zà-ÿ]+[.!?…]?$/.test(s.trim())) && !/^[@./]/.test(s) && !/^(#|rgba?\(|https?:)/.test(s) && !/\.(png|webp|jpg|wav|mp4)$/.test(s);
for (const f of fichiers) {
  if (EXCLUS.test(f)) continue;
  const src = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const ajouter = (s, n) => {
    s = s.replace(/\s+/g, ' ').trim();
    if (!s || !affichable(s)) return;
    const e = textes.get(s) ?? { n: 0, f: new Set() };
    e.n++; e.f.add(path.relative('src', f)); textes.set(s, e);
  };
  const visiter = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ['require', 'requireOptionalNativeModule', 'requireNativeView'].includes(n.expression.text)) return;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      // Pas les clés d'objet ni les types littéraux.
      if (!(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !ts.isLiteralTypeNode(n.parent)) ajouter(n.text, n);
    } else if (ts.isTemplateExpression(n)) {
      let s = n.head.text; n.templateSpans.forEach((sp, i) => (s += `{${i}}` + sp.literal.text)); ajouter(s, n);
    } else if (ts.isJsxText(n)) ajouter(n.text, n);
    ts.forEachChild(n, visiter);
  };
  visiter(src);
}
const out = {};
for (const [s, e] of [...textes].sort((a, b) => a[0].localeCompare(b[0]))) out[s] = [...e.f].join(',');
process.stdout.write(JSON.stringify(out, null, 0));
