// 上級：速度ポテンシャル・流れ関数と重ね合わせ
defineSim({
  id:'potential', level:'advanced', order:3, name:'流れ関数の重ね合わせ（湧き出し・吸い込み・渦）',
  formula:'ψ = Uy + Σ (m/2π)θ − Σ (Γ/2π) ln r　　u = ∂ψ/∂y,  v = −∂ψ/∂x',
  explain:'非回転・非圧縮の流れはラプラス方程式を満たすので、基本の流れ（一様流・湧き出し・吸い込み・渦）を足し合わせても正しい流れになります。流線（ψ = 一定の線）は流体が横切れないので、閉じた流線をそのまま物体の表面とみなせます。一様流に湧き出しを置くと「ランキンの半無限物体」、湧き出しと吸い込みを並べると「ランキンの楕円体」になります。',
  hint:'キャンバスをクリックすると、選んだ要素が置かれます。置いた要素はドラッグで動かせます。「A3 の条件」で問題の流れになります。赤い線が物体の表面にあたる流線で、白丸がよどみ点です。',
  related:['A3'],
  params:[
    {id:'U',label:'一様流 U',min:0,max:10,step:0.5,value:5,unit:'m/s'},
    {id:'type',label:'クリックで置く要素',type:'select',value:'src',options:[['src','湧き出し (m > 0)'],['snk','吸い込み (m < 0)'],['vcw','渦（時計回り）'],['vccw','渦（反時計回り）']]},
    {id:'k',label:'置く要素の強さ |m| または |Γ|',min:1,max:40,step:1,value:10,unit:'m²/s'},
    {id:'heat',label:'圧力の色地図を表示',type:'check',value:false},
  ],
  buttons:[
    {label:'A3 の条件',action:S=>{setParam('U',5); S.els=[{t:'src',x:0,y:0,k:10}];}},
    {label:'ランキン楕円体',action:S=>{setParam('U',5); S.els=[{t:'src',x:-1,y:0,k:20},{t:'snk',x:1,y:0,k:20}];}},
    {label:'渦の対',action:S=>{setParam('U',0); S.els=[{t:'vcw',x:0,y:0.8,k:20},{t:'vccw',x:0,y:-0.8,k:20}];}},
    {label:'全部消す',action:S=>{S.els=[];}},
  ],
  view:{cx:480,cy:300,s:80},
  init(S){ S.els=[{t:'src',x:0,y:0,k:10}]; S.cache={}; S.lk=''; S.drag=null; S.parts=Array.from({length:200},()=>this.spawn(S,true)); },
  spawn(S,any){ const srcs=(S.els||[]).filter(e=>e.t==='src'); if(srcs.length&&Math.random()<0.35){ const e=srcs[Math.floor(Math.random()*srcs.length)], a=Math.random()*6.283; return {x:e.x+0.15*Math.cos(a),y:e.y+0.15*Math.sin(a)}; }
    if(S.P.U>0||!S.els||!S.els.length) return {x:any?-6+Math.random()*12:-6.1,y:(Math.random()*2-1)*3.7};
    return {x:-6+Math.random()*12,y:(Math.random()*2-1)*3.7}; },
  vel(S){ const U=S.P.U, els=S.els.map(e=>({...e}));
    return (x,y)=>{ let u=U, v=0;
      for(const e of els){ const dx=x-e.x, dy=y-e.y, r2=dx*dx+dy*dy;
        if(r2<(e.t==='snk'?0.012:0.0004)) return null;
        if(e.t==='src'||e.t==='snk'){ const m=(e.t==='src'?1:-1)*e.k/(2*Math.PI); u+=m*dx/r2; v+=m*dy/r2; }
        else { const G=(e.t==='vcw'?1:-1)*e.k/(2*Math.PI); u+=G*dy/r2; v+=-G*dx/r2; } }
      return [u,v]; }; },
  onPointer(S,ev){ const [x,y]=FT.toW(this.view,S.pointer.x,S.pointer.y);
    if(ev==='down'){ S.drag=S.els.find(e=>Math.hypot(e.x-x,e.y-y)*this.view.s<16)||null;
      if(!S.drag){ S.els.push({t:S.P.type,x,y,k:S.P.k}); } }
    else if(ev==='move' && S.drag){ S.drag.x=x; S.drag.y=y; }
    else if(ev==='up') S.drag=null; },
  key(S){ return JSON.stringify([S.P.U,S.els.map(e=>[e.t,e.x.toFixed(2),e.y.toFixed(2),e.k])]); },
  step(S,dt){ FT.advect(S.parts,this.view,this.vel(S),Math.max(S.P.U,3),dt,()=>this.spawn(S,false),1.5);
    if(S.P.U===0) for(const p of S.parts) if(Math.random()<0.003) Object.assign(p,this.spawn(S,true)); },
  stag(S){ // よどみ点をニュートン法で探す（格子から出発）
    const vel=this.vel(S), out=[];
    for(let gx=-5.5;gx<=5.5;gx+=0.5) for(let gy=-3.5;gy<=3.5;gy+=0.5){ let x=gx,y=gy, ok=false;
      for(let it=0;it<30;it++){ const V=vel(x,y); if(!V) break; const h=1e-4, Vx=vel(x+h,y), Vy=vel(x,y+h); if(!Vx||!Vy) break;
        const a=(Vx[0]-V[0])/h, b=(Vy[0]-V[0])/h, c=(Vx[1]-V[1])/h, d=(Vy[1]-V[1])/h, det=a*d-b*c; if(Math.abs(det)<1e-12) break;
        const dx=(d*V[0]-b*V[1])/det, dy=(-c*V[0]+a*V[1])/det; x-=dx; y-=dy; if(Math.hypot(dx,dy)<1e-7){ok=true;break;} }
      if(ok && Math.abs(x)<6 && Math.abs(y)<3.8 && !out.some(p=>Math.hypot(p[0]-x,p[1]-y)<0.05)) out.push([x,y]); }
    return out; },
  draw(g,S){
    const C=S.C, v=this.view, vel=this.vel(S), key=this.key(S);
    if(S.P.heat && S.P.U>0) FT.heat(g,S.cache,key,v,vel,S.P.U,{lo:-3,hi:1});
    if(S.lk!==key){ S.lk=key; S.lines=[]; S.st=this.stag(S);
      if(S.P.U>0) for(let i=-12;i<=12;i++) S.lines.push(FT.trace(v,vel,-6.2,i*0.3+0.001,0.04,600));
      for(const e of S.els){ if(e.t==='src') for(let j=0;j<16;j++){ const a=2*Math.PI*(j+0.5)/16; S.lines.push(FT.trace(v,vel,e.x+0.12*Math.cos(a),e.y+0.12*Math.sin(a),0.04,600)); }
        if(e.t[0]==='v') for(let j=1;j<=5;j++) S.lines.push(FT.trace(v,vel,e.x+0.25*j,e.y,0.03,500)); }
      S.sep=S.st.map(p=>FT.trace(v,vel,p[0]-0.02,p[1]+0.001,0.03,900).concat([])); }
    for(const L of S.lines) line(g,L,C.ink,1);
    for(const st of S.st){ for(const dd of [[0.03,0.03],[0.03,-0.03],[-0.03,0.03],[-0.03,-0.03]]) line(g,FT.trace(v,vel,st[0]+dd[0],st[1]+dd[1],0.03,900),C.hi,2.2); }
    FT.drawParts(g,S.parts,v,C.water_deep);
    for(const e of S.els){ const [X,Y]=FT.toS(v,e.x,e.y);
      g.fillStyle=e.t==='src'?C.hi:(e.t==='snk'?C.lo:C.m); g.beginPath(); g.arc(X,Y,9,0,7); g.fill();
      text(g,e.t==='src'?'+':(e.t==='snk'?'−':(e.t==='vcw'?'↻':'↺')),X,Y,{align:'center',size:13,weight:700,color:C.paper}); }
    for(const st of S.st){ const [X,Y]=FT.toS(v,st[0],st[1]); g.fillStyle=C.paper; g.strokeStyle=C.ink; g.lineWidth=2; g.beginPath(); g.arc(X,Y,6,0,7); g.fill(); g.stroke(); }
    if(S.P.U>0){ arrow(g,24,30,104,30,C.ink,3,10); text(g,'U = '+S.P.U+' m/s',112,30,{size:14,weight:700}); }
    // 目盛り
    for(let m=-5;m<=5;m++){ const [X]=FT.toS(v,m,0); line(g,[[X,H-8],[X,H]],C.muted,1); }
    text(g,'目盛り 1 m',W-12,H-20,{align:'right',size:11,color:C.muted});
  },
  readout(S){ const rows=[['要素の数',String(S.els.length)]];
    const st=(S.st||[]).slice(0,3).map(p=>'('+fmt(p[0])+', '+fmt(p[1])+')').join(' ');
    rows.push(['よどみ点 [m]',st||'なし']);
    const one=S.els.length===1&&S.els[0].t==='src'&&S.P.U>0;
    if(one){ const m=S.els[0].k; rows.push(['理論 x_s = −m/(2πU)',fmt(-m/(2*Math.PI*S.P.U))+' m'],['下流での物体の幅 m/U',fmt(m/S.P.U)+' m'],['物体表面の流線 ψ',fmt(m/2)+' m²/s']); }
    return rows; }
});
