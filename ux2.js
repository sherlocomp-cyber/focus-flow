/* =========================================================
   FOCUSFLOW — UX2.JS  ·  Tahap 1 (perbaikan UX)
   Dimuat SETELAH features.js. Wrapper fungsi global (pola yang sama
   dengan improve.js / focus-plus.js / features.js), tanpa mengubah berkas inti.

   1. Avatar = menu ke Insight & Pengaturan pada layar < 1080px
      (di sana navigasi bawah hanya memuat 5 tujuan utama; lihat ux2.css)
   2. Mode imersif otomatis saat sesi fokus dimulai (opsional, bawaan MATI)
   Tahap 3 (bagian 8-10): hitam murni AMOLED, getar sentuhan, target fokus harian
   Tahap 5 (bagian 11-14): filter "Hari ini", geser kartu tugas, tugas berulang, ringkasan mingguan
   ========================================================= */
(function(){
"use strict";
function step(n,f){try{f()}catch(e){try{console.error("[ux2] "+n,e)}catch(_){}}}
const $i=id=>document.getElementById(id);
const mqWide=window.matchMedia("(min-width:1080px)");

/* ---------- 1. AVATAR = MENU ---------- */
step("avatar-menu",()=>{
  const av=$i("profileBtn");if(!av)return;
  const ITEMS=[
    ["insight","Insight","Pola fokus, skor mingguan, lencana"],
    ["pengaturan","Pengaturan","Tema, durasi timer, cadangan data"]
  ];
  av.setAttribute("aria-haspopup","dialog");
  /* init.js mengikat avatar langsung ke Pengaturan; ikat ulang */
  av.onclick=()=>{
    if(mqWide.matches){goTo("pengaturan");return}      /* desktop: .nav-top sudah memuat semuanya */
    $i("modalTitle").textContent="Menu";
    $i("modalBody").innerHTML='<div class="ux-menu">'+ITEMS.map(([k,l,d])=>
      '<button type="button" data-ux-go="'+k+'">'+ICONS[k]+'<span><b>'+l+'</b><span>'+d+'</span></span></button>').join("")+'</div>';
    $i("modalBackdrop").classList.add("open");document.body.classList.add("modal-open");
  };
  const body=$i("modalBody");
  if(body)body.addEventListener("click",e=>{
    const b=e.target.closest("[data-ux-go]");if(!b)return;
    closeModal();goTo(b.dataset.uxGo);
  });

  /* Di HP, Insight/Pengaturan tidak punya item di navigasi bawah: avatar yang menandai halaman aktif */
  const mark=()=>av.classList.toggle("is-active",!mqWide.matches&&(currentRoute==="insight"||currentRoute==="pengaturan"));
  const _route=window.route;
  window.route=function(){const r=_route.apply(this,arguments);step("mark",mark);return r};
  if(mqWide.addEventListener)mqWide.addEventListener("change",mark);
  mark();
});

/* ---------- 2. IMERSIF OTOMATIS ----------
   features.js sudah punya tombol "◎ Imersif" (#ffZen). Di sini hanya pengaturan opsional
   yang menekan tombol itu saat sesi FOKUS dimulai lewat sentuhan/klik pengguna. */
step("auto-zen",()=>{
  const fs=focusState,S=()=>DB.profile.settings;
  const anchor=$i("ffNoBreak")?$i("ffNoBreak").closest(".setting-row"):($i("focusAutoStart")&&$i("focusAutoStart").closest(".setting-row"));
  if(anchor&&!$i("ffAutoZen")){
    anchor.insertAdjacentHTML("afterend",
      '<div class="setting-row"><span>Imersif otomatis saat mulai</span>'+
      '<button class="toggle'+(S().autoZen?" on":"")+'" id="ffAutoZen" type="button" role="switch" aria-checked="'+(!!S().autoZen)+'" aria-label="Imersif otomatis saat mulai"><i></i></button></div>');
    $i("ffAutoZen").onclick=e=>{
      const on=(S().autoZen=!S().autoZen);saveDB();
      e.currentTarget.classList.toggle("on",on);e.currentTarget.setAttribute("aria-checked",String(on));
    };
  }

  /* Masuk imersif hanya bila dipicu gerakan pengguna (tombol/spasi). Auto-start setelah istirahat
     (setTimeout) tidak ikut, karena browser menolak layar penuh tanpa gerakan pengguna. */
  const _start=window.startFocus;
  window.startFocus=function(){
    const was=fs.running,r=_start.apply(this,arguments);
    if(!was&&fs.running&&fs.phase==="focus"&&S().autoZen&&!document.body.classList.contains("ff-zen")){
      const ua=navigator.userActivation,z=$i("ffZen");
      if(z&&(!ua||ua.isActive))z.click();
    }
    return r;
  };

  /* Sesi selesai: keluar imersif lebih dulu supaya modal refleksi langsung terlihat */
  const _open=window.openReflection;
  window.openReflection=function(){
    if(S().autoZen&&document.body.classList.contains("ff-zen")){const z=$i("ffZen");if(z)z.click()}
    return _open.apply(this,arguments);
  };
});

/* =========================================================
   TAHAP 2 — VISUAL / KEJELASAN (lihat HANDOFF bagian 6)
   ========================================================= */

/* ---------- 3. IKON SVG MENGGANTIKAN EMOJI DI JUDUL KARTU BERANDA (2a) ----------
   Emoji berwarna bentrok dengan tema kertas (monokrom merah/abu) dan tampil beda per perangkat.
   Gaya ikon = ICONS di core.js: viewBox 24, stroke currentColor 1.8. Hanya judul kartu Beranda;
   .frog-big, status kosong, dan tombol tidak disentuh. Idempoten (aman dipanggil ulang). */
step("beranda-icons",()=>{
  const S=(p,extra)=>'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"'+(extra||"")+'>'+p+'</svg>';
  const L='stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const SVG={
    "🐸":S('<path d="M3 19 9.5 8l4 6.5 2.5-3.5L21 19H3Z" '+L+'/>'),                                   /* gunung = tugas terberat dulu */
    "🎯":ICONS.tujuan,
    "🔥":S('<path d="M12 3c.9 3.4 5 5.4 5 9.8A5 5 0 0 1 7 13c0-1.9.9-3.1 2-4.1.3 1.2 1 2 2 2.2C10.8 8 11 5.5 12 3Z" '+L+'/>'),
    "⏱":ICONS.fokus,
    "🧩":S('<path d="M20 12a8 8 0 1 1-3-6.2" '+L+'/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>')   /* lingkaran belum tertutup */
  };
  document.querySelectorAll("#page-beranda .card-title").forEach(h=>{
    if(h.querySelector(".ti"))return;
    const t=h.firstChild;if(!t||t.nodeType!==3)return;
    const m=/^\s*(🐸|🎯|🔥|⏱|🧩)\uFE0F?\s*/u.exec(t.nodeValue);if(!m||!SVG[m[1]])return;
    t.nodeValue=t.nodeValue.slice(m[0].length);
    const s=document.createElement("span");s.className="ti";s.setAttribute("aria-hidden","true");s.innerHTML=SVG[m[1]];
    h.insertBefore(s,t);
  });
});

/* ---------- 4. TOMBOL "i" GANDA (2c) ----------
   Teks Cirillo sama muncul 4x. Dipertahankan di Ruang Fokus dan mode Klasik (halaman Fokus);
   dihapus dari dua kartu Beranda (Fokus 7 hari, Fokus sekarang). */
step("dedupe-info",()=>{
  document.querySelectorAll('#page-beranda .info[data-tip*="Cirillo"]').forEach(b=>b.remove());
});

/* ---------- 5. ARIA-CHECKED PADA SEMUA TOGGLE (2e) ----------
   Toggle memakai role="switch" tetapi statusnya hanya kelas .on, sehingga pembaca layar tidak tahu
   statusnya (#focusAutoStart, #ffNoBreak). Samakan aria-checked dengan kelas .on, dan ikuti perubahannya. */
step("aria-switch",()=>{
  const sync=t=>t.setAttribute("aria-checked",String(t.classList.contains("on")));
  const mo=new MutationObserver(ms=>ms.forEach(m=>sync(m.target)));
  document.querySelectorAll('.toggle[role="switch"]').forEach(t=>{sync(t);mo.observe(t,{attributes:true,attributeFilter:["class"]})});
});

/* ---------- 6. TEKS SIKLUS "n/4 FOKUS" ----------
   habits-focus.js mencetak focusCount/4, padahal focusCount terus bertambah dan tidak pernah kembali ke 0,
   sehingga muncul "5/4", "9/4". Tampilkan posisi dalam siklus 4 sesi: istirahat panjang = 4/4 (siklus penuh),
   lalu mulai lagi dari 0/4. Hanya tampilan; logika timer tidak diubah. */
step("cycle-text",()=>{
  const fs=focusState,_r=window.renderFocusUI;
  const fix=()=>step("cycle-text-render",()=>{
    const el=$i("cycleText");
    if(el)el.textContent="Sesi "+fs.cycleNo+" · "+(fs.phase==="long"?4:fs.focusCount%4)+"/4 fokus";
  });
  if(typeof _r==="function")window.renderFocusUI=function(){const r=_r.apply(this,arguments);fix();return r};
  fix();   /* focus-plus.js bisa memulihkan focusCount saat muat; segarkan teks awal */
});

/* ---------- 7. KETUK "i" DI TOMBOL MODE TIDAK MENGGANTI MODE ----------
   Ikon "i" (<i class="info" data-tip>) berada di dalam .mode-btn. Klik pada ikon itu naik ke tombol mode
   (selectMode dipanggil) lalu ke penangan tooltip di init.js, jadi mengetuk "i" ikut mengganti mode timer.
   Tangkap klik pada fase capture: tampilkan tooltip saja dan jangan teruskan ke tombol mode.
   Klik pada bagian lain tombol (nama, durasi) dan keyboard (target = tombolnya) tidak terpengaruh. */
step("mode-info-tip",()=>{
  document.addEventListener("click",e=>{
    const i=e.target&&e.target.closest?e.target.closest(".mode-btn .info"):null;
    if(!i||!i.dataset.tip)return;
    e.preventDefault();e.stopPropagation();
    toast("Kenapa ini? "+i.dataset.tip);
  },true);
});

/* =========================================================
   TAHAP 3 — HP AMOLED (lihat HANDOFF-focus-flow-v3.md)
   Pengaturan baru disimpan di DB.profile.settings: amoled (bool, bawaan mati),
   haptics (bool, bawaan nyala), dailyGoalMin (menit; 0 = mati, bawaan 60).
   ========================================================= */
const S3=()=>DB.profile.settings;
const mqDark=window.matchMedia("(prefers-color-scheme: dark)");

/* ---------- 8. HITAM MURNI (AMOLED) ----------
   CSS ada di ux2.css (html.ff-amoled, hanya tema gelap / sistem-gelap). Di sini: pasang kelas dan
   samakan warna bilah sistem (<meta theme-color>) menjadi #000 saat gelap + AMOLED. improve.js
   mengatur ulang meta itu setiap applyTheme, jadi diterapkan lagi setelahnya. */
step("amoled",()=>{
  const dark=()=>{const t=S3().theme||"system";return t==="gelap"||(t==="system"&&mqDark.matches)};
  const apply=()=>{
    document.documentElement.classList.toggle("ff-amoled",!!S3().amoled);
    if(S3().amoled&&dark())document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{m.content="#000000"});
  };
  const _theme=window.applyTheme;
  window.applyTheme=function(){const r=_theme.apply(this,arguments);step("amoled-apply",apply);return r};
  if(mqDark.addEventListener)mqDark.addEventListener("change",()=>window.applyTheme());
  window.__ffAmoledApply=()=>window.applyTheme();
  apply();
});

