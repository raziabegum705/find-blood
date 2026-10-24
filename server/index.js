require('dotenv').config();
const path = require('path'), http = require('http'), express = require('express'), cors = require('cors'), multer = require('multer'), mongoose = require('mongoose');
const { BloodBank, Donor, EmergencyRequest, AuditLog, User } = require('./models'), { extract } = require('./gemini'), wa = require('./whatsapp'), onboard = require('./onboard'), auth = require('./auth'), { geocodeHospital } = require('./geocode'), { findBanks } = require('./banks');
const app = express(), server = http.createServer(app), ORIGINS = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(x => x.trim()) : true, io = new (require('socket.io').Server)(server, { cors: { origin: ORIGINS } });
app.set('trust proxy', 1);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.use(cors({ origin: ORIGINS })); app.use(express.json({ verify: (req, _r, buf) => { req.rawBody = buf; } }));
app.use(express.static(path.join(__dirname, '..', 'public')));
io.on('connection', s => s.on('join', id => s.join(String(id))));

const DONOR_FOR = { 'O+': ['O+','O-'], 'O-': ['O-'], 'A+': ['A+','A-','O+','O-'], 'A-': ['A-','O-'], 'B+': ['B+','B-','O+','O-'], 'B-': ['B-','O-'],
  'AB+': ['A+','A-','B+','B-','AB+','AB-','O+','O-'], 'AB-': ['AB-','A-','B-','O-'] };
const kmBetween = ([a, b], [c, d]) => { const r = x => x * Math.PI / 180, h = Math.sin(r(d - b) / 2) ** 2 + Math.cos(r(b)) * Math.cos(r(d)) * Math.sin(r(c - a) / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };
const near = (c, km) => ({ $nearSphere: { $geometry: { type: 'Point', coordinates: c }, $maxDistance: km * 1000 } });
const audit = (request, event, meta) => AuditLog.create({ request, event, meta }).catch(() => {});
const wa10 = x => { const d = String(x || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); return /^[6-9]\d{9}$/.test(d) ? '91' + d : null; };
const tell = (phone, text) => phone && wa.sendText(phone, text).catch(e => console.error('relative WA fail', e.message));
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: e.message }); });

app.get('/api/health', (_q, r) => r.json({ ok: true, pin: !!process.env.DESK_PIN }));
const limiter = max => { const m = new Map(); return (req, res, next) => { const n = Date.now(), h = (m.get(req.ip) || []).filter(t => n - t < 36e5); if (h.length >= max) return res.status(429).json({ error: 'Too many requests. Try later.' }); m.set(req.ip, [...h, n]); next(); }; };

// 1) Slip photo or voice note -> Gemini -> verified request
auth.mount(app, limiter, wrap);
app.post('/api/triage', limiter(30), upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const d = await extract(req.file.buffer, req.file.mimetype);
  const coordinates = [parseFloat(req.body.lng) || 77.6006, parseFloat(req.body.lat) || 14.6819];
  const uid = auth.userFrom(req), usr = uid && await User.findById(uid);
  const doc = await EmergencyRequest.create({ ...d, requesterPhone: (usr && usr.phone) || wa10(req.body.requesterPhone) || wa10(process.env.DEMO_RELATIVE_PHONE), user: uid, location: { type: 'Point', coordinates } });
  await audit(doc._id, 'triage', { verified: d.verified });
  res.json({ id: doc._id, ...d });
}));

// 2) Blood banks within radius that stock compatible units
app.get('/api/banks', wrap(async (req, res) => {
  const lat = parseFloat(req.query.lat), lng = parseFloat(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'lat and lng required' });
  res.json(await findBanks(lat, lng, req.query.radius));
}));

