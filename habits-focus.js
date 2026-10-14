/* =========================================================
   HABIT MODULE — guided creation, logs, streak, heatmap
   ========================================================= */
const HABIT_DAYS=["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
let selectedHabitId=DB.habits.find(h=>!h.archived)?.id||"";
let habitWizard={step:1,data:{}};

function habitScheduledOn(h,date){
  const day=new Date(date).getDay(); // 0 Minggu
  if(h.frequency?.type==="harian")return true;
  if(h.frequency?.type==="harihari"){
    const days=h.frequency.days||[];
    return days.includes(day);
  }
  if(h.frequency?.type==="mingguan"){
    // Target mingguan fleksibel: hari apa pun boleh, statistik memakai log aktual.
    return true;
  }
  return true;
}
function habitLogFor(h,date){
  return DB.habitLogs.find(l=>l.habitId===h.id&&l.date===isoDay(date));
}
function setHabitStatus(h,status){
  const date=isoDay(now),existing=habitLogFor(h,date);
  if(existing)existing.status=status;
  else DB.habitLogs.push({id:uid(),habitId:h.id,date,status});
  saveDB();renderHabits();renderHome();
  if(status==="selesai")toast("+8 XP · Habit selesai. Bagus, lanjut pelan-pelan.");
  else if(status==="versi2menit")toast("Versi 2 menit tetap dihitung. Yang penting kembali bergerak.");
  else toast("Hari ini dilewati. Besok kita mulai lagi.");
}
function habitStreak(h){
  let streak=0,misses=0;
  for(let i=0;i<90;i++){
    const d=addDays(now,-i);
    if(!habitScheduledOn(h,d))continue;
    const log=habitLogFor(h,d);
    if(log?.status==="selesai"||log?.status==="versi2menit"){streak++;misses=0;continue}
    misses++;
    if(misses===1)continue; // satu kali lewat tidak langsung memutus streak
    break;
  }
  return streak;
}
function habitCompletion(h,days=30){
  let total=0,done=0;
  for(let i=0;i<days;i++){
    const d=addDays(now,-i);
    if(h.frequency?.type==="mingguan"){
      total++;
      if(habitLogFor(h,d)?.status==="selesai"||habitLogFor(h,d)?.status==="versi2menit")done++;
    }else if(habitScheduledOn(h,d)){
      total++;
      if(habitDoneOnDate(h,d))done++;
    }
  }
  return total?Math.round(done/total*100):0;
}
function habitDoneOnDate(h,date){
  const l=habitLogFor(h,date);return l?.status==="selesai"||l?.status==="versi2menit";
}
function overallHabitRate(){
  const active=DB.habits.filter(h=>!h.archived);
  return active.length?Math.round(active.reduce((a,h)=>a+habitCompletion(h),0)/active.length):0;
}
function weekStreakText(){
  const active=DB.habits.filter(h=>!h.archived),best=Math.max(0,...active.map(h=>habitStreak(h)));
  return best;
}
function renderHabitStreakBanner(){
  const best=weekStreakText();
  $("#habitStreakBanner").innerHTML=`<div class="streak-banner"><div style="font-size:30px">🔥</div><div><strong>${best} hari</strong><p>${best>=2?"Teruskan ritmenya. Tidak perlu sempurna.":"Mulai lagi hari ini. Satu langkah kecil sudah cukup."}</p></div></div>`;
}
function habitStatusButtons(h){
  const log=habitLogFor(h,now);
  const status=log?.status;
  return `<div class="habit-checks">
    <button class="habit-check-btn ${status==="selesai"?"done":""}" data-habit-action="selesai" data-habit="${h.id}">✓ Selesai</button>
    <button class="habit-check-btn ${status==="versi2menit"?"twomin":""}" data-habit-action="versi2menit" data-habit="${h.id}">2 menit</button>
    <button class="habit-check-btn ${status==="lewat"?"skip":""}" data-habit-action="lewat" data-habit="${h.id}">Lewati</button>
  </div>`;
}
function renderHabitList(){
  const active=DB.habits.filter(h=>!h.archived);
  $("#habitList").innerHTML=active.length?active.map(h=>{
    const rate=habitCompletion(h),streak=habitStreak(h);
    return `<div class="habit-card">
      <button class="habit-icon" data-habit-detail="${h.id}" aria-label="Detail ${escapeHtml(h.name)}">${h.name.includes("Baca")?"📖":h.name.includes("Jalan")?"🚶":"🌱"}</button>
      <button class="ghost" data-habit-detail="${h.id}" style="background:none;text-align:left;padding:0;min-width:0"><div class="habit-name">${escapeHtml(h.name)}</div><div class="habit-meta">${rate}% selesai · ${escapeHtml(h.when||"Kapan saja")}${h.where?" · "+escapeHtml(h.where):""}</div></button>
      <div><div class="habit-streak">${streak} <small>hari</small></div>${habitStatusButtons(h)}</div>
    </div>`;
  }).join(""):`<div class="empty-placeholder">Belum ada habit. Mulai dari yang kecil. 🌱</div>`;
}
function renderHabitStats(){
  const rate=overallHabitRate();
  $("#habitOverallRate").textContent=rate+"%";$("#habitRateBar").style.width=rate+"%";$("#habitRing").innerHTML=ring(rate,90);
}
function renderHabitHeatmap(){
  const active=DB.habits.filter(h=>!h.archived),cols=[];
  const start=addDays(now,-83);
  for(let w=0;w<12;w++){
    const col=[];
    for(let d=0;d<7;d++){
      const date=addDays(start,w*7+d);
      const count=active.filter(h=>habitDoneOnDate(h,date)).length;
      const ratio=active.length?count/active.length:0;
      const level=ratio===0?"":ratio<=.25?"l1":ratio<=.5?"l2":ratio<=.75?"l3":"l4";
      col.push(`<div class="heat-cell ${level}" title="${fmtShort(date)} · ${count}/${active.length} habit"></div>`);
    }
    cols.push(`<div class="heat-col">${col.join("")}</div>`);
  }
  const labels=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat("id-ID",{month:"short"}).format(addDays(start,i*7+3)).slice(0,3));
  $("#habitHeatmap").innerHTML=`<div class="heatmap">${cols.join("")}</div><div class="heat-labels">${labels.map(x=>`<span>${x}</span>`).join("")}</div>`;
}
function renderHabitDetail(){
  const h=DB.habits.find(x=>x.id===selectedHabitId&&!x.archived);
  if(!h){$("#habitDetail").innerHTML=`<div class="empty-placeholder" style="min-height:190px">Pilih habit di daftar untuk melihat detail.</div>`;return}
  const rate=habitCompletion(h),streak=habitStreak(h);
  const goal=DB.goals.find(g=>g.id===h.goalId);
  const fogg=rate<50;
  $("#habitDetail").innerHTML=`<div class="detail-head">
    <div class="detail-icon">${h.name.includes("Baca")?"📖":h.name.includes("Jalan")?"🚶":"🌱"}</div>
    <div style="min-width:0;flex:1"><div class="eyebrow">Habit</div><h3 style="margin:3px 0;font-size:20px">${escapeHtml(h.name)}</h3><p class="muted" style="margin:0;font-size:12px">${escapeHtml(h.identity||"")}</p></div>
    <button class="pill-btn" id="archiveHabit">Arsipkan</button>
  </div>
  <div class="habit-stat-grid"><div class="habit-stat"><strong>${rate}%</strong><span>Selesai 30 hari</span></div><div class="habit-stat"><strong>${streak}</strong><span>Streak</span></div><div class="habit-stat"><strong>${h.reminderTime||"—"}</strong><span>Pengingat</span></div></div>
  <div class="recipe-grid" style="margin-top:15px">
    <div class="recipe-item"><b>Aturan 2 menit <span class="info" data-tip="Mulai dari versi paling kecil, misalnya baca 1 halaman. Yang penting mulai dulu. (Atomic Habits)">i</span></b><span>${escapeHtml(h.twoMinuteVersion||"—")}</span></div>
    <div class="recipe-item"><b>Pemicu & kemudahan <span class="info" data-tip="Perilaku muncul kalau ada dorongan, kemampuan, dan pemicu. Kalau sering gagal, buat lebih mudah. (Fogg)">i</span></b><span>${escapeHtml(h.cue||"—")}</span></div>
    <div class="recipe-item"><b>Keinginan</b><span>${escapeHtml(h.craving||"—")}</span></div>
    <div class="recipe-item"><b>Hadiah <span class="info" data-tip="Kebiasaan bertahan lama saat kamu melihatnya sebagai bagian dari siapa dirimu.">i</span></b><span>${escapeHtml(h.reward||"—")}</span></div>
    <div class="recipe-item"><b>Habit stacking <span class="info" data-tip="Tempelkan kebiasaan baru setelah kebiasaan yang sudah ada supaya gampang ingat.">i</span></b><span>${escapeHtml(h.stackAfter||"—")}</span></div>
    <div class="recipe-item"><b>Kapan + di mana <span class="info" data-tip="Rencana &quot;jam X di tempat Y&quot; membuatmu lebih mungkin benar-benar bertindak. (Gollwitzer)">i</span></b><span>${escapeHtml(h.when||"—")} · ${escapeHtml(h.where||"—")}</span></div>
    <div class="recipe-item"><b>Frekuensi</b><span>${habitFrequencyText(h.frequency)}</span></div>
    <div class="recipe-item"><b>Goal</b><span>${goal?escapeHtml(goal.title):"Belum ditautkan"}</span></div>
  </div>
  ${fogg?`<div class="fogg-card" style="margin-top:14px"><strong>💡 Saran Fogg</strong><p style="margin:5px 0 0;font-size:12px">Completion habit ini masih di bawah 50%. Coba kecilkan versinya menjadi ${escapeHtml(h.twoMinuteVersion||"langkah paling kecil")}, kurangi hambatan, atau pasang pengingat yang lebih dekat dengan pemicunya.</p></div>`:""}
  `;
  $("#archiveHabit").onclick=()=>{h.archived=true;saveDB();selectedHabitId=DB.habits.find(x=>!x.archived)?.id||"";renderHabits();toast("Habit diarsipkan. Kamu tetap bisa melanjutkan habit lain.")};
}
function habitFrequencyText(f){
  if(!f)return"Fleksibel";
  if(f.type==="harian")return"Setiap hari";
  if(f.type==="harihari")return(f.days||[]).map(d=>HABIT_DAYS[(d+6)%7]).join(", ")||"Pilih hari";
  return`${f.timesPerWeek||1}× per minggu, hari fleksibel`;
}
function renderHabits(){
  renderHabitStreakBanner();renderHabitList();renderHabitStats();renderHabitHeatmap();renderHabitDetail();
  bindHabitEvents();
}
function bindHabitEvents(){
  $$("[data-habit-action]").forEach(b=>b.onclick=()=>{const h=DB.habits.find(x=>x.id===b.dataset.habit);if(h)setHabitStatus(h,b.dataset.habitAction)});
  $$("[data-habit-detail]").forEach(b=>b.onclick=()=>{selectedHabitId=b.dataset.habit;renderHabitDetail();document.querySelector("#habitDetail")?.scrollIntoView({behavior:"smooth",block:"center"})});
}
function openHabitWizard(){
  habitWizard={step:1,data:{frequency:{type:"harian"},days:[],reminderTime:"",goalId:""}};
  renderHabitWizard();
  $("#modalBackdrop").classList.add("open");document.body.classList.add("modal-open");
}
function renderHabitWizard(){
  const d=habitWizard.data,step=habitWizard.step;
  const dots=Array.from({length:3},(_,i)=>`<i class="wizard-dot ${i+1<=step?"active":""}"></i>`).join("");
  $("#modalTitle").textContent=step===1?"Habit baru · Kenali":step===2?"Habit baru · Rancang":"Habit baru · Atur";
  let body="";
  if(step===1)body=`<div class="wizard-steps">${dots}</div><div class="form-grid">
    <div class="field"><label>Nama habit</label><input id="hwName" value="${escapeHtml(d.name||"")}" placeholder="Contoh: Baca 10 menit"></div>
    <div class="field"><label>Identitas <span class="info" data-tip="Kebiasaan bertahan lama saat kamu melihatnya sebagai bagian dari siapa dirimu.">i</span></label><input id="hwIdentity" value="${escapeHtml(d.identity||"")}" placeholder="Aku adalah orang yang suka belajar."></div>
    <div class="field"><label>Versi 2 menit <span class="info" data-tip="Mulai dari versi paling kecil, misalnya baca 1 halaman. Yang penting mulai dulu. (Atomic Habits)">i</span></label><input id="hwTwo" value="${escapeHtml(d.twoMinuteVersion||"")}" placeholder="Baca 1 halaman"></div>
    <div class="form-help">Buat versi yang hampir terlalu mudah untuk ditolak. Nanti kalau sudah mulai, kamu boleh lanjut lebih lama.</div>
  </div>`;
  if(step===2)body=`<div class="wizard-steps">${dots}</div><div class="form-grid">
    <div class="field"><label>Pemicu & kemudahan <span class="info" data-tip="Perilaku muncul kalau ada dorongan, kemampuan, dan pemicu. Kalau sering gagal, buat lebih mudah. (Fogg)">i</span></label><input id="hwCue" value="${escapeHtml(d.cue||"")}" placeholder="Setelah sarapan"></div>
    <div class="field"><label>Keinginan</label><input id="hwCraving" value="${escapeHtml(d.craving||"")}" placeholder="Merasa lebih siap belajar"></div>
    <div class="field"><label>Hadiah</label><input id="hwReward" value="${escapeHtml(d.reward||"")}" placeholder="Centang dan lanjut aktivitas"></div>
    <div class="field"><label>Habit stacking <span class="info" data-tip="Tempelkan kebiasaan baru setelah kebiasaan yang sudah ada supaya gampang ingat.">i</span></label><input id="hwStack" value="${escapeHtml(d.stackAfter||"")}" placeholder="Setelah sarapan"></div>
    <div class="form-help">Contoh sederhana: “Setelah X, aku melakukan Y, lalu aku memberi diriku Z.”</div>
  </div>`;
  if(step===3)body=`<div class="wizard-steps">${dots}</div><div class="form-grid">
    <div class="field"><label>Kapan <span class="info" data-tip="Rencana &quot;jam X di tempat Y&quot; membuatmu lebih mungkin benar-benar bertindak. (Gollwitzer)">i</span></label><input id="hwWhen" value="${escapeHtml(d.when||"")}" placeholder="Pagi, setelah sarapan"></div>
    <div class="field"><label>Di mana</label><input id="hwWhere" value="${escapeHtml(d.where||"")}" placeholder="Kamar"></div>
    <div class="field"><label>Frekuensi fleksibel</label><select id="hwFreq"><option value="harian">Setiap hari</option><option value="mingguan">Beberapa kali per minggu</option><option value="harihari">Hari tertentu</option></select></div>
    <div id="hwDays" class="day-picker"></div>
    <div class="field"><label>Pengingat</label><input id="hwReminder" type="time" value="${escapeHtml(d.reminderTime||"")}"></div>
    <div class="field"><label>Tautkan ke goal</label><select id="hwGoal"><option value="">Tanpa goal</option>${DB.goals.map(g=>`<option value="${g.id}" ${d.goalId===g.id?"selected":""}>${escapeHtml(g.title)}</option>`).join("")}</select></div>
  </div>`;
  $("#modalBody").innerHTML=body+`<div class="modal-actions">${step>1?'<button type="button" class="pill-btn" id="hwBack">Kembali</button>':""}<button type="button" class="pill-btn primary" id="hwNext">${step<3?"Lanjut":"Simpan habit"}</button></div>`;
  if(step===3){
    $("#hwFreq").value=d.frequency?.type||"harian";
    renderWizardDays();$("#hwFreq").onchange=()=>{d.frequency={type:$("#hwFreq").value,timesPerWeek:d.frequency?.timesPerWeek||3,days:d.days||[]};renderWizardDays()};
    $("#hwGoal").onchange=()=>d.goalId=$("#hwGoal").value;
    $("#hwReminder").oninput=()=>d.reminderTime=$("#hwReminder").value;
  }
  $("#hwBack")?.addEventListener("click",()=>{collectHabitWizard();habitWizard.step--;renderHabitWizard()});
  $("#hwNext").onclick=()=>{collectHabitWizard();if(step<3){habitWizard.step++;renderHabitWizard()}else saveHabitWizard()};
}
function renderWizardDays(){
  const d=habitWizard.data,el=$("#hwDays");if(!el)return;
  if($("#hwFreq").value!=="harihari"){el.innerHTML="";return}
  el.innerHTML=HABIT_DAYS.map((x,i)=>`<button type="button" class="day-choice ${(d.days||[]).includes(i===6?0:i+1)?"selected":""}" data-day="${i===6?0:i+1}">${x}</button>`).join("");
  $$("[data-day]").forEach(b=>b.onclick=()=>{const n=+b.dataset.day;d.days=d.days||[];d.days=d.days.includes(n)?d.days.filter(x=>x!==n):[...d.days,n];renderWizardDays()});
}
function collectHabitWizard(){
  const d=habitWizard.data;
  const get=id=>document.getElementById(id)?.value;
  if(habitWizard.step===1){d.name=get("hwName")||d.name;d.identity=get("hwIdentity")||d.identity;d.twoMinuteVersion=get("hwTwo")||d.twoMinuteVersion}
  if(habitWizard.step===2){d.cue=get("hwCue")||d.cue;d.craving=get("hwCraving")||d.craving;d.reward=get("hwReward")||d.reward;d.stackAfter=get("hwStack")||d.stackAfter}
  if(habitWizard.step===3){d.when=get("hwWhen")||d.when;d.where=get("hwWhere")||d.where;d.frequency={...(d.frequency||{}),type:get("hwFreq")||"harian"}}
}
function saveHabitWizard(){
  const d=habitWizard.data;
  if(!d.name?.trim()){toast("Nama habit belum diisi.");return}
  if(!d.twoMinuteVersion?.trim()){toast("Isi versi 2 menit supaya habit terasa mudah dimulai.");return}
  if(d.frequency?.type==="harihari"&&!(d.days||[]).length){toast("Pilih minimal satu hari.");return}
  const h={id:uid(),name:d.name.trim(),identity:d.identity?.trim()||"Aku adalah orang yang konsisten bertumbuh.",twoMinuteVersion:d.twoMinuteVersion.trim(),cue:d.cue?.trim()||"",craving:d.craving?.trim()||"",reward:d.reward?.trim()||"",stackAfter:d.stackAfter?.trim()||"",when:d.when?.trim()||"",where:d.where?.trim()||"",frequency:d.frequency||{type:"harian"},reminderTime:d.reminderTime||"",goalId:d.goalId||"",archived:false,createdAt:new Date().toISOString()};
  DB.habits.push(h);saveDB();selectedHabitId=h.id;closeModal();renderHabits();toast("Habit baru dibuat. Mulai dari versi kecilnya. 🌱");
}

