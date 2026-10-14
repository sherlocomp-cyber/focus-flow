/* =========================================================
   FOCUSFLOW — IMPROVE.JS
   Dimuat SETELAH init.js. Menambah/menimpa perilaku UX lewat
   wrapper fungsi global, tanpa mengubah file inti.
   ========================================================= */
(function(){
"use strict";

/* ---------- 01. TOAST: durasi adaptif + tombol "Urungkan" ---------- */
let toastTimer=null;
window.toast=function(msg,opts){
  const el=document.getElementById("toast");if(!el)return;
  const o=opts||window.__nextToast||null;window.__nextToast=null;
  const text=String(msg==null?"":msg);
  el.textContent="";
  const span=document.createElement("span");span.className="toast-text";span.textContent=text;el.appendChild(span);
  const hasAction=!!(o&&typeof o.action==="function");
  el.classList.toggle("has-action",hasAction);
  if(hasAction){
    const b=document.createElement("button");b.type="button";b.className="toast-action";b.textContent=o.label||"Urungkan";
    b.onclick=()=>{clearTimeout(toastTimer);el.classList.remove("show");try{o.action()}catch(e){}};
    el.appendChild(b);
  }
  el.classList.add("show");
  clearTimeout(toastTimer);
  /* teks panjang (mis. tooltip "Kenapa ini?") diberi waktu baca lebih lama */
  const ms=Math.min(9000,Math.max(2800,1800+text.length*55))+(hasAction?2500:0);
  toastTimer=setTimeout(()=>el.classList.remove("show"),ms);
};

/* ---------- 02. TUGAS: XP sekali per tugas, Urungkan, Hapus ---------- */
function toggleTaskDone(t){
  const prevStatus=t.status,prevCompleted=t.completedAt,prevXp=DB.profile.xp||0,prevAwarded=t.xpAwarded;
  t.status=t.status==="done"?"todo":"done";
  t.completedAt=t.status==="done"?new Date().toISOString():undefined;
  let gained=0;
  if(t.status==="done"&&!t.xpAwarded){t.xpAwarded=true;DB.profile.xp=prevXp+10;gained=10}
  saveDB();renderTasks();renderHome();
  toast(t.status==="done"?(gained?"+10 XP · Tugas selesai. Mantap.":"Tugas selesai. Mantap."):"Tugas dikembalikan ke daftar.",{
    label:"Urungkan",
    action:()=>{t.status=prevStatus;t.completedAt=prevCompleted;t.xpAwarded=prevAwarded;DB.profile.xp=prevXp;saveDB();renderTasks();renderHome()}
  });
}
/* Beranda sebelumnya tidak memberi XP, sedangkan modul Tugas memberi +10: sekarang konsisten. */
window.bindTaskChecks=function(){
  $$("[data-task]").forEach(btn=>btn.onclick=()=>{const t=taskById(btn.dataset.task);if(t)toggleTaskDone(t)});
};
window.completeTaskModule=function(id){const t=taskById(id);if(t)toggleTaskDone(t)};

/* Tombol hapus pada kartu tugas (sebelumnya tugas tidak bisa dihapus) */
const _taskCard=window.taskCard;
window.taskCard=function(t,drag){
  const html=_taskCard.apply(this,arguments);
  const btn=`<button class="pill-btn icon ghost" data-task-del="${t.id}" aria-label="Hapus tugas ${escapeHtml(t.title)}" title="Hapus tugas">🗑</button>`;
  return html.replace("▶ Fokus</button></div>","▶ Fokus</button>"+btn+"</div>");
};
document.addEventListener("click",e=>{
  const del=e.target.closest("[data-task-del]");
  if(del){
    e.preventDefault();e.stopPropagation();
    const id=del.dataset.taskDel,i=DB.tasks.findIndex(t=>t.id===id);if(i<0)return;
    const t=DB.tasks.splice(i,1)[0];
    if(focusState.taskId===id)focusState.taskId="";
    saveDB();renderTasks();renderHome();
    toast("Tugas dihapus.",{label:"Urungkan",action:()=>{DB.tasks.splice(Math.min(i,DB.tasks.length),0,t);saveDB();renderTasks();renderHome()}});
    return;
  }
  if(e.target.closest('[data-empty="task"]')){e.preventDefault();openTaskModal()}
});

/* ---------- 03. HABIT: XP sungguhan, Urungkan, arsip bisa dibatalkan ---------- */
const _setHabitStatus=window.setHabitStatus;
window.setHabitStatus=function(h,status){
  const before=habitLogFor(h,now),prevStatus=before?before.status:null;
  let awardedNow=false;
  window.__nextToast={label:"Urungkan",action:()=>{
    const log=habitLogFor(h,now);
    if(prevStatus===null)DB.habitLogs=DB.habitLogs.filter(l=>l!==log);
    else if(log)log.status=prevStatus;
    if(awardedNow){DB.profile.xp=Math.max(0,(DB.profile.xp||0)-8);if(log)delete log.xpAwarded}
    saveDB();renderHabits();renderHome();
  }};
  _setHabitStatus.call(this,h,status);
  window.__nextToast=null;
  /* Toast lama menjanjikan "+8 XP" tapi XP tidak pernah ditambahkan. Sekarang ditambahkan (sekali per habit per hari). */
  const log=habitLogFor(h,now);
  if(status==="selesai"&&log&&!log.xpAwarded){
    log.xpAwarded=true;awardedNow=true;DB.profile.xp=(DB.profile.xp||0)+8;saveDB();
    if(levelFromXp(DB.profile.xp)>(DB.profile.level||1))refreshGamification();
  }
};
const _renderHabitDetail=window.renderHabitDetail;
window.renderHabitDetail=function(){
  _renderHabitDetail.apply(this,arguments);
  const b=$("#archiveHabit");if(!b)return;
  const id=selectedHabitId;
  b.onclick=()=>{
    const h=DB.habits.find(x=>x.id===id);if(!h)return;
    h.archived=true;saveDB();
    selectedHabitId=(DB.habits.find(x=>!x.archived)||{}).id||"";
    renderHabits();renderHome();
    toast("Habit diarsipkan.",{label:"Urungkan",action:()=>{h.archived=false;selectedHabitId=h.id;saveDB();renderHabits();renderHome()}});
  };
};

/* ---------- 04. BERANDA: sapaan waktu, avatar, empty state, tombol katak ---------- */
function initials(name){
  const parts=String(name||"").trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return"FF";
  const first=Array.from(parts[0]);
  const s=parts.length>1?first[0]+Array.from(parts[1])[0]:first.slice(0,2).join("");
  return s.toUpperCase();
}
function enhanceHome(){
  const hr=new Date().getHours();
  const sapa=hr<11?"Selamat pagi":hr<15?"Selamat siang":hr<18?"Selamat sore":"Selamat malam";
  const nameEl=$("#greetingName"),h1=nameEl&&nameEl.parentElement;
  if(h1&&h1.firstChild&&h1.firstChild.nodeType===3)h1.firstChild.nodeValue=sapa+", ";
  const av=$("#profileBtn");
  if(av){av.textContent=initials(DB.profile.name);av.setAttribute("aria-label","Profil dan pengaturan: "+DB.profile.name)}
  if(!DB.tasks.length){
    const el=$("#topTasks");
    if(el)el.innerHTML=`<div class="empty-placeholder empty-cta"><div><div class="empty-emoji" aria-hidden="true">📝</div><strong>Belum ada tugas</strong><p class="muted">Tulis satu hal kecil yang ingin kamu selesaikan hari ini.</p><button type="button" class="pill-btn primary" data-empty="task">＋ Tambah tugas pertama</button></div></div>`;
  }
  if(!DB.goals.some(g=>g.status==="aktif")){
    const m=$("#goalMilestone");
    if(m)m.innerHTML=`<button type="button" class="pill-btn" data-go="tujuan" style="margin-top:6px;min-height:40px">Buat tujuan</button>`;
  }
  /* "Mulai katak" sebelumnya hanya pindah halaman; sekarang tugas katak langsung dipilih di timer */
  const frogBtn=$("#frogStart");
  if(frogBtn)frogBtn.onclick=()=>{const f=frogTask();if(f){focusState.taskId=f.id;goTo("fokus")}else openTaskModal()};
}
const _renderHome=window.renderHome;
window.renderHome=function(){_renderHome.apply(this,arguments);try{enhanceHome()}catch(e){}};

/* ---------- 05. TIMER FOKUS: warna fase, judul tab, getar, status notifikasi ---------- */
const BASE_TITLE=document.title;
const _renderFocusUI=window.renderFocusUI;
window.renderFocusUI=function(){
  _renderFocusUI.apply(this,arguments);
  const pg=$("#page-fokus");
  if(pg){pg.dataset.phase=focusState.phase;pg.dataset.running=focusState.running?"1":"0"}
  const title=focusState.running?`${$("#focusTimer").textContent} · ${focusState.phase==="focus"?"Fokus":"Istirahat"} — FocusFlow`:BASE_TITLE;
  if(document.title!==title)document.title=title;
  syncWakeLock();
};
const _playBell=window.playBell;
window.playBell=function(){
  _playBell.apply(this,arguments);
  try{if(navigator.vibrate)navigator.vibrate([180,90,180])}catch(e){}
};
function syncNotifyBtn(){
  const b=$("#notifyPermission");if(!b)return;
  if(!("Notification" in window)){b.textContent="Tidak didukung";b.disabled=true;return}
  const p=Notification.permission;
  b.textContent=p==="granted"?"Aktif ✓":p==="denied"?"Diblokir":"Aktifkan";
  b.disabled=p!=="default";
  b.title=p==="denied"?"Izinkan notifikasi lewat pengaturan situs/aplikasi di perangkatmu.":"";
}
const _renderFocusPage=window.renderFocusPage;
window.renderFocusPage=function(){_renderFocusPage.apply(this,arguments);syncNotifyBtn()};
const notifyBtn=$("#notifyPermission");
if(notifyBtn)notifyBtn.addEventListener("click",()=>{setTimeout(syncNotifyBtn,600);setTimeout(syncNotifyBtn,3000)});
try{if(navigator.permissions&&navigator.permissions.query)navigator.permissions.query({name:"notifications"}).then(p=>{p.onchange=syncNotifyBtn}).catch(()=>{})}catch(e){}

/* ---------- 06. TEMA: ikon tombol menunjukkan mode + theme-color ikut mode ---------- */
const _applyTheme=window.applyTheme;
window.applyTheme=function(){
  _applyTheme.apply(this,arguments);
  const t=DB.profile.settings.theme||"system";
  const b=$("#themeQuick");
  if(b){
    b.textContent=t==="gelap"?"☾":t==="terang"?"☀":"◐";
    const label="Tema: "+(t==="gelap"?"gelap":t==="terang"?"terang":"mengikuti sistem")+" (ketuk untuk ganti)";
    b.title=label;b.setAttribute("aria-label",label);
  }
  const metas=[...document.querySelectorAll('meta[name="theme-color"]')];
  metas.forEach(m=>{if(m.dataset.m===undefined){m.dataset.m=m.getAttribute("media")||"";m.dataset.c=m.content}});
  if(t==="system")metas.forEach(m=>{m.content=m.dataset.c;if(m.dataset.m)m.setAttribute("media",m.dataset.m)});
  else{const c=t==="gelap"?"#101412":"#F6F3EE";metas.forEach(m=>{m.content=c;m.removeAttribute("media")})}
};

/* ---------- 07. PENGATURAN: nama panggilan (sebelumnya tidak bisa diubah) ---------- */
const nameInput=$("#settingsName");
if(nameInput){
  nameInput.addEventListener("change",()=>{
    DB.profile.name=nameInput.value.trim().slice(0,30)||"Teman";
    saveDB();renderHome();toast("Nama diperbarui.");
  });
  nameInput.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();nameInput.blur()}});
}
const _bindSettings=window.bindSettings;
window.bindSettings=function(){
  _bindSettings.apply(this,arguments);
  const i=$("#settingsName");
  if(i)i.value=DB.profile.name&&DB.profile.name!=="Teman"?DB.profile.name:"";
};

