// 上級：ナビエ・ストークス方程式の数値解（格子ボルツマン法 D2Q9 による円柱まわりの流れ）
defineSim({
  id:'navierstokes', level:'advanced', order:5, name:'ナビエ・ストークス方程式（カルマン渦）',
  formula:'ρ(∂u/∂t + (u·∇)u) = −∇p + μ∇²u　　Re = UD/ν',
  explain:'粘性流体の運動方程式（ナビエ・ストークス方程式）を数値計算で解き、円柱まわりの流れを表示しています。左辺の慣性項（流れが速度を運ぶ効果）と右辺の粘性項の比がレイノルズ数です。Re が小さいと流れは円柱に沿って対称に流れますが、Re を上げると後ろに 1 対の渦ができ、さらに上げると渦が交互に放出されるカルマン渦列になります。ポテンシャル流（粘性なし）では現れない現象です。',
  hint:'Re を 20 → 60 → 150 と変えて流れの変化を見ましょう。色は渦度（流れの回転）で、赤が反時計回り、青が時計回りです。キャンバスをドラッグすると壁を描けます（右クリック相当の消去はボタンで）。計算は格子ボルツマン法という手法で、ナビエ・ストークス方程式と同じ流れを再現します。',
  related:['A5'],
  liveReadout:true,
  params:[
    {id:'Re',label:'レイノルズ数 Re',min:5,max:200,step:1,value:120},
    {id:'show',label:'表示',type:'select',value:'curl',options:[['curl','渦度（回転）'],['speed','速さ'],['ux','x 方向の速度（逆流が青）']]},
    {id:'speed',label:'計算の速さ（1 フレームの計算ステップ）',min:2,max:30,step:1,value:14},
  ],
  buttons:[{label:'流れをリセット',action:S=>{ cur.reset(S,true); }},{label:'描いた壁を消す',action:S=>{ cur.reset(S,false); }}],
  NX:240, NY:96, D:20, u0:0.06,
  init(S){ this.reset(S,false); S.cv=document.createElement('canvas'); S.cv.width=this.NX; S.cv.height=this.NY; S.img=S.cv.getContext('2d').createImageData(this.NX,this.NY); },
  reset(S,keepWalls){
    const NX=this.NX, NY=this.NY, N=NX*NY;
    const walls=keepWalls&&S.bar?S.bar:new Uint8Array(N);
    if(!keepWalls){ const cx=60, cy=NY/2, r=this.D/2; for(let y=0;y<NY;y++) for(let x=0;x<NX;x++) if((x-cx)**2+(y-cy)**2<=r*r) walls[x+y*NX]=1; }
    S.bar=walls;
    S.f=Array.from({length:9},()=>new Float64Array(N)); S.rho=new Float64Array(N); S.ux=new Float64Array(N); S.uy=new Float64Array(N);
    for(let i=0;i<N;i++){ const y=Math.floor(i/NX); this.eq(S,i,1,this.u0,0.002*Math.sin(y/NY*Math.PI*2)); }
    S.probe=[]; S.steps=0;
  },
  w:[4/9,1/9,1/9,1/9,1/9,1/36,1/36,1/36,1/36], ex:[0,1,0,-1,0,1,-1,-1,1], ey:[0,0,1,0,-1,1,1,-1,-1], opp:[0,3,4,1,2,7,8,5,6],
  eq(S,i,rho,ux,uy){ const u2=ux*ux+uy*uy;
    for(let k=0;k<9;k++){ const eu=this.ex[k]*ux+this.ey[k]*uy; S.f[k][i]=this.w[k]*rho*(1+3*eu+4.5*eu*eu-1.5*u2); }
    S.rho[i]=rho; S.ux[i]=ux; S.uy[i]=uy; },
  lbm(S){
    const NX=this.NX, NY=this.NY, N=NX*NY, f=S.f, w=this.w, ex=this.ex, ey=this.ey;
    const nu=this.u0*this.D/S.P.Re, omega=1/(3*nu+0.5);
    // 衝突
    for(let i=0;i<N;i++){ if(S.bar[i]) continue;
      let r=0,u=0,v=0; for(let k=0;k<9;k++){ const fk=f[k][i]; r+=fk; u+=fk*ex[k]; v+=fk*ey[k]; }
      u/=r; v/=r; S.rho[i]=r; S.ux[i]=u; S.uy[i]=v; const u2=u*u+v*v;
      for(let k=0;k<9;k++){ const eu=ex[k]*u+ey[k]*v, feq=w[k]*r*(1+3*eu+4.5*eu*eu-1.5*u2); f[k][i]+=omega*(feq-f[k][i]); } }
    // 流れ（移流）：方向ごとにずらす
    for(let k=1;k<9;k++){ const a=f[k], dx=ex[k], dy=ey[k];
      const ys=dy>0?NY-1:0, ye=dy>0?0:NY-1, sy=dy>0?-1:1, xs=dx>0?NX-1:0, xe=dx>0?0:NX-1, sx=dx>0?-1:1;
      for(let y=ys; dy>0?y>=ye:y<=ye; y+=sy){ const yy=y-dy; if(yy<0||yy>=NY) continue;
        for(let x=xs; dx>0?x>=xe:x<=xe; x+=sx){ const xx=x-dx; if(xx<0||xx>=NX) continue; a[x+y*NX]=a[xx+yy*NX]; } } }
    // 壁での跳ね返り（すべりなし条件）
    for(let i=0;i<N;i++){ if(!S.bar[i]) continue; const x=i%NX, y=(i/NX)|0;
      for(let k=1;k<9;k++){ const xn=x+ex[k], yn=y+ey[k]; if(xn<0||xn>=NX||yn<0||yn>=NY) continue; const j=xn+yn*NX; if(S.bar[j]) continue;
        f[k][j]=f[this.opp[k]][i]; }
    }
    // 入口・上下：一様流、出口：勾配ゼロ
    for(let y=0;y<NY;y++){ this.eq(S,y*NX,1,this.u0,0); const i=NX-1+y*NX, j=NX-2+y*NX; for(let k=0;k<9;k++) f[k][i]=f[k][j]; }
    for(let x=0;x<NX;x++){ this.eq(S,x,1,this.u0,0); this.eq(S,x+(NY-1)*NX,1,this.u0,0); }
    S.steps++;
    const pi=(60+4*this.D)+Math.floor(NY/2)*NX; S.probe.push(S.uy[pi]); if(S.probe.length>4000) S.probe.shift();
  },
  step(S,dt){ for(let i=0;i<S.P.speed;i++) this.lbm(S);
    // 発散したらリセット
    if(!isFinite(S.ux[NX_half(this)])) this.reset(S,true); },
  onPointer(S,ev){ if(ev==='up') return; const sc=W/this.NX, x=Math.floor(S.pointer.x/sc), y=this.NY-1-Math.floor(S.pointer.y/sc);
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const X=x+dx, Y=y+dy; if(X>2&&X<this.NX-2&&Y>0&&Y<this.NY-1){ const i=X+Y*this.NX; S.bar[i]=1; } } },
  draw(g,S){
    const C=S.C, NX=this.NX, NY=this.NY, d=S.img.data, mode=S.P.show, u0=this.u0;
    for(let y=0;y<NY;y++) for(let x=0;x<NX;x++){ const i=x+y*NX, k=4*(x+(NY-1-y)*NX);
      if(S.bar[i]){ d[k]=90; d[k+1]=100; d[k+2]=108; d[k+3]=255; continue; }
      let t;
      if(mode==='curl'){ const xm=Math.max(x-1,0), xp=Math.min(x+1,NX-1), ym=Math.max(y-1,0), yp=Math.min(y+1,NY-1);
        const c=(S.uy[xp+y*NX]-S.uy[xm+y*NX])-(S.ux[x+yp*NX]-S.ux[x+ym*NX]); t=0.5+clamp(c/u0*2.2,-0.5,0.5); }
      else if(mode==='speed'){ t=clamp(Math.hypot(S.ux[i],S.uy[i])/(u0*1.8),0,1); }
      else { t=clamp(0.5+S.ux[i]/(u0*2.4),0,1); }
      const m=heatRGB(t); d[k]=m[0]; d[k+1]=m[1]; d[k+2]=m[2]; d[k+3]=255; }
    S.cv.getContext('2d').putImageData(S.img,0,0);
    const sc=W/NX, hh=NY*sc;
    g.save(); g.imageSmoothingEnabled=true; g.drawImage(S.cv,0,0,W,hh); g.restore();
    // プローブ位置
    const px=(60+4*this.D+0.5)*sc, py=hh-(Math.floor(NY/2)+0.5)*sc; g.strokeStyle=C.ink; g.lineWidth=1.5; g.beginPath(); g.arc(px,py,5,0,7); g.stroke();
    // 下部の説明
    const y0=hh+14, Re=S.P.Re, reg=Re<5?'付着流（はく離なし）':(Re<47?'円柱の後ろに 1 対の双子渦（定常）':'カルマン渦列（渦が交互に放出）');
    text(g,'Re = '+Re+'：'+reg,16,y0+12,{size:16,weight:700});
    // プローブの時系列
    const gx=16, gy=y0+50, gw=600, gh=120; rect(g,gx,gy,gw,gh,null,C.line,1);
    const pr=S.probe.slice(-4000); const pts=pr.map((v,i)=>[gx+i/4000*gw, gy+gh/2-v/u0*gh*0.9]); line(g,pts,C.accent,1.5);
    text(g,'円柱の下流 4D の点での横方向速度 v(t)',gx+4,gy-10,{size:12,color:C.muted});
    const st=this.strouhal(S); text(g,st?'ストローハル数 St = fD/U ≈ '+fmt(st,2):'（渦の放出なし／計測中）',gx+gw+20,gy+20,{size:15,weight:700,color:C.accent});
    text(g,'参考：実験では Re = 100〜200 で St ≈ 0.16〜0.20',gx+gw+20,gy+48,{size:12,color:C.muted});
    // 色の凡例
    const lx=gx+gw+20, ly=gy+80; for(let i=0;i<160;i++){ g.fillStyle=heat(i/160); g.fillRect(lx+i,ly,1,10); }
    const lab=mode==='curl'?['時計回り','反時計回り']:(mode==='speed'?['遅い','速い']:['逆流','順流']);
    text(g,lab[0],lx,ly+22,{size:11,color:C.muted}); text(g,lab[1],lx+160,ly+22,{align:'right',size:11,color:C.muted});
  },
  strouhal(S){ const p=S.probe; if(p.length<1500) return null; const cr=[];
    for(let i=1;i<p.length;i++) if(p[i-1]<0&&p[i]>=0) cr.push(i);
    const amp=Math.max(...p.slice(-800).map(Math.abs)); if(cr.length<3||amp<this.u0*0.02) return null;
    const T=(cr[cr.length-1]-cr[1])/(cr.length-2); return this.D/(T*this.u0); },
  readout(S){ const nu=this.u0*this.D/S.P.Re, st=this.strouhal(S); return [
    ['レイノルズ数 Re = UD/ν',String(S.P.Re)],['格子の動粘性係数 ν',fmt(nu)],['緩和時間 τ = 3ν + ½',fmt(3*nu+0.5)],
    ['ストローハル数 St',st?fmt(st,2):'—'],['計算ステップ数',String(S.steps)]]; }
});
function NX_half(o){ return Math.floor(o.NX/2)+Math.floor(o.NY/2)*o.NX; }
const HEAT_LUT=Array.from({length:256},(_,i)=>heat(i/255).match(/\d+/g).map(Number));
function heatRGB(t){ return HEAT_LUT[Math.round(clamp(t,0,1)*255)]; }
