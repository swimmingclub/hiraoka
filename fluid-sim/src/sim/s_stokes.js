// 中級：ストークスの抵抗法則と終端速度
defineSim({
  id:'stokes', level:'intermediate', order:6, name:'ストークスの抵抗と終端速度',
  formula:'$$D = 3\\pi\\mu d v \\qquad v_t = \\frac{(\\rho_s - \\rho)\\, g\\, d^2}{18\\mu} \\qquad \\left(Re = \\frac{\\rho v d}{\\mu} < 1\\ \\text{で有効}\\right)$$',
  explain:'とても遅い流れ（Re ≪ 1）では、球の抵抗は速度に比例します。落とした粒子は加速しますが、速くなるほど抵抗が増え、重力 − 浮力 = 抵抗 となったところで一定の速度（終端速度）になります。速度は $v(t) = v_t\\left(1 - e^{-t/\\tau}\\right)$ と指数関数的に近づき、$\\tau = \\dfrac{m}{3\\pi\\mu d}$ です。',
  hint:'粒径を 10 倍にすると終端速度は 100 倍になります。粒径を大きくしすぎると Re が 1 を超え、ストークスの法則が使えなくなります（右上に警告が出ます）。',
  related:['M6'],
  params:[
    {id:'d',label:'粒子の直径 $d$',min:0.01,max:1,step:0.01,value:0.1,unit:'mm'},
    {id:'rs',label:'粒子の密度 $\\rho_s$',min:1100,max:8000,step:50,value:2650,unit:'kg/m³'},
    {id:'fl',label:'流体',type:'select',value:'0.001,1000',options:[['0.001,1000','水 (μ = 0.001, ρ = 1000)'],['1,1260','グリセリン (μ = 1.0, ρ = 1260)'],['0.1,900','油 (μ = 0.1, ρ = 900)'],['0.0000181,1.2','空気 (μ = 1.81×10⁻⁵, ρ = 1.2)']]},
  ],
  buttons:[{label:'もう一度落とす',action:S=>{S.tt=0;}}],
  liveReadout:true,
  calc(S){ const [mu,rho]=S.P.fl.split(',').map(Number), d=S.P.d/1000, rs=S.P.rs;
    const vt=(rs-rho)*9.81*d*d/(18*mu), m=rs*Math.PI/6*d**3, tau=m/(3*Math.PI*mu*d), Re=rho*vt*d/mu;
    return {mu,rho,d,rs,vt,m,tau,Re,W:m*9.81,B:rho*Math.PI/6*d**3*9.81}; },
  init(S){ S.tt=0; },
  step(S,dt){ S.tt+=dt; if(S.tt>7) S.tt=0; },
  draw(g,S){
    const C=S.C, r=this.calc(S), T=S.tt/1.2; // 1.2 秒 = τ
    const v=r.vt*(1-Math.exp(-T)), dist=T-(1-Math.exp(-T)); // 位置（v_t·τ 単位）
    // 左：液柱
    const cx=150, top=60, bot=560;
    g.save(); g.fillStyle=C.water; g.globalAlpha=.25; g.fillRect(cx-70,top,140,bot-top); g.restore();
    line(g,[[cx-70,top],[cx-70,bot],[cx+70,bot],[cx+70,top]],C.ink,2);
    const y=top+20+clamp(dist*70,0,bot-top-40);
    g.fillStyle=C.wood; g.beginPath(); g.arc(cx,y,14,0,7); g.fill(); g.strokeStyle=C.ink; g.lineWidth=1.5; g.stroke();
    const fs=60/r.W;
    arrow(g,cx-34,y,cx-34,y+r.W*fs,C.ink,3,10); text(g,'重力',cx-40,y+r.W*fs,{align:'right',size:12});
    arrow(g,cx+34,y,cx+34,y-r.B*fs,C.accent,3,10); text(g,'浮力',cx+40,y-r.B*fs,{size:12,color:C.accent});
    const D=3*Math.PI*r.mu*r.d*v; if(D*fs>2){ arrow(g,cx,y-16,cx,y-16-D*fs,C.hi,3,10); text(g,'抵抗',cx+6,y-26-D*fs,{size:12,color:C.hi}); }
    text(g,'（粒子は拡大表示）',cx,bot+20,{align:'center',size:12,color:C.muted});
    // 右：v-t グラフ
    const gx=330, gy=80, gw=580, gh=380;
    rect(g,gx,gy,gw,gh,null,C.line,1);
    for(let i=0;i<=5;i++){ const x=gx+i/5*gw; line(g,[[x,gy+gh],[x,gy+gh+6]],C.muted,1); text(g,i+'τ',x,gy+gh+20,{align:'center',size:12,mono:true,color:C.muted}); }
    text(g,'時間 t（τ = '+fmt(r.tau*1000)+' ms）',gx+gw,gy+gh+44,{align:'right',size:13,color:C.muted});
    const Yv=vv=>gy+gh-vv/r.vt*gh*0.8;
    line(g,[[gx,Yv(r.vt)],[gx+gw,Yv(r.vt)]],C.hi,1.5,[6,4]);
    text(g,'終端速度 v_t = '+fmt(r.vt*1000)+' mm/s',gx+gw-8,Yv(r.vt)-14,{align:'right',size:14,weight:700,color:C.hi});
    const pts=[]; for(let i=0;i<=100;i++){ const t=5*i/100; pts.push([gx+t/5*gw,Yv(r.vt*(1-Math.exp(-t)))]); } line(g,pts,C.muted,1.2,[3,3]);
    const pts2=[]; for(let i=0;i<=100;i++){ const t=Math.min(T,5)*i/100; pts2.push([gx+t/5*gw,Yv(r.vt*(1-Math.exp(-t)))]); } line(g,pts2,C.accent,3);
    text(g,'速度 v',gx+6,gy+14,{size:13,color:C.muted});
    // Re チェック
    const ok=r.Re<1;
    text(g,'Re = '+fmt(r.Re)+(ok?'（< 1：ストークスの法則が使える）':'（> 1：ストークスの法則の適用範囲外）'),gx,gy-34,{size:14,weight:700,color:ok?C.b:C.a});
  },
  readout(S){ const r=this.calc(S); return [
    ['終端速度 $v_t$',fmt(r.vt*1000)+' mm/s'],['レイノルズ数 $Re$',fmt(r.Re)],['時定数 $\\tau = m/(3\\pi\\mu d)$',fmt(r.tau*1000)+' ms'],
    ['重力 − 浮力',fmt(r.W-r.B)+' N'],['終端での抵抗 $3\\pi\\mu d v_t$',fmt(3*Math.PI*r.mu*r.d*r.vt)+' N']]; }
});