/* ---------- 08. MODAL: geser ke bawah pada header untuk menutup (mobile) ---------- */
(function(){
  const head=document.querySelector(".modal-head"),modal=document.querySelector(".modal");
  if(!head||!modal)return;
  let y0=null,dy=0;
  head.addEventListener("touchstart",e=>{
    if(e.target.closest("button")||e.touches.length!==1)return;
    y0=e.touches[0].clientY;dy=0;modal.style.transition="none";
  },{passive:true});
  head.addEventListener("touchmove",e=>{
    if(y0===null)return;
    dy=Math.max(0,e.touches[0].clientY-y0);modal.style.transform=`translateY(${dy}px)`;
  },{passive:true});
  const end=()=>{
    if(y0===null)return;
    modal.style.transition="";modal.style.transform="";
    const close=dy>110;y0=null;dy=0;
    if(close)closeModal();
  };
  head.addEventListener("touchend",end);head.addEventListener("touchcancel",end);
})();

/* ---------- 09. APLIKASI DIBIARKAN TERBUKA LEWAT TENGAH MALAM ---------- */
const bootDay=isoDay(now);
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState!=="visible")return;
  if(isoDay(new Date())!==bootDay&&!focusState.running&&!document.body.classList.contains("modal-open"))location.reload();
});