/* ---------- 9. KARTU PENGATURAN "TAMPILAN & SENTUHAN" + GETAR ----------
   Kartu disisipkan setelah kartu Streak freeze di Pengaturan. Getar halus (8 ms; 12 ms untuk centang)
   pada kontrol utama; motor linear di HP kelas atas membuatnya terasa seperti ketukan, bukan dengung. */
step("look-card",()=>{
  const freeze=$i("useFreezeBtn"),host=freeze&&freeze.closest("article");
  if(!host||$i("ffLookCard"))return;
  const goals=[0,30,60,90,120,180,240];
  host.insertAdjacentHTML("afterend",
    '<article class="bento-card glass span-4" id="ffLookCard">'+
      '<h2 class="card-title">Tampilan &amp; sentuhan</h2>'+
      '<p class="card-subtitle">Dioptimalkan untuk layar AMOLED di HP.</p>'+
      '<div class="setting-row"><span>Hitam murni (AMOLED)<small>Latar #000 di tema gelap, hemat baterai.</small></span>'+
        '<button class="toggle" id="ffAmoled" type="button" role="switch" aria-checked="false" aria-label="Hitam murni AMOLED"><i></i></button></div>'+
      '<div class="setting-row"><span>Getar sentuhan<small>Getaran halus saat mengetuk tombol utama.</small></span>'+
        '<button class="toggle" id="ffHaptics" type="button" role="switch" aria-checked="false" aria-label="Getar sentuhan"><i></i></button></div>'+
      '<label class="setting-row"><span>Target fokus harian<small>Bilah progres tampil di Beranda.</small></span>'+
        '<select class="filter-select" id="ffDailyGoal" aria-label="Target fokus harian">'+
        goals.map(g=>'<option value="'+g+'">'+(g?g+" menit":"Mati")+'</option>').join("")+'</select></label>'+
    '</article>');

  const bind=(id,key,dflt,after)=>{
    const b=$i(id),get=()=>S3()[key]===undefined?dflt:!!S3()[key];
    const paint=()=>{b.classList.toggle("on",get());b.setAttribute("aria-checked",String(get()))};
    paint();
    b.onclick=()=>{S3()[key]=!get();saveDB();paint();if(after)after()};
  };
  bind("ffAmoled","amoled",false,()=>window.__ffAmoledApply&&window.__ffAmoledApply());
  bind("ffHaptics","haptics",true);
  const sel=$i("ffDailyGoal");
  sel.value=String(S3().dailyGoalMin===undefined?60:S3().dailyGoalMin);
  sel.onchange=()=>{S3().dailyGoalMin=+sel.value;saveDB();window.__ffDailyRender&&window.__ffDailyRender()};
});

