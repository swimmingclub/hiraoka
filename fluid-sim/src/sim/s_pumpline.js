// 中級：ポンプと管路（システム曲線と運転点）
defineSim({
  id:'pumpline', level:'intermediate', order:8, name:'ポンプと管路（揚程と動力）',
  formula:'$$H_{\\text{sys}}(Q) = \\Delta z + \\left(f\\frac{L}{d} + \\sum K\\right)\\frac{v^2}{2g} \\qquad P = \\frac{\\rho g Q H}{\\eta}$$',
  explain:'**ポンプは水を $\\Delta z$ だけ持ち上げるのに加え、管路の摩擦と曲がりなどの損失のぶんもヘッドを与えなければなりません**。管路に必要なヘッドを流量に対して描いたのが「システム曲線」で、損失は $Q^2$ に比例するので放物線になります。ポンプの性能曲線との交点が実際の運転点です。',
  hint:'==流量を 2 倍にすると、損失ヘッドと軸動力はどう変わるでしょう？== 「ポンプ曲線を表示」をオンにすると、ポンプがどの流量で運転されるか（運転点）が分かります。「M8 の条件」で問題の状態になります。',
  related:['M8'],
  params:[
    {id:'Q',label:'流量 $Q$',min:0.002,max:0.05,step:0.001,value:0.02,unit:'m³/s',digits:3},
    {id:'dz',label:'実揚程 $\\Delta z$',min:0,max:40,step:1,value:20,unit:'m'},
    {id:'L',label:'管の長さ $L$',min:10,max:500,step:10,value:100,unit:'m'},
    {id:'d',label:'内径 $d$',min:5,max:30,step:1,value:10,unit:'cm'},
    {id:'K',label:'局所損失係数の合計 $\\sum K$',min:0,max:10,step:0.5,value:1.5,digits:1},
    {id:'eta',label:'ポンプ効率 $\\eta$',min:0.4,max:0.9,step:0.01,value:0.75,digits:2},
    {id:'pc',label:'ポンプ曲線を表示（締切揚程 45 m）',type:'check',value:true},
  ],
  buttons:[{label:'M8 の条件',action:S=>{ setParam('Q',0.02); setParam('dz',20); setParam('L',100); setParam('d',10); setParam('K',1.5); setParam('eta',0.75); }}],
  f:0.02,
  sys(S,Q){ const A=Math.PI/4*(S.P.d/100)**2, v=Q/A, hv=v*v/19.62; return {v,hv,hf:this.f*S.P.L/(S.P.d/100)*hv,hm:S.P.K*hv,H:S.P.dz+(this.f*S.P.L/(S.P.d/100)+S.P.K)*hv}; },
  pump(Q){ return 45-30000*Q*Q; },
  calc(S){ const s=this.sys(S,S.P.Q), Pw=1000*9.81*S.P.Q*s.H; return {...s,Pw,P:Pw/S.P.eta}; },
  op(S){ let lo=0, hi=0.08; for(let i=0;i<60;i++){ const m=(lo+hi)/2; if(this.sys(S,m).H<this.pump(m)) lo=m; else hi=m; } return lo; },
  init(S){ S.parts=Array.from({length:60},()=>({s:Math.random()})); },
  step(S,dt){ const v=this.calc(S).v; for(const p of S.parts){ p.s+=v*dt*0.05; if(p.s>1)p.s-=1; } },
  draw(g,S){
    const C=S.C, r=this.calc(S);
    // 左：模式図
    const yl=520, yu=yl-clamp(S.P.dz,0,40)*9-40;
    const tank=(x,y,w)=>{ g.save(); g.fillStyle=C.water; g.globalAlpha=.75; g.fillRect(x,y,w,50); g.restore(); line(g,[[x,y-20],[x,y+50],[x+w,y+50],[x+w,y-20]],C.ink,2.5); };
    tank(30,yl,110); tank(280,yu,110);
    const pth=[[140,yl+35],[200,yl+35],[200,yu+35],[280,yu+35]];
    line(g,pth,C.ink,8); line(g,pth,C.water,4);
    g.fillStyle=C.accent; g.beginPath(); g.arc(200,yl-10,22,0,7); g.fill(); text(g,'P',200,yl-10,{align:'center',size:15,weight:700,color:C.paper});
    let L=0; for(let i=1;i<pth.length;i++) L+=Math.hypot(pth[i][0]-pth[i-1][0],pth[i][1]-pth[i-1][1]);
    g.fillStyle=C.paper; for(const p of S.parts){ let d=p.s*L; for(let i=1;i<pth.length;i++){ const sl=Math.hypot(pth[i][0]-pth[i-1][0],pth[i][1]-pth[i-1][1]); if(d<=sl){ const t=d/sl; g.beginPath(); g.arc(lerp(pth[i-1][0],pth[i][0],t),lerp(pth[i-1][1],pth[i][1],t),2.2,0,7); g.fill(); break; } d-=sl; } }
    arrow(g,470,yl,470,yu,C.m,1.5,8); arrow(g,470,yu,470,yl,C.m,1.5,8); text(g,'Δz = '+fmt(S.P.dz)+' m',462,(yl+yu)/2,{align:'right',size:14,weight:700,color:C.m,bg:C.paper});
    // ヘッドの内訳（積み上げ棒）
    const bx=30, by=40, bh=24, sc=360/Math.max(60,r.H);
    [[S.P.dz,C.m,'実揚程'],[r.hf,C.hi,'摩擦'],[r.hm,C.a,'局所']].reduce((x,[v,col,lb])=>{ g.fillStyle=col; g.fillRect(x,by,v*sc,bh); if(v*sc>40) text(g,lb,x+v*sc/2,by+bh/2,{align:'center',size:12,weight:700,color:C.paper}); return x+v*sc; },bx);
    text(g,'H_p = '+fmt(r.H)+' m',bx,by+bh+18,{size:15,weight:700});
    text(g,'= 実揚程 '+fmt(S.P.dz)+' + 摩擦 '+fmt(r.hf)+' + 局所 '+fmt(r.hm),bx,by+bh+42,{size:13});
    [[C.m,'実揚程'],[C.hi,'摩擦損失'],[C.a,'局所損失']].forEach(([c,l],i)=>{ g.fillStyle=c; g.fillRect(bx+i*110,by+bh+60,12,12); text(g,l,bx+i*110+18,by+bh+66,{size:12}); });
    // 右：システム曲線
    const gx=520, gy=60, gw=410, gh=420, Qm=0.06, Hm=60;
    const PX=q=>gx+q/Qm*gw, PY=h=>gy+gh-clamp(h,0,Hm)/Hm*gh;
    rect(g,gx,gy,gw,gh,null,C.line,1);
    for(let q=0;q<=Qm+1e-9;q+=0.01){ line(g,[[PX(q),gy+gh],[PX(q),gy+gh+5]],C.muted,1); text(g,fmt(q,2),PX(q),gy+gh+16,{align:'center',size:11,mono:true,color:C.muted}); }
    for(let h=0;h<=Hm;h+=10){ line(g,[[gx-5,PY(h)],[gx,PY(h)]],C.muted,1); text(g,String(h),gx-8,PY(h),{align:'right',size:11,mono:true,color:C.muted}); }
    text(g,'流量 Q [m³/s]',gx+gw/2,gy+gh+34,{align:'center',size:12,color:C.muted}); text(g,'揚程 H [m]',gx,gy-14,{size:12,color:C.muted});
    const pts=[]; for(let i=0;i<=120;i++){ const q=Qm*i/120, h=this.sys(S,q).H; if(h>Hm) break; pts.push([PX(q),PY(h)]); } line(g,pts,C.accent,2.5);
    text(g,'システム曲線',pts.length?pts[pts.length-1][0]-6:gx,pts.length?pts[pts.length-1][1]+16:gy,{align:'right',size:13,weight:700,color:C.accent});    line(g,[[gx,PY(S.P.dz)],[gx+gw,PY(S.P.dz)]],C.m,1,[4,4]);
    g.fillStyle=C.hi; g.beginPath(); g.arc(PX(S.P.Q),PY(r.H),7,0,7); g.fill();
    text(g,'('+fmt(S.P.Q,2)+', '+fmt(r.H)+' m)',PX(S.P.Q)+10,PY(r.H)+16,{size:13,weight:700,color:C.hi,bg:C.paper});
    if(S.P.pc){ const pp=[]; for(let i=0;i<=60;i++){ const q=Qm*i/60; if(this.pump(q)>0) pp.push([PX(q),PY(this.pump(q))]); } line(g,pp,C.b,2.5);
      const qo=this.op(S); g.strokeStyle=C.b; g.lineWidth=3; g.beginPath(); g.arc(PX(qo),PY(this.pump(qo)),9,0,7); g.stroke();
      text(g,'運転点 Q = '+fmt(qo,3)+' m³/s',PX(qo)+12,PY(this.pump(qo))-16,{size:13,weight:700,color:C.b,bg:C.paper}); }
  },
  readout(S){ const r=this.calc(S); return [
    ['流速 $v$',fmt(r.v)+' m/s'],['摩擦損失 $h_f$（$f = 0.02$）',fmt(r.hf)+' m'],['局所損失 $\\sum K\\, v^2/2g$',fmt(r.hm)+' m'],
    ['全揚程 $H_p$',fmt(r.H)+' m'],['水動力 $\\rho g Q H_p$',fmt(r.Pw/1000)+' kW'],['軸動力 $P = \\rho g Q H_p/\\eta$',fmt(r.P/1000)+' kW']]; }
});
