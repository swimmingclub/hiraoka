// 中級：ニュートンの粘性法則とクエット流れ（圧力勾配つき＝NS 方程式の厳密解）
defineSim({
  id:'couette', level:'intermediate', order:4, name:'粘性法則とクエット・ポアズイユ流れ',
  formula:'$$\\tau = \\mu \\frac{du}{dy} \\qquad u(y) = U\\frac{y}{h} + \\frac{1}{2\\mu}\\left(-\\frac{dp}{dx}\\right) y\\,(h - y)$$',
  explain:'**平行な 2 枚の板の間の流れは、ナビエ・ストークス方程式が $0 = -\\frac{dp}{dx} + \\mu \\frac{d^2u}{dy^2}$ に簡単化され、手で解けます**。上板を速度 U で動かすだけなら直線分布（クエット流れ）、圧力勾配だけなら放物線分布（平面ポアズイユ流れ）、両方あればその足し算になります。壁のせん断応力は $\\tau = \\mu\\, du/dy$（分布の傾き）です。',
  hint:'「M4 の条件」と「A5 の条件」のボタンで問題の設定にできます。圧力勾配を負（流れと逆向き）にすると、下の方で逆流が起こります。軸受けの潤滑で見られる現象です。',
  related:['M4','A5'],
  params:[
    {id:'U',label:'上板の速度 $U$',min:0,max:2,step:0.05,value:1,unit:'m/s'},
    {id:'h',label:'すき間 $h$',min:0.5,max:5,step:0.1,value:2,unit:'mm'},
    {id:'G',label:'圧力勾配 $-dp/dx$',min:-100000,max:100000,step:500,value:0,unit:'Pa/m',digits:0},
    {id:'mu',label:'粘性係数 μ',type:'select',value:'0.05',options:[['0.001','水 (0.001 Pa·s)'],['0.05','軽油・潤滑油 (0.05 Pa·s)'],['0.1','油 (0.1 Pa·s)'],['1','グリセリン (1.0 Pa·s)']]},
    {id:'A',label:'上板の面積 $A$',min:0.1,max:2,step:0.1,value:0.5,unit:'m²'},
  ],
  buttons:[
    {label:'M4 の条件',action:S=>{setParam('U',1);setParam('h',2);setParam('G',0);setSel('mu','0.05');setParam('A',0.5);}},
    {label:'A5 の条件',action:S=>{setParam('U',0);setParam('h',1);setParam('G',1000);setSel('mu','0.001');}},
  ],
  calc(S){ const U=S.P.U, h=S.P.h/1000, G=S.P.G, mu=+S.P.mu;
    const u=y=>U*y/h + G/(2*mu)*y*(h-y);
    const dudy=y=>U/h + G/(2*mu)*(h-2*y);
    const tauB=mu*dudy(0), tauT=mu*dudy(h), q=U*h/2+G*h**3/(12*mu);
    let umax=-1e9, umin=1e9; for(let i=0;i<=100;i++){const v=u(h*i/100); umax=Math.max(umax,v); umin=Math.min(umin,v);}
    return {U,h,G,mu,u,dudy,tauB,tauT,q,umax,umin,F:tauT*S.P.A}; },
  init(S){ S.parts=Array.from({length:180},()=>({x:Math.random()*700,y:Math.random()})); S.plate=0; },
  scale(r){ return 220/Math.max(Math.abs(r.umax),Math.abs(r.umin),1e-6); },
  step(S,dt){ const r=this.calc(S), k=this.scale(r)*0.9;
    for(const p of S.parts){ p.x+=r.u(p.y*r.h)*k*dt; if(p.x>700)p.x-=700; if(p.x<0)p.x+=700; }
    S.plate=(S.plate+r.U*k*dt)%80; },
  draw(g,S){
    const C=S.C, r=this.calc(S), y0=470, y1=140, x0=40, x1=740, Hh=y0-y1;
    g.save(); g.fillStyle=C.m; g.globalAlpha=.15; g.fillRect(x0,y1,x1-x0,Hh); g.restore();
    // 下板（固定）と上板（動く）
    rect(g,x0,y0,x1-x0,16,C.solid); text(g,'固定板',x0+8,y0+34,{size:13,color:C.muted});
    rect(g,x0,y1-16,x1-x0,16,C.solid);
    g.save(); g.strokeStyle=C.ink; g.lineWidth=1; for(let x=x0+S.plate;x<x1;x+=80){ g.beginPath(); g.moveTo(x,y1-16); g.lineTo(x+10,y1); g.stroke(); } g.restore();
    if(r.U>0){ arrow(g,x1-150,y1-34,x1-150+60,y1-34,C.ink,3,10); text(g,'U = '+fmt(r.U)+' m/s',x1-160,y1-34,{align:'right',size:14,weight:700}); }
    // 粒子
    g.fillStyle=C.water_deep; for(const p of S.parts){ g.beginPath(); g.arc(x0+p.x,y0-p.y*Hh,2.4,0,7); g.fill(); }
    // 速度分布
    const xs=790, k=this.scale(r)*0.6;
    line(g,[[xs,y1],[xs,y0]],C.muted,1.5);
    const pts=[]; for(let i=0;i<=40;i++){ const yy=r.h*i/40, u=r.u(yy), Y=y0-i/40*Hh; pts.push([xs+u*k,Y]); if(i%4===0) arrow(g,xs,Y,xs+u*k,Y,u>=0?C.accent:C.hi,1.3,7); }
    line(g,pts,C.accent,2.5);
    text(g,'速度分布 u(y)',xs,y1-30,{size:13,color:C.accent});
    // せん断応力
    text(g,'上板の τ = '+fmt(r.tauT)+' Pa',x0+8,y1+18,{size:14,weight:700,bg:C.paper});
    text(g,'下板の τ = '+fmt(r.tauB)+' Pa',x0+8,y0-18,{size:14,weight:700,bg:C.paper});
    if(r.umin<-1e-9) text(g,'逆流が起きています',(x0+x1)/2,y0-18,{align:'center',size:14,weight:700,color:C.hi,bg:C.paper});
    text(g,'h = '+fmt(S.P.h)+' mm（拡大表示）',(x0+x1)/2,560,{align:'center',size:13,color:C.muted});
  },
  readout(S){ const r=this.calc(S); return [
    ['最大流速 $u_{\\max}$',fmt(r.umax)+' m/s'],['単位幅流量 $q$',fmt(r.q)+' m²/s'],['平均流速 $q/h$',fmt(r.q/r.h)+' m/s'],
    ['上板のせん断応力 $\\tau$',fmt(r.tauT)+' Pa'],['下板のせん断応力 $\\tau_w$',fmt(r.tauB)+' Pa'],
    ['上板を動かす力 $F = \\tau A$',fmt(r.F)+' N'],['必要な動力 $FU$',fmt(r.F*r.U)+' W']]; }
});
// select を外部から変更するための補助
function setSel(id,v){ S.P[id]=v; const el=document.getElementById('p-'+cur.id+'-'+id); if(el){ el.value=v; el.dispatchEvent(new Event('change')); } }
