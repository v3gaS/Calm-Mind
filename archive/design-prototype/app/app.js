/* CalmMind front-end logic + engine bridge.
   Talks to the real engine via the documented window.* contract when present,
   and falls back to a self-contained demo simulation in preview. */
(function(){
  'use strict';

  /* ---------------- sound-type catalog (mirrors client/js) ---------------- */
  const SOUND_TYPES = [
    {key:'binauralRelax',   label:'Binaural · Relaxation',  group:'Binaural'},
    {key:'binauralFocus',   label:'Binaural · Focus',       group:'Binaural'},
    {key:'binauralSleep',   label:'Binaural · Sleep',       group:'Binaural'},
    {key:'isochronicEnergy',label:'Isochronic · Energy',    group:'Isochronic'},
    {key:'isochronicMeditate',label:'Isochronic · Meditation',group:'Isochronic'},
    {key:'monaural',        label:'Monaural beats',         group:'Beats'},
    {key:'gamma',           label:'Gamma waves',            group:'Brainwave'},
    {key:'hrv',             label:'HRV coherence',          group:'Brainwave'},
    {key:'solfeggio',       label:'Solfeggio frequencies',  group:'Tonal'},
    {key:'pinkNoise',       label:'Pink noise · Deep sleep',group:'Noise'},
    {key:'nature',          label:'Nature · Enhanced',      group:'Ambient'},
    {key:'soundBath',       label:'Sound bath',             group:'Tonal'},
    {key:'psychoacoustic',  label:'Psychoacoustic mood',    group:'Tonal'},
    {key:'neuroacoustic',   label:'Neuroacoustic',          group:'Brainwave'},
    {key:'emdrBls',         label:'Bilateral stimulation',  group:'Beats'},
  ];
  const HINTS = {
    binauralRelax:"Binaural beats near Earth's resonance (~7.83 Hz) for deep relaxation.",
    binauralFocus:"Beta-range binaural beats to support concentration and alertness.",
    binauralSleep:"Delta-range binaural beats for sleep and regeneration.",
    isochronicEnergy:"Isochronic pulses in higher beta for energy and motivation.",
    isochronicMeditate:"Isochronic pulses in the alpha range for calm, creative focus.",
    monaural:"Monaural beating — works without headphones; theta-oriented.",
    gamma:"40 Hz content associated with alertness and cognitive binding.",
    hrv:"Slow ~0.1 Hz modulation to pace breathing and heart-brain coherence.",
    solfeggio:"Single-tone Solfeggio-related frequency chosen by stress level.",
    pinkNoise:"Broad-spectrum pink noise to mask distractions and aid sleep.",
    nature:"Layered nature-inspired tones with gentle modulation.",
    soundBath:"Singing-bowl tones with spatial movement. Best on headphones.",
    psychoacoustic:"Harmonic stacks and gentle motion — an immersive mood wash.",
    neuroacoustic:"Clear detuned carriers for a steady focus wash.",
    emdrBls:"Alternating L/R tones (~1.5 Hz) for self-regulation. Use headphones.",
  };
  const HEADPHONES = new Set(['binauralRelax','binauralFocus','binauralSleep','emdrBls','soundBath']);

  /* ---------------- presets (mirror client/js/protocols.js) ---------------- */
  const PRESETS = [
    {id:'none', name:'Custom', sub:'Your settings'},
    {id:'anxietyReset', name:'Anxiety Reset', sub:'Alpha → theta',
      durationMin:15, soundType:'binauralRelax', stressLevel:6, ambientSound:'rain', viz:'tissue',
      frequencyPhases:[{durationSec:300,beatHz:10,carrierHz:250},{durationSec:600,beatHz:6,carrierHz:250}]},
    {id:'sleepOnset', name:'Sleep Onset', sub:'Theta → delta',
      durationMin:20, soundType:'binauralSleep', stressLevel:4, ambientSound:'ocean-calm', viz:'tissue',
      frequencyPhases:[{durationSec:420,beatHz:6,carrierHz:200},{durationSec:780,beatHz:2.5,carrierHz:180}]},
    {id:'focusSprint', name:'Focus Sprint', sub:'Sustained beta',
      durationMin:25, soundType:'isochronicEnergy', stressLevel:5, ambientSound:'none', viz:'mandala',
      frequencyPhases:[{durationSec:120,beatHz:10,carrierHz:240},{durationSec:1380,beatHz:14,carrierHz:300}]},
    {id:'coherenceBreath', name:'Coherence', sub:'5.5 bpm breathing',
      durationMin:12, soundType:'hrv', stressLevel:5, ambientSound:'none', viz:'tissue'},
    {id:'blsCalm', name:'BLS Calm', sub:'Bilateral L/R',
      durationMin:10, soundType:'emdrBls', stressLevel:6, ambientSound:'none', viz:'neural'},
  ];

  const AMBIENTS = [
    {key:'none',label:'None'},{key:'rain',label:'Rain'},{key:'rain-heavy',label:'Rain · heavy'},
    {key:'ocean',label:'Ocean'},{key:'ocean-calm',label:'Ocean · calm'},
    {key:'forest',label:'Forest'},{key:'forest-stream',label:'Forest stream'},
  ];

  /* ---------------- frequency math (mirrors audio.js exactly) ---------------- */
  function bandFromBeat(hz){
    if(hz<4) return 'Delta';
    if(hz<8) return 'Theta';
    if(hz<13) return 'Alpha';
    if(hz<30) return 'Beta';
    return 'Gamma';
  }
  const BAND_DESC = {
    Delta:'Deep sleep & regeneration. Slowest cortical rhythm.',
    Theta:'Deep relaxation, meditation & memory consolidation.',
    Alpha:'Relaxed, present awareness — the calm-but-alert state.',
    Beta:'Active concentration, alertness and engaged focus.',
    Gamma:'Peak focus & neural binding — high-level processing.',
    Coherence:'Heart-brain coherence — breath and pulse in sync.',
  };
  // returns full readout for a sound type + stress
  function freqInfo(soundType, stress){
    stress=Math.min(10,Math.max(1,stress));
    let carrier=0,beat=0,binaural=false,band,hzLabel,breathRate=null,tone=null;
    const clamp=(s)=>Math.min(10,Math.max(1,s));
    if(soundType.startsWith('binaural')){
      let s=stress;
      if(soundType==='binauralFocus') s=clamp(stress+2);
      if(soundType==='binauralSleep') s=clamp(stress-2);
      carrier = s<=3?200:s<=6?180:160;
      beat = s<=3?8:s<=6?6:4;
      binaural=true; band=bandFromBeat(beat); hzLabel=beat.toFixed(2)+' Hz';
    } else if(soundType.startsWith('isochronic')){
      let s=soundType==='isochronicEnergy'?clamp(stress+3):clamp(stress-2);
      beat = s<=3?14:s<=6?10:6; carrier = 180+s*12;
      band=bandFromBeat(beat); hzLabel=beat.toFixed(1)+' Hz pulse';
    } else if(soundType==='monaural'){
      carrier = stress<=3?200:stress<=6?160:120;
      beat = stress<=3?8:stress<=6?6:4;
      band=bandFromBeat(beat); hzLabel=beat.toFixed(1)+' Hz';
    } else if(soundType==='gamma'){
      carrier=200; beat=40; band='Gamma'; hzLabel='40 Hz';
    } else if(soundType==='hrv'){
      carrier=256; beat=0.1; band='Coherence'; hzLabel='0.1 Hz · 5.5 bpm'; breathRate=0.1;
    } else if(soundType==='solfeggio'){
      tone = stress>=8?396:stress>=6?417:stress>=4?639:stress>=2?528:852;
      carrier=tone; band='Tonal'; hzLabel=tone+' Hz';
    } else if(soundType==='psychoacoustic'){
      tone = stress<=3?432:stress<=6?396:528; carrier=tone; band='Tonal'; hzLabel=tone+' Hz base';
    } else if(soundType==='neuroacoustic'){
      carrier = 200+stress*16; beat = +(carrier*0.025).toFixed(1); binaural=true;
      band='Focus'; hzLabel='detune '+beat+' Hz';
    } else if(soundType==='emdrBls'){
      carrier=440; beat=1.5; band='Bilateral'; hzLabel='1.5 Hz pan';
    } else if(soundType==='pinkNoise'){
      band='Broadband'; hzLabel='full spectrum';
    } else if(soundType==='nature'){
      band='Ambient'; hzLabel='nature wash';
    } else if(soundType==='soundBath'){
      carrier=264; band='Harmonic'; hzLabel='bowls 264–495 Hz';
    } else { band='—'; hzLabel='—'; }
    const left = binaural?carrier:carrier;
    const right = binaural?+(carrier+beat).toFixed(2):carrier;
    return {carrier,beat,binaural,band,hzLabel,breathRate,tone,left,right,
      headphones:HEADPHONES.has(soundType),hint:HINTS[soundType]||''};
  }
  // band-meter percentages for display
  function bandMeters(band){
    const base={Delta:.16,Theta:.2,Alpha:.28,Beta:.22,Gamma:.14};
    const m=Object.assign({},base);
    if(m[band]!==undefined){for(const k in m)m[k]*=0.55;m[band]=0.88;}
    return m;
  }

  /* ---------------- palettes per visualizer ---------------- */
  const PALETTES = {
    neural:{a:[139,92,246], b:[34,211,238], c:[120,150,255]},
    tissue:{a:[16,185,129], b:[56,189,248], c:[110,243,200]},
    mandala:{a:[167,139,250], b:[34,211,238], c:[52,211,153]},
  };

  /* ---------------- shared frame + level provider ---------------- */
  const frame={amp:0,bass:0,mid:0,treble:0,data:null,breath:0.5,playing:false,
    a:PALETTES.neural.a,b:PALETTES.neural.b,c:PALETTES.neural.c};
  let analyser=null, realData=null, demoData=new Uint8Array(256);
  let breathPeriod=10.9; // seconds (overridden for hrv)
  let tStart=performance.now();
  const CMlive={active:false, session:null, peak:0}; // populated from CalmMindAudioReactive when present

  function tryAttachAnalyser(){
    if(analyser) return true;
    if(typeof window.getAnalyser==='function'){
      try{const a=window.getAnalyser(); if(a&&a.frequencyBinCount){analyser=a;realData=new Uint8Array(a.frequencyBinCount);return true;}}catch(e){}
    }
    return false;
  }
  function updateFrame(){
    const t=(performance.now()-tStart)/1000;
    const setBreath=(per)=>{const p=(t%per)/per;frame.breath=0.5-0.5*Math.cos(p*Math.PI*2);};
    let data, amp, handled=false;

    // 1) Preferred: normalized bridge (real audio energy + session metadata)
    if(frame.playing && window.CalmMindAudioReactive && typeof window.CalmMindAudioReactive.getAudioFrame==='function'){
      let af=null; try{af=window.CalmMindAudioReactive.getAudioFrame({includeSpectrum:true});}catch(e){}
      if(af){
        frame.amp=af.level||0; frame.bass=af.bass||0; frame.mid=af.mid||0; frame.treble=af.treble||0;
        frame.data=(af.spectrum&&af.spectrum.length)?af.spectrum:frame.data;
        CMlive.active=true; CMlive.session=af.session||null; CMlive.peak=af.peakFrequencyHz||0;
        const bHz=af.session&&af.session.beatHz;
        setBreath((bHz&&bHz>0&&bHz<2)?(1/bHz):breathPeriod);
        return;
      }
    }
    CMlive.active=false; CMlive.session=null;

    // 2) Secondary: raw analyser (if bridge absent but engine exposes getAnalyser)
    if(frame.playing && tryAttachAnalyser()){
      analyser.getByteFrequencyData(realData); data=realData; handled=true;
      let s=0;for(let i=0;i<data.length;i++)s+=data[i];amp=s/data.length/255;
    }

    // 3) Demo simulation (preview / no engine)
    if(!handled){
      const env=frame.playing?(0.55+0.4*frame.breath):0.0;
      for(let i=0;i<demoData.length;i++){
        const fall=Math.pow(1-i/demoData.length,1.6);
        const wob=0.5+0.5*Math.sin(i*0.20 - t*4 + Math.sin(t*0.7)*2);
        const bump=Math.exp(-Math.pow((i-(20+30*frame.breath))/26,2));
        demoData[i]=Math.max(0,Math.min(255, 255*env*(fall*(0.55+0.45*wob)+bump*0.5)));
      }
      data=demoData; let s=0;for(let i=0;i<data.length;i++)s+=data[i];amp=s/data.length/255;
    }
    setBreath(breathPeriod);
    frame.data=frame.playing?data:null;
    frame.amp=amp;
    frame.bass=range(data,0,12); frame.mid=range(data,12,90); frame.treble=range(data,90,Math.min(255,data.length));
  }
  function range(arr,a,b){let s=0,n=0;for(let i=a;i<b&&i<arr.length;i++){s+=arr[i];n++;}return n?s/n/255:0;}
  function loop(){updateFrame();requestAnimationFrame(loop);}
  loop();

  /* ---------------- engine bridge ---------------- */
  const Engine={
    real:false,
    start(s){
      this.real=false;
      try{
        if(typeof window.playGeneratedTrack==='function'){
          if(typeof window.initAudio==='function') window.initAudio();
          const vizMap=s.viz==='mandala'?'meshWave':'particles';
          window.playGeneratedTrack(s.stress, s.duration, s.ambient, s.soundType, vizMap, s.options||{});
          if(typeof window.setPlayingState==='function') window.setPlayingState(true);
          this.real=true;
        }
      }catch(e){console.warn('[CalmMind] engine start fallback to demo:',e);}
      analyser=null; // re-attach to the new graph
      tStart=performance.now();
      frame.playing=true;
      return this.real;
    },
    pause(paused){
      try{
        const ctx = typeof window.getAudioContext==='function' ? window.getAudioContext() : null;
        if(ctx){ paused?ctx.suspend():ctx.resume(); }
        if(typeof window.setPlayingState==='function') window.setPlayingState(!paused);
      }catch(e){}
      frame.playing=!paused;
    },
    stop(){
      try{
        if(typeof window.stopCurrentTrack==='function') window.stopCurrentTrack();
        if(typeof window.setPlayingState==='function') window.setPlayingState(false);
      }catch(e){}
      frame.playing=false; analyser=null;
    },
    setVolume(v){ try{ if(typeof window.setVolume==='function') window.setVolume(v); }catch(e){} },
  };

  /* expose for app shell */
  window.CalmMind = {
    SOUND_TYPES, HINTS, HEADPHONES, PRESETS, AMBIENTS, PALETTES,
    freqInfo, bandMeters, bandFromBeat, BAND_DESC, frame, Engine, live:CMlive,
    setPalette(mode){const p=PALETTES[mode]||PALETTES.neural;frame.a=p.a;frame.b=p.b;frame.c=p.c;},
    setBreathRate(hz){ breathPeriod = hz? (1/hz) : 10.9; },
  };
})();
