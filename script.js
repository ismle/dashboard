// ══════════════════════════════════════════════════
// STORAGE  (no accounts — single user, data keyed directly)
// ══════════════════════════════════════════════════
const LS={get:k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),del:k=>localStorage.removeItem(k)};
function getUD(t){return LS.get('tsu_'+t)||[];}
function setUD(t,d){LS.set('tsu_'+t,d);}
function getProfile(){return LS.get('tsu_profile')||{name:'Student',id:'',email:'',course:'',year:'',sem:'1st Semester',ay:''};}
function saveProfile_(){LS.set('tsu_profile',CU);}

// ══════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════
let CU=getProfile(),dark=true,editActId=null,editSjId=null,editAttId=null,sortCol='date',sortDir=-1;
let tChart=null,sChart=null,trChart=null,attChart=null,attMonthChart=null,attDashChart=null;

// ══════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════
const svg=(id,s=13)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><use href="#${id}"/></svg>`;
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtDate(d){if(!d)return'—';const dt=new Date(d+'T12:00:00');return dt.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});}
function fmtDay(d){if(!d)return'—';return new Date(d+'T12:00:00').toLocaleDateString('en-PH',{weekday:'short'});}
function today(){return new Date().toISOString().split('T')[0];}
function clrF(ids){ids.forEach(id=>{const e=document.getElementById(id);if(e)e.value='';})}
function setV(id,v){const e=document.getElementById(id);if(!e)return;for(let o of e.options)if(o.value===v||o.text===v){e.value=o.value;return;}}
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
function toast(msg,type=''){
  const c=document.getElementById('toasts'),t=document.createElement('div');
  t.className='toast '+type;t.innerHTML=`<div class="t-ico">${svg(type==='success'?'i-check':'i-x',11)}</div>${msg}`;
  c.appendChild(t);setTimeout(()=>t.remove(),3200);
}

// ══════════════════════════════════════════════════
// BOOT  (runs immediately — no login needed)
// ══════════════════════════════════════════════════
function bootApp(){
  document.getElementById('app').style.display='flex';
  document.getElementById('app').classList.add('show');
  dark=LS.get('tsu_dark')!==false;
  document.body.classList.toggle('lm',!dark);
  document.getElementById('dark-toggle').checked=dark;
  updateThemeBtn();applyUI();populateSjSelects();renderDashboard();renderTable();renderSubjects();go('dashboard');
}

// ══════════════════════════════════════════════════
// PROFILE  (edit in Settings, save to localStorage)
// ══════════════════════════════════════════════════
function ini(n){return(n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();}
function applyUI(){
  const u=CU,i=ini(u.name||'S');
  document.getElementById('hero-av').textContent=i;
  document.getElementById('hero-name').textContent=u.name||'Student';
  document.getElementById('h-course').textContent=u.course||'—';
  document.getElementById('h-year').textContent=u.year||'—';
  document.getElementById('h-sem').textContent=u.sem||'—';
  document.getElementById('h-ay').textContent=u.ay?'AY '+u.ay:'—';
  document.getElementById('sb-av').textContent=i;
  document.getElementById('sb-name').textContent=u.name||'Student';
  document.getElementById('sb-course').textContent=(u.course||'')+(u.year?' · '+u.year:'');
  document.getElementById('s-name').value=u.name||'';
  document.getElementById('s-id').value=u.id||'';
  document.getElementById('s-email').value=u.email||'';
  document.getElementById('s-ay').value=u.ay||'';
  setV('s-course',u.course);setV('s-year',u.year);setV('s-sem',u.sem);
}
function saveProfile(){
  const name=document.getElementById('s-name').value.trim();
  if(!name){toast('Name cannot be empty.','error');return;}
  CU={...CU,name,id:document.getElementById('s-id').value.trim(),email:document.getElementById('s-email').value.trim(),course:document.getElementById('s-course').value,year:document.getElementById('s-year').value,sem:document.getElementById('s-sem').value,ay:document.getElementById('s-ay').value.trim()};
  saveProfile_();applyUI();toast('Profile saved!','success');
}

// ══════════════════════════════════════════════════
// NAV & THEME
// ══════════════════════════════════════════════════
const PAGE_TITLES={dashboard:'Dashboard',activities:'Activity Logger',attendance:'Attendance Tracker',performance:'Performance Tracker',subjects:'Subjects',gwa:'GWA Computation',settings:'Settings'};
const NAV_MAP=['dashboard','activities','attendance','subjects','performance','gwa','settings'];
function go(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.getElementById('topbar-title').textContent=PAGE_TITLES[page]||'';
  document.querySelectorAll('.nav-item').forEach((n,i)=>n.classList.toggle('active',NAV_MAP[i]===page));
  if(page==='performance')renderCharts();
  if(page==='gwa'){renderGWAPage();document.getElementById('gwa-final').classList.remove('show');document.getElementById('reveal-section').style.display='block';}
  if(page==='dashboard')renderDashboard();
  if(page==='attendance')renderAttPage();
  if(page==='subjects')renderSubjects();
  // sync mobile bottom nav
  const mnMap={dashboard:'mn-dashboard',activities:'mn-activities',attendance:'mn-attendance',gwa:'mn-gwa',settings:'mn-settings'};
  document.querySelectorAll('.mn-item').forEach(i=>i.classList.remove('active'));
  const mnId=mnMap[page];if(mnId){const el=document.getElementById(mnId);if(el)el.classList.add('active');}
  closeSB();
}
function toggleSB(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sb-overlay').classList.toggle('show');}
function closeSB(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sb-overlay').classList.remove('show');}
function updateThemeBtn(){document.getElementById('theme-btn').innerHTML=dark?svg('i-sun',14):svg('i-moon',14);}
function toggleDark(val){
  if(val===undefined)dark=!dark;else dark=val;
  document.body.classList.toggle('lm',!dark);
  document.getElementById('dark-toggle').checked=dark;
  updateThemeBtn();LS.set('tsu_dark',dark);
}

// ══════════════════════════════════════════════════
// DATA  (no per-user prefix — single user)
// ══════════════════════════════════════════════════
function getActs(){return getUD('activities');}
function setActs(d){setUD('activities',d);}
function getSjs(){return getUD('subjects');}
function setSjs(d){setUD('subjects',d);}
function getAtts(){return getUD('attendance');}
function setAtts(d){setUD('attendance',d);}

// ══════════════════════════════════════════════════
// CHED GRADING
// ══════════════════════════════════════════════════
function p2g(p){
  if(p>=96)return 1.00;if(p>=91)return 1.25;if(p>=86)return 1.50;if(p>=81)return 1.75;
  if(p>=76)return 2.00;if(p>=71)return 2.25;if(p>=66)return 2.50;if(p>=61)return 2.75;
  if(p>=60)return 3.00;return 5.00;
}
function gColor(g){if(!g)return'var(--muted)';if(g<=1.25)return'var(--green)';if(g<=1.75)return'#8BC34A';if(g<=2.50)return'var(--gold)';if(g<=3.00)return'#FF9800';return'var(--red)';}
function gwaInterp(gwa){const g=parseFloat(gwa);if(isNaN(g))return{t:'—',c:''};if(g<=1.75)return{t:"Dean's List",c:'ib-deans'};if(g<=3.00)return{t:'Passed',c:'ib-pass'};return{t:'Failed',c:'ib-fail'};}
function getSjGrades(){return getSjs().map(s=>{const a=getActs().filter(x=>x.subject===s.name&&x.score!==''&&x.total>0&&x.status==='completed');if(!a.length)return{...s,pct:0,grade:null,count:0};const avg=a.reduce((sum,x)=>sum+(parseFloat(x.score)/x.total*100),0)/a.length;return{...s,pct:Math.round(avg*10)/10,grade:p2g(avg),count:a.length};});}
function computeGWA(){const g=getSjGrades();let u=0,s=0;g.forEach(x=>{if(x.pct>0){s+=x.grade*x.units;u+=x.units;}});return u===0?null:{gwa:(s/u).toFixed(2),units:u};}

const CATS={
  'completed-acts':{label:'Completed Activities',color:'#52C48A',weight:3},
  'tasks':{label:'Tasks',color:'#6B9FEF',weight:2},
  'performance':{label:'Performance Tasks',color:'#D4A843',weight:5}
};
function getCatData(){
  const acts=getActs().filter(a=>a.status==='completed'&&a.score!==''&&a.total>0);
  return Object.entries(CATS).map(([key,cfg])=>{
    const items=acts.filter(a=>a.category===key);
    if(!items.length)return{key,...cfg,avg:0,grade:null,count:0,items:[]};
    const avg=items.reduce((s,a)=>s+(parseFloat(a.score)/a.total*100),0)/items.length;
    return{key,...cfg,avg:Math.round(avg*10)/10,grade:p2g(avg),count:items.length,items};
  });
}
function computeCatGWA(){
  const cats=getCatData();let wSum=0,wTotal=0;
  cats.forEach(c=>{if(c.grade&&c.count>0){wSum+=c.grade*c.weight;wTotal+=c.weight;}});
  return wTotal===0?null:{gwa:(wSum/wTotal).toFixed(2),cats,wTotal};
}

// ══════════════════════════════════════════════════
// SUBJECT SELECTS
// ══════════════════════════════════════════════════
function populateSjSelects(){
  ['a-subject','filter-subject'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;const v=el.value;
    el.innerHTML=id==='a-subject'?'<option value="">Select subject…</option>':'<option value="">All Subjects</option>';
    getSjs().forEach(s=>{const o=document.createElement('option');o.value=s.name;o.textContent=s.code+' – '+s.name;el.appendChild(o);});el.value=v;
  });
}

// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════
function renderDashboard(){
  const acts=getActs(),atts=getAtts();
  const pending=acts.filter(a=>a.status==='pending').length;
  const present=atts.filter(a=>a.status==='present').length;
  const absent=atts.filter(a=>a.status==='absent').length;
  const late=atts.filter(a=>a.status==='late').length;
  const excused=atts.filter(a=>a.status==='excused').length;
  document.getElementById('st-total').textContent=acts.length;
  document.getElementById('st-pending').textContent=pending;
  document.getElementById('st-present').textContent=present;
  document.getElementById('st-subj').textContent=getSjs().length;
  document.getElementById('pending-badge').textContent=pending;
  const pct=atts.length>0?Math.round((present/atts.length)*100):0;
  document.getElementById('hero-att').textContent=pct+'%';
  const lbl=document.getElementById('hero-att-lbl');
  lbl.textContent=pct>=90?'Excellent':pct>=75?'Good':atts.length>0?'Needs Attention':'No records yet';
  lbl.style.color=pct>=90?'var(--green)':pct>=75?'var(--gold)':atts.length>0?'var(--red)':'var(--muted)';
  const rl=document.getElementById('recent-list');
  const recent=[...acts].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  if(!recent.length){rl.innerHTML=`<div class="empty-state"><div class="es-ico">${svg('i-file',36)}</div><p>No activities yet</p></div>`;}
  else rl.innerHTML=recent.map(a=>{const catLabel=CATS[a.category]?.label||'General';return`<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--border);"><div style="width:7px;height:7px;border-radius:50%;background:${a.status==='completed'?'var(--green)':'var(--gold)'};flex-shrink:0;"></div><div style="flex:1;font-size:12px;color:var(--text);font-weight:500;">${esc(a.title)}<br><small style="color:var(--muted)">${a.subject||'No subject'} · ${catLabel}</small></div><div style="font-size:10.5px;color:var(--muted)">${fmtDate(a.date)}</div><div style="font-family:var(--fm);font-size:11px;color:var(--gold)">${a.score!==''?a.score+'/'+a.total:'—'}</div></div>`;}).join('');
  const mi=document.getElementById('dash-att-mini');
  mi.innerHTML=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"><div style="background:rgba(82,196,138,.1);border-radius:7px;padding:7px;text-align:center;"><div style="font-family:var(--fd);font-size:17px;color:var(--green)">${present}</div><div style="font-size:9.5px;color:var(--muted)">Present</div></div><div style="background:rgba(224,96,96,.1);border-radius:7px;padding:7px;text-align:center;"><div style="font-family:var(--fd);font-size:17px;color:var(--red)">${absent}</div><div style="font-size:9.5px;color:var(--muted)">Absent</div></div><div style="background:rgba(240,192,64,.1);border-radius:7px;padding:7px;text-align:center;"><div style="font-family:var(--fd);font-size:17px;color:var(--yellow)">${late}</div><div style="font-size:9.5px;color:var(--muted)">Late</div></div><div style="background:rgba(107,159,239,.1);border-radius:7px;padding:7px;text-align:center;"><div style="font-family:var(--fd);font-size:17px;color:var(--blue)">${excused}</div><div style="font-size:9.5px;color:var(--muted)">Excused</div></div></div>`;
  const ctx=document.getElementById('chart-att-dash');
  if(attDashChart)attDashChart.destroy();
  attDashChart=new Chart(ctx,{type:'doughnut',data:{labels:['Present','Absent','Late','Excused'],datasets:[{data:[present,absent,late,excused],backgroundColor:['rgba(82,196,138,.8)','rgba(224,96,96,.8)','rgba(240,192,64,.8)','rgba(107,159,239,.8)'],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'var(--muted)',font:{size:10},boxWidth:10}}},cutout:'60%'}});
}

