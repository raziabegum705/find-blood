// Menu drawer + login / signup
let me = JSON.parse(localStorage.getItem('fb_user') || 'null');
function renderWho() { $('#who').textContent = me ? 'Hi, ' + me.name : 'Welcome, guest';
  $('#mLogin').classList.toggle('hide', !!me); $('#mSignup').classList.toggle('hide', !!me); $('#mLogout').classList.toggle('hide', !me); }
function openMenu() { renderWho(); $('#drawer').classList.add('open'); }
function closeMenu(e) { if (!e || e.target.id === 'drawer') $('#drawer').classList.remove('open'); }
function nav(id) { closeMenu(); go(id); }
async function doAuth(kind) { await ready; if (!live) return toast('Backend not connected');
  const body = kind === 'signup' ? { name: $('#sName').value, phone: $('#sPhone').value, password: $('#sPass').value } : { phone: $('#lPhone').value, password: $('#lPass').value };
  const r = await jpost('/api/auth/' + kind, body); if (!r.token) return toast(r.error || 'Error');
  me = r.user; localStorage.setItem('fb_token', r.token); localStorage.setItem('fb_user', JSON.stringify(me)); toast(kind === 'signup' ? 'Account created' : 'Logged in'); go('home'); }
function logout() { me = null; localStorage.removeItem('fb_token'); localStorage.removeItem('fb_user'); closeMenu(); toast('Logged out'); go('home'); }
