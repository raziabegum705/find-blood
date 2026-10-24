// Real blood banks near any point (Andhra Pradesh or anywhere) from OpenStreetMap via the free Overpass API.
// Results are saved in MongoDB, so a slow or failed lookup still shows what was found before.
const { BloodBank } = require('./models');
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const seen = new Map(); // "lat,lng,radius" -> last refresh time
const around = (R, lat, lng) => `(around:${R},${lat},${lng})`;
const bankQuery = (R, lat, lng) => `[out:json][timeout:25];(nwr["healthcare"="blood_donation"]${around(R, lat, lng)};nwr["amenity"="blood_donation"]${around(R, lat, lng)};nwr["healthcare"="blood_bank"]${around(R, lat, lng)};nwr["name"~"blood ?(bank|centre|center)",i]${around(R, lat, lng)};);out center tags 80;`;
const hospQuery = (R, lat, lng) => `[out:json][timeout:25];nwr["amenity"="hospital"]["name"~"government|general|district|area hospital|medical college|GGH|RIMS|SVIMS|NRI|King George",i]${around(R, lat, lng)};out center tags 40;`;
async function overpass(query) {
  let err;
  for (const url of ENDPOINTS) {
    try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'FindBlood/1.0 (hackathon prototype)' }, body: 'data=' + encodeURIComponent(query), signal: AbortSignal.timeout(28000) });
      if (r.ok) return (await r.json()).elements || []; err = new Error('Overpass HTTP ' + r.status); } catch (e) { err = e; }
  }
  throw err;
}
function toRow(el, kind) {
  const t = el.tags || {}, name = t['name:en'] || t.name; const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  if (!name || lat == null || lon == null) return null;
  const op = (t['operator:type'] || '').toLowerCase();
  return { osmId: el.type + el.id, name, kind, source: 'osm', phone: (t.phone || t['contact:phone'] || '').split(';')[0].trim(),
    type: kind === 'hospital' ? 'Hospital (call to confirm blood bank)' : op === 'government' || op === 'public' ? 'Government' : op === 'private' ? 'Private' : 'Blood bank', lat: +lat, lon: +lon };
}
async function save(rows) {
  if (!rows.length) return;
  await BloodBank.bulkWrite(rows.map(r => ({ updateOne: { filter: { osmId: r.osmId }, upsert: true, update: { $set: { name: r.name, type: r.type, phone: r.phone, kind: r.kind, source: 'osm', fetchedAt: new Date(), location: { type: 'Point', coordinates: [r.lon, r.lat] } } } } })));
}
async function refresh(lat, lng, R) {
  const banks = (await overpass(bankQuery(R, lat, lng))).map(e => toRow(e, 'bank')).filter(Boolean); await save(banks);
  if (banks.length < 3) { const hosp = (await overpass(hospQuery(R, lat, lng))).map(e => toRow(e, 'hospital')).filter(Boolean); await save(hosp); } // fewer than 3 tagged banks: also list big government hospitals
}
async function findBanks(lat, lng, radiusKm) {
  const R = Math.round(Math.min(Math.max(+radiusKm || 50, 5), 100) * 1000), key = `${lat.toFixed(2)},${lng.toFixed(2)},${R}`;
  if (!seen.has(key) || Date.now() - seen.get(key) > 6 * 36e5) { try { await refresh(lat, lng, R); seen.set(key, Date.now()); } catch (e) { console.error('banks lookup failed:', e.message); } }
  const rows = await BloodBank.find({ location: { $nearSphere: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: R } } }).limit(60).lean();
  return rows.map(b => ({ name: b.name, type: b.type || 'Blood bank', units: b.units, phone: b.phone || '', source: b.source || 'sample', kind: b.kind || 'bank', lat: b.location.coordinates[1], lng: b.location.coordinates[0] }));
}
module.exports = { findBanks, toRow };