// ══════════════════════════════════════════════════
// ACTIVITY CRUD
// ══════════════════════════════════════════════════
function openAddActivity(){editActId=null;document.getElementById('act-mtitle').textContent='Log Activity';clrF(['a-title','a-score','a-remarks']);document.getElementById('a-total').value=100;document.getElementById('a-type').value='Quiz';document.getElementById('a-status').value='completed';document.getElementById('a-category').value='completed-acts';document.getElementById('a-subject').value='';document.getElementById('a-date').value=today();populateSjSelects();openModal('activity-modal');}
function openEditActivity(id){const a=getActs().find(x=>x.id===id);if(!a)return;editActId=id;document.getElementById('act-mtitle').textContent='Edit Activity';populateSjSelects();document.getElementById('a-title').value=a.title;document.getElementById('a-subject').value=a.subject;document.getElementById('a-category').value=a.category||'completed-acts';document.getElementById('a-type').value=a.type;document.getElementById('a-score').value=a.score;document.getElementById('a-total').value=a.total;document.getElementById('a-date').value=a.date;document.getElementById('a-status').value=a.status;document.getElementById('a-remarks').value=a.remarks;openModal('activity-modal');}
function saveActivity(){
  const title=document.getElementById('a-title').value.trim(),date=document.getElementById('a-date').value;
  if(!title){toast('Please enter an activity title.','error');return;}if(!date){toast('Please select a date.','error');return;}
  const entry={id:editActId||uid(),title,subject:document.getElementById('a-subject').value,category:document.getElementById('a-category').value||'completed-acts',type:document.getElementById('a-type').value,score:document.getElementById('a-score').value,total:parseFloat(document.getElementById('a-total').value)||100,date,status:document.getElementById('a-status').value,remarks:document.getElementById('a-remarks').value.trim()};
  let acts=getActs();if(editActId){const i=acts.findIndex(a=>a.id===editActId);if(i!==-1)acts[i]=entry;toast('Activity updated!','success');}else{acts.push(entry);toast('Activity logged!','success');}
  setActs(acts);closeModal('activity-modal');renderTable();renderDashboard();
}
function deleteActivity(id){if(!confirm('Delete this activity?'))return;setActs(getActs().filter(a=>a.id!==id));renderTable();renderDashboard();toast('Deleted.','success');}
function clearActivities(){if(!confirm('Clear all activities? This cannot be undone.'))return;setActs([]);renderTable();renderDashboard();toast('All activities cleared.','success');}