// 3) Eligible donors: compatible group, consented, available, not donated in last 90 days
// Demo only (DEMO_PHONE set): if no donors live near this request, create 10 sample donors around it, so the demo works in any town of Andhra Pradesh
const ROSTER = [['Mahesh Sharma', 'B+', 1.2, 140], ['Hari', 'O+', 1.4, 200], ['Venkat Shaik', 'B+', 1.8, 120], ['Anitha Rao', 'A+', 2.9, 180], ['Sravani', 'O+', 3.0, 250], ['Imran', 'O-', 4.0, 95], ['Fatima Begum', 'AB+', 4.4, 160], ['Divya Reddy', 'A-', 5.1, 300], ['Suresh Babu', 'B-', 5.8, 210], ['Ravi Kumar', 'AB-', 6.5, 130]];
async function ensureDemoDonors(r) {
  if (!process.env.DEMO_PHONE) return;
  if ((await Donor.find({ location: near(r.location.coordinates, 50) }).limit(10).select('_id').lean()).length >= 10) return;
  const [lng, lat] = r.location.coordinates;
  await Donor.insertMany(ROSTER.map(([name, bloodGroup, km, d], i) => { const a = i * 36 * Math.PI / 180; return { name, bloodGroup, phone: process.env.DEMO_PHONE, consent: true, sample: true, lastDonatedAt: new Date(Date.now() - d * 864e5),
    location: { type: 'Point', coordinates: [lng + km * Math.sin(a) / (111 * Math.cos(lat * Math.PI / 180)), lat + km * Math.cos(a) / 111] } }; }));
}
async function eligibleDonors(r) {
  await ensureDemoDonors(r);
  const cutoff = new Date(Date.now() - 90 * 864e5);
  const ds = await Donor.find({ bloodGroup: { $in: process.env.COMPATIBLE_DONORS === '1' ? (DONOR_FOR[r.bloodGroup] || []) : [r.bloodGroup] }, available: true, consent: true, ...(r.requesterPhone ? { phone: { $ne: r.requesterPhone } } : {}),
    $or: [{ lastDonatedAt: null }, { lastDonatedAt: { $lte: cutoff } }], location: near(r.location.coordinates, 50) }).limit(30).lean();
  return ds.map(d => { const km = kmBetween(r.location.coordinates, d.location.coordinates); return { _id: d._id, name: d.name, bloodGroup: d.bloodGroup, km: +km.toFixed(1), eta: Math.max(3, Math.round(km / 25 * 60)) + ' min', phone: d.phone }; });
}
app.get('/api/requests/:id/donors', wrap(async (req, res) => {
  const r = await EmergencyRequest.findById(req.params.id); if (!r || !r.verified) return res.status(404).json({ error: 'not found or unverified' });
  res.json((await eligibleDonors(r)).map(({ phone, ...d }) => d));
}));

// 4) Send WhatsApp alerts (one donor via body.donorId, or all eligible)
app.post('/api/requests/:id/broadcast', wrap(async (req, res) => {
  const r = await EmergencyRequest.findById(req.params.id); if (!r || !r.verified || r.status !== 'open') return res.status(400).json({ error: 'request not open/verified' });
  let list = await eligibleDonors(r); if (req.body.donorId) list = list.filter(d => String(d._id) === req.body.donorId);
  list = list.filter(d => !r.notified.some(n => String(n.donor) === String(d._id)));
  let sent = 0;
  for (const d of list) { try { await wa.sendAlert(d.phone, r, d._id); r.notified.push({ donor: d._id, phone: d.phone, at: new Date() }); sent++; } catch (e) { console.error('WA fail', d.name, e.message); } }
  await r.save(); await audit(r._id, 'broadcast', { sent }); if (sent) tell(r.requesterPhone, `Find Blood: we alerted ${sent} nearby donor(s) for ${r.units} unit(s) of ${r.bloodGroup}. We will update you here.`); res.json({ sent });
}));

