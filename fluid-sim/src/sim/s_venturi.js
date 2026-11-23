// 初級：ベルヌーイの定理（ベンチュリ管・ピトー管）
defineSim({
  id:'venturi', level:'beginner', order:6, name:'ベルヌーイの定理（ベンチュリ管・ピトー管）',
  formula:'$$\\frac{p}{\\rho g} + \\frac{v^2}{2g} + z = \\text{一定（全ヘッド）} \\qquad p_1 - p_2 = \\frac{1}{2}\\rho\\,(v_2^2 - v_1^2)$$',
  explain:'**流線に沿って「圧力ヘッド + 速度ヘッド + 位置ヘッド」の合計は一定です**。管がしぼられた「のど部」では__連続の式__により流れが速くなり、そのぶん圧力が下がります。細い管（マノメータ）の水柱の高さが圧力ヘッドを表します。流れに向けたピトー管の水柱は全ヘッドまで上がります。',
  hint:'のど部を細くするほど水柱の差が大きくなります。点線（全ヘッド）と各水柱の差が、その場所の速度ヘッド $v^2/2g$ です。のど部の圧力が負になると、実際の管では!!キャビテーション（気泡の発生）が起こります!!。',
  related:['B6'],
  params:[
    {id:'v1',label:'入口の流速 $v_1$',min:0.2,max:3,step:0.01,value:1.41,unit:'m/s'},
    {id:'d1',label:'入口の内径 $d_1$',min:6,max:16,step:0.5,value:10,unit:'cm'},
    {id:'d2',label:'のど部の内径 $d_2$',min:2,max:16,step:0.5,value:5,unit:'cm'},
    {id:'h1',label:'入口の圧力ヘッド $p_1/\\rho g$',min:0.5,max:2.4,step:0.05,value:2,unit:'m'},
  ],
  init(S){ S.parts=Array.from({length:220},()=>({x:40+Math.random()*880,e:Math.random()*2-1})); },
  R(S,x){ const sc=4, r1=S.P.d1*sc, r2=S.P.d2*sc; // 半径 px（1 cm 直径 = 8 px）
    if(x<330) return r1; if(x>630) return r1;
    if(x<430){const t=(x-330)/100,s=t*t*(3-2*t);return lerp(r1,r2,s);} if(x<530) return r2;
    const t=(x-530)/100,s=t*t*(3-2*t); return lerp(r2,r1,s); },
  v(S,x){ return S.P.v1*(this.R(S,0)/this.R(S,x))**2; },
  step(S,dt){ for(const p of S.parts){ p.x+=this.v(S,p.x)*40*dt; if(p.x>920){p.x=40;p.e=Math.random()*2-1;} } },
  calc(S){ const g=9.81, v1=S.P.v1, v2=v1*(S.P.d1/S.P.d2)**2, hv1=v1*v1/2/g, hv2=v2*v2/2/g, H0=S.P.h1+hv1, h2=H0-hv2;
    return {v1,v2,hv1,hv2,H0,h2,dp:(S.P.h1-h2)*1000*g,Q:Math.PI/4*(S.P.d1/100)**2*v1}; },
  draw(g,S){
    const C=S.C, cy=470, K=150, r=this.calc(S);
    const top=[],bot=[]; for(let x=40;x<=920;x+=5){top.push([x,cy-this.R(S,x)]);bot.push([x,cy+this.R(S,x)]);}
    g.save(); g.fillStyle=C.water; g.globalAlpha=.25; g.beginPath(); top.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p)); bot.slice().reverse().forEach(p=>g.lineTo(...p)); g.fill(); g.restore();
    g.fillStyle=C.water_deep; for(const p of S.parts){ g.beginPath(); g.arc(p.x,cy+p.e*this.R(S,p.x)*0.9,2.4,0,7); g.fill(); }
    // 全ヘッドの線（基準は管の中心）
    const yH=cy-r.H0*K; line(g,[[40,yH],[920,yH]],C.hi,1.5,[6,5]); text(g,'全ヘッド（エネルギー線）',250,yH-14,{size:13,color:C.hi});
    // マノメータ（静圧）
    const tube=(x,head,label,col)=>{ const ytop=cy-this.R(S,x); const yw=cy-head*K;
      g.save(); g.fillStyle=col; g.globalAlpha=.7; g.fillRect(x-7,Math.min(yw,ytop),14,Math.max(0,ytop-yw)); g.restore();
      line(g,[[x-8,ytop],[x-8,yH-30]],C.ink,1.5); line(g,[[x+8,ytop],[x+8,yH-30]],C.ink,1.5);
      text(g,label,x,yH-46,{align:'center',size:13,weight:700}); };
    tube(180,S.P.h1,'① 入口',C.water); tube(480,Math.max(r.h2,0),'② のど部',C.water);
    // 差の寸法
    const y1=cy-S.P.h1*K, y2=cy-r.h2*K;
    line(g,[[180,y1],[520,y1]],C.muted,1,[3,3]);
    if(r.h2>0){ arrow(g,505,y1,505,y2,C.accent,1.5,8); text(g,'Δh = '+fmt(S.P.h1-r.h2)+' m',512,(y1+y2)/2,{size:14,weight:700,color:C.accent}); }
    else text(g,'のど部が負圧（キャビテーションの危険）',480,cy-this.R(S,480)-24,{align:'center',size:14,weight:700,color:C.hi,bg:C.paper});
    // ピトー管（出口側、流れに向いた L 字管）
    const xp=790, ytp=cy-this.R(S,xp);
    line(g,[[xp-60,cy],[xp-8,cy],[xp-8,yH-30]],C.ink,2); line(g,[[xp-60,cy+8],[xp+8,cy+8],[xp+8,yH-30]],C.ink,2);
    g.save(); g.fillStyle=C.m; g.globalAlpha=.6; g.fillRect(xp-7,yH,14,cy-yH); g.restore();
    text(g,'③ ピトー管',xp,yH-46,{align:'center',size:13,weight:700});
    tube(870,S.P.h1,'',C.water);
    arrow(g,880,y1,880,yH,C.m,1.5,8); text(g,'v²/2g',886,(y1+yH)/2,{size:13,color:C.m});
    text(g,'v₁ = '+fmt(r.v1)+' m/s',180,cy+this.R(S,180)+24,{align:'center',size:14,weight:700,color:C.accent});
    text(g,'v₂ = '+fmt(r.v2)+' m/s',480,cy+this.R(S,480)+24,{align:'center',size:14,weight:700,color:C.accent});
  },
  readout(S){ const r=this.calc(S); return [
    ['のど部の流速 $v_2$',fmt(r.v2)+' m/s'],['流量 $Q$',fmt(r.Q*1000)+' L/s'],
    ['圧力差 $p_1 - p_2$',fmt(r.dp/1000)+' kPa'],['水柱の差 $\\Delta h$',fmt(S.P.h1-r.h2)+' m'],
    ['ピトー管の水柱差 $v_1^2/2g$',fmt(r.hv1*100)+' cm'],['全ヘッド $H$',fmt(r.H0)+' m']]; }
});
