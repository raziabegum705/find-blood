const { GoogleGenerativeAI } = require('@google/generative-ai');
const PROMPT = `You read an Indian hospital blood requisition slip (image) or a short voice note (Telugu/Hindi/English).
Return ONLY JSON: {"bloodGroup":"A+|A-|B+|B-|AB+|AB-|O+|O-|null","units":number|null,"hospital":string|null,"patient":string|null,
"reason":string|null,"doctorRegNo":string|null (doctor stamp / NMC registration number),"ipdId":string|null}. Normalize spoken blood groups ("O positive" -> "O+", "B negative" -> "B-"). Use null when not present. Never guess.`;
async function extract(buffer, mimeType) {
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json', temperature: 0 } });
  const r = await model.generateContent([PROMPT, { inlineData: { mimeType: mimeType.split(';')[0], data: buffer.toString('base64') } }]);
  const d = JSON.parse(r.response.text());
  const voice = mimeType.startsWith('audio');
  if (voice && !(Number(d.units) > 0)) d.units = 1; // voice notes often omit units
  const missing = [];
  if (!['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(d.bloodGroup)) missing.push('blood group');
  if (!(Number(d.units) > 0)) missing.push('units');
  if (!d.hospital) missing.push('hospital');
  if (!voice && !d.doctorRegNo && !d.ipdId) missing.push('doctor reg no / IPD ID');
  return { ...d, units: Number(d.units) || 0, level: voice ? 'voice' : 'slip', missing, verified: missing.length === 0 };
}
module.exports = { extract };
