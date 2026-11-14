/* global api */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  meta: null, settings: null, agents: null,
  campaigns: [], campaign: null, step: 'scout',
  filter: 'opportunités', sel: null,
  auditProgress: null, mockLogs: {}, mockText: {}, drafts: null,
};

function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), err ? 7000 : 3500);
}
async function call(ch, ...a) {
  try { return await api.call(ch, ...a); } catch (e) { toast(e.message, true); throw e; }
}

// ---------- Boot ----------
async function boot() {
  state.meta = await call('meta');
  state.settings = await call('settings:get');
  await refreshCampaigns();
  renderAgentBadge();
  call('agents:detect').then((a) => { state.agents = a; renderAgentBadge(); });
  if (state.campaigns[0]) openCampaign(state.campaigns[0].id); else renderNew();
}

function renderAgentBadge() {
  const a = state.agents?.[state.settings.agent];
  const label = state.settings.agent === 'codex' ? 'Codex' : 'Claude Code';
  $('#agentBadge').innerHTML = `Agent : <b>${label}</b>${state.agents ? (a?.installed ? '' : ' <span style="color:var(--red)">· introuvable</span>') : ''}`;
}

async function refreshCampaigns() {
  state.campaigns = await call('campaigns:list');
  $('#campaigns').innerHTML = state.campaigns.map((c) => `
    <a data-id="${esc(c.id)}" class="${state.campaign?.id === c.id ? 'active' : ''}">${esc(c.city)}
      <small>${c.count} commerces · ${new Date(c.createdAt).toLocaleDateString('fr-CA')}</small></a>`).join('') ||
    '<div class="muted" style="padding:6px 10px;font-size:12px">Aucune campagne</div>';
}
$('#campaigns').addEventListener('click', (e) => { const a = e.target.closest('a[data-id]'); if (a) openCampaign(a.dataset.id); });
$('#newCampaign').addEventListener('click', () => { state.campaign = null; refreshCampaigns(); renderNew(); });

async function openCampaign(id) {
  state.campaign = await call('campaigns:get', id);
  state.sel = null; state.drafts = null;
  if (!state.campaign.businesses.some((b) => b.audit)) state.step = 'scout';
  await refreshCampaigns();
  render();
}

$('#steps').addEventListener('click', (e) => {
  const li = e.target.closest('li[data-step]'); if (!li || !state.campaign) return;
  state.step = li.dataset.step; state.drafts = null; render();
});

// ---------- Helpers ----------
const B = () => state.campaign?.businesses || [];
const byId = (id) => B().find((b) => b.id === id);
const verdictPill = (a) => a ? `<span class="pill ${esc(a.verdict)}">${esc(a.verdict)}</span>` : '<span class="pill">non noté</span>';
const isOpp = (b) => b.audit && b.audit.verdict !== 'correct';
const opportunities = () => B().filter(isOpp).sort((a, b) => b.audit.score - a.audit.score);

function render() {
  const c = state.campaign;
  $('#top').hidden = !c;
  if (!c) return renderNew();
  $('#cityTitle').textContent = c.city;
  $('#areaName').textContent = (c.area?.name || '') + (c.area?.neighbors ? ` · + communes voisines (${c.opts.radiusKm} km)` : '');
  document.querySelectorAll('#steps li').forEach((li) => li.classList.toggle('active', li.dataset.step === state.step));
  ({ scout: renderScout, audit: renderAudit, mockup: renderMockup, write: renderWrite, call: renderCall })[state.step]();
}

