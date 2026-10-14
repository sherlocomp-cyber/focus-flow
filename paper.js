/* =========================================================
   FOCUSFLOW — PAPER.JS  ·  Tema "Kertas 3D"
   Dimuat SETELAH improve.js. Menambah tema ke applyTheme,
   cycleTheme, dan pengaturan, tanpa mengubah file inti.
   ========================================================= */
(function(){
"use strict";
const T="kertas";
const NAMES={system:"mengikuti sistem",terang:"terang",gelap:"gelap",kertas:"Kertas 3D"};
const ORDER=["system","terang","gelap",T];

/* ---------- 01. ILUSTRASI KERTAS (SVG inline, tanpa berkas gambar) ---------- */
const BIRD='M0 0Q4-5 8-1Q12-5 16 0Q12-1 8 4Q4-1 0 0Z';
function birds(id,list){return list.map(b=>`<use href="#${id}" transform="translate(${b[0]} ${b[1]}) rotate(${b[2]}) scale(${b[3]})"/>`).join("")}
function cloud(id){
  const c=[[44,58,22],[80,44,30],[122,40,34],[160,52,26],[190,62,18]];
  const lay=f=>c.map(x=>`<circle cx="${x[0]}" cy="${x[1]}" r="${x[2]}" fill="${f}"/>`).join("")+`<rect x="30" y="58" width="176" height="24" rx="12" fill="${f}"/>`;
  return `<symbol id="${id}" viewBox="0 0 220 100"><g transform="translate(0 6)">${lay("#D9DCE3")}</g>${lay("#fff")}`+
    `<g fill="none" stroke="#CDD1D9" stroke-width="1.4"><circle cx="80" cy="44" r="19"/><circle cx="80" cy="44" r="11"/><circle cx="80" cy="44" r="4"/><circle cx="122" cy="40" r="23"/><circle cx="122" cy="40" r="14"/><circle cx="122" cy="40" r="6"/><circle cx="160" cy="52" r="15"/><circle cx="160" cy="52" r="8"/></g></symbol>`;
}
function hatch(id,col,op){return `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><line x1="0" y1="0" x2="0" y2="5" stroke="${col}" stroke-opacity="${op}" stroke-width="1"/></pattern>`}
function shadow(id,dy,sd,col,op){return `<filter id="${id}" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${sd}" flood-color="${col}" flood-opacity="${op}"/></filter>`}
function tree(x,y,s,flip){
  const dots=[[-26,-22,4],[10,-36,3],[30,-8,4],[-6,-4,3],[22,-30,3],[-34,-4,3]].map(d=>`<circle cx="${d[0]}" cy="${d[1]}" r="${d[2]}" fill="#F25A63"/>`).join("");
  return `<g transform="translate(${x} ${y}) scale(${flip?-s:s} ${s})"><g fill="none" stroke="#202126" stroke-linecap="round"><path d="M0 0C-4-26 8-48 0-74" stroke-width="6"/><path d="M2-36C20-48 30-58 42-70" stroke-width="3.5"/><path d="M0-48C-16-60-24-70-30-84" stroke-width="3"/></g>`+
    `<g fill="#D01F2A"><circle cx="0" cy="-84" r="26"/><circle cx="34" cy="-76" r="20"/><circle cx="-30" cy="-90" r="18"/><circle cx="14" cy="-104" r="16"/><circle cx="46" cy="-92" r="13"/><circle cx="-12" cy="-64" r="12"/></g>${dots}</g>`;
}
const SKY=`<svg id="paperSky" viewBox="0 0 800 400" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>
<radialGradient id="sk-sun" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="#EE3D46"/><stop offset="1" stop-color="#C4111C"/></radialGradient>
${shadow("sk-s1",6,6,"#5B0A10",.3)}${shadow("sk-s2",4,4,"#2A2D3A",.2)}
<path id="sk-b" d="${BIRD}" fill="#fff"/>${cloud("sk-c")}</defs>
<circle cx="520" cy="130" r="108" fill="url(#sk-sun)" filter="url(#sk-s1)"/>
<circle cx="520" cy="130" r="92" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5"/>
<g>${birds("sk-b",[[470,66,-12,1.5],[506,50,-4,1.2],[548,74,8,1.6],[582,56,-8,1.1],[612,92,10,1.4],[522,102,-6,1.3],[566,120,6,1],[470,112,-14,1.1],[600,138,12,1.2],[440,86,-8,.9]])}</g>
<g class="drift-a" filter="url(#sk-s2)"><use href="#sk-c" x="60" y="70" width="250" height="114"/></g>
<g class="drift-b" filter="url(#sk-s2)"><use href="#sk-c" x="560" y="170" width="210" height="96"/></g>
<g class="drift-a" filter="url(#sk-s2)"><use href="#sk-c" x="300" y="200" width="150" height="68"/></g>
</svg>`;

const LAND=`<svg id="paperLand" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>
${hatch("ln-h","#B9BDC6",.55)}${shadow("ln-s",-3,4,"#2A2D3A",.18)}${shadow("ln-s2",-4,5,"#2A2D3A",.22)}</defs>
<g filter="url(#ln-s)"><polygon points="0,300 0,170 60,120 110,150 170,90 240,160 300,110 380,170 450,100 520,165 600,115 670,170 740,130 800,160 800,300" fill="#E1E3E8"/>
<polygon points="0,300 0,170 60,120 110,150 170,90 240,160 300,110 380,170 450,100 520,165 600,115 670,170 740,130 800,160 800,300" fill="url(#ln-h)"/></g>
<g filter="url(#ln-s)"><polygon points="0,300 0,215 90,170 150,200 230,150 310,205 400,165 480,210 560,160 650,205 730,170 800,200 800,300" fill="#EEF0F3"/>
<polygon points="0,300 0,215 90,170 150,200 230,150 310,205 400,165 480,210 560,160 650,205 730,170 800,200 800,300" fill="url(#ln-h)" opacity=".7"/></g>
<g transform="translate(560 128)" fill="#fff" stroke="#C9CDD5" stroke-width="1"><rect x="-7" y="10" width="14" height="22"/><path d="M-18 12Q0 4 18 12L12 15H-12Z"/><path d="M-13-2Q0-9 13-2L9 1H-9Z"/><path d="M-9-14Q0-20 9-14L6-11H-6Z"/><rect x="-1" y="-26" width="2" height="12" stroke="none" fill="#C9CDD5"/></g>
<g filter="url(#ln-s2)"><path d="M0 300V250Q40 228 90 246Q130 224 190 242Q240 226 300 248Q340 234 400 252Q460 228 520 248Q580 230 640 250Q700 230 760 248Q780 242 800 246V300Z" fill="#F7F8FA"/></g>
<g filter="url(#ln-s2)"><path d="M0 300V272Q60 256 120 272Q180 258 250 274Q330 258 400 276Q470 260 540 276Q620 260 690 276Q750 264 800 274V300Z" fill="#fff"/></g>
${tree(215,262,.8,false)}${tree(590,266,.7,true)}
</svg>`;

const HERO=`<svg viewBox="0 0 520 330" preserveAspectRatio="xMaxYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>
<radialGradient id="hr-sun" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="#EE3D46"/><stop offset="1" stop-color="#C4111C"/></radialGradient>
${hatch("hr-h","#B9BDC6",.55)}${shadow("hr-s",-3,4,"#2A2D3A",.2)}${shadow("hr-s1",5,5,"#5B0A10",.3)}
<path id="hr-b" d="${BIRD}" fill="#fff"/></defs>
<circle cx="340" cy="120" r="86" fill="url(#hr-sun)" filter="url(#hr-s1)"/>
<g>${birds("hr-b",[[290,66,-10,1.4],[322,52,-2,1.1],[360,72,8,1.5],[392,58,-8,1],[410,96,10,1.3],[334,100,-6,1.2],[372,118,6,.9]])}</g>
<g filter="url(#hr-s)"><polygon points="0,330 0,215 70,150 120,190 190,120 260,200 330,140 400,210 460,165 520,200 520,330" fill="#E1E3E8"/>
<polygon points="0,330 0,215 70,150 120,190 190,120 260,200 330,140 400,210 460,165 520,200 520,330" fill="url(#hr-h)"/></g>
<g filter="url(#hr-s)"><polygon points="0,330 0,250 80,205 150,240 240,190 320,245 410,200 470,235 520,215 520,330" fill="#F0F2F5"/>
<polygon points="0,330 0,250 80,205 150,240 240,190 320,245 410,200 470,235 520,215 520,330" fill="url(#hr-h)" opacity=".7"/></g>
<g transform="translate(404 168)" fill="#fff" stroke="#C9CDD5" stroke-width="1"><rect x="-6" y="8" width="12" height="18"/><path d="M-16 10Q0 2 16 10L11 13H-11Z"/><path d="M-11-3Q0-10 11-3L8 0H-8Z"/><path d="M-7-14Q0-19 7-14L5-11H-5Z"/></g>
<g filter="url(#hr-s)"><path d="M0 330V282Q50 262 100 280Q150 258 210 278Q250 266 300 282V330Z" fill="#F7F8FA"/><path d="M330 330V284Q380 262 440 282Q490 266 520 276V330Z" fill="#F7F8FA"/></g>
<g filter="url(#hr-s)"><path d="M160 306Q240 250 320 306V318H160Z" fill="#fff" stroke="#D3D6DD" stroke-width="1"/><path d="M196 318Q240 276 284 318Z" fill="#C9CDD5"/><path d="M160 300H320" stroke="#D3D6DD" stroke-width="3"/></g>
<g stroke="#C9CDD5" stroke-width="1.2" opacity=".8"><path d="M170 322H310M180 327H300"/></g>
${tree(70,300,.62,false)}${tree(462,304,.55,true)}
</svg>`;

const FOCUS=`<svg viewBox="0 0 520 200" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>
<path id="fc-b" d="${BIRD}" fill="#fff"/></defs>
<g fill="#fff" fill-opacity=".14"><circle cx="110" cy="52" r="22"/><circle cx="140" cy="44" r="28"/><circle cx="176" cy="56" r="20"/><rect x="92" y="56" width="104" height="18" rx="9"/></g>
<g fill="#fff" fill-opacity=".7">${birds("fc-b",[[360,40,-8,1.2],[392,28,-2,1],[420,46,8,1.3],[450,34,-6,.9]])}</g>
<path d="M0 200V120L60 80 110 110 170 60 240 112 300 78 370 118 430 84 520 124V200Z" fill="#000" fill-opacity=".10"/>
<path d="M0 200V150L70 118 130 142 200 104 270 146 340 112 410 148 470 124 520 144V200Z" fill="#000" fill-opacity=".14"/>
<path d="M0 200V176Q60 156 120 172Q190 150 260 174Q330 154 400 176Q460 160 520 172V200Z" fill="#000" fill-opacity=".18"/>
</svg>`;

/* ---------- 02. PASANG DIORAMA (sekali, saat tema kertas dipakai) ---------- */
let mounted=false,raf=0;
function box(cls,html){const d=document.createElement("div");d.className=cls;d.setAttribute("aria-hidden","true");d.innerHTML=html;return d}
function mount(){
  if(!document.getElementById("paperScene")){
    const s=box("",SKY+LAND);s.id="paperScene";document.body.insertBefore(s,document.body.firstChild);
  }
  const hero=document.querySelector("#page-beranda .hero");
  if(hero&&!hero.querySelector(".paper-diorama"))hero.insertBefore(box("paper-diorama",HERO),hero.firstChild);
  const fm=document.querySelector(".focus-main-card");
  if(fm&&!fm.querySelector(".paper-diorama"))fm.insertBefore(box("paper-diorama",FOCUS),fm.firstChild);
  if(!mounted){
    mounted=true;
    window.addEventListener("scroll",()=>{
      if(raf||document.documentElement.dataset.theme!=="paper")return;
      raf=requestAnimationFrame(()=>{raf=0;const sc=document.getElementById("paperScene");if(sc)sc.style.setProperty("--py",Math.min(window.scrollY||0,600))});
    },{passive:true});
  }
}

/* ---------- 03. applyTheme + cycleTheme ---------- */
const _applyTheme=window.applyTheme;
window.applyTheme=function(){
  _applyTheme.apply(this,arguments);
  const t=DB.profile.settings.theme||"system",paper=t===T;
  if(paper){document.documentElement.dataset.theme="paper";mount()}
  const b=$("#themeQuick");
  if(b&&paper){
    b.textContent="\u2702\uFE0E";
    const l="Tema: Kertas 3D (ketuk untuk ganti)";b.title=l;b.setAttribute("aria-label",l);
  }
  if(paper)document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{m.content="#E8EAEE";m.removeAttribute("media")});
  syncSwatches();
};
window.cycleTheme=function(){
  const cur=DB.profile.settings.theme||"system",next=ORDER[(ORDER.indexOf(cur)+1)%ORDER.length];
  DB.profile.settings.theme=next;saveDB();applyTheme();toast("Tema: "+NAMES[next]);
};
const tq=$("#themeQuick");if(tq)tq.onclick=window.cycleTheme;

/* ---------- 04. PENGATURAN: kartu pratinjau tema ---------- */
const SW=[["system","Sistem"],["terang","Terang"],["gelap","Gelap"],[T,"Kertas 3D"]];
function syncSwatches(){
  const cur=(window.DB&&DB.profile.settings.theme)||"system";
  document.querySelectorAll("[data-theme-pick]").forEach(b=>{
    const on=b.dataset.themePick===cur;b.setAttribute("aria-checked",on?"true":"false");
  });
}
function enhanceThemeSetting(){
  const sel=$("#settingsTheme");if(!sel)return;
  if(!sel.querySelector('option[value="'+T+'"]')){const o=document.createElement("option");o.value=T;o.textContent="Kertas 3D";sel.appendChild(o)}
  sel.value=DB.profile.settings.theme||"system";
  if(!$("#themeSwatches")){
    sel.hidden=true;
    const g=document.createElement("div");g.id="themeSwatches";g.className="theme-swatches";g.setAttribute("role","radiogroup");g.setAttribute("aria-label","Pilih tema");
    g.innerHTML=SW.map(s=>`<button type="button" class="theme-swatch" role="radio" aria-checked="false" data-theme-pick="${s[0]}"><span class="sw sw-${s[0]}"></span><b>${s[1]}</b></button>`).join("");
    sel.insertAdjacentElement("afterend",g);
    g.addEventListener("click",e=>{
      const b=e.target.closest("[data-theme-pick]");if(!b)return;
      sel.value=b.dataset.themePick;sel.dispatchEvent(new Event("change",{bubbles:true}));
    });
  }
  syncSwatches();
}
const _bindSettings=window.bindSettings;
window.bindSettings=function(){_bindSettings.apply(this,arguments);try{enhanceThemeSetting()}catch(e){}};

/* ---------- 05. TEMA BAWAAN ---------- */
/* Pengguna baru dan "Reset data" mulai dari Kertas 3D (seedProfile dipakai resetData). */
try{seedProfile.settings.theme=T}catch(e){}
/* Aplikasi yang sudah terpasang dipindah ke Kertas 3D satu kali; setelah itu pilihan pengguna dihormati. */
if(load("ff:themeDefault","")!=="1"){
  save("ff:themeDefault","1");
  DB.profile.settings.theme=T;saveDB();
}

/* ---------- 06. INISIALISASI ---------- */
const ver=$("#appVersion");if(ver)ver.textContent="v1.6.1";
applyTheme();
})();
