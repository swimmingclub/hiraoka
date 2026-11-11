const {dur:DUR,chapters:CH}=window.VIDEO;
const EASE='cubic-bezier(0.16,1,0.3,1)';
const FX={
  up:[[{opacity:0,transform:'translateY(80px)'},{opacity:1,transform:'none'}],550],
  pop:[[{opacity:0,transform:'scale(1.7)'},{opacity:1,transform:'none'}],380],
  left:[[{opacity:0,transform:'translateX(-140px)'},{opacity:1,transform:'none'}],550],
  draw:[[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],600],
  fade:[[{opacity:0},{opacity:1}],400],
};
const anims=[];
const add=(el,kf,dur,t,ease=EASE)=>{const a=el.animate(kf,{duration:dur,delay:t*1000,fill:'both',easing:ease});a.pause();anims.push(a);};
const scenes=[...document.querySelectorAll('.scene')];
scenes.forEach((s,i)=>{
  const t=+s.dataset.t, end=i+1<scenes.length?+scenes[i+1].dataset.t+0.5:DUR;
  if(i>0){
    const from=i%2?'inset(0 0 100% 0)':'inset(100% 0 0 0)';
    add(s,[{clipPath:from},{clipPath:'inset(0 0 0 0)'}],450,t);
  }
  const g=s.querySelector('.ghost');
  if(g) add(g,[{transform:'translate(120px,60px)'},{transform:'translate(-60px,-40px)'}],(end-t)*1000,t,'linear');
});
document.querySelectorAll('[data-fx]').forEach(el=>{const [kf,d]=FX[el.dataset.fx];add(el,kf,d,+el.dataset.t);});
document.querySelectorAll('.hl').forEach(el=>{
  const cs=getComputedStyle(el), fg=cs.getPropertyValue('--fg').trim(), bg=cs.getPropertyValue('--bg').trim();
  const i=document.createElement('i');el.prepend(i);
  add(i,FX.draw[0],420,+el.dataset.t);
  add(el,[{color:fg},{color:bg}],200,+el.dataset.t+0.05,'linear');
});
const p=n=>String(n).padStart(2,'0');
window.seek=t=>{
  anims.forEach(a=>a.currentTime=t*1000);
  bar.style.transform=`scaleX(${Math.min(1,t/DUR)})`;
  cd.textContent='00:'+p(Math.max(0,Math.ceil(DUR-t)));
  tc.textContent=`00:${p(Math.floor(t))}:${p(Math.floor((t%1)*30))}`;
  ch.textContent=CH.filter(c=>c[0]<=t).pop()[1];
};
seek(0);
