// 中級：レイノルズ数と層流・乱流（レイノルズの着色実験）
defineSim({
  id:'reynolds', level:'intermediate', order:2, name:'レイノルズ数と層流・乱流',
  formula:'Re = ρvd/μ = vd/ν　　（円管：Re < 2300 層流 ／ Re > 4000 程度で乱流）',
  explain:'レイノルズの実験では、管の中心に色水を流し込みます。流れが遅い（Re が小さい）ときは色水が 1 本の線のまま流れます（層流）。速くすると線が波打ち、やがてちぎれて管全体に混ざります（乱流）。Re は「慣性力 ÷ 粘性力」で、粘性が流れの乱れを抑えきれるかどうかを表します。',
  hint:'水で流速 0.1 m/s → 0.5 m/s と上げて、色の線の変化を見ましょう。同じ速さでも油（粘性が大きい）なら層流のままです。右側の速度分布は、層流では放物線、乱流では中央が平らになります。',
  related:['M2'],
  liveReadout:true,
  params:[
    {id:'v',label:'平均流速 v',min:0.01,max:1,step:0.01,value:0.1,unit:'m/s'},
    {id:'d',label:'管の内径 d',min:0.5,max:5,step:0.1,value:2,unit:'cm'},
    {id:'nu',label:'流体',type:'select',value:'1e-6',options:[['1e-6','水 (ν = 1.0×10⁻⁶ m²/s)'],['1.5e-5','空気 (ν = 1.5×10⁻⁵ m²/s)'],['1e-4','油 (ν = 1.0×10⁻⁴ m²/s)']]},
  ],
  Re(S){ return S.P.v*(S.P.d/100)/(+S.P.nu); },
  init(S){ S.dye=[]; S.acc=0; },
  // 乱れの強さ 0（層流）〜1（乱流）
  turb(Re){ return clamp((Re-2000)/2500,0,1); },
  step(S,dt){
    const Re=this.Re(S), T=this.turb(Re), k=420; // 表示速度：最大 ~ 一定に正規化
    const vis=Math.min(1, 0.15+S.P.v*1.2);
    S.acc+=dt*120; while(S.acc>1){ S.acc-=1; S.dye.push({x:150,y:0,vy:0,ph:Math.random()*6.28}); }
    for(const p of S.dye){
      const yr=clamp(p.y,-1,1);
      const prof = T<0.5 ? (1-yr*yr)*2*(1-T*2) + (T*2)*(1.22*Math.pow(1-Math.abs(yr),1/7)) : 1.22*Math.pow(1-Math.abs(yr),1/7);
      p.x+=prof*vis*k*0.5*dt;
      if(T>0){ // 下流ほど乱れが成長
        const grow=clamp((p.x-150)/500,0,1);
        p.vy+= (Math.random()-0.5)*T*grow*60*dt + Math.sin(p.x/30+p.ph+S.t*3)*T*grow*0.6*dt*(T<0.6?4:1);
        p.vy*=0.94; p.y+=p.vy*dt*8;
        if(p.y>0.97){p.y=0.97;p.vy*=-0.5;} if(p.y<-0.97){p.y=-0.97;p.vy*=-0.5;}
      }
    }
    S.dye=S.dye.filter(p=>p.x<800);
  },
  draw(g,S){
    const C=S.C, cy=280, R=110, Re=this.Re(S), T=this.turb(Re);
    g.save(); g.fillStyle=C.water; g.globalAlpha=.18; g.fillRect(60,cy-R,740,2*R); g.restore();
    line(g,[[60,cy-R],[800,cy-R]],C.ink,3); line(g,[[60,cy+R],[800,cy+R]],C.ink,3);
    // 色水の注入針
    line(g,[[70,cy-160],[70,cy-20],[150,cy]],C.solid,4); text(g,'色水',70,cy-178,{align:'center',size:13});
    g.fillStyle=C.hi;
    for(const p of S.dye){ g.globalAlpha=T>0.6?0.35:0.9; g.beginPath(); g.arc(p.x,cy+p.y*R,T>0.6?3.5:2.4,0,7); g.fill(); }
    g.globalAlpha=1;
    // 速度分布
    const x0=830; line(g,[[x0,cy-R],[x0,cy+R]],C.muted,1);
    const pts=[]; for(let i=-20;i<=20;i++){ const y=i/20; const lam=(1-y*y)*2, tur=1.22*Math.pow(1-Math.abs(y),1/7);
      const u=T<0.5? lam*(1-T*2)+tur*T*2 : tur; pts.push([x0+u*45,cy+y*R]); if(i%4===0) arrow(g,x0,cy+y*R,x0+u*45,cy+y*R,C.accent,1.2,6); }
    line(g,pts,C.accent,2); text(g,'速度分布',x0+40,cy+R+22,{align:'center',size:13,color:C.accent});
    // Re メーター
    const mx=120, my=500, mw=640;
    const logRe=v=>clamp((Math.log10(v)-1)/(5-1),0,1);
    for(let i=0;i<mw;i+=2){ const t=i/mw, Rv=10**(1+t*4); g.fillStyle=Rv<2300?C.b:(Rv<4000?C.m:C.a); g.fillRect(mx+i,my,2,14); }
    [10,100,1000,2300,10000,100000].forEach(v=>{ const x=mx+logRe(v)*mw; line(g,[[x,my+14],[x,my+20]],C.muted,1); text(g,v>=1e5?'10⁵':String(v),x,my+32,{align:'center',size:11,mono:true,color:C.muted}); });
    const xr=mx+logRe(Re)*mw; g.fillStyle=C.ink; g.beginPath(); g.moveTo(xr,my-2); g.lineTo(xr-7,my-14); g.lineTo(xr+7,my-14); g.fill();
    const state=Re<2300?'層流':(Re<4000?'遷移域':'乱流');
    text(g,'Re = '+fmt(Re)+'　→　'+state,xr,my-30,{align:'center',size:17,weight:700,color:Re<2300?C.b:(Re<4000?C.m:C.a)});
  },
  readout(S){ const Re=this.Re(S); return [
    ['レイノルズ数 Re = vd/ν',fmt(Re)],['流れの状態',Re<2300?'層流':(Re<4000?'遷移域':'乱流')],
    ['臨界流速 v_c（Re = 2300）',fmt(2300*(+S.P.nu)/(S.P.d/100))+' m/s']]; }
});