step("haptics",()=>{
  if(!navigator.vibrate)return;
  const SEL=".nav-item,.task-check,.tm-check,.habit-check-btn,.toggle,.mode-btn,.task-tab,#focusStart,#miniStart,.pill-btn.primary";
  document.addEventListener("click",e=>{
    if(S3().haptics===false)return;
    const t=e.target&&e.target.closest?e.target.closest(SEL):null;
    if(!t||t.disabled)return;
    try{navigator.vibrate(t.matches(".task-check,.tm-check,.habit-check-btn")?12:8)}catch(_){}
  },true);
});

/* ---------- 10. TARGET FOKUS HARIAN ----------
   Bilah "Target hari ini: x / y menit" di kartu "Fokus 7 hari" (Beranda). Menit hari ini = elemen terakhir
   focusByDay() (hanya sesi selesai). Selebrasi sekali saat melintasi target selama aplikasi terbuka;
   saat aplikasi pertama dibuka dengan target sudah terlampaui tidak ada selebrasi. */
step("daily-goal",()=>{
  let last=null;
  const goal=()=>{const g=S3().dailyGoalMin;return g===undefined?60:(+g||0)};
  const render=()=>step("daily-render",()=>{
    const chart=$i("focusChart"),card=chart&&chart.closest(".bento-card");if(!card)return;
    let box=$i("ffDaily");const g=goal();
    if(!g){if(box)box.remove();last=null;return}
    const today=focusByDay()[6]||0,pct=Math.min(100,Math.round(today/g*100)),hit=today>=g;
    if(!box){box=document.createElement("div");box.id="ffDaily";box.className="ff-daily";card.appendChild(box)}
    box.classList.toggle("hit",hit);
    box.innerHTML='<div class="ff-daily-top"><span>Target hari ini</span><span>'+today+' / '+g+' menit'+(hit?' ✓':'')+'</span></div>'+
      '<div class="progress-track" role="progressbar" aria-label="Target fokus harian" aria-valuemin="0" aria-valuemax="'+g+'" aria-valuenow="'+Math.min(today,g)+'"><div class="progress-fill" style="width:'+pct+'%"></div></div>';
    if(last!==null&&last<g&&today>=g){
      toast("Target fokus hari ini tercapai. Mantap! 🎉");
      try{if(navigator.vibrate&&S3().haptics!==false)navigator.vibrate([60,40,60])}catch(_){}
    }
    last=today;
  });
  window.__ffDailyRender=render;
  const _home=window.renderHome;
  window.renderHome=function(){const r=_home.apply(this,arguments);render();return r};
  render();
});