// TABLE
function srt(col){if(sortCol===col)sortDir*=-1;else{sortCol=col;sortDir=-1;}renderTable();}
function renderTable(){
  const search=document.getElementById('search-input').value.toLowerCase();
  const sf=document.getElementById('filter-subject').value,tf=document.getElementById('filter-type').value;
  const cf=document.getElementById('filter-cat').value,stf=document.getElementById('filter-status').value;
  let f=getActs().filter(a=>(!search||a.title.toLowerCase().includes(search)||(a.subject||'').toLowerCase().includes(search))&&(!sf||a.subject===sf)&&(!tf||a.type===tf)&&(!cf||a.category===cf)&&(!stf||a.status===stf));
  f.sort((a,b)=>{let va=a[sortCol]||'',vb=b[sortCol]||'';if(sortCol==='score'){va=parseFloat(va)||0;vb=parseFloat(vb)||0;}if(sortCol==='date'){va=new Date(va);vb=new Date(vb);}return va<vb?-sortDir:va>vb?sortDir:0;});
  const tb=document.getElementById('activity-tbody');
  if(!f.length){tb.innerHTML=`<tr><td colspan="8"><div class="empty-state"><div class="es-ico">${svg('i-file',36)}</div><p>${getActs().length?'No matches.':'No activities yet.'}</p></div></td></tr>`;return;}
  tb.innerHTML=f.map(a=>{
    const pct=a.score!==''&&a.total>0?Math.round(parseFloat(a.score)/a.total*100):null;
    const bc=pct>=60?'var(--green)':pct!==null?'var(--red)':'var(--gold)';
    const cat=CATS[a.category]||{label:a.category||'—',color:'var(--muted)'};
    return`<tr><td><strong style="color:var(--text);font-size:12px">${esc(a.title)}</strong></td><td>${a.subject?`<span style="color:var(--gold);font-size:11px">${esc(a.subject)}</span>`:'<span style="color:var(--muted)">—</span>'}</td><td><span style="font-size:10.5px;font-weight:600;color:${cat.color}">${cat.label}</span></td><td><span class="type-badge type-${a.type.toLowerCase()}">${a.type}</span></td><td>${pct!==null?`<div class="score-bar"><span class="score-pill">${a.score}/${a.total}</span><div class="mini-bar"><div class="mini-fill" style="width:${pct}%;background:${bc}"></div></div><span style="font-family:var(--fm);font-size:10px;color:var(--muted)">${pct}%</span></div>`:'<span style="color:var(--muted)">—</span>'}</td><td style="white-space:nowrap;color:var(--muted);font-size:11px">${fmtDate(a.date)}</td><td><span style="font-size:10.5px;font-weight:600;display:flex;align-items:center;gap:3px;color:${a.status==='completed'?'var(--green)':'var(--gold)'}">${svg(a.status==='completed'?'i-check':'i-clock',11)}${a.status==='completed'?'Done':'Pending'}</span></td><td><div class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="openEditActivity('${a.id}')">${svg('i-edit',11)}</button><button class="btn btn-danger btn-sm" onclick="deleteActivity('${a.id}')">${svg('i-trash',11)}</button></div></td></tr>`;
  }).join('');
}

