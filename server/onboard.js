// WhatsApp bot: a person messages your business number and registers as a donor (blood group > recent donation > location pin).
const { Donor, Onboarding, User } = require('./models'), wa = require('./whatsapp');
const parseGroup = t => { const s = String(t).toUpperCase().replace(/\s+/g, '').replace(/VE$/, '').replace('POSITIVE', '+').replace('NEGATIVE', '-').replace('POS', '+').replace('NEG', '-'); const m = s.match(/^(AB|A|B|O)([+-])$/); return m ? m[1] + m[2] : null; };
module.exports = async function onboard(m, value) {
  const from = m.from, text = (m.text?.body || '').trim(), name = value.contacts?.[0]?.profile?.name || 'Donor';
  // Demo mode: your own number is every demo donor, so skip sign-up questions
  const same = x => x && from === x.replace(/\D/g, '');
  if (same(process.env.DEMO_PHONE)) return wa.sendText(from, '✅ Demo connected. Open the Find Blood app and tap Send WhatsApp on a donor to receive the alert here.');
  if (same(process.env.DEMO_RELATIVE_PHONE)) return wa.sendText(from, '✅ Connected. You will get updates about your blood request here.');
  if (/^(stop|unsubscribe)$/i.test(text)) { await Donor.updateMany({ phone: from }, { consent: false, available: false }); await Onboarding.deleteOne({ phone: from });
    return wa.sendText(from, 'You are unsubscribed and will get no more alerts. Thank you for your support!'); }
  let st = await Onboarding.findOne({ phone: from });
  if (m.type === 'location') {
    if (!st || st.step !== 'location') return wa.sendText(from, 'Send "Hi" to register as a blood donor.');
    const { latitude, longitude } = m.location;
    await Donor.findOneAndUpdate({ phone: from }, { name, bloodGroup: st.bloodGroup, consent: true, available: true, lastDonatedAt: st.recent ? new Date() : null, location: { type: 'Point', coordinates: [longitude, latitude] } }, { upsert: true, setDefaultsOnInsert: true });
    await Onboarding.deleteOne({ phone: from });
    return wa.sendText(from, `Thank you ${name}! You are registered as a ${st.bloodGroup} donor. We will message you only for verified emergencies near you. Reply STOP anytime to unsubscribe.`);
  }
  if (!st) {
    if (m.type === 'text' && !/^donate$/i.test(text) && await User.findOne({ phone: from })) return wa.sendText(from, '✅ Connected. You will get updates about your blood requests here. (Send DONATE to register as a donor on WhatsApp.)');
    const d = await Donor.findOne({ phone: from });
    if (d && d.consent && !/^(update|hi|hello)$/i.test(text)) return wa.sendText(from, 'You are already registered. Reply UPDATE to change details or STOP to unsubscribe.');
    await Onboarding.create({ phone: from, step: 'group' });
    return wa.sendText(from, 'Welcome to Find Blood! By continuing you agree to get emergency blood alerts here (reply STOP anytime).\n\nWhat is your blood group? (for example O+, B negative)');
  }
  if (st.step === 'group') { const g = parseGroup(text); if (!g) return wa.sendText(from, 'Sorry, I did not get that. Please send your blood group like O+, A-, B positive or AB negative.');
    await Onboarding.updateOne({ phone: from }, { step: 'recent', bloodGroup: g }); return wa.sendText(from, `Got it: ${g}. Have you donated blood in the last 3 months? Reply YES or NO.`); }
  if (st.step === 'recent') { if (!/^(yes|y|no|n)$/i.test(text)) return wa.sendText(from, 'Please reply YES or NO.');
    await Onboarding.updateOne({ phone: from }, { step: 'location', recent: /^y/i.test(text) });
    return wa.sendText(from, 'Last step: share your location so we can find emergencies near you. Tap the + (or paperclip) icon > Location > Send your current location.'); }
  return wa.sendText(from, 'Please share your location using the + (or paperclip) icon > Location > Send your current location.');
};
