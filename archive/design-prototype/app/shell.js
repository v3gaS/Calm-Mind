/* CalmMind shell — wires DOM controls to the engine bridge + visualizers. */
(function(){
  'use strict';
  const CM=window.CalmMind, VZ=window.CalmViz;
  const $=id=>document.getElementById(id);
  const app=$('app'), canvas=$('viz');

  /* ---------- visualizer mgmt ---------- */
  let vizInst=null, vizMode='neural';
  function mountViz(mode){
    if(vizInst) vizInst.destroy();
    CM.setPalette(mode);
    vizInst=VZ[mode](canvas, ()=>CM.frame);
    vizMode=mode;
    document.querySelectorAll('[data-viz]').forEach(b=>b.classList.toggle('on', b.dataset.viz===mode));
    updateBreathVisibility();
  }
  let rT;window.addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>vizInst&&vizInst.resize(),120);});

  /* ---------- populate selects ---------- */
  const soundSel=$('soundType'), ambSel=$('ambient');
  CM.SOUND_TYPES.forEach(s=>{const o=document.createElement('option');o.value=s.key;o.textContent=s.label;soundSel.appendChild(o);});
  CM.AMBIENTS.forEach(a=>{const o=document.createElement('option');o.value=a.key;o.textContent=a.label;ambSel.appendChild(o);});

  /* ---------- presets ---------- */
  const presetRow=$('presetRow');
  CM.PRESETS.forEach(p=>{
    const b=document.createElement('button');b.className='preset';b.dataset.id=p.id;
    b.innerHTML='<span>'+p.name+'</span><span class="ps">'+p.sub+'</span>';
    if(p.id==='none')b.classList.add('on');
    b.addEventListener('click',()=>applyPreset(p));
    presetRow.appendChild(b);
  });
  let currentPhases=null;
  function setPresetActive(id){document.querySelectorAll('#presetRow .preset').forEach(b=>b.classList.toggle('on',b.dataset.id===id));}
  function applyPreset(p){
    setPresetActive(p.id);
    if(p.id==='none'){currentPhases=null;refreshReadout();return;}
    $('stress').value=p.stressLevel; $('duration').value=p.durationMin;
    soundSel.value=p.soundType; ambSel.value=p.ambientSound||'none';
    currentPhases=p.frequencyPhases||null;
    if(p.viz)mountViz(p.viz);
    syncStress();syncDuration();refreshReadout();
  }

  /* ---------- sliders ---------- */
  function stressLabel(v){return v<=2?'Deeply calm':v<=4?'Calm':v===5?'Balanced':v<=7?'Tense':'Stressed';}
  function syncStress(){const v=+$('stress').value;$('stressVal').textContent=v;$('stressLabel').textContent=stressLabel(v);}
  function syncDuration(){const v=+$('duration').value;$('durationVal').innerHTML=v+'<span style="font-size:12px"> min</span>';$('total').textContent=fmt(v*60);}
  $('stress').addEventListener('input',()=>{syncStress();markCustom();refreshReadout();});
  $('duration').addEventListener('input',()=>{syncDuration();markCustom();});
  soundSel.addEventListener('change',()=>{markCustom();refreshReadout();});
  ambSel.addEventListener('change',markCustom);
  function markCustom(){currentPhases=null;setPresetActive('none');}

  /* viz segmented (setup + dock) */
  document.querySelectorAll('#vizSeg button,#vizSeg2 button').forEach(b=>{
    b.addEventListener('click',()=>mountViz(b.dataset.viz));
  });

  /* ---------- readout ---------- */
  function fmt(s){s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
  function refreshReadout(){
    const st=soundSel.value, stress=+$('stress').value;
    const info=CM.freqInfo(st,stress);
    const label=(CM.SOUND_TYPES.find(s=>s.key===st)||{}).label||st;
    // hint (setup)
    $('soundHint').innerHTML=info.hint+(info.headphones?' <span class="hp">· headphones recommended</span>':'');
    // brain state
    $('bandName').textContent=info.band;
    $('bandHz').textContent=info.hzLabel;
    $('bandDesc').textContent=CM.BAND_DESC[info.band]||info.hint;
    const m=CM.bandMeters(info.band);
    document.querySelectorAll('#meters .fill').forEach(f=>{const v=m[f.dataset.band];f.style.width=((v!==undefined?v:0.08)*100)+'%';});
    // binaural
    $('leftHz').textContent=info.left?info.left.toFixed(info.left%1?1:0):'—';
    $('rightHz').textContent=info.right?info.right.toFixed(info.right%1?1:0):'—';
    $('beatHz').textContent=info.binaural?(info.beat+' Hz'):info.hzLabel;
    $('binNote').textContent=info.binaural?'True L/R offset — wear headphones for the beat.'
      :(st==='monaural'?'Monaural — beat is pre-mixed; speakers OK.'
      :(st==='emdrBls'?'Alternating L/R panning.':'No binaural offset for this type.'));
    // now playing
    $('nowTitle').textContent=label;
    $('nowSub').textContent='· Level '+stress+' · '+$('duration').value+' min';
    // breath rate
    CM.setBreathRate(info.breathRate);
    updateBreathVisibility();
    buildTimeline();
  }

  /* ---------- timeline ---------- */
  function buildTimeline(){
    const track=$('tlTrack'), empty=$('tlEmpty');
    track.innerHTML='';
    if(!currentPhases||!currentPhases.length){track.style.display='none';empty.style.display='block';return;}
    track.style.display='flex';empty.style.display='none';
    const total=currentPhases.reduce((a,p)=>a+p.durationSec,0);
    currentPhases.forEach((ph,i)=>{
      const d=document.createElement('div');d.className='tl-phase';
      d.style.width=(ph.durationSec/total*100)+'%';
      const t=i/(currentPhases.length-1||1);
      d.style.background='linear-gradient(180deg,rgba(167,139,250,'+(0.10+0.18*(1-t))+'),rgba(34,211,238,'+(0.10+0.18*t)+'))';
      d.innerHTML='<span>'+ph.beatHz+'Hz</span>';
      track.appendChild(d);
    });
    const prog=document.createElement('div');prog.className='tl-prog';prog.id='tlProg';prog.style.left='0%';track.appendChild(prog);
  }

  /* ---------- breath cue ---------- */
  function updateBreathVisibility(){
    const st=soundSel.value;
    const show=(st==='hrv'||st==='coherenceBreath'||vizMode==='tissue');
    $('breathCue').classList.toggle('show',show && app.classList.contains('state-playing'));
    $('breathSub').textContent = st==='hrv'?'5.5 breaths / min':'follow the bloom';
  }

  /* ---------- state transition (instant inline — capture-safe) ---------- */
  function applyState(p){
    app.classList.toggle('state-playing',p);
    app.classList.toggle('state-setup',!p);
    const s=$('setup');
    s.style.opacity=p?'0':'1';
    s.style.pointerEvents=p?'none':'auto';
    s.style.transform=p?'translate(-50%,-46%) scale(0.98)':'translate(-50%,-50%)';
    document.querySelectorAll('.edge').forEach(e=>{e.style.opacity=p?'1':'0';e.style.pointerEvents=p?'auto':'none';});
  }

  /* ---------- transport ---------- */
  let playing=false, paused=false, elapsed=0, total=600, timer=null, lastTick=0;
  function startSession(){
    refreshReadout();
    const stress=+$('stress').value, dur=+$('duration').value;
    total=dur*60; elapsed=0;
    CM.Engine.start({stress,duration:dur,ambient:ambSel.value,soundType:soundSel.value,viz:vizMode,
      options:{frequencyPhases:currentPhases}});
    CM.Engine.setVolume(+$('volume').value/100);
    applyState(true);
    $('statusText').textContent = CM.Engine.real?'SYNTHESIZING':'DEMO · NO ENGINE';
    playing=true;paused=false;setPlayIcon();lastLiveBand='';
    updateBreathVisibility();
    lastTick=performance.now();
    clearInterval(timer);timer=setInterval(tick,250);
  }
  function tick(){
    if(!playing||paused)return;
    const now=performance.now();
    const ses=CM.live.active&&CM.live.session;
    if(ses && ses.elapsedSec!=null){
      elapsed=ses.elapsedSec;
      if(ses.remainingSec!=null) total=Math.max(1,ses.elapsedSec+ses.remainingSec);
    } else {
      elapsed+=(now-lastTick)/1000;
    }
    lastTick=now;
    if(elapsed>=total){elapsed=total;render();return stopSession();}
    render();
  }
  function render(){
    const f=Math.min(1,elapsed/total);
    $('scrubDone').style.width=(f*100)+'%';$('scrubKnob').style.left=(f*100)+'%';
    $('elapsed').textContent=fmt(elapsed);
    const tp=$('tlProg');if(tp)tp.style.left=(f*100)+'%';
  }
  function setPlayIcon(){
    $('playIcon').innerHTML=(playing&&!paused)?'<path d="M6 19h4V5H6zM14 5v14h4V5z"/>':'<path d="M8 5v14l11-7z"/>';
  }
  function togglePlay(){
    if(!playing){startSession();return;}
    paused=!paused;CM.Engine.pause(paused);lastTick=performance.now();setPlayIcon();
    $('statusText').textContent=paused?'PAUSED':(CM.Engine.real?'SYNTHESIZING':'DEMO · NO ENGINE');
  }
  function stopSession(){
    clearInterval(timer);CM.Engine.stop();playing=false;paused=false;
    applyState(false);
    $('statusText').textContent='READY';$('breathCue').classList.remove('show');
  }
  $('playBtn').addEventListener('click',togglePlay);
  $('stopBtn').addEventListener('click',stopSession);
  $('editBtn').addEventListener('click',()=>{ // back to setup without killing audio context fully
    stopSession();
  });
  $('generate').addEventListener('click',startSession);

  $('volume').addEventListener('input',()=>CM.Engine.setVolume(+$('volume').value/100));
  $('scrub').addEventListener('click',(e)=>{
    if(!playing)return;const r=$('scrub').getBoundingClientRect();elapsed=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*total;render();
  });

  /* ---------- per-frame UI (amp + breath word + live session) ---------- */
  let lastBreath=0.5, lastLiveBand='';
  function highlightPhase(idx){
    const ph=$('tlTrack').querySelectorAll('.tl-phase');
    ph.forEach((el,i)=>{el.style.filter=(i===idx)?'brightness(1.7)':'';});
  }
  function uiFrame(){
    const f=CM.frame;
    $('ampFill').style.width=(Math.min(1,f.amp*1.4)*100)+'%';
    // L/R ear glow pulse with bass/treble
    if(app.classList.contains('state-playing')){
      const lr=document.querySelector('.ear.l .ring'), rr=document.querySelector('.ear.r .ring');
      if(lr)lr.style.boxShadow='0 0 '+(12+f.bass*26)+'px rgba(139,92,246,'+(0.35+f.bass*0.4)+')';
      if(rr)rr.style.boxShadow='0 0 '+(12+f.treble*26)+'px rgba(34,211,238,'+(0.35+f.treble*0.4)+')';
    }
    // live session readouts (real engine + protocol phases that shift the band over time)
    const ses=CM.live.active&&CM.live.session;
    if(ses){
      if(ses.brainBand&&ses.brainBand.label&&ses.brainBand.label!==lastLiveBand){
        lastLiveBand=ses.brainBand.label;
        $('bandName').textContent=ses.brainBand.label;
        if(CM.BAND_DESC[ses.brainBand.label])$('bandDesc').textContent=CM.BAND_DESC[ses.brainBand.label];
        const m=CM.bandMeters(ses.brainBand.label);
        document.querySelectorAll('#meters .fill').forEach(fl=>{const v=m[fl.dataset.band];fl.style.width=((v!==undefined?v:0.08)*100)+'%';});
      }
      if(ses.beatHz!=null){$('bandHz').textContent=ses.beatHz.toFixed(2)+' Hz';$('beatHz').textContent=ses.beatHz.toFixed(2)+' Hz';}
      if(ses.carrierHz!=null){$('leftHz').textContent=Math.round(ses.carrierHz);$('rightHz').textContent=(ses.beatHz?(ses.carrierHz+ses.beatHz).toFixed(1):Math.round(ses.carrierHz));}
      if(ses.phaseIndex!=null)highlightPhase(ses.phaseIndex);
    }
    // breath word
    const cue=$('breathCue');
    if(cue.classList.contains('show')){
      const rising=f.breath>lastBreath;
      $('breathWord').textContent = f.breath<0.04?'Hold': f.breath>0.96?'Hold':(rising?'Breathe in':'Breathe out');
    }
    lastBreath=f.breath;
    requestAnimationFrame(uiFrame);
  }

  /* ---------- init ---------- */
  soundSel.value='binauralRelax';
  syncStress();syncDuration();mountViz('neural');refreshReadout();
  requestAnimationFrame(uiFrame);
})();