// ---------- Nouvelle campagne ----------
function renderNew() {
  $('#top').hidden = true;
  const cats = state.meta.categories;
  const defaults = ['restaurant', 'cafe', 'bar', 'bakery', 'butcher', 'hairdresser', 'beauty', 'florist', 'car_repair', 'clothes', 'gift', 'pet', 'massage', 'tattoo', 'ice_cream', 'deli', 'dry_cleaning', 'hardware', 'furniture', 'bicycle'];
  $('#view').innerHTML = `
    <div class="hero">
      <h1>Choisis une ville.<br/><em>Filon</em> trouve qui a besoin d'un site.</h1>
      <p class="lead">Repérer, noter, maquetter, écrire, appeler. Les données viennent d'OpenStreetMap, les maquettes de ton propre abonnement IA.</p>
      <div class="card">
        <div class="citybox">
          <input id="city" placeholder="Ex. Longueuil, Québec" autofocus value="${esc(state.settings.me.city || '')}" />
          <button id="go" class="btn primary">Lancer la campagne</button>
        </div>
        <div class="row">
          <label class="toggle"><input type="checkbox" id="neighbors" /> Inclure les communes voisines</label>
          <label style="flex-direction:row;align-items:center;gap:8px">dans un rayon de
            <input id="radius" type="number" min="1" max="40" value="${state.settings.neighborsKm}" style="width:70px" /> km</label>
        </div>
        <div>
          <div class="muted" style="font-size:12px;margin-bottom:8px">Types de commerces</div>
          <div class="chips" id="cats">${Object.entries(cats).map(([k, v]) => `<span class="chip ${defaults.includes(k) ? 'on' : ''}" data-k="${k}">${esc(v)}</span>`).join('')}</div>
        </div>
      </div>
      <div class="pipeline">
        <div><span>1</span><b>Repérer</b>Les commerces de la ville et des environs.</div>
        <div><span>2</span><b>Noter</b>Site absent, cassé ou dépassé.</div>
        <div><span>3</span><b>Maquetter</b>Une maquette sur mesure, contrôlée sur 3 écrans.</div>
        <div><span>4</span><b>Écrire</b>Le brouillon de courriel.</div>
        <div><span>5</span><b>Appeler</b>Le pitch et le suivi des relances.</div>
      </div>
    </div>`;
  $('#cats').addEventListener('click', (e) => e.target.closest('.chip')?.classList.toggle('on'));
  const go = async () => {
    const city = $('#city').value.trim(); if (!city) return $('#city').focus();
    const categories = [...document.querySelectorAll('#cats .chip.on')].map((c) => c.dataset.k);
    if (!categories.length) return toast('Choisis au moins un type de commerce.', true);
    $('#go').disabled = true; $('#go').innerHTML = '<span class="spinner"></span> Recherche…';
    try {
      const c = await call('scout', { city, neighbors: $('#neighbors').checked, radiusKm: Number($('#radius').value) || 8, categories });
      state.step = 'scout';
      await openCampaign(c.id);
    } catch { $('#go').disabled = false; $('#go').textContent = 'Lancer la campagne'; }
  };
  $('#go').addEventListener('click', go);
  $('#city').addEventListener('keydown', (e) => e.key === 'Enter' && go());
}

// ---------- 1. Repérer ----------
function renderScout() {
  const list = B();
  const withSite = list.filter((b) => b.website).length;
  $('#view').innerHTML = `
    <div class="bar">
      <div class="grow muted">${list.length} commerces trouvés · ${withSite} avec un site connu · ${list.length - withSite} sans site</div>
      <button class="btn ghost" id="del">Supprimer la campagne</button>
      <button class="btn primary" id="next">Noter les sites →</button>
    </div>
    ${list.length ? `<table><thead><tr><th>Commerce</th><th>Type</th><th>Adresse</th><th>Téléphone</th><th>Site</th></tr></thead><tbody>
      ${list.map((b) => `<tr><td><b>${esc(b.name)}</b></td><td>${esc(b.category)}</td><td class="muted">${esc(b.address || '—')}</td>
        <td>${esc(b.phone || '—')}</td><td>${b.website ? `<a class="link" data-url="${esc(b.website)}">${esc(b.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 34))}</a>` : '<span class="muted">aucun</span>'}</td></tr>`).join('')}
    </tbody></table>` : '<div class="empty"><b>Aucun commerce trouvé</b>Essaie d\'inclure les communes voisines ou d\'autres types de commerces.</div>'}`;
  $('#next').onclick = () => { state.step = 'audit'; render(); if (!B().some((b) => b.audit)) runAudit(); };
  $('#del').onclick = async () => {
    if (!confirm(`Supprimer la campagne « ${state.campaign.city} » et ses maquettes ?`)) return;
    await call('campaigns:remove', state.campaign.id); state.campaign = null; await refreshCampaigns();
    state.campaigns[0] ? openCampaign(state.campaigns[0].id) : renderNew();
  };
}
document.addEventListener('click', (e) => { const a = e.target.closest('a[data-url]'); if (a) { e.preventDefault(); e.stopPropagation(); call('open:url', a.dataset.url); } });

