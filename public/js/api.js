// Live-mode overlay: uses the Express backend when reachable; otherwise the demo in app.js keeps working.
const API = (window.API_BASE || '').replace(/\/$/, ''), _fetch = window.fetch.bind(window);
window.fetch = (u, o = {}) => { if (typeof u === 'string' && u.startsWith('/api')) { const tk = localStorage.getItem('fb_token'); if (tk) o = { ...o, headers: { ...(o.headers || {}), Authorization: 'Bearer ' + tk } }; u = API + u; } return _fetch(u, o); };
let live = false, needPin = false, socket, donorsLive = [], regLoc = null;
const ready = (async () => {
  if (!location.protocol.startsWith('http')) return;
  const slow = setTimeout(() => toast('Waking up the server, please wait...'), 2500);
  for (let i = 0; i < 12 && !live; i++) {
    try { const r = await fetch('/api/health'); if (r.status === 404) break; const h = await r.json(); live = !!h.ok; needPin = !!h.pin; }
    catch { await new Promise(r => setTimeout(r, 5000)); } }
  clearTimeout(slow);
  if (live && window.io) { socket = io(API || undefined);
    socket.on('donor:accepted', d => { _go('confirmed'); celebrate(d.name, d.acceptedUnits, d.needed); document.querySelector('#confirmed .ok').textContent = `✅ ${d.acceptedUnits}/${d.needed} units accepted by ${d.name}`; clearInterval(etaT); let s = d.etaMin * 60;
      etaT = setInterval(() => { document.getElementById('eta').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); if (s > 0) s--; }, 1000); });
    socket.on('donor:arrived', d => { _go('confirmed'); clearInterval(etaT); document.querySelector('#confirmed .ok').textContent = `🩸 ${d.name} has arrived at the hospital`; document.getElementById('eta').textContent = '00:00'; toast(`🩸 ${d.name} has arrived at the hospital`); });
    socket.on('donor:declined', d => toast(`${d.name} declined`)); }
})();
const jpost = (u, b, h) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(h || {}) }, body: JSON.stringify(b || {}) }).then(r => r.json());
const _sim = runTriage, _go = go, _banks = initBanks, _donors = renderDonors, _bc = broadcast, _send = sendWA;
const waiting = () => { _go('confirmed'); clearInterval(etaT); document.querySelector('#confirmed .ok').textContent = '⏳ Waiting for donors to reply on WhatsApp...'; document.getElementById('eta').textContent = '--:--'; };
runTriage = async function () {
  await ready; const file = document.getElementById('slip').files[0] || window.voiceBlob;
  if (!live || !file) { if (!live) REQUEST.group = $('#dGroup').value; return _sim(); }
  let p = 0; const t = setInterval(() => { p = Math.min(p + 2, 90); $('#barfill').style.width = p + '%'; $('#pct').textContent = p + '%'; }, 150);
  try {
    const pos = await getPos(); if (pos) Object.assign(CENTER, pos);
    const fd = new FormData(); fd.append('file', file, file.name || 'voice'); fd.append('requesterPhone', $('#relPhone').value); fd.append('lat', CENTER.lat); fd.append('lng', CENTER.lng);
    const d = await (await fetch('/api/triage', { method: 'POST', body: fd })).json(); clearInterval(t);
    if (!d.id) throw new Error(d.error || 'triage failed');
    if (!d.verified) { toast(d.missing && d.missing.length ? 'Missing: ' + d.missing.join(', ') + '. Try again.' : 'Could not read it. Try again.'); return _go('intake'); }
    Object.assign(REQUEST, { id: d.id, group: d.bloodGroup, units: d.units, hospital: d.hospital, patient: d.patient || '-', reason: d.reason || '-' });
    socket && socket.emit('join', d.id); $('#barfill').style.width = '100%'; $('#pct').textContent = '100%';
    document.querySelectorAll('#steps li').forEach(x => x.classList.add('done'));
    setTimeout(() => { _go('verified'); document.querySelector('#verified .ok').textContent = d.level === 'voice' ? '🎙 Voice request: slip not yet verified' : '🛡 Patient verified: zero fake request guarantee'; }, 500);
  } catch (e) { clearInterval(t); toast(e.message); _go('intake'); }
};
renderDonors = async function () { await ready; if (!live || !REQUEST.id) return _donors();
  donorsLive = await (await fetch(`/api/requests/${REQUEST.id}/donors`)).json();
  $('#donorList').innerHTML = donorsLive.map((d, i) => `<div class="donor" id="d${i}"><div><b>${d.name}</b> · ${d.bloodGroup}<small>${d.km} km · ETA ${d.eta}</small></div><button onclick="sendWA(${i})">Send WhatsApp</button></div>`).join('') || '<small>No eligible donors nearby.</small>'; };
