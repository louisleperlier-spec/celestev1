// Stockage local en JSON : une campagne = un fichier.
const fs = require('fs');
const path = require('path');

let root = null;

function init(userData) {
  root = path.join(userData, 'campaigns');
  fs.mkdirSync(root, { recursive: true });
}

const file = (id) => path.join(root, id, 'campaign.json');
const campaignDir = (id) => path.join(root, id);

function list() {
  return fs.readdirSync(root)
    .filter((d) => fs.existsSync(file(d)))
    .map((d) => {
      const c = JSON.parse(fs.readFileSync(file(d), 'utf8'));
      return { id: c.id, city: c.city, createdAt: c.createdAt, count: c.businesses.length };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function get(id) {
  return JSON.parse(fs.readFileSync(file(id), 'utf8'));
}

function save(c) {
  fs.mkdirSync(campaignDir(c.id), { recursive: true });
  const tmp = file(c.id) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(c, null, 2));
  fs.renameSync(tmp, file(c.id));
  return c;
}

function create(city, opts) {
  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + slug(city);
  return save({ id, city, opts, createdAt: new Date().toISOString(), area: null, businesses: [] });
}

function remove(id) {
  fs.rmSync(campaignDir(id), { recursive: true, force: true });
}

function updateBusiness(id, bizId, patch) {
  const c = get(id);
  const b = c.businesses.find((x) => x.id === bizId);
  if (!b) throw new Error('Commerce introuvable');
  deepMerge(b, patch);
  save(c);
  return b;
}

function deepMerge(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') deepMerge(target[k], v);
    else target[k] = v;
  }
}

function slug(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';
}

module.exports = { init, list, get, save, create, remove, updateBusiness, campaignDir, slug };