// 3b) Donor self-registration (consent required)
const regHits = new Map();
app.post('/api/donors', wrap(async (req, res) => {
  const now = Date.now(), hits = (regHits.get(req.ip) || []).filter(t => now - t < 36e5);
  if (hits.length >= 10) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  regHits.set(req.ip, [...hits, now]);
  const { name, phone, bloodGroup, lastDonatedAt, consent } = req.body, lat = Number(req.body.lat), lng = Number(req.body.lng);
  const digits = String(phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const bad = m => res.status(400).json({ error: m });
  if (!name || String(name).trim().length < 2) return bad('Enter your name');
  if (!/^[6-9]\d{9}$/.test(digits)) return bad('Enter a valid 10-digit mobile number');
  if (!Object.keys(DONOR_FOR).includes(bloodGroup)) return bad('Choose a blood group');
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (!lat && !lng)) return bad('Share your location');
  if (consent !== true) return bad('Consent is required');
  let last = lastDonatedAt ? new Date(lastDonatedAt) : null; if (last && (isNaN(last) || last > new Date())) last = null;
  await Donor.findOneAndUpdate({ phone: '91' + digits }, { name: String(name).trim().slice(0, 60), bloodGroup, consent: true, available: true,
    lastDonatedAt: last, location: { type: 'Point', coordinates: [lng, lat] } }, { upsert: true, setDefaultsOnInsert: true });
  res.json({ ok: true });
}));

// 4b) Exact hospital coordinates for the "Route to hospital" button (cached on the request)
app.get('/api/requests/:id/route', wrap(async (req, res) => {
  const r = await EmergencyRequest.findById(req.params.id); if (!r) return res.status(404).json({ error: 'not found' });
  if (!r.hospitalGeo || !r.hospitalGeo.lat) { const g = await geocodeHospital(r.hospital, r.location.coordinates); if (g) { r.hospitalGeo = g; await r.save(); } }
  res.json(r.hospitalGeo && r.hospitalGeo.lat ? r.hospitalGeo : { label: r.hospital });
}));

// 5) WhatsApp webhook: verification + button replies
app.get('/webhook/whatsapp', (q, r) => q.query['hub.verify_token'] === process.env.WA_VERIFY_TOKEN ? r.send(q.query['hub.challenge']) : r.sendStatus(403));
async function handleMessage(m, value) {
    if (m.type === 'text' || m.type === 'location') { await onboard(m, value); return; }
    const p = m.button?.payload || m.interactive?.button_reply?.id; if (!p) return;
    const [act, rid, did] = p.split(':'); const r = await EmergencyRequest.findById(rid), donor = await Donor.findById(did);
    if (!r || !donor || r.status === 'completed') { await wa.sendText(m.from, 'This request is closed. Thank you for being ready to help!'); return; }
    if (act === 'R') { await EmergencyRequest.updateOne({ _id: rid, 'acceptedBy.donor': did }, { $set: { 'acceptedBy.$.arrived': true } });
      io.to(String(rid)).emit('donor:arrived', { name: donor.name }); await audit(rid, 'arrived', { donor: donor.name });
      tell(r.requesterPhone, `🩸 ${donor.name} has arrived at ${r.hospital}.`);
      await wa.sendText(m.from, 'Thank you! The patient family has been informed that you have arrived.'); return; }
    await EmergencyRequest.updateOne({ _id: rid, 'notified.donor': did }, { $set: { 'notified.$.response': act === 'A' ? 'accepted' : 'declined' } });
    if (act !== 'A') { io.to(String(rid)).emit('donor:declined', { name: donor.name }); await wa.sendText(m.from, 'No problem. Thank you for responding!'); return; }
    const u = await EmergencyRequest.findOneAndUpdate({ _id: rid, status: 'open', 'acceptedBy.donor': { $ne: did }, $expr: { $lt: ['$acceptedUnits', '$units'] } },
      { $inc: { acceptedUnits: 1 }, $push: { acceptedBy: { donor: did, name: donor.name, at: new Date() } } }, { new: true });
    if (!u) { await wa.sendText(m.from, 'Enough donors have already confirmed. Thank you!'); return; }
    const km = kmBetween(u.location.coordinates, donor.location.coordinates);
    let g = u.hospitalGeo; if (!g || !g.lat) { g = await geocodeHospital(u.hospital, u.location.coordinates); if (g) { u.hospitalGeo = g; await u.save(); } }
    const link = g && g.lat ? `\n\nRoute: https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}` : '';
    await wa.sendArrived(m.from, `Thank you ${donor.name}! Please go to ${u.hospital} blood bank and ask for patient ${u.patient || ''}.${link}\n\nTap the button below when you reach the hospital.`, rid, did);
    io.to(String(rid)).emit('donor:accepted', { name: donor.name, acceptedUnits: u.acceptedUnits, needed: u.units, etaMin: Math.max(3, Math.round(km / 25 * 60)) });
    tell(u.requesterPhone, `✅ ${donor.name} accepted your request (${u.acceptedUnits}/${u.units} units). Arriving at ${u.hospital} in about ${Math.max(3, Math.round(km / 25 * 60))} min.`);
    await audit(u._id, 'accepted', { donor: donor.name });
}
app.post('/webhook/whatsapp', async (req, res) => {
  if (!wa.verifySignature(req)) return res.sendStatus(401);
  res.sendStatus(200);
  try { for (const e of req.body.entry || []) for (const c of e.changes || []) for (const m of c.value.messages || []) await handleMessage(m, c.value); } catch (err) { console.error('webhook', err); }
});