sendWA = async function (i) { if (!live || !REQUEST.id) return _send(i); const r = await jpost(`/api/requests/${REQUEST.id}/broadcast`, { donorId: donorsLive[i]._id }); $('#d' + i).classList.add('sent'); toast(r.sent ? 'Alert sent' : (r.error || 'Already alerted')); if (r.sent) setTimeout(waiting, 900); };
broadcast = async function () { if (!live || !REQUEST.id) return _bc(); const r = await jpost(`/api/requests/${REQUEST.id}/broadcast`); toast(r.error || (r.sent ? `Alert sent to ${r.sent} donors` : 'No new donors to alert')); if (r.sent) setTimeout(waiting, 1000); };
go = function (id) {
  if (id === 'intake') { const li = typeof me !== 'undefined' && !!me; $('#relPhone').classList.toggle('hide', li); $('#relNote').classList.toggle('hide', !li); ready.then(() => $('#demoGroup').classList.toggle('hide', live)); }
  if (id === 'register' && typeof me !== 'undefined' && me) { if (!$('#rName').value) $('#rName').value = me.name; if (!$('#rPhone').value) $('#rPhone').value = me.phone.replace(/^91/, ''); }
  if (id === 'kill' && live && REQUEST.id) {
    const pin = needPin ? (sessionStorage.getItem('pin') || prompt('Hospital desk PIN') || '') : '';
    fetch(`/api/requests/${REQUEST.id}/complete`, { method: 'POST', headers: { 'x-desk-pin': pin } }).then(r => { if (r.status === 401) { sessionStorage.removeItem('pin'); toast('Wrong PIN'); } else { pin && sessionStorage.setItem('pin', pin); _go('kill'); } });
    return; }
  _go(id); };
initBanks = async function () { await ready;
  const useHosp = window.fromRequest && live && REQUEST.id; window.fromRequest = false; let label = 'Sample banks near Anantapur';
  if (live) {
    label = 'Near your location';
    if (useHosp) { try { const g = await (await fetch(`/api/requests/${REQUEST.id}/route`)).json(); if (g.lat) { Object.assign(CENTER, { lat: g.lat, lng: g.lng }); label = 'Near ' + (g.label || REQUEST.hospital); } } catch {} }
    else { const pos = await getPos(); if (pos) Object.assign(CENTER, pos); }
    $('#cnt').textContent = 'Searching blood banks...';
    try { const l = await (await fetch(`/api/banks?lat=${CENTER.lat}&lng=${CENTER.lng}&radius=100`)).json(); if (Array.isArray(l)) { BANKS.length = 0; BANKS.push(...l); } } catch {}
  }
  $('#bankNear').textContent = label; _banks(); };
// Donor registration form
function getLoc() { if (!navigator.geolocation) return toast('Location not supported');
  navigator.geolocation.getCurrentPosition(p => { regLoc = { lat: p.coords.latitude, lng: p.coords.longitude }; $('#rLocBtn').textContent = '✔ Location captured'; }, () => toast('Please allow location access'), { enableHighAccuracy: true, timeout: 10000 }); }
async function registerDonor() { await ready; if (!live) return toast('Backend not connected');
  if (!regLoc) return toast('Tap "Share my location" first');
  const r = await jpost('/api/donors', { name: $('#rName').value, phone: $('#rPhone').value, bloodGroup: $('#rGroup').value, lastDonatedAt: $('#rLast').value || null, consent: $('#rConsent').checked, ...regLoc });
  if (r.ok) { toast('Thank you! You are registered as a donor.'); _go('home'); } else toast(r.error || 'Could not register'); }

// Exact hospital route: server resolves the hospital name to coordinates near the request, so Maps opens turn-by-turn directions to the right place
async function loadRoute() { if (!live || !REQUEST.id) return;
  try { const g = await (await fetch(`/api/requests/${REQUEST.id}/route`)).json();
    if (g.lat) { $('#dirBtn').href = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${g.lat},${g.lng}`; $('#dirName').textContent = 'Route to: ' + g.label; }
    else $('#dirName').textContent = 'Could not pinpoint the hospital. Check the destination in Maps.'; } catch {} }
const _eta = startEta; startEta = function () { _eta(); loadRoute(); };

const getPos = () => new Promise(res => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null), { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }) : res(null));
