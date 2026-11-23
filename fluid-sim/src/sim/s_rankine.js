// 上級：ランキン渦（強制渦と自由渦）
defineSim({
  id:'rankine', level:'advanced', order:7, name:'ランキン渦（強制渦と自由渦）',
  formula:'$$u_\\theta = \\begin{cases} \\omega r & (r \\le R) \\\\ \\dfrac{\\omega R^2}{r} & (r > R) \\end{cases} \\qquad \\frac{dp}{dr} = \\rho\\frac{u_\\theta^2}{r} \\qquad p_\\infty - p_0 = \\rho\\,\\omega^2 R^2$$',
  explain:'**中心部（半径 $R$ の内側）は剛体のように回る強制渦、外側は速さが $1/r$ で減る自由渦です**。浮かべた十字の向きに注目してください。内側の十字は流れと一緒に回転します（渦度あり）が、外側の十字は円を描いて動いても向きが変わりません（__渦なし流れ__）。圧力は遠心力とつり合うように中心ほど低くなります。',
  hint:'==外側と内側で、圧力はそれぞれどれだけ下がっているでしょう？==（どちらも $\\frac{1}{2}\\rho u_{\\max}^2$ で同じ）。「A7 の条件」で竜巻のモデルになります。!!強制渦の内側では流線をまたいでベルヌーイの定理を使えません!!。',
  related:['A7'],
  params:[
    {id:'R',label:'強制渦の半径 $R$',min:5,max:200,step:5,value:50,unit:'m'},
    {id:'um',label:'最大風速 $u_{\\max}$（$r = R$）',min:5,max:100,step:1,value:60,unit:'m/s'},
    {id:'rho',label:'流体',type:'select',value:'1.2',options:[['1.2','空気 (1.2 kg/m³)'],['1000','水 (1000 kg/m³)']]},
  ],
  buttons:[{label:'A7 の条件',action:S=>{ setParam('R',50); setParam('um',60); setSel('rho','1.2'); }}],
  u(S,r){ const R=S.P.R, w=S.P.um/R; return r<=R?w*r:w*R*R/r; },
  init(S){ S.mk=[]; for(const rr of [0.25,0.5,0.75,1.5,2.2,3]) for(let k=0;k<6;k++) S.mk.push({rr,th:k/6*Math.PI*2+rr,phi:0}); S.dust=Array.from({length:160},()=>({rr:0.05+Math.random()*3.4,th:Math.random()*6.28})); },
  step(S,dt){ const sp=0.9/(S.P.um/S.P.R); // 表示時間の縮尺（強制渦の 1 回転 ≈ 7 秒）
    for(const m of S.mk){ const r=m.rr*S.P.R, om=this.u(S,r)/r; m.th+=om*dt*sp; if(m.rr<=1) m.phi+=om*dt*sp; }
    for(const p of S.dust){ const r=p.rr*S.P.R; p.th+=this.u(S,r)/r*dt*sp; } },
  draw(g,S){
    const C=S.C, cx=260, cy=300, Kp=75; // 1R = 75 px
    // 強制渦の範囲
    g.save(); g.fillStyle=C.accent; g.globalAlpha=.1; g.beginPath(); g.arc(cx,cy,Kp,0,7); g.fill(); g.restore();
    g.strokeStyle=C.accent; g.setLineDash([5,4]); g.lineWidth=1.5; g.beginPath(); g.arc(cx,cy,Kp,0,7); g.stroke(); g.setLineDash([]);
    text(g,'強制渦',cx,cy-Kp+18,{align:'center',size:12,weight:700,color:C.accent}); text(g,'自由渦',cx,cy-2.3*Kp,{align:'center',size:12,weight:700,color:C.m});
    g.fillStyle=C.water_deep; for(const p of S.dust){ g.globalAlpha=.5; g.beginPath(); g.arc(cx+Math.cos(p.th)*p.rr*Kp,cy-Math.sin(p.th)*p.rr*Kp,1.8,0,7); g.fill(); } g.globalAlpha=1;
    for(const m of S.mk){ const x=cx+Math.cos(m.th)*m.rr*Kp, y=cy-Math.sin(m.th)*m.rr*Kp, a=m.phi, L=11;
      g.save(); g.translate(x,y); g.rotate(-a); g.strokeStyle=m.rr<=1?C.accent:C.m; g.lineWidth=3; g.beginPath(); g.moveTo(-L,0); g.lineTo(L,0); g.moveTo(0,-L); g.lineTo(0,L); g.stroke(); g.restore(); }
    // 右：速度と圧力の分布
    const gx=560, gw=370, gy1=40, gh=220, gy2=320, rmax=4*S.P.R;
    const X=r=>gx+r/rmax*gw, um=S.P.um, rho=+S.P.rho, dp=rho*um*um;
    const p=r=>{ const R=S.P.R, w=um/R; return r<=R? -dp+0.5*rho*w*w*r*r : -0.5*rho*(w*R*R/r)**2; };
    rect(g,gx,gy1,gw,gh,null,C.line,1); rect(g,gx,gy2,gw,gh,null,C.line,1);
    const pu=[], pp=[]; for(let i=0;i<=200;i++){ const r=rmax*i/200; pu.push([X(r),gy1+gh-this.u(S,r)/um*gh*0.9]); pp.push([X(r),gy2+(-p(r))/dp*gh*0.9]); }
    line(g,pu,C.accent,2.5); line(g,pp,C.lo,2.5);
    line(g,[[X(S.P.R),gy1],[X(S.P.R),gy2+gh]],C.muted,1,[4,4]); text(g,'r = R',X(S.P.R)+4,gy1+gh+14,{size:12,color:C.muted});
    text(g,'速さ u_θ（最大 '+fmt(um)+' m/s）',gx+6,gy1+14,{size:13,weight:700,color:C.accent});
    text(g,'圧力 p − p∞（中心で −'+fmt(dp/1000)+' kPa）',gx+6,gy2+gh-14,{size:13,weight:700,color:C.lo});
    for(let k=0;k<=4;k++) text(g,k+'R',X(k*S.P.R),gy2+gh+14,{align:'center',size:11,mono:true,color:C.muted});
    text(g,'十字の向き：内側は回る、外側は回らない',cx,560,{align:'center',size:13,color:C.muted});
  },
  readout(S){ const R=S.P.R, um=S.P.um, rho=+S.P.rho, w=um/R; return [
    ['角速度 $\\omega = u_{\\max}/R$',fmt(w)+' rad/s'],['循環 $\\Gamma = 2\\pi R u_{\\max}$',fmt(2*Math.PI*R*um)+' m²/s'],['$r = 4R$ の速さ',fmt(um/4)+' m/s'],
    ['外側の圧力降下 $\\frac{1}{2}\\rho u_{\\max}^2$',fmt(0.5*rho*um*um/1000)+' kPa'],['内側の圧力降下 $\\frac{1}{2}\\rho\\omega^2R^2$',fmt(0.5*rho*um*um/1000)+' kPa'],['中心の圧力降下 $\\rho u_{\\max}^2$',fmt(rho*um*um/1000)+' kPa']]; }
});
