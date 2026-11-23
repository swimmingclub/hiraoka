// ===== シミュレータ共通基盤 =====
// 各シミュレータは defineSim({...}) で登録する。
//  id, level('beginner'|'intermediate'|'advanced'), name, formula, explain, hint, related:['B1',...]
//  params:[{id,label,min,max,step,value,unit} | {id,label,type:'check',value} | {id,label,type:'select',options:[[v,label]],value}]
//  buttons:[{label, action(S)}]
//  init(S)          : 状態の初期化（シミュ切替時・リセット時）
//  onParam(S,id)    : パラメータ変更時（省略可）
//  step(S,dt)       : 時間発展（省略可、dt は秒）
//  draw(g,S)        : 960×600 の論理座標で描画
//  readout(S)       : [[ラベル, 文字列], ...] を返す
const SIMS = [];
function defineSim(def){ SIMS.push(def); }
const LEVELS = {beginner:{label:'初級',color:'--b'},intermediate:{label:'中級',color:'--m'},advanced:{label:'上級',color:'--a'}};
const PROBLEMS_URL = '__PROBLEMS_URL__';
const W = 960, H = 600;

// ---- 小さな道具 ----
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
function fmt(v, sig=3){
  if(!isFinite(v)) return '—';
  if(v===0) return '0';
  const a=Math.abs(v);
  if(a>=1e5||a<1e-3){ const e=Math.floor(Math.log10(a)); const m=v/10**e; return m.toFixed(sig-1)+'×10'+sup(e); }
  const d=Math.max(0,sig-1-Math.floor(Math.log10(a)));
  return v.toFixed(Math.min(d,6));
}
function sup(n){return String(n).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(c)]).join('')}
function arrow(g,x1,y1,x2,y2,color,w=2,head=10){
  const ang=Math.atan2(y2-y1,x2-x1), len=Math.hypot(x2-x1,y2-y1);
  if(len<1) return;
  const h=Math.min(head,len*0.6);
  g.save(); g.strokeStyle=color; g.fillStyle=color; g.lineWidth=w; g.lineCap='round';
  g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2-Math.cos(ang)*h*0.7,y2-Math.sin(ang)*h*0.7); g.stroke();
  g.beginPath(); g.moveTo(x2,y2);
  g.lineTo(x2-h*Math.cos(ang-0.4),y2-h*Math.sin(ang-0.4));
  g.lineTo(x2-h*Math.cos(ang+0.4),y2-h*Math.sin(ang+0.4)); g.closePath(); g.fill(); g.restore();
}
// 「h_P」「u_{max}」のような下付き文字を小さく下げて描く
function text(g,s,x,y,o={}){
  const size=(o.size||15)*1.2, font=w=>`${o.weight||500} ${w}px ${o.mono?S.C.fmono:S.C.fbody}`;
  const parts=[]; let last=0; const re=/_\{([^}]*)\}|_([^\s=,:：（）()\/+−·]+)/g; let m;
  while((m=re.exec(s))){ if(m.index>last) parts.push([s.slice(last,m.index),0]); parts.push([m[1]??m[2],1]); last=re.lastIndex; }
  if(last<s.length) parts.push([s.slice(last),0]);
  g.save(); g.textBaseline=o.base||'middle'; g.textAlign='left';
  const widths=parts.map(([t,sub])=>{ g.font=font(sub?size*0.72:size); return g.measureText(t).width; });
  const tw=widths.reduce((a,b)=>a+b,0);
  let bx=x; if((o.align||'left')==='center') bx-=tw/2; else if(o.align==='right') bx-=tw;
  if(o.bg){ const pw=6, h=size+6; g.fillStyle=o.bg; g.fillRect(bx-pw,y-h/2,tw+pw*2,h); }
  g.fillStyle=o.color||S.C.ink;
  parts.forEach(([t,sub],i)=>{ g.font=font(sub?size*0.72:size); g.fillText(t,bx,sub?y+size*0.28:y); bx+=widths[i]; });
  g.restore();
}
function line(g,pts,color,w=1.5,dash){
  g.save(); g.strokeStyle=color; g.lineWidth=w; if(dash) g.setLineDash(dash);
  g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); g.restore();
}
function rect(g,x,y,w,h,fill,stroke,lw=1.5){ g.save(); if(fill){g.fillStyle=fill;g.fillRect(x,y,w,h);} if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.strokeRect(x,y,w,h);} g.restore(); }
// 圧力などのカラーマップ（低=青 → 高=赤）、t∈[0,1]
function heat(t){ t=clamp(t,0,1);
  const s=[[60,111,216],[110,190,220],[240,240,230],[245,170,90],[224,82,79]];
  const k=t*(s.length-1), i=Math.min(Math.floor(k),s.length-2), f=k-i;
  const c=s[i].map((v,j)=>Math.round(lerp(v,s[i+1][j],f))); return `rgb(${c[0]},${c[1]},${c[2]})`; }