// ══════════════════════════════════════════════════
// ATTENDANCE
// ══════════════════════════════════════════════════
function saveAttendance(){
  const date=document.getElementById('att-date').value,status=document.getElementById('att-status').value,notes=document.getElementById('att-notes').value.trim();
  if(!date){toast('Please select a date.','error');return;}
  let atts=getAtts();const ex=atts.find(a=>a.date===date);
  if(ex){if(!confirm('A record for this date already exists. Override?'))return;atts=atts.filter(a=>a.date!==date);}
  atts.push({id:uid(),date,status,notes});atts.sort((a,b)=>new Date(b.date)-new Date(a.date));
  setAtts(atts);document.getElementById('att-notes').value='';renderAttPage();renderDashboard();toast('Attendance saved!','success');
}
function openEditAtt(id){const a=getAtts().find(x=>x.id===id);if(!a)return;editAttId=id;document.getElementById('att-edit-date').value=a.date;document.getElementById('att-edit-status').value=a.status;document.getElementById('att-edit-notes').value=a.notes||'';openModal('att-modal');}
function saveAttEdit(){const atts=getAtts(),i=atts.findIndex(x=>x.id===editAttId);if(i===-1)return;atts[i]={...atts[i],date:document.getElementById('att-edit-date').value,status:document.getElementById('att-edit-status').value,notes:document.getElementById('att-edit-notes').value.trim()};atts.sort((a,b)=>new Date(b.date)-new Date(a.date));setAtts(atts);closeModal('att-modal');renderAttPage();renderDashboard();toast('Updated!','success');}
function deleteAtt(id){if(!confirm('Delete this record?'))return;setAtts(getAtts().filter(a=>a.id!==id));renderAttPage();renderDashboard();toast('Record deleted.','success');}
function clearAttendance(){if(!confirm('Clear all attendance? This cannot be undone.'))return;setAtts([]);renderAttPage();renderDashboard();toast('Attendance cleared.','success');}
function renderAttPage(){
  const atts=getAtts();
  const present=atts.filter(a=>a.status==='present').length;
  const absent=atts.filter(a=>a.status==='absent').length;
  const late=atts.filter(a=>a.status==='late').length;
  const excused=atts.filter(a=>a.status==='excused').length;
  const pct=atts.length>0?Math.round((present/atts.length)*100):0;
  const sg=document.getElementById('att-stats-grid');
  sg.innerHTML=`
    <div class="stat-card c-gold"><div class="sc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><use href="#i-cal"/></svg></div><div class="sc-val">${atts.length}</div><div class="sc-lbl">Total Days</div></div>
    <div class="stat-card c-green"><div class="sc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><use href="#i-check"/></svg></div><div class="sc-val">${present}</div><div class="sc-lbl">Present</div></div>
    <div class="stat-card c-red"><div class="sc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><use href="#i-x"/></svg></div><div class="sc-val">${absent}</div><div class="sc-lbl">Absent</div></div>
    <div class="stat-card c-yellow"><div class="sc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><use href="#i-clock"/></svg></div><div class="sc-val">${late}</div><div class="sc-lbl">Late</div></div>
    <div class="stat-card c-blue"><div class="sc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><use href="#i-shield"/></svg></div><div class="sc-val">${pct}%</div><div class="sc-lbl">Attendance Rate</div></div>`;
  if(!document.getElementById('att-date').value)document.getElementById('att-date').value=today();
  const gc=dark?'rgba(255,255,255,.06)':'rgba(107,26,42,.08)',tc=dark?'#8A6E72':'#8A6060';
  const ctx1=document.getElementById('chart-att-main');
  if(attChart)attChart.destroy();
  attChart=new Chart(ctx1,{type:'doughnut',data:{labels:['Present','Absent','Late','Excused'],datasets:[{data:[present,absent,late,excused],backgroundColor:['rgba(82,196,138,.8)','rgba(224,96,96,.8)','rgba(240,192,64,.8)','rgba(107,159,239,.8)'],borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'var(--muted)',font:{size:11},boxWidth:11}}},cutout:'60%'}});
  const months={};atts.forEach(r=>{const m=r.date.substring(0,7);if(!months[m])months[m]={present:0,absent:0,late:0,excused:0};months[m][r.status]++;});
  const mKeys=Object.keys(months).sort().slice(-6);
  const ctx2=document.getElementById('chart-att-monthly');
  if(attMonthChart)attMonthChart.destroy();
  attMonthChart=new Chart(ctx2,{type:'bar',data:{labels:mKeys.map(m=>{const d=new Date(m+'-01');return d.toLocaleDateString('en-PH',{month:'short',year:'2-digit'});}),datasets:[{label:'Present',data:mKeys.map(m=>months[m]?.present||0),backgroundColor:'rgba(82,196,138,.75)',borderRadius:3},{label:'Absent',data:mKeys.map(m=>months[m]?.absent||0),backgroundColor:'rgba(224,96,96,.75)',borderRadius:3},{label:'Late',data:mKeys.map(m=>months[m]?.late||0),backgroundColor:'rgba(240,192,64,.75)',borderRadius:3},{label:'Excused',data:mKeys.map(m=>months[m]?.excused||0),backgroundColor:'rgba(107,159,239,.75)',borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:{size:10},boxWidth:10}}},scales:{x:{stacked:true,grid:{display:false},ticks:{color:tc,font:{size:10}}},y:{stacked:true,grid:{color:gc},ticks:{color:tc,font:{size:10}}}}}});
  renderAttTable();
}
function renderAttTable(){
  const search=document.getElementById('att-search').value.toLowerCase();
  const sf=document.getElementById('att-filter').value;
  let f=getAtts().filter(a=>(!search||a.date.includes(search)||(a.notes||'').toLowerCase().includes(search))&&(!sf||a.status===sf));
  const SM={present:{label:'Present',cls:'att-present'},absent:{label:'Absent',cls:'att-absent'},late:{label:'Late',cls:'att-late'},excused:{label:'Excused',cls:'att-excused'}};
  const tb=document.getElementById('att-tbody');
  if(!f.length){tb.innerHTML=`<tr><td colspan="5"><div class="empty-state"><div class="es-ico">${svg('i-cal',36)}</div><p>${getAtts().length?'No records match.':'No attendance records yet.'}</p></div></td></tr>`;return;}
  tb.innerHTML=f.map(a=>{const sm=SM[a.status]||{label:a.status,cls:''};return`<tr><td style="font-family:var(--fm);font-size:12px">${fmtDate(a.date)}</td><td style="color:var(--muted);font-size:11px">${fmtDay(a.date)}</td><td><span class="att-status-badge ${sm.cls}"><span class="att-dot"></span>${sm.label}</span></td><td style="font-size:11px;color:var(--muted)">${esc(a.notes)||'—'}</td><td><div class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="openEditAtt('${a.id}')">${svg('i-edit',11)}</button><button class="btn btn-danger btn-sm" onclick="deleteAtt('${a.id}')">${svg('i-trash',11)}</button></div></td></tr>`;}).join('');
}