/* =========================================================
   TAHAP 5 — FITUR ISI TANPA PLUGIN (lihat HANDOFF-focus-flow-v3.md bagian 5)
   11 filter "Hari ini", 12 geser kartu tugas, 13 tugas berulang, 14 ringkasan mingguan.
   Pengingat habit per jam menunggu Tahap 4 (butuh @capacitor/local-notifications).
   ========================================================= */

/* ---------- 11. FILTER "HARI INI" (Tugas > Daftar) ----------
   Tombol di toolbar Daftar: tugas belum selesai dengan tenggat hari ini atau lebih awal (yang terlambat ikut).
   Hanya di memori seperti kolom pencarian; kembali mati saat aplikasi dimuat ulang. */
step("today-filter",()=>{
  let on=false;
  const due=t=>t.status!=="done"&&!!t.dueDate&&t.dueDate<=isoDay(new Date());
  const _m=window.taskMatches;
  window.taskMatches=function(t){return _m.apply(this,arguments)&&(!on||due(t))};
  const _l=window.renderTaskList;
  window.renderTaskList=function(){
    const n=DB.tasks.filter(due).length;
    const b='<button type="button" class="pill-btn'+(on?" primary":"")+'" id="ffTodayBtn" aria-pressed="'+on+'">Hari ini'+(n?" · "+n:"")+'</button>';
    return _l.apply(this,arguments).replace('</select></div><div class="task-module-list">','</select>'+b+'</div><div class="task-module-list">');
  };
  const _b=window.bindTaskEvents;
  window.bindTaskEvents=function(){
    const r=_b.apply(this,arguments),btn=$i("ffTodayBtn");
    if(btn)btn.onclick=()=>{on=!on;renderTasks()};
    return r;
  };
});

