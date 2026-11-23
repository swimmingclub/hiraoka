// 中級：ハーゲン・ポアズイユの法則
defineSim({
  id:'poiseuille', level:'intermediate', order:3, name:'ハーゲン・ポアズイユの法則（円管内の層流）',
  formula:'u(r) = (Δp/4μL)(R² − r²)　　Q = πd⁴Δp/(128μL)　　u_max = 2v̄',
  explain:'円管内の層流では、壁で速度 0、中心で最大の放物線状の速度分布になります。圧力差が流体を押す力と、壁からの粘性のせん断力がつり合って決まる分布です。流量は直径の 4 乗に比例するので、管を少し太くするだけで流れやすさが大きく変わります。',
  hint:'直径を 2 倍にすると流量は 16 倍になります。粘性係数を 2 倍にすると流量は半分です。Re が 2300 を超えると層流の仮定が成り立たなくなるので注意しましょう。',
  related:['M3'],
  params:[
    {id:'dp',label:'圧力差 Δp',min:1,max:100,step:0.5,value:40.7,unit:'kPa'},
    {id:'L',label:'管の長さ L',min:1,max:50,step:1,value:10,unit:'m'},
    {id:'d',label:'内径 d',min:2,max:20,step:0.5,value:10,unit:'mm'},
    {id:'mu',label:'流体',type:'select',value:'0.1,900',options:[['0.1,900','油 (μ = 0.1 Pa·s, ρ = 900)'],['1.0,1260','グリセリン (μ = 1.0 Pa·s, ρ = 1260)'],['0.001,1000','水 (μ = 0.001 Pa·s, ρ = 1000)'],['0.0035,1060','血液 (μ ≈ 0.0035 Pa·s, ρ = 1060)']]},
  ],
  calc(S){ const [mu,rho]=S.P.mu.split(',').map(Number), d=S.P.d/1000, R=d/2, dp=S.P.dp*1000, L=S.P.L;
    const Q=Math.PI*d**4*dp/(128*mu*L), A=Math.PI*R*R, vm=Q/A, umax=2*vm, Re=rho*vm*d/mu, tau=dp*R/(2*L);
    return {mu,rho,d,R,dp,L,Q,vm,umax,Re,tau}; },
  init(S){ S.parts=Array.from({length:160},()=>({x:Math.random(),r:Math.random()*2-1})); S.ref=null; },
  step(S,dt){ const r=this.calc(S), vis=this.vis(r); for(const p of S.parts){ p.x+= (1-p.r*p.r)*vis*dt; if(p.x>1){p.x-=1;p.r=Math.random()*2-1;} } },
  vis(r){ return clamp(r.umax*0.8,0.02,1.2); }, // 表示用の中心速度（画面幅/秒）
  draw(g,S){
    const C=S.C, r=this.calc(S), cy=270, Rp=clamp(20+S.P.d*9,30,200), x0=60, x1=700;
    g.save(); g.fillStyle=C.m; g.globalAlpha=.18; g.fillRect(x0,cy-Rp,x1-x0,2*Rp); g.restore();
    line(g,[[x0,cy-Rp],[x1,cy-Rp]],C.ink,3); line(g,[[x0,cy+Rp],[x1,cy+Rp]],C.ink,3);
    g.fillStyle=C.water_deep; for(const p of S.parts){ g.beginPath(); g.arc(x0+p.x*(x1-x0),cy+p.r*Rp*0.97,2.4,0,7); g.fill(); }
    // 放物線状の速度分布
    const xs=760, sc=150/Math.max(r.umax,1e-9)*clamp(r.umax/0.5,0.15,1);
    const pts=[]; for(let i=-20;i<=20;i++){ const y=i/20, u=r.umax*(1-y*y); pts.push([xs+u*sc,cy+y*Rp]); if(i%4===0) arrow(g,xs,cy+y*Rp,xs+u*sc,cy+y*Rp,C.accent,1.4,7); }
    line(g,[[xs,cy-Rp-10],[xs,cy+Rp+10]],C.muted,1); line(g,pts,C.accent,2.5);
    text(g,'u_max = '+fmt(r.umax)+' m/s',xs+6,cy-Rp-26,{size:14,weight:700,color:C.accent});
    const xm=xs+r.vm*sc; line(g,[[xm,cy-Rp],[xm,cy+Rp]],C.hi,1.5,[5,4]); text(g,'v̄',xm+6,cy+Rp+18,{size:14,weight:700,color:C.hi});
    // 圧力の向き
    text(g,'p₁',x0+10,cy-Rp-24,{size:15,weight:700}); text(g,'p₂ = p₁ − '+fmt(S.P.dp)+' kPa',x1-10,cy-Rp-24,{align:'right',size:15,weight:700});
    arrow(g,x0+60,cy-Rp-24,x1-200,cy-Rp-24,C.muted,1.5,8);
    // せん断応力
    text(g,'壁のせん断応力 τ_w = ΔpR/(2L) = '+fmt(r.tau)+' Pa',x0,cy+Rp+30,{size:14,color:C.ink});
    // 層流チェック
    const ok=r.Re<2300;
    text(g,(ok?'Re = '+fmt(r.Re)+'：層流なのでこの式が使えます':'Re = '+fmt(r.Re)+'：2300 を超えています（実際は乱流になり、この式は使えません）'),480,560,{align:'center',size:15,weight:700,color:ok?C.b:C.a});
  },
  readout(S){ const r=this.calc(S); return [
    ['流量 Q',fmt(r.Q*1e6)+' mL/s'],['平均流速 v̄ = Q/A',fmt(r.vm)+' m/s'],['最大流速 u_max = 2v̄',fmt(r.umax)+' m/s'],
    ['レイノルズ数 Re',fmt(r.Re)],['壁のせん断応力 τ_w',fmt(r.tau)+' Pa'],['ポンプ動力 ΔpQ',fmt(r.dp*r.Q)+' W']]; }
});