// ══════════════════════════════════════════════════
// SUBJECTS
// ══════════════════════════════════════════════════
function openAddSubject(){editSjId=null;document.getElementById('sj-mtitle').textContent='Add Subject';clrF(['sj-code','sj-name','sj-inst']);document.getElementById('sj-units').value=3;openModal('subject-modal');}
function openEditSubject(id){const s=getSjs().find(x=>x.id===id);if(!s)return;editSjId=id;document.getElementById('sj-mtitle').textContent='Edit Subject';document.getElementById('sj-code').value=s.code;document.getElementById('sj-name').value=s.name;document.getElementById('sj-units').value=s.units;document.getElementById('sj-inst').value=s.instructor||'';openModal('subject-modal');}
function saveSubject(){
  const code=document.getElementById('sj-code').value.trim(),name=document.getElementById('sj-name').value.trim();
  if(!code||!name){toast('Subject code and name are required.','error');return;}
  const entry={id:editSjId||uid(),code,name,units:parseFloat(document.getElementById('sj-units').value)||3,instructor:document.getElementById('sj-inst').value.trim()};
  let sjs=getSjs();if(editSjId){const i=sjs.findIndex(s=>s.id===editSjId);if(i!==-1)sjs[i]=entry;toast('Subject updated!','success');}else{sjs.push(entry);toast('Subject added!','success');}
  setSjs(sjs);closeModal('subject-modal');renderSubjects();populateSjSelects();
}
function deleteSubject(id){if(!confirm('Delete subject?'))return;setSjs(getSjs().filter(s=>s.id!==id));renderSubjects();populateSjSelects();toast('Removed.','success');}
function renderSubjects(){
  const grid=document.getElementById('subjects-grid'),grades=getSjGrades();
  if(!grades.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;padding:40px;"><div class="es-ico">${svg('i-book',38)}</div><p>No subjects added yet.</p></div>`;return;}
  grid.innerHTML=grades.map(s=>{const pct=s.pct||0,gc=s.grade?gColor(s.grade):'var(--muted)',ac=getActs().filter(a=>a.subject===s.name).length;return`<div class="subj-card"><div class="subj-code">${esc(s.code)}</div><div class="subj-name">${esc(s.name)}</div><div class="subj-units">${s.units} units${s.instructor?' — '+esc(s.instructor):''}</div><div class="subj-avg"><div class="subj-pct">${pct>0?pct.toFixed(1)+'%':'—'}</div>${s.grade?`<div class="subj-ge" style="color:${gc}">GE: ${s.grade.toFixed(2)}</div>`:''}</div><div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div><div class="subj-stats"><div class="subj-stat"><span>${ac}</span> activities</div><div class="subj-stat"><span>${s.units}</span> units</div></div><div class="subj-actions"><button class="btn btn-ghost btn-sm" onclick="openEditSubject('${s.id}')">${svg('i-edit',11)} Edit</button><button class="btn btn-danger btn-sm" onclick="deleteSubject('${s.id}')">${svg('i-trash',11)}</button></div></div>`;}).join('');
}

// ══════════════════════════════════════════════════
// PERFORMANCE CHARTS
// ══════════════════════════════════════════════════
function renderCharts(){
  const grades=getSjGrades().filter(g=>g.pct>0);
  const gc=dark?'rgba(255,255,255,.06)':'rgba(107,26,42,.08)',tc=dark?'#8A6E72':'#8A6060';
  const c1=document.getElementById('chart-subj');if(sChart)sChart.destroy();
  sChart=new Chart(c1,{type:'bar',data:{labels:grades.map(g=>g.code),datasets:[{label:'Avg %',data:grades.map(g=>g.pct),backgroundColor:grades.map(g=>g.pct>=60?'rgba(212,168,67,.7)':'rgba(224,96,96,.7)'),borderColor:grades.map(g=>g.pct>=60?'#D4A843':'#E06060'),borderWidth:1,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,grid:{color:gc},ticks:{color:tc,font:{size:10}}},x:{grid:{display:false},ticks:{color:tc,font:{size:10}}}}}});
  const sorted=[...getActs()].filter(a=>a.score!==''&&a.total>0).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const c2=document.getElementById('chart-trend');if(trChart)trChart.destroy();
  trChart=new Chart(c2,{type:'line',data:{labels:sorted.map(a=>fmtDate(a.date)),datasets:[{label:'Score %',data:sorted.map(a=>Math.round(parseFloat(a.score)/a.total*100)),borderColor:'#D4A843',backgroundColor:'rgba(212,168,67,.1)',fill:true,tension:.4,pointRadius:3,pointBackgroundColor:'#D4A843',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,grid:{color:gc},ticks:{color:tc}},x:{grid:{display:false},ticks:{color:tc,maxTicksLimit:6,font:{size:10}}}}}});
  const pl=document.getElementById('perf-list');
  if(!grades.length){pl.innerHTML=`<div class="empty-state"><div class="es-ico">${svg('i-trend',36)}</div><p>Log activities to see performance</p></div>`;return;}
  pl.innerHTML=grades.map(g=>{const acts=getActs().filter(a=>a.subject===g.name),tc2={};acts.forEach(a=>{tc2[a.type]=(tc2[a.type]||0)+1;});const bc=g.pct>=90?'var(--green)':g.pct>=60?'var(--gold)':'var(--red)';return`<div class="perf-item"><div class="perf-top"><div class="perf-name">${esc(g.code)} — ${esc(g.name)}</div><div class="perf-pct">${g.pct.toFixed(1)}%${g.grade?' / GE: '+g.grade.toFixed(2):''}</div></div><div class="prog-bar"><div class="prog-fill" style="width:${g.pct}%;background:${bc}"></div></div><div class="perf-acts">${Object.entries(tc2).map(([t,c])=>`<span class="perf-tag">${t}: ${c}</span>`).join('')}</div></div>`;}).join('');
}

// ══════════════════════════════════════════════════
// GWA PAGE
// ══════════════════════════════════════════════════
function renderGWAPage(){
  const cats=getCatData();
  const cg=document.getElementById('cat-grid');
  if(!cats.some(c=>c.count>0)){cg.innerHTML=`<div style="grid-column:1/-1"><div class="empty-state"><div class="es-ico">${svg('i-award',38)}</div><p>Log completed activities with scores and assign them a Category to see the GWA computation.</p></div></div>`;document.getElementById('gwa-steps').innerHTML=`<div class="empty-state"><p style="font-size:12px">Complete activities in at least one category first.</p></div>`;return;}
  cg.innerHTML=cats.map(c=>{
    const gc=c.grade?gColor(c.grade):'var(--muted)';
    return`<div class="cat-block"><div class="cat-label-row"><span class="cat-label-dot" style="background:${c.color}"></span><span class="cat-label-txt" style="color:${c.color}">${c.label}</span><span class="cat-weight">Weight: ${c.weight}</span></div><div class="cat-pct-big">${c.count>0?c.avg.toFixed(1)+'%':'—'}</div><div class="cat-grade-eq" style="color:${gc}">${c.grade?'GE: '+c.grade.toFixed(2):'No data yet'}</div><div class="cat-count">${c.count} ${c.count===1?'entry':'entries'}</div><div class="cat-prog"><div class="cat-prog-fill" style="width:${c.avg}%;background:${c.color}"></div></div>${c.count>0?`<button class="cat-expand-btn" onclick="toggleCatEntries(this,'ent-${c.key}')">${svg('i-chevd',11)}&nbsp;View ${c.count} ${c.count===1?'entry':'entries'}</button><div class="cat-entries" id="ent-${c.key}"><div class="cat-entries-header"><span>Activity</span><span>Score</span><span>%</span><span>GE</span></div>${c.items.map(item=>{const ip=Math.round(parseFloat(item.score)/item.total*100);const ig=p2g(ip);return`<div class="cat-entry"><span class="ce-title" title="${esc(item.title)}">${esc(item.title)}</span><span class="ce-score">${item.score}/${item.total}</span><span class="ce-pct" style="color:${ip>=60?'var(--green)':'var(--red)'}">${ip}%</span><span class="ce-grade" style="color:${gColor(ig)}">${ig.toFixed(2)}</span></div>`;}).join('')}</div>`:''}</div>`;
  }).join('');
  const gwr=computeCatGWA();
  const stepsEl=document.getElementById('gwa-steps');
  if(!gwr){stepsEl.innerHTML=`<div class="empty-state"><p style="font-size:12px">Add completed activities in at least one category to compute GWA.</p></div>`;return;}
  const active=gwr.cats.filter(c=>c.count>0);
  let h=`<div class="gf-title">Full Computation — CHED-Aligned</div>`;
  h+=`<div class="gwa-step"><div class="step-num">1</div><div class="step-title">Average Percentage Per Category</div><div class="step-body">Sum all raw score percentages per category, then divide by entry count:</div><div class="step-line">${active.map(c=>`<div><span class="eq-hi">${c.label}:</span> (${c.items.map(i=>Math.round(parseFloat(i.score)/i.total*100)+'%').join(' + ')}) ÷ ${c.count} = <strong>${c.avg.toFixed(1)}%</strong></div>`).join('')}</div></div>`;
  h+=`<div class="step-connector"></div>`;
  h+=`<div class="gwa-step"><div class="step-num">2</div><div class="step-title">Convert to CHED Grade Equivalent</div><div class="step-body">Apply the CHED grading scale:</div><div class="step-line">${active.map(c=>`<div><span class="eq-hi">${c.avg.toFixed(1)}%</span> → <strong style="color:${gColor(c.grade)}">${c.grade.toFixed(2)}</strong> (${c.label})</div>`).join('')}</div></div>`;
  h+=`<div class="step-connector"></div>`;
  h+=`<div class="gwa-step"><div class="step-num">3</div><div class="step-title">Apply Category Weights</div><div class="step-body">Multiply each grade equivalent by its weight:</div><div class="step-line">${active.map(c=>`<div><span class="eq-hi">${c.grade.toFixed(2)}</span> × <span class="eq-hi">${c.weight}</span> = <strong>${(c.grade*c.weight).toFixed(2)}</strong> (${c.label})</div>`).join('')}</div></div>`;
  h+=`<div class="step-connector"></div>`;
  const num=active.reduce((s,c)=>s+c.grade*c.weight,0);
  const fp=active.map(c=>`(${c.grade.toFixed(2)} × ${c.weight})`).join(' + ');
  h+=`<div class="gwa-step"><div class="step-num">4</div><div class="step-title">Compute Final GWA</div><div class="step-body">Weighted average formula:</div><div class="step-line" style="text-align:center;line-height:2;"><div>GWA = <span class="eq-hi">${fp}</span> ÷ <span class="eq-hi">${gwr.wTotal}</span></div><div>GWA = <span class="eq-hi">${num.toFixed(2)}</span> ÷ <span class="eq-hi">${gwr.wTotal}</span></div><div style="font-size:16px;font-weight:700;color:var(--gold);margin-top:4px;">GWA = ${gwr.gwa}</div></div></div>`;
  stepsEl.innerHTML=h;
}
function toggleCatEntries(btn,id){const el=document.getElementById(id);const open=el.classList.toggle('open');const count=el.querySelectorAll('.cat-entry').length;btn.innerHTML=svg(open?'i-chevu':'i-chevd',11)+'&nbsp;'+(open?'Hide entries':'View '+count+' '+(count===1?'entry':'entries'));}
function revealGWA(){
  const gwr=computeCatGWA();if(!gwr){toast('Not enough completed activities to compute GWA.','error');return;}
  const interp=gwaInterp(gwr.gwa);
  document.getElementById('gwa-final-box').innerHTML=`<div class="gf-label">Your Final GWA</div><div class="gf-number">${gwr.gwa}</div><div class="gf-interp"><span class="interp-badge ${interp.c}">${interp.t}</span></div><div class="gf-units">Based on ${gwr.cats.filter(c=>c.count>0).length} categor${gwr.cats.filter(c=>c.count>0).length===1?'y':'ies'} · Total weight: ${gwr.wTotal}</div>`;
  document.getElementById('gwa-final').classList.add('show');document.getElementById('reveal-section').style.display='none';
  setTimeout(()=>document.getElementById('gwa-final').scrollIntoView({behavior:'smooth',block:'nearest'}),100);
}
function hideGWA(){document.getElementById('gwa-final').classList.remove('show');document.getElementById('reveal-section').style.display='block';}

// ══════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════
function exportCSV(){
  const acts=getActs();if(!acts.length){toast('No activities to export.','error');return;}
  const h='Title,Subject,Category,Type,Score,Total,Date,Status,Remarks';
  const r=acts.map(a=>[a.title,a.subject,CATS[a.category]?.label||a.category,a.type,a.score,a.total,a.date,a.status,a.remarks].map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(','));
  dlFile('tsu_activities.csv',[h,...r].join('\n'),'text/csv');toast('CSV exported!','success');
}
function exportPDF(){
  const{jsPDF}=window.jspdf;const doc=new jsPDF();const u=CU;const gwr=computeCatGWA();const atts=getAtts();
  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(107,26,42);doc.text('TARLAC STATE UNIVERSITY',105,20,{align:'center'});
  doc.setFontSize(11);doc.setTextColor(80,30,40);doc.text('Student Academic Report',105,28,{align:'center'});
  doc.setDrawColor(212,168,67);doc.line(15,32,195,32);
  doc.setFont('helvetica','normal');doc.setFontSize(11);doc.setTextColor(30,10,15);
  doc.text(`Name: ${u.name||'—'}`,15,42);doc.text(`Student ID: ${u.id||'—'}`,15,50);doc.text(`Course: ${u.course||'—'} — ${u.year||'—'}`,15,58);doc.text(`Semester: ${u.sem||'—'}, AY ${u.ay||'—'}`,15,66);
  let y=80;
  if(gwr){doc.setFont('helvetica','bold');doc.setTextColor(107,26,42);doc.text('GWA COMPUTATION (CHED-Based)',15,y);y+=8;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(50,50,50);doc.text('Category',15,y);doc.text('Avg %',110,y);doc.text('Grade Equiv.',140,y);doc.text('Weight',175,y);doc.line(15,y+2,195,y+2);y+=8;doc.setFont('helvetica','normal');doc.setFontSize(11);gwr.cats.filter(c=>c.count>0).forEach(c=>{doc.text(c.label,15,y);doc.text(c.avg.toFixed(1)+'%',110,y);doc.text(c.grade.toFixed(2),140,y);doc.text(String(c.weight),175,y);y+=7;});y+=4;doc.line(15,y,195,y);y+=7;doc.setFont('helvetica','bold');doc.setTextColor(212,168,67);doc.text(`Final GWA: ${gwr.gwa}`,15,y);const i=gwaInterp(gwr.gwa);doc.setTextColor(30,10,15);doc.text(i.t.replace(/[^\x00-\x7F]/g,''),80,y);}
  if(atts.length){y+=16;doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(107,26,42);doc.text('ATTENDANCE SUMMARY',15,y);y+=8;doc.setFont('helvetica','normal');doc.setFontSize(11);doc.setTextColor(30,10,15);const p=atts.filter(a=>a.status==='present').length;const pct=Math.round((p/atts.length)*100);doc.text(`Total Days: ${atts.length}  |  Present: ${p}  |  Absent: ${atts.filter(a=>a.status==='absent').length}  |  Late: ${atts.filter(a=>a.status==='late').length}  |  Rate: ${pct}%`,15,y);}
  doc.save('TSU_Report.pdf');toast('PDF exported!','success');
}
function dlFile(n,c,t){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:t}));a.download=n;document.body.appendChild(a);a.click();a.remove();}

// ══════════════════════════════════════════════════
// MOBILE NAV SYNC
// ══════════════════════════════════════════════════
function setMN(page){
  const map={dashboard:'mn-dashboard',activities:'mn-activities',attendance:'mn-attendance',gwa:'mn-gwa',settings:'mn-settings'};
  document.querySelectorAll('.mn-item').forEach(i=>i.classList.remove('active'));
  const id=map[page];if(id){const el=document.getElementById(id);if(el)el.classList.add('active');}
}

// ══════════════════════════════════════════════════
// INIT  — boot straight in, no login
// ══════════════════════════════════════════════════
(function init(){bootApp();setMN('dashboard');})();