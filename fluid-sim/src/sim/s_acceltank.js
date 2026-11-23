// 初級：等加速度運動する容器の液面
defineSim({
  id:'acceltank', level:'beginner', order:9, name:'加速する容器の液面',
  formula:'$$\\tan\\theta = \\frac{a}{g} \\qquad p = \\rho g h \\ (h：\\text{その点の水深})$$',
  explain:'**容器と一緒に動く人から見ると、水には重力 $g$ に加えて、加速と逆向きの慣性力 $a$ が働きます**。水面はこの 2 つの合力に垂直な面になるので、加速すると後ろ側が高くなります。鉛直方向には加速していないので、底の圧力は各点の水深から $\\rho g h$ で求まります。',
  hint:'==ブレーキ（$a$ を負）にすると、水面はどちらに傾くでしょう？== 加速度を大きくしすぎると !!水がタンクからこぼれます!!。「B9 の条件」で問題の状態になります。',
  related:['B9'],
  params:[
    {id:'a',label:'加速度 $a$（前向き正）',min:-8,max:8,step:0.1,value:3,unit:'m/s²'},
    {id:'L',label:'タンクの長さ $L$',min:1,max:4,step:0.1,value:2,unit:'m'},
    {id:'h0',label:'静止時の水深 $h_0$',min:0.2,max:1.5,step:0.05,value:1,unit:'m'},
  ],
  buttons:[{label:'B9 の条件',action:S=>{ setParam('a',3); setParam('L',2); setParam('h0',1); }}],
  Ht:1.8,
  calc(S){ const t=S.P.a/9.81, dh=S.P.L/2*t; return {t,th:Math.atan(t)*180/Math.PI,back:S.P.h0+dh,front:S.P.h0-dh,spill:S.P.h0+Math.abs(dh)>this.Ht,dry:S.P.h0-Math.abs(dh)<0}; },
  init(S){ S.ts=0; S.x=0; S.v=0; },
  step(S,dt){ const r=this.calc(S); S.ts+=(r.t-S.ts)*Math.min(1,dt*3); S.v=clamp(S.v+S.P.a*dt*0.2,-3,3); if(Math.abs(S.P.a)<0.05) S.v*=0.98; S.x=(S.x+S.v*dt*60)%60; },
  draw(g,S){
    const C=S.C, r=this.calc(S), K=Math.min(150,560/S.P.L), cx=440, base=430, Lp=S.P.L*K, x0=cx-Lp/2, x1=cx+Lp/2, Ht=this.Ht*K;
    // 地面とトラック
    line(g,[[20,base+70],[W-20,base+70]],C.ink,2);
    g.save(); g.strokeStyle=C.muted; for(let x=-60+(-S.x%60);x<W;x+=60){ g.beginPath(); g.moveTo(x,base+70); g.lineTo(x+20,base+82); g.stroke(); } g.restore();
    rect(g,x0-30,base,Lp+60,30,C.solid,C.ink,1.5);
    rect(g,x1+30,base-90,110,120,C.solid,C.ink,1.5); text(g,'進行方向 →',x1+85,base-110,{align:'center',size:13,color:C.muted});
    for(const wx of [x0+20,x1-20,x1+100]){ g.fillStyle=C.ink; g.beginPath(); g.arc(wx,base+44,22,0,7); g.fill(); }
    // 水（水面は中央を軸に傾く。こぼれる分は切り取る）
    const t=S.ts, hb=S.P.h0+S.P.L/2*t, hf=S.P.h0-S.P.L/2*t;
    g.save(); g.beginPath(); g.rect(x0,base-Ht,Lp,Ht); g.clip();
    g.fillStyle=C.water; g.globalAlpha=.8; g.beginPath(); g.moveTo(x0,base); g.lineTo(x0,base-hb*K); g.lineTo(x1,base-hf*K); g.lineTo(x1,base); g.closePath(); g.fill(); g.restore();
    line(g,[[x0,base-Ht],[x0,base],[x1,base],[x1,base-Ht]],C.ink,3);
    line(g,[[x0,base-S.P.h0*K],[x1,base-S.P.h0*K]],C.muted,1,[5,5]); text(g,'静止時の水面',x0+6,base-S.P.h0*K+14,{size:12,color:C.muted});
    // 力の三角形
    const fx=x0+Lp/2, fy=base-S.P.h0*K-120, s=8;
    arrow(g,fx,fy,fx,fy+9.81*s,C.ink,3,10); text(g,'g',fx+8,fy+9.81*s-6,{size:14,weight:700});
    if(Math.abs(S.P.a)>0.05){ arrow(g,fx,fy+9.81*s,fx-S.P.a*s,fy+9.81*s,C.m,3,10); text(g,'慣性力 −a',fx-S.P.a*s/2,fy+9.81*s+18,{align:'center',size:13,weight:700,color:C.m}); }
    arrow(g,fx,fy,fx-S.P.a*s,fy+9.81*s,C.hi,2.5,10); text(g,'合力',fx-S.P.a*s-8,fy+9.81*s/2,{align:S.P.a>0?'right':'left',size:13,weight:700,color:C.hi});
    // 底の圧力分布
    for(let i=0;i<=8;i++){ const xx=x0+Lp*i/8, hh=clamp(lerp(hb,hf,i/8),0,this.Ht), p=1000*9.81*hh; arrow(g,xx,base+2,xx,base+2+p/1000*2.5,C.hi,1.3,6); }
    text(g,'底の圧力 ρgh',x0-34,base+60,{align:'right',size:12,color:C.hi});
    text(g,'θ = '+fmt(r.th)+'°',cx,40,{align:'center',size:18,weight:700,color:C.accent});
    if(r.spill) text(g,'水がこぼれます',cx,70,{align:'center',size:15,weight:700,color:C.a});
    if(r.dry) text(g,'底の一部が水面から出ます',cx,96,{align:'center',size:15,weight:700,color:C.a});
  },
  readout(S){ const r=this.calc(S); return [
    ['傾き $\\tan\\theta = a/g$',fmt(r.t)],['傾き角 $\\theta$',fmt(r.th)+'°'],['後端の水深',fmt(Math.min(r.back,this.Ht))+' m'],['前端の水深',fmt(Math.max(r.front,0))+' m'],
    ['後端の底の圧力 $\\rho g h$',fmt(1000*9.81*clamp(r.back,0,this.Ht)/1000)+' kPa']]; }
});