/* ---------- 10. LAYAR TETAP MENYALA SAAT TIMER BERJALAN ---------- */
let wakeLock=null,wakePending=false;
async function syncWakeLock(){
  try{
    if(!("wakeLock" in navigator)||wakePending)return;
    const need=!!focusState.running&&document.visibilityState==="visible";
    if(need&&!wakeLock){
      wakePending=true;
      wakeLock=await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release",()=>{wakeLock=null});
    }else if(!need&&wakeLock){
      const w=wakeLock;wakeLock=null;await w.release();
    }
  }catch(e){wakeLock=null}
  finally{wakePending=false}
}
document.addEventListener("visibilitychange",syncWakeLock);

/* ---------- 11. PINTASAN KEYBOARD (desktop): Spasi = mulai/jeda timer, N = tugas baru ---------- */
const startBtn=$("#focusStart");
if(startBtn)startBtn.title="Pintasan keyboard: Spasi";
document.addEventListener("keydown",e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  const t=e.target;
  if(t&&t.closest&&t.closest("input,textarea,select,button,a,[contenteditable],[role=button]"))return;
  if(document.body.classList.contains("modal-open"))return;
  const pg=$("#page-fokus");
  if(e.code==="Space"&&pg&&pg.classList.contains("active")&&startBtn){e.preventDefault();startBtn.click()}
  else if((e.key==="n"||e.key==="N")&&typeof openTaskModal==="function"){e.preventDefault();openTaskModal()}
});

