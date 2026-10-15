/* =========================================================
   FOCUSFLOW — FOCUS-PLUS.JS
   Dimuat SETELAH paper.js. Memperbaiki dan melengkapi alur fokus
   lewat wrapper fungsi global (pola yang sama dengan improve.js),
   tanpa mengubah berkas inti.

   01. Timer yang tidak pernah selesai (rekursi tanpa henti di 00:00)
   02. Waktu fokus hanya menghitung waktu aktif (jeda tidak ikut dihitung)
   03. Suara ambient berhenti saat jeda; hujan / kafe / white noise kini berbeda
   04. Timer bertahan saat halaman dimuat ulang atau aplikasi ditutup
   05. Alur: catat gangguan tanpa modal, tandai tugas selesai, target fokus harian
   ========================================================= */
(function(){
"use strict";

function step(name,fn){try{fn()}catch(e){try{console.error("[focus-plus] "+name,e)}catch(_){}}}

const TIMER_KEY="ff:timer",HIT_KEY="ff:focus-target-hit";
const todayKey=()=>isoDay(new Date());
let fs=null;
step("state",()=>{
  fs=focusState;
  if(!Number.isFinite(fs.activeMs))fs.activeMs=0;
  if(fs.resumedAt===undefined)fs.resumedAt=null;
  if(fs.sessionStart===undefined)fs.sessionStart=null;
});
if(!fs)return;

/* ---------- 01. TIMER SELESAI DENGAN BENAR ----------
   syncFocusFromTimestamp() memanggil finishTimedPhase() saat sisa waktu 0,
   dan finishTimedPhase() memanggil syncFocusFromTimestamp() lagi sebelum
   mematikan "running": keduanya saling memanggil sampai stack penuh.
   Akibatnya sesi tidak tercatat, bel tidak bunyi, istirahat tidak mulai.
   Pengaman: selama finishTimedPhase berjalan, sinkronisasi dilewati. */
step("timer-fix",()=>{
  let finishing=false;
  const _sync=window.syncFocusFromTimestamp,_finish=window.finishTimedPhase;
  window.syncFocusFromTimestamp=function(){if(finishing)return;return _sync.apply(this,arguments)};
  window.finishTimedPhase=function(){
    if(finishing)return;
    finishing=true;
    try{return _finish.apply(this,arguments)}finally{finishing=false}
  };
});

/* ---------- 02. WAKTU AKTIF ----------
   Sebelumnya lama sesi = sekarang − waktu mulai, sehingga jeda 30 menit
   ikut dihitung sebagai menit fokus (Insight, XP, target ikut membengkak). */
let pendingMs=null,pendingStart=null;
step("active-time",()=>{
  const _start=window.startFocus;
  window.startFocus=function(){
    const wasRunning=fs.running,fresh=!fs.startedAt;
    if(wasRunning){
      if(fs.phase==="focus"&&fs.resumedAt)fs.activeMs=(fs.activeMs||0)+(Date.now()-fs.resumedAt);
      fs.resumedAt=null;
    }
    const r=_start.apply(this,arguments);
    if(wasRunning){
      if(!fs.running)stopAmbient();            /* jeda: suara ikut berhenti */
    }else if(fs.running&&fs.phase==="focus"){
      if(fresh||!Number.isFinite(fs.activeMs)){fs.activeMs=0;fs.sessionStart=fs.startedAt}
      fs.resumedAt=Date.now();
    }
    persist(true);
    return r;
  };

  const _complete=window.completeFocusSession;
  window.completeFocusSession=function(){
    let ms=fs.activeMs||0;
    if(fs.resumedAt)ms+=Date.now()-fs.resumedAt;
    pendingMs=ms>0?ms:null;pendingStart=fs.sessionStart||null;
    try{return _complete.apply(this,arguments)}
    finally{pendingMs=null;pendingStart=null;fs.activeMs=0;fs.resumedAt=null;fs.sessionStart=null}
  };

  /* Sesi harus sudah dibetulkan sebelum modal refleksi menampilkan "X menit fokus". */
  const _open=window.openReflection;
  window.openReflection=function(session){
    if(pendingMs!=null&&session){
      session.actualMin=Math.max(1,Math.round(pendingMs/60000));
      if(session.mode==="flow")session.plannedMin=session.actualMin;
      if(pendingStart)session.startedAt=new Date(pendingStart).toISOString();
      saveDB();
    }
    const r=_open.apply(this,arguments);
    step("reflection-extra",()=>enhanceReflection(session));
    return r;
  };

  /* "Lewati": batas minimal sesi (improve.js) dinilai dari waktu aktif, bukan dari jam dinding. */
  const _skip=window.skipPhase;
  window.skipPhase=function(){
    if(fs.phase==="focus"&&fs.startedAt){
      const ms=(fs.activeMs||0)+(fs.resumedAt?Date.now()-fs.resumedAt:0);
      if(ms>0)fs.startedAt=Date.now()-ms;
    }
    const r=_skip.apply(this,arguments);
    persist(true);
    return r;
  };
});

/* ---------- 03. SUARA AMBIENT ---------- */
let ambTimer=null;
step("ambient",()=>{
  const _stop=window.stopAmbient;
  window.stopAmbient=function(){clearTimeout(ambTimer);ambTimer=null;return _stop.apply(this,arguments)};

  /* Sebelumnya "hujan" dan "white noise" memakai derau yang sama persis. Kini:
     putih = derau datar · hujan = derau disaring + gelombang pelan · kafe = derau rendah + denting cangkir.
     Node gain utama tetap fs.ambientGain (slider volume di init.js mengaturnya). */
  window.startAmbient=function(type){
    stopAmbient();
    DB.profile.settings.ambient=type;saveDB();fs.ambient=type;
    if(type==="mati")return;
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      const c=new C();
      if(c.state==="suspended"&&c.resume)c.resume().catch(()=>{});
      const master=c.createGain();
      master.gain.value=(DB.profile.settings.volume??.6)*.035;
      master.connect(c.destination);
      const len=c.sampleRate*6,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
      if(type==="kafe"){
        let last=0;
        for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.5}
        const drift=d[len-1]-d[0];                      /* sambungan loop tanpa "tak" */
        for(let i=0;i<len;i++)d[i]-=drift*i/len;
      }else for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      const src=c.createBufferSource();src.buffer=buf;src.loop=true;
      const nodes={src};
      if(type==="hujan"){
        const hp=c.createBiquadFilter();hp.type="highpass";hp.frequency.value=600;
        const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=7000;
        const g=c.createGain();g.gain.value=1.8;
        const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.13;lg.gain.value=.25;
        lfo.connect(lg);lg.connect(g.gain);lfo.start();
        src.connect(hp);hp.connect(lp);lp.connect(g);g.connect(master);nodes.lfo=lfo;
      }else if(type==="kafe"){
        const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=900;
        const g=c.createGain();g.gain.value=2;
        src.connect(lp);lp.connect(g);g.connect(master);
        const clink=()=>{
          if(fs.audioCtx!==c)return;
          const o=c.createOscillator(),og=c.createGain(),t=c.currentTime;
          o.type="sine";o.frequency.value=2200+Math.random()*1600;
          og.gain.setValueAtTime(.0001,t);
          og.gain.exponentialRampToValueAtTime(.3,t+.01);
          og.gain.exponentialRampToValueAtTime(.0001,t+.35);
          o.connect(og);og.connect(master);o.start(t);o.stop(t+.4);
          ambTimer=setTimeout(clink,5000+Math.random()*9000);
        };
        ambTimer=setTimeout(clink,4000);
      }else src.connect(master);
      src.start();
      fs.audioCtx=c;fs.ambientGain=master;fs.ambientNode=nodes;
    }catch(e){}
  };
});

