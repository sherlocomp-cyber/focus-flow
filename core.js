/* =========================================================
   01. DATA LAYER — localStorage aman + seed realistis
   ========================================================= */
const APP_VERSION="1.1.0",SCHEMA_VERSION=1;
const STORAGE_KEYS={
  goals:"ff:goals",habits:"ff:habits",habitLogs:"ff:habitLogs",tasks:"ff:tasks",
  projects:"ff:projects",sessions:"ff:sessions",profile:"ff:profile",
  meta:"ff:meta",route:"ff:lastRoute",onboarding:"ff:onboarding"
};
const STORAGE_TEST_KEY="ff:storage-test";
const memoryData=Object.create(null);
const memoryStore={getItem(k){return Object.prototype.hasOwnProperty.call(memoryData,k)?memoryData[k]:null},setItem(k,v){memoryData[k]=String(v)},removeItem(k){delete memoryData[k]}}
const storageTiers=[];
let storageIndex=0;
let storageMode="memory";
let storageWriteError="";
function testStorage(store){try{const value="ok-"+Date.now();store.setItem(STORAGE_TEST_KEY,value);const read=store.getItem(STORAGE_TEST_KEY)===value;store.removeItem(STORAGE_TEST_KEY);return read}catch(e){return false}}
function initStorage(){
  storageTiers.length=0;
  try{if(testStorage(window.localStorage))storageTiers.push({name:"localStorage",store:window.localStorage})}catch(e){}
  try{if(testStorage(window.sessionStorage))storageTiers.push({name:"sessionStorage",store:window.sessionStorage})}catch(e){}
  storageTiers.push({name:"memory",store:memoryStore});
  storageIndex=0;storageMode=storageTiers[0].name;
  let newest=-1,newestAt=-1;
  storageTiers.forEach((tier,i)=>{try{const raw=tier.store.getItem(STORAGE_KEYS.meta),meta=raw?JSON.parse(raw):null,at=Number(meta?.updatedAt)||0;if(at>newestAt){newestAt=at;newest=i}}catch(e){}});
  if(newest>=0){storageIndex=newest;storageMode=storageTiers[newest].name}
}
function rawReadFromTier(tier,key){try{return tier.store.getItem(key)}catch(e){return null}}
function rawWriteToTier(tier,key,value){try{tier.store.setItem(key,value);return{ok:true,error:null}}catch(e){return{ok:false,error:e}}}
function storageGet(key){
  const ordered=[...storageTiers.keys()].sort((a,b)=>a===storageIndex?-1:b===storageIndex?1:a-b);
  for(const i of ordered){const raw=rawReadFromTier(storageTiers[i],key);if(raw!==null)return raw}
  return null;
}
function storageSet(key,value){
  for(let i=storageIndex;i<storageTiers.length;i++){
    const tier=storageTiers[i],result=rawWriteToTier(tier,key,String(value));
    if(result.ok){storageIndex=i;storageMode=tier.name;storageWriteError="";return true}
    storageWriteError=result.error?.name||"StorageError";
  }
  return false;
}
function load(key,fallback){try{const raw=storageGet(key);if(raw===null)return fallback;const val=JSON.parse(raw);return val??fallback}catch(e){return fallback}}
function showStorageWriteError(){toast(/quota/i.test(storageWriteError||"")?"Penyimpanan penuh. Ekspor cadangan lalu hapus data lama di browser jika perlu.":"Data belum tersimpan. Penyimpanan browser tidak tersedia.")}
function save(key,value){const ok=storageSet(key,JSON.stringify(value));if(!ok)showStorageWriteError();return ok}
function getMeta(){return load(STORAGE_KEYS.meta,{lastExportAt:0,dataChangedAt:0,updatedAt:0})}
function saveMeta(patch){return save(STORAGE_KEYS.meta,{...getMeta(),...patch,updatedAt:Date.now()})}
function markDataChanged(){saveMeta({dataChangedAt:Date.now()})}
function storageIsMemoryOnly(){return storageMode==="memory"}
initStorage();
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const isoDay=(d=new Date())=>{const x=new Date(d);if(isNaN(x))return"";const z=n=>String(n).padStart(2,"0");return`${x.getFullYear()}-${z(x.getMonth()+1)}-${z(x.getDate())}`};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const now=new Date();
const seedProjects=[
 {id:"p1",name:"Kerja",color:"#0F5A43"},
 {id:"p2",name:"Belajar",color:"#F28C28"},
 {id:"p3",name:"Pribadi",color:"#6B736E"}
];
const seedGoals=[];
const seedHabits=[];
const seedTasks=[];
const seedSessions=[];
const seedHabitLogs=[];
const seedProfile={
 name:"Teman",xp:0,level:1,badges:[],streakFreezes:1,
 settings:{theme:"system",focusMin:25,shortBreakMin:5,longBreakMin:15,longBreakEvery:4,autoStart:false,ambient:"mati",volume:.6}
};
const DB={
 goals:load(STORAGE_KEYS.goals,seedGoals),
 habits:load(STORAGE_KEYS.habits,seedHabits),
 habitLogs:load(STORAGE_KEYS.habitLogs,seedHabitLogs),
 tasks:load(STORAGE_KEYS.tasks,seedTasks),
 projects:load(STORAGE_KEYS.projects,seedProjects),
 sessions:load(STORAGE_KEYS.sessions,seedSessions),
 profile:load(STORAGE_KEYS.profile,seedProfile)
};
function normalizeDB(){
  DB.goals=Array.isArray(DB.goals)?DB.goals:[];
  DB.habits=Array.isArray(DB.habits)?DB.habits:[];
  DB.habitLogs=Array.isArray(DB.habitLogs)?DB.habitLogs:[];
  DB.tasks=Array.isArray(DB.tasks)?DB.tasks:[];
  DB.projects=Array.isArray(DB.projects)?DB.projects:[];
  DB.sessions=Array.isArray(DB.sessions)?DB.sessions:[];

  DB.profile=DB.profile&&typeof DB.profile==="object"?DB.profile:{};
  DB.profile.settings={
    ...seedProfile.settings,
    ...(DB.profile.settings&&typeof DB.profile.settings==="object"?DB.profile.settings:{})
  };

  DB.profile.name=DB.profile.name||seedProfile.name;
  DB.profile.xp=Number.isFinite(Number(DB.profile.xp))?Number(DB.profile.xp):seedProfile.xp;
  DB.profile.level=Number.isFinite(Number(DB.profile.level))?Number(DB.profile.level):seedProfile.level;
  DB.profile.badges=Array.isArray(DB.profile.badges)?DB.profile.badges:[];
  DB.profile.streakFreezes=Number.isFinite(Number(DB.profile.streakFreezes))?Number(DB.profile.streakFreezes):0;

  DB.goals.forEach(g=>{
    g.keyResults=Array.isArray(g.keyResults)?g.keyResults:[];
    g.milestones=Array.isArray(g.milestones)?g.milestones:[];
    g.reviews=Array.isArray(g.reviews)?g.reviews:[];
  });

  DB.tasks.forEach(t=>{
    t.tags=Array.isArray(t.tags)?t.tags:[];
    t.subtasks=Array.isArray(t.subtasks)?t.subtasks:[];
  });

  DB.habits.forEach(h=>{h.archived=!!h.archived});

  /* Sanitasi: id aman untuk atribut HTML, angka valid, warna valid, teks bertipe string */
  const sid=v=>v==null||v===""?v:String(v).replace(/[^A-Za-z0-9_-]/g,"_").slice(0,64);
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const str=(v,max=500)=>v==null?v:String(v).slice(0,max);
  const day=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v)?v:"";
  const objs=a=>a.filter(x=>x&&typeof x==="object");
  DB.goals=objs(DB.goals);DB.habits=objs(DB.habits);DB.habitLogs=objs(DB.habitLogs);
  DB.tasks=objs(DB.tasks);DB.projects=objs(DB.projects);DB.sessions=objs(DB.sessions);
  DB.projects.forEach(p=>{p.id=sid(p.id);p.name=str(p.name,80)||"Proyek";p.color=/^#[0-9a-fA-F]{3,8}$/.test(p.color||"")?p.color:"#6B736E"});
  DB.goals.forEach(g=>{
    g.id=sid(g.id);g.title=str(g.title,300);g.why=str(g.why,1000);g.type=String(g.type||"smart");g.status=g.status||"aktif";
    g.keyResults=objs(g.keyResults);g.milestones=objs(g.milestones);g.reviews=objs(g.reviews);
    g.keyResults.forEach(k=>{k.id=sid(k.id);k.title=str(k.title,300);k.unit=str(k.unit,40)||"";k.start=num(k.start);k.target=num(k.target,1);k.current=num(k.current,k.start)});
    g.milestones.forEach(m=>{m.id=sid(m.id);m.title=str(m.title,300);m.done=!!m.done;m.dueDate=day(m.dueDate)});
    if(g.deadline!==undefined)g.deadline=day(g.deadline);
  });
  DB.tasks.forEach(t=>{
    t.id=sid(t.id);t.title=str(t.title,500);t.notes=str(t.notes,3000);
    ["projectId","goalId","parentId"].forEach(k=>{if(t[k])t[k]=sid(t[k])});
    t.dueDate=day(t.dueDate);
    t.estimatePomodoro=Math.min(99,Math.max(0,num(t.estimatePomodoro,1)));
    t.actualPomodoro=Math.min(999,Math.max(0,num(t.actualPomodoro,0)));
    t.difficulty=Math.min(5,Math.max(1,num(t.difficulty,3)));
    t.priority=Math.min(4,Math.max(1,num(t.priority,3)));
    t.tags=t.tags.map(x=>str(x,40)).filter(Boolean);
    t.subtasks=objs(t.subtasks);t.subtasks.forEach(x=>{x.id=sid(x.id);x.title=str(x.title,300)});
  });
  DB.habits.forEach(h=>{h.id=sid(h.id);h.name=str(h.name,200);if(h.goalId)h.goalId=sid(h.goalId)});
  DB.habitLogs.forEach(l=>{l.id=sid(l.id);l.habitId=sid(l.habitId);l.date=day(l.date)});
  DB.sessions.forEach(x=>{x.id=sid(x.id);if(x.taskId)x.taskId=sid(x.taskId);x.actualMin=Math.max(0,num(x.actualMin,0));x.reflection=str(x.reflection,1000)});
  DB.profile.name=str(DB.profile.name,60)||seedProfile.name;
}

normalizeDB();

function saveDB(){
  normalizeDB();
  const values={
    [STORAGE_KEYS.goals]:DB.goals,[STORAGE_KEYS.habits]:DB.habits,[STORAGE_KEYS.habitLogs]:DB.habitLogs,
    [STORAGE_KEYS.tasks]:DB.tasks,[STORAGE_KEYS.projects]:DB.projects,[STORAGE_KEYS.sessions]:DB.sessions,[STORAGE_KEYS.profile]:DB.profile
  };
  let ok=true;for(const [key,value] of Object.entries(values))ok=save(key,value)&&ok;
  if(ok)markDataChanged();
  return ok;
}

/* =========================================================
   02. BUSINESS LOGIC
   ========================================================= */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2800)}