/* ---------- 12. HABIT: kolom pencarian (muncul jika habit aktif ≥ 5) ---------- */
let habitQuery="";
function applyHabitFilter(){
  const list=$("#habitList");if(!list||!list.parentNode)return;
  let box=$("#habitSearch");
  if(!box){
    box=document.createElement("input");
    box.id="habitSearch";box.type="search";box.className="task-search";
    box.placeholder="Cari habit…";box.setAttribute("aria-label","Cari habit");
    box.style.cssText="width:100%;margin-top:14px";
    box.addEventListener("input",()=>{habitQuery=box.value;applyHabitFilter()});
    list.parentNode.insertBefore(box,list);
  }
  let none=$("#habitNoResult");
  if(!none){
    none=document.createElement("div");
    none.id="habitNoResult";none.className="empty-placeholder";none.textContent="Tidak ada habit yang cocok.";
    none.style.cssText="display:none;min-height:90px;margin-top:10px";
    list.parentNode.insertBefore(none,list.nextSibling);
  }
  const cards=[...list.querySelectorAll(".habit-card")];
  const many=cards.length>=5,q=many?habitQuery.trim().toLowerCase():"";
  box.style.display=many?"":"none";
  let shown=0;
  cards.forEach(c=>{
    const text=[...c.querySelectorAll(".habit-name,.habit-meta")].map(x=>x.textContent).join(" ").toLowerCase();
    const ok=!q||text.includes(q);
    c.style.display=ok?"":"none";if(ok)shown++;
  });
  none.style.display=q&&!shown?"grid":"none";
}
const _renderHabitList=window.renderHabitList;
window.renderHabitList=function(){_renderHabitList.apply(this,arguments);try{applyHabitFilter()}catch(e){}};

