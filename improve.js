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

/* ---------- 11. HALAMAN BARU SELALU MULAI DARI ATAS ---------- */
try{
  const mo=new MutationObserver(list=>{
    for(const m of list){
      if(m.target.classList.contains("active")&&!(m.oldValue||"").split(/\s+/).includes("active")){
        window.scrollTo({top:0,behavior:"instant"});break;
      }
    }
  });
  document.querySelectorAll(".page").forEach(p=>mo.observe(p,{attributes:true,attributeFilter:["class"],attributeOldValue:true}));
}catch(e){}

/* ---------- 12. PINTASAN KEYBOARD (desktop): Spasi = mulai/jeda timer, N = tugas baru ---------- */
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

/* ---------- 13. INISIALISASI ---------- */
const ver=$("#appVersion");if(ver)ver.textContent="v1.2.0";
applyTheme();
renderHome();
renderFocusUI();
syncNotifyBtn();
})();
