// 初級：アルキメデスの原理（浮力）
defineSim({
  id:'buoyancy', level:'beginner', order:3, name:'アルキメデスの原理（浮力）',
  formula:'$$F_B = \\rho_{\\text{流体}}\\, g\\, V_{\\text{排除}} \\qquad \\text{浮いているとき：}\\ F_B = mg$$',
  explain:'物体には、押しのけた流体の重さに等しい浮力が上向きに働きます。浮いて静止した物体では浮力と重力がつり合うので、沈む深さの割合は密度の比 $\\rho_{\\text{物体}}/\\rho_{\\text{流体}}$ になります。',
  hint:'物体の密度を 1000 kg/m³ より大きくすると水に沈みます。液体を水銀に変えると、鉄（7870 kg/m³）でも浮くでしょうか？ 上から押す力を加えて、全部沈めるのに必要な力も確かめましょう。',
  related:['B3'],
  liveReadout:true,
  params:[
    {id:'a',label:'立方体の一辺 $a$',min:5,max:25,step:1,value:10,unit:'cm'},
    {id:'rb',label:'物体の密度 $\\rho_{\\text{物体}}$',min:100,max:8000,step:10,value:600,unit:'kg/m³'},
    {id:'rf',label:'液体',type:'select',value:'1000',options:[['1000','水 (1000)'],['1025','海水 (1025)'],['850','油 (850)'],['13600','水銀 (13600)']]},
    {id:'F',label:'上から押す力 $F$',min:0,max:100,step:0.1,value:0,unit:'N'},
  ],
  buttons:[{label:'持ち上げて落とす',action:S=>{S.y=-0.05;S.v=0;}}],
  K:900, D:0.32, // 1 m = 900 px, 水槽の深さ 0.32 m
  init(S){ S.y=-0.04; S.v=0; },
  onParam(S,id){ if(id==='a') {S.y=Math.min(S.y,this.D); } },
  forces(S){ const a=S.P.a/100, m=S.P.rb*a**3, d=clamp(S.y,0,a), FB=+S.P.rf*9.81*a*a*d;
    return {a,m,d,FB,W:m*9.81}; },
  step(S,dt){
    for(let i=0;i<10;i++){ const h=dt/10, f=this.forces(S);
      let acc=(f.W+S.P.F-f.FB)/f.m - 4*S.v*(S.y>0?1:0.2);
      S.v+=acc*h; S.y+=S.v*h;
      if(S.y>this.D){ S.y=this.D; S.v=0; } }
  },
  draw(g,S){
    const C=S.C, K=this.K, f=this.forces(S), surf=230, bot=surf+this.D*K, xl=200, xr=760;
    const fluid=+S.P.rf===13600?C.solid:(+S.P.rf===850?C.m:C.water);
    g.save(); g.globalAlpha=+S.P.rf===850?.4:.8; g.fillStyle=fluid; g.fillRect(xl,surf,xr-xl,bot-surf); g.restore();
    line(g,[[xl,surf-140],[xl,bot],[xr,bot],[xr,surf-140]],C.ink,3);
    text(g,'▽ 液面',xr-80,surf-14,{size:13,color:C.accent});
    const a=f.a*K, cx=(xl+xr)/2, yb=surf+S.y*K;
    // 排除体積（水面下の部分）を強調
    rect(g,cx-a/2,yb-a,a,a,C.wood,C.ink,2);
    if(f.d>0){ g.save(); g.fillStyle=C.lo; g.globalAlpha=.25; g.fillRect(cx-a/2,yb-f.d*K,a,f.d*K); g.restore();
      text(g,'排除体積',cx,yb-f.d*K/2,{align:'center',size:13,color:C.ink}); }
    // 力の矢印（長さは重さ基準）
    const s=110/Math.max(f.W,S.P.F+0.01,f.FB*0.5);
    arrow(g,cx-30,yb-a/2,cx-30,yb-a/2+f.W*s,C.ink,4,14); text(g,'重力 '+fmt(f.W)+' N',cx-40,yb-a/2+f.W*s,{align:'right',size:14,weight:700,bg:C.paper});
    if(f.FB>0){ arrow(g,cx+30,yb-a/2,cx+30,yb-a/2-f.FB*s,C.accent,4,14); text(g,'浮力 '+fmt(f.FB)+' N',cx+40,yb-a/2-f.FB*s,{size:14,weight:700,color:C.accent,bg:C.paper}); }
    if(S.P.F>0){ arrow(g,cx,yb-a-80,cx,yb-a-4,C.hi,4,14); text(g,'押す力 '+fmt(S.P.F)+' N',cx+12,yb-a-70,{size:14,weight:700,color:C.hi}); }
    if(S.y>=this.D-1e-4) text(g,'底に着いた（底からの抗力が加わる）',cx,bot+24,{align:'center',size:14,color:C.hi});
  },
  readout(S){ const f=this.forces(S), a=f.a, ratio=S.P.rb/+S.P.rf, FBfull=+S.P.rf*9.81*a**3;
    return [
      ['物体の重さ $mg$', fmt(f.W)+' N'],
      ['いまの浮力 $F_B$', fmt(f.FB)+' N'],
      ['沈んでいる深さ $d$', fmt(f.d*100)+' cm'],
      ['理論：密度比 $\\rho_{\\text{物体}}/\\rho_{\\text{流体}}$', fmt(ratio)],
      ['理論：浮くときの $d = a \\times$ 密度比', ratio<1?fmt(S.P.a*ratio)+' cm':'沈む'],
      ['全没に必要な力 $F_{B,\\text{全}} - mg$', ratio<1?fmt(FBfull-f.W)+' N':'不要（沈む）'],
    ]; }
});
