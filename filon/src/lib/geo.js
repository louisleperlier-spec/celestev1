// Étape 1 — Repérer : ville -> zone (Nominatim) -> commerces (Overpass / OpenStreetMap).
// Aucune clé d'API nécessaire.
const UA = 'Filon/0.1 (prospection locale; app desktop)';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

// Catégories utiles pour vendre un site web (commerces de proximité et services).
const CATEGORIES = {
  restaurant: 'Restaurant', cafe: 'Café', bar: 'Bar', pub: 'Pub', fast_food: 'Restauration rapide',
  bakery: 'Boulangerie', butcher: 'Boucherie', hairdresser: 'Coiffeur', beauty: 'Esthétique',
  florist: 'Fleuriste', clothes: 'Vêtements', shoes: 'Chaussures', jewelry: 'Bijouterie',
  car_repair: 'Garage', dentist: 'Dentiste', veterinary: 'Vétérinaire', optician: 'Opticien',
  pharmacy: 'Pharmacie', gift: 'Cadeaux', furniture: 'Meubles', hardware: 'Quincaillerie',
  pet: 'Animalerie', bicycle: 'Vélos', massage: 'Massage', tattoo: 'Tatouage', dry_cleaning: 'Nettoyeur',
  convenience: 'Dépanneur', deli: 'Épicerie fine', ice_cream: 'Crémerie', confectionery: 'Confiserie',
};

async function geocode(city) {
  const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: city, format: 'json', limit: '1', addressdetails: '1' });
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr' } });
  if (!r.ok) throw new Error(`Géocodage impossible (${r.status})`);
  const [hit] = await r.json();
  if (!hit) throw new Error(`Ville introuvable : « ${city} »`);
  const [s, n, w, e] = hit.boundingbox.map(Number);
  return { name: hit.display_name, lat: Number(hit.lat), lon: Number(hit.lon), bbox: { s, w, n, e } };
}

// Élargit la zone de `km` kilomètres de chaque côté (communes voisines).
function expand(bbox, km) {
  const dLat = km / 111;
  const dLon = km / (111 * Math.cos(((bbox.s + bbox.n) / 2) * Math.PI / 180));
  return { s: bbox.s - dLat, n: bbox.n + dLat, w: bbox.w - dLon, e: bbox.e + dLon };
}

function buildQuery(b, cats) {
  const box = `${b.s},${b.w},${b.n},${b.e}`;
  const amen = cats.filter((c) => ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'dentist', 'veterinary', 'pharmacy', 'ice_cream'].includes(c));
  const shop = cats.filter((c) => !amen.includes(c));
  const parts = [];
  if (amen.length) parts.push(`nwr["amenity"~"^(${amen.join('|')})$"]["name"](${box});`);
  if (shop.length) parts.push(`nwr["shop"~"^(${shop.join('|')})$"]["name"](${box});`);
  parts.push(`nwr["craft"]["name"](${box});`);
  return `[out:json][timeout:90];(${parts.join('')});out center tags;`;
}

async function overpass(query) {
  let lastErr;
  for (const base of OVERPASS) {
    try {
      const r = await fetch(base, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(query) });
      if (!r.ok) throw new Error(`Overpass ${r.status}`);
      return await r.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

function normalizeUrl(u) {
  if (!u) return null;
  u = String(u).trim().split(/[;\s]/)[0];
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
  try { return new URL(u).toString(); } catch { return null; }
}

async function findBusinesses(city, { neighbors = false, radiusKm = 8, categories = Object.keys(CATEGORIES), limit = 300 } = {}) {
  const area = await geocode(city);
  const bbox = neighbors ? expand(area.bbox, radiusKm) : area.bbox;
  const data = await overpass(buildQuery(bbox, categories));
  const seen = new Set();
  const out = [];
  for (const el of data.elements || []) {
    const t = el.tags || {};
    const key = (t.name + '|' + (t['addr:street'] || '')).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const kind = t.amenity || t.shop || t.craft || 'autre';
    out.push({
      id: `${el.type[0]}${el.id}`,
      name: t.name,
      category: CATEGORIES[kind] || kind,
      address: [t['addr:housenumber'], t['addr:street'], t['addr:city']].filter(Boolean).join(' '),
      city: t['addr:city'] || '',
      phone: t.phone || t['contact:phone'] || '',
      email: t.email || t['contact:email'] || '',
      website: normalizeUrl(t.website || t['contact:website'] || t.url),
      facebook: t['contact:facebook'] || '',
      instagram: t['contact:instagram'] || '',
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      audit: null,
      mockup: { status: 'none', rounds: [] },
      outreach: { status: 'à contacter', notes: '', nextFollowUp: '', history: [] },
    });
    if (out.length >= limit) break;
  }
  return { area: { ...area, bbox, neighbors }, businesses: out };
}

module.exports = { findBusinesses, CATEGORIES, normalizeUrl };
