// Bulk import donors from a CSV exported by an NSS unit / Red Cross / NGO.  Usage: npm run import data/donors.csv
// Columns: name,bloodGroup,phone,lat,lng,lastDonatedAt,consent   (consent must be yes/true/1, otherwise the row is skipped)
require('dotenv').config(); const fs = require('fs'), mongoose = require('mongoose'); const { Donor } = require('./models');
const file = process.argv[2]; if (!file) { console.log('Usage: npm run import data/donors.csv'); process.exit(1); }
function parseCSV(t) { const rows = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { r.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); c = ''; if (r.some(x => x.trim())) rows.push(r); r = []; } else c += ch; }
  r.push(c); if (r.some(x => x.trim())) rows.push(r); return rows; }
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
(async () => { const [head, ...rows] = parseCSV(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); const h = head.map(x => x.trim().toLowerCase());
  const col = n => h.indexOf(n.toLowerCase()), ops = [], skipped = [];
  rows.forEach((r, i) => { const g = n => (r[col(n)] || '').trim(), line = i + 2;
    const digits = g('phone').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''), lat = Number(g('lat')), lng = Number(g('lng')), last = g('lastDonatedAt') ? new Date(g('lastDonatedAt')) : null;
    if (!/^(yes|true|1|y)$/i.test(g('consent'))) return skipped.push(`row ${line}: no consent`);
    if (!/^[6-9]\d{9}$/.test(digits)) return skipped.push(`row ${line}: bad phone`);
    if (!GROUPS.includes(g('bloodGroup').toUpperCase())) return skipped.push(`row ${line}: bad blood group`);
    if (!g('lat') || !g('lng') || !Number.isFinite(lat) || !Number.isFinite(lng)) return skipped.push(`row ${line}: missing lat/lng`);
    ops.push({ updateOne: { filter: { phone: '91' + digits }, update: { $set: { name: g('name'), bloodGroup: g('bloodGroup').toUpperCase(), consent: true, available: true,
      lastDonatedAt: last && !isNaN(last) ? last : null, location: { type: 'Point', coordinates: [lng, lat] } } }, upsert: true } }); });
  if (ops.length) { await mongoose.connect(process.env.MONGODB_URI); await Donor.bulkWrite(ops); }
  console.log(`Imported ${ops.length}, skipped ${skipped.length}`); skipped.slice(0, 20).forEach(s => console.log(' -', s)); process.exit(0); })();