/* ---------- 13. LAYAR PENUH TIMER: tampilan minimal + label tombol + modal tetap terlihat ---------- */
const fsStyle=document.createElement("style");
fsStyle.textContent=
"#page-fokus:fullscreen{background:var(--bg);overflow:auto;display:grid;place-items:center;padding:16px}"+
"#page-fokus:fullscreen .bento-grid{display:block;width:min(760px,100%)}"+
"#page-fokus:fullscreen .bento-card:not(.focus-main-card){display:none}"+
"#page-fokus:fullscreen .focus-main-card{min-height:min(720px,94vh);animation:none}";
document.head.appendChild(fsStyle);
const fsBtn=$("#focusFullscreen");
document.addEventListener("fullscreenchange",()=>{
  if(!fsBtn)return;
  const l=document.fullscreenElement?"Keluar layar penuh":"Layar penuh";
  fsBtn.title=l;fsBtn.setAttribute("aria-label",l);
});
/* Modal (mis. refleksi di akhir sesi) berada di luar elemen layar penuh sehingga tidak terlihat; keluar dulu. */
const modalBd=$("#modalBackdrop");
if(modalBd)new MutationObserver(()=>{
  if(modalBd.classList.contains("open")&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});
}).observe(modalBd,{attributes:true,attributeFilter:["class"]});

/* ---------- 14. PERBAIKAN LOGIKA: tombol Lewati, ikon habit, habit mingguan ---------- */
/* (a) "Lewati" sebelumnya mencatat sesi fokus selesai walau baru berjalan beberapa detik,
       dan melewati fase fokus yang belum dimulai tetap menambah hitungan 4 sesi.
       Sekarang sesi baru dicatat jika sudah berjalan minimal MIN_SESI_MENIT. */
const MIN_SESI_MENIT=5;
window.skipPhase=function(){
  if(focusState.running)syncFocusFromTimestamp();
  const wasFocus=focusState.phase==="focus";
  const spent=focusState.startedAt?Math.round((Date.now()-focusState.startedAt)/60000):0;
  clearInterval(focusState.interval);focusState.interval=null;focusState.running=false;focusState.targetAt=null;stopAmbient();
  let msg="";
  if(wasFocus){
    if(spent>=MIN_SESI_MENIT){
      completeFocusSession();
      focusState.focusCount++;focusState.cycleNo++;
      focusState.phase=(focusState.focusCount%4===0)?"long":"short";
    }else{
      focusState.phase="short";
      msg=spent>0?`Sesi baru ${spent} menit (kurang dari ${MIN_SESI_MENIT}), jadi tidak dicatat.`:"Langsung ke istirahat. Sesi ini tidak dihitung.";
    }
  }else focusState.phase="focus";
  focusState.remaining=focusDurationSeconds();focusState.elapsed=0;focusState.startedAt=null;
  renderFocusUI();
  if(msg)toast(msg);
};
const skipBtn=$("#focusSkip");
if(skipBtn)skipBtn.onclick=()=>window.skipPhase();   /* init.js mengikat fungsi lama; ikat ulang */

