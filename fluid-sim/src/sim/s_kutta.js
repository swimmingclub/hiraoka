// 上級：クッタ・ジューコフスキーの定理（ジューコフスキー翼とクッタ条件）
const Cx={ add:(a,b)=>[a[0]+b[0],a[1]+b[1]], sub:(a,b)=>[a[0]-b[0],a[1]-b[1]], mul:(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],
  div:(a,b)=>{const d=b[0]*b[0]+b[1]*b[1]; return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];}, abs:a=>Math.hypot(a[0],a[1]),
  exp:t=>[Math.cos(t),Math.sin(t)], sqrt:a=>{const r=Math.sqrt(Cx.abs(a)), t=Math.atan2(a[1],a[0])/2; return [r*Math.cos(t),r*Math.sin(t)];} };
defineSim({
  id:'kutta', level:'advanced', order:2, name:'クッタ・ジューコフスキーの定理（翼の揚力）',
  formula:'$$L^{\\prime} = \\rho U \\Gamma \\qquad \\text{クッタ条件：}\\ \\Gamma = 4\\pi R U \\sin(\\alpha + \\beta) \\qquad C_L \\approx 2\\pi \\sin(\\alpha + \\beta)$$',
  explain:'**円柱まわりの流れを写像 $z = \\zeta + \\dfrac{c^2}{\\zeta}$（__ジューコフスキー変換__）で変形すると翼型まわりの流れが得られます**。循環 Γ の大きさは「流れが鋭い後縁からなめらかに離れる」という条件（クッタ条件）で 1 つに決まり、揚力は $L^{\\prime} = \\rho U \\Gamma$ です。迎え角 α を大きくするほど、またキャンバー（反り）をつけるほど揚力が増えます。',
  hint:'「クッタ条件」をオフにして Γ = 0 にすると、流れが後縁を回り込む不自然な流れになり、揚力は 0 です。オンに戻すと後縁から流れがなめらかに離れ、揚力が生まれます。反りのある翼は迎え角 0° でも揚力が出ます。',
  related:['A2'],
  params:[
    {id:'al',label:'迎え角 $\\alpha$',min:-10,max:15,step:0.5,value:5,unit:'°'},
    {id:'dl',label:'反り（キャンバー）$\\delta$',min:0,max:0.15,step:0.01,value:0.06,digits:2},
    {id:'ep',label:'厚み $\\varepsilon$',min:0.02,max:0.2,step:0.01,value:0.1,digits:2},
    {id:'U',label:'流速 $U$',min:10,max:80,step:1,value:40,unit:'m/s'},
    {id:'kc',label:'クッタ条件を満たす循環にする',type:'check',value:true},
    {id:'Gm',label:'手動の循環（クッタ条件オフのとき）',min:-2,max:4,step:0.05,value:0,digits:2},
  ],
  geom(S){ const mu=[-S.P.ep,S.P.dl], R=Cx.abs(Cx.sub([1,0],mu)), beta=Math.asin(S.P.dl/R), al=S.P.al*Math.PI/180;
    const G=S.P.kc?4*Math.PI*R*Math.sin(al+beta):S.P.Gm*Math.PI;
    const le=Cx.add(Cx.sub(mu,[R,0]),Cx.div([1,0],Cx.sub(mu,[R,0]))), chord=2-le[0];
    return {mu,R,beta,al,G,chord}; },
  vel(S){ const q=this.geom(S), ea=Cx.exp(-q.al), eb=Cx.exp(q.al), R2=q.R*q.R;
    return (x,y)=>{ const z=[x,y], s=Cx.sqrt(Cx.sub(Cx.mul(z,z),[4,0]));
      let z1=Cx.mul([0.5,0],Cx.add(z,s)), z2=Cx.mul([0.5,0],Cx.sub(z,s));
      const d1=Cx.abs(Cx.sub(z1,q.mu)), d2=Cx.abs(Cx.sub(z2,q.mu)); const zeta=d1>=d2?z1:z2;
      if(Math.max(d1,d2)<=q.R*1.0005) return null;
      const w=Cx.sub(zeta,q.mu);
      let dW=Cx.sub(ea, Cx.div(Cx.mul([R2,0],eb),Cx.mul(w,w)));
      dW=Cx.add(dW, Cx.div([0,q.G/(2*Math.PI)],w));
      const dz=Cx.sub([1,0],Cx.div([1,0],Cx.mul(zeta,zeta)));
      if(Cx.abs(dz)<1e-3) return [0,0];
      const c=Cx.div(dW,dz); return [c[0],-c[1]]; }; },
  view:{cx:470,cy:300,s:150},
  init(S){ S.cache={}; S.lk=''; S.parts=Array.from({length:260},()=>this.spawn(true)); },
  spawn(any){ return {x:any?-3+Math.random()*6:-3.1, y:(Math.random()*2-1)*1.9}; },
  step(S,dt){ FT.advect(S.parts,this.view,this.vel(S),1,dt,()=>this.spawn(false),1.2); },
  draw(g,S){
    const C=S.C, v=this.view, q=this.geom(S), vel=this.vel(S);
    const key=[S.P.al,S.P.dl,S.P.ep,q.G.toFixed(3)].join();
    FT.heat(g,S.cache,key,v,vel,1,{lo:-3,hi:1});
    if(S.lk!==key){ S.lk=key; S.lines=[]; for(let i=-12;i<=12;i++) S.lines.push(FT.trace(v,vel,-3.2,i*0.16+0.02,0.02,900)); }
    for(const L of S.lines) line(g,L,C.ink,1);
    FT.drawParts(g,S.parts,v,C.water_deep);
    // 翼型
    g.fillStyle=C.solid; g.strokeStyle=C.ink; g.lineWidth=2; g.beginPath();
    for(let i=0;i<=200;i++){ const t=2*Math.PI*i/200, zeta=Cx.add(q.mu,Cx.mul([q.R,0],Cx.exp(t))), z=Cx.add(zeta,Cx.div([1,0],zeta)), [X,Y]=FT.toS(v,z[0],z[1]); i?g.lineTo(X,Y):g.moveTo(X,Y); }
    g.closePath(); g.fill(); g.stroke();
    // 流入方向
    const a=q.al; arrow(g,40,80,40+80*Math.cos(a),80-80*Math.sin(a),C.ink,3,10); text(g,'U = '+S.P.U+' m/s, α = '+S.P.al+'°',40,50,{size:14,weight:700});
    // 揚力
    const Lu=1/q.chord, Gr=q.G*S.P.U*Lu, L=1.2*S.P.U*Gr, CL=2*q.G/q.chord;
    if(Math.abs(CL)>0.01){ const len=clamp(Math.abs(CL)*90,15,170)*Math.sign(CL); arrow(g,v.cx,v.cy-30,v.cx,v.cy-30-len,C.hi,5,16);
      text(g,'揚力 L′ = '+fmt(L)+' N/m',v.cx+14,v.cy-40-len/2,{size:15,weight:700,color:C.hi,bg:C.paper}); }
    // 後縁の様子
    const te=FT.toS(v,2,0);
    text(g,S.P.kc?'後縁から流れがなめらかに離れる（クッタ条件）':'後縁で流れが回り込む（実際には起こらない）',te[0]-40,te[1]+70,{align:'center',size:13,weight:700,color:S.P.kc?C.b:C.a,bg:C.paper});
    FT.legend(g,S,20,555);
  },
  readout(S){ const q=this.geom(S), Lu=1/q.chord, Gr=q.G*S.P.U*Lu, CL=2*q.G/q.chord;
    return [['翼弦長 $c$（1 m として換算）','1 m'],['ゼロ揚力角 $-\\beta$',fmt(-q.beta*180/Math.PI)+'°'],['循環 $\\Gamma$',fmt(Gr)+' m²/s'],
      ['揚力係数 $C_L$',fmt(CL)],['揚力 $L^{\\prime} = \\rho U \\Gamma$（空気）',fmt(1.2*S.P.U*Gr)+' N/m'],['薄翼理論 $2\\pi(\\alpha + \\beta)$',fmt(2*Math.PI*(q.al+q.beta))]]; }
});
