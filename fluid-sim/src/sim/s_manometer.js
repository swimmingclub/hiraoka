// 初級：U字管マノメータ
defineSim({
  id:'manometer', level:'beginner', order:7, name:'U字管マノメータ',
  formula:'$$p_A + \\rho_1 g\\, a = \\rho_2 g\\, h \\qquad (\\text{ゲージ圧})$$',
  explain:'**同じ液体でつながった同じ高さの点は同じ圧力です**。左の水銀面の高さで左右を比べると、左は「管の圧力 $p_A$ + 水柱 $a$ の重さ」、右は「大気圧 + 水銀柱 $h$ の重さ」で、この 2 つがつり合います。管の圧力が上がると水銀は右へ押しやられ、差 $h$ が大きくなります。',
  hint:'==管の圧力を 2 倍にすると、水銀柱の差 $h$ は 2 倍になるでしょうか？==（水柱 $a$ も変わるので、ちょうど 2 倍にはなりません）。「B7 の条件」で問題の状態になります。',
  related:['B7'],
  params:[
    {id:'pA',label:'管 A の圧力 $p_A$（ゲージ圧）',min:-10,max:60,step:0.1,value:23.7,unit:'kPa'},
    {id:'a0',label:'水銀面の初期の深さ $a_0$（$h = 0$ のとき）',min:0.05,max:0.5,step:0.01,value:0.2,unit:'m'},
    {id:'r2',label:'マノメータの液体',type:'select',value:'13600',options:[['13600','水銀 (13600 kg/m³)'],['1590','四塩化炭素 (1590 kg/m³)'],['3000','重い液体 (3000 kg/m³)']]},
  ],
  buttons:[{label:'B7 の条件',action:S=>{ setParam('pA',23.74); setParam('a0',0.2); setSel('r2','13600'); }}],
  calc(S){ const g=9.81, r1=1000, r2=+S.P.r2, p=S.P.pA*1000;
    // p + r1 g (a0 + h/2) = r2 g h
    const h=(p+r1*g*S.P.a0)/(r2*g-r1*g/2), a=S.P.a0+h/2;
    return {g,r1,r2,p,h,a,hw:p/(r1*g)}; },
  init(S){ S.hs=this.calc(S).h; },
  step(S,dt){ S.hs+=(this.calc(S).h-S.hs)*Math.min(1,dt*5); },
  draw(g,S){
    const C=S.C, r=this.calc(S), K=520, yc=110, xl=330, xr=560, w=34, bot=560, h=S.hs, a=S.P.a0+h/2;
    const yL=yc+a*K, yR=yL-h*K; // 左右の水銀面
    const liq=+S.P.r2===13600?C.solid:C.m;
    // 管 A
    g.save(); g.fillStyle=C.water; g.globalAlpha=.6; g.fillRect(60,yc-40,xl+w/2-60,80); g.restore();
    line(g,[[60,yc-40],[xl+w/2,yc-40]],C.ink,3); line(g,[[60,yc+40],[xl-w/2,yc+40]],C.ink,3);
    text(g,'管 A',90,yc,{size:16,weight:700}); text(g,'p_A = '+fmt(S.P.pA)+' kPa',90,yc+24,{size:14,color:C.accent,weight:700});
    // U字管の内部
    g.save(); g.fillStyle=C.water; g.globalAlpha=.6; g.fillRect(xl-w/2,yc+40,w,Math.max(0,yL-yc-40)); g.restore();
    g.fillStyle=liq; g.fillRect(xl-w/2,yL,w,bot-yL); g.fillRect(xr-w/2,yR,w,bot-yR); g.fillRect(xl-w/2,bot,xr-xl+w,w);
    // 管の線
    line(g,[[xl-w/2,yc+40],[xl-w/2,bot+w],[xr+w/2,bot+w],[xr+w/2,40]],C.ink,2.5);
    line(g,[[xl+w/2,yc-40],[xl+w/2,bot],[xr-w/2,bot],[xr-w/2,40]],C.ink,2.5);
    text(g,'大気に開放',xr,24,{align:'center',size:13,color:C.muted});
    // 同じ高さの点
    line(g,[[xl-80,yL],[xr+120,yL]],C.hi,1.5,[6,4]);
    g.fillStyle=C.hi; for(const x of [xl,xr]){ g.beginPath(); g.arc(x,yL,6,0,7); g.fill(); }
    text(g,'同じ高さ ⇒ 同じ圧力',xr+60,yL+20,{size:13,weight:700,color:C.hi});
    // 寸法
    arrow(g,xl-60,yc,xl-60,yL,C.accent,1.5,8); arrow(g,xl-60,yL,xl-60,yc,C.accent,1.5,8);
    text(g,'a = '+fmt(a)+' m',xl-68,(yc+yL)/2,{align:'right',size:14,weight:700,color:C.accent});
    if(Math.abs(h)>0.005){ arrow(g,xr+60,yL,xr+60,yR,C.m,1.5,8); arrow(g,xr+60,yR,xr+60,yL,C.m,1.5,8);
      text(g,'h = '+fmt(h)+' m',xr+70,(yL+yR)/2,{size:14,weight:700,color:C.m}); }
    // 等価な水柱
    const hx=820, hw=clamp(r.hw,0,3.05)/3;
    rect(g,hx-12,yc-40,24,500,null,C.line,1); g.save(); g.fillStyle=C.water; g.globalAlpha=.7; if(hw>0) g.fillRect(hx-11,yc+460-hw*440,22,hw*440); g.restore();
    for(let m=0;m<=3;m++){ const yy=yc+460-m/3*440; line(g,[[hx+12,yy],[hx+20,yy]],C.muted,1); text(g,m+' m',hx+24,yy,{size:11,mono:true,color:C.muted}); }
    text(g,'同じ圧力を水柱で測ると',hx,yc-58,{align:'center',size:12,color:C.muted});
    text(g,fmt(r.hw)+' m'+(r.hw>3.05?'（はみ出す）':''),hx,yc+480,{align:'center',size:14,weight:700});
  },
  readout(S){ const r=this.calc(S); return [
    ['液柱の差 $h$',fmt(r.h)+' m'],['水柱の高さ $a$',fmt(r.a)+' m'],['右側：$\\rho_2 g h$',fmt(r.r2*r.g*r.h/1000)+' kPa'],
    ['左側の水柱：$\\rho_1 g a$',fmt(r.r1*r.g*r.a/1000)+' kPa'],['$p_A = \\rho_2 g h - \\rho_1 g a$',fmt(r.p/1000)+' kPa'],['等価な水柱 $p_A/\\rho_1 g$',fmt(r.hw)+' m']]; }
});