// ---------- 2. Noter ----------
async function runAudit() {
  state.auditProgress = { done: 0, total: B().length };
  render();
  try { state.campaign = await call('audit', state.campaign.id); } finally { state.auditProgress = null; render(); }
}
api.on('progress', (p) => {
  if (!state.campaign || p.id !== state.campaign.id || p.step !== 'audit') return;
  const b = byId(p.bizId); if (b) b.audit = p.audit;
  state.auditProgress = { done: p.done, total: p.total };
  if (state.step === 'audit') renderAudit();
});

function renderAudit() {
  const list = B();
  const count = (v) => list.filter((b) => b.audit?.verdict === v).length;
  const f = state.filter;
  const rows = list.filter((b) => f === 'tous' || (f === 'opportunités' ? isOpp(b) : b.audit?.verdict === f))
    .sort((a, b) => (b.audit?.score ?? -1) - (a.audit?.score ?? -1));
  const p = state.auditProgress;
  $('#view').innerHTML = `
    <div class="stats">
      ${[['absent', 'Sans site'], ['cassé', 'Site cassé'], ['dépassé', 'Site dépassé'], ['correct', 'Site correct']].map(([k, l]) =>
        `<div class="stat ${f === k ? 'on' : ''}" data-f="${k}"><div class="n">${count(k)}</div><div class="l">${l}</div></div>`).join('')}
    </div>
    <div class="bar">
      <div class="chips">${['opportunités', 'tous'].map((k) => `<span class="chip ${f === k ? 'on' : ''}" data-f="${k}">${k === 'opportunités' ? 'Opportunités' : 'Tous'}</span>`).join('')}</div>
      ${p ? `<div class="progress"><i style="width:${(p.done / Math.max(1, p.total)) * 100}%"></i></div><span class="muted">${p.done}/${p.total}</span>`
          : `<div class="grow"></div><button class="btn" id="rerun">${list.some((b) => b.audit) ? 'Re-noter' : 'Noter tous les sites'}</button>`}
      <button class="btn primary" id="next" ${p ? 'disabled' : ''}>Maquetter →</button>
    </div>
    <table><thead><tr><th style="width:60px">Score</th><th>Commerce</th><th>Verdict</th><th>Ce qui cloche</th></tr></thead><tbody>
      ${rows.map((b) => `<tr>
        <td><span class="score ${b.audit?.score >= 60 ? 'hi' : ''}">${b.audit ? b.audit.score : '—'}</span></td>
        <td><b>${esc(b.name)}</b><div class="sub">${esc(b.category)}${b.website ? ` · <a class="link" data-url="${esc(b.website)}">voir le site</a>` : ''}</div></td>
        <td>${verdictPill(b.audit)}</td>
        <td>${b.audit ? `<ul class="issues">${b.audit.issues.map((i) => `<li>${esc(i.label)}</li>`).join('')}</ul>` : '<span class="muted">—</span>'}</td>
      </tr>`).join('') || '<tr><td colspan="4" class="empty">Rien ici pour l\'instant.</td></tr>'}
    </tbody></table>`;
  $('#view').querySelectorAll('[data-f]').forEach((el) => (el.onclick = () => { state.filter = el.dataset.f; renderAudit(); }));
  $('#rerun') && ($('#rerun').onclick = runAudit);
  $('#next').onclick = () => { state.step = 'mockup'; render(); };
}