// 5b) Simulated WhatsApp for demos without Meta: open /donor.html as the donor's (or relative's) phone.
// Active when WA_TOKEN is empty, or when SIM_WHATSAPP=1.
const SIM = () => !process.env.WA_TOKEN || process.env.SIM_WHATSAPP === '1';
const digits = x => String(x || '').replace(/\D/g, ''), simBox = new Map();
wa.setSim(SIM, (to, body) => { const m = { id: Date.now() + Math.random(), at: Date.now(), body }; simBox.set(to, [...(simBox.get(to) || []), m].slice(-30)); io.to('phone:' + to).emit('wa:message', m); });
io.on('connection', s => s.on('sim:join', phone => { if (!SIM()) return; phone = digits(phone); s.join('phone:' + phone); s.emit('wa:history', simBox.get(phone) || []); }));
app.get('/api/sim/config', (_q, r) => r.json({ sim: SIM(), phone: process.env.DEMO_PHONE || '910000000000', relativePhone: process.env.DEMO_RELATIVE_PHONE || '' }));
app.post('/api/sim/reply', wrap(async (req, res) => { if (!SIM()) return res.sendStatus(404);
  await handleMessage({ from: digits(req.body.from), type: 'interactive', interactive: { button_reply: { id: String(req.body.id || '') } } }, {}); res.json({ ok: true }); }));

// 6) Kill switch: hospital confirms receipt -> close request, revoke all pending alerts
app.post('/api/requests/:id/complete', wrap(async (req, res) => {
  if (process.env.DESK_PIN && req.get('x-desk-pin') !== process.env.DESK_PIN) return res.status(401).json({ error: 'Wrong hospital desk PIN' });
  const r = await EmergencyRequest.findOneAndUpdate({ _id: req.params.id, status: 'open' }, { status: 'completed' }, { new: true });
  if (!r) return res.status(404).json({ error: 'not open' });
  for (const n of r.notified) wa.sendText(n.phone, 'Update: the blood requirement is fulfilled. No further action needed. Thank you!').catch(() => {});
  tell(r.requesterPhone, 'Find Blood: the required units are confirmed at the hospital. Request closed. Thank you!'); io.to(String(r._id)).emit('request:completed'); await audit(r._id, 'kill-switch', { revoked: r.notified.length });
  res.json({ revoked: r.notified.length });
}));

mongoose.connect(process.env.MONGODB_URI).then(() => server.listen(process.env.PORT || 3000, () => console.log('Find Blood on http://localhost:' + (process.env.PORT || 3000))))
  .catch(e => { console.error('Mongo connect failed:', e.message); process.exit(1); });
