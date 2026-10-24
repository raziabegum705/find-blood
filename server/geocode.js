// Turns the hospital name read from the slip into exact coordinates, searching only near the request location
// (OpenStreetMap Nominatim, free; max 1 request per second). Only real health facilities are accepted.
const wait = ms => new Promise(r => setTimeout(r, ms));
const km = ([a, b], [c, d]) => { const r = x => x * Math.PI / 180, h = Math.sin(r(d - b) / 2) ** 2 + Math.cos(r(b)) * Math.cos(r(d)) * Math.sin(r(c - a) / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };
const clean = s => String(s || '').replace(/\bgovt\.?\b/ig, 'Government').replace(/\bblood\s*(bank|centre|center)\b/ig, '').replace(/\s+/g, ' ').trim();
const TYPE = { hospital: 3, blood_donation: 2, clinic: 1, doctors: 1 };
const STOP = new Set(['government', 'govt', 'hospital', 'general', 'district', 'area', 'community', 'the', 'of', 'and', 'blood', 'bank', 'centre', 'center']);
const tokens = s => String(s).toLowerCase().split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w));
// Best match = a hospital-type place whose name shares words (like the town) with the query, then the nearest one
function pick(results, [lng, lat], query, minOverlap = 0) {
  const want = tokens(query);
  const scored = results.filter(x => TYPE[x.type]).map(x => {
    const hay = tokens(x.display_name + ' ' + (x.name || '')), overlap = want.filter(w => hay.includes(w)).length;
    return { x, overlap, s: TYPE[x.type] * 10 + overlap * 5 - km([lng, lat], [+x.lon, +x.lat]) / 5 }; }).filter(o => o.overlap >= minOverlap).sort((a, b) => b.s - a.s);
  return scored.length ? scored[0].x : null;
}
async function search(q, box) {
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({ format: 'jsonv2', limit: '15', countrycodes: 'in', q, viewbox: box, bounded: '1' });
  const r = await fetch(u, { headers: { 'User-Agent': 'FindBlood/1.0 (hackathon prototype)', 'Accept-Language': 'en' } });
  return r.ok ? r.json() : [];
}
async function geocodeHospital(name, c) {
  const [lng, lat] = c, q = clean(name); let first = true;
  const variants = /hospital/i.test(q) ? [q] : [q + ' hospital', q];
  for (const span of [0.5, 1.5]) {
    const box = [lng - span, lat + span, lng + span, lat - span].join(',');
    for (const v of variants) {
      if (!first) await wait(1100); first = false;
      try { const b = pick(await search(v, box), c, q);
        if (b) return { lat: +b.lat, lng: +b.lon, label: (b.name ? b.name + ', ' : '') + b.display_name.split(',').slice(b.name ? 1 : 0, 3).join(',').trim() }; } catch (e) { console.error('geocode', e.message); }
    }
  }
  // Last try: all of Andhra Pradesh, only when the hospital name has a town word that the result also has
  if (tokens(q).length) { const box = [76.7, 19.95, 84.9, 12.55].join(',');
    for (const v of variants) { await wait(1100); try { const b = pick(await search(v, box), c, q, 1);
      if (b) return { lat: +b.lat, lng: +b.lon, label: (b.name ? b.name + ', ' : '') + b.display_name.split(',').slice(b.name ? 1 : 0, 3).join(',').trim() }; } catch (e) { console.error('geocode', e.message); } } }
  return null; // never search all of India: it picks a same-named hospital hundreds of km away
}
module.exports = { geocodeHospital, pick };
