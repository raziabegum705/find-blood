const $=s=>document.querySelector(s);
let radius=100,map,layer,etaT;
function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
 ({triage:runTriage,verified:fillVerified,donors:renderDonors,whatsapp:fillWA,confirmed:startEta,banks:initBanks})[id]?.();}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function setLang(l){document.querySelectorAll('[data-i]').forEach(e=>e.textContent=I18N[l][e.dataset.i])}
function tab(k){['V','P'].forEach(x=>{$('#panel'+x).classList.toggle('hide',x!==k);$('#tab'+x).classList.toggle('on',x===k)})}
function preview(i){const f=i.files[0];if(!f)return;const p=$('#prev');p.src=URL.createObjectURL(f);p.classList.remove('hide');$('#dropTxt').classList.add('hide')}
// waveform + 5s voice recording (MediaRecorder)
const wave=$('#wave');for(let i=0;i<32;i++)wave.appendChild(document.createElement('i'));
async function record(){const b=$('#recBtn');let n=5,anim;
 const bars=[...wave.children];anim=setInterval(()=>bars.forEach(x=>x.style.height=(8+Math.random()*55)+'px'),120);
 try{const st=await navigator.mediaDevices.getUserMedia({audio:true});const mr=new MediaRecorder(st),ch=[];
  mr.ondataavailable=e=>ch.push(e.data);mr.onstop=()=>{window.voiceBlob=new Blob(ch,{type:mr.mimeType});st.getTracks().forEach(t=>t.stop())};mr.start();setTimeout(()=>mr.stop(),5000)}
 catch(e){toast('Mic unavailable - demo mode')}
 const t=setInterval(()=>{b.textContent='Recording... '+n--+'s';if(n<0){clearInterval(t);clearInterval(anim);bars.forEach(x=>x.style.height='8px');b.textContent='✔ Voice note captured'}},1000)}
// AI triage (simulated). Replace with POST /api/triage -> Gemini 2.5 Flash
function runTriage(){const li=[...document.querySelectorAll('#steps li')];li.forEach(x=>x.classList.remove('done'));let p=0;
 const t=setInterval(()=>{p+=4;$('#barfill').style.width=p+'%';$('#pct').textContent=p+'%';li.forEach((x,i)=>{if(p>=(i+1)*25)x.classList.add('done')});
  if(p>=100){clearInterval(t);setTimeout(()=>go('verified'),500)}},120)}
function fillVerified(){const r=REQUEST,d=new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});
 $('#matrix').innerHTML=`<div><small>Blood Group</small><b>${r.group}</b></div><div><small>Units Needed</small><b>${r.units}</b></div><div class="full"><small>Hospital</small><b>${r.hospital}</b></div><div class="full"><small>Patient & Reason</small><b>${r.patient}, ${r.reason}</b></div><div class="full"><small>Time</small><b>${d}</b></div>`}