// ---------- 3. Maquetter ----------
api.on('mockup', (p) => {
  if (!state.campaign || p.id !== state.campaign.id) return;
  const b = byId(p.bizId); if (!b) return;
  if (p.phase === 'log') { state.mockLogs[p.bizId] = ((state.mockLogs[p.bizId] || '') + p.text).slice(-12000); }
  else if (p.text) state.mockText[p.bizId] = p.text;
  if (p.done) { b.mockup = { ...b.mockup, ...p }; delete state.mockText[p.bizId]; if (p.status === 'ok') toast(`Maquette prête : ${b.name}`); }
  else b.mockup = { ...b.mockup, status: 'en cours' };
  if (state.step !== 'mockup') return;
  if (p.phase === 'log' && state.sel === p.bizId) { const l = $('#log'); if (l) { l.textContent = state.mockLogs[p.bizId]; l.scrollTop = l.scrollHeight; } return; }
  renderMockup();
});

const mockPill = (m) => ({ none: '', 'en cours': '<span class="spinner"></span>', ok: '<span class="pill ok">validée</span>', 'à revoir': '<span class="pill dépassé">à revoir</span>', erreur: '<span class="pill cassé">erreur</span>' }[m?.status || 'none'] || '');

function sideList(list, extra) {
  return `<div class="list">${list.map((b) => `
    <div class="item ${state.sel === b.id ? 'sel' : ''}" data-id="${b.id}">
      <div><div class="name">${esc(b.name)}</div><div class="meta">${esc(b.category)} · ${esc(b.audit?.verdict || '')} · ${b.audit?.score ?? ''}</div></div>
      <div>${extra(b)}</div>
    </div>`).join('') || '<div class="empty">Aucune opportunité. Lance d\'abord la notation.</div>'}</div>`;
}
function bindList(rerender) {
  $('#view').querySelectorAll('.item[data-id]').forEach((el) => (el.onclick = () => { state.sel = el.dataset.id; state.drafts = null; rerender(); }));
}

