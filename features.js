/* =========================================================
   FOCUSFLOW — FEATURES.JS (dimuat setelah focus-plus.js)
   Wrapper fungsi global, tanpa mengubah berkas inti.
   1. Habit <-> goal: ubah tautan dari detail habit; habit tertaut tampil di roadmap goal
   2. Kalender bulanan (tab Tugas > Bulan): tenggat, goal, habit, menit fokus; seret tugas ke hari lain
   3. Fokus imersif: mode zen layar penuh, opsi tanpa istirahat (Wake Lock: improve.js bagian 10)
   ========================================================= */
(function(){
"use strict";
function step(n,f){try{f()}catch(e){try{console.error("[features] "+n,e)}catch(_){}}}
const $i=id=>document.getElementById(id);

step("css",()=>{
  const st=document.createElement("style");
  st.textContent=
  ".ff-m-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}"+
  ".ff-m-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}"+
  ".ff-m-dow{font-size:11px;font-weight:800;text-align:center;opacity:.6}"+
  ".ff-m-day{min-height:64px;padding:4px;border-radius:10px;border:1px solid rgba(128,128,128,.25);font-size:11px;cursor:pointer;overflow:hidden}"+
  ".ff-m-day:focus-visible{outline:2px solid currentColor}"+
  ".ff-m-day.out{opacity:.35}.ff-m-day.today{border:2px solid currentColor}.ff-m-day.sel{background:rgba(128,128,128,.16)}.ff-m-day.over{background:rgba(128,128,128,.3)}"+
  ".ff-m-n{font-weight:800}"+
  ".ff-m-chip{display:block;margin-top:2px;padding:1px 4px;border-radius:6px;background:rgba(128,128,128,.2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".ff-m-chip.done{text-decoration:line-through;opacity:.6}"+
  ".ff-m-info{display:block;margin-top:2px;opacity:.75;font-size:10px}"+
  ".ff-m-detail{margin-top:12px;display:grid;gap:6px;font-size:13px}"+
  ".ff-hl{margin-top:8px;display:grid;gap:6px}.ff-hl div{display:flex;justify-content:space-between;gap:8px;font-size:13px}"+
  "body.ff-zen .topbar,body.ff-zen .pill-nav,body.ff-zen #page-fokus .bento-card:not(.focus-main-card){display:none!important}"+
  "body.ff-zen .focus-main-card{position:fixed;inset:0;z-index:40;margin:0;border-radius:0;overflow:auto;display:flex;flex-direction:column;justify-content:center}";
  document.head.appendChild(st);
});

/* ---------- 1. HABIT <-> GOAL ----------
   goalProgress() sudah menghitung habit tertaut (rata-rata 30 hari);
   di sini tautan bisa diubah setelah habit dibuat dan terlihat di roadmap goal. */
step("habit-goal",()=>{
  const _d=window.renderHabitDetail;
  window.renderHabitDetail=function(){
    const r=_d.apply(this,arguments);
    const h=DB.habits.find(x=>x.id===selectedHabitId&&!x.archived),box=$i("habitDetail");
    if(h&&box){
      box.insertAdjacentHTML("beforeend",'<div class="field" style="margin-top:14px"><label for="ffHabitGoal">Tautkan ke goal</label><select id="ffHabitGoal" class="filter-select"><option value="">Tanpa goal</option>'+
        DB.goals.filter(g=>g.status!=="selesai"||g.id===h.goalId).map(g=>'<option value="'+g.id+'"'+(h.goalId===g.id?" selected":"")+'>'+escapeHtml(g.title)+'</option>').join("")+'</select></div>');
      $i("ffHabitGoal").onchange=e=>{
        h.goalId=e.target.value||undefined;saveDB();renderHabits();renderHome();renderGoals();
        toast(h.goalId?"Habit ditautkan. Progres goal ikut dihitung dari habit ini.":"Tautan goal dilepas.");
      };
    }
    return r;
  };
  const _g=window.renderGoalRoadmap;
  window.renderGoalRoadmap=function(g){
    let out=_g.apply(this,arguments);
    const hs=goalLinkedHabits(g);
    if(hs.length)out+='<div class="card-divider" style="margin:10px 0"></div><strong>Habit tertaut</strong><div class="ff-hl">'+
      hs.map(h=>'<div><span>↻ '+escapeHtml(h.name)+'</span><span>'+habitCompletion(h)+'% · streak '+habitStreak(h)+'</span></div>').join("")+'</div>';
    return out;
  };
});

/* ---------- 2. KALENDER BULANAN ---------- */
step("month",()=>{
  const now0=new Date();
  let mY=now0.getFullYear(),mM=now0.getMonth(),mSel=null;
  const dayOf=k=>new Date(k+"T00:00:00");
  function dayData(k){
    return{
      tasks:DB.tasks.filter(t=>String(t.dueDate||"").slice(0,10)===k),
      goals:DB.goals.filter(g=>g.status!=="ditunda"&&g.deadline===k).map(g=>g.title)
        .concat(DB.goals.flatMap(g=>(g.milestones||[]).filter(m=>m.dueDate===k).map(m=>m.title))),
      habits:DB.habits.filter(h=>!h.archived&&habitDoneOnDate(h,dayOf(k))),
      min:DB.sessions.reduce((a,s)=>a+(s.completed&&s.startedAt&&isoDay(new Date(s.startedAt))===k?(+s.actualMin||0):0),0)
    };
  }
  function detail(){
    const el=$i("ffMDetail");if(!el)return;
    if(!mSel){el.innerHTML="";return}
    const x=dayData(mSel);
    el.innerHTML="<strong>"+fmtDate(dayOf(mSel))+"</strong>"+
      (x.tasks.map(t=>"<div>"+(t.status==="done"?"✓ ":"○ ")+escapeHtml(t.title)+"</div>").join("")||"<div class='muted'>Tidak ada tugas bertenggat.</div>")+
      x.goals.map(g=>"<div>🎯 "+escapeHtml(g)+"</div>").join("")+
      (x.habits.length?"<div>Habit selesai: "+x.habits.map(h=>escapeHtml(h.name)).join(", ")+"</div>":"")+
      (x.min?"<div>"+x.min+" menit fokus</div>":"");
  }
  function renderMonth(){
    const el=$i("taskWorkspace");if(!el)return;
    const first=new Date(mY,mM,1),lead=(first.getDay()+6)%7,total=Math.ceil((lead+new Date(mY,mM+1,0).getDate())/7)*7,today=isoDay(new Date());
    const label=new Intl.DateTimeFormat("id-ID",{month:"long",year:"numeric"}).format(first);
    let h='<div class="task-full-card"><div class="ff-m-head"><button class="pill-btn" id="ffMPrev" aria-label="Bulan sebelumnya">‹</button><h2 class="card-title" style="margin:0">'+label+'</h2><button class="pill-btn" id="ffMNext" aria-label="Bulan berikutnya">›</button></div><div class="ff-m-grid">';
    ["Sen","Sel","Rab","Kam","Jum","Sab","Min"].forEach(d=>{h+='<div class="ff-m-dow">'+d+"</div>"});
    for(let i=0;i<total;i++){
      const d=new Date(mY,mM,1-lead+i),k=isoDay(d),x=dayData(k);
      h+='<div class="ff-m-day'+(d.getMonth()!==mM?" out":"")+(k===today?" today":"")+(k===mSel?" sel":"")+'" data-k="'+k+'" tabindex="0" role="button" aria-label="'+fmtShort(d)+'"><span class="ff-m-n">'+d.getDate()+"</span>"+
        x.tasks.slice(0,2).map(t=>'<span class="ff-m-chip'+(t.status==="done"?" done":"")+'" draggable="true" data-t="'+t.id+'">'+escapeHtml(t.title)+"</span>").join("")+
        (x.tasks.length>2?'<span class="ff-m-info">+'+(x.tasks.length-2)+" lagi</span>":"")+
        (x.goals.length?'<span class="ff-m-info">🎯 '+x.goals.length+"</span>":"")+
        (x.habits.length||x.min?'<span class="ff-m-info">'+(x.habits.length?"✓"+x.habits.length+" ":"")+(x.min?x.min+"m":"")+"</span>":"")+"</div>";
    }
    h+='</div><div class="ff-m-detail" id="ffMDetail"></div><div class="touch-drag-hint">Seret tugas ke hari lain untuk mengubah tenggat. Ketuk hari untuk melihat detail.</div></div>';
    el.innerHTML=h;
    $i("ffMPrev").onclick=()=>{mM--;if(mM<0){mM=11;mY--}renderMonth()};
    $i("ffMNext").onclick=()=>{mM++;if(mM>11){mM=0;mY++}renderMonth()};
    el.querySelectorAll(".ff-m-day").forEach(c=>{
      c.onclick=()=>{mSel=c.dataset.k;el.querySelectorAll(".ff-m-day").forEach(z=>z.classList.toggle("sel",z===c));detail()};
      c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();c.click()}};
      c.ondragover=e=>{e.preventDefault();c.classList.add("over")};
      c.ondragleave=()=>c.classList.remove("over");
      c.ondrop=e=>{
        e.preventDefault();c.classList.remove("over");
        const t=taskById(e.dataTransfer.getData("text/plain"));
        if(!t||t.dueDate===c.dataset.k)return;
        t.dueDate=c.dataset.k;saveDB();renderMonth();renderHome();
        toast("Tenggat dipindah ke "+fmtShort(dayOf(c.dataset.k))+".");
      };
    });
    el.querySelectorAll("[data-t]").forEach(c=>{c.ondragstart=e=>e.dataTransfer.setData("text/plain",c.dataset.t)});
    detail();
  }
  const tabs=$i("taskTabs");
  if(tabs&&!tabs.querySelector('[data-task-view="month"]')){
    const b=document.createElement("button");b.className="task-tab";b.dataset.taskView="month";b.textContent="Bulan";
    b.onclick=()=>{taskView="month";renderTasks()};
    const cal=tabs.querySelector('[data-task-view="calendar"]');
    if(cal)cal.insertAdjacentElement("afterend",b);else tabs.appendChild(b);
  }
  const _rt=window.renderTasks;
  window.renderTasks=function(){
    if(taskView!=="month")return _rt.apply(this,arguments);
    $$(".task-tab").forEach(b=>b.classList.toggle("active",b.dataset.taskView==="month"));
    renderMonth();
  };
});

