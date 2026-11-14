const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { fixPath } = require('./src/lib/shellpath');
const store = require('./src/lib/store');
const geo = require('./src/lib/geo');
const audit = require('./src/lib/audit');
const mockup = require('./src/lib/mockup');
const outreach = require('./src/lib/outreach');

fixPath();

let win;
const running = new Map(); // bizId -> AbortController
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const defaults = { me: { name: '', phone: '', email: '', city: '', site: '' }, agent: 'claude', maxRounds: 3, neighborsKm: 8 };

function readSettings() {
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; } catch { return { ...defaults }; }
}
function writeSettings(s) { fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2)); return s; }
const send = (ch, payload) => win && !win.isDestroyed() && win.webContents.send(ch, payload);

function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 1080, minHeight: 680,
    backgroundColor: '#0b0b0c', title: 'Filon',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  store.init(app.getPath('userData'));
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());

const handle = (ch, fn) => ipcMain.handle(ch, async (_e, ...args) => {
  try { return { ok: true, data: await fn(...args) }; } catch (e) { return { ok: false, error: e.message }; }
});

// Réglages et agents
handle('settings:get', () => readSettings());
handle('settings:set', (s) => writeSettings({ ...readSettings(), ...s }));
handle('agents:detect', () => mockup.detectAgents());
handle('meta', () => ({ categories: geo.CATEGORIES, statuses: outreach.STATUSES, platform: process.platform }));

// Campagnes
handle('campaigns:list', () => store.list());
handle('campaigns:get', (id) => store.get(id));
handle('campaigns:remove', (id) => store.remove(id));

// 1. Repérer
handle('scout', async ({ city, neighbors, radiusKm, categories }) => {
  const c = store.create(city, { neighbors, radiusKm, categories });
  send('progress', { id: c.id, step: 'scout', text: `Recherche des commerces à ${city}…` });
  const { area, businesses } = await geo.findBusinesses(city, { neighbors, radiusKm, categories });
  c.area = area;
  c.businesses = businesses;
  store.save(c);
  send('progress', { id: c.id, step: 'scout', text: `${businesses.length} commerces trouvés.`, done: true });
  return c;
});

// 2. Noter
handle('audit', async (id, onlyIds) => {
  const c = store.get(id);
  const list = c.businesses.filter((b) => !onlyIds || onlyIds.includes(b.id));
  let done = 0;
  await audit.auditAll(list, async (b, a) => {
    store.updateBusiness(id, b.id, { audit: a });
    done++;
    send('progress', { id, step: 'audit', bizId: b.id, audit: a, done, total: list.length });
  });
  return store.get(id);
});

// 3. Maquetter
handle('mockup:start', async (id, bizId) => {
  if (running.has(bizId)) throw new Error('Maquette déjà en cours pour ce commerce');
  const s = readSettings();
  const c = store.get(id);
  const b = c.businesses.find((x) => x.id === bizId);
  const dir = path.join(store.campaignDir(id), 'maquettes', `${store.slug(b.name)}-${b.id}`);
  const ctrl = new AbortController();
  running.set(bizId, ctrl);
  store.updateBusiness(id, bizId, { mockup: { status: 'en cours', dir, agent: s.agent } });
  send('mockup', { id, bizId, status: 'en cours', text: 'Démarrage…' });
  try {
    const r = await mockup.buildMockup({
      business: b, campaign: c, dir, agent: s.agent, maxRounds: s.maxRounds, signal: ctrl.signal,
      onProgress: (p) => send('mockup', { id, bizId, status: 'en cours', ...p }),
    });
    const m = { status: r.status, dir, agent: s.agent, rounds: r.rounds, shots: r.results.map((x) => ({ key: x.key, label: x.label, width: x.width, shot: x.shot, problems: x.problems })) };
    store.updateBusiness(id, bizId, { mockup: m });
    send('mockup', { id, bizId, ...m, done: true });
    return m;
  } catch (e) {
    store.updateBusiness(id, bizId, { mockup: { status: 'erreur', dir, error: e.message } });
    send('mockup', { id, bizId, status: 'erreur', error: e.message, done: true });
    throw e;
  } finally { running.delete(bizId); }
});
handle('mockup:cancel', (bizId) => { running.get(bizId)?.abort(); return true; });
handle('mockup:recheck', async (id, bizId) => {
  const b = store.get(id).businesses.find((x) => x.id === bizId);
  const v = await mockup.verify(b.mockup.dir);
  const m = { status: v.pass ? 'ok' : 'à revoir', shots: v.results.map((x) => ({ key: x.key, label: x.label, width: x.width, shot: x.shot, problems: x.problems })) };
  store.updateBusiness(id, bizId, { mockup: m });
  return store.get(id).businesses.find((x) => x.id === bizId).mockup;
});
handle('open:path', (p) => shell.openPath(p));
handle('open:url', (u) => shell.openExternal(u));
handle('image:dataUrl', (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64'));

// 4-5. Écrire et Appeler
handle('outreach:drafts', (id, bizId) => {
  const s = readSettings();
  const b = store.get(id).businesses.find((x) => x.id === bizId);
  const n = (b.outreach.history || []).filter((h) => h.type === 'relance').length;
  return { email: outreach.emailDraft(b, s.me), pitch: outreach.callPitch(b, s.me), followUp: outreach.followUpDraft(b, s.me, n + 1) };
});
handle('business:update', (id, bizId, patch) => {
  const allowed = ['email', 'phone', 'website', 'name'];
  return store.updateBusiness(id, bizId, Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k))));
});
handle('outreach:update', (id, bizId, patch, event) => {
  const b = store.get(id).businesses.find((x) => x.id === bizId);
  const history = [...(b.outreach.history || [])];
  if (event) history.push({ ...event, at: new Date().toISOString() });
  return store.updateBusiness(id, bizId, { outreach: { ...patch, history } });
});