function fmtDate(d){return new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d)}
function fmtShort(d){return new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short"}).format(d)}
function taskById(id){return DB.tasks.find(t=>t.id===id)}
function goalProgress(g){
  const parts=[];
  g.keyResults?.forEach(k=>parts.push(Math.max(0,Math.min(1,(Number(k.current)-Number(k.start))/Math.max(1,Number(k.target)-Number(k.start))))));
  if(g.milestones?.length)parts.push(g.milestones.filter(m=>m.done).length/g.milestones.length);
  const relatedTasks=DB.tasks.filter(t=>t.goalId===g.id);
  if(relatedTasks.length)parts.push(relatedTasks.filter(t=>t.status==="done").length/relatedTasks.length);
  const relatedHabits=DB.habits.filter(h=>!h.archived&&h.goalId===g.id);
  if(relatedHabits.length)parts.push(relatedHabits.reduce((a,h)=>a+habitRate(h),0)/relatedHabits.length/100);
  return parts.length?Math.round(parts.reduce((a,b)=>a+b,0)/parts.length*100):0;
}
function habitDone(h,date){return DB.habitLogs.some(l=>l.habitId===h.id&&l.date===date&&(l.status==="selesai"||l.status==="versi2menit"))}
function habitRate(h){
  let scheduled=0,done=0;
  for(let i=0;i<30;i++){const d=isoDay(addDays(now,-i));scheduled++;if(habitDone(h,d))done++}
  return scheduled?Math.round(done/scheduled*100):0;
}
function bestStreak(){
  let best=0;
  DB.habits.filter(h=>!h.archived).forEach(h=>{
    let n=0;
    for(let i=0;i<30;i++){if(habitDone(h,isoDay(addDays(now,-i))))n++;else break}
    best=Math.max(best,n);
  });
  return best;
}
function weekHabitDays(){
  return Array.from({length:7},(_,i)=>{const d=addDays(now,i-6);return {d,done:DB.habits.filter(h=>!h.archived).some(h=>habitDone(h,isoDay(d)))}})
}
function focusByDay(){
  return Array.from({length:7},(_,i)=>{
    const d=isoDay(addDays(now,i-6));
    return DB.sessions.filter(s=>s.completed&&isoDay(new Date(s.startedAt))===d).reduce((a,s)=>a+(s.actualMin||0),0);
  });
}
function topTasks(){
  return DB.tasks.filter(t=>t.status!=="done").sort((a,b)=>(a.priority-b.priority)||(b.difficulty-a.difficulty)).slice(0,3)
}
function frogTask(){
  const active=DB.tasks.filter(t=>t.status!=="done");
  return active.sort((a,b)=>(b.difficulty-a.difficulty)||(a.priority-b.priority))[0];
}
function hangingTasks(){
  return DB.tasks.filter(t=>t.status==="doing"||t.status==="todo"&&t.dueDate&&t.dueDate<isoDay(now)).slice(0,3)
}

/* =========================================================
   03. UI COMPONENTS
   ========================================================= */
const ICONS={
  beranda:`<svg viewBox="0 0 24 24" fill="none"><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  fokus:`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><path d="m12 8 2.5 4-2.5 1.7L9.5 12 12 8Z" fill="currentColor"/></svg>`,
  tugas:`<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M9 9h6M9 13h6M9 17h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  kebiasaan:`<svg viewBox="0 0 24 24" fill="none"><path d="M7 18c-2.2-1.6-3.2-4-2.2-7C6 7.7 9 5 12 5s6 2.7 7.2 6c1 3-.1 5.4-2.2 7" stroke="currentColor" stroke-width="1.8"/><path d="M9 18h6M10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  tujuan:`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
  insight:`<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  pengaturan:`<svg viewBox="0 0 24 24" fill="none"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" stroke-width="1.8"/><path d="m19 13.5 1.2 1-.9 1.7-1.5-.3c-.4.4-.9.7-1.5.9l-.4 1.5h-2l-.4-1.5c-.6-.2-1.1-.5-1.5-.9l-1.5.3-.9-1.7 1.2-1c-.1-.5-.1-1 0-1.5l-1.2-1 .9-1.7 1.5.3c.4-.4.9-.7 1.5-.9l.4-1.5h2l.4 1.5c.6.2 1.1.5 1.5.9l1.5-.3.9 1.7-1.2 1c.1.5.1 1 0 1.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`
};
const NAV=[["beranda","Beranda"],["fokus","Fokus"],["tugas","Tugas"],["kebiasaan","Kebiasaan"],["tujuan","Tujuan"],["insight","Insight"],["pengaturan","Pengaturan"]];
function renderNav(){
  const markup=NAV.map(([key,label])=>`<a class="nav-item" role="button" tabindex="0" data-route="${key}" aria-label="${label}" title="${label}">${ICONS[key]}<span>${label}</span></a>`).join("");
  $$(".pill-nav").forEach(n=>n.innerHTML=markup);
}
let currentRoute=load(STORAGE_KEYS.route,"beranda");
function goTo(key){if(!NAV.some(n=>n[0]===key))key="beranda";currentRoute=key;save(STORAGE_KEYS.route,key);route()}
function route(){
  let key=currentRoute||"beranda";
  if(!NAV.some(n=>n[0]===key))key="beranda";
  $$(".page").forEach(p=>p.classList.toggle("active",p.dataset.page===key));
  $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.route===key));
  if(key==="beranda"){renderHome();renderStorageNotices();}
  if(key==="fokus")renderFocusPage();
  if(key==="kebiasaan")renderHabits();
  if(key==="tugas")renderTasks();
  if(key==="tujuan")renderGoals();
  if(key==="insight")renderInsights();
  if(key==="pengaturan")bindSettings();
  window.scrollTo({top:0,behavior:"smooth"});
}
function ring(percent,size=112){
  const r=44,c=2*Math.PI*r,offset=c*(1-percent/100);
  return `<div class="progress-ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 112 112" aria-hidden="true"><circle class="ring-bg" cx="56" cy="56" r="${r}"/><circle class="ring-value" cx="56" cy="56" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/></svg><div class="ring-label">${percent}%<small>selesai</small></div></div>`;
}
function taskRow(t){
  return `<div class="task-row"><button class="task-check ${t.status==="done"?"done":""}" data-task="${t.id}" aria-label="Tandai selesai">${t.status==="done"?"✓":""}</button><div class="task-main"><div class="task-title">${escapeHtml(t.title)}</div><div class="task-meta">${t.estimatePomodoro||1} Pomodoro · ${t.difficulty||1}/5 kesulitan</div></div>${t.isFrog?'<span class="task-frog">Katak</span>':''}</div>`;
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function focusChartSVG(){
  const vals=focusByDay(),max=Math.max(30,...vals),w=700,h=210,pad=25;
  const pts=vals.map((v,i)=>`${pad+i*((w-pad*2)/(vals.length-1))},${h-pad-(v/max)*(h-pad*2)}`).join(" ");
  const area=`${pad},${h-pad} ${pts} ${w-pad},${h-pad}`;
  const labels=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat("id-ID",{weekday:"short"}).format(addDays(now,i-6)).slice(0,3));
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Grafik fokus 7 hari">
    <defs><linearGradient id="focusArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0F5A43" stop-opacity=".20"/><stop offset="1" stop-color="#0F5A43" stop-opacity="0"/></linearGradient></defs>
    <path class="chart-grid" d="M25 55H675M25 115H675M25 175H675"/>
    <polygon class="chart-area" points="${area}"/>
    <polyline class="chart-line" points="${pts}"/>
    ${vals.map((v,i)=>{const [x,y]=pts.split(" ")[i].split(",");return `<circle class="chart-dot" cx="${x}" cy="${y}" r="5"/>`}).join("")}
    ${labels.map((l,i)=>`<text x="${pad+i*((w-pad*2)/6)}" y="202" text-anchor="middle" fill="currentColor" opacity=".55" font-size="11">${l}</text>`).join("")}
  </svg>`;
}
function renderHome(){
  $("#todayText").textContent=fmtDate(now);
  $("#greetingName").textContent=DB.profile.name||"Teman";
  const quotes=["Sedikit demi sedikit tetap membawa kamu maju.","Tidak perlu sempurna. Cukup tahu langkah berikutnya.","Fokus pada satu hal yang bisa kamu selesaikan hari ini."];
  $("#dailyQuote").textContent=quotes[now.getDate()%quotes.length];

  $("#topTasks").innerHTML=topTasks().map(taskRow).join("")||`<div class="empty-placeholder">Semua tugas utama sudah selesai. 🌿</div>`;
  const frog=frogTask();
  $("#frogTitle").textContent=frog?frog.title:"Belum ada katak.";
  $("#frogMeta").textContent=frog?`Kesulitan ${frog.difficulty}/5 · ${frog.estimatePomodoro||1} Pomodoro`:"Tambahkan tugas untuk memilih katak.";
  $("#frogStart").onclick=()=>frog?goTo("fokus"):openTaskModal();

  const goal=DB.goals.find(g=>g.status==="aktif");
  if(goal){
    $("#goalName").textContent=goal.title;
    $("#goalRing").innerHTML=ring(goalProgress(goal));
    $("#goalDeadline").textContent=goal.deadline?`Target ${fmtShort(new Date(goal.deadline))}`:"Tanpa deadline";
    $("#goalMilestone").textContent=`${goal.milestones.filter(m=>m.done).length}/${goal.milestones.length} milestone`;
  }else{
    $("#goalName").textContent="Belum ada goal aktif";$("#goalRing").innerHTML=ring(0);$("#goalDeadline").textContent="Tambahkan tujuan";$("#goalMilestone").textContent="—";
  }

  $("#streakNumber").textContent=bestStreak();
  const activeHabits=DB.habits.filter(h=>!h.archived);
  $("#habitRate").textContent=(activeHabits.length?Math.round(activeHabits.reduce((a,h)=>a+habitRate(h),0)/activeHabits.length):0)+"%";
  $("#weekDots").innerHTML=weekHabitDays().map(x=>`<div class="day-dot ${x.done?"done":""} ${isoDay(x.d)===isoDay(now)?"today":""}"><i></i>${new Intl.DateTimeFormat("id-ID",{weekday:"short"}).format(x.d).slice(0,3)}</div>`).join("");

  const vals=focusByDay();
  $("#focusChart").innerHTML=focusChartSVG();
  $("#focusTotalChip").textContent=vals.reduce((a,b)=>a+b,0)+" menit";
  renderFocusUI();

  const hanging=hangingTasks();
  $("#hangingCount").textContent=hanging.length;
  $("#hangingTasks").innerHTML=hanging.map(taskRow).join("")||`<div class="empty-placeholder" style="min-height:120px">Tidak ada yang menggantung. ✨</div>`;
  bindTaskChecks();
}
function bindTaskChecks(){
  $$("[data-task]").forEach(btn=>btn.onclick=()=>{
    const t=taskById(btn.dataset.task);if(!t)return;
    t.status=t.status==="done"?"todo":"done";t.completedAt=t.status==="done"?new Date().toISOString():undefined;
    saveDB();renderHome();toast(t.status==="done"?"Tugas selesai. Mantap.":"Tugas dikembalikan ke daftar.");
  });
}

/* =========================================================
   04. MODAL / QUICK ADD
   ========================================================= */
function openTaskModal(){
  $("#modalTitle").textContent="Tambah tugas";
  $("#modalBody").innerHTML=`<form id="taskForm" class="form-grid">
    <div class="field"><label>Nama tugas</label><input id="taskName" required placeholder="Contoh: Menyusun latihan Bahasa Arab"></div>
    <div class="field"><label>Estimasi Pomodoro</label><select id="taskEstimate"><option value="1">1 Pomodoro</option><option value="2">2 Pomodoro</option><option value="3">3 Pomodoro</option><option value="4">4 Pomodoro</option><option value="6">6 Pomodoro</option></select></div>
    <div class="field"><label>Prioritas</label><select id="taskPriority"><option value="1">1 · Sangat penting</option><option value="2">2 · Penting</option><option value="3">3 · Biasa</option><option value="4">4 · Bisa nanti</option></select></div>
    <div class="field"><label>Kapan</label><input id="taskDate" type="date" value="${isoDay(now)}"></div>
    <div class="modal-actions"><button type="button" class="pill-btn" id="cancelTask">Batal</button><button class="pill-btn primary">Simpan tugas</button></div>
  </form>`;
  $("#modalBackdrop").classList.add("open");document.body.classList.add("modal-open");
  $("#cancelTask").onclick=closeModal;
  $("#taskForm").onsubmit=e=>{
    e.preventDefault();
    DB.tasks.push({id:uid(),title:$("#taskName").value.trim(),status:"todo",priority:+$("#taskPriority").value,important:+$("#taskPriority").value<=2,urgent:false,difficulty:3,dueDate:$("#taskDate").value,estimatePomodoro:+$("#taskEstimate").value,actualPomodoro:0,tags:[],createdAt:new Date().toISOString()});
    saveDB();closeModal();renderHome();toast("Tugas ditambahkan.");
  };
  setTimeout(()=>{const el=$("#taskName");el?.focus();el?.scrollIntoView({block:"center",behavior:"smooth"})},80);
}
function closeModal(){
  const backdrop=$("#modalBackdrop");
  backdrop.classList.remove("open");
  document.body.classList.remove("modal-open");
  document.documentElement.style.removeProperty("--modal-scroll-lock");
}
function celebrate(msg){toast("🎉 "+msg)}
function askModal(title,bodyHtml,onOk,okLabel="Simpan"){
  $("#modalTitle").textContent=title;
  $("#modalBody").innerHTML=`<form class="stack" id="askForm">${bodyHtml}<div class="modal-actions"><button type="button" class="pill-btn" id="askCancel">Batal</button><button type="submit" class="pill-btn primary">${okLabel}</button></div></form>`;
  $("#modalBackdrop").classList.add("open");document.body.classList.add("modal-open");
  $("#askCancel").onclick=closeModal;
  $("#askForm").onsubmit=e=>{e.preventDefault();const v=$("#askInput")?.value??"";closeModal();onOk(v)};
  setTimeout(()=>{const el=$("#askInput");el?.focus();el?.scrollIntoView({block:"center",behavior:"smooth"})},80);
}
function askText(title,placeholder,onOk){askModal(title,`<div class="field"><input id="askInput" type="text" placeholder="${escapeHtml(placeholder)}" maxlength="140" autocomplete="off"></div>`,onOk)}
function askConfirm(title,msg,onOk,okLabel="Ya, lanjut"){askModal(title,`<p class="card-subtitle">${escapeHtml(msg)}</p>`,()=>onOk(),okLabel)}
function resetData(){
  askConfirm("Reset data?","Semua data FocusFlow di perangkat ini akan dihapus dan aplikasi kembali ke kondisi awal.",()=>{
    Object.assign(DB,{goals:structuredClone(seedGoals),habits:structuredClone(seedHabits),habitLogs:structuredClone(seedHabitLogs),tasks:structuredClone(seedTasks),projects:structuredClone(seedProjects),sessions:structuredClone(seedSessions),profile:structuredClone(seedProfile)});
    saveDB();applyTheme();renderHome();renderSettings();toast("Data dikembalikan ke kondisi awal.");
  },"Reset");
}

function cycleTheme(){
  const current=DB.profile.settings.theme||"system";
  const next=current==="system"?"terang":current==="terang"?"gelap":"system";
  DB.profile.settings.theme=next;saveDB();applyTheme();toast(`Tema: ${next}`);
}
function applyTheme(){
  const t=DB.profile.settings.theme||"system";document.documentElement.dataset.theme=t==="gelap"?"dark":t==="terang"?"light":"system";
  $("#themeToggle")?.classList.toggle("on",DB.profile.settings.theme==="gelap");
}





/* =========================================================
   FINAL MODULE — Insight, XP, onboarding, data, settings
   ========================================================= */
function levelFromXp(x){return Math.floor(Math.sqrt(Math.max(0,x)/50))+1}
function refreshGamification(){
  const p=DB.profile,old=p.level||1;
  p.level=levelFromXp(p.xp||0);
  const legacyMap={"Langkah Pertama":"first","7 Hari Konsisten":"streak7","Fokus 10 Jam":"focus10","Pemburu Katak":"frog","Bangkit Lagi":"comeback"};
  const b=new Set((p.badges||[]).map(x=>legacyMap[x]||x));
  if(DB.tasks.some(t=>t.status==="done"))b.add("first");
  if(bestStreak()>=7)b.add("streak7");
  if(totalFocusMinutes()>=600)b.add("focus10");
  if(DB.tasks.some(t=>t.isFrog&&t.status==="done"))b.add("frog");
  if(p.streakRecoveryCount>0)b.add("comeback");
  p.badges=[...b];
  save(STORAGE_KEYS.profile,p);
  if(p.level>old)celebrate(`Naik level! Sekarang Level ${p.level}.`);
}
function totalFocusMinutes(){return DB.sessions.reduce((a,x)=>a+(Number(x.actualMin)||0),0)}
function productiveHour(){const c={};DB.sessions.forEach(x=>{if(!x.startedAt)return;const h=new Date(x.startedAt).getHours();c[h]=(c[h]||0)+(Number(x.actualMin)||0)});const a=Object.entries(c).sort((x,y)=>y[1]-x[1]);return a[0]?{hour:+a[0][0],min:a[0][1]}:null}
function weeklyScore(){const since=new Date(now);since.setDate(since.getDate()-6);since.setHours(0,0,0,0);const focus=Math.min(100,DB.sessions.filter(x=>new Date(x.startedAt)>=since).reduce((a,x)=>a+(x.actualMin||0),0)/300*100),tasks=Math.min(100,DB.tasks.filter(x=>x.status==="done"&&x.completedAt&&new Date(x.completedAt)>=since).length*10),hs=DB.habits.filter(x=>!x.archived),hab=hs.length?hs.reduce((a,x)=>a+habitRate(x),0)/hs.length:0,gs=DB.goals.filter(x=>x.status==="aktif"),goal=gs.length?gs.reduce((a,x)=>a+goalProgress(x),0)/gs.length:0;return Math.round(focus*.35+tasks*.2+hab*.25+goal*.2)}
function renderInsights(){refreshGamification();const total=totalFocusMinutes(),ph=productiveHour(),score=weeklyScore();$("#insightFocusTotal").textContent=`${Math.floor(total/60)}j ${total%60}m`,$("#insightBestHour").textContent=ph?`${String(ph.hour).padStart(2,"0")}:00`:"—",$("#insightBestHourMeta").textContent=ph?`${ph.min} menit fokus`:"Belum cukup data.",$("#insightScore").textContent=score,$("#insightScoreBar").style.width=score+"%";$("#insightLevel").textContent=`Lv ${DB.profile.level}`;$("#insightXp").textContent=`${DB.profile.xp||0} XP`;
const vals=Array.from({length:7},(_,i)=>{const d=isoDay(addDays(now,-6+i));return DB.sessions.filter(x=>isoDay(new Date(x.startedAt))===d).reduce((a,x)=>a+(x.actualMin||0),0)}),mx=Math.max(1,...vals);$("#insightFocusTrend").innerHTML=vals.map(v=>`<div class="mini-bar" style="height:${Math.max(8,v/mx*100)}%"><span>${v}m</span></div>`).join("");
const hs=DB.habits.filter(x=>!x.archived);$("#insightHabitTrend").innerHTML=hs.length?hs.slice(0,5).map(h=>`<div class="insight-item">${escapeHtml(h.name)} <b>${habitRate(h)}%</b></div>`).join(""):"<p class='muted'>Belum ada habit.</p>";
const gs=DB.goals.filter(x=>x.status==="aktif");$("#insightGoalTrend").innerHTML=gs.length?gs.map(g=>`<div class="insight-item">${escapeHtml(g.title)} <b>${goalProgress(g)}%</b></div>`).join(""):"<p class='muted'>Belum ada goal aktif.</p>";
const ins=[];if(ph)ins.push(`Jam fokus paling sering sekitar ${String(ph.hour).padStart(2,"0")}:00.`);ins.push(score>=70?"Ritmemu minggu ini cukup terjaga. Pertahankan satu kebiasaan kecil yang paling membantu.":"Pilih satu langkah kecil yang paling mudah dimulai hari ini.");if(gs[0])ins.push(`Goal “${gs[0].title}” sekarang ${goalProgress(gs[0])}%. Lihat milestone berikutnya.`);$("#autoInsights").innerHTML=ins.map(x=>`<div class="insight-item">💡 ${escapeHtml(x)}</div>`).join("");
const defs=[["first","🌱","Langkah Pertama"],["streak7","🔥","7 Hari Konsisten"],["focus10","🎯","Fokus 10 Jam"],["frog","🐸","Pemburu Katak"],["comeback","↩️","Bangkit Lagi"]],earned=new Set(DB.profile.badges||[]);$("#badgeCount").textContent=`${defs.filter(x=>earned.has(x[0])).length}/5`,$("#badgeGrid").innerHTML=defs.map(x=>`<div class="badge-item ${earned.has(x[0])?"earned":""}"><div class="badge-icon">${x[1]}</div><div class="badge-name">${x[2]}</div></div>`).join("")}
function dateFileStamp(d=new Date()){const x=new Date(d),p=n=>String(n).padStart(2,"0");return `${x.getFullYear()}-${p(x.getMonth()+1)}-${p(x.getDate())}_${p(x.getHours())}-${p(x.getMinutes())}`}
function downloadBlob(content,name,type){try{const blob=new Blob(["\ufeff",content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.rel="noopener";a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>{try{URL.revokeObjectURL(url)}catch(e){}},1000);return true}catch(e){toast("Ekspor gagal. Coba lagi dari Chrome.");return false}}
function exportJSON(){normalizeDB();const exportedAt=new Date().toISOString(),ok=downloadBlob(JSON.stringify({version:2,app:"FocusFlow",exportedAt,data:DB},null,2),`focusflow-backup-${dateFileStamp(new Date(exportedAt))}.json`,`application/json;charset=utf-8`);if(ok){saveMeta({lastExportAt:Date.now()});toast("Cadangan JSON berhasil diunduh.")}return ok}
function csvEscape(v){return`"${String(v??"").replace(/"/g,'""')}"`}
function exportCSV(){const rows=[["id","judul","status","prioritas","deadline","estimasiPomodoro","aktualPomodoro","goalId","tag","katak"],...DB.tasks.map(t=>[t.id,t.title,t.status,t.priority,t.dueDate,t.estimatePomodoro,t.actualPomodoro,t.goalId,(t.tags||[]).join("|"),t.isFrog?"ya":"tidak"])];const ok=downloadBlob(rows.map(r=>r.map(csvEscape).join(",")).join("\n"),`focusflow-tugas-${dateFileStamp()}.csv`,`text/csv;charset=utf-8`);if(ok){saveMeta({lastExportAt:Date.now()});toast("CSV tugas berhasil diunduh.")}return ok}
function validateImportedData(x){const d=x?.data||x;if(!d||typeof d!=="object"||Array.isArray(d))return{ok:false,msg:"Struktur data tidak dikenali."};if(!Array.isArray(d.goals)||!Array.isArray(d.habits)||!Array.isArray(d.habitLogs)||!Array.isArray(d.tasks)||!Array.isArray(d.projects)||!Array.isArray(d.sessions)||!d.profile||typeof d.profile!=="object"||Array.isArray(d.profile))return{ok:false,msg:"Beberapa bagian data wajib tidak lengkap."};if(d.goals.some(g=>!g||typeof g!=="object"||!g.id||!g.title))return{ok:false,msg:"Ada goal yang tidak valid."};if(d.tasks.some(t=>!t||typeof t!=="object"||!t.id||!t.title))return{ok:false,msg:"Ada tugas yang tidak valid."};if(d.habits.some(h=>!h||typeof h!=="object"||!h.id||!h.name))return{ok:false,msg:"Ada habit yang tidak valid."};return{ok:true,data:d}}
function importJSON(file){if(!file)return;if(file.size>5*1024*1024){toast("Impor ditolak: file terlalu besar (maks 5 MB).");return}const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(String(r.result||"")),check=validateImportedData(x);if(!check.ok){toast(`Impor ditolak: ${check.msg}`);return}const d=check.data;askConfirm("Timpa data FocusFlow?","Data saat ini akan diganti dengan isi file JSON yang sudah lolos validasi. Pastikan kamu punya cadangan jika diperlukan.",()=>{const previous=structuredClone(DB);Object.assign(DB,{goals:d.goals,habits:d.habits,habitLogs:d.habitLogs,tasks:d.tasks,projects:d.projects,sessions:d.sessions,profile:d.profile});normalizeDB();if(!saveDB()){Object.assign(DB,previous);normalizeDB();toast("Impor dibatalkan karena penyimpanan penuh atau diblokir.");return}applyTheme();refreshGamification();route();toast("Data berhasil diimpor.")},"Ya, timpa data")}catch(e){toast("File JSON tidak valid atau rusak.")}};r.onerror=()=>toast("File tidak bisa dibaca. Coba pilih file JSON lain.");r.readAsText(file)}
function backupReminderNeeded(){const m=getMeta(),last=Number(m.lastExportAt)||0,changed=Number(m.dataChangedAt)||0;return changed>last&&changed>0&&(Date.now()-(last||changed))>=7*24*60*60*1000}
function renderStorageNotices(){const banner=$("#storageBanner"),reminder=$("#backupReminder");if(banner){banner.hidden=!storageIsMemoryOnly();$("#storageExportBtn").onclick=exportJSON}if(reminder){reminder.hidden=!backupReminderNeeded();$("#backupExportBtn").onclick=exportJSON}}

