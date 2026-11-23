// 中級：急拡大の損失（ボルダ・カルノー）
defineSim({
  id:'expansion', level:'intermediate', order:7, name:'急拡大の損失（ボルダ・カルノー）',
  formula:'$$h_L = \\frac{(v_1 - v_2)^2}{2g} = \\left(1 - \\frac{A_1}{A_2}\\right)^2 \\frac{v_1^2}{2g} \\qquad \\frac{p_2 - p_1}{\\rho g} = \\frac{v_1^2 - v_2^2}{2g} - h_L$$',
  explain:'**管が急に太くなると、細い管から出た噴流が周りの遅い流れと混ざり、渦になってエネルギーが失われます**。下のグラフの赤線（全ヘッド）は拡大部で $h_L$ だけ下がります。圧力（青線）は上がりますが、損失のぶんだけ「損失なし」（点線）より上がり方が小さくなります。',
  hint:'==直径の比を大きくすると、損失係数 $K$ はどこまで大きくなるでしょう？==（太い管が非常に太いと $K \\to 1$：速度ヘッドを全部失う）。「ディフューザ」をオンにすると、ゆるやかに広げて損失を減らせます。',
  related:['M7'],
  params:[
    {id:'v1',label:'細い管の流速 $v_1$',min:0.5,max:8,step:0.1,value:4,unit:'m/s'},
    {id:'d1',label:'細い管の内径 $d_1$',min:2,max:10,step:0.5,value:5,unit:'cm'},
    {id:'d2',label:'太い管の内径 $d_2$',min:3,max:20,step:0.5,value:10,unit:'cm'},
    {id:'dif',label:'ゆるやかに広げる（ディフューザ、損失を約 1/5 に）',type:'check',value:false},
  ],
  calc(S){ const g=9.81, d2=Math.max(S.P.d2,S.P.d1), A=(S.P.d1/d2)**2, v2=S.P.v1*A, K=(1-A)**2*(S.P.dif?0.2:1), hL=K*S.P.v1**2/(2*g);
    const ideal=(S.P.v1**2-v2**2)/(2*g); return {g,d2,A,v2,K,hL,ideal,rise:ideal-hL}; },
  init(S){ S.parts=Array.from({length:240},()=>({x:Math.random(),e:Math.random()*2-1,ph:Math.random()*6.28})); },
  R(S,x){ const r=this.calc(S), r1=S.P.d1*6, r2=r.d2*6, xe=0.4; if(x<xe) return r1; if(!S.P.dif) return r2; const t=clamp((x-xe)/0.25,0,1); return lerp(r1,r2,t); },
  step(S,dt){ const r=this.calc(S); for(const p of S.parts){ const R1=S.P.d1*6, R=this.R(S,p.x), u=S.P.v1*(R1/R)**2; p.x+=u*dt*0.05; p.ph+=dt*3; if(p.x>1){p.x=0;p.e=Math.random()*2-1;} } },
  draw(g,S){
    const C=S.C, r=this.calc(S), cy=150, x0=40, x1=920, X=x=>x0+x*(x1-x0);
    const top=[],bot=[]; for(let i=0;i<=200;i++){ const x=i/200; top.push([X(x),cy-this.R(S,x)]); bot.push([X(x),cy+this.R(S,x)]); }
    if(!S.P.dif){ top.splice(80,0,[X(0.4),cy-r.d2*6]); bot.splice(80,0,[X(0.4),cy+r.d2*6]); }
    g.save(); g.fillStyle=C.water; g.globalAlpha=.22; g.beginPath(); top.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p)); bot.slice().reverse().forEach(p=>g.lineTo(...p)); g.fill(); g.restore();
    // 壁の線（急拡大では段差）
    const wall=(sgn)=>{ const pts=[[X(0),cy+sgn*S.P.d1*6],[X(0.4),cy+sgn*S.P.d1*6]];
      if(S.P.dif){ pts.push([X(0.65),cy+sgn*r.d2*6]); } else pts.push([X(0.4),cy+sgn*r.d2*6]); pts.push([X(1),cy+sgn*r.d2*6]); line(g,pts,C.ink,3); };
    wall(-1); wall(1);
    // 渦（急拡大の隅）
    if(!S.P.dif && r.d2>S.P.d1*1.2){ const h=(r.d2-S.P.d1)*6; for(const sgn of [-1,1]){ const ex=X(0.4)+h*1.4, ey=cy+sgn*(S.P.d1*6+h/2);
      g.save(); g.strokeStyle=C.hi; g.lineWidth=1.5; g.globalAlpha=.6; g.beginPath(); g.ellipse(ex,ey,h*1.2,h/2.4,0,S.t*3*sgn,S.t*3*sgn+5); g.stroke(); g.restore(); }
      text(g,'渦でエネルギーが失われる',X(0.52),cy-r.d2*6-16,{align:'center',size:13,weight:700,color:C.hi}); }
    g.fillStyle=C.water_deep; for(const p of S.parts){ const R=this.R(S,p.x); g.beginPath(); g.arc(X(p.x),cy+p.e*R*(p.x<0.4?0.9:Math.min(0.9,0.4+(p.x-0.4)*2.5)),2.2,0,7); g.fill(); }
    // ヘッドのグラフ
    const gy=300, gh=240, gx=x0, gw=x1-x0, ps1=3;
    const v1h=S.P.v1**2/(2*r.g), H1=ps1+v1h, H2=H1-r.hL, p2=H2-r.v2**2/(2*r.g), p2i=H1-r.v2**2/(2*r.g), top_=H1+0.3, bot_=Math.min(ps1,p2)-0.6;
    const Y=h=>gy+(top_-h)/(top_-bot_)*gh;
    rect(g,gx,gy,gw,gh,null,C.line,1);
    const xe=X(S.P.dif?0.65:0.4), xs=X(0.4);
    line(g,[[gx,Y(H1)],[xs,Y(H1)],[xe,Y(H2)],[gx+gw,Y(H2)]],C.hi,2.5); text(g,'全ヘッド',gx+8,Y(H1)-12,{size:13,weight:700,color:C.hi});
    line(g,[[gx,Y(ps1)],[xs,Y(ps1)],[xe,Y(p2)],[gx+gw,Y(p2)]],C.lo,2.5); text(g,'圧力ヘッド p/ρg',gx+8,Y(ps1)+14,{size:13,weight:700,color:C.lo});
    line(g,[[xe,Y(p2i)],[gx+gw,Y(p2i)]],C.lo,1.5,[6,4]); text(g,'損失なしの場合',gx+gw-8,Y(p2i)-12,{align:'right',size:12,color:C.lo});
    arrow(g,gx+gw-60,Y(H1),gx+gw-60,Y(H2),C.hi,1.5,7); text(g,'h_L = '+fmt(r.hL)+' m',gx+gw-68,(Y(H1)+Y(H2))/2,{align:'right',size:14,weight:700,color:C.hi,bg:C.paper});
    line(g,[[gx+gw-60,Y(H1)],[gx+gw,Y(H1)]],C.hi,1,[3,3]);
  },
  readout(S){ const r=this.calc(S); return [
    ['太い管の流速 $v_2$',fmt(r.v2)+' m/s'],['損失係数 $K$',fmt(r.K)],['損失ヘッド $h_L$',fmt(r.hL)+' m'],
    ['圧力上昇 $p_2 - p_1$',fmt(1000*9.81*r.rise/1000)+' kPa'],['損失なしの圧力上昇',fmt(1000*9.81*r.ideal/1000)+' kPa']]; }
});