/* (b) Pilihan ikon habit: di wizard (langkah 1) dan di halaman detail untuk habit yang sudah ada */
const HABIT_ICONS=["🌱","📖","🚶","💧","🏋️","🧘","✍️","🥗","😴","🎧","🧹","💻"];
const _renderHabitWizard=window.renderHabitWizard;
window.renderHabitWizard=function(){
  _renderHabitWizard.apply(this,arguments);
  if(habitWizard.step!==1)return;
  const grid=document.querySelector("#modalBody .form-grid");if(!grid)return;
  const cur=habitWizard.data.icon||"";
  const f=document.createElement("div");f.className="field";
  f.innerHTML=`<label>Ikon <span class="muted">(opsional)</span></label><div class="day-picker" role="radiogroup" aria-label="Pilih ikon habit">${HABIT_ICONS.map(i=>`<button type="button" class="day-choice ${i===cur?"selected":""}" data-hicon="${i}" role="radio" aria-checked="${i===cur}" aria-label="Ikon ${i}">${i}</button>`).join("")}</div>`;
  grid.insertBefore(f,grid.querySelector(".form-help"));
  f.querySelectorAll("[data-hicon]").forEach(b=>b.onclick=()=>{
    habitWizard.data.icon=b.dataset.hicon;
    f.querySelectorAll("[data-hicon]").forEach(x=>{const on=x===b;x.classList.toggle("selected",on);x.setAttribute("aria-checked",on)});
  });
};
const _saveHabitWizard=window.saveHabitWizard;
window.saveHabitWizard=function(){
  const n=DB.habits.length,icon=habitWizard.data.icon;
  _saveHabitWizard.apply(this,arguments);
  if(DB.habits.length>n&&icon){DB.habits[DB.habits.length-1].icon=icon;saveDB();renderHabits();renderHome()}
};
function paintHabitIcons(){
  $$(".habit-icon[data-habit-detail]").forEach(b=>{
    const h=DB.habits.find(x=>x.id===b.dataset.habitDetail);if(h&&h.icon)b.textContent=h.icon;
  });
  const di=$(".detail-icon"),sel=DB.habits.find(x=>x.id===selectedHabitId);
  if(di&&sel&&sel.icon)di.textContent=sel.icon;
}
/* Ganti ikon habit yang sudah ada (lipatan "Ganti ikon" di bawah judul detail) */
function addHabitIconPicker(){
  const head=document.querySelector("#habitDetail .detail-head");
  const sel=DB.habits.find(x=>x.id===selectedHabitId&&!x.archived);
  if(!head||!sel||$("#habitIconPicker"))return;
  const cur=sel.icon||"";
  const d=document.createElement("details");d.id="habitIconPicker";d.style.marginTop="12px";
  d.innerHTML=`<summary class="muted" style="cursor:pointer;font-size:12px;font-weight:800">Ganti ikon</summary><div class="day-picker" role="radiogroup" aria-label="Ganti ikon habit" style="margin-top:8px">${HABIT_ICONS.map(i=>`<button type="button" class="day-choice ${i===cur?"selected":""}" data-hicon="${i}" role="radio" aria-checked="${i===cur}" aria-label="Ikon ${i}">${i}</button>`).join("")}</div>`;
  head.insertAdjacentElement("afterend",d);
  d.querySelectorAll("[data-hicon]").forEach(b=>b.onclick=()=>{
    sel.icon=b.dataset.hicon;saveDB();renderHabits();toast("Ikon diperbarui.");
  });
}
const _renderHabitList2=window.renderHabitList;
window.renderHabitList=function(){_renderHabitList2.apply(this,arguments);try{paintHabitIcons()}catch(e){}};
const _renderHabitDetail2=window.renderHabitDetail;
window.renderHabitDetail=function(){_renderHabitDetail2.apply(this,arguments);try{paintHabitIcons();addHabitIconPicker()}catch(e){}};

/* (c) Persentase & streak habit:
       - habit baru dihitung sejak dibuat (sebelumnya hari ke-1 terbaca ±3% karena dibagi 30 hari)
       - habit "beberapa kali per minggu" dihitung per minggu terhadap targetnya
         (sebelumnya per hari, sehingga target 3×/minggu mentok ±43%)
       - streak habit mingguan mentolerir jeda sesuai sisa hari dalam seminggu */
const _habitCompletion=window.habitCompletion;
window.habitCompletion=function(h,days){
  days=days||30;
  const c=h&&h.createdAt?new Date(h.createdAt):null;
  if(c&&!isNaN(c.getTime()))days=Math.max(1,Math.min(days,Math.floor((Date.now()-c.getTime())/864e5)+1));
  if(!h||!h.frequency||h.frequency.type!=="mingguan")return _habitCompletion.call(this,h,days);
  const target=Math.max(1,+h.frequency.timesPerWeek||1),weeks=Math.max(1,Math.floor(days/7));
  let sum=0;
  for(let w=0;w<weeks;w++){
    let done=0;
    for(let d=0;d<7;d++)if(habitDoneOnDate(h,addDays(now,-(w*7+d))))done++;
    sum+=Math.min(done,target)/target;
  }
  return Math.round(sum/weeks*100);
};
const _habitStreak=window.habitStreak;
window.habitStreak=function(h){
  if(!h||!h.frequency||h.frequency.type!=="mingguan")return _habitStreak.apply(this,arguments);
  const allowed=Math.max(1,7-Math.max(1,+h.frequency.timesPerWeek||1));
  let streak=0,misses=0;
  for(let i=0;i<90;i++){
    if(habitDoneOnDate(h,addDays(now,-i))){streak++;misses=0;continue}
    misses++;
    if(misses>allowed)break;
  }
  return streak;
};

/* ---------- 15. KONSISTENSI DATA & ALUR (ditemukan dari core.js / goals-tasks.js) ---------- */
/* (a) Beranda, Insight, dan progres tujuan memakai hitungan habit versi lama (30 hari penuh, tanpa jadwal,
       streak tanpa toleransi) sehingga angkanya berbeda dari halaman Kebiasaan. Samakan. */