/* ---------- 04. TIMER BERTAHAN SAAT DIMUAT ULANG ---------- */
let lastSig="",lastBeat=0;
function persist(force){
  try{
    const sig=[fs.mode,fs.phase,fs.running,fs.targetAt,fs.flowRunFrom,fs.running?"":fs.remaining+"/"+fs.elapsed,fs.focusCount,fs.cycleNo,fs.taskId,fs.startedAt,(fs.interruption||[]).length].join("|");
    const t=Date.now();
    if(!force&&sig===lastSig&&!(fs.running&&t-lastBeat>15000))return;
    lastSig=sig;lastBeat=t;
    save(TIMER_KEY,{
      mode:fs.mode,phase:fs.phase,running:!!fs.running,targetAt:fs.targetAt||null,flowRunFrom:fs.flowRunFrom||null,
      remaining:fs.remaining,elapsed:fs.elapsed,focusCount:fs.focusCount,cycleNo:fs.cycleNo,taskId:fs.taskId||"",
      startedAt:fs.startedAt||null,activeMs:fs.activeMs||0,resumedAt:fs.resumedAt||null,sessionStart:fs.sessionStart||null,
      interruption:fs.interruption||[],savedAt:t
    });
  }catch(e){}
}
function tick(){clearInterval(fs.interval);fs.interval=setInterval(renderFocusUI,250)}
function mmss(sec){return fmtTimer(sec)}
function clock(ms){return new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(new Date(ms))}

