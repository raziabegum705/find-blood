const crypto = require('crypto'), { User } = require('./models');
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('JWT_SECRET not set: logins reset on every server restart');
const mac = d => crypto.createHmac('sha256', SECRET).update(d).digest('base64url');
const sign = p => { const d = Buffer.from(JSON.stringify(p)).toString('base64url'); return d + '.' + mac(d); };
const verify = t => { try { const [d, s] = String(t).split('.'), h = mac(d); if (s.length !== h.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(h))) return null;
  const p = JSON.parse(Buffer.from(d, 'base64url')); return p.exp > Date.now() ? p : null; } catch { return null; } };
const hash = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, (e, k) => e ? rej(e) : res(k.toString('hex'))));
const userFrom = req => { const m = (req.get('authorization') || '').match(/^Bearer (.+)$/), p = m && verify(m[1]); return p ? p.uid : null; };
const normPhone = x => String(x || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
const session = u => ({ token: sign({ uid: u._id, exp: Date.now() + 30 * 864e5 }), user: { name: u.name, phone: u.phone } });
function mount(app, limiter, wrap) {
  app.post('/api/auth/signup', limiter(20), wrap(async (req, res) => {
    const { name, password } = req.body, d = normPhone(req.body.phone), bad = m => res.status(400).json({ error: m });
    if (!name || String(name).trim().length < 2) return bad('Enter your name');
    if (!/^[6-9]\d{9}$/.test(d)) return bad('Enter a valid 10-digit mobile number');
    if (!password || String(password).length < 6 || String(password).length > 100) return bad('Password must be at least 6 characters');
    if (await User.findOne({ phone: '91' + d })) return res.status(409).json({ error: 'Phone already registered' });
    const salt = crypto.randomBytes(16).toString('hex'), u = await User.create({ name: String(name).trim().slice(0, 60), phone: '91' + d, salt, hash: await hash(String(password), salt) });
    res.json(session(u)); }));
  app.post('/api/auth/login', limiter(30), wrap(async (req, res) => {
    const u = await User.findOne({ phone: '91' + normPhone(req.body.phone) }), h = u && await hash(String(req.body.password || ''), u.salt);
    if (!u || h.length !== u.hash.length || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(u.hash))) return res.status(401).json({ error: 'Wrong phone or password' });
    res.json(session(u)); }));
  app.get('/api/auth/me', wrap(async (req, res) => { const id = userFrom(req), u = id && await User.findById(id); if (!u) return res.status(401).json({ error: 'Not logged in' }); res.json({ user: { name: u.name, phone: u.phone } }); }));
}
module.exports = { mount, userFrom };
