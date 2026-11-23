// 上級：平板の境界層（ブラジウスの解）
// ブラジウス方程式 f''' + ½ f f'' = 0, f(0)=f'(0)=0, f''(0)=0.33206 を数値積分して f'(η) の表を作る
const BLASIUS=(()=>{ const h=0.01, N=1000, fp=[0]; let f=0, f1=0, f2=0.33206;
  for(let i=0;i<N;i++){ // RK4
    const F=(y)=>[y[1],y[2],-0.5*y[0]*y[2]];
    const y=[f,f1,f2], k1=F(y), k2=F(y.map((v,j)=>v+h/2*k1[j])), k3=F(y.map((v,j)=>v+h/2*k2[j])), k4=F(y.map((v,j)=>v+h*k3[j]));
    [f,f1,f2]=y.map((v,j)=>v+h/6*(k1[j]+2*k2[j]+2*k3[j]+k4[j])); fp.push(f1); }
  return eta=> eta>=10?1:(eta<=0?0:fp[Math.floor(eta/h)]); })();
defineSim({
  id:'boundary', level:'advanced', order:4, name:'境界層（ブラジウスの解）',
  formula:'$$\\delta \\approx \\frac{5.0\\,x}{\\sqrt{Re_x}} \\qquad \\tau_w = \\frac{0.332\\,\\rho U^2}{\\sqrt{Re_x}} \\qquad \\overline{C_f} = \\frac{1.328}{\\sqrt{Re_L}} \\qquad Re_x = \\frac{Ux}{\\nu}$$',
  explain:'**粘性のある流体が平板に沿って流れると、板の表面では速度が 0 になり、その影響は表面近くの薄い層（境界層）に限られます**。層流境界層の厚さ $\\delta$ は $\\sqrt{x}$ に比例し、下流ほど厚くなります。$Re_x$ が約 $5 \\times 10^5$ を超えると乱流境界層に遷移し、急に厚くなります。',
  hint:'縦方向は大きく拡大して描いています。流速を上げると境界層は薄くなります（$\\delta \\propto 1/\\sqrt{U}$）。速度分布の形は場所によらず相似（$\\eta = y\\sqrt{U/\\nu x}$ で重なる）なのがブラジウス解の特徴です。',
  related:['A4'],
  params:[
    {id:'U',label:'一様流の速さ $U$',min:0.5,max:30,step:0.5,value:5,unit:'m/s'},
    {id:'L',label:'板の長さ $L$',min:0.1,max:3,step:0.05,value:1,unit:'m'},
    {id:'b',label:'板の幅 $b$',min:0.1,max:2,step:0.1,value:0.5,unit:'m'},
    {id:'fl',label:'流体',type:'select',value:'1.5e-5,1.2',options:[['1.5e-5,1.2','空気 (ν = 1.5×10⁻⁵, ρ = 1.2)'],['1e-6,1000','水 (ν = 1.0×10⁻⁶, ρ = 1000)']]},
  ],
  calc(S){ const [nu,rho]=S.P.fl.split(',').map(Number), U=S.P.U, L=S.P.L, ReL=U*L/nu, xt=5e5*nu/U;
    const delta=x=>{ const Re=U*x/nu; return Re<5e5?5*x/Math.sqrt(Re):0.37*x/Math.pow(Re,0.2); };
    const Cf=ReL<5e5?1.328/Math.sqrt(ReL):(0.074/Math.pow(ReL,0.2)-1742/ReL);
    return {nu,rho,U,L,ReL,xt,delta,Cf,D:0.5*rho*U*U*Cf*L*S.P.b,dL:delta(L)}; },
  init(S){ S.parts=Array.from({length:260},()=>({x:Math.random(),y:Math.random()})); },
  geo(S,r){ const x0=90, x1=880, yb=470, sx=(x1-x0)/r.L, dmax=Math.max(r.dL,1e-6), sy=330/dmax/1.25; return {x0,x1,yb,sx,sy,ymax:330/sy}; },
  u(r,x,y){ if(x<=0) return r.U; const Re=r.U*x/r.nu;
    if(Re<5e5) return r.U*BLASIUS(y*Math.sqrt(r.U/(r.nu*x)));
    const d=r.delta(x); return y>=d?r.U:r.U*Math.pow(y/d,1/7); },
  step(S,dt){ const r=this.calc(S), G=this.geo(S,r);
    for(const p of S.parts){ const x=p.x*r.L, y=p.y*G.ymax; p.x+=this.u(r,x,y)/r.U*dt*0.25; if(p.x>1){p.x=-0.08*Math.random();p.y=Math.random();} } },
  draw(g,S){
    const C=S.C, r=this.calc(S), G=this.geo(S,r);
    // 境界層の領域
    const top=[]; for(let i=0;i<=120;i++){ const x=r.L*i/120; top.push([G.x0+x*G.sx, G.yb-Math.min(r.delta(x),G.ymax)*G.sy]); }
    g.save(); g.fillStyle=C.accent; g.globalAlpha=.12; g.beginPath(); g.moveTo(G.x0,G.yb); top.forEach(p=>g.lineTo(...p)); g.lineTo(G.x1,G.yb); g.fill(); g.restore();
    line(g,top,C.accent,2,[6,4]);
    // 粒子
    g.fillStyle=C.water_deep; for(const p of S.parts){ g.beginPath(); g.arc(G.x0+p.x*r.L*G.sx,G.yb-p.y*G.ymax*G.sy,2.2,0,7); g.fill(); }
    // 平板
    rect(g,G.x0,G.yb,G.x1-G.x0,10,C.solid,C.ink,1.5);
    // 速度分布
    for(const fx of [0.15,0.4,0.7,1.0]){ const x=r.L*fx, X=G.x0+x*G.sx, pts=[];
      for(let i=0;i<=40;i++){ const y=G.ymax*i/40, u=this.u(r,x,y); pts.push([X+u/r.U*70,G.yb-y*G.sy]); if(i%5===0) arrow(g,X,G.yb-y*G.sy,X+u/r.U*70,G.yb-y*G.sy,C.ink,1,5); }
      line(g,[[X,G.yb],[X,G.yb-G.ymax*G.sy]],C.muted,1); line(g,pts,C.ink,2); }
    // 遷移点
    if(r.xt<r.L){ const X=G.x0+r.xt*G.sx; line(g,[[X,G.yb],[X,G.yb-340]],C.hi,1.5,[4,4]); text(g,'乱流へ遷移 x = '+fmt(r.xt)+' m',X+6,G.yb-330,{size:13,weight:700,color:C.hi}); }
    text(g,'δ(L) = '+fmt(r.dL*1000)+' mm',G.x1-4,G.yb-r.dL*G.sy-18,{align:'right',size:15,weight:700,color:C.accent,bg:C.paper});
    arrow(g,20,200,70,200,C.ink,3,10); text(g,'U',20,180,{size:15,weight:700});
    text(g,'縦方向は ×'+fmt(G.sy/G.sx,2)+' に拡大',G.x0,G.yb+32,{size:13,color:C.muted});
    text(g,'x = 0（前縁）',G.x0,G.yb+52,{size:12,color:C.muted}); text(g,'x = L = '+fmt(r.L)+' m',G.x1,G.yb+52,{align:'right',size:12,color:C.muted});
  },
  readout(S){ const r=this.calc(S); return [
    ['後端のレイノルズ数 $Re_L$',fmt(r.ReL)],['状態',r.ReL<5e5?'全長で層流':'途中で乱流に遷移'],['後端の厚さ $\\delta(L)$',fmt(r.dL*1000)+' mm'],
    ['平均摩擦係数 $\\overline{C_f}$',fmt(r.Cf)],['片面の摩擦抵抗 $D = \\frac{1}{2}\\rho U^2 \\overline{C_f}\\, Lb$',fmt(r.D)+' N']]; }
});
