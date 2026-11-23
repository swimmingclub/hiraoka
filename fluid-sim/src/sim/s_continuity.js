// 初級：連続の式
defineSim({
  id:'continuity', level:'beginner', order:4, name:'連続の式（質量保存）',
  formula:'$$Q = A_1 v_1 = A_2 v_2 \\qquad v_2 = v_1 \\left(\\frac{d_1}{d_2}\\right)^2$$',
  explain:'**水は縮まないので、管のどの断面でも 1 秒あたりに通る体積（流量 Q）は同じです**。断面積が小さいところでは、同じ量を通すために流れが速くなります。粒の流れる速さと、同じ時刻に入った色つきの「水のかたまり」の長さに注目しましょう。',
  hint:'==細い管の直径を半分にすると、流速は何倍になるでしょう？==（答え：4 倍）。色つきのかたまりは、細い部分で細長く伸びます。体積は変わりません。',
  related:['B4'],
  params:[
    {id:'v1',label:'太い管の流速 $v_1$',min:0.2,max:4,step:0.1,value:2,unit:'m/s'},
    {id:'d1',label:'太い管の内径 $d_1$',min:4,max:20,step:0.5,value:10,unit:'cm'},
    {id:'d2',label:'細い管の内径 $d_2$',min:2,max:20,step:0.5,value:5,unit:'cm'},
  ],
  init(S){ S.parts=[]; for(let i=0;i<260;i++) S.parts.push({x:60+Math.random()*840,e:Math.random()*2-1}); S.slug=0; },
  R(S,x){ const sc=12, r1=S.P.d1*sc/2, r2=S.P.d2*sc/2; // 1 cm = 12 px
    if(x<360) return r1; if(x>540) return r2; const t=(x-360)/180, s=t*t*(3-2*t); return lerp(r1,r2,s); },
  vis(S,x){ const r1=this.R(S,0), r=this.R(S,x); return S.P.v1*(r1/r)**2; },
  step(S,dt){ const k=45; // 1 m/s を 45 px/s で表示
    for(const p of S.parts){ p.x+=this.vis(S,p.x)*k*dt; if(p.x>900){p.x=60;p.e=Math.random()*2-1;} }
    S.slug+=dt; if(S.slug>4) S.slug=0; },
  draw(g,S){
    const C=S.C, cy=300, k=45;
    // 管の外形
    const top=[],bot=[]; for(let x=60;x<=900;x+=6){top.push([x,cy-this.R(S,x)]);bot.push([x,cy+this.R(S,x)]);}
    g.save(); g.fillStyle=C.water; g.globalAlpha=.25; g.beginPath(); top.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p)); bot.slice().reverse().forEach(p=>g.lineTo(...p)); g.fill(); g.restore();
    line(g,top,C.ink,3); line(g,bot,C.ink,3);
    // 同時に入った水のかたまり（体積一定）
    const t=S.slug; let xa=60, xb=60, tt=0;
    // かたまりの先頭と後尾を時間積分で求める
    const adv=(x,T)=>{ let tm=0; while(tm<T){ x+=this.vis(S,x)*k*0.02; tm+=0.02; } return x; };
    xb=adv(60,t); xa=adv(60,Math.max(0,t-0.8));
    if(xb<900){ g.save(); g.fillStyle=C.hi; g.globalAlpha=.28; g.beginPath();
      for(let x=xa;x<=xb;x+=3) g.lineTo(x,cy-this.R(S,x)); for(let x=xb;x>=xa;x-=3) g.lineTo(x,cy+this.R(S,x)); g.fill(); g.restore(); }
    // 粒子
    g.fillStyle=C.water_deep;
    for(const p of S.parts){ const y=cy+p.e*this.R(S,p.x)*0.9; g.beginPath(); g.arc(p.x,y,2.6,0,7); g.fill(); }
    // 速度矢印
    const v2=this.vis(S,800);
    arrow(g,150,cy-this.R(S,150)-40,150+S.P.v1*30,cy-this.R(S,150)-40,C.accent,3,10);
    text(g,'v₁ = '+fmt(S.P.v1)+' m/s',150,cy-this.R(S,150)-62,{size:15,weight:700,color:C.accent});
    arrow(g,640,cy-this.R(S,800)-40,640+Math.min(v2*30,250),cy-this.R(S,800)-40,C.accent,3,10);
    text(g,'v₂ = '+fmt(v2)+' m/s',640,cy-this.R(S,800)-62,{size:15,weight:700,color:C.accent});
    text(g,'A₁ = '+fmt(Math.PI/4*S.P.d1**2)+' cm²',150,cy+this.R(S,150)+28,{size:13,color:C.muted});
    text(g,'A₂ = '+fmt(Math.PI/4*S.P.d2**2)+' cm²',640,cy+this.R(S,800)+28,{size:13,color:C.muted});
    text(g,'赤いかたまり＝同じ体積の水',480,560,{align:'center',size:13,color:C.hi});
  },
  readout(S){ const A1=Math.PI/4*(S.P.d1/100)**2, A2=Math.PI/4*(S.P.d2/100)**2, Q=A1*S.P.v1, v2=Q/A2;
    return [['断面積 $A_1$',fmt(A1*1e4)+' cm²'],['断面積 $A_2$',fmt(A2*1e4)+' cm²'],['流量 $Q = A_1 v_1$',fmt(Q*1000)+' L/s'],
      ['細い管の流速 $v_2 = Q/A_2$',fmt(v2)+' m/s'],['速度比 $v_2/v_1 = (d_1/d_2)^2$',fmt(v2/S.P.v1)]]; }
});