async function renderMockup() {
  const list = opportunities();
  if (!state.sel || !byId(state.sel)) state.sel = list[0]?.id || null;
  const b = state.sel && byId(state.sel);
  const m = b?.mockup || { status: 'none' };
  const agentOk = state.agents?.[state.settings.agent]?.installed !== false;
  $('#view').innerHTML = `
    <div class="bar">
      <div class="grow muted">${list.length} opportunités · ${list.filter((x) => x.mockup?.status === 'ok').length} maquettes validées</div>
      <button class="btn" id="batch" ${!agentOk ? 'disabled' : ''}>Maquetter les 5 meilleures</button>
      <button class="btn primary" id="next">Écrire →</button>
    </div>
    <div class="split">
      ${sideList(list, (x) => mockPill(x.mockup))}
      <div class="detail">${b ? `
        <div class="bar">
          <div class="grow"><h2>${esc(b.name)}</h2><div class="muted">${esc(b.category)} · ${esc(b.address)} ${verdictPill(b.audit)}</div></div>
          ${m.status === 'en cours'
            ? `<button class="btn" id="cancel">Annuler</button>`
            : `<button class="btn primary" id="build" ${!agentOk ? 'disabled' : ''}>${m.status === 'none' ? 'Créer la maquette' : 'Refaire la maquette'}</button>`}
        </div>
        ${!agentOk ? `<div class="card" style="border-color:var(--red);margin-bottom:14px">${state.settings.agent === 'codex' ? 'Codex' : 'Claude Code'} n'est pas installé sur cette machine. Ouvre les Réglages pour changer d'agent, ou installe-le (voir le README).</div>` : ''}
        ${m.status === 'en cours' ? `<p><span class="spinner"></span> ${esc(state.mockText[b.id] || 'En cours…')}</p><div class="log" id="log">${esc(state.mockLogs[b.id] || '')}</div>` : ''}
        ${m.status === 'erreur' ? `<div class="card" style="border-color:var(--red)">${esc(m.error)}</div>` : ''}
        ${m.shots ? `
          <div class="row" style="margin-top:6px">
            ${mockPill(m)} <span class="muted">${(m.rounds || []).length} tour(s) · ${esc(m.agent === 'codex' ? 'Codex' : 'Claude Code')}</span>
            <div class="grow"></div>
            <button class="btn small" id="recheck">Recontrôler</button>
            <button class="btn small" id="openHtml">Ouvrir dans le navigateur</button>
            <button class="btn small" id="openDir">Ouvrir le dossier</button>
          </div>
          <div class="shots">${m.shots.map((s) => `
            <div class="shot"><div class="cap"><span>${esc(s.label)} · ${s.width}px</span><span>${s.problems?.length ? '⚠ ' + s.problems.length : '✓'}</span></div>
              <div class="frame"><img data-shot="${esc(s.shot)}" alt="" /></div>
              ${s.problems?.length ? `<ul class="issues">${s.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
            </div>`).join('')}</div>` : ''}
        ${m.status === 'none' ? `<div class="empty"><b>Pas encore de maquette</b>${esc(state.settings.agent === 'codex' ? 'Codex' : 'Claude Code')} va créer un index.html sur mesure, puis Filon le contrôle sur téléphone, tablette et ordinateur, jusqu'à ${state.settings.maxRounds} tours.</div>` : ''}
      ` : '<div class="empty"><b>Choisis un commerce</b></div>'}</div>
    </div>`;
  bindList(renderMockup);
  $('#next').onclick = () => { state.step = 'write'; render(); };
  $('#batch').onclick = () => opportunities().filter((x) => !['ok', 'en cours'].includes(x.mockup?.status)).slice(0, 5).reduce((p, x) => p.then(() => startMockup(x.id).catch(() => {})), Promise.resolve());
  if (b) {
    $('#build') && ($('#build').onclick = () => startMockup(b.id).catch(() => {}));
    $('#cancel') && ($('#cancel').onclick = () => call('mockup:cancel', b.id));
    $('#openDir') && ($('#openDir').onclick = () => call('open:path', m.dir));
    $('#openHtml') && ($('#openHtml').onclick = () => call('open:path', m.dir + (state.meta.platform === 'win32' ? '\\' : '/') + 'index.html'));
    $('#recheck') && ($('#recheck').onclick = async () => { b.mockup = await call('mockup:recheck', state.campaign.id, b.id); renderMockup(); });
    for (const img of $('#view').querySelectorAll('img[data-shot]')) call('image:dataUrl', img.dataset.shot).then((u) => (img.src = u)).catch(() => {});
    const l = $('#log'); if (l) l.scrollTop = l.scrollHeight;
  }
}
function startMockup(id) {
  state.mockLogs[id] = '';
  byId(id).mockup = { status: 'en cours' };
  if (state.step === 'mockup') renderMockup();
  return call('mockup:start', state.campaign.id, id);
}

// ---------- 4. Écrire ----------
async function loadDrafts(b) {
  if (!state.drafts || state.drafts.id !== b.id) state.drafts = { id: b.id, ...(await call('outreach:drafts', state.campaign.id, b.id)) };
  return state.drafts;
}
async function setOutreach(b, patch, event) {
  const nb = await call('outreach:update', state.campaign.id, b.id, patch, event);
  Object.assign(b, nb);
}
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