function restoreTimer(){
  const s=load(TIMER_KEY,null);
  if(!s||typeof s!=="object")return;
  const t=Date.now(),saved=Number(s.savedAt)||0;
  if(FOCUS_MODES[s.mode])fs.mode=s.mode;
  const task=s.taskId?taskById(s.taskId):null;
  fs.taskId=task&&task.status!=="done"?task.id:"";
  fs.phase="focus";fs.running=false;fs.targetAt=null;fs.flowRunFrom=null;fs.startedAt=null;
  fs.activeMs=0;fs.resumedAt=null;fs.sessionStart=null;fs.elapsed=0;fs.remaining=focusDurationSeconds();
  if(!saved||isoDay(new Date(saved))!==todayKey()){renderFocusPage();return}   /* hari baru: mulai bersih */

  fs.focusCount=Math.max(0,Math.floor(+s.focusCount)||0);
  fs.cycleNo=Math.max(1,Math.floor(+s.cycleNo)||1);
  fs.interruption=Array.isArray(s.interruption)?s.interruption.filter(x=>x&&typeof x.note==="string").slice(0,50):[];
  fs.phase=s.phase==="short"||s.phase==="long"?s.phase:"focus";
  const startedAt=Number(s.startedAt)||null,activeMs=Math.max(0,Number(s.activeMs)||0),resumedAt=Number(s.resumedAt)||null;
  const sessionStart=Number(s.sessionStart)||null;
  const keep=()=>{fs.startedAt=startedAt;fs.sessionStart=sessionStart};

  if(!s.running){                                              /* jeda atau belum mulai */
    keep();fs.activeMs=activeMs;
    const dur=focusDurationSeconds();
    fs.remaining=Number.isFinite(+s.remaining)?Math.max(0,Math.min(+s.remaining,Math.max(dur,3600))):dur;
    fs.elapsed=Math.max(0,Math.min(Math.floor(+s.elapsed)||0,12*3600));
    renderFocusPage();
    if(startedAt&&fs.phase==="focus")toast("Sesi fokus dilanjutkan di posisi terakhir (sedang dijeda).");
    return;
  }

  if(fs.mode==="flow"){
    const from=Number(s.flowRunFrom)||saved;
    if(t-saved<5*60*1000){                                     /* hanya tertutup sebentar: lanjut berjalan */
      keep();fs.activeMs=activeMs;fs.resumedAt=resumedAt||from;fs.flowRunFrom=from;fs.running=true;tick();
      renderFocusPage();toast("Mode Flow dilanjutkan.");
    }else{                                                     /* lama tak terpantau: berhenti di titik terakhir yang diketahui */
      keep();fs.activeMs=activeMs+Math.max(0,saved-(resumedAt||saved));
      fs.elapsed=Math.max(0,Math.floor((saved-from)/1000));
      renderFocusPage();toast("Aplikasi sempat tertutup. Mode Flow dijeda di "+mmss(fs.elapsed)+".");
    }
    return;
  }

  const target=Number(s.targetAt)||0;
  if(target>t){                                                /* masih ada sisa waktu: lanjut */
    keep();fs.activeMs=activeMs;fs.resumedAt=fs.phase==="focus"?(resumedAt||t):null;
    fs.targetAt=target;fs.remaining=Math.ceil((target-t)/1000);fs.running=true;tick();
    renderFocusPage();toast("Timer dilanjutkan. Sisa "+mmss(fs.remaining)+".");
    return;
  }

  /* Waktu habis saat aplikasi tertutup */
  if(fs.phase!=="focus"){fs.phase="focus";fs.remaining=focusDurationSeconds();renderFocusPage();toast("Istirahat selesai. Siap fokus lagi?");return}
  renderFocusPage();
  if(!startedAt||!target||t-target>6*3600*1000)return;
  askConfirm("Sesi berakhir saat aplikasi tertutup",
    "Timer fokus selesai pukul "+clock(target)+". Catat sebagai sesi fokus yang selesai?",
    ()=>{
      keep();
      fs.activeMs=activeMs+Math.max(0,target-(resumedAt||startedAt));
      fs.resumedAt=null;fs.targetAt=target;fs.running=true;
      finishTimedPhase();
    },"Ya, catat");
}

