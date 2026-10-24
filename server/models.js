const m = require('mongoose');
const point = { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } }; // [lng, lat]
const BloodBank = m.model('BloodBank', new m.Schema({ name: String, type: String, units: Number, phone: String, source: String, osmId: String, kind: String, fetchedAt: Date, location: point }).index({ location: '2dsphere' }).index({ osmId: 1 }));
const Donor = m.model('Donor', new m.Schema({ name: String, phone: String, bloodGroup: String, location: point,
  lastDonatedAt: Date, available: { type: Boolean, default: true }, consent: { type: Boolean, default: false }, sample: Boolean }).index({ location: '2dsphere' }));
const EmergencyRequest = m.model('EmergencyRequest', new m.Schema({
  bloodGroup: String, units: Number, hospital: String, patient: String, reason: String, doctorRegNo: String, ipdId: String, verified: Boolean, level: String, hospitalGeo: Object, requesterPhone: String, user: m.Types.ObjectId,
  location: point, status: { type: String, enum: ['open', 'completed'], default: 'open' }, acceptedUnits: { type: Number, default: 0 },
  acceptedBy: [{ donor: m.Types.ObjectId, name: String, at: Date, arrived: Boolean }],
  notified: [{ donor: m.Types.ObjectId, phone: String, response: { type: String, default: 'pending' }, at: Date }] }, { timestamps: true }));
const AuditLog = m.model('AuditLog', new m.Schema({ request: m.Types.ObjectId, event: String, meta: Object }, { timestamps: true }));
const Onboarding = m.model('Onboarding', new m.Schema({ phone: { type: String, unique: true }, step: String, bloodGroup: String, recent: Boolean, createdAt: { type: Date, default: Date.now, expires: 86400 } }));
const User = m.model('User', new m.Schema({ name: String, phone: { type: String, unique: true }, salt: String, hash: String }, { timestamps: true }));
module.exports = { User, BloodBank, Donor, EmergencyRequest, AuditLog, Onboarding };
