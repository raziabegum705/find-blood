const crypto = require('crypto');
const url = () => `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_ID}/messages`;
let simOn = () => false, simEmit = () => {};
const setSim = (on, emit) => { simOn = on; simEmit = emit; };
async function post(body) {
  if (simOn()) { console.log('[WhatsApp SIM]', body.type, '->', body.to); simEmit(String(body.to).replace(/\D/g, ''), body); return { sim: true }; }
  if (!process.env.WA_TOKEN) { console.log('[WhatsApp DEV]', JSON.stringify(body, null, 1)); return { dev: true }; }
  const r = await fetch(url(), { method: 'POST', headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', ...body }) });
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j)); return j;
}
const clip = (s, n) => String(s || '-').slice(0, n);
// Urgent request: header + details + [Accept] [Reject]. Free-form buttons work inside the 24h window (the donor messaged us in the last 24h).
// Outside that window WhatsApp rejects it (error 131047) and we fall back to the approved template (WA_TEMPLATE, default "blood_request").
const interactive = (to, r, donorId) => post({ to, type: 'interactive', interactive: { type: 'button',
  header: { type: 'text', text: '🩸 URGENT BLOOD REQUEST' },
  body: { text: `A patient nearby needs your help.\n\n*Blood Group:* ${r.bloodGroup}\n*Units Needed:* ${r.units}\n*Hospital:* ${clip(r.hospital, 120)}\n*Patient:* ${clip(r.patient, 60)}\n*Reason:* ${clip(r.reason || 'Emergency', 80)}\n\nCan you donate blood?` },
  footer: { text: 'Find Blood' },
  action: { buttons: [{ type: 'reply', reply: { id: `A:${r._id}:${donorId}`, title: 'Accept' } }, { type: 'reply', reply: { id: `N:${r._id}:${donorId}`, title: 'Reject' } }] } } });
// Template body (create + approve in WhatsApp Manager, 5 variables, quick replies "Accept" and "Reject"):
// 🩸 *URGENT BLOOD REQUEST*  A patient nearby needs your help.  *Blood Group:* {{1}}  *Units Needed:* {{2}}  *Hospital:* {{3}}  *Patient:* {{4}}  *Reason:* {{5}}  Can you donate blood?
const template = (to, r, donorId) => post({ to, type: 'template', template: { name: process.env.WA_TEMPLATE || 'blood_request', language: { code: 'en' }, components: [
  { type: 'body', parameters: [r.bloodGroup, String(r.units), clip(r.hospital, 120), clip(r.patient, 60), clip(r.reason || 'Emergency', 80)].map(text => ({ type: 'text', text })) },
  { type: 'button', sub_type: 'quick_reply', index: '0', parameters: [{ type: 'payload', payload: `A:${r._id}:${donorId}` }] },
  { type: 'button', sub_type: 'quick_reply', index: '1', parameters: [{ type: 'payload', payload: `N:${r._id}:${donorId}` }] }] } });
async function sendAlert(to, r, donorId) { try { return await interactive(to, r, donorId); } catch (e) { if (!/131047|re-engagement/i.test(e.message)) throw e; return template(to, r, donorId); } }
const sendText = (to, body) => post({ to, type: 'text', text: { body } });
// After Accept: one button the donor taps on reaching the hospital, which informs the patient's family live.
const sendArrived = (to, body, rid, did) => post({ to, type: 'interactive', interactive: { type: 'button', body: { text: body }, action: { buttons: [{ type: 'reply', reply: { id: `R:${rid}:${did}`, title: 'I have arrived' } }] } } });
const verifySignature = (req) => { if (!process.env.WA_APP_SECRET) return true;
  const sig = (req.get('x-hub-signature-256') || '').replace('sha256=', ''); const h = crypto.createHmac('sha256', process.env.WA_APP_SECRET).update(req.rawBody || '').digest('hex');
  return sig.length === h.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h)); };
module.exports = { setSim, sendAlert, sendText, sendArrived, verifySignature };