/* ---------- 05. ALUR: UI TAMBAHAN ---------- */
function todayMinutes(){
  const d=todayKey();
  return DB.sessions.reduce((a,s)=>a+(s&&s.completed&&s.startedAt&&isoDay(new Date(s.startedAt))===d?(Number(s.actualMin)||0):0),0);
}
function dailyTarget(){const v=Number(DB.profile.settings.dailyTargetMin);return v>=15&&v<=600?v:120}
function updateDaily(){
  const el=document.getElementById("ffDaily");if(!el)return;
  const m=todayMinutes(),g=dailyTarget(),pct=Math.min(100,Math.round(m/g*100));
  el.querySelector(".ff-daily-text").textContent=m>=g?"Target hari ini tercapai: "+m+" dari "+g+" menit":"Hari ini "+m+" dari "+g+" menit fokus";
  el.querySelector(".ff-daily-bar i").style.width=pct+"%";
  el.setAttribute("aria-label","Target fokus harian: "+m+" dari "+g+" menit. Ketuk untuk mengubah target.");
}
let dailySig="";
function syncExtras(){
  const btn=document.getElementById("ffTaskDone");
  if(btn){const tk=focusCurrentTask();btn.style.display=tk&&tk.status!=="done"?"":"none"}
  const sig=DB.sessions.length+"|"+dailyTarget()+"|"+todayKey();
  if(sig!==dailySig){dailySig=sig;updateDaily()}
}
function enhanceReflection(session){
  const box=document.querySelector("#modalBody .stack"),save_=document.getElementById("saveReflection");
  if(!box||!save_||!session)return;
  const actions=box.querySelector(".modal-actions");if(!actions)return;
  const task=session.taskId?taskById(session.taskId):null;
  let html="";
  const m=todayMinutes(),g=dailyTarget();
  if(m>=g&&load(HIT_KEY,"")!==todayKey()){
    save(HIT_KEY,todayKey());
    html+='<p class="ff-hit">🎯 Target fokus hari ini tercapai: '+m+' dari '+g+' menit.</p>';
  }
  if(task&&task.status!=="done")html+='<label class="ff-check"><input type="checkbox" id="ffTaskDoneChk"> Tugas “'+escapeHtml(task.title)+'” sudah selesai</label>';
  if(!html)return;
  actions.insertAdjacentHTML("beforebegin",html);
  const chk=document.getElementById("ffTaskDoneChk");
  if(chk)save_.addEventListener("click",()=>{
    if(!chk.checked||!task||task.status==="done")return;
    if(typeof window.completeTaskModule==="function")window.completeTaskModule(task.id);
    if(fs.taskId===task.id){fs.taskId="";renderTaskOptions();renderFocusUI()}
  });
}

step("hooks",()=>{
  const _rfu=window.renderFocusUI;
  window.renderFocusUI=function(){
    const r=_rfu.apply(this,arguments);
    step("persist",()=>{persist(false);syncExtras()});
    return r;
  };
  const _ri=window.renderInterruptions;
  window.renderInterruptions=function(){const r=_ri.apply(this,arguments);persist(true);return r};
  /* init.js mengikat fungsi lama langsung ke tombol; ikat ulang ke versi baru */
  const startBtn=document.getElementById("focusStart");
  if(startBtn)startBtn.onclick=()=>window.startFocus();
});