/* ---------- 12. GESER KARTU TUGAS (HP) ----------
   Kartu .tm-row (Inbox dan Daftar): geser ke kanan = selesai, ke kiri = hapus. Keduanya memakai alur yang sudah ada
   (completeTaskModule dan tombol 🗑 di improve.js), jadi toast "Urungkan" ikut. Tombol di kartu tetap ada.
   Gerakan baru dianggap geser bila dominan horizontal; gulir vertikal tidak terganggu (touch-action: pan-y). */
step("swipe-task",()=>{
  const st=document.createElement("style");
  st.textContent=
    ".tm-row{touch-action:pan-y}"+
    ".tm-row.ff-swipe-r{box-shadow:inset 6px 0 0 var(--primary)}"+
    ".tm-row.ff-swipe-l{box-shadow:inset -6px 0 0 var(--danger,#B3261E)}";
  document.head.appendChild(st);
  const TH=90,LOCK=12;
  let row=null,x0=0,y0=0,dx=0,mode=0;
  const clear=snap=>{
    if(!row)return;
    const r=row;row=null;mode=0;dx=0;
    r.classList.remove("ff-swipe-r","ff-swipe-l");
    if(snap){r.style.transition="transform .15s";r.style.transform="";setTimeout(()=>{r.style.transition=""},200)}
    else{r.style.transition="";r.style.transform=""}
  };
  document.addEventListener("touchstart",e=>{
    clear(false);
    if(e.touches.length!==1)return;
    const el=e.target;if(!el||!el.closest)return;
    const r=el.closest(".tm-row[data-drag-task]");
    if(!r||el.closest("button,a,input,select,textarea,.info"))return;
    row=r;x0=e.touches[0].clientX;y0=e.touches[0].clientY;dx=0;mode=0;
  },{passive:true});
  document.addEventListener("touchmove",e=>{
    if(!row)return;
    const p=e.touches[0],mx=p.clientX-x0,my=p.clientY-y0;
    if(mode===0){
      if(Math.abs(mx)<LOCK&&Math.abs(my)<LOCK)return;
      if(Math.abs(mx)>Math.abs(my)*1.5){mode=1;row.style.transition="none"}
      else{clear(false);return}
    }
    dx=mx;
    row.style.transform="translateX("+Math.max(-140,Math.min(140,dx))+"px)";
    row.classList.toggle("ff-swipe-r",dx>TH);row.classList.toggle("ff-swipe-l",dx<-TH);
  },{passive:true});
  document.addEventListener("touchend",()=>{
    if(!row)return;
    const r=row,d=dx,m=mode,id=r.dataset.dragTask;
    if(m!==1||Math.abs(d)<=TH){clear(true);return}
    clear(false);
    try{if(navigator.vibrate&&S3().haptics!==false)navigator.vibrate(12)}catch(_){}
    if(d>0){const t=taskById(id);if(t&&t.status!=="done")completeTaskModule(id);else toast("Tugas ini sudah selesai.")}
    else{const b=r.querySelector("[data-task-del]");if(b)b.click()}
  });
  document.addEventListener("touchcancel",()=>clear(true));
  /* Petunjuk di bawah daftar (kelas yang sama dengan petunjuk geser di Kanban/Matriks) */
  const hint='<div class="touch-drag-hint">Layar sentuh: geser kartu ke kanan = selesai, ke kiri = hapus.</div>';
  const addHint=h=>h.replace(/<\/div><\/div>$/,"</div>"+hint+"</div>");
  const _i=window.renderTaskInbox,_l=window.renderTaskList;
  window.renderTaskInbox=function(){return addHint(_i.apply(this,arguments))};
  window.renderTaskList=function(){return addHint(_l.apply(this,arguments))};
});

