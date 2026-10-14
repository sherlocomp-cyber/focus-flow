/* =========================================================
   06. INIT
   ========================================================= */


$("#newGoalBtn").onclick=()=>openGoalWizard();
$("#weeklyReviewBtn").onclick=()=>openReview("weekly");
$("#monthlyReviewBtn").onclick=()=>openReview("monthly");
$("#newTaskModuleBtn").onclick=()=>openTaskModuleModal();
$$(".task-tab").forEach(b=>b.onclick=()=>{taskView=b.dataset.taskView;renderTasks()});
$("#newHabitBtn").onclick=openHabitWizard;
$("#focusTaskSelect").onchange=e=>selectFocusTask(e.target.value);
$("#focusStart").onclick=startFocus;
$("#focusSkip").onclick=skipPhase;
$("#focusReset").onclick=fullResetFocus;
$("#addInterruption").onclick=addInterruption;
$("#focusFullscreen").onclick=()=>{
  const el=$("#page-fokus");
  if(!document.fullscreenElement)el.requestFullscreen?.().catch(()=>{});
  else document.exitFullscreen?.();
};
$("#notifyPermission").onclick=()=>requestNotification();
$("#focusAutoStart").onclick=toggleAutoStart;
$("#ambientVolume").oninput=e=>{DB.profile.settings.volume=+e.target.value;saveDB();if(focusState.ambientGain)focusState.ambientGain.gain.value=+e.target.value*.035};
$$(".mode-btn").forEach(b=>b.onclick=()=>selectMode(b.dataset.mode));
$$(".ambient-btn").forEach(b=>b.onclick=()=>toggleAmbient(b.dataset.ambient));

renderNav();
applyTheme();
renderHome();
document.addEventListener("visibilitychange",()=>{if(focusState.running)renderFocusUI()});
document.addEventListener("click",e=>{
  const nr=e.target.closest("[data-route]");if(nr){e.preventDefault();goTo(nr.dataset.route);return}
  const go=e.target.closest("[data-go]");if(go){goTo(go.dataset.go)}
  const info=e.target.closest("[data-tip]");
  if(info)toast("Kenapa ini? "+info.dataset.tip);
});
$("#quickTask").onclick=openTaskModal;
$("#openTasks").onclick=()=>goTo("tugas");
$("#miniStart").onclick=()=>{startFocus();goTo("fokus")};
$("#miniReset").onclick=fullResetFocus;
$("#themeQuick").onclick=cycleTheme;
$("#profileBtn").onclick=()=>{goTo("pengaturan")};
$("#modalClose").onclick=closeModal;
$("#modalBack").onclick=closeModal;
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("[data-route]")){e.preventDefault();goTo(e.target.dataset.route)}});
$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
document.addEventListener("focusin",e=>{if(document.body.classList.contains("modal-open")&&e.target.matches("input,select,textarea")){setTimeout(()=>e.target.scrollIntoView({block:"center",inline:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}),60)}});
$("#resetData").onclick=resetData;
focusState.remaining=focusDurationSeconds();
focusState.ambient=DB.profile.settings.ambient||"mati";
$("#appVersion").textContent="v"+APP_VERSION;
if(getMeta().schemaVersion!==SCHEMA_VERSION)saveMeta({schemaVersion:SCHEMA_VERSION});
route();
renderStorageNotices();
renderFocusUI();
renderHabits();
renderTasks();
renderGoals();
refreshGamification();
if(load("ff:onboarding","")!=="1")setTimeout(openOnboarding,500);

/* ---------- Aksesibilitas modal: fokus masuk, jebakan Tab, kembalikan fokus ---------- */
(()=>{
  const bd=$("#modalBackdrop"),modal=bd.querySelector(".modal");let last=null,was=false;
  const focusables=()=>[...modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);
  new MutationObserver(()=>{
    const open=bd.classList.contains("open");
    if(open&&!was){last=document.activeElement;setTimeout(()=>{if(!modal.contains(document.activeElement)){(focusables()[0]||modal).focus()}},150)}
    if(!open&&was){try{last?.focus?.()}catch(e){}last=null}
    was=open;
  }).observe(bd,{attributes:true,attributeFilter:["class"]});
  document.addEventListener("keydown",e=>{
    if(e.key!=="Tab"||!bd.classList.contains("open"))return;
    const f=focusables();if(!f.length){e.preventDefault();modal.focus();return}
    const first=f[0],lastEl=f[f.length-1];
    if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();lastEl.focus()}
    else if(!e.shiftKey&&(document.activeElement===lastEl||!modal.contains(document.activeElement))){e.preventDefault();first.focus()}
  });
})();

/* ---------- PWA ---------- */
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
  window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});
}