async function renderWrite() {
  const list = opportunities();
  if (!state.sel || !byId(state.sel)) state.sel = list[0]?.id || null;
  const b = state.sel && byId(state.sel);
  const d = b ? await loadDrafts(b) : null;
  const followUps = b ? (b.outreach.history || []).filter((h) => h.type === 'courriel' || h.type === 'relance').length : 0;
  const draft = d ? (followUps ? d.followUp : d.email) : null;
  $('#view').innerHTML = `
    <div class="bar"><div class="grow muted">Les brouillons reprennent le diagnostic du site et mentionnent la maquette.</div><button class="btn primary" id="next">Appeler →</button></div>
    <div class="split">
      ${sideList(list, (x) => `<span class="pill">${esc(x.outreach.status)}</span>`)}
      <div class="detail">${b ? `
        <h2>${esc(b.name)}</h2>
        <div class="muted" style="margin:4px 0 16px">${b.email ? esc(b.email) : 'Courriel inconnu : trouve-le sur leur page Facebook/Instagram ou demande-le au téléphone.'}${b.mockup?.status === 'ok' ? ' · maquette prête ✓' : ' · pas encore de maquette'}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:12px">
          <div class="muted" style="font-size:12px">${followUps ? `Relance n° ${followUps}` : 'Premier courriel'}</div>
          <label>À<input id="to" value="${esc(b.email)}" placeholder="courriel@commerce.com" /></label>
          <label>Objet<input id="subject" value="${esc(draft.subject)}" /></label>
          <label>Message<textarea id="body" rows="16">${esc(draft.body)}</textarea></label>
          <div class="row"><div class="grow muted" style="font-size:12px">Pense à joindre les captures de la maquette (dossier de la maquette).</div>
            <button class="btn" id="copy">Copier</button>
            <button class="btn" id="mail">Ouvrir dans ma messagerie</button>
            <button class="btn primary" id="sent">Marquer comme envoyé</button></div>
        </div>
        ${historyHtml(b)}
      ` : '<div class="empty"><b>Aucune opportunité</b></div>'}</div>
    </div>`;
  bindList(renderWrite);
  $('#next').onclick = () => { state.step = 'call'; render(); };
  if (!b) return;
  $('#copy').onclick = () => { navigator.clipboard.writeText(`${$('#subject').value}\n\n${$('#body').value}`); toast('Copié.'); };
  $('#mail').onclick = () => call('open:url', `mailto:${encodeURIComponent($('#to').value)}?subject=${encodeURIComponent($('#subject').value)}&body=${encodeURIComponent($('#body').value)}`);
  $('#sent').onclick = async () => {
    const to = $('#to').value.trim();
    if (to && to !== b.email) Object.assign(b, await call('business:update', state.campaign.id, b.id, { email: to }));
    await setOutreach(b, { status: 'courriel envoyé', nextFollowUp: plusDays(3) }, { type: followUps ? 'relance' : 'courriel', note: $('#subject').value });
    state.drafts = null; toast('Noté. Relance prévue dans 3 jours.'); renderWrite();
  };
}
function historyHtml(b) {
  const h = (b.outreach.history || []).slice().reverse();
  return h.length ? `<div class="history"><b style="color:var(--text)">Historique</b>${h.map((x) => `<div>${new Date(x.at).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })} · <b>${esc(x.type)}</b>${x.note ? ' — ' + esc(x.note) : ''}</div>`).join('')}</div>` : '';
}

