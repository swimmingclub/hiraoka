// 上級：次元解析（バッキンガムの π 定理）と相似則
defineSim({
  id:'dimensional', level:'advanced', order:6, name:'次元解析と相似則（模型実験）',
  formula:'$$F = f(\\rho, v, L, \\mu) \\;\\Rightarrow\\; \\frac{F}{\\rho v^2 L^2} = \\phi\\!\\left(\\frac{\\rho v L}{\\mu}\\right) \\qquad Re_{\\text{模型}} = Re_{\\text{実物}} \\;\\Rightarrow\\; \\pi_1\\ \\text{も等しい}$$',
  explain:'抵抗 $F$ が密度 $\\rho$・速度 $v$・長さ $L$・粘性係数 $\\mu$ で決まるとき、変数 5 個から基本次元 3 個（M, L, T）を引いた 2 個の無次元数で関係が書けます（π 定理）。模型と実物でレイノルズ数をそろえれば流れは力学的に相似になり、抵抗係数 $\\pi_1 = \\dfrac{F}{\\rho v^2 L^2}$ も等しくなります。模型で測った力から実物の力を予測できます。',
  hint:'模型の流体を空気のままにして「Re をそろえる」を押すと、模型の速さが非現実的な値（音速の半分近く）になります。水に変えると現実的な速さになります。Re がそろっていないと、予測は信用できません（赤い表示）。',
  related:['A6'],
  params:[
    {id:'Lp',label:'実物の長さ $L_p$',min:1,max:10,step:0.5,value:4,unit:'m'},
    {id:'vp',label:'実物の速さ $v_p$（空気中）',min:5,max:60,step:1,value:30,unit:'m/s'},
    {id:'n',label:'模型の縮尺 $1/n$',min:2,max:20,step:1,value:5,digits:0},
    {id:'fm',label:'模型実験の流体',type:'select',value:'water',options:[['water','水 (ν = 1.0×10⁻⁶, ρ = 1000)'],['air','空気 (ν = 1.5×10⁻⁵, ρ = 1.2)']]},
    {id:'vm',label:'模型の速さ $v_m$',min:1,max:200,step:0.5,value:10,unit:'m/s'},
    {id:'Fm',label:'模型で測った抵抗 $F_m$',min:10,max:3000,step:10,value:1300,unit:'N'},
  ],
  buttons:[{label:'Re をそろえる',action:S=>{ const r=cur.calc(S); setParam('vm',clamp(Math.round(r.vmatch*2)/2,1,200)); }},
    {label:'A6 の条件',action:S=>{ setParam('Lp',4); setParam('vp',30); setParam('n',5); setSel('fm','water'); setParam('vm',10); setParam('Fm',1300); }}],
  calc(S){ const nup=1.5e-5, rp=1.2, [num,rm]=S.P.fm==='water'?[1e-6,1000]:[1.5e-5,1.2];
    const Lm=S.P.Lp/S.P.n, Rep=S.P.vp*S.P.Lp/nup, Rem=S.P.vm*Lm/num, vmatch=S.P.vp*(S.P.Lp/Lm)*(num/nup);
    const pi1=S.P.Fm/(rm*S.P.vm**2*Lm**2), Fp=pi1*rp*S.P.vp**2*S.P.Lp**2;
    return {nup,rp,num,rm,Lm,Rep,Rem,vmatch,pi1,Fp,ratio:Rem/Rep}; },
  init(S){ S.pp=Array.from({length:70},()=>({x:Math.random(),y:Math.random()})); S.pm=Array.from({length:70},()=>({x:Math.random(),y:Math.random()})); },
  step(S,dt){ const r=this.calc(S);
    for(const p of S.pp){ p.x+=dt*0.08*S.P.vp/30; if(p.x>1){p.x=0;p.y=Math.random();} }
    for(const p of S.pm){ p.x+=dt*0.08*S.P.vm/30; if(p.x>1){p.x=0;p.y=Math.random();} } },
  car(g,C,cx,cy,len){ const h=len*0.28; g.save(); g.fillStyle=C.solid; g.strokeStyle=C.ink; g.lineWidth=1.5; g.beginPath();
    g.moveTo(cx-len/2,cy); g.lineTo(cx-len/2,cy-h*0.55); g.quadraticCurveTo(cx-len*0.3,cy-h*0.6,cx-len*0.18,cy-h); g.lineTo(cx+len*0.15,cy-h);
    g.quadraticCurveTo(cx+len*0.3,cy-h*0.6,cx+len/2,cy-h*0.45); g.lineTo(cx+len/2,cy); g.closePath(); g.fill(); g.stroke();
    for(const wx of [-0.3,0.3]){ g.fillStyle=C.ink; g.beginPath(); g.arc(cx+wx*len,cy,h*0.22,0,7); g.fill(); } g.restore(); },
  draw(g,S){
    const C=S.C, r=this.calc(S), ok=Math.abs(Math.log10(r.ratio))<0.02;
    const panel=(x,label,fluidCol,parts,len,v,Re,L,fl)=>{ const w=440, h=230, y=20;
      g.save(); g.fillStyle=fluidCol; g.globalAlpha=.18; g.fillRect(x,y,w,h); g.restore(); rect(g,x,y,w,h,null,C.line,1);
      g.fillStyle=C.water_deep; for(const p of parts){ g.beginPath(); g.arc(x+p.x*w,y+15+p.y*(h-60),2,0,7); g.fill(); }
      line(g,[[x,y+h-40],[x+w,y+h-40]],C.ink,2); this.car(g,C,x+w/2,y+h-46,len);
      text(g,label,x+10,y+16,{size:15,weight:700}); text(g,fl,x+w-10,y+16,{align:'right',size:12,color:C.muted});
      text(g,'L = '+fmt(L)+' m,  v = '+fmt(v)+' m/s',x+10,y+h-18,{size:13,mono:true});
      text(g,'Re = '+fmt(Re),x+w-10,y+h-18,{align:'right',size:14,weight:700,color:ok?C.b:C.a}); };
    panel(20,'実物',C.air,S.pp,clamp(S.P.Lp*40,40,300),S.P.vp,r.Rep,S.P.Lp,'空気');
    panel(500,'模型（1/'+S.P.n+'）',S.P.fm==='water'?C.water:C.air,S.pm,clamp(S.P.Lp*40/S.P.n,8,300),S.P.vm,r.Rem,r.Lm,S.P.fm==='water'?'水':'空気');
    // Re の比較（対数軸）
    const bx=60, by=300, bw=840; const X=Re=>bx+(Math.log10(Re)-4)/5*bw;
    line(g,[[bx,by],[bx+bw,by]],C.line,6);
    for(let e=4;e<=9;e++){ line(g,[[X(10**e),by-6],[X(10**e),by+6]],C.muted,1); text(g,'10'+sup(e),X(10**e),by+20,{align:'center',size:12,mono:true,color:C.muted}); }
    const mk=(Re,lab,col,dy)=>{ const x=X(clamp(Re,1e4,1e9)); g.fillStyle=col; g.beginPath(); g.arc(x,by,8,0,7); g.fill(); text(g,lab,x,by+dy,{align:'center',size:13,weight:700,color:col}); };
    mk(r.Rep,'実物',C.ink,-22); mk(r.Rem,'模型',ok?C.b:C.a,40);
    text(g,ok?'レイノルズ数が一致：力学的に相似':'レイノルズ数が不一致：相似ではない（模型の速さを '+fmt(r.vmatch)+' m/s にする）',bx+bw/2,by+72,{align:'center',size:15,weight:700,color:ok?C.b:C.a});
    // π 定理の表
    const tx=60, ty=410; text(g,'π 定理：変数 5 個 − 基本次元 3 個 = 無次元数 2 個',tx,ty,{size:14,weight:700});
    const rows=[['F','力','M L T⁻²'],['ρ','密度','M L⁻³'],['v','速度','L T⁻¹'],['L','長さ','L'],['μ','粘性係数','M L⁻¹ T⁻¹']];
    rows.forEach((rw,i)=>{ const y=ty+26+i*24; text(g,rw[0],tx,y,{size:14,weight:700,mono:true}); text(g,rw[1],tx+30,y,{size:13,color:C.muted}); text(g,rw[2],tx+120,y,{size:13,mono:true}); });
    const px=440; text(g,'π₁ = F/(ρv²L²)　模型：'+fmt(r.pi1),px,ty+30,{size:14,mono:true});
    text(g,'π₂ = ρvL/μ = Re',px,ty+58,{size:14,mono:true});
    text(g,'予測：F_p = π₁ ρ_p v_p² L_p² = '+fmt(r.Fp)+' N',px,ty+96,{size:16,weight:700,color:ok?C.accent:C.a});
    if(!ok) text(g,'（Re が違うので π₁ が等しいとは言えない）',px,ty+122,{size:13,color:C.a});
    if(S.P.fm==='air'&&r.vmatch>100) text(g,'空気の模型でそろえるには '+fmt(r.vmatch)+' m/s 必要（圧縮性が効いて非現実的）',px,ty+146,{size:13,color:C.m});
  },
  readout(S){ const r=this.calc(S); return [
    ['実物の $Re$',fmt(r.Rep)],['模型の $Re$',fmt(r.Rem)],['$Re$ をそろえる模型の速さ',fmt(r.vmatch)+' m/s'],
    ['模型の $\\pi_1 = F_m/(\\rho_m v_m^2 L_m^2)$',fmt(r.pi1)],['実物の抵抗の予測 $F_p$',fmt(r.Fp)+' N']]; }
});
