import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Music, Radio, Sliders, Disc, HelpCircle, X, Maximize2, Minimize2, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Interfaces for step sequencing
interface StepSequence {
  kick: boolean[];
  snare: boolean[];
  hihat: boolean[];
  skank: boolean[];
  bass: boolean[];
}

export const ReggaeSoundSystem: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  // Widget states
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(136); // Reggae double-time vibe is 130-140 BPM, or 65-70 BPM
  const [currentStep, setCurrentStep] = useState(0);
  const [riddimMode, setRiddimMode] = useState<'onedrop' | 'steppas' | 'rocksteady' | 'dub'>('onedrop');
  const [isMinimized, setIsMinimized] = useState(false);

  // Dub Delay states
  const [delayTime, setDelayTime] = useState(0.38); // Echo rate in seconds
  const [delayFeedback, setDelayFeedback] = useState(0.55); // Feedback density
  const [echoMix, setEchoMix] = useState(0.40); // Sound sending level

  // Siren states
  const [sirenActive, setSirenActive] = useState(false);
  const [sirenPitch, setSirenPitch] = useState(380); // Base frequency (Hz)
  const [sirenModSpeed, setSirenModSpeed] = useState(8); // LFO Speed (Hz)
  const [sirenWaveType, setSirenWaveType] = useState<'sine' | 'square' | 'sawtooth'>('sawtooth');

  // Master Synth Volumes
  const [bassVolume, setBassVolume] = useState(0.85);
  const [skankVolume, setSkankVolume] = useState(0.60);
  const [drumVolume, setDrumVolume] = useState(0.70);
  const [masterVolume, setMasterVolume] = useState(0.75);

  // Audio Context Ref & Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const delayFilterRef = useRef<BiquadFilterNode | null>(null);
  const delayWetRef = useRef<GainNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  // Sequencer loop refs
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  // Visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Current chord cycle ref
  const chordProgression = [
    [130.81, 164.81, 196.00], // C major (C3, E3, G3)
    [146.83, 174.61, 220.00], // D minor (D3, F3, A3)
    [110.00, 130.81, 164.81], // A minor (A2, C3, E3)
    [116.54, 146.83, 174.61]  // G minor (G2, B2, D3) or alternate
  ];
  
  const bassProgression = [
    [52.33, 65.41, 78.39, 98.00],  // C-family low notes
    [58.27, 69.30, 87.31, 110.00], // D-family
    [43.65, 55.00, 65.41, 82.41],  // A-family
    [49.00, 58.27, 73.42, 98.00]   // G-family
  ];

  const currentChordIndexRef = useRef(0);

  // Initialize Web Audio API nodes
  const initAudio = () => {
    if (audioCtxRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Master Gain Node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    masterGainNodeRef.current = masterGain;

    // Analyser Node for graphic dancing bars
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.connect(masterGain);
    analyserNodeRef.current = analyser;

    // Delay Node (The Dub Echo Chamber!)
    const delay = ctx.createDelay(2.0);
    delay.delayTime.setValueAtTime(delayTime, ctx.currentTime);
    
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(delayFeedback, ctx.currentTime);

    // Filter in the echo loop to make sounds fade and get dark/dusty just like classic tape dub delays
    const fbFilter = ctx.createBiquadFilter();
    fbFilter.type = 'lowpass';
    fbFilter.frequency.setValueAtTime(1000, ctx.currentTime);
    fbFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    const delayWet = ctx.createGain();
    delayWet.gain.setValueAtTime(echoMix, ctx.currentTime);

    // Connect feedback path
    delay.connect(fbFilter);
    fbFilter.connect(feedback);
    feedback.connect(delay); // loop back
    
    // Connect to wet output
    delay.connect(delayWet);
    delayWet.connect(analyser); // sends to analyser -> destination

    // Store refs
    delayNodeRef.current = delay;
    delayFeedbackRef.current = feedback;
    delayFilterRef.current = fbFilter;
    delayWetRef.current = delayWet;

    // Start painting visualizer
    startVisualizer();
  };

  // Sync Delay changes with live AudioNodes
  useEffect(() => {
    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.setValueAtTime(delayTime, audioCtxRef.current?.currentTime || 0);
    }
  }, [delayTime]);

  useEffect(() => {
    if (delayFeedbackRef.current) {
      delayFeedbackRef.current.gain.setValueAtTime(delayFeedback, audioCtxRef.current?.currentTime || 0);
    }
  }, [delayFeedback]);

  useEffect(() => {
    if (delayWetRef.current) {
      delayWetRef.current.gain.setValueAtTime(echoMix, audioCtxRef.current?.currentTime || 0);
    }
  }, [echoMix]);

  useEffect(() => {
    if (masterGainNodeRef.current) {
      masterGainNodeRef.current.gain.setValueAtTime(masterVolume, audioCtxRef.current?.currentTime || 0);
    }
  }, [masterVolume]);

  // Create White Noise Buffer for Hi-Hats, Snares, and Dub Crackles
  const createNoiseBuffer = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    const bufferSize = ctx.sampleRate * 0.4; // 400ms buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  // Synthesize Drum Components
  const playKick = (time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(analyserNodeRef.current || ctx.destination);

    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

    gain.gain.setValueAtTime(drumVolume * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.start(time);
    osc.stop(time + 0.2);
  };

  const playSnareRim = (time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Tone Component (Fast pitch crack)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.linearRampToValueAtTime(320, time + 0.02);
    oscGain.gain.setValueAtTime(drumVolume * 0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(oscGain);
    oscGain.connect(analyserNodeRef.current || ctx.destination);

    // Noise Component
    const noiseBuffer = createNoiseBuffer();
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.Q.setValueAtTime(1.5, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(drumVolume * 0.5, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(analyserNodeRef.current || ctx.destination);

      // Connect snare slightly to delay for that classic spacey snare dub echoing!
      if (delayNodeRef.current && echoMix > 0.15) {
        const snareEchoSend = ctx.createGain();
        snareEchoSend.gain.setValueAtTime(echoMix * 0.4, time);
        noiseGain.connect(snareEchoSend);
        snareEchoSend.connect(delayNodeRef.current);
      }

      noise.start(time);
      noise.stop(time + 0.18);
    }

    osc.start(time);
    osc.stop(time + 0.12);
  };

  const playHihat = (time: number, accent = false) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const noiseBuffer = createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const gain = ctx.createGain();
    const vol = accent ? drumVolume * 0.35 : drumVolume * 0.18;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (accent ? 0.08 : 0.04));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(analyserNodeRef.current || ctx.destination);

    noise.start(time);
    noise.stop(time + 0.1);
  };

  // Synthesize Dub Offbeat Skank (Guitar/Keyboard chop)
  const playSkankChop = (time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !analyserNodeRef.current) return;

    const chord = chordProgression[currentChordIndexRef.current];
    const skankOscGroup: OscillatorNode[] = [];
    
    // Create dual pulse-width/sawtooth oscillators for rich organ-like chord swell
    const skankGain = ctx.createGain();
    skankGain.gain.setValueAtTime(0, time);
    skankGain.gain.linearRampToValueAtTime(skankVolume * 0.35, time + 0.01);
    skankGain.gain.setValueAtTime(skankVolume * 0.35, time + 0.05); // quick gate
    skankGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    const combFilter = ctx.createBiquadFilter();
    combFilter.type = 'bandpass';
    combFilter.frequency.setValueAtTime(1100, time);
    combFilter.Q.setValueAtTime(0.9, time);

    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle'; // triangle gives a warm organ-like skank
      osc.frequency.setValueAtTime(freq * 2, time); // Pitch up one octave
      osc.connect(skankGain);
      osc.start(time);
      osc.stop(time + 0.2);
    });

    skankGain.connect(combFilter);
    combFilter.connect(analyserNodeRef.current);

    // Send skank to Space Dub Echo chamber! Perfect reggae feature.
    if (delayNodeRef.current) {
      const skankSend = ctx.createGain();
      skankSend.gain.setValueAtTime(echoMix * 0.8, time);
      combFilter.connect(skankSend);
      skankSend.connect(delayNodeRef.current);
    }
  };

  // Synthesize Heavy Dub Bass
  const playBassNote = (time: number, noteIndex: number, duration: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !analyserNodeRef.current) return;

    const bassNotes = bassProgression[currentChordIndexRef.current];
    const freq = bassNotes[noteIndex % bassNotes.length];

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const lpFilter = ctx.createBiquadFilter();

    osc.type = 'sine'; // fat pure base
    osc.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle'; // pleasant low harmonics
    osc2.frequency.setValueAtTime(freq, time);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.3; // blend
    osc2.connect(osc2Gain);
    osc2Gain.connect(gain);

    osc.connect(gain);

    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(110, time); // deep warm cutoff
    lpFilter.frequency.exponentialRampToValueAtTime(80, time + duration);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(bassVolume * 0.65, time + 0.03); // smooth attack
    gain.gain.setValueAtTime(bassVolume * 0.65, time + duration - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    gain.connect(lpFilter);
    lpFilter.connect(analyserNodeRef.current);

    osc.start(time);
    osc.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);
  };

  // Sound FX: The Infamous Reggae Dub Laser/Siren
  const triggerSpaceSiren = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx || !analyserNodeRef.current || !delayNodeRef.current) return;

    setSirenActive(true);

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const oscGain = ctx.createGain();

    osc.type = sirenWaveType;
    lfo.type = 'sine';

    // Settings
    lfo.frequency.setValueAtTime(sirenModSpeed, ctx.currentTime);
    lfoGain.gain.setValueAtTime(sirenPitch * 0.75, ctx.currentTime); // mod depth

    osc.frequency.setValueAtTime(sirenPitch, ctx.currentTime);
    oscGain.gain.setValueAtTime(0, ctx.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

    // Filter to give a squelchy dub sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.value = 5.0; // high resonance 

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(filter);
    filter.connect(oscGain);
    
    // Siren directly links to master AND sent heavily to the Space Echo loop!
    oscGain.connect(analyserNodeRef.current);
    
    const delaySend = ctx.createGain();
    delaySend.gain.setValueAtTime(0.85, ctx.currentTime); // highly wet for sirens
    oscGain.connect(delaySend);
    delaySend.connect(delayNodeRef.current);

    // Trigger
    lfo.start();
    osc.start();

    lfo.stop(ctx.currentTime + 1.8);
    osc.stop(ctx.currentTime + 1.8);

    setTimeout(() => setSirenActive(false), 1800);
  };

  // Play a random retro dub sound effect ("Chirp" / "Laser Sweep")
  const triggerDubLaser = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx || !analyserNodeRef.current || !delayNodeRef.current) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(analyserNodeRef.current);

    // Laser sweep
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    // Send to echo!
    const delaySend = ctx.createGain();
    delaySend.gain.value = 0.5;
    gain.connect(delaySend);
    delaySend.connect(delayNodeRef.current);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  // Sequencer Engine step schedule (Runs inside Lookahead Scheduler)
  const scheduleStep = (stepNumber: number, time: number) => {
    // 16 steps represents 4 beats (4 steps per beat, i.e. 16th notes)
    // One full loop is 16 steps
    const stepInBeat = stepNumber % 4; // 0, 1, 2, 3
    const beatIndex = Math.floor(stepNumber / 4); // 0, 1, 2, 3

    // Periodically shift the chord at step 0 (every measure bar)
    if (stepNumber === 0) {
      currentChordIndexRef.current = (currentChordIndexRef.current + 1) % chordProgression.length;
    }

    // --- ACCENTED DUB CHUDS & REGGAE RIDDIMS ---
    
    // Hi-hats: Reggae loves constant ticking or shuffling 16ths
    if (riddimMode === 'onedrop') {
      // Classic ticking elements
      if (stepInBeat === 0 || stepInBeat === 2) {
        playHihat(time, stepInBeat === 0);
      }
    } else {
      // Steppas / Rocksteady hihat patterns
      if (stepInBeat !== 3) {
        playHihat(time, stepInBeat === 0);
      }
    }

    // Chords (Guitar/Organ Skanks) on the standard reggae offbeats ("and" beats)
    // Beats are on steps 0, 4, 8, 12, offbeats are on 2, 6, 10, 14
    if (stepNumber === 2 || stepNumber === 6 || stepNumber === 10 || stepNumber === 14) {
      playSkankChop(time);
      // Dub delay option: sometimes double chop!
      if (riddimMode === 'dub' && Math.random() > 0.6) {
        playSkankChop(time + 0.1);
      }
    }

    // Reggae Riddim Drum Selector
    if (riddimMode === 'onedrop') {
      // One Drop riddim: Beat 1 (step 0) is empty (no kick, no snare).
      // Snare & Kick drop together strictly on Beat 3 (step 8).
      if (stepNumber === 8) {
        playSnareRim(time);
        playKick(time);
      }
      // Occasional gentle kick at starting note or fill (step 14)
      if (stepNumber === 11 && Math.random() > 0.5) {
        playKick(time);
      }
    } else if (riddimMode === 'steppas') {
      // Four on the Floor (0, 4, 8, 12) kick
      if (stepInBeat === 0) {
        playKick(time);
      }
      // Rimshot snare strictly on beats 2 and 4 (steps 4 and 12)
      if (stepNumber === 4 || stepNumber === 12) {
        playSnareRim(time);
      }
    } else if (riddimMode === 'rocksteady') {
      // Rocksteady: kick on 0, 8, 11
      if (stepNumber === 0 || stepNumber === 8 || stepNumber === 11) {
        playKick(time);
      }
      // Snare rim on beat 4 (step 12) and step 14
      if (stepNumber === 12 || stepNumber === 14) {
        playSnareRim(time);
      }
    } else {
      // Dub Mode: highly minimalistic drums, maximum space/delay
      if (stepNumber === 0 && Math.random() > 0.3) {
        playKick(time);
      }
      if (stepNumber === 8) {
        playSnareRim(time);
      }
    }

    // Bassline logic (Very syncopated, syncs to steps)
    const stepDuration = 60 / bpmRef.current / 4; // length of single 16th step in seconds
    
    if (riddimMode === 'onedrop') {
      // Bouncing walking bassline
      if (stepNumber === 0) playBassNote(time, 0, stepDuration * 2.2);
      else if (stepNumber === 3) playBassNote(time, 1, stepDuration * 1.5);
      else if (stepNumber === 5) playBassNote(time, 2, stepDuration * 1.2);
      else if (stepNumber === 8) playBassNote(time, 0, stepDuration * 2);
      else if (stepNumber === 12) playBassNote(time, 3, stepDuration * 1.5);
    } else if (riddimMode === 'steppas') {
      // Driving, galloping 16th steppas bassline
      if (stepNumber === 0) playBassNote(time, 0, stepDuration * 1.5);
      else if (stepNumber === 2) playBassNote(time, 2, stepDuration * 1.2);
      else if (stepNumber === 4) playBassNote(time, 1, stepDuration * 1.8);
      else if (stepNumber === 8) playBassNote(time, 2, stepDuration * 1.5);
      else if (stepNumber === 10) playBassNote(time, 0, stepDuration * 1.2);
      else if (stepNumber === 12) playBassNote(time, 3, stepDuration * 1.8);
    } else {
      // Minimal, heavy spacey dub bassline
      if (stepNumber === 0) playBassNote(time, 0, stepDuration * 3.5);
      else if (stepNumber === 6) playBassNote(time, 1, stepDuration * 2.5);
      else if (stepNumber === 12) playBassNote(time, 2, stepDuration * 3);
    }
  };

  // Scheduler lookahead loop using Web Audio clock
  // Schedules audio nodes ~100ms in advance
  const startScheduler = () => {
    const lookahead = 25.0; // milliseconds
    const scheduleAheadTime = 0.1; // seconds
    let lastStepTime = audioCtxRef.current ? audioCtxRef.current.currentTime : 0;
    
    nextNoteTimeRef.current = audioCtxRef.current ? audioCtxRef.current.currentTime : 0;
    let step = currentStep;

    const schedulerLoop = () => {
      if (!audioCtxRef.current) return;
      
      const currentTime = audioCtxRef.current.currentTime;
      
      // while nextNoteTime is inside schedule ahead window, schedule it!
      while (nextNoteTimeRef.current < currentTime + scheduleAheadTime) {
        scheduleStep(step, nextNoteTimeRef.current);
        
        // update next step timing based on BPM
        const stepDuration = 60 / bpmRef.current / 4; // duration of a 16th note
        nextNoteTimeRef.current += stepDuration;
        
        // advance step counter
        step = (step + 1) % 16;
        
        // set React component step counter (for visual LEDs)
        const currentStepForVisual = step;
        setCurrentStep(currentStepForVisual);
      }
      
      timerIdRef.current = window.setTimeout(schedulerLoop, lookahead);
    };

    schedulerLoop();
  };

  const stopScheduler = () => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  // Toggle Sequencer play status
  const togglePlay = () => {
    if (isPlaying) {
      stopScheduler();
      setIsPlaying(false);
    } else {
      initAudio();
      audioCtxRef.current?.resume().then(() => {
        setIsPlaying(true);
        startScheduler();
      });
    }
  };

  // Start Analyser canvas visualizer (Dancing waves)
  const startVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserNodeRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Redraw styled background with subtle Jamaican light trails
      ctx.fillStyle = 'rgba(10, 10, 10, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw custom visualizer lines (glowing frequency pillars)
      const barWidth = (canvas.width / bufferLength) * 2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.7;

        // Create Jamaican style colors spectrum
        // Lower levels: green, middle: gold, high/peaks: red
        let barColor = 'rgba(0, 255, 202, 0.85)'; // Cylon neon
        if (i < bufferLength * 0.4) {
          barColor = '#10B981'; // Green
        } else if (i < bufferLength * 0.75) {
          barColor = '#F59E0B'; // Gold / Amber
        } else {
          barColor = '#EF4444'; // Red
        }

        ctx.fillStyle = barColor;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScheduler();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-mono text-xs">
      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="w-96 rounded-3xl border border-white/10 overflow-hidden shadow-2xl overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, #121212 0%, #030303 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Header (Sound Cabinet Board) */}
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-950/20 via-amber-950/20 to-red-950/20 relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
              <div className="flex items-center gap-3">
                <Disc className={cn("text-amber-400 w-5 h-5", isPlaying && "animate-spin")} style={{ animationDuration: '3s' }} />
                <div>
                  <h4 className="font-display font-black text-white tracking-widest text-[10px] uppercase flex items-center gap-1">
                    CYLON <span className="text-emerald-400">DUB</span>
                    <span className="text-amber-400">SOUND</span>
                    <span className="text-red-500">SYSTEM</span>
                  </h4>
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Reggae Mixer & Space Siren v1.0</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-1 px-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                  title="Zminimalizuj"
                >
                  <Minimize2 size={12} />
                </button>
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                    title="Zamknij"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Visualizer and LCD screen section */}
            <div className="px-5 py-3 bg-black flex gap-3 border-b border-white/5 items-center relative">
              <canvas 
                ref={canvasRef} 
                width={140} 
                height={40} 
                className="rounded-lg border border-white/5 bg-neutral-950 flex-grow"
              />
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg text-emerald-400 text-[9px] w-28 text-center shrink-0">
                <div className="font-bold text-[8px] uppercase text-emerald-600">STATE:</div>
                <div className="text-xs font-bold font-mono tracking-widest">{isPlaying ? "PLAYING" : "STANDBY"}</div>
                <div className="text-[7px] text-emerald-600 mt-0.5 uppercase">BPM: {bpm} • STEP: {currentStep + 1}</div>
              </div>
            </div>

            {/* Jamaican Color Sequencer LED Indicator row */}
            <div className="flex px-5 py-2.5 gap-1.5 justify-between bg-zinc-950 border-b border-white/5">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const isActive = stepIdx === currentStep && isPlaying;
                // Alternate LED colors for authentic Jamaica layout!
                let ledCol = "bg-emerald-500 shadow-emerald-500/50";
                if (stepIdx >= 4 && stepIdx < 8) ledCol = "bg-amber-400 shadow-amber-400/50";
                else if (stepIdx >= 8 && stepIdx < 12) ledCol = "bg-red-500 shadow-red-500/50";
                else if (stepIdx >= 12) ledCol = "bg-emerald-500 shadow-emerald-500/50";

                return (
                  <div 
                    key={stepIdx} 
                    className={cn(
                      "w-4 h-1.5 rounded-full transition-all duration-75", 
                      isActive ? `${ledCol} shadow-[0_0_8px_4px]` : "bg-neutral-800"
                    )} 
                    title={`Step ${stepIdx + 1}`}
                  />
                );
              })}
            </div>

            {/* Play controls row */}
            <div className="p-4 bg-neutral-900/40 border-b border-white/5 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={togglePlay}
                  className={cn(
                    "w-12 h-10 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 border",
                    isPlaying 
                      ? "bg-amber-400 border-amber-500 text-black shadow-amber-400/20 font-black" 
                      : "bg-emerald-500 border-emerald-600 text-black font-black hover:bg-emerald-400"
                  )}
                  title={isPlaying ? "Wstrzymaj" : "Uruchom Reggae Beat"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <div className="flex flex-col justify-center">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Riddims</span>
                  <select
                    value={riddimMode}
                    onChange={(e) => {
                      initAudio();
                      setRiddimMode(e.target.value as any);
                    }}
                    className="bg-black border border-white/10 text-white rounded-lg text-[9px] px-2 py-1 font-bold outline-none"
                  >
                    <option value="onedrop">One Drop (Classic Organ)</option>
                    <option value="steppas">Steppas (Fat Driving Dub)</option>
                    <option value="rocksteady">Rocksteady (Smooth)</option>
                    <option value="dub">Dub Creator (Spacey Room)</option>
                  </select>
                </div>
              </div>

              {/* BPM slider */}
              <div className="w-1/3 flex flex-col justify-center">
                <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  <span>Tempo</span>
                  <span className="text-white font-mono">{bpm}</span>
                </div>
                <input 
                  type="range" 
                  min={115} 
                  max={155} 
                  value={bpm} 
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-full accent-amber-400 h-1 bg-black rounded"
                />
              </div>
            </div>

            {/* Space Dub Echo Chamber Settings */}
            <div className="p-4 border-b border-white/5 space-y-3 bg-neutral-950/40">
              <span className="text-[8px] font-black tracking-widest text-[#EF4444] uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                TAPES & SPACE DUB DELAY (Echo Chamber)
              </span>
              <div className="grid grid-cols-3 gap-3">
                {/* Delay Time */}
                <div>
                  <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase mb-1">
                    <span>Echo Speed</span>
                    <span className="text-white">{Math.round(delayTime * 1000)}ms</span>
                  </div>
                  <input 
                    type="range" 
                    min={0.15} 
                    max={0.95} 
                    step={0.05}
                    value={delayTime} 
                    onChange={(e) => { initAudio(); setDelayTime(parseFloat(e.target.value)); }}
                    className="w-full accent-emerald-400 h-1 bg-black rounded"
                  />
                </div>
                {/* Delay Feedback */}
                <div>
                  <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase mb-1">
                    <span>Dub Feedback</span>
                    <span className="text-white">{Math.round(delayFeedback * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0.1} 
                    max={0.92} 
                    step={0.05}
                    value={delayFeedback} 
                    onChange={(e) => { initAudio(); setDelayFeedback(parseFloat(e.target.value)); }}
                    className="w-full accent-amber-400 h-1 bg-black rounded"
                  />
                </div>
                {/* Echo Wet Mix */}
                <div>
                  <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase mb-1">
                    <span>Echo Wet</span>
                    <span className="text-white">{Math.round(echoMix * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0.0} 
                    max={0.9} 
                    step={0.05}
                    value={echoMix} 
                    onChange={(e) => { initAudio(); setEchoMix(parseFloat(e.target.value)); }}
                    className="w-full accent-red-500 h-1 bg-black rounded"
                  />
                </div>
              </div>
            </div>

            {/* Sirens, Lasers, Analog Trigger buttons */}
            <div className="p-4 bg-neutral-900/30 border-b border-white/5 relative">
              <div className="absolute top-0 right-0 p-1 px-2 text-[6px] font-black text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 rounded-bl-xl">ANALOG SYNTH</div>
              <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase flex items-center gap-1 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                DUB SIREN & LASER SYNTHESIZER
              </span>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* LFO Mod speed */}
                <div>
                  <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase mb-1">
                    <span>LFO Mod (Echo)</span>
                    <span className="text-white">{sirenModSpeed}Hz</span>
                  </div>
                  <input 
                    type="range" 
                    min={1} 
                    max={20} 
                    value={sirenModSpeed} 
                    onChange={(e) => setSirenModSpeed(parseInt(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-black rounded"
                  />
                </div>
                {/* Siren Pitch */}
                <div>
                  <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase mb-1">
                    <span>Tone Pitch</span>
                    <span className="text-white">{sirenPitch}Hz</span>
                  </div>
                  <input 
                    type="range" 
                    min={150} 
                    max={850} 
                    value={sirenPitch} 
                    onChange={(e) => setSirenPitch(parseInt(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-black rounded"
                  />
                </div>
              </div>

              {/* Big Red Button - Dub Siren Trigger */}
              <div className="flex gap-2">
                <button
                  onClick={triggerSpaceSiren}
                  className={cn(
                    "flex-1 h-9 rounded-xl font-bold uppercase text-[9px] flex items-center justify-center gap-2 border active:scale-95 transition-all text-white shadow-lg",
                    sirenActive 
                      ? "bg-red-500 border-red-600 shadow-red-500/20 animate-pulse" 
                      : "bg-[#DC2626] border-red-700 hover:bg-red-500 hover:shadow-red-500/10"
                  )}
                >
                  <Radio className="w-4 h-4 animate-ping" />
                  ODPAL SYRENĘ REGGAE
                </button>
                <button
                  onClick={triggerDubLaser}
                  className="w-20 h-9 rounded-xl font-bold uppercase text-[9px] bg-black border border-white/10 hover:border-emerald-400 hover:text-emerald-400 text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  title="Wypuść retro laser"
                >
                  <Zap className="w-3.5 h-3.5" />
                  LASER
                </button>
              </div>
            </div>

            {/* Volume Mix Panel */}
            <div className="p-4 space-y-3 bg-neutral-950/20 border-b border-white/5">
              <span className="text-[8px] font-black tracking-widest text-[#10B981] uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                SOUND MIXER CHANNEL (FADERS)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-[7px] font-bold uppercase text-slate-500">
                {/* Bass Volume */}
                <div className="flex flex-col items-center">
                  <div className="h-20 bg-black/40 w-5 rounded-lg border border-white/5 flex items-end p-0.5 justify-center mb-1">
                    <input 
                      type="range" 
                      min={0} 
                      max={1.2} 
                      step={0.05}
                      value={bassVolume} 
                      onChange={(e) => setBassVolume(parseFloat(e.target.value))}
                      className="accent-emerald-400 h-16 pointer-events-auto origin-bottom cursor-pointer select-none"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>
                  <span>BASS SUB</span>
                </div>
                {/* Skank Vol */}
                <div className="flex flex-col items-center">
                  <div className="h-20 bg-black/40 w-5 rounded-lg border border-white/5 flex items-end p-0.5 justify-center mb-1">
                    <input 
                      type="range" 
                      min={0} 
                      max={1.0} 
                      step={0.05}
                      value={skankVolume} 
                      onChange={(e) => setSkankVolume(parseFloat(e.target.value))}
                      className="accent-amber-400 h-16 pointer-events-auto origin-bottom cursor-pointer select-none"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>
                  <span>SKANK TRI</span>
                </div>
                {/* Drum Vol */}
                <div className="flex flex-col items-center">
                  <div className="h-20 bg-black/40 w-5 rounded-lg border border-white/5 flex items-end p-0.5 justify-center mb-1">
                    <input 
                      type="range" 
                      min={0} 
                      max={1.2} 
                      step={0.05}
                      value={drumVolume} 
                      onChange={(e) => setDrumVolume(parseFloat(e.target.value))}
                      className="accent-red-500 h-16 pointer-events-auto origin-bottom cursor-pointer select-none"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>
                  <span>DRUMS KIT</span>
                </div>
                {/* Master Volume */}
                <div className="flex flex-col items-center">
                  <div className="h-20 bg-black/45 w-5 rounded-lg border border-red-500/10 flex items-end p-0.5 justify-center mb-1 relative">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-red-400/30" />
                    <input 
                      type="range" 
                      min={0} 
                      max={1.0} 
                      step={0.05}
                      value={masterVolume} 
                      onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                      className="accent-white h-16 pointer-events-auto origin-bottom cursor-pointer select-none"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>
                  <span className="text-white font-bold text-[8px]">MASTER</span>
                </div>
              </div>
            </div>

            {/* Info footer */}
            <div className="px-5 py-3 text-[7px] text-slate-500 text-center uppercase tracking-wider bg-black/60 border-t border-white/5 font-bold flex justify-between">
              <span>SOUND SYSTEM SELECTOR</span>
              <span className="text-[#00ffca]">MICHAŁ MAJOR SWARM INC</span>
            </div>
          </motion.div>
        ) : (
          /* Minimized Badge Controller */
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsMinimized(false)}
            className="rounded-3xl border border-white/10 bg-neutral-950 p-3 px-5 flex items-center gap-3 shadow-2xl hover:border-amber-400 hover:text-amber-400 cursor-pointer active:scale-95 transition-all text-white"
          >
            <Radio className={cn("text-amber-400 w-4 h-4", isPlaying && "animate-pulse")} />
            <span className="text-[10px] font-black uppercase tracking-widest">CYLON REGGAE DUB ({isPlaying ? "LIVE" : "STANDBY"})</span>
            {isPlaying && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