window.habitRate=function(h){return habitCompletion(h,30)};
window.bestStreak=function(){return Math.max(0,...DB.habits.filter(x=>!x.archived).map(x=>habitStreak(x)))};

/* (b) Form "Tambah tugas" cepat menerima nama berisi spasi saja → tugas tanpa judul */
const _openTaskModal=window.openTaskModal;
window.openTaskModal=function(){
  _openTaskModal.apply(this,arguments);
  const f=$("#taskForm"),orig=f&&f.onsubmit;
  if(f&&orig)f.onsubmit=e=>{
    if(!$("#taskName").value.trim()){e.preventDefault();toast("Nama tugas belum diisi.");$("#taskName").focus();return}
    return orig.call(f,e);
  };
};
const quickTaskBtn=$("#quickTask");
if(quickTaskBtn)quickTaskBtn.onclick=()=>window.openTaskModal();   /* init.js mengikat fungsi lama; ikat ulang */

/* (c) Kanban: tugas berstatus "inbox" (semua tugas baru dari modul Tugas) tidak muncul di kolom mana pun.
       Sekarang tampil di kolom Todo; menyeretnya ke kolom lain memprosesnya dari Inbox. */
window.renderKanban=function(){
  const cols=[["todo","Todo",t=>t.status==="todo"||t.status==="inbox"],["doing","Doing",t=>t.status==="doing"],["done","Done",t=>t.status==="done"]];
  return `<div class="task-full-card"><div><h2 class="card-title">Kanban</h2><p class="card-subtitle">Pindahkan task sesuai tahap pengerjaan. Tugas dari Inbox ada di kolom Todo.</p></div><div class="kanban">${cols.map(([k,title,f])=>{const a=DB.tasks.filter(f);return `<div class="kan-col" data-kanban="${k}"><div class="kan-head"><span class="kan-title">${title}</span><span class="kan-count">${a.length}</span></div><div class="drop-list">${a.map(t=>`<div class="drop-task" draggable="true" data-drag-task="${t.id}">${escapeHtml(t.title)}<div class="tm-notes">${t.actualPomodoro||0}/${t.estimatePomodoro||1} 🍅</div></div>`).join("")}</div></div>`}).join("")}</div><div class="touch-drag-hint">Layar sentuh: tekan-tahan kartu lalu geser ke kolom tujuan.</div></div>`;
};

/* (d) Urutan Ivy Lee bisa ganda (mis. 1,2,3 → tugas 2 selesai → tugas baru mendapat 3 lagi). Rapikan sebelum tampil. */
const _renderIvy=window.renderIvy;
window.renderIvy=function(){
  DB.tasks.filter(t=>t.status!=="done"&&t.ivyLeeOrder>=1&&t.ivyLeeOrder<=6)
    .sort((x,y)=>x.ivyLeeOrder-y.ivyLeeOrder).forEach((t,i)=>{t.ivyLeeOrder=i+1});
  return _renderIvy.apply(this,arguments);
};

/* (e) XP "dobel": menyeret tugas ke kolom Done berkali-kali, atau menandai milestone selesai berkali-kali,
       memberi XP setiap kali. Sekarang sekali per tugas / milestone. */
const _applyDrop=window.applyDrop;
window.applyDrop=function(id,target){
  const t=taskById(id),prevXp=DB.profile.xp||0,wasAwarded=!!(t&&t.xpAwarded);
  _applyDrop.apply(this,arguments);
  if(t&&target==="done"){
    DB.profile.xp=prevXp;
    if(!wasAwarded){t.xpAwarded=true;DB.profile.xp=prevXp+10}
    saveDB();
  }
};
const _renderGoals=window.renderGoals;
window.renderGoals=function(){
  _renderGoals.apply(this,arguments);
  $$("[data-ms-toggle]").forEach(b=>b.onclick=()=>{
    const g=goalById(b.dataset.goalId),m=g&&g.milestones.find(x=>x.id===b.dataset.msToggle);if(!m)return;
    const prevXp=DB.profile.xp||0,prevAwarded=m.xpAwarded;
    m.done=!m.done;let gained=0;
    if(m.done&&!m.xpAwarded){m.xpAwarded=true;DB.profile.xp=prevXp+50;gained=50}
    saveDB();renderGoals();renderHome();
    toast(m.done?(gained?"+50 XP · Milestone selesai.":"Milestone selesai."):"Milestone dibuka lagi untuk dilanjutkan.",{
      label:"Urungkan",
      action:()=>{m.done=!m.done;m.xpAwarded=prevAwarded;DB.profile.xp=prevXp;saveDB();renderGoals();renderHome()}
    });
  });
};