// ---------- 5. Appeler ----------
async function renderCall() {
  const today = new Date().toISOString().slice(0, 10);
  const list = opportunities().sort((a, b) => {
    const da = a.outreach.nextFollowUp || '9999', db = b.outreach.nextFollowUp || '9999';
    return da.localeCompare(db) || b.audit.score - a.audit.score;
  });
  if (!state.sel || !byId(state.sel)) state.sel = list[0]?.id || null;
  const b = state.sel && byId(state.sel);
  const d = b ? await loadDrafts(b) : null;
  const due = list.filter((x) => x.outreach.nextFollowUp && x.outreach.nextFollowUp <= today && !['gagné', 'perdu'].includes(x.outreach.status)).length;
  const won = list.filter((x) => x.outreach.status === 'gagné').length;
  $('#view').innerHTML = `
    <div class="bar"><div class="grow muted">${due} relance(s) à faire aujourd'hui · ${won} gagné(s)</div></div>
    <div class="split">
      ${sideList(list, (x) => {
        const late = x.outreach.nextFollowUp && x.outreach.nextFollowUp <= today && !['gagné', 'perdu'].includes(x.outreach.status);
        return `<span class="pill ${x.outreach.status === 'gagné' ? 'ok' : late ? 'absent' : ''}">${late ? 'à relancer' : esc(x.outreach.status)}</span>`;
      })}
      <div class="detail">${b ? `
        <div class="bar">
          <div class="grow"><h2>${esc(b.name)}</h2><div class="muted">${esc(b.address)}</div></div>
          ${b.phone ? `<button class="btn primary" id="dial">Appeler ${esc(b.phone)}</button>` : '<span class="muted">Pas de numéro connu</span>'}
        </div>
        <div class="grid2" style="margin-bottom:16px">
          <label>Statut<select id="status">${state.meta.statuses.map((s) => `<option ${s === b.outreach.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
          <label>Prochaine relance<input type="date" id="next" value="${esc(b.outreach.nextFollowUp || '')}" /></label>
          <label class="span2">Notes<textarea id="notes" rows="3" style="min-height:70px">${esc(b.outreach.notes || '')}</textarea></label>
        </div>
        <div class="row" style="margin-bottom:16px">
          <button class="btn" data-quick="pas de réponse">Pas de réponse</button>
          <button class="btn" data-quick="rappeler">À rappeler</button>
          <button class="btn" data-quick="intéressé">Intéressé</button>
          <button class="btn" data-quick="pas intéressé">Pas intéressé</button>
          <div class="grow"></div>
          <button class="btn primary" id="save">Enregistrer</button>
        </div>
        <div class="pitch">${esc(d.pitch)}</div>
        ${historyHtml(b)}
      ` : '<div class="empty"><b>Aucune opportunité</b></div>'}</div>
    </div>`;
  bindList(renderCall);
  if (!b) return;
  $('#dial') && ($('#dial').onclick = async () => {
    call('open:url', 'tel:' + b.phone.replace(/[^\d+]/g, ''));
    navigator.clipboard.writeText(b.phone);
    toast('Numéro copié. Note le résultat de l’appel ci-dessous.');
  });
  const quick = {
    'pas de réponse': { status: 'à relancer', days: 2 },
    rappeler: { status: 'à relancer', days: 1 },
    intéressé: { status: 'intéressé', days: 2 },
    'pas intéressé': { status: 'perdu', days: null },
  };
  $('#view').querySelectorAll('[data-quick]').forEach((el) => (el.onclick = async () => {
    const q = quick[el.dataset.quick];
    await setOutreach(b, { status: q.status, nextFollowUp: q.days ? plusDays(q.days) : '', notes: $('#notes').value }, { type: 'appel', note: el.dataset.quick });
    toast(q.days ? `Noté. Relance dans ${q.days} jour(s).` : 'Noté.'); renderCall();
  }));
  $('#save').onclick = async () => {
    await setOutreach(b, { status: $('#status').value, nextFollowUp: $('#next').value, notes: $('#notes').value });
    toast('Enregistré.'); renderCall();
  };
}

// ---------- Réglages ----------
$('#openSettings').addEventListener('click', async () => {
  const f = $('#settingsForm'); const s = state.settings;
  for (const k of ['name', 'phone', 'email', 'city', 'site']) f.elements[k].value = s.me[k] || '';
  f.elements.maxRounds.value = s.maxRounds;
  let agent = s.agent;
  const drawAgents = () => {
    const a = state.agents || {};
    $('#agentChoices').innerHTML = [['claude', 'Claude Code', 'Abonnement Claude Pro ou Max'], ['codex', 'Codex', 'Abonnement ChatGPT Plus ou Pro']].map(([k, l, sub]) => `
      <div class="agent-opt ${agent === k ? 'on' : ''}" data-k="${k}"><b>${l}</b><small>${sub}</small><br/>
        <small class="${a[k]?.installed === false ? 'no' : ''}">${!state.agents ? 'Détection…' : a[k]?.installed ? 'Installé · ' + esc(a[k].version) : 'Non installé'}</small></div>`).join('');
    $('#agentChoices').querySelectorAll('.agent-opt').forEach((el) => (el.onclick = () => { agent = el.dataset.k; drawAgents(); }));
  };
  drawAgents();
  call('agents:detect').then((a) => { state.agents = a; drawAgents(); renderAgentBadge(); });
  $('#settings').showModal();
  $('#settings').onclose = async () => {
    if ($('#settings').returnValue !== 'save') return;
    const me = Object.fromEntries(['name', 'phone', 'email', 'city', 'site'].map((k) => [k, f.elements[k].value.trim()]));
    state.settings = await call('settings:set', { me, agent, maxRounds: Math.max(1, Math.min(6, Number(f.elements.maxRounds.value) || 3)) });
    state.drafts = null; renderAgentBadge(); if (state.campaign) render();
    toast('Réglages enregistrés.');
  };
});

boot();
