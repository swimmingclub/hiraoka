// 中級：ダルシー・ワイスバッハの式とムーディ線図
function colebrook(Re,rel){ if(Re<2300) return 64/Re;
  let f=0.02; for(let i=0;i<30;i++){ f=1/(-2*Math.log10(rel/3.7+2.51/(Re*Math.sqrt(f))))**2; } return f; }
defineSim({
  id:'darcy', level:'intermediate', order:5, name:'管摩擦損失（ダルシー・ワイスバッハ）',
  formula:'h_f = f (L/d)(v²/2g)　　層流 f = 64/Re　　乱流 1/√f = −2 log(ε/3.7d + 2.51/(Re√f))',
  explain:'管の中を流れると壁との摩擦でエネルギーが失われ、下流ほど圧力が下がります（並んだ水柱が直線的に低くなる）。損失ヘッドは管の長さと速度ヘッド v²/2g に比例し、比例係数が管摩擦係数 f です。f は層流なら 64/Re、乱流ならレイノルズ数と管壁の相対粗さ ε/d で決まり、それを図にしたものがムーディ線図です。',
  hint:'流速を 2 倍にすると損失ヘッドはほぼ 4 倍、ポンプ動力はほぼ 8 倍になります。ムーディ線図の上の点が、粗さや Re によってどの曲線に乗るかを見ましょう。M5 の問題のように f = 0.02 と与えられたときは「f を指定する」をオンにします。',
  related:['M5'],
  params:[
    {id:'v',label:'平均流速 v',min:0.05,max:5,step:0.05,value:2,unit:'m/s'},
    {id:'d',label:'内径 d',min:1,max:50,step:1,value:10,unit:'cm'},
    {id:'L',label:'管の長さ L',min:10,max:1000,step:10,value:200,unit:'m'},
    {id:'eps',label:'管壁の粗さ ε',type:'select',value:'0.045',options:[['0.0015','引抜き管・ガラス (0.0015 mm)'],['0.045','商用鋼管 (0.045 mm)'],['0.26','鋳鉄管 (0.26 mm)'],['1.5','コンクリート管 (1.5 mm)']]},
    {id:'fix',label:'f を指定する（f = 0.02）',type:'check',value:true},
  ],
  calc(S){ const nu=1e-6, d=S.P.d/100, v=S.P.v, Re=v*d/nu, rel=(+S.P.eps)/1000/d;
    const fc=colebrook(Re,rel), f=S.P.fix?0.02:fc, hf=f*S.P.L/d*v*v/19.62, Q=Math.PI/4*d*d*v;
    return {d,v,Re,rel,fc,f,hf,dp:1000*9.81*hf,Q,P:1000*9.81*Q*hf}; },
  draw(g,S){
    const C=S.C, r=this.calc(S);
    // 上段：管と水柱
    const x0=60, x1=900, cy=230, R=18, Hmax=150;
    g.save(); g.fillStyle=C.water; g.globalAlpha=.3; g.fillRect(x0,cy-R,x1-x0,2*R); g.restore();
    line(g,[[x0,cy-R],[x1,cy-R]],C.ink,3); line(g,[[x0,cy+R],[x1,cy+R]],C.ink,3);
    const h0=r.hf+2, sc=Math.min(Hmax/h0, 15);
    for(let i=0;i<5;i++){ const x=x0+60+i*(x1-x0-120)/4, head=h0-r.hf*i/4, top=cy-R-head*sc;
      g.save(); g.fillStyle=C.water; g.globalAlpha=.8; g.fillRect(x-5,top,10,head*sc); g.restore();
      line(g,[[x-6,cy-R],[x-6,cy-R-Hmax-20]],C.ink,1.2); line(g,[[x+6,cy-R],[x+6,cy-R-Hmax-20]],C.ink,1.2); }
    line(g,[[x0+60,cy-R-h0*sc],[x1-60,cy-R-(h0-r.hf)*sc]],C.hi,1.5,[6,4]);
    text(g,'動水勾配線（圧力が直線的に下がる）',x0+80,cy-R-Hmax-36,{size:13,color:C.hi});
    arrow(g,x1-40,cy-R-h0*sc,x1-40,cy-R-(h0-r.hf)*sc,C.accent,1.5,8);
    text(g,'h_f = '+fmt(r.hf)+' m',x1-46,cy-R-(h0-r.hf/2)*sc,{align:'right',size:14,weight:700,color:C.accent,bg:C.paper});
    text(g,'L = '+fmt(S.P.L)+' m',(x0+x1)/2,cy+R+18,{align:'center',size:13,color:C.muted});
    // 下段：ムーディ線図
    const mx=120, my=300, mw=780, mh=250;
    const X=Re=>mx+(Math.log10(Re)-3)/5*mw, Y=f=>my+mh-(Math.log10(f)-Math.log10(0.008))/(Math.log10(0.1)-Math.log10(0.008))*mh;
    rect(g,mx,my,mw,mh,null,C.line,1);
    [1e3,1e4,1e5,1e6,1e7,1e8].forEach(v=>{ line(g,[[X(v),my],[X(v),my+mh]],C.line,1); text(g,'10'+sup(Math.round(Math.log10(v))),X(v),my+mh+14,{align:'center',size:11,mono:true,color:C.muted}); });
    [0.01,0.02,0.03,0.05,0.1].forEach(v=>{ line(g,[[mx,Y(v)],[mx+mw,Y(v)]],C.line,1); text(g,String(v),mx-6,Y(v),{align:'right',size:11,mono:true,color:C.muted}); });
    text(g,'レイノルズ数 Re',mx+mw/2,my+mh+32,{align:'center',size:12,color:C.muted}); text(g,'f',mx-50,my+mh/2,{size:14,weight:700,color:C.muted});
    const lam=[]; for(let e=3;e<=Math.log10(2300);e+=0.02) lam.push([X(10**e),Y(64/10**e)]); line(g,lam,C.b,2);
    text(g,'層流 64/Re',X(1300),Y(64/1300)-14,{size:12,color:C.b});
    [[0,'滑らか'],[1e-4,'ε/d=10⁻⁴'],[1e-3,'10⁻³'],[1e-2,'10⁻²']].forEach(([rel,lb])=>{ const pts=[];
      for(let e=Math.log10(4000);e<=8;e+=0.04){ const f=colebrook(10**e,rel); pts.push([X(10**e),Y(f)]); }
      line(g,pts,C.muted,1.2); text(g,lb,mx+mw-4,Y(colebrook(1e8,rel))+(rel===0?12:-9),{align:'right',size:11,color:C.muted}); });
    const cur2=[]; for(let e=Math.log10(4000);e<=8;e+=0.04) cur2.push([X(10**e),Y(colebrook(10**e,r.rel))]); line(g,cur2,C.accent,2);
    const px=X(clamp(r.Re,1e3,1e8)), py=Y(clamp(r.f,0.008,0.1));
    g.fillStyle=C.hi; g.beginPath(); g.arc(px,py,7,0,7); g.fill();
    text(g,'Re = '+fmt(r.Re)+', f = '+fmt(r.f),px+12,py-14,{size:13,weight:700,color:C.hi,bg:C.paper});
  },
  readout(S){ const r=this.calc(S); return [
    ['レイノルズ数 Re',fmt(r.Re)],['相対粗さ ε/d',fmt(r.rel)],['f（コールブルック式）',fmt(r.fc)],['使った f',fmt(r.f)],
    ['損失ヘッド h_f',fmt(r.hf)+' m'],['圧力損失 Δp',fmt(r.dp/1000)+' kPa'],['流量 Q',fmt(r.Q*1000)+' L/s'],['ポンプ動力 ρgQh_f',fmt(r.P)+' W']]; }
});