/* ---------- 13. TUGAS BERULANG ----------
   Formulir tugas sudah menyimpan t.recurrence={freq:"harian|mingguan|bulanan",interval:1}, tetapi tidak ada yang
   membuat tugas berikutnya. Sekarang: saat tugas berulang BARU selesai (completedAt < 2 menit lalu), satu salinan
   (status todo, tenggat berikutnya) dibuat dan t.nextId mencatatnya. Diurungkan (status bukan done) → salinan yang
   belum disentuh dihapus. Satu titik di pembungkus saveDB, sehingga semua jalur selesai (centang Beranda/Tugas,
   seret ke Done, geser, Urungkan) tercakup. Tugas lama yang sudah selesai tidak ikut karena completedAt-nya lama. */
step("recurring",()=>{
  const FREQ={harian:["d",1],mingguan:["d",7],bulanan:["m",1]};
  const rec=t=>{const r=t&&t.recurrence;return r&&typeof r.freq==="string"&&Object.prototype.hasOwnProperty.call(FREQ,r.freq)?r:null};
  const parse=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||""));return m?new Date(+m[1],+m[2]-1,+m[3]):null};
  const shift=(base,f,n)=>{
    if(f[0]==="d")return addDays(base,f[1]*n);
    const y=base.getFullYear(),m=base.getMonth()+f[1]*n,last=new Date(y,m+1,0).getDate();
    return new Date(y,m,Math.min(base.getDate(),last));
  };
  /* Tenggat berikutnya = satu periode setelah tenggat lama, dimajukan sampai lewat hari ini
     (selesai telat tidak menumpuk tugas terlambat; bulanan dihitung dari tanggal asal agar 31 → 28 → 31) */
  const nextDue=(t,today)=>{
    const r=rec(t),f=FREQ[r.freq],iv=Math.max(1,Math.floor(+r.interval)||1),base=parse(t.dueDate)||parse(today);
    let n=1,d=shift(base,f,iv);
    while(isoDay(d)<=today&&n<2000){n++;d=shift(base,f,iv*n)}
    return isoDay(d);
  };
  const make=(t,today)=>{
    const n=structuredClone(t),due=nextDue(t,today);
    n.id=uid();n.status="todo";n.dueDate=due;n.actualPomodoro=0;n.createdAt=new Date().toISOString();
    ["completedAt","xpAwarded","nextId","ivyLeeOrder","scheduledEnd"].forEach(k=>{delete n[k]});
    if(typeof n.scheduledStart==="string"&&n.scheduledStart.length>10)n.scheduledStart=due+n.scheduledStart.slice(10);
    else delete n.scheduledStart;
    (n.subtasks||[]).forEach(s=>{s.id=uid();s.done=false});
    return n;
  };
  const reconcile=()=>{
    const today=isoDay(new Date()),fresh=Date.now()-120000;
    DB.tasks.slice().forEach(t=>{
      if(!rec(t))return;
      if(t.status==="done"){
        const at=t.completedAt?new Date(t.completedAt).getTime():0;
        if(t.nextId||!(at>=fresh))return;
        const n=make(t,today);DB.tasks.push(n);t.nextId=n.id;
      }else if(t.nextId){
        const i=DB.tasks.findIndex(x=>x.id===t.nextId);
        if(i>=0&&DB.tasks[i].status!=="done"&&!DB.tasks[i].actualPomodoro)DB.tasks.splice(i,1);
        delete t.nextId;
      }
    });
  };
  const _save=window.saveDB;
  window.saveDB=function(){step("recur-reconcile",reconcile);return _save.apply(this,arguments)};
  window.__ffNextDue=nextDue;
  /* Kartu tugas: tenggat dan penanda berulang (supaya filter "Hari ini" dan tugas berulang terbaca jelas) */
  const _tc=window.taskCard;
  window.taskCard=function(t){
    const html=_tc.apply(this,arguments),d=parse(t.dueDate),r=rec(t);
    const extra=(d?'<span class="tm-tag">'+fmtShort(d)+"</span>":"")+(r?'<span class="tm-tag">↻ '+r.freq+"</span>":"");
    return extra?html.replace('<div class="tm-tags">','<div class="tm-tags">'+extra):html;
  };
});