/* (f) Mengedit tujuan mereset progres Key Result ke nilai awal dan menghapus penanda XP milestone. Pertahankan. */
const _saveGoalWizard=window.saveGoalWizard;
window.saveGoalWizard=function(old){
  const krPrev=old?(old.keyResults||[]).map(k=>({title:k.title,current:k.current})):[];
  const msPrev=old?(old.milestones||[]).map(m=>({title:m.title,xp:m.xpAwarded,due:m.dueDate})):[];
  _saveGoalWizard.apply(this,arguments);
  if(!old)return;
  (old.keyResults||[]).forEach((k,i)=>{const p=krPrev.find(x=>x.title===k.title)||krPrev[i];if(p&&Number.isFinite(Number(p.current)))k.current=Number(p.current)});
  (old.milestones||[]).forEach((m,i)=>{const p=msPrev.find(x=>x.title===m.title)||msPrev[i];if(p){if(p.xp)m.xpAwarded=true;if(p.due&&!m.dueDate)m.dueDate=p.due}});
  saveDB();renderGoals();renderHome();
};

/* (g) Tujuan tidak bisa ditandai selesai atau dihapus (status hanya "aktif"). Tambahkan keduanya, lengkap dengan Urungkan. */
const _goalCard=window.goalCard;
window.goalCard=function(g){
  const html=_goalCard.apply(this,arguments);
  const extra=`<button class="pill-btn" data-goal-status="${g.id}">${g.status==="selesai"?"Aktifkan lagi":"Tandai selesai"}</button><button class="pill-btn ghost" style="color:var(--danger)" data-goal-del="${g.id}" aria-label="Hapus tujuan ${escapeHtml(g.title)}">Hapus</button>`;
  return html.replace(`data-goal-select="${g.id}">Roadmap</button></div>`,`data-goal-select="${g.id}">Roadmap</button>${extra}</div>`);
};
document.addEventListener("click",e=>{
  const st=e.target.closest("[data-goal-status]");
  if(st){
    const g=goalById(st.dataset.goalStatus);if(!g)return;
    const prev=g.status;g.status=prev==="selesai"?"aktif":"selesai";
    saveDB();renderGoals();renderHome();
    toast(g.status==="selesai"?"Tujuan ditandai selesai. 🎉":"Tujuan diaktifkan lagi.",{label:"Urungkan",action:()=>{g.status=prev;saveDB();renderGoals();renderHome()}});
    return;
  }
  const del=e.target.closest("[data-goal-del]");
  if(del){
    const i=DB.goals.findIndex(x=>x.id===del.dataset.goalDel);if(i<0)return;
    const g=DB.goals.splice(i,1)[0];
    const tIds=DB.tasks.filter(t=>t.goalId===g.id).map(t=>t.id),hIds=DB.habits.filter(h=>h.goalId===g.id).map(h=>h.id);
    DB.tasks.forEach(t=>{if(tIds.includes(t.id))t.goalId=undefined});
    DB.habits.forEach(h=>{if(hIds.includes(h.id))h.goalId=undefined});
    saveDB();renderGoals();renderHome();
    toast("Tujuan dihapus. Tugas dan habit yang tertaut tetap ada.",{label:"Urungkan",action:()=>{
      DB.goals.splice(Math.min(i,DB.goals.length),0,g);
      DB.tasks.forEach(t=>{if(tIds.includes(t.id))t.goalId=g.id});
      DB.habits.forEach(h=>{if(hIds.includes(h.id))h.goalId=g.id});
      saveDB();renderGoals();renderHome();
    }});
  }
});

/* ---------- 16. INISIALISASI ---------- */
const ver=$("#appVersion");if(ver)ver.textContent="v1.5.0";
applyTheme();
renderHome();
renderFocusUI();
syncNotifyBtn();
renderHabits();
renderGoals();
})();