// 粒子（流れの可視化用）
function makeParticles(n,spawn){ return Array.from({length:n},()=>spawn(true)); }

// ---- 実行時 ----
const S = {P:{}, t:0, C:{}, pointer:{x:0,y:0,down:false}};
let cur=null;
const cv=document.getElementById('cv'), g=cv.getContext('2d');
function readColors(){
  const cs=getComputedStyle(document.documentElement);
  ['bg','paper','ink','muted','line','accent','accent-soft','code','water','water-deep','solid','wood','air','hi','lo','b','m','a']
    .forEach(k=>S.C[k.replace('-','_')]=cs.getPropertyValue('--'+k).trim());
  S.C.fbody=cs.getPropertyValue('--f-body'); S.C.fmono=cs.getPropertyValue('--f-mono');
}
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2), r=cv.getBoundingClientRect();
  const scale=(r.width||W)/W*dpr;
  cv.width=Math.round(W*scale); cv.height=Math.round(H*scale);
  g.setTransform(scale,0,0,scale,0,0);
}
function buildNav(){
  const nav=document.getElementById('nav');
  nav.innerHTML=Object.entries(LEVELS).map(([lv,L])=>`<div class="grp"><h2><span class="dot" style="background:var(${L.color})"></span>${L.label}</h2>${
    SIMS.filter(s=>s.level===lv).map(s=>`<a href="#${s.id}" data-id="${s.id}">${s.name}</a>`).join('')}</div>`).join('');
  const bl=document.getElementById('backlink');
  if(PROBLEMS_URL.startsWith('http')) bl.href=PROBLEMS_URL; else bl.hidden=true;
}
function buildControls(sim){
  const box=document.getElementById('ctls'); box.innerHTML='';
  S.P={};
  (sim.params||[]).forEach(p=>{
    S.P[p.id]=p.value;
    const id='p-'+sim.id+'-'+p.id;
    if(p.type==='check'){
      const l=document.createElement('label'); l.className='chk';
      l.innerHTML=`<input type="checkbox" id="${id}" ${p.value?'checked':''}> <span>${M(p.label)}</span>`;
      l.querySelector('input').onchange=e=>{S.P[p.id]=e.target.checked; changed(p.id)}; box.appendChild(l); return;
    }
    const d=document.createElement('div'); d.className='ctl';
    if(p.type==='select'){
      d.innerHTML=`<div class="lab"><label for="${id}">${M(p.label)}</label></div><select id="${id}">${p.options.map(([v,l])=>`<option value="${v}" ${v==p.value?'selected':''}>${l}</option>`).join('')}</select>`;
      d.querySelector('select').onchange=e=>{S.P[p.id]=e.target.value; changed(p.id)};
    } else {
      d.innerHTML=`<div class="lab"><label for="${id}">${M(p.label)}</label><output>${show(p,p.value)}</output></div><input type="range" id="${id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}">`;
      const out=d.querySelector('output');
      d.querySelector('input').oninput=e=>{const v=parseFloat(e.target.value); S.P[p.id]=v; out.textContent=show(p,v); changed(p.id)};
    }
    box.appendChild(d);
  });
  const bb=document.getElementById('btns'); bb.innerHTML='';
  const all=[...(sim.buttons||[]),{label:'初期値に戻す',action:()=>select(sim.id,true)}];
  all.forEach(b=>{const e=document.createElement('button'); e.className='btn'; e.textContent=b.label; e.onclick=()=>{b.action(S); updateReadout()}; bb.appendChild(e)});
}
function show(p,v){ const d=p.digits??Math.max(0,-Math.floor(Math.log10(p.step||1))); return (+v).toFixed(d)+(p.unit?' '+p.unit:''); }
function changed(id){ if(cur.onParam) cur.onParam(S,id); updateReadout(); }
function setParam(id,v){ S.P[id]=v; const el=document.getElementById('p-'+cur.id+'-'+id); if(el){ if(el.type==='checkbox') el.checked=v; else el.value=v; el.dispatchEvent(new Event('input')); } }
let roKey='';
function updateReadout(){
  const rows=cur.readout?cur.readout(S):[], tb=document.getElementById('ro'), key=cur.id+'|'+rows.map(r=>r[0]).join('|');
  if(key!==roKey){ roKey=key; tb.innerHTML=rows.map(([a,b])=>`<tr><td>${M(a)}</td><td></td></tr>`).join(''); }
  rows.forEach(([a,b],i)=>{ const c=tb.rows[i]&&tb.rows[i].cells[1]; if(c&&c.textContent!==b) c.textContent=b; });
}
function select(id,force){
  const sim=SIMS.find(s=>s.id===id)||SIMS[0];
  if(cur===sim && !force) return;
  cur=sim;
  document.querySelectorAll('#nav a').forEach(a=>{ if(a.dataset.id===sim.id){ a.setAttribute('aria-current','page'); try{a.scrollIntoView({block:'nearest',inline:'nearest'})}catch(e){} } else a.removeAttribute('aria-current'); });
  const L=LEVELS[sim.level];
  const lv=document.getElementById('lvl'); lv.textContent=L.label; lv.style.background=`var(${L.color})`;
  document.getElementById('simname').textContent=sim.name;
  document.getElementById('formula').innerHTML=M(sim.formula);
  document.getElementById('explain').innerHTML=M(sim.explain);
  document.getElementById('hint').innerHTML='<b>やってみよう：</b>'+M(sim.hint||'');
  document.getElementById('hint').hidden=!sim.hint;
  const rel=document.getElementById('related');
  rel.innerHTML=sim.related&&sim.related.length?('関連する問題：'+sim.related.map(r=>PROBLEMS_URL.startsWith('http')?`<a href="${PROBLEMS_URL}#${sim.level}" target="_blank" rel="noopener">${r}</a>`:r).join('、')):'';
  document.title=sim.name+' | 流体力学シミュレータ';
  for(const k of Object.keys(S)) if(!['P','C','pointer'].includes(k)) delete S[k];
  S.t=0;
  buildControls(sim);
  if(sim.init) sim.init(S);
  updateReadout();
}
function route(){ select(location.hash.slice(1)); }
function pos(e){ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]; }
cv.addEventListener('pointerdown',e=>{[S.pointer.x,S.pointer.y]=pos(e); S.pointer.down=true; cv.setPointerCapture(e.pointerId); cur.onPointer&&cur.onPointer(S,'down'); updateReadout();});
cv.addEventListener('pointermove',e=>{[S.pointer.x,S.pointer.y]=pos(e); if(S.pointer.down&&cur.onPointer){cur.onPointer(S,'move'); updateReadout();}});
cv.addEventListener('pointerup',()=>{S.pointer.down=false; cur.onPointer&&cur.onPointer(S,'up');});
let last=performance.now(), roTimer=0;
function frame(now){
  const dt=Math.min((now-last)/1000,0.05); last=now; S.t+=dt;
  if(cur.step){ cur.step(S,dt); roTimer+=dt; if(roTimer>0.25&&cur.liveReadout){roTimer=0; updateReadout();} }
  g.save(); g.fillStyle=S.C.paper; g.fillRect(0,0,W,H); cur.draw(g,S); g.restore();
  requestAnimationFrame(frame);
}
function boot(){
  readColors(); buildNav(); resize(); route();
  window.addEventListener('hashchange',route);
  window.addEventListener('resize',resize);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readColors);
  new MutationObserver(readColors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  document.fonts&&document.fonts.ready.then(()=>{});
  requestAnimationFrame(frame);
}