/* ---------- 14. RINGKASAN MINGGUAN (Pengaturan > Data) ----------
   Tombol "Ringkasan mingguan" mengunduh berkas Markdown untuk 7 hari terakhir (hari ini termasuk):
   skor, menit fokus per hari, tugas selesai, habit (hari selesai dari 7), tujuan aktif.
   Hanya membaca data; tidak mengubah apa pun dan bukan cadangan (tidak menyentuh lastExportAt). */
step("weekly-summary",()=>{
  const after=$i("exportCsvBtn");
  if(!after||$i("ffWeeklyBtn"))return;
  const clean=s=>String(s==null?"":s).replace(/\s+/g," ").trim();
  const build=()=>{
    const today=new Date(),days=Array.from({length:7},(_,i)=>addDays(today,i-6)),keys=days.map(d=>isoDay(d));
    const dow=d=>new Intl.DateTimeFormat("id-ID",{weekday:"short"}).format(d);
    const ses=DB.sessions.filter(s=>s.completed&&s.startedAt);
    const per=keys.map(k=>ses.filter(s=>isoDay(new Date(s.startedAt))===k).reduce((a,s)=>a+(+s.actualMin||0),0));
    const total=per.reduce((a,b)=>a+b,0),count=ses.filter(s=>keys.includes(isoDay(new Date(s.startedAt)))).length;
    const done=DB.tasks.filter(t=>t.status==="done"&&t.completedAt&&keys.includes(isoDay(new Date(t.completedAt))));
    const habits=DB.habits.filter(h=>!h.archived),goals=DB.goals.filter(g=>g.status==="aktif");
    const L=["# Ringkasan mingguan FocusFlow","",
      "Periode: "+fmtShort(days[0])+" – "+fmtShort(days[6])+" "+days[6].getFullYear(),
      "Skor minggu ini: "+weeklyScore()+"/100","",
      "## Fokus","- Total: "+total+" menit dalam "+count+" sesi","- Per hari: "+days.map((d,i)=>dow(d)+" "+per[i]).join(" · "),"",
      "## Tugas selesai ("+done.length+")"];
    done.slice(0,30).forEach(t=>L.push("- "+clean(t.title)));
    if(done.length>30)L.push("- … dan "+(done.length-30)+" lainnya");
    if(!done.length)L.push("- Belum ada.");
    L.push("","## Kebiasaan");
    habits.forEach(h=>L.push("- "+clean(h.name)+": "+days.filter(d=>habitDoneOnDate(h,d)).length+"/7 hari"));
    if(!habits.length)L.push("- Belum ada kebiasaan aktif.");
    L.push("","## Tujuan aktif");
    goals.forEach(g=>L.push("- "+clean(g.title)+": "+goalProgress(g)+"%"));
    if(!goals.length)L.push("- Belum ada tujuan aktif.");
    return L.join("\n")+"\n";
  };
  const b=document.createElement("button");
  b.type="button";b.className="pill-btn";b.id="ffWeeklyBtn";b.textContent="Ringkasan mingguan";
  after.insertAdjacentElement("afterend",b);
  b.onclick=()=>{
    try{if(downloadBlob(build(),"focusflow-ringkasan-mingguan-"+dateFileStamp()+".md","text/markdown;charset=utf-8"))toast("Ringkasan mingguan diunduh.")}
    catch(e){toast("Ringkasan gagal dibuat.")}
  };
  window.__ffWeeklyBuild=build;
});
})();