/* ---------- 3. FOKUS IMERSIF ---------- */
step("zen",()=>{
  const fs=focusState;
  const zen=on=>{
    document.body.classList.toggle("ff-zen",on);
    const z=$i("ffZen");if(z){z.setAttribute("aria-pressed",String(on));z.textContent=on?"✕ Keluar":"◎ Imersif"}
  };
  const fsBtn=$i("focusFullscreen");
  if(fsBtn&&!$i("ffZen")){
    const z=document.createElement("button");z.id="ffZen";z.type="button";z.className="pill-btn";z.textContent="◎ Imersif";z.setAttribute("aria-pressed","false");
    fsBtn.insertAdjacentElement("beforebegin",z);
    z.onclick=()=>{
      const on=!document.body.classList.contains("ff-zen");zen(on);
      if(on)document.documentElement.requestFullscreen?.().catch(()=>{});
      else if(document.fullscreenElement)document.exitFullscreen?.();
    };
  }
  document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&document.body.classList.contains("ff-zen"))zen(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("ff-zen"))zen(false)});

  /* Tanpa istirahat: setelah sesi fokus selesai, langsung siap fokus lagi (bukan fase istirahat) */
  const row=$i("focusAutoStart")&&$i("focusAutoStart").closest(".setting-row");
  if(row&&!$i("ffNoBreak")){
    row.insertAdjacentHTML("afterend",'<div class="setting-row"><span>Tanpa istirahat (lanjut fokus)</span><button class="toggle'+(DB.profile.settings.noBreak?" on":"")+'" id="ffNoBreak" role="switch" aria-label="Tanpa istirahat"><i></i></button></div>');
    $i("ffNoBreak").onclick=e=>{
      DB.profile.settings.noBreak=!DB.profile.settings.noBreak;saveDB();
      e.currentTarget.classList.toggle("on",!!DB.profile.settings.noBreak);
    };
  }
  const _f=window.finishTimedPhase;
  window.finishTimedPhase=function(){
    const was=fs.running,r=_f.apply(this,arguments);
    if(was&&DB.profile.settings.noBreak&&fs.mode!=="flow"&&fs.phase!=="focus"&&!fs.running){
      fs.phase="focus";fs.remaining=focusDurationSeconds();renderFocusUI();
    }
    return r;
  };

  /* Wake Lock: ditangani improve.js bagian 10 (syncWakeLock, dipanggil dari renderFocusUI dan visibilitychange).
     Dulu ada salinan kedua di sini sehingga dua kunci layar diminta bersamaan; salinan itu dihapus (Tahap 6a). */
});
})();