/* =========================================================
   05. FOCUS ENGINE — timestamp, cycle, audio, notification
   ========================================================= */
const FOCUS_MODES={
  klasik:{focus:25,short:5,long:15,label:"KLASIK"},
  deepwork:{focus:50,short:10,long:10,label:"DEEP WORK"},
  flow:{focus:0,short:0,long:0,label:"FLOW"}
};
const focusState={
  mode:"klasik",phase:"focus",running:false,targetAt:null,startedAt:null,
  remaining:25*60,elapsed:0,focusCount:0,cycleNo:1,taskId:"",
  interruption:[],interval:null,audioCtx:null,ambientNode:null,ambientGain:null
};
function focusDurationSeconds(){
  const m=FOCUS_MODES[focusState.mode];
  if(focusState.phase==="focus")return (focusState.mode==="klasik"?DB.profile.settings.focusMin:m.focus)*60;
  if(focusState.phase==="short")return (focusState.mode==="klasik"?DB.profile.settings.shortBreakMin:m.short)*60;
  return (focusState.mode==="klasik"?DB.profile.settings.longBreakMin:m.long)*60;
}
function focusRingPercent(){
  if(focusState.mode==="flow")return Math.min(100,focusState.elapsed/3600*100);
  const total=focusDurationSeconds();
  return total?Math.max(0,Math.min(100,focusState.remaining/total*100)):0;
}
function syncFocusFromTimestamp(){
  if(!focusState.running||!focusState.targetAt)return;
  const left=Math.max(0,Math.ceil((focusState.targetAt-Date.now())/1000));
  if(focusState.mode==="flow"){
    focusState.elapsed=Math.max(0,Math.floor((Date.now()-focusState.startedAt)/1000));
    focusState.remaining=0;
  }else{
    focusState.remaining=left;
    if(left<=0)finishTimedPhase();
  }
}
function fmtTimer(sec){sec=Math.max(0,Math.floor(sec));return `${Math.floor(sec/60).toString().padStart(2,"0")}:${(sec%60).toString().padStart(2,"0")}`}
function focusCurrentTask(){return taskById(focusState.taskId)}
function renderFocusUI(){
  syncFocusFromTimestamp();
  const label=focusState.mode==="flow"?fmtTimer(focusState.elapsed):fmtTimer(focusState.remaining);
  $("#focusTimer").textContent=label;
  $("#focusPhase").textContent=`${focusState.phase==="focus"?"FOKUS":focusState.phase==="short"?"ISTIRAHAT PENDEK":"ISTIRAHAT PANJANG"} · ${FOCUS_MODES[focusState.mode].label}`;
  $("#focusRing").innerHTML=ring(focusRingPercent(),285);
  const t=focusCurrentTask();
  $("#focusTaskLabel").textContent=t?t.title:"Tanpa tugas";
  $("#focusSelectedTask").textContent=t?`${t.title} · ${t.actualPomodoro||0}/${t.estimatePomodoro||1} Pomodoro`:"Belum ada tugas dipilih.";
  $("#focusStart").textContent=focusState.running?"Jeda":focusState.phase==="focus"?"Mulai fokus":"Mulai istirahat";
  $("#cycleText").textContent=`Sesi ${focusState.cycleNo} · ${focusState.focusCount}/4 fokus`;
  $("#autoStartLabel").textContent=DB.profile.settings.autoStart?"Auto-start aktif":"Auto-start mati";
  $("#miniTimer").textContent=label;
  $("#miniMode").textContent=focusState.mode==="flow"?"FLOW":focusState.phase==="focus"?FOCUS_MODES[focusState.mode].label:focusState.phase==="short"?"ISTIRAHAT": "ISTIRAHAT PANJANG";
  $("#miniStart").textContent=focusState.running?"Jeda":"Mulai";
}
function resetFocusPhase(){
  clearInterval(focusState.interval);focusState.interval=null;focusState.running=false;focusState.targetAt=null;focusState.startedAt=null;focusState.elapsed=0;
  focusState.remaining=focusDurationSeconds();renderFocusUI();
}
function startFocus(){
  if(focusState.running){
    syncFocusFromTimestamp();focusState.running=false;clearInterval(focusState.interval);focusState.interval=null;focusState.targetAt=null;renderFocusUI();return;
  }
  if(focusState.phase==="focus"&&!focusState.startedAt)focusState.startedAt=Date.now();
  if(focusState.mode==="flow"){
    if(!focusState.startedAt)focusState.startedAt=Date.now()-focusState.elapsed*1000;
  }else{
    const dur=focusState.remaining||focusDurationSeconds();
    focusState.targetAt=Date.now()+dur*1000;
    if(!focusState.startedAt)focusState.startedAt=Date.now();
  }
  focusState.running=true;
  clearInterval(focusState.interval);focusState.interval=setInterval(renderFocusUI,250);
  startAmbient(focusState.ambient||DB.profile.settings.ambient||"mati");
  requestNotification();
  renderFocusUI();
}
function finishTimedPhase(){
  if(!focusState.running)return;
  syncFocusFromTimestamp();
  focusState.running=false;clearInterval(focusState.interval);focusState.interval=null;focusState.targetAt=null;
  playBell();stopAmbient();
  if(focusState.phase==="focus"){
    completeFocusSession();
    focusState.focusCount++;
    focusState.cycleNo++;
    focusState.phase=(focusState.focusCount%4===0)?"long":"short";
  }else{
    focusState.phase="focus";
  }
  focusState.remaining=focusDurationSeconds();focusState.elapsed=0;focusState.startedAt=null;
  renderFocusUI();
  const nextIsFocus=focusState.phase==="focus";
  notifyUser(nextIsFocus?"Istirahat selesai. Waktunya kembali fokus.":focusState.phase==="long"?"Empat sesi selesai. Saatnya istirahat panjang.":"Sesi fokus selesai. Istirahat sebentar.");
  if(DB.profile.settings.autoStart)setTimeout(()=>startFocus(),650);
}
function completeFocusSession(){
  const actual=Math.max(1,Math.round((Date.now()-focusState.startedAt)/60000));
  const t=focusCurrentTask();
  const session={id:uid(),taskId:focusState.taskId||undefined,mode:focusState.mode,plannedMin:focusState.mode==="flow"?actual:Math.round(focusDurationSeconds()/60),actualMin:actual,startedAt:new Date(focusState.startedAt).toISOString(),endedAt:new Date().toISOString(),completed:true,interruptions:[...focusState.interruption]};
  DB.sessions.push(session);
  if(t)t.actualPomodoro=(t.actualPomodoro||0)+1;
  saveDB();
  openReflection(session);
}
function skipPhase(){
  if(focusState.running)syncFocusFromTimestamp();
  clearInterval(focusState.interval);focusState.interval=null;focusState.running=false;focusState.targetAt=null;stopAmbient();
  if(focusState.phase==="focus"){
    if(focusState.startedAt)completeFocusSession();
    focusState.focusCount++;
    focusState.cycleNo++;
    focusState.phase=(focusState.focusCount%4===0)?"long":"short";
  }else focusState.phase="focus";
  focusState.remaining=focusDurationSeconds();focusState.elapsed=0;focusState.startedAt=null;renderFocusUI();
}
function fullResetFocus(){
  clearInterval(focusState.interval);stopAmbient();
  Object.assign(focusState,{running:false,targetAt:null,startedAt:null,remaining:focusDurationSeconds(),elapsed:0,focusCount:0,cycleNo:1,interruption:[]});
  renderFocusUI();renderInterruptions();
}
function selectMode(mode){
  if(focusState.running){toast("Jeda dulu sebelum mengganti mode.");return}
  focusState.mode=mode;focusState.phase="focus";focusState.remaining=focusDurationSeconds();focusState.elapsed=0;focusState.startedAt=null;
  $$(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  renderFocusUI();
}
function selectFocusTask(id){
  focusState.taskId=id;renderFocusUI();
}
function renderTaskOptions(){
  const options=DB.tasks.filter(t=>t.status!=="done").sort((a,b)=>a.priority-b.priority).map(t=>`<option value="${t.id}">${escapeHtml(t.title)}</option>`).join("");
  $("#focusTaskSelect").innerHTML=`<option value="">Tanpa tugas</option>${options}`;
  $("#focusTaskSelect").value=focusState.taskId||"";
}
function addInterruption(){
  askText("Catat gangguan","Apa yang mengganggu? Tulis singkat saja.",note=>{
    if(!note.trim())return;
    focusState.interruption.push({at:new Date().toISOString(),note:note.trim()});renderInterruptions();
  });
}
function renderInterruptions(){
  const el=$("#interruptionList");if(!el)return;
  el.innerHTML=focusState.interruption.length?focusState.interruption.map(x=>`<div class="interruption-row"><span>${escapeHtml(x.note)}</span><span class="muted">${new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(new Date(x.at))}</span></div>`).join(""):`<div class="empty-placeholder" style="min-height:90px">Belum ada gangguan.</div>`;
}
function openReflection(session){
  $("#modalTitle").textContent="Sesi selesai ✨";
  $("#modalBody").innerHTML=`<div class="stack">
    <p class="muted" style="margin:0">Kamu baru saja menyelesaikan ${session.actualMin} menit fokus. Bagaimana rasanya?</p>
    <div class="field"><label>Rating fokus</label><div class="rating-row">${[1,2,3,4,5].map(n=>`<button type="button" class="rating-btn" data-rating="${n}">${n}★</button>`).join("")}</div></div>
    <div class="field"><label>Refleksi singkat <span class="muted">(opsional)</span></label><textarea id="reflectionText" placeholder="Apa yang membantu atau mengganggu?"></textarea></div>
    <div class="modal-actions"><button class="pill-btn primary" id="saveReflection">Simpan refleksi</button></div>
  </div>`;
  let rating=0;
  $$(".rating-btn").forEach(b=>b.onclick=()=>{$$(".rating-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");rating=+b.dataset.rating});
  $("#saveReflection").onclick=()=>{
    session.focusRating=rating||undefined;session.reflection=$("#reflectionText").value.trim()||undefined;saveDB();closeModal();focusState.interruption=[];renderInterruptions();renderLastSession();toast("Refleksi tersimpan.");
  };
  $("#modalBackdrop").classList.add("open");document.body.classList.add("modal-open");
}
function renderLastSession(){
  const s=DB.sessions[DB.sessions.length-1];if(!s)return;
  $("#lastSessionRating").textContent=s.focusRating?`${s.focusRating}/5 ★`:"Belum dinilai";
  $("#lastSessionInfo").textContent=`${s.actualMin} menit · ${FOCUS_MODES[s.mode]?.label||s.mode}${s.reflection?" · “"+s.reflection+"”":""}`;
}
function requestNotification(){
  if("Notification" in window&&Notification.permission==="default")Notification.requestPermission().catch(()=>{});
}
function notifyUser(message){
  if("Notification" in window&&Notification.permission==="granted"){try{new Notification("FocusFlow",{body:message})}catch(e){}}
}
function playBell(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;o.type="sine";g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.18,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.5);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.55);
  }catch(e){}
}
function startAmbient(type){
  stopAmbient();DB.profile.settings.ambient=type;saveDB();focusState.ambient=type;if(type==="mati")return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const c=new C();const gain=c.createGain();gain.gain.value=(DB.profile.settings.volume??.6)*.035;gain.connect(c.destination);
    const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const src=c.createBufferSource();src.buffer=buffer;src.loop=true;src.connect(gain);src.start();
    if(type==="kafe"){
      const osc=c.createOscillator();osc.type="sine";osc.frequency.value=180;const g2=c.createGain();g2.gain.value=.006;osc.connect(g2).connect(gain);osc.start();focusState.ambientNode={src,osc};
    }else focusState.ambientNode={src};
    focusState.audioCtx=c;focusState.ambientGain=gain;
  }catch(e){}
}
function stopAmbient(){
  try{focusState.ambientNode?.src?.stop();focusState.ambientNode?.osc?.stop();focusState.audioCtx?.close()}catch(e){}
  focusState.ambientNode=null;focusState.audioCtx=null;focusState.ambientGain=null;
}
function toggleAmbient(type){
  DB.profile.settings.ambient=type;saveDB();
  $$(".ambient-btn").forEach(b=>b.classList.toggle("active",b.dataset.ambient===type));
  if(focusState.running)startAmbient(type);
}
function toggleAutoStart(){
  DB.profile.settings.autoStart=!DB.profile.settings.autoStart;saveDB();
  $("#focusAutoStart").classList.toggle("on",DB.profile.settings.autoStart);renderFocusUI();
}
function renderFocusPage(){
  renderTaskOptions();renderFocusUI();renderInterruptions();renderLastSession();
  $$(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.mode===focusState.mode));
  $$(".ambient-btn").forEach(b=>b.classList.toggle("active",b.dataset.ambient===(DB.profile.settings.ambient||"mati")));
  $("#ambientVolume").value=DB.profile.settings.volume??.6;
  $("#focusAutoStart").classList.toggle("on",!!DB.profile.settings.autoStart);
}
