// 上級：フルード相似（船の模型試験）
defineSim({
  id:'froude', level:'advanced', order:8, name:'フルード相似（船の模型試験）',
  formula:'$$Fr = \\frac{v}{\\sqrt{gL}} \\qquad v_m = v_p\\sqrt{\\frac{L_m}{L_p}} \\qquad \\frac{F_p}{F_m} = \\frac{\\rho_p}{\\rho_m}\\left(\\frac{L_p}{L_m}\\right)^3 \\qquad \\lambda_{\\text{波}} = \\frac{2\\pi v^2}{g}$$',
  explain:'**船がつくる波（造波抵抗）は重力が復元力なので、フルード数 $Fr$ をそろえると模型と実物で同じ形の波ができます**。波の長さは $2\\pi v^2/g$ で、船の長さとの比がフルード数で決まるためです。上下の図で、船の長さに対する波の長さの比が同じになっていることを確かめましょう。',
  hint:'==フルード数をそろえたとき、レイノルズ数は模型と実物で何倍違うでしょう？== !!同じ水を使う限り、フルード数とレイノルズ数は同時にはそろえられません!!。摩擦抵抗は別の方法で補正します。「A8 の条件」で問題の状態になります。',
  related:['A8'],
  params:[
    {id:'Lp',label:'実物の長さ $L_p$',min:20,max:300,step:5,value:100,unit:'m'},
    {id:'vp',label:'実物の速さ $v_p$',min:1,max:20,step:0.5,value:10,unit:'m/s'},
    {id:'n',label:'縮尺 $1/n$',min:5,max:100,step:1,value:25,digits:0},
    {id:'Fm',label:'模型の造波抵抗 $F_m$',min:1,max:100,step:0.5,value:20,unit:'N'},
  ],
  buttons:[{label:'A8 の条件',action:S=>{ setParam('Lp',100); setParam('vp',10); setParam('n',25); setParam('Fm',20); }}],
  calc(S){ const g=9.81, Lm=S.P.Lp/S.P.n, vm=S.P.vp/Math.sqrt(S.P.n), Fr=S.P.vp/Math.sqrt(g*S.P.Lp);
    const Fp=S.P.Fm*(1025/1000)*S.P.n**3; return {g,Lm,vm,Fr,Fp,P:Fp*S.P.vp,Rep:S.P.vp*S.P.Lp/1e-6,Rem:vm*Lm/1e-6,lp:2*Math.PI*S.P.vp**2/g,lm:2*Math.PI*vm**2/g}; },
  init(S){ S.ph=0; },
  step(S,dt){ S.ph+=dt; },
  panel(g,S,y,L,v,lam,label,sub){ const C=S.C, w=880, x0=40, len=260, sc=len/L; // 船の長さを同じ画面長さで描く
    const k=2*Math.PI/(lam*sc), amp=clamp(18*(v*v/(9.81*L))*3,3,22);
    g.save(); g.fillStyle=C.water; g.globalAlpha=.55; g.beginPath(); g.moveTo(x0,y+80);
    for(let x=0;x<=w;x+=4){ const behind=x<x0+500-len/2? 1:0; const yy=y+Math.sin(k*(x)-S.ph*3)*amp*(x<520?Math.min(1,(520-x)/300):0.15); g.lineTo(x0+x,yy); }
    g.lineTo(x0+w,y+80); g.closePath(); g.fill(); g.restore();
    // 船体
    const sx=x0+520-len/2; g.fillStyle=C.solid; g.strokeStyle=C.ink; g.lineWidth=1.5; g.beginPath(); g.moveTo(sx,y-14); g.lineTo(sx+len,y-14); g.lineTo(sx+len-30,y+18); g.lineTo(sx+20,y+18); g.closePath(); g.fill(); g.stroke();
    rect(g,sx+len*0.55,y-40,len*0.25,26,C.solid,C.ink,1.5);
    arrow(g,sx+len+16,y-30,sx+len+70,y-30,C.ink,2.5,9);
    text(g,label,x0,y-64,{size:16,weight:700}); text(g,sub,x0,y-40,{size:13,color:C.muted});
    // 波長の目盛り
    const lp=lam*sc; if(lp<w){ line(g,[[x0+40,y+56],[x0+40+lp,y+56]],C.hi,2); line(g,[[x0+40,y+50],[x0+40,y+62]],C.hi,2); line(g,[[x0+40+lp,y+50],[x0+40+lp,y+62]],C.hi,2);
      text(g,'波長 '+fmt(lam)+' m',x0+40+lp/2,y+74,{align:'center',size:12,weight:700,color:C.hi}); } },
  draw(g,S){
    const C=S.C, r=this.calc(S);
    this.panel(g,S,140,S.P.Lp,S.P.vp,r.lp,'実物（海水）','L = '+fmt(S.P.Lp)+' m, v = '+fmt(S.P.vp)+' m/s');
    this.panel(g,S,360,r.Lm,r.vm,r.lm,'模型 1/'+S.P.n+'（淡水）','L = '+fmt(r.Lm)+' m, v = '+fmt(r.vm)+' m/s（拡大して表示）');
    text(g,'Fr = '+fmt(r.Fr)+'（両方で同じ）',480,250,{align:'center',size:16,weight:700,color:C.b,bg:C.paper});
    text(g,'Re：実物 '+fmt(r.Rep)+' ／ 模型 '+fmt(r.Rem)+'（'+fmt(r.Rep/r.Rem)+' 倍の差）',480,490,{align:'center',size:14,weight:700,color:C.a});
    text(g,'造波抵抗の予測 F_p = '+fmt(r.Fp/1000)+' kN、動力 '+fmt(r.P/1e6)+' MW',480,530,{align:'center',size:16,weight:700,color:C.accent});
  },
  readout(S){ const r=this.calc(S); return [
    ['フルード数 $Fr$',fmt(r.Fr)],['模型の長さ $L_m$',fmt(r.Lm)+' m'],['模型の速さ $v_m$',fmt(r.vm)+' m/s'],
    ['実物の造波抵抗 $F_p$',fmt(r.Fp/1000)+' kN'],['実物の動力 $F_p v_p$',fmt(r.P/1e6)+' MW'],['$Re_p / Re_m$',fmt(r.Rep/r.Rem)]]; }
});