function eligible(){return DONORS.filter(d=>d.group===REQUEST.group&&d.lastDonatedDays>90)} // exact blood group only
function renderDonors(){$('#donorList').innerHTML=eligible().map((d,i)=>`<div class="donor" id="d${i}"><div><b>${d.name}</b> · ${d.group}<small>${d.km} km · ETA ${d.eta}</small></div><button onclick="sendWA(${i})">Send WhatsApp</button></div>`).join('')}
function sendWA(i){REQUEST.donor=eligible()[i];$('#d'+i).classList.add('sent');toast('Alert sent. Opening donor WhatsApp view');setTimeout(()=>go('whatsapp'),900)}
function broadcast(){REQUEST.donor=eligible()[0];toast('Broadcast sent to '+eligible().length+' verified donors');setTimeout(()=>go('whatsapp'),1100)}
function fillWA(){$('#waG').textContent=REQUEST.group;$('#waU').textContent=REQUEST.units;$('#waH').textContent=REQUEST.hospital;$('#waP').textContent=REQUEST.patient;$('#waR').textContent=REQUEST.reason||'Emergency';$('#waT').textContent=new Date().toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})}
function acceptDemo(){const d=REQUEST.donor||DONORS[0];go('confirmed');$('#confirmed .ok').textContent='✅ 1/'+REQUEST.units+' units accepted by '+d.name;celebrate(d.name,1,REQUEST.units)}
function rejectDemo(){toast('Marked not available');go('donors')}
function closeParty(){const p=$('#party');p&&p.remove()}
function celebrate(name,a,b){closeParty();const el=document.createElement('div');el.id='party';el.className='party';const C=['#c4161c','#ffb703','#2a9d8f','#4361ee','#f72585','#06d6a0'];let h='';
 for(let i=0;i<70;i++)h+=`<i style="left:${Math.random()*100}%;background:${C[i%6]};animation-delay:${Math.random()*1.2}s;animation-duration:${2.2+Math.random()*1.6}s;transform:rotate(${Math.random()*360}deg)"></i>`;
 el.innerHTML=h+`<div class="pcard"><div class="big">💖</div><h2>🎉 Great news!</h2><p>${name} accepted your request!</p><p>Help is on the way</p><p class="sub">${a}/${b} units confirmed</p><button class="btn-red" onclick="closeParty()">Track donor</button></div>`;
 $('.app').appendChild(el);navigator.vibrate&&navigator.vibrate([120,60,120]);setTimeout(closeParty,9000)}
function startEta(){let s=(parseInt(REQUEST.donor&&REQUEST.donor.eta)||18)*60;clearInterval(etaT);const f=()=>{$('#eta').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(s>0)s--};f();etaT=setInterval(f,1000);
 $('#dirBtn').href='https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(REQUEST.hospital)}
// blood bank locator
function km(a,b,c,d){const R=6371,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b);const h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function setR(r){radius=r;document.querySelectorAll('.pills button').forEach(b=>b.classList.toggle('on',b.textContent.startsWith(r)));drawBanks()}
function initBanks(){if(!map&&window.L){map=L.map('map',{zoomControl:false}).setView([CENTER.lat,CENTER.lng],8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);layer=L.layerGroup().addTo(map)}
 setTimeout(()=>{map&&map.invalidateSize();drawBanks()},100)}
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function drawBanks(){const list=BANKS.map(b=>({...b,d:km(CENTER.lat,CENTER.lng,b.lat,b.lng)})).filter(b=>b.d<=radius).sort((a,b)=>a.d-b.d);
  $('#cnt').textContent=`Showing ${list.length} bank(s)`;
  if(layer){layer.clearLayers();L.circleMarker([CENTER.lat,CENTER.lng],{color:'#c4161c',radius:8}).addTo(layer);list.forEach(b=>L.marker([b.lat,b.lng]).bindPopup(E(b.name)).addTo(layer));map.setView([CENTER.lat,CENTER.lng],radius<=25?10:radius<=50?9:8)}
  const ph=b=>b.phone&&!/^0+$/.test(b.phone);
  $('#bankList').innerHTML=list.map((b,i)=>`<div class="bank"><h4>${E(b.name)}</h4><small>${b.d.toFixed(1)} km</small><div class="tags"><span>${E(b.type)}</span>${b.units?`<span class="u">${b.units} units</span>`:'<span>Call to confirm stock</span>'}<span>${b.source==='osm'?'Live map data':'Sample data'}</span></div>
  <div class="act"><button onclick="share(${i})">⤴</button><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}">📍</a>${ph(b)?`<a class="call" href="tel:${E(b.phone)}">📞 Call</a>`:'<a class="call" style="opacity:.5;pointer-events:none">Phone not listed</a>'}</div></div>`).join('')||'<small>No banks in this radius.</small>';
  window._list=list}
function share(i){const b=window._list[i],t=b.name+(b.units?' - '+b.units+' units':'');navigator.share?navigator.share({title:'Blood bank',text:t}):(navigator.clipboard?.writeText(t),toast('Copied'))}
