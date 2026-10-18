/* =========================================================
   FOCUSFLOW — UX2.JS  ·  Tahap 1 (perbaikan UX)
   Dimuat SETELAH features.js. Wrapper fungsi global (pola yang sama
   dengan improve.js / focus-plus.js / features.js), tanpa mengubah berkas inti.

   1. Avatar = menu ke Insight & Pengaturan pada layar < 1080px
      (di sana navigasi bawah hanya memuat 5 tujuan utama; lihat ux2.css)
   2. Mode imersif otomatis saat sesi fokus dimulai (opsional, bawaan MATI)
   Tahap 3 (bagian 8-10): hitam murni AMOLED, getar sentuhan, target fokus harian
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
})();
