// 上級：円柱まわりのポテンシャル流（循環つき）、ダランベールのパラドックスとマグヌス効果
defineSim({
  id:'cylinder', level:'advanced', order:1, name:'円柱まわりの流れと循環（ダランベール・マグヌス）',
  formula:'W(z) = U(z + a²/z) + iΓ/(2π)·log z　　u_θ = −2U sinθ − Γ/(2πa)　　C_p = 1 − (u_θ/U)²',
  explain:'一様流（速さ U）の中に半径 a の円柱を置いたポテンシャル流です。循環 Γ = 0 では圧力分布が前後・上下とも対称なので、抗力も揚力も 0 です（ダランベールのパラドックス）。円柱を回転させて時計回りの循環 Γ を与えると、上側が速く（圧力が低く）なり、揚力 L′ = ρUΓ が生じます（クッタ・ジューコフスキーの定理、マグヌス効果）。',
  hint:'Γ を 0 から少しずつ増やすと、よどみ点（白丸）が下へ移動します。Γ = 4πaU を超えると、よどみ点は円柱から離れて流れの中に浮かびます。右下の C_p グラフが前後対称なら抗力 0 です。',
  related:['A1','A2'],
  params:[
    {id:'U',label:'一様流の速さ U',min:1,max:30,step:0.5,value:10,unit:'m/s'},
    {id:'a',label:'円柱の半径 a',min:0.1,max:1,step:0.05,value:0.5,unit:'m'},
    {id:'G',label:'循環 Γ（時計回り正）',min:-100,max:100,step:1,value:0,unit:'m²/s'},
    {id:'lines',label:'流線を表示',type:'check',value:true},
    {id:'heat',label:'圧力の色地図を表示',type:'check',value:true},
  ],
  buttons:[{label:'A2 の条件（Γ = 20）',action:S=>{setParam('U',10);setParam('a',0.5);setParam('G',20);}}],
  // 計算は無次元（長さ a、速度 U 単位）で行う
  vel(S){ const g=S.P.G/(2*Math.PI*S.P.a*S.P.U); // Γ/(2πaU)
    return (x,y)=>{ const r2=x*x+y*y; if(r2<1) return null;
      // dW/dz = 1 − 1/z² + i g / z  （u − iv）
      const zr=x/r2, zi=-y/r2;             // 1/z
      const z2r=zr*zr-zi*zi, z2i=2*zr*zi;  // 1/z²
      const wr=1-z2r + (-g*zi), wi=-z2i + g*zr;
      return [wr,-wi]; }; },
  view:{cx:430,cy:300,s:80},
  init(S){ S.cache={}; S.lineKey=''; S.parts=Array.from({length:240},()=>this.spawn(true)); },
  spawn(any){ return {x:any?-5.4+Math.random()*10.8:-5.4, y:(Math.random()*2-1)*3.6}; },
  step(S,dt){ FT.advect(S.parts,this.view,this.vel(S),1,dt,()=>this.spawn(false),1.6); },
  draw(g,S){
    const C=S.C, v=this.view, vel=this.vel(S), key=S.P.G/(S.P.a*S.P.U);
    if(S.P.heat) FT.heat(g,S.cache,key.toFixed(4),v,vel,1,{lo:-3,hi:1});
    if(S.P.lines){ if(S.lineKey!==key.toFixed(4)){ S.lineKey=key.toFixed(4); S.lines=[];
        for(let i=-14;i<=14;i++){ S.lines.push(FT.trace(v,vel,-5.6,i*0.26)); } }
      for(const L of S.lines) line(g,L,C.ink,1,null); }
    FT.drawParts(g,S.parts,v,C.water_deep);
    // 円柱
    g.fillStyle=C.solid; g.beginPath(); g.arc(v.cx,v.cy,v.s,0,7); g.fill(); g.strokeStyle=C.ink; g.lineWidth=2; g.stroke();
    // 回転の表示
    if(Math.abs(S.P.G)>0.5){ const dir=S.P.G>0?1:-1; g.save(); g.strokeStyle=C.paper; g.lineWidth=3; g.beginPath(); g.arc(v.cx,v.cy,v.s*0.6,-2.4,0.8); g.stroke();
      const a2=dir>0?0.8:-2.4, px=v.cx+Math.cos(a2)*v.s*0.6, py=v.cy+Math.sin(a2)*v.s*0.6; g.fillStyle=C.paper; g.beginPath(); g.arc(px,py,6,0,7); g.fill(); g.restore(); }
    // よどみ点
    const k=S.P.G/(4*Math.PI*S.P.a*S.P.U);
    const st=[]; if(Math.abs(k)<=1){ const th=Math.asin(-k); st.push(th, Math.PI-th); }
    else { const yy=-Math.sign(k)*(Math.abs(k)+Math.sqrt(k*k-1)); st.push(null); S.offStag=yy; }
    g.fillStyle=C.paper; g.strokeStyle=C.ink; g.lineWidth=2;
    for(const th of st){ let X,Y; if(th===null){ X=v.cx; Y=v.cy-S.offStag*v.s; } else { X=v.cx+Math.cos(th)*v.s; Y=v.cy-Math.sin(th)*v.s; }
      g.beginPath(); g.arc(X,Y,7,0,7); g.fill(); g.stroke(); }
    // 揚力
    const L=1.2*S.P.U*S.P.G;
    if(Math.abs(L)>1){ const len=clamp(Math.abs(L)/4,20,150)*Math.sign(L); arrow(g,v.cx,v.cy-v.s-6,v.cx,v.cy-v.s-6-len,C.hi,5,16);
      text(g,'揚力 L′ = '+fmt(L)+' N/m',v.cx+14,v.cy-v.s-30,{size:15,weight:700,color:C.hi,bg:C.paper}); }
    else text(g,'揚力 0・抗力 0',v.cx,v.cy-v.s-24,{align:'center',size:15,weight:700,color:C.hi,bg:C.paper});
    arrow(g,30,60,110,60,C.ink,3,10); text(g,'U = '+fmt(S.P.U)+' m/s',30,38,{size:14,weight:700});
    // 表面の Cp グラフ
    const gx=700, gy=400, gw=240, gh=170; rect(g,gx,gy,gw,gh,C.paper,C.line,1);
    const g2=S.P.G/(2*Math.PI*S.P.a*S.P.U), cpmin=1-(2+Math.abs(g2))**2, Y=cp=>gy+10+(1-cp)/(1-cpmin)*(gh-20);
    line(g,[[gx,Y(0)],[gx+gw,Y(0)]],C.line,1);
    const pts=[]; for(let i=0;i<=72;i++){ const th=Math.PI*2*i/72, ut=-2*Math.sin(th)-g2; pts.push([gx+i/72*gw,Y(1-ut*ut)]); } line(g,pts,C.accent,2);
    text(g,'表面の C_p（θ = 0 → 360°）',gx+6,gy-12,{size:12,color:C.muted});
    text(g,'0°',gx,gy+gh+12,{size:11,mono:true,color:C.muted}); text(g,'180°',gx+gw/2,gy+gh+12,{align:'center',size:11,mono:true,color:C.muted}); text(g,'360°',gx+gw,gy+gh+12,{align:'right',size:11,mono:true,color:C.muted});
    if(S.P.heat) FT.legend(g,S,20,555);
  },
  readout(S){ const U=S.P.U,a=S.P.a,G=S.P.G, k=G/(4*Math.PI*a*U);
    const st=Math.abs(k)<=1?fmt(Math.asin(-k)*180/Math.PI)+'°, '+fmt(180-Math.asin(-k)*180/Math.PI)+'°':'円柱から離れる';
    return [['表面の最大流速',fmt(Math.max(Math.abs(2*U+G/(2*Math.PI*a)),Math.abs(-2*U+G/(2*Math.PI*a))))+' m/s'],
      ['Γ=0 での θ=90° の p − p∞',fmt(0.5*1.2*U*U*(-3))+' Pa'],['よどみ点 θ_s',st],['Γ/(4πaU)',fmt(k)],
      ['揚力 L′ = ρUΓ（空気 ρ = 1.2）',fmt(1.2*U*G)+' N/m'],['抗力（ポテンシャル流）','0 N/m']]; }
});
