// 初級：トリチェリの定理
defineSim({
  id:'torricelli', level:'beginner', order:5, name:'トリチェリの定理（小孔からの流出）',
  formula:'v = √(2gh)　　x = v√(2H/g) = 2√(hH)',
  explain:'水面から深さ h の小孔から出る水の速さは、高さ h から物が自由落下したときの速さと同じです。水面と孔にベルヌーイの定理を当てはめると導けます。孔から出た水は水平投射なので、床までの到達距離も計算できます。',
  hint:'水位を一定にして孔の高さを動かすと、到達距離が最大になるのはどこでしょう？（答え：孔が水面と床のちょうど中間にあるとき）。「水位が下がる」をオンにすると、流出がだんだん弱まる様子が見られます。',
  related:['B5'],
  liveReadout:true,
  params:[
    {id:'L',label:'床からの水位 L',min:0.5,max:3,step:0.05,value:2.6,unit:'m'},
    {id:'H',label:'孔の高さ H（床から）',min:0,max:3,step:0.05,value:0.8,unit:'m'},
    {id:'d',label:'孔の直径 d',min:0.5,max:5,step:0.1,value:2,unit:'cm'},
    {id:'drain',label:'水位が下がる（タンク直径 0.5 m）',type:'check',value:false},
  ],
  K:150, floor:560, xt:260,
  init(S){ S.level=S.P.L; S.drops=[]; S.acc=0; },
  onParam(S,id){ if(id==='L'||id==='drain') S.level=S.P.L; },
  h(S){ return Math.max(0,S.level-S.P.H); },
  step(S,dt){
    const h=this.h(S), v=Math.sqrt(2*9.81*h);
    if(S.P.drain && h>0){ const a=Math.PI/4*(S.P.d/100)**2, A=Math.PI/4*0.25; S.level-=a/A*v*dt*8; } // 8 倍速
    S.acc+=dt; while(S.acc>0.012 && h>0.001){ S.acc-=0.012; S.drops.push({x:0,y:S.P.H,vx:v,vy:0,j:Math.random()}); }
    if(h<=0.001) S.acc=0;
    for(const p of S.drops){ p.vy-=9.81*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; }
    S.drops=S.drops.filter(p=>p.y>0 && p.x<4.6);
  },
  draw(g,S){
    const C=S.C, K=this.K, F=this.floor, xt=this.xt, h=this.h(S), v=Math.sqrt(2*9.81*h);
    // 床と目盛り
    line(g,[[40,F],[920,F]],C.ink,2);
    for(let m=0;m<=4;m++){ const x=xt+m*K; line(g,[[x,F],[x,F+8]],C.muted,1); text(g,m+' m',x,F+20,{align:'center',size:12,color:C.muted,mono:true}); }
    // タンク
    const x0=80, top=F-3.1*K;
    g.save(); g.fillStyle=C.water; g.globalAlpha=.75; g.fillRect(x0,F-S.level*K,xt-x0,S.level*K); g.restore();
    line(g,[[x0,top],[x0,F],[xt,F],[xt,top]],C.ink,3);
    text(g,'▽',xt-20,F-S.level*K-12,{size:13,color:C.accent});
    // 孔
    const yh=F-S.P.H*K; g.fillStyle=C.paper; g.fillRect(xt-2,yh-4,5,8);
    // 深さ h の寸法
    if(h>0){ arrow(g,x0+30,F-S.level*K,x0+30,yh,C.hi,1.5,8); arrow(g,x0+30,yh,x0+30,F-S.level*K,C.hi,1.5,8);
      text(g,'h = '+fmt(h)+' m',x0+40,(F-S.level*K+yh)/2,{size:14,weight:700,color:C.hi}); }
    line(g,[[xt-40,yh],[xt+4,yh]],C.muted,1,[3,3]);
    text(g,'H = '+fmt(S.P.H)+' m',xt+10,yh+(S.P.H<0.3?-16:16),{size:13,color:C.muted});
    // 理論の放物線
    if(h>0 && S.P.H>0){ const pts=[]; const T=Math.sqrt(2*S.P.H/9.81);
      for(let i=0;i<=40;i++){ const t=T*i/40; pts.push([xt+v*t*K, F-(S.P.H-4.905*t*t)*K]); }
      line(g,pts,C.accent,1.2,[5,5]);
      const X=v*T; line(g,[[xt+X*K,F-10],[xt+X*K,F+10]],C.accent,3);
      text(g,'x = '+fmt(X)+' m',xt+X*K,F-24,{align:'center',size:15,weight:700,color:C.accent,bg:C.paper}); }
    // 水滴
    g.fillStyle=C.water_deep;
    for(const p of S.drops){ g.beginPath(); g.arc(xt+p.x*K, F-p.y*K, 2.5+p.j, 0, 7); g.fill(); }
    // 流速矢印
    if(h>0){ arrow(g,xt+8,yh-26,xt+8+v*12,yh-26,C.ink,2.5,10); text(g,'v = '+fmt(v)+' m/s',xt+12,yh-46,{size:14,weight:700}); }
    if(S.P.H>S.P.L) text(g,'孔が水面より上にあるので水は出ません',480,120,{align:'center',size:15,color:C.hi});
  },
  readout(S){ const h=this.h(S), v=Math.sqrt(2*9.81*h), a=Math.PI/4*(S.P.d/100)**2, X=2*Math.sqrt(h*S.P.H);
    const Hbest=S.level/2, Xbest=S.level;
    return [['深さ h',fmt(h)+' m'],['流出速度 v = √(2gh)',fmt(v)+' m/s'],['流量 Q = av',fmt(a*v*1000)+' L/s'],
      ['到達距離 x = 2√(hH)',fmt(X)+' m'],['最大になる孔の高さ',fmt(Hbest)+' m（x = '+fmt(Xbest)+' m）']]; }
});
