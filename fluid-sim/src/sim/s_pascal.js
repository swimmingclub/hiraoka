// 初級：パスカルの原理（油圧ジャッキ）
defineSim({
  id:'pascal', level:'beginner', order:2, name:'パスカルの原理（油圧ジャッキ）',
  formula:'p = F₁/A₁ = F₂/A₂　　A₁x₁ = A₂x₂',
  explain:'密閉した液体に加えた圧力は、液体のすべての点に同じ大きさで伝わります。断面積の大きいピストンには、面積比の分だけ大きな力が出ます。そのかわり動く距離は面積比の分だけ小さくなり、仕事（力×距離）は両側で等しくなります。',
  hint:'大ピストンの直径を 2 倍にすると、持ち上げる力は何倍になるでしょう？ 小ピストンを押し込んで、大ピストンがどれだけ上がるかも見てみましょう。',
  related:['B2'],
  params:[
    {id:'F1',label:'小ピストンを押す力 F₁',min:10,max:300,step:5,value:100,unit:'N'},
    {id:'d1',label:'小ピストンの直径 d₁',min:1,max:6,step:0.5,value:2,unit:'cm'},
    {id:'d2',label:'大ピストンの直径 d₂',min:8,max:40,step:1,value:20,unit:'cm'},
    {id:'x1',label:'小ピストンの押し込み量 x₁',min:0,max:20,step:0.5,value:10,unit:'cm'},
  ],
  calc(S){ const P=S.P, A1=Math.PI/4*(P.d1/100)**2, A2=Math.PI/4*(P.d2/100)**2, p=P.F1/A1;
    return {A1,A2,p,F2:p*A2,ratio:A2/A1,x2:P.x1*A1/A2,W1:P.F1*P.x1/100}; },
  init(S){ S.shown=0; },
  step(S,dt){ S.shown+= (S.P.x1-S.shown)*Math.min(1,dt*4); },
  draw(g,S){
    const C=S.C, r=this.calc(S), sc=8; // 1 cm = 8 px
    const base=470, top=180, xL=220, xR=640;
    const w1=Math.max(S.P.d1*sc,8), w2=S.P.d2*sc;
    const x1=S.shown, x2=x1*r.A1/r.A2;
    const yP1=top+40+x1*sc, yP2=top+40-x2*sc;
    // 油（下の連結管と両シリンダ）
    g.fillStyle=C.m; g.globalAlpha=.35;
    g.fillRect(xL-w1/2,yP1,w1,base-yP1); g.fillRect(xR-w2/2,yP2,w2,base-yP2);
    g.fillRect(xL-w1/2,base,xR+w2/2-(xL-w1/2),40); g.globalAlpha=1;
    // 容器の線
    line(g,[[xL-w1/2,top-20],[xL-w1/2,base+40],[xR+w2/2,base+40],[xR+w2/2,top-20]],C.ink,3);
    line(g,[[xL+w1/2,top-20],[xL+w1/2,base],[xR-w2/2,base],[xR-w2/2,top-20]],C.ink,3);
    // ピストン
    rect(g,xL-w1/2,yP1-16,w1,16,C.solid,C.ink,1.5);
    rect(g,xR-w2/2,yP2-16,w2,16,C.solid,C.ink,1.5);
    // 大ピストンに載せた荷物
    rect(g,xR-60,yP2-96,120,80,C.wood,C.ink,1.5);
    text(g,fmt(r.F2/9.81)+' kg 相当',xR,yP2-56,{align:'center',size:14,weight:700});
    // 力の矢印
    arrow(g,xL,yP1-120,xL,yP1-20,C.hi,4,14);
    text(g,'F₁ = '+fmt(S.P.F1)+' N',xL+16,yP1-100,{size:15,weight:700,color:C.hi});
    const L2=clamp(40*Math.log10(r.F2/S.P.F1*10),30,150);
    arrow(g,xR+w2/2+50,yP2+L2-20,xR+w2/2+50,yP2-20,C.accent,5,16);
    text(g,'F₂ = '+fmt(r.F2)+' N',xR+w2/2+64,yP2+10,{size:15,weight:700,color:C.accent});
    // 圧力表示
    text(g,'どこでも同じ圧力 p = '+fmt(r.p/1000)+' kPa',(xL+xR)/2,base+20,{align:'center',size:14,weight:700,bg:C.paper});
    // 移動量
    line(g,[[xL-w1/2-40,top+40],[xL-w1/2-10,top+40]],C.muted,1,[3,3]);
    if(x1>0.2){ arrow(g,xL-w1/2-24,top+40,xL-w1/2-24,yP1,C.muted,1.5,8); text(g,'x₁ = '+fmt(S.P.x1)+' cm',xL-w1/2-30,(top+40+yP1)/2,{align:'right',size:13,color:C.muted}); }
    text(g,'x₂ = '+fmt(r.x2*10)+' mm（上昇）',xR-w2/2-14,top+20,{align:'right',size:13,color:C.muted});
  },
  readout(S){ const r=this.calc(S); return [
    ['面積比 A₂/A₁', fmt(r.ratio)],
    ['圧力 p = F₁/A₁', fmt(r.p/1000)+' kPa'],
    ['大ピストンの力 F₂', fmt(r.F2)+' N'],
    ['大ピストンの上昇 x₂', fmt(r.x2*10)+' mm'],
    ['仕事 F₁x₁', fmt(r.W1)+' J'],
    ['仕事 F₂x₂', fmt(r.F2*r.x2/100)+' J'],
  ]; }
});
