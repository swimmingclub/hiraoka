// 中級：運動量の法則（噴流が板に及ぼす力）
defineSim({
  id:'momentum', level:'intermediate', order:1, name:'運動量の法則（噴流と板）',
  formula:'$$F = \\rho Q_{\\text{rel}}\\,(v - u)(1 - \\cos\\beta) \\qquad Q_{\\text{rel}} = A\\,(v - u)$$',
  explain:'**検査体積（点線の枠）に入る運動量と出る運動量の差が、板が流体に及ぼす力です**。その反作用が板が受ける力 F です。噴流を β だけ曲げると、噴流方向の速度は (v−u) から (v−u)cos β に変わります。板が動いているときは、板から見た__相対速度__ v − u で考えます。',
  hint:'曲げ角 β を 90°（平板）から 180°（お椀形のバケット）にすると、力は 2 倍になります。ペルトン水車がバケットを使うのはこのためです。==板を噴流と同じ速さで動かすと、力はどうなるでしょう？==',
  related:['M1'],
  params:[
    {id:'d',label:'噴流の直径 $d$',min:1,max:10,step:0.5,value:5,unit:'cm'},
    {id:'v',label:'噴流の速度 $v$',min:2,max:40,step:0.5,value:20,unit:'m/s'},
    {id:'u',label:'板の速度 $u$（噴流と同じ向き）',min:0,max:20,step:0.5,value:0,unit:'m/s'},
    {id:'beta',label:'噴流を曲げる角度 $\\beta$',min:30,max:180,step:5,value:90,unit:'°'},
  ],
  calc(S){ const A=Math.PI/4*(S.P.d/100)**2, vr=Math.max(S.P.v-S.P.u,0), b=S.P.beta*Math.PI/180;
    const Q=A*vr, F=1000*Q*vr*(1-Math.cos(b)); return {A,vr,Q,F,b,P:F*S.P.u}; },
  init(S){ S.parts=[]; S.acc=0; S.wheel=0; },
  step(S,dt){ const r=this.calc(S), k=12; // 1 m/s = 12 px/s（板と一緒に動く座標）
    S.acc+=dt*r.vr*6; while(S.acc>1){ S.acc-=1; const y=Math.random()*2-1; S.parts.push({x:80,y,s:0,side:y<0?1:-1}); }
    const xp=560;
    for(const p of S.parts){
      if(p.s===0){ p.x+=r.vr*k*dt; if(p.x>=xp-90){p.s=1;} }
      else { p.s+=r.vr*k*dt; }
    }
    S.parts=S.parts.filter(p=>p.s<320);
    S.wheel+=S.P.u*dt*2;
  },
  draw(g,S){
    const C=S.C, r=this.calc(S), cy=300, xp=560, jr=Math.max(S.P.d*5,5);
    // ノズル
    g.fillStyle=C.solid; g.beginPath(); g.moveTo(20,cy-jr-30); g.lineTo(80,cy-jr); g.lineTo(80,cy+jr); g.lineTo(20,cy+jr+30); g.closePath(); g.fill();
    // 板（ベーン）: 曲げ角 β に応じた曲面
    const b=r.b, R=90, xs=xp-R;
    g.save(); g.strokeStyle=C.ink; g.lineWidth=8; g.lineCap='round'; g.beginPath();
    for(const sgn of [1,-1]){ // 中心から上下に曲がる面（流れの外側に 6px ずらす）
      for(let i=0;i<=24;i++){ const a=b*i/24; const pt=this.path(xp,cy,R,a,sgn); const X=pt[0], Y=pt[1]; i?g.lineTo(X,Y):g.moveTo(X,Y); } }
    g.stroke(); g.restore();
    // 台車
    rect(g,xp+20,cy-120,80,240,C.solid,C.ink,1.5);
    for(const yy of [cy-120,cy+120]){ g.save(); g.translate(xp+60,yy+ (yy<cy?-14:14)); g.rotate(S.wheel); g.strokeStyle=C.ink; g.lineWidth=2; g.beginPath(); g.arc(0,0,12,0,7); g.moveTo(-12,0); g.lineTo(12,0); g.stroke(); g.restore(); }
    // 粒子
    g.fillStyle=C.water_deep;
    for(const p of S.parts){ let x,y;
      if(p.s===0){ x=p.x; y=cy+p.y*jr; }
      else { const a=Math.min(p.s/R,b), base=this.path(xp,cy,R,a,p.side), ex=Math.max(0,p.s-R*b);
        const off=4+Math.abs(p.y)*jr*0.6; // 面から内側へ（噴流の厚み）
        x=base[0]+Math.cos(b)*ex-off*Math.sin(a); y=base[1]-p.side*Math.sin(b)*ex-p.side*off*Math.cos(a); }
      g.beginPath(); g.arc(x,y,3,0,7); g.fill(); }
    // 検査体積
    g.save(); g.strokeStyle=C.muted; g.setLineDash([6,5]); g.lineWidth=1.5; g.strokeRect(300,cy-230,310,460); g.restore();
    text(g,'検査体積',305,cy-242,{size:13,color:C.muted});
    // 力の矢印
    const L=clamp(r.F/8,10,260);
    arrow(g,xp+130,cy,xp+130+L,cy,C.hi,6,18);
    text(g,'F = '+fmt(r.F)+' N',xp+130,cy-28,{size:17,weight:700,color:C.hi});
    arrow(g,110,cy-jr-50,110+r.vr*5,cy-jr-50,C.accent,3,10);
    text(g,'相対速度 v − u = '+fmt(r.vr)+' m/s',110,cy-jr-72,{size:14,weight:700,color:C.accent});
    text(g,'β = '+S.P.beta+'°',xp-60,cy+jr+40,{align:'right',size:14,color:C.ink});
    text(g,'板と一緒に動く座標で見た流れ',480,575,{align:'center',size:13,color:C.muted});
  },
  // 曲面（円弧）上の点：始点 (xp−R, cy) で +x 向き、角度 a だけ向きを変えた位置。sgn=1 で上へ曲がる
  path(xp,cy,R,a,sgn){ return [xp-R+R*Math.sin(a), cy-sgn*R*(1-Math.cos(a))]; },
  readout(S){ const r=this.calc(S); return [
    ['噴流の断面積 $A$',fmt(r.A*1e4)+' cm²'],['板に当たる流量 $Q = A(v-u)$',fmt(r.Q*1000)+' L/s'],
    ['出口の噴流方向速度 $(v-u)\\cos\\beta$',fmt(r.vr*Math.cos(r.b))+' m/s'],['板が受ける力 $F$',fmt(r.F)+' N'],['板がされる仕事率 $Fu$',fmt(r.P)+' W']]; }
});
