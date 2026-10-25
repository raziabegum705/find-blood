// Blood camps list, "Add a camp" and "Add a blood bank" forms

const todayStr = () => new Date().toISOString().slice(0, 10);
const readSaved = (key) => JSON.parse(localStorage.getItem(key) || '[]');

// Banks added while the backend is off are saved in this browser and join the sample list
readSaved('fb_banks_user').forEach((bank) => BANKS.push(bank));

// A date picker cannot choose a day in the past
document.querySelector('#cDate').min = todayStr();

// ---------------------------------------------------------------
// Camps
// ---------------------------------------------------------------
function campCard(c) {
  const when = new Date(c.date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const directions = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(c.place);
  const callButton = c.phone ? `<a class="call" href="tel:${E(c.phone)}">📞 Call</a>` : '';
  const source = c.source === 'sample' ? 'Sample data' : 'Added by organizer';

  return `<div class="bank">
    <h4>${E(c.name)}</h4>
    <small>${E(c.organizer || '')}</small>
    <div class="tags"><span>📅 ${when}</span>${c.time ? `<span>🕘 ${E(c.time)}</span>` : ''}</div>
    <small>📍 ${E(c.place)}</small>
    <div class="tags"><span>${source}</span></div>
    <div class="act"><a target="_blank" rel="noopener" href="${directions}">📍 Directions</a>${callButton}</div>
  </div>`;
}

async function loadCamps() {
  await ready;

  let fromServer = [];
  if (live) {
    try {
      const response = await fetch('/api/camps');
      if (response.ok) fromServer = await response.json();
    } catch (error) {
      // the sample camps below still show
    }
  }

  const addedHere = live ? [] : readSaved('fb_camps');
  const samples = CAMPS.map((c) => ({ ...c, source: 'sample' }));

  const all = [...fromServer, ...addedHere, ...samples]
    .filter((c) => c.date >= todayStr())
    .sort((a, b) => a.date.localeCompare(b.date));

  $('#campList').innerHTML = all.map(campCard).join('') || '<small>No upcoming camps yet.</small>';
}

async function saveCamp() {
  const camp = {
    name: $('#cName').value.trim(),
    organizer: $('#cOrg').value.trim(),
    date: $('#cDate').value,
    time: $('#cTime').value.trim(),
    place: $('#cPlace').value.trim(),
    phone: $('#cPhone').value.trim(),
  };

  if (camp.name.length < 3 || !camp.date || camp.place.length < 3) {
    return toast('Fill the camp name, date and place');
  }

  await ready;
  if (live) {
    const result = await jpost('/api/camps', camp);
    if (!result.ok) return toast(result.error || 'Could not save');
  } else {
    const saved = readSaved('fb_camps');
    saved.push(camp);
    localStorage.setItem('fb_camps', JSON.stringify(saved));
  }

  ['#cName', '#cOrg', '#cDate', '#cTime', '#cPlace', '#cPhone'].forEach((id) => ($(id).value = ''));
  toast('Camp added');
  go('camps');
}

// ---------------------------------------------------------------
// Add a blood bank
// ---------------------------------------------------------------
function useMyLocation() {
  if (!navigator.geolocation) return toast('Location not supported');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      $('#bLat').value = position.coords.latitude.toFixed(5);
      $('#bLng').value = position.coords.longitude.toFixed(5);
      $('#bLocBtn').textContent = '✔ Location captured';
    },
    () => toast('Please allow location access'),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

async function saveBank() {
  const bank = {
    name: $('#bName').value.trim(),
    type: $('#bType').value,
    phone: $('#bPhone').value.trim(),
    units: $('#bUnits').value,
    lat: parseFloat($('#bLat').value),
    lng: parseFloat($('#bLng').value),
  };

  if (bank.name.length < 3 || !Number.isFinite(bank.lat) || !Number.isFinite(bank.lng)) {
    return toast('Fill the name and location');
  }

  await ready;
  if (live) {
    const result = await jpost('/api/banks', bank);
    if (!result.ok) return toast(result.error || 'Could not save');
  } else {
    const row = { ...bank, units: Number(bank.units) || undefined, source: 'user' };
    BANKS.push(row);
    const saved = readSaved('fb_banks_user');
    saved.push(row);
    localStorage.setItem('fb_banks_user', JSON.stringify(saved));
  }

  ['#bName', '#bPhone', '#bUnits', '#bLat', '#bLng'].forEach((id) => ($(id).value = ''));
  $('#bLocBtn').textContent = '📍 Use my current location';
  toast('Blood bank added');
  go('banks');
}

// Load the camps list whenever the camps screen opens
const goWithoutCamps = go;
go = function (id) {
  goWithoutCamps(id);
  if (id === 'camps') loadCamps();
};
