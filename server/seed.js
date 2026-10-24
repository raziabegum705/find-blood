// Usage: npm run seed        (4 demo donors + 80 random donors)
//        npm run seed 150    (150 random donors)
// Set DEMO_PHONE=91XXXXXXXXXX in .env so the first donor (Hari) is YOUR WhatsApp number for the live demo.
require('dotenv').config(); const mongoose = require('mongoose'); const { BloodBank, Donor } = require('./models');
const P = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] }), ago = d => new Date(Date.now() - d * 864e5), rnd = (a, b) => a + Math.random() * (b - a);
const CITIES = [['Anantapur', 14.6819, 77.6006, 35], ['Gooty', 15.122, 77.633, 10], ['Kurnool', 15.8281, 78.0373, 15], ['Puttaparthi', 14.165, 77.811, 10], ['Hindupur', 13.8283, 77.491, 10], ['Tadipatri', 14.9087, 78.009, 10], ['Dharmavaram', 14.4144, 77.7211, 10]];
const GROUPS = [['O+', 36], ['B+', 31], ['A+', 21], ['AB+', 7], ['O-', 2], ['B-', 1.5], ['A-', 1], ['AB-', .5]];
const FIRST = ['Hari', 'Sravani', 'Imran', 'Kiran', 'Divya', 'Ravi', 'Lakshmi', 'Venkat', 'Anitha', 'Suresh', 'Fatima', 'Mahesh', 'Priya', 'Arjun', 'Zainab', 'Naveen', 'Meena', 'Rahul', 'Swathi', 'Teja'];
const LAST = ['Reddy', 'Naidu', 'Shaik', 'Kumar', 'Rao', 'Begum', 'Sharma', 'Babu', 'Devi', 'Khan'];
const pick = w => { let r = Math.random() * w.reduce((s, x) => s + x[w[0].length - 1], 0); for (const x of w) { r -= x[x.length - 1]; if (r <= 0) return x; } return w[0]; };
(async () => { await mongoose.connect(process.env.MONGODB_URI); await BloodBank.deleteMany({ source: { $ne: 'osm' } }); await Donor.deleteMany({});
  await BloodBank.insertMany([['Govt General Hospital Blood Bank, Anantapur', 'Government', 18, 14.68, 77.6], ['Sri Sathya Sai Blood Centre, Puttaparthi', 'Charitable/Vol', 38, 14.165, 77.811],
    ['Area Hospital Blood Bank, Gooty', 'Government', 9, 15.122, 77.633], ['Govt Blood Bank, Hindupur', 'Government', 12, 13.8283, 77.491], ['Karunya Blood Centre, Kurnool', 'Private', 45, 15.8281, 78.0373]]
    .map(([name, type, units, la, ln]) => ({ name, type, units, source: 'sample', location: P(la, ln) })));
  // 10 fixed demo donors near Anantapur: all 8 blood groups (B+ and O+ twice)
  const demo = [['Mahesh Sharma', 'B+', 14.6925, 77.6006, 140], ['Hari', 'O+', 14.6819, 77.6134, 200], ['Venkat Shaik', 'B+', 14.6655, 77.6006, 120], ['Anitha Rao', 'A+', 14.6819, 77.5738, 180], ['Sravani', 'O+', 14.7, 77.625, 250],
    ['Imran', 'O-', 14.65, 77.63, 95], ['Fatima Begum', 'AB+', 14.71, 77.57, 160], ['Divya Reddy', 'A-', 14.64, 77.58, 300], ['Suresh Babu', 'B-', 14.72, 77.64, 210], ['Ravi Kumar', 'AB-', 14.62, 77.62, 130]]
    .map(([name, bloodGroup, la, ln, d], i) => ({ name, bloodGroup, phone: process.env.DEMO_PHONE || '91000000' + String(i).padStart(4, '0'), consent: true, lastDonatedAt: ago(d), location: P(la, ln) }));
  // Random donors: fake NON-DIALABLE numbers (start with 0), so nobody real is ever messaged
  const N = +process.argv[2] || 80, rand = Array.from({ length: N }, (_, i) => {
    const [, la, ln] = pick(CITIES.map(c => [c[0], c[1], c[2], c[3]])), r = Math.sqrt(Math.random()) * 8, a = rnd(0, 2 * Math.PI);
    const lat = la + r * Math.cos(a) / 111, lng = ln + r * Math.sin(a) / (111 * Math.cos(la * Math.PI / 180));
    return { name: FIRST[i % FIRST.length] + ' ' + LAST[Math.floor(Math.random() * LAST.length)], bloodGroup: pick(GROUPS)[0], phone: process.env.DEMO_PHONE || '91000100' + String(i).padStart(4, '0'), consent: true,
      lastDonatedAt: Math.random() < .3 ? null : ago(Math.floor(rnd(20, 400))), location: P(lat, lng) }; });
  await Donor.insertMany([...demo, ...rand]);
  const c = {}; [...demo, ...rand].forEach(d => c[d.bloodGroup] = (c[d.bloodGroup] || 0) + 1);
  if (process.env.DEMO_PHONE) console.log('DEMO_PHONE set: EVERY donor uses your number, so alerts for any donor reach your WhatsApp.');
  console.log(`Seeded 5 banks and ${demo.length + rand.length} donors`, c); process.exit(0); })();
