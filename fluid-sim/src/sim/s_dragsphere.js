// 中級：球の抗力係数と高レイノルズ数の抵抗
// 球の C_D(Re)：Morrison (2013) の近似式（Re ≤ 10⁶ 程度で使える）
function cdSphere(Re){ return 24/Re + 2.6*(Re/5)/(1+Math.pow(Re/5,1.52)) + 0.411*Math.pow(Re/263000,-7.94)/(1+Math.pow(Re/263000,-8)) + 0.25*(Re/1e6)/(1+Re/1e6); }
defineSim({
  id:'dragsphere', level:'intermediate', order:9, name:'球の抗力係数と終端速度',
  formula:'$$D = \\frac{1}{2}\\rho U^2 C_D A \\qquad C_D = C_D(Re) \\qquad v_t = \\sqrt{\\frac{2 m g}{\\rho C_D A}}$$',
  explain:'**流れが速い（$Re$ が大きい）と、抵抗は速度の 2 乗に比例します**。その比例係数を無次元にしたのが抗力係数 $C_D$ です。球の $C_D$ は $Re < 1$ では $24/Re$（ストークス域）、$10^3$〜$3\\times10^5$ ではほぼ 0.4〜0.5 で一定、$3\\times10^5$ 付近で急に下がります（__抗力危機__）。境界層が乱流になってはく離が遅れ、後流が細くなるためです。',
  hint:'==流速を上げて $Re$ を $3\\times10^5$ 付近にすると、$C_D$ と後流の幅はどうなるでしょう？== ゴルフボールのディンプルは、わざと乱流にしてこの効果を低い速度で起こす工夫です。「$C_D = 0.47$ 一定」を選ぶと M9 の問題と同じ計算になります。',
  related:['M9'],
  params:[
    {id:'d',label:'球の直径 $d$',min:1,max:40,step:0.5,value:20,unit:'cm'},
    {id:'U',label:'流速 $U$',min:0.5,max:60,step:0.5,value:20,unit:'m/s'},
    {id:'fl',label:'流体',type:'select',value:'1.2,1.5e-5',options:[['1.2,1.5e-5','空気 (ρ = 1.2, ν = 1.5×10⁻⁵)'],['1000,1e-6','水 (ρ = 1000, ν = 1.0×10⁻⁶)']]},
    {id:'mode',label:'抗力係数',type:'select',value:'fix',options:[['fix','0.47 で一定（問題用）'],['curve','実験に基づく Re との関係']]},
    {id:'rs',label:'終端速度を求める球の密度 $\\rho_s$',min:100,max:8000,step:50,value:7800,unit:'kg/m³'},
    {id:'dt',label:'終端速度を求める球の直径 $d_s$',min:1,max:20,step:0.5,value:5,unit:'cm'},
  ],
  calc(S){ const [rho,nu]=S.P.fl.split(',').map(Number), d=S.P.d/100, A=Math.PI/4*d*d, Re=S.P.U*d/nu;
    const CD=S.P.mode==='fix'?0.47:cdSphere(Re), D=0.5*rho*S.P.U**2*CD*A;
    // 終端速度（C_D が Re に依存するときは反復）
    const ds=S.P.dt/100, As=Math.PI/4*ds*ds, m=S.P.rs*Math.PI/6*ds**3, Wn=(S.P.rs-rho)*Math.PI/6*ds**3*9.81;
    let vt=1; for(let i=0;i<60;i++){ const cd=S.P.mode==='fix'?0.47:cdSphere(Math.max(vt*ds/nu,1e-3)); vt=Math.sqrt(Math.max(Wn,0)*2/(rho*cd*As)); }
    return {rho,nu,d,A,Re,CD,D,vt,Ret:vt*ds/nu,m}; },
  init(S){ S.parts=Array.from({length:200},()=>({x:Math.random()*420,y:Math.random()*300-150})); },
  step(S,dt){ const r=this.calc(S), R=60; for(const p of S.parts){ // 球のまわりのポテンシャル流（表示用）＋後流
      const x=p.x-180, y=p.y, r2=x*x+y*y; let u=1-R*R*(x*x-y*y)/(r2*r2), v=-R*R*2*x*y/(r2*r2);
      const wake=this.wake(r); if(x>0&&Math.abs(y)<wake*(1+x/600)) { u*=0.25; v+=(Math.random()-.5)*2; }
      p.x+=u*dt*120; p.y+=v*dt*120; if(p.x>440||r2<R*R*0.9){ p.x=-10; p.y=Math.random()*300-150; } } },
  wake(r){ return r.Re<20?0:(r.Re<2.5e5?60:(r.Re<4e5?lerp(60,28,(r.Re-2.5e5)/1.5e5):28)); },
  draw(g,S){
    const C=S.C, r=this.calc(S), ox=40, oy=180, R=60;
    // 左：球と流れ
    g.save(); g.beginPath(); g.rect(ox,oy-150,440,300); g.clip();
    g.fillStyle=C.water_deep; for(const p of S.parts){ g.beginPath(); g.arc(ox+p.x,oy+p.y,2.1,0,7); g.fill(); }
    const wk=this.wake(r); if(wk>0){ g.fillStyle=C.hi; g.globalAlpha=.12; g.beginPath(); g.moveTo(ox+180+R*0.3,oy-wk); g.lineTo(ox+440,oy-wk*1.4); g.lineTo(ox+440,oy+wk*1.4); g.lineTo(ox+180+R*0.3,oy+wk); g.fill(); g.globalAlpha=1; }
    g.restore();
    g.fillStyle=C.solid; g.beginPath(); g.arc(ox+180,oy,R,0,7); g.fill(); g.strokeStyle=C.ink; g.lineWidth=2; g.stroke();
    rect(g,ox,oy-150,440,300,null,C.line,1);
    const L=clamp(Math.log10(r.D+1)*50,10,160); arrow(g,ox+180+R+10,oy,ox+180+R+10+L,oy,C.hi,5,14);
    text(g,'D = '+fmt(r.D)+' N',ox+180+R+14,oy-R-10,{size:16,weight:700,color:C.hi,bg:C.paper});
    if(wk>0) text(g,'後流（低圧の領域）',ox+330,oy+wk+24,{align:'center',size:12,color:C.hi});
    // 右：C_D–Re 線図
    const gx=540, gy=40, gw=390, gh=300, X=Re=>gx+(Math.log10(Re)+1)/8*gw, Y=cd=>gy+gh-(Math.log10(cd)+1.3)/(3.3)*gh;
    rect(g,gx,gy,gw,gh,null,C.line,1);
    for(let e=-1;e<=7;e++){ line(g,[[X(10**e),gy+gh],[X(10**e),gy+gh+5]],C.muted,1); text(g,'10'+sup(e),X(10**e),gy+gh+16,{align:'center',size:11,mono:true,color:C.muted}); }
    [0.1,1,10,100].forEach(v=>{ line(g,[[gx,Y(v)],[gx+gw,Y(v)]],C.line,1); text(g,String(v),gx-6,Y(v),{align:'right',size:11,mono:true,color:C.muted}); });
    g.save(); g.beginPath(); g.rect(gx,gy,gw,gh); g.clip();
    const pts=[]; for(let e=-1;e<=6.3;e+=0.03) pts.push([X(10**e),Y(cdSphere(10**e))]); line(g,pts,C.accent,2.5);
    const st=[]; for(let e=-1;e<=1.2;e+=0.05) st.push([X(10**e),Y(24/10**e)]); line(g,st,C.b,1.5,[5,4]);
    g.restore(); text(g,'24/Re（ストークス）',X(3),Y(24/3)+4,{size:12,color:C.b}); text(g,'抗力危機',X(3e5),Y(0.1)+14,{align:'center',size:12,weight:700,color:C.hi});
    text(g,'C_D',gx-30,gy+gh/2,{size:13,weight:700,color:C.muted}); text(g,'Re',gx+gw/2,gy+gh+34,{align:'center',size:12,color:C.muted});
    const px=X(clamp(r.Re,0.1,1e7)), py=Y(clamp(r.CD,0.05,100)); g.fillStyle=C.hi; g.beginPath(); g.arc(px,py,7,0,7); g.fill();
    text(g,'Re = '+fmt(r.Re)+', C_D = '+fmt(r.CD),px+(px>gx+gw*0.6?-10:10),py-16,{align:px>gx+gw*0.6?'right':'left',size:13,weight:700,color:C.hi,bg:C.paper});
    // 下：終端速度
    text(g,'直径 '+fmt(S.P.dt)+' cm・密度 '+fmt(S.P.rs)+' kg/m³ の球を落とすと…',40,410,{size:14,weight:700});
    text(g,'終端速度 v_t = '+fmt(r.vt)+' m/s　（そのときの Re = '+fmt(r.Ret)+'）',40,444,{size:17,weight:700,color:C.accent});
    text(g,S.P.rs<=r.rho?'流体より軽いので沈みません（浮く）':'重力 − 浮力 = 抗力 となる速さ',40,476,{size:13,color:C.muted});
  },
  readout(S){ const r=this.calc(S); return [
    ['レイノルズ数 $Re = Ud/\\nu$',fmt(r.Re)],['抗力係数 $C_D$',fmt(r.CD)],['投影面積 $A$',fmt(r.A*1e4)+' cm²'],['抗力 $D$',fmt(r.D)+' N'],
    ['終端速度 $v_t$',fmt(r.vt)+' m/s']]; }
});
