/* =========================================================
   FOCUSFLOW — UX2.JS  ·  Tahap 1 (perbaikan UX)
   Dimuat SETELAH features.js. Wrapper fungsi global (pola yang sama
   dengan improve.js / focus-plus.js / features.js), tanpa mengubah berkas inti.

   1. Avatar = menu ke Insight & Pengaturan pada layar < 1080px
      (di sana navigasi bawah hanya memuat 5 tujuan utama; lihat ux2.css)
   2. Mode imersif otomatis saat sesi fokus dimulai (opsional, bawaan MATI)
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
})();