step("ui",()=>{
  const css=
  ".ff-quick{display:flex;gap:8px;margin:0 0 10px}"+
  ".ff-quick input{flex:1;min-width:0}"+
  ".ff-daily{display:grid;gap:8px;width:100%;margin-top:14px;padding:12px 14px;border:0;border-radius:14px;background:rgba(255,255,255,.14);color:inherit;font:inherit;font-size:13px;font-weight:700;text-align:left;cursor:pointer}"+
  ".ff-daily:focus-visible{outline:2px solid currentColor;outline-offset:2px}"+
  ".ff-daily-bar{display:block;height:6px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden}"+
  ".ff-daily-bar i{display:block;height:100%;width:0;border-radius:inherit;background:currentColor;transition:width .4s}"+
  ".ff-check{display:flex;gap:10px;align-items:center;min-height:44px;font-size:14px;font-weight:700}"+
  ".ff-check input{width:20px;height:20px}"+
  ".ff-hit{margin:0;font-weight:800}"+
  "@media (prefers-reduced-motion:reduce){.ff-daily-bar i{transition:none}}";
  const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

  /* (a) Catat gangguan langsung dari kolom, tanpa membuka modal */
  const list=document.getElementById("interruptionList");
  if(list&&list.parentNode&&!document.getElementById("ffQuickDist")){
    const f=document.createElement("form");f.id="ffQuickDist";f.className="ff-quick";
    f.innerHTML='<input id="ffQuickDistInput" class="task-search" type="text" maxlength="140" autocomplete="off" placeholder="Ketik gangguan, tekan Enter" aria-label="Catat gangguan"><button class="pill-btn" type="submit">Catat</button>';
    list.parentNode.insertBefore(f,list);
    f.addEventListener("submit",e=>{
      e.preventDefault();
      const inp=document.getElementById("ffQuickDistInput"),v=inp.value.trim();
      if(!v)return;
      fs.interruption.push({at:new Date().toISOString(),note:v.slice(0,140)});
      inp.value="";renderInterruptions();
    });
  }

  /* (b) Tandai tugas yang sedang dikerjakan selesai, langsung dari halaman fokus */
  const sel=document.getElementById("focusSelectedTask");
  if(sel&&!document.getElementById("ffTaskDone")){
    const b=document.createElement("button");b.id="ffTaskDone";b.type="button";b.className="pill-btn";b.style.display="none";b.textContent="✓ Tugas ini selesai";
    sel.insertAdjacentElement("afterend",b);
    b.addEventListener("click",()=>{
      const tk=focusCurrentTask();if(!tk||tk.status==="done")return;
      if(typeof window.completeTaskModule==="function")window.completeTaskModule(tk.id);
      fs.taskId="";renderTaskOptions();renderFocusUI();
    });
  }

  /* (c) Target fokus harian */
  const cyc=document.querySelector(".focus-main-card .focus-cycle");
  if(cyc&&!document.getElementById("ffDaily")){
    const b=document.createElement("button");b.id="ffDaily";b.type="button";b.className="ff-daily";
    b.innerHTML='<span class="ff-daily-text"></span><span class="ff-daily-bar" aria-hidden="true"><i></i></span>';
    cyc.insertAdjacentElement("afterend",b);
    b.addEventListener("click",()=>{
      const cur=dailyTarget(),opts=[];
      for(let v=30;v<=300;v+=30)opts.push('<option value="'+v+'"'+(v===cur?" selected":"")+'>'+v+' menit</option>');
      if(cur%30!==0||cur<30||cur>300)opts.unshift('<option value="'+cur+'" selected>'+cur+' menit</option>');
      askModal("Target fokus harian",'<div class="field"><label for="askInput">Berapa menit fokus yang ingin dicapai per hari?</label><select id="askInput">'+opts.join("")+'</select></div>',v=>{
        DB.profile.settings.dailyTargetMin=+v;saveDB();dailySig="";syncExtras();toast("Target fokus harian: "+v+" menit.");
      },"Simpan target");
    });
  }

  /* (d) Pintasan: tekan I (halaman Fokus) untuk langsung mengetik gangguan */
  document.addEventListener("keydown",e=>{
    if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
    if(e.key!=="i"&&e.key!=="I")return;
    const t=e.target;
    if(t&&t.closest&&t.closest("input,textarea,select,button,a,[contenteditable],[role=button]"))return;
    if(document.body.classList.contains("modal-open"))return;
    const pg=document.getElementById("page-fokus"),inp=document.getElementById("ffQuickDistInput");
    if(pg&&pg.classList.contains("active")&&inp){e.preventDefault();inp.focus()}
  });
});

/* Hook kecil untuk pengujian / debugging dari konsol */
window.FocusPlus={restore:restoreTimer,persist:()=>persist(true)};

step("restore",()=>{restoreTimer();renderFocusUI()});
})();
