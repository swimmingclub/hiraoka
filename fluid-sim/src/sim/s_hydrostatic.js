// 初級：静水圧と平面壁の全圧力
defineSim({
  id:'hydrostatic', level:'beginner', name:'静水圧と水門の全圧力',
  formula:'p = ρgh　　F = ρg h_G A　　h_P = h_G + I_G/(h_G A)',
  explain:'静止した水の圧力は深さに比例して大きくなり、壁を垂直に押します。圧力は三角形に分布するので、合力（全圧力）は図心より深い位置（長方形なら水深の 2/3）に作用します。',
  hint:'水深を 2 倍にすると、全圧力は何倍になるでしょう？（答え：4 倍。圧力も面積も 2 倍になるから）。水の中をクリックすると、その深さの圧力が表示されます。',
  related:['B1'],
  params:[
    {id:'h',label:'水深 h',min:0.5,max:10,step:0.1,value:5,unit:'m'},
    {id:'b',label:'水門の幅 b',min:0.5,max:5,step:0.1,value:2,unit:'m'},
    {id:'rho',label:'液体',type:'select',value:'1000',options:[['1000','水 (1000 kg/m³)'],['1025','海水 (1025 kg/m³)'],['850','油 (850 kg/m³)'],['13600','水銀 (13600 kg/m³)']]},
  ],
  init(S){ S.probe=null; },
  onPointer(S,ev){ if(ev==='down'||S.pointer.down){ const y0=540, sc=48, surf=y0-S.P.h*sc;
      if(S.pointer.x>110&&S.pointer.x<560&&S.pointer.y>surf&&S.pointer.y<y0) S.probe=(S.pointer.y-surf)/sc; } },
  calc(S){ const rho=+S.P.rho, g=9.81, h=S.P.h, b=S.P.b;
    const A=b*h, hG=h/2, F=rho*g*hG*A, IG=b*h**3/12, hP=hG+IG/(hG*A);
    return {rho,g,h,b,A,hG,F,hP,pmax:rho*g*h}; },
  draw(g,S){
    const C=S.C, y0=540, sc=48, x0=110, xw=560, r=this.calc(S), surf=y0-r.h*sc;
    // 目盛り
    for(let d=0; d<=10; d++){ const y=y0-d*sc; line(g,[[x0-14,y],[x0-4,y]],C.muted,1); text(g,d+' m',x0-18,y,{align:'right',size:12,color:C.muted,mono:true}); }
    text(g,'底からの高さ',x0-18,y0-10*sc-22,{align:'right',size:12,color:C.muted});
    // 水
    const grd=g.createLinearGradient(0,surf,0,y0); grd.addColorStop(0,C.water); grd.addColorStop(1,C.water_deep);
    g.fillStyle=grd; g.fillRect(x0,surf,xw-x0,y0-surf);
    // 水面の波
    g.save(); g.strokeStyle=C.paper; g.globalAlpha=.6; g.beginPath();
    for(let x=x0;x<=xw;x+=4){ const y=surf+Math.sin(x/18+S.t*2)*1.5; x===x0?g.moveTo(x,y):g.lineTo(x,y);} g.stroke(); g.restore();
    text(g,'▽ 水面',x0+10,surf-14,{size:13,color:C.accent});
    // 容器
    line(g,[[x0,y0-10*sc-10],[x0,y0],[xw,y0]],C.ink,3);
    // 水門（右の壁）
    rect(g,xw,y0-r.h*sc,10,r.h*sc,C.solid);
    line(g,[[xw+10,y0-10*sc-10],[xw+10,y0]],C.ink,3);
    // 圧力分布（三角形）を壁の外側に描き、矢印は壁を押す向き
    // 三角形の横幅は底の圧力に比例（水銀などで大きくなる）
    const Lmax=clamp(r.pmax/49050*120,20,330);
    g.save(); g.fillStyle=C.hi; g.globalAlpha=.12; g.beginPath(); g.moveTo(xw+30,surf); g.lineTo(xw+30+Lmax,y0); g.lineTo(xw+30,y0); g.closePath(); g.fill(); g.restore();
    const n=12;
    for(let i=1;i<=n;i++){ const d=r.h*i/n, y=surf+d*sc, L=(d/r.h)*Lmax;
      arrow(g,xw+30+L,y,xw+14,y,C.hi,1.6,8); }
    line(g,[[xw+30,surf],[xw+30+Lmax,y0]],C.hi,1.2,[4,4]);
    text(g,'圧力分布 p = ρgh',xw+40,surf+18,{size:13,color:C.hi});
    // 全圧力の矢印（作用点）
    const yP=surf+r.hP*sc;
    arrow(g,xw+260,yP,xw+14,yP,C.accent,4,16);
    text(g,'F = '+fmt(r.F/1000)+' kN',xw+180,yP-18,{size:15,weight:700,color:C.accent,align:'center'});
    text(g,'作用点 h_P = '+fmt(r.hP)+' m',xw+180,yP+20,{size:13,color:C.accent,align:'center'});
    // 図心
    const yG=surf+r.hG*sc; line(g,[[xw-60,yG],[xw,yG]],C.ink,1,[3,3]); text(g,'図心',xw-64,yG,{align:'right',size:12,color:C.ink});
    // 探針
    if(S.probe!=null && S.probe<=r.h){ const y=surf+S.probe*sc, x=Math.min(S.pointer.x,xw-20);
      g.save(); g.fillStyle=C.paper; g.beginPath(); g.arc(x,y,6,0,7); g.fill(); g.restore();
      text(g,`深さ ${fmt(S.probe)} m：p = ${fmt(r.rho*9.81*S.probe/1000)} kPa`,x+12,y,{size:13,weight:700,bg:C.paper}); }
  },
  readout(S){ const r=this.calc(S); return [
    ['底のゲージ圧 p = ρgh', fmt(r.pmax/1000)+' kPa'],
    ['水門の面積 A = bh', fmt(r.A)+' m²'],
    ['図心の深さ h_G', fmt(r.hG)+' m'],
    ['全圧力 F = ρg h_G A', fmt(r.F/1000)+' kN'],
    ['圧力中心 h_P', fmt(r.hP)+' m'],
    ['h_P / h', fmt(r.hP/r.h)],
  ]; }
});
