// ===== 2 次元の流れ場を描く道具（上級のポテンシャル流で共用） =====
// view = {cx, cy, s}：世界座標 (x, y) → 画面 (cx + x·s, cy − y·s)
// vel(x, y) → [u, v]、内部(物体の中)なら null
const FT = {
  toS(v,x,y){ return [v.cx+x*v.s, v.cy-y*v.s]; },
  toW(v,X,Y){ return [(X-v.cx)/v.s, (v.cy-Y)/v.s]; },
  // 圧力係数 Cp = 1 − |V|²/U² の色地図（オフスクリーンに描いてキャッシュ）
  heat(g, cache, key, view, vel, U, opt={}){
    if(cache.key!==key){
      const w=192, h=120, c=cache.cv||document.createElement('canvas'); c.width=w; c.height=h;
      const cx=c.getContext('2d'), img=cx.createImageData(w,h);
      for(let j=0;j<h;j++) for(let i=0;i<w;i++){
        const [x,y]=FT.toW(view,(i+0.5)/w*W,(j+0.5)/h*H), V=vel(x,y), k=(j*w+i)*4;
        if(!V){ img.data[k+3]=0; continue; }
        const cp=1-(V[0]**2+V[1]**2)/(U*U), lo=opt.lo??-3, hi=opt.hi??1, t=clamp(cp<0?0.5*(1-cp/lo):0.5+0.5*cp/hi,0,1); // Cp = 0（一様流）を中間色に
        const m=heat(t).match(/\d+/g); img.data[k]=+m[0]; img.data[k+1]=+m[1]; img.data[k+2]=+m[2]; img.data[k+3]=150;
      }
      cx.putImageData(img,0,0); cache.cv=c; cache.key=key;
    }
    g.save(); g.imageSmoothingEnabled=true; g.drawImage(cache.cv,0,0,W,H); g.restore();
  },
  // 流線を始点から前後に追跡（RK2）
  trace(view, vel, x, y, ds=0.04, n=700){
    const pts=[];
    for(const dir of [1,-1]){ let px=x, py=y; const arr=[];
      for(let i=0;i<n;i++){
        const V=vel(px,py); if(!V) break; const sp=Math.hypot(V[0],V[1]); if(sp<1e-6) break;
        const mx=px+dir*V[0]/sp*ds/2, my=py+dir*V[1]/sp*ds/2, V2=vel(mx,my); if(!V2) break;
        const s2=Math.hypot(V2[0],V2[1]); if(s2<1e-6) break;
        px+=dir*V2[0]/s2*ds; py+=dir*V2[1]/s2*ds;
        const [X,Y]=FT.toS(view,px,py); if(X<-20||X>W+20||Y<-20||Y>H+20) break;
        arr.push([X,Y]);
      }
      if(dir===1) pts.push(...arr); else pts.unshift(...arr.reverse());
    }
    return pts;
  },
  // 粒子（左端から流入、速度に比例して移動）
  advect(parts, view, vel, U, dt, spawn, k=1){
    for(const p of parts){ const V=vel(p.x,p.y);
      if(!V){ Object.assign(p,spawn()); continue; }
      const sp=Math.hypot(V[0],V[1]), f=Math.min(1, 4*U/(sp+1e-9));
      p.x+=V[0]/U*dt*k*f; p.y+=V[1]/U*dt*k*f;
      const [X,Y]=FT.toS(view,p.x,p.y); if(X>W+5||X<-5||Y<-5||Y>H+5) Object.assign(p,spawn()); }
  },
  drawParts(g,parts,view,color){ g.fillStyle=color; for(const p of parts){ const [X,Y]=FT.toS(view,p.x,p.y); g.beginPath(); g.arc(X,Y,2.2,0,7); g.fill(); } },
  legend(g,S,x,y,lo=-3,hi=1){ for(let i=0;i<160;i++){ g.fillStyle=heat(i/160); g.fillRect(x+i,y,1,10); }
    text(g,'Cp = '+lo,x,y+22,{size:11,mono:true,color:S.C.muted}); text(g,String(hi),x+160,y+22,{align:'right',size:11,mono:true,color:S.C.muted}); text(g,'0',x+80,y+22,{align:'center',size:11,mono:true,color:S.C.muted});
    text(g,'圧力：低い ← → 高い',x+80,y-10,{align:'center',size:11,color:S.C.muted}); },
};
