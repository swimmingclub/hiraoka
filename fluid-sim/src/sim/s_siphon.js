// 初級：サイフォン
defineSim({
  id:'siphon', level:'beginner', order:8, name:'サイフォンの原理',
  formula:'$$v = \\sqrt{2gH} \\qquad p_{\\text{頂部}} = p_{\\text{atm}} - \\rho g z - \\frac{1}{2}\\rho v^2$$',
  explain:'**管を水で満たしておけば、出口が水面より低い限り、水は山を越えて流れ続けます**。流速は水面と出口の高さの差 $H$ だけで決まります。管の頂部では圧力が大気圧より下がり、__ベルヌーイの定理__で求められます。',
  hint:'==頂部の高さ $z$ を上げても流量は変わりません。では、どこまで上げられるでしょう？== !!絶対圧が水の蒸気圧（約 2.3 kPa）まで下がると、水が沸騰して流れが切れます!!。',
  related:['B8'],
  liveReadout:true,
  params:[
    {id:'H',label:'出口の深さ $H$（水面から）',min:0.2,max:5,step:0.1,value:2,unit:'m'},
    {id:'z',label:'頂部の高さ $z$（水面から）',min:0,max:10,step:0.1,value:1.5,unit:'m'},
    {id:'d',label:'管の内径 $d$',min:0.5,max:5,step:0.1,value:2,unit:'cm'},
  ],
  calc(S){ const g=9.81, v=Math.sqrt(2*g*S.P.H), pt=-1000*g*S.P.z-0.5*1000*v*v, pabs=101300+pt, zmax=(101300-2300)/(1000*g)-S.P.H;
    return {v,Q:Math.PI/4*(S.P.d/100)**2*v,pt,pabs,zmax,cav:pabs<2300}; },
  init(S){ S.parts=Array.from({length:90},()=>({s:Math.random()})); S.bub=[]; },
  path(S){ // 管の折れ線（世界座標 m、水面 y=0）
    return [[1.2,-0.6],[1.2,S.P.z],[3.6,S.P.z],[3.6,-S.P.H]]; },
  step(S,dt){ const r=this.calc(S); const sp=r.cav?0:r.v*0.04;
    for(const p of S.parts){ p.s+=sp*dt; if(p.s>1) p.s-=1; }
    if(r.cav){ if(Math.random()<0.4) S.bub.push({x:1.2+Math.random()*2.4,y:S.P.z,t:0}); }
    for(const b of S.bub){ b.t+=dt; } S.bub=S.bub.filter(b=>b.t<1.2); },
  draw(g,S){
    const C=S.C, r=this.calc(S), top=Math.max(S.P.z,1)+0.6, bottom=-Math.max(S.P.H,1)-0.6, K=Math.min(500/(top-bottom),90);
    const X=x=>90+x*170, Y=y=>40+(top-y)*K;
    // タンク
    g.save(); g.fillStyle=C.water; g.globalAlpha=.7; g.fillRect(X(-0.2),Y(0),X(1.6)-X(-0.2),Y(-1.2)-Y(0)); g.restore();
    line(g,[[X(-0.2),Y(0.8)],[X(-0.2),Y(-1.2)],[X(1.6),Y(-1.2)],[X(1.6),Y(0.8)]],C.ink,3);
    text(g,'▽ 水面',X(-0.15),Y(0)-14,{size:13,color:C.accent});
    // 管（色は圧力：赤 = 大気圧より高い、青 = 低い）
    const pth=this.path(S), segs=[];
    for(let i=0;i<pth.length-1;i++){ const [x1,y1]=pth[i],[x2,y2]=pth[i+1]; for(let k=0;k<20;k++){ const t=k/20, t2=(k+1)/20;
      const y=lerp(y1,y2,(t+t2)/2), p=-1000*9.81*y-(y<-0.5&&i===0?0:0.5*1000*r.v*r.v);
      const pg=i===0&&y<0? -1000*9.81*y-0.5*1000*r.v*r.v : -1000*9.81*y-0.5*1000*r.v*r.v;
      g.strokeStyle=heat(0.5+clamp(pg/60000,-0.5,0.5)); g.lineWidth=14; g.lineCap='butt';
      g.beginPath(); g.moveTo(X(lerp(x1,x2,t)),Y(lerp(y1,y2,t))); g.lineTo(X(lerp(x1,x2,t2)),Y(lerp(y1,y2,t2))); g.stroke(); } }
    line(g,pth.map(([x,y])=>[X(x),Y(y)]),C.ink,1.2);
    // 粒子
    const L=pth.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-pth[i][0],p[1]-pth[i][1]),0);
    g.fillStyle=C.paper;
    for(const p of S.parts){ let d=p.s*L; for(let i=0;i<pth.length-1;i++){ const sl=Math.hypot(pth[i+1][0]-pth[i][0],pth[i+1][1]-pth[i][1]);
      if(d<=sl){ const t=d/sl; g.beginPath(); g.arc(X(lerp(pth[i][0],pth[i+1][0],t)),Y(lerp(pth[i][1],pth[i+1][1],t)),2.5,0,7); g.fill(); break; } d-=sl; } }
    for(const b of S.bub){ g.strokeStyle=C.paper; g.lineWidth=1.5; g.beginPath(); g.arc(X(b.x),Y(b.y)-b.t*20,3+b.t*4,0,7); g.stroke(); }
    // 寸法
    arrow(g,X(4.3),Y(0),X(4.3),Y(-S.P.H),C.accent,1.5,8); text(g,'H = '+fmt(S.P.H)+' m',X(4.3)+8,Y(-S.P.H/2),{size:14,weight:700,color:C.accent});
    line(g,[[X(1.6),Y(0)],[X(4.5),Y(0)]],C.muted,1,[4,4]); line(g,[[X(3.6),Y(-S.P.H)],[X(4.5),Y(-S.P.H)]],C.muted,1,[4,4]);
    if(S.P.z>0.05){ arrow(g,X(2.4),Y(0),X(2.4),Y(S.P.z),C.m,1.5,8); text(g,'z = '+fmt(S.P.z)+' m',X(2.4)+8,Y(S.P.z/2),{size:14,weight:700,color:C.m}); }
    if(!r.cav){ arrow(g,X(3.6),Y(-S.P.H)+8,X(3.6),Y(-S.P.H)+50,C.ink,3,10); text(g,'v = '+fmt(r.v)+' m/s',X(3.6)+12,Y(-S.P.H)+36,{size:14,weight:700}); }
    text(g,'頂部の絶対圧 '+fmt(r.pabs/1000)+' kPa',X(2.4),Y(S.P.z)-26,{align:'center',size:15,weight:700,color:r.cav?C.a:C.lo,bg:C.paper});
    if(r.cav) text(g,'蒸気圧より低い：水が沸騰して流れが止まる',X(2.4),Y(S.P.z)-52,{align:'center',size:15,weight:700,color:C.a,bg:C.paper});
    text(g,'管の色：赤 = 大気圧より高い、青 = 低い',W-16,H-18,{align:'right',size:12,color:C.muted});
  },
  readout(S){ const r=this.calc(S); return [
    ['流出速度 $v = \\sqrt{2gH}$',r.cav?'0（流れが切れる）':fmt(r.v)+' m/s'],['流量 $Q$',r.cav?'0':fmt(r.Q*1000)+' L/s'],
    ['頂部のゲージ圧',fmt(r.pt/1000)+' kPa'],['頂部の絶対圧',fmt(r.pabs/1000)+' kPa'],['頂部の限界の高さ $z_{\\max}$',fmt(r.zmax)+' m']]; }
});
