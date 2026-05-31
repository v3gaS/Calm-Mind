/* CalmMind visualizers — three analyser-reactive modes.
   Each factory: CalmViz.<mode>(canvas, getFrame) -> { resize(), destroy() }
   getFrame() returns the shared frame object:
     { amp, bass, mid, treble, data(Uint8Array|null), breath, playing, palette }
   palette = { a:[r,g,b] (primary), b:[r,g,b] (secondary), name }
   Canvas must be CSS-sized (width/height:100%); we read clientWidth/Height. */
(function(){
  function setup(canvas){
    const ctx=canvas.getContext('2d');
    let DPR=1,w=1,h=1;
    function resize(){
      DPR=Math.min(window.devicePixelRatio||1,2);
      const r=canvas.getBoundingClientRect();
      w=Math.max(1,r.width);h=Math.max(1,r.height);
      canvas.width=Math.round(w*DPR);canvas.height=Math.round(h*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    resize();
    return {ctx,resize,get w(){return w;},get h(){return h;}};
  }
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const rgba=(c,a)=>'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+a+')';
  const TAU=Math.PI*2;

  /* ---------------- NEURAL BLOOM ---------------- */
  function neural(canvas,getFrame){
    const S=setup(canvas);
    const N=220,nodes=[];
    for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),phi=i*2.399963229;
      nodes.push({x:Math.cos(phi)*r,y,z:Math.sin(phi)*r});}
    const edges=[];
    for(let i=0;i<N;i++){const a=nodes[i],d=[];
      for(let j=0;j<N;j++){if(i===j)continue;const dx=a.x-nodes[j].x,dy=a.y-nodes[j].y,dz=a.z-nodes[j].z;d.push({j,dist:dx*dx+dy*dy+dz*dz});}
      d.sort((p,q)=>p.dist-q.dist);for(let k=0;k<3;k++){const j=d[k].j;if(j>i)edges.push({a:i,b:j});}}
    let pulses=[],time=0,raf;
    function loop(){
      raf=requestAnimationFrame(loop);
      const {ctx,w,h}=S;const f=getFrame();const cx=w/2,cy=h/2,R=Math.min(w,h)*0.34;
      time+=0.016;ctx.clearRect(0,0,w,h);
      const A=f.a,B=f.b;
      const breath=0.5+0.5*Math.sin(time*0.45);
      const scale=R*(0.88+breath*0.12+f.amp*0.1);
      const ay=time*0.16,ax=Math.sin(time*0.12)*0.35,cY=Math.cos(ay),sY=Math.sin(ay),cX=Math.cos(ax),sX=Math.sin(ax);
      for(const n of nodes){let x1=n.x*cY-n.z*sY,z1=n.x*sY+n.z*cY,y1=n.y*cX-z1*sX,z2=n.y*sX+z1*cX;
        n.sx=cx+x1*scale;n.sy=cy+y1*scale;n.sz=z2;const dp=(z2+1)/2;n.size=0.8+dp*2.5;n.alpha=0.35+dp*0.6;n.col=mix(A,B,dp);}
      ctx.globalCompositeOperation='lighter';ctx.lineWidth=0.75;
      for(const e of edges){const a=nodes[e.a],b=nodes[e.b],d=(a.sz+b.sz)/2,al=0.05+((d+1)/2)*(0.18+f.mid*0.18),c=mix(A,B,(d+1)/2);
        ctx.strokeStyle=rgba(c,al);ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b.sx,b.sy);ctx.stroke();}
      for(let i=pulses.length-1;i>=0;i--){const p=pulses[i];p.t+=p.sp;if(p.t>=1){pulses.splice(i,1);continue;}
        const a=nodes[p.e.a],b=nodes[p.e.b],px=a.sx+(b.sx-a.sx)*p.t,py=a.sy+(b.sy-a.sy)*p.t;
        const g=ctx.createRadialGradient(px,py,0,px,py,8);g.addColorStop(0,'rgba(200,245,255,.9)');g.addColorStop(1,'rgba(140,210,255,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,8,0,TAU);ctx.fill();}
      for(const n of nodes){const c=n.col;const g=ctx.createRadialGradient(n.sx,n.sy,0,n.sx,n.sy,n.size*5.5);
        g.addColorStop(0,rgba(c,Math.min(1,n.alpha*1.3)));g.addColorStop(1,rgba(c,0));
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.sx,n.sy,n.size*5.5,0,TAU);ctx.fill();
        ctx.fillStyle='rgba(245,253,255,'+Math.min(1,n.alpha+0.3)+')';ctx.beginPath();ctx.arc(n.sx,n.sy,n.size*0.95,0,TAU);ctx.fill();}
      const coreR=scale*(0.85+breath*0.2),cg=ctx.createRadialGradient(cx,cy,0,cx,cy,coreR);
      cg.addColorStop(0,rgba(mix(A,B,0.3),0.24+breath*0.12+f.amp*0.12));cg.addColorStop(0.4,rgba(B,0.05+f.bass*0.06));cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,coreR,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='source-over';
      const rate=f.playing?(0.25+f.treble*0.8):0.12;
      if(Math.random()<rate&&edges.length)pulses.push({e:edges[(Math.random()*edges.length)|0],t:0,sp:0.014+Math.random()*0.022});
    }
    loop();
    return {resize:S.resize,destroy:()=>cancelAnimationFrame(raf)};
  }

  /* ---------------- LIVING TISSUE ---------------- */
  function tissue(canvas,getFrame){
    const S=setup(canvas);
    // offscreen layers (logical px)
    const blurC=document.createElement('canvas'), gooC=document.createElement('canvas'), bodyC=document.createElement('canvas'), rimC=document.createElement('canvas');
    const bx=blurC.getContext('2d'), gx=gooC.getContext('2d'), dx=bodyC.getContext('2d'), rx=rimC.getContext('2d');
    let lw=0,lh=0;
    function ensure(){if(S.w!==lw||S.h!==lh){lw=Math.max(1,S.w|0);lh=Math.max(1,S.h|0);
      [blurC,gooC,bodyC,rimC].forEach(c=>{c.width=lw;c.height=lh;});}}
    // cell colony: a core + orbiting cells that stretch the silhouette into pseudopods
    const cells=[{orbitR:0,orbitSp:0,size:0.46,ph:0,osc:0.10,ell:1}];
    for(let i=0;i<7;i++)cells.push({ang:Math.random()*TAU,orbitR:0.14+Math.random()*0.30,
      orbitSp:(0.10+Math.random()*0.22)*(Math.random()<0.5?1:-1),size:0.14+Math.random()*0.18,
      ph:Math.random()*TAU,osc:0.12+Math.random()*0.16,ell:0.78+Math.random()*0.36});
    // plankton drifting in an organic flow
    const pk=[];for(let i=0;i<80;i++)pk.push({a:Math.random()*TAU,rr:Math.random(),ph:Math.random()*TAU,
      size:0.5+Math.random()*2.1,sp:0.6+Math.random()*0.9,side:Math.random()<0.5});
    let time=0,raf;
    function loop(){
      raf=requestAnimationFrame(loop);ensure();
      const {ctx,w,h}=S;const f=getFrame();const cx=w/2,cy=h/2,minD=Math.min(w,h),baseR=minD*0.235;
      time+=0.016;const A=f.a,B=f.b;const v=f.breath;
      const breathS=0.80+v*0.46+f.amp*0.12;
      ctx.clearRect(0,0,w,h);

      // ---- cell positions ----
      const pos=[];
      for(const c of cells){let x=cx,y=cy;
        if(c.orbitR>0){c.ang+=c.orbitSp*0.016*(1+f.amp*0.7);
          const d=baseR*c.orbitR*breathS*(1+0.08*Math.sin(time*0.7+c.ph));
          x=cx+Math.cos(c.ang)*d;y=cy+Math.sin(c.ang)*d*c.ell*0.92;}
        const sz=baseR*c.size*breathS*(0.82+c.osc*Math.sin(time*1.15+c.ph)+f.mid*0.22);
        pos.push({x,y,sz});}

      // ---- soft metaball mask (blur of opaque circles → feathered union) ----
      bx.clearRect(0,0,lw,lh);bx.fillStyle='#fff';
      for(const p of pos){bx.beginPath();bx.arc(p.x,p.y,p.sz,0,TAU);bx.fill();}
      gx.clearRect(0,0,lw,lh);gx.filter='blur('+(minD*0.04)+'px)';gx.drawImage(blurC,0,0);gx.filter='none';
      // firm up the belly so the organism has a defined body, not a fuzzy cloud
      gx.globalCompositeOperation='lighter';gx.globalAlpha=0.85;gx.drawImage(gooC,0,0);gx.drawImage(gooC,0,0);
      gx.globalAlpha=1;gx.globalCompositeOperation='source-over';

      // ---- colored body assembled on bodyC, then clipped by the mask ----
      dx.clearRect(0,0,lw,lh);dx.globalCompositeOperation='source-over';
      const bg=dx.createRadialGradient(cx,cy-baseR*0.42,baseR*0.08,cx,cy,baseR*1.55);
      bg.addColorStop(0,rgba(mix(A,[235,255,248],0.55),1));
      bg.addColorStop(0.32,rgba(A,0.96));
      bg.addColorStop(0.66,rgba(mix(A,B,0.62),0.95));
      bg.addColorStop(1,rgba(mix(B,[0,26,34],0.45),0.95));
      dx.fillStyle=bg;dx.fillRect(0,0,lw,lh);
      // top caustic light
      const cl=dx.createRadialGradient(cx,cy-baseR*0.72,0,cx,cy-baseR*0.72,baseR*1.35);
      cl.addColorStop(0,'rgba(224,255,246,0.5)');cl.addColorStop(0.5,'rgba(150,240,255,0.07)');cl.addColorStop(1,'rgba(0,0,0,0)');
      dx.fillStyle=cl;dx.fillRect(0,0,lw,lh);
      // nuclei at each cell
      for(const p of pos){const g=dx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz*0.95);
        g.addColorStop(0,'rgba(228,255,247,'+(0.5+f.mid*0.32)+')');
        g.addColorStop(0.45,rgba(mix(A,[255,255,255],0.55),0.16));g.addColorStop(1,'rgba(0,0,0,0)');
        dx.fillStyle=g;dx.beginPath();dx.arc(p.x,p.y,p.sz*0.95,0,TAU);dx.fill();}
      // flowing veins
      dx.strokeStyle=rgba(mix(A,[255,255,255],0.35),0.10);dx.lineWidth=1;
      for(let q=0;q<6;q++){dx.beginPath();
        for(let i=0;i<=46;i++){const tt=i/46;const ang=q*1.05+tt*2.6+Math.sin(time*0.4+q)*0.4;const rr=baseR*1.2*tt;
          const x=cx+Math.cos(ang)*rr,y=cy+Math.sin(ang)*rr*0.92;i?dx.lineTo(x,y):dx.moveTo(x,y);}dx.stroke();}
      // plankton (organic drift)
      for(const m of pk){m.a+=0.004*m.sp*(1+f.amp*0.8);
        const rr=baseR*0.94*Math.sqrt(m.rr)*breathS;
        const x=cx+Math.cos(m.a)*rr+Math.sin(time*0.5*m.sp+m.ph)*baseR*0.045;
        const y=cy+Math.sin(m.a)*rr*0.92+Math.cos(time*0.4*m.sp+m.ph)*baseR*0.045;
        const tw=0.5+0.5*Math.sin(time*2.2+m.ph);
        const col=m.side?mix(A,[255,255,255],0.6):mix(B,[255,255,255],0.55);
        const g=dx.createRadialGradient(x,y,0,x,y,m.size*4.2);
        g.addColorStop(0,rgba(col,0.55+tw*0.45));g.addColorStop(1,rgba(col,0));
        dx.fillStyle=g;dx.beginPath();dx.arc(x,y,m.size*4.2,0,TAU);dx.fill();
        dx.fillStyle='rgba(246,255,251,'+(0.5+tw*0.4)+')';dx.beginPath();dx.arc(x,y,m.size*0.7,0,TAU);dx.fill();}
      // inner rim shadow for depth
      const rim=dx.createRadialGradient(cx,cy,baseR*0.5,cx,cy,baseR*1.5);
      rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(0.82,'rgba(0,22,20,0)');rim.addColorStop(1,'rgba(0,14,13,0.55)');
      dx.fillStyle=rim;dx.fillRect(0,0,lw,lh);
      // clip body to the soft metaball mask
      dx.globalCompositeOperation='destination-in';dx.drawImage(gooC,0,0);dx.globalCompositeOperation='source-over';

      // ---- luminous membrane rim (mask minus eroded mask) ----
      rx.clearRect(0,0,lw,lh);rx.globalCompositeOperation='source-over';rx.drawImage(gooC,0,0);
      rx.globalCompositeOperation='destination-out';
      rx.save();rx.translate(cx,cy);rx.scale(0.9,0.9);rx.translate(-cx,-cy);rx.drawImage(gooC,0,0);rx.restore();
      rx.globalCompositeOperation='source-in';
      const rg=rx.createRadialGradient(cx,cy-baseR*0.5,baseR*0.2,cx,cy,baseR*1.5);
      rg.addColorStop(0,'rgba(216,255,244,0.95)');rg.addColorStop(0.5,rgba(mix(A,[255,255,255],0.5),0.8));rg.addColorStop(1,rgba(B,0.7));
      rx.fillStyle=rg;rx.fillRect(0,0,lw,lh);rx.globalCompositeOperation='source-over';

      // ---- composite to screen ----
      // ambient halos behind
      ctx.globalCompositeOperation='lighter';
      for(let k=3;k>=1;k--){const rr=baseR*(1.0+k*0.4)*breathS;const g=ctx.createRadialGradient(cx,cy,baseR*0.3,cx,cy,rr);
        g.addColorStop(0,rgba(A,0.055+v*0.05));g.addColorStop(0.5,rgba(B,0.028));g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.fill();}
      // colored bloom around the organism
      ctx.filter='blur('+(minD*0.02)+'px)';ctx.globalAlpha=0.55;ctx.drawImage(bodyC,0,0,w,h);
      ctx.globalAlpha=1;ctx.filter='none';
      // crisp organism
      ctx.globalCompositeOperation='source-over';ctx.drawImage(bodyC,0,0,w,h);
      // glowing membrane
      ctx.globalCompositeOperation='lighter';
      ctx.filter='blur('+(minD*0.006)+'px)';ctx.drawImage(rimC,0,0,w,h);ctx.filter='none';
      ctx.globalCompositeOperation='source-over';
    }
    loop();
    return {resize:S.resize,destroy:()=>cancelAnimationFrame(raf)};
  }

  /* ---------------- SYNAPTIC MANDALA ---------------- */
  function mandala(canvas,getFrame){
    const S=setup(canvas);
    const SYM=12;let time=0,raf;
    function loop(){
      raf=requestAnimationFrame(loop);
      const {ctx,w,h}=S;const f=getFrame();const cx=w/2,cy=h/2,R=Math.min(w,h)*0.3;time+=0.016;
      const A=f.a,B=f.b,C=f.c||mix(A,B,0.5);
      ctx.clearRect(0,0,w,h);const breath=0.5+0.5*Math.sin(time*0.4),pulse=time*1.6;
      const col=(t,al)=>{ // A -> B -> C sweep
        let c; if(t<0.5)c=mix(A,B,t/0.5); else c=mix(B,C,(t-0.5)/0.5); return rgba(c,al);};
      ctx.globalCompositeOperation='lighter';
      const bars=72,data=f.data;
      for(let i=0;i<bars;i++){const ang=(i/bars)*TAU-Math.PI/2;const seed=i%(bars/SYM);
        let hh;
        if(data){const idx=((seed/(bars/SYM))*data.length*0.55)|0;hh=(data[idx]/255);}
        else hh=(Math.sin(seed*0.8+time*3)*0.5+0.5)*0.55+(Math.sin(seed*0.37+time*1.7)*0.5+0.5)*0.45;
        const inner=R*1.12,outer=inner+ (0.06+hh*0.18)*R*(0.8+breath*0.4);
        ctx.strokeStyle=col(i/bars,0.55);ctx.lineWidth=2.2;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(cx+Math.cos(ang)*inner,cy+Math.sin(ang)*inner);ctx.lineTo(cx+Math.cos(ang)*outer,cy+Math.sin(ang)*outer);ctx.stroke();}
      const rings=[{n:SYM,rad:0.28,dir:1},{n:SYM*2,rad:0.52,dir:-1},{n:SYM*2,rad:0.78,dir:1},{n:SYM*3,rad:1.0,dir:-1}];
      const pts=rings.map(()=>[]);
      rings.forEach((ring,ri)=>{const rot=time*0.12*ring.dir;for(let i=0;i<ring.n;i++){const ang=(i/ring.n)*TAU+rot,rr=R*ring.rad*(0.95+breath*0.07+f.amp*0.05);pts[ri].push({x:cx+Math.cos(ang)*rr,y:cy+Math.sin(ang)*rr});}});
      ctx.lineWidth=0.8;
      for(let ri=0;ri<rings.length-1;ri++){const a=pts[ri],b=pts[ri+1];
        for(let i=0;i<b.length;i++){const src=a[i%a.length],dst=b[i],t=ri/(rings.length-1),wave=0.4+0.6*(0.5+0.5*Math.sin(pulse-ri*0.9));
          ctx.strokeStyle=col(0.2+t*0.6,0.1+wave*(0.16+f.mid*0.14));ctx.beginPath();ctx.moveTo(src.x,src.y);ctx.lineTo(dst.x,dst.y);ctx.stroke();}}
      rings.forEach((ring,ri)=>{const p=pts[ri];const t=ri/(rings.length-1),wave=0.5+0.5*Math.sin(pulse-ri*0.9);
        for(const q of p){const sz=(1.3+t*2.1)*(0.7+wave*0.7);const g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,sz*5);
          g.addColorStop(0,col(0.15+t*0.7,0.9));g.addColorStop(1,col(0.15+t*0.7,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,sz*5,0,TAU);ctx.fill();
          ctx.fillStyle='rgba(245,250,255,0.95)';ctx.beginPath();ctx.arc(q.x,q.y,sz*0.7,0,TAU);ctx.fill();}});
      const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,R*0.6);
      cg.addColorStop(0,col(0.45,0.5+breath*0.25+f.amp*0.12));cg.addColorStop(0.3,col(0.4,0.18));cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,R*0.6,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(245,250,255,'+(0.7+breath*0.2)+')';ctx.beginPath();ctx.arc(cx,cy,R*0.06,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='source-over';
    }
    loop();
    return {resize:S.resize,destroy:()=>cancelAnimationFrame(raf)};
  }

  window.CalmViz={neural,tissue,mandala};
})();
