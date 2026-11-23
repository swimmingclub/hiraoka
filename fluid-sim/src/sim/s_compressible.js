// 上級：圧縮性流れ（音速・マッハ数・よどみ点状態）
defineSim({
  id:'compressible', level:'advanced', order:9, name:'圧縮性流れ（マッハ数とよどみ点）',
  formula:'$$a = \\sqrt{\\gamma R T} \\qquad M = \\frac{v}{a} \\qquad \\frac{T_0}{T} = 1 + \\frac{\\gamma-1}{2}M^2 \\qquad \\frac{p_0}{p} = \\left(1 + \\frac{\\gamma-1}{2}M^2\\right)^{\\frac{\\gamma}{\\gamma-1}} \\qquad \\sin\\mu = \\frac{1}{M}$$',
  explain:'**物体が出す音（圧力の波）は音速 $a$ で広がります**。$M < 1$ では波が物体の前方にも伝わりますが、$M > 1$ では物体が波を追い越し、波面が重なってマッハ円すい（衝撃波）ができます。機首のよどみ点では流れがせき止められ、温度と圧力が上がります。$M$ が大きいと __非圧縮のベルヌーイの定理__ では圧力上昇を小さく見積もってしまいます。',
  hint:'==$M = 0.3$ のとき、非圧縮の式との差は何 % でしょう？==（約 2%。これが「$M < 0.3$ なら非圧縮」の目安）。速さを音速より大きくすると、波面が円すい状に重なります。「A9 の条件」で問題の状態になります。',
  related:['A9'],
  liveReadout:false,
  params:[
    {id:'v',label:'飛行速度 $v$',min:0,max:700,step:5,value:250,unit:'m/s'},
    {id:'T',label:'気温 $T$',min:200,max:320,step:1,value:288,unit:'K'},
    {id:'p',label:'気圧 $p$',min:20,max:110,step:0.1,value:101.3,unit:'kPa'},
  ],
  buttons:[{label:'A9 の条件',action:S=>{ setParam('v',250); setParam('T',288); setParam('p',101.3); }}],
  calc(S){ const gm=1.4, R=287, a=Math.sqrt(gm*R*S.P.T), M=S.P.v/a, T0=S.P.T*(1+0.2*M*M), pr=Math.pow(1+0.2*M*M,3.5), rho=S.P.p*1000/(R*S.P.T);
    const p0=S.P.p*pr, p0i=S.P.p+0.5*rho*S.P.v**2/1000; return {a,M,T0,pr,rho,p0,p0i,err:(p0-p0i)/p0}; },
  init(S){ S.waves=[]; S.acc=0; S.x=0; },
  step(S,dt){ const r=this.calc(S), k=0.5; // 1 m/s = 0.5 px/s
    S.x+=S.P.v*k*dt; if(S.x>620){ S.x=0; S.waves=[]; }
    S.acc+=dt; if(S.acc>0.12){ S.acc=0; S.waves.push({x:S.x,t:0}); }
    for(const w of S.waves) w.t+=dt; S.waves=S.waves.filter(w=>w.t<4); },
  draw(g,S){
    const C=S.C, r=this.calc(S), k=0.5, cy=170, x0=40;
    rect(g,20,30,920,280,null,C.line,1);
    g.save(); g.beginPath(); g.rect(20,30,920,280); g.clip();
    for(const w of S.waves){ g.strokeStyle=C.lo; g.globalAlpha=Math.max(0,1-w.t/4); g.lineWidth=1.5; g.beginPath(); g.arc(x0+w.x,cy,r.a*k*w.t,0,7); g.stroke(); }
    g.globalAlpha=1;
    if(r.M>1){ const mu=Math.asin(1/r.M), L=600; g.strokeStyle=C.hi; g.lineWidth=2.5;
      g.beginPath(); g.moveTo(x0+S.x,cy); g.lineTo(x0+S.x-L*Math.cos(mu),cy-L*Math.sin(mu)); g.moveTo(x0+S.x,cy); g.lineTo(x0+S.x-L*Math.cos(mu),cy+L*Math.sin(mu)); g.stroke(); }
    // 機体
    g.fillStyle=C.ink; g.beginPath(); g.moveTo(x0+S.x+16,cy); g.lineTo(x0+S.x-24,cy-6); g.lineTo(x0+S.x-24,cy+6); g.closePath(); g.fill();
    g.restore();
    text(g,'M = '+fmt(r.M)+(r.M<1?'（亜音速：波が前にも伝わる）':(r.M>1?'（超音速：マッハ角 μ = '+fmt(Math.asin(1/r.M)*180/Math.PI)+'°）':'（音速）')),40,50,{size:16,weight:700,color:r.M>1?C.hi:C.ink,bg:C.paper});
    // p0/p のグラフ
    const gx=80, gy=350, gw=460, gh=200, Mm=2, X=M=>gx+M/Mm*gw, Y=v=>gy+gh-(v-1)/(7.9-1)*gh;
    rect(g,gx,gy,gw,gh,null,C.line,1);
    for(let m=0;m<=2;m+=0.5){ line(g,[[X(m),gy+gh],[X(m),gy+gh+5]],C.muted,1); text(g,String(m),X(m),gy+gh+16,{align:'center',size:11,mono:true,color:C.muted}); }
    for(const v of [1,3,5,7]) text(g,String(v),gx-6,Y(v),{align:'right',size:11,mono:true,color:C.muted});
    const pc=[], pi=[]; for(let i=0;i<=100;i++){ const M=Mm*i/100; pc.push([X(M),Y(Math.pow(1+0.2*M*M,3.5))]); pi.push([X(M),Y(1+0.7*M*M)]); }
    line(g,pc,C.hi,2.5); line(g,pi,C.lo,2,[6,4]);
    line(g,[[X(0.3),gy],[X(0.3),gy+gh]],C.muted,1,[3,3]); text(g,'M = 0.3',X(0.3)+4,gy+12,{size:11,color:C.muted});
    text(g,'圧縮性（等エントロピー）',X(1.25),Y(Math.pow(1+0.2*1.56,3.5))-14,{align:'center',size:12,weight:700,color:C.hi});
    text(g,'非圧縮（ベルヌーイ）',X(1.6),Y(1+0.7*2.56)+16,{align:'center',size:12,weight:700,color:C.lo});
    text(g,'p₀/p',gx-40,gy+gh/2,{size:13,weight:700,color:C.muted}); text(g,'マッハ数 M',gx+gw/2,gy+gh+34,{align:'center',size:12,color:C.muted});
    const mm=clamp(r.M,0,Mm); g.fillStyle=C.hi; g.beginPath(); g.arc(X(mm),Y(Math.pow(1+0.2*mm*mm,3.5)),6,0,7); g.fill();
    // 数値
    const tx=600; text(g,'よどみ点（機首の先端）',tx,370,{size:15,weight:700});
    text(g,'温度 T₀ = '+fmt(r.T0)+' K（+'+fmt(r.T0-S.P.T)+' K）',tx,402,{size:15});
    text(g,'圧力 p₀ = '+fmt(r.p0)+' kPa',tx,432,{size:15,weight:700,color:C.hi});
    text(g,'非圧縮の式 = '+fmt(r.p0i)+' kPa',tx,462,{size:15,color:C.lo});
    text(g,'差 '+fmt(r.err*100)+' %',tx,494,{size:16,weight:700,color:r.M>0.3?C.a:C.b});
  },
  readout(S){ const r=this.calc(S); return [
    ['音速 $a = \\sqrt{\\gamma R T}$',fmt(r.a)+' m/s'],['マッハ数 $M$',fmt(r.M)],['よどみ点温度 $T_0$',fmt(r.T0)+' K'],
    ['よどみ点圧力 $p_0$',fmt(r.p0)+' kPa'],['非圧縮での $p + \\frac{1}{2}\\rho v^2$',fmt(r.p0i)+' kPa'],['密度 $\\rho = p/RT$',fmt(r.rho)+' kg/m³']]; }
});
