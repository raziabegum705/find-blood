// Blood donation camps (list + add) and "add a blood bank"
const { Camp, BloodBank } = require('./models');

const today = () => new Date().toISOString().slice(0, 10);
const clean = (text, max) =>
  String(text || '')
    .trim()
    .slice(0, max);
const cleanPhone = (text) => (/^[+0-9 ]{6,15}$/.test(String(text || '').trim()) ? String(text).trim() : '');

function mount(app, limiter, wrap) {
  // Upcoming camps, soonest first
  app.get(
    '/api/camps',
    wrap(async (req, res) => {
      const camps = await Camp.find({ date: { $gte: today() } })
        .sort({ date: 1 })
        .limit(50)
        .lean();

      res.json(
        camps.map((c) => ({
          name: c.name,
          organizer: c.organizer,
          date: c.date,
          time: c.time,
          place: c.place,
          phone: c.phone,
        })),
      );
    }),
  );

  // An organizer adds a camp
  app.post(
    '/api/camps',
    limiter(10),
    wrap(async (req, res) => {
      const name = clean(req.body.name, 80);
      const place = clean(req.body.place, 150);
      const date = String(req.body.date || '');
      const bad = (message) => res.status(400).json({ error: message });

      if (name.length < 3) return bad('Enter the camp name');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today()) return bad('Pick a date from today onwards');
      if (place.length < 3) return bad('Enter the place');

      await Camp.create({
        name,
        place,
        date,
        organizer: clean(req.body.organizer, 80),
        time: clean(req.body.time, 40),
        phone: cleanPhone(req.body.phone),
      });
      res.json({ ok: true });
    }),
  );

  // Someone adds a blood bank (needs a name and a location)
  app.post(
    '/api/banks',
    limiter(10),
    wrap(async (req, res) => {
      const name = clean(req.body.name, 100);
      const lat = Number(req.body.lat);
      const lng = Number(req.body.lng);
      const units = parseInt(req.body.units, 10);
      const type = ['Government', 'Private', 'Charitable/Vol'].includes(req.body.type)
        ? req.body.type
        : 'Blood bank';
      const bad = (message) => res.status(400).json({ error: message });

      if (name.length < 3) return bad('Enter the blood bank name');
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180 ||
        (!lat && !lng)
      ) {
        return bad('Share the location');
      }

      await BloodBank.create({
        name,
        type,
        phone: cleanPhone(req.body.phone),
        units: Number.isFinite(units) && units >= 0 && units < 1000 ? units : undefined,
        source: 'user',
        kind: 'bank',
        location: { type: 'Point', coordinates: [lng, lat] },
      });
      res.json({ ok: true });
    }),
  );
}

module.exports = { mount };