function renderSettings(){const p=DB.profile.settings;$("#settingsTheme").value=p.theme||"system";$("#settingsAmbient").value=p.ambient||"mati";$("#freezeCount").textContent=p.streakFreezes||0;$("#timerSettings").innerHTML=[["Fokus","focusMin",15,60,5],["Istirahat","shortBreakMin",3,20,1],["Istirahat panjang","longBreakMin",10,30,5]].map(x=>`<label class="setting-row">${x[0]}<select class="filter-select" data-setting="${x[1]}">${Array.from({length:Math.floor((x[3]-x[2])/x[4])+1},(_,i)=>x[2]+i*x[4]).map(v=>`<option value="${v}" ${p[x[1]]===v?"selected":""}>${v} menit</option>`).join("")}</select></label>`).join("")}
function bindSettings(){renderSettings();$("#settingsTheme").onchange=e=>{DB.profile.settings.theme=e.target.value;saveDB();applyTheme()};$("#timerSettings").onchange=e=>{const k=e.target.dataset.setting;if(!k)return;DB.profile.settings[k]=+e.target.value;saveDB()};$("#settingsAmbient").onchange=e=>{DB.profile.settings.ambient=e.target.value;saveDB();e.target.value==="mati"?stopAmbient():startAmbient(e.target.value)};$("#exportJsonBtn").onclick=exportJSON;$("#exportCsvBtn").onclick=exportCSV;$("#importJsonBtn").onclick=()=>$("#importJsonFile").click();$("#importJsonFile").onchange=e=>e.target.files[0]&&importJSON(e.target.files[0]);$("#useFreezeBtn").onclick=()=>{if(!(DB.profile.streakFreezes>0))return toast("Streak freeze sedang habis.");DB.profile.streakFreezes--;DB.profile.streakRecoveryCount=(DB.profile.streakRecoveryCount||0)+1;saveDB();refreshGamification();renderSettings();renderInsights();celebrate("Streak dijaga. Besok lanjut lagi.")};$("#resetData").onclick=()=>resetData()}
function openOnboarding(){let step=1;const draw=()=>{$("#modalTitle").textContent="Selamat datang di FocusFlow";$("#modalBody").innerHTML=`<div class="stack"><div class="eyebrow">Langkah ${step} dari 3</div><h2>${step===1?"Tangkap dulu.":step===2?"Pilih satu fokus.":"Bangun ritme."}</h2><p class="card-subtitle">${step===1?"Inbox membuat pikiran lebih ringan.":step===2?"Gunakan Fokus, task, dan Katak untuk satu langkah utuh.":"Habit, goal, dan review membantu melihat kemajuan tanpa tekanan."}</p><div class="modal-actions"><button type="button" class="pill-btn" id="obSkip">Lewati</button>${step>1?'<button type="button" class="pill-btn" id="obBack">Kembali</button>':""}<button type="button" class="pill-btn primary" id="obNext">${step===3?"Mulai":"Lanjut"}</button></div></div>`;$("#obSkip").onclick=()=>{save("ff:onboarding","1");closeModal()};$("#obBack")?.addEventListener("click",()=>{step--;draw()});$("#obNext").onclick=()=>{if(step<3){step++;draw()}else{save("ff:onboarding","1");closeModal();toast("FocusFlow siap dipakai. 🌱")}}};$("#modalBackdrop").classList.add("open");document.body.classList.add("modal-open");draw()}
