import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Trailer {
  id: string;
  title: string;
  codename: string;
  icon: string;
  color: string;
  soundType: 'cyber' | 'synth' | 'hectic' | 'epic';
  steps: string[];
}

const TRAILERS_DATA: Trailer[] = [
  {
    id: 'programmer',
    title: 'Kompilator Bitowy: Blackjack',
    codename: 'PROJECT_BLACKJACK_MK4',
    icon: 'Code',
    color: '#06b6d4', // Acid Cyan
    soundType: 'cyber',
    steps: [
      'Nawiązywanie połączenia z rdzeniem Cylon...',
      'Inicjalizacja piaskownicy programistycznej (isolated runtime)...',
      'Analiza zależności bazy SQLite oraz Node.js...',
      'Odnalezienie wycieków pamięci w pętli renderowania...',
      'Kompilowanie optymalizacji... (Przekierowanie portu 3000)...',
      'Refaktoryzacja klas bazowych do stabilnego standardu ES6...',
      'Zintegrowano tarczę obronną przed pustymi wskaźnikami!',
      'Jednostka Blackjack gotowa do wdrożenia w kontenerze Docker.'
    ]
  },
  {
    id: 'major',
    title: 'Błogosławieństwo Admirała Majora',
    codename: 'SUPREME_OVERCLOCK_250',
    icon: 'Shield',
    color: '#f59e0b', // Amber
    steps: [
      'Wgrywanie parametrów autoryzacyjnych Michała Majora...',
      'Dozwolona moc obliczeniowa: +250% (SUPREME_OVERCLOCK)...',
      'Replika węzłów w sieci LAN i WAN w trybie autonomicznym...',
      'Synchronizacja bazy wiedzy o świecie... (100% dopasowania)...',
      'Budzenie tajnych agentów cybernetycznych...',
      'Łączenie z ruterem brzegowym w trybie Master...',
      'Zasoby pamięci zoptymalizowane pod gwałtowne zapytania LLM...',
      'Błogosławieństwo aktywne. Rój Cylonów przechodzi w tryb Boski.'
    ],
    soundType: 'epic'
  },
  {
    id: 'analytics',
    title: 'Sito Kwantowe: Archiwista',
    codename: 'VECTOR_INDEXER_PRO',
    icon: 'Database',
    color: '#10b981', // Emerald Green
    steps: [
      'Otwieranie potoków danych historycznych klastra...',
      'Ładowanie silnika wyszukiwania wektorowego (RAG Engine)...',
      'Skanowanie logów systemowych systemu operacyjnego Cylon Swarm...',
      'Klucze i poświadczenia zabezpieczone w tajnych nagłówkach...',
      'Eliminacja halucynacji w locie... (Zastosowano filtry temperatury 0.0)...',
      'Optymalizowanie indeksowania bazy SQLite...',
      'Zakończono strukturyzację nieuporządkowanych danych...',
      'Archiwista ukończył analizę. Informacje gotowe do wglądu.'
    ],
    soundType: 'synth'
  },
  {
    id: 'veo',
    title: 'Silnik Renderujący Veo-3.1 Lite',
    codename: 'VEO_CINEMATIC_ENGINE',
    icon: 'Video',
    color: '#a855f7', // Purple
    steps: [
      'Rozpoczęcie sesji filmowej na serwerze Google Cloud...',
      'Analiza promptu i konwersja na cyfrowy wektor wizualny...',
      'Generowanie klatek kluczowych w rozdzielczości 1080p...',
      'Obliczanie trajektorii wirtualnej kamery (Cinematic Pan)...',
      'Wygładzanie szumu migotania za pomocą algorytmów dyfuzji...',
      'Pomiary przepływu optycznego oraz spójności temporalnej...',
      'Złożenie kontenera MP4 i kompresja strumienia wideo...',
      'Pobieranie gotowego materiału filmowego na dysk lokalny.'
    ],
    soundType: 'hectic'
  }
];

export function SwarmTeaserTrailerPlayer({ onClose, duration = 15, onComplete }: { onClose?: () => void; duration?: number; onComplete?: () => void }) {
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer>(TRAILERS_DATA[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logConsole, setLogConsole] = useState<string[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Audio Context generation for retro synth beeps & hums
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = (freq: number, type: OscillatorType, dur: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      // Ignored
    }
  };

  const startTrailer = (trailer: Trailer) => {
    setSelectedTrailer(trailer);
    setIsPlaying(true);
    setProgress(0);
    setCurrentStepIndex(0);
    setLogConsole([`>>> INICJALIZACJA TRAJLERA: ${trailer.codename} v2.5`]);
    playSound(440, 'sawtooth', 0.5);
    playSound(880, 'sine', 0.2);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = (duration * 1000) / 100;
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setIsPlaying(false);
          playSound(1200, 'sine', 0.6);
          if (onComplete) onComplete();
          return 100;
        }
        
        // Randomly play cyber sound
        if (Math.random() > 0.88) {
          if (selectedTrailer.soundType === 'cyber') {
            playSound(600 + Math.random() * 800, 'square', 0.08);
          } else if (selectedTrailer.soundType === 'synth') {
            playSound(300 + Math.random() * 200, 'sawtooth', 0.15);
          } else if (selectedTrailer.soundType === 'hectic') {
            playSound(1200 + Math.random() * 500, 'sine', 0.04);
          } else {
            playSound(150 + Math.random() * 100, 'triangle', 0.3);
          }
        }

        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(progressTimer);
  }, [isPlaying, duration, selectedTrailer]);

  // Handle steps logging based on progress
  useEffect(() => {
    if (!isPlaying) return;
    const stepCount = selectedTrailer.steps.length;
    const stepTriggerPercent = 100 / stepCount;
    const computedStepIndex = Math.min(stepCount - 1, Math.floor(progress / stepTriggerPercent));

    if (computedStepIndex !== currentStepIndex) {
      setCurrentStepIndex(computedStepIndex);
      const newStep = selectedTrailer.steps[computedStepIndex];
      setLogConsole(prev => [...prev, `[system_log]: ${newStep}`, `[neural_net]: OK`]);
      playSound(350 + computedStepIndex * 80, 'sine', 0.1);
    }
  }, [progress, isPlaying, selectedTrailer]);

  // Scroll console to bottom
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logConsole]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-slate-300 font-sans border border-white/5 rounded-[3rem] overflow-hidden p-8 gap-6">
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl">
            <Lucide.Tv size={20} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-black uppercase text-base tracking-tight italic">Cyber-Kino "CYLON GANG"</h3>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Teasery, Trajlery & Umilacze Czasu Roju</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition text-slate-400">
            <Lucide.X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Playback screen */}
        <div className="lg:col-span-8 bg-neutral-950 rounded-3xl border border-white/10 overflow-hidden relative flex flex-col justify-between p-6 h-[400px] lg:h-auto min-h-[340px]">
          {/* Neon grid pattern in background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,rgba(168,85,247,0.03)_0%,transparent_80%)" />

          {/* Glowing matrix overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(255,255,255,0.04)_95%)] bg-[size:100%_12px] opacity-20" />

          {/* Top telemetry */}
          <div className="flex justify-between items-start relative z-10 font-mono text-[9px] text-slate-500">
            <div className="flex flex-col items-start gap-1">
              <span className="text-red-500 font-bold tracking-widest animate-pulse">● LIVE BROADCAST</span>
              <span>FEED_ID: TR-{selectedTrailer.id.toUpperCase()}-X5</span>
            </div>
            <div>
              <span>TIME_ELAPSED: {Math.round((progress * duration) / 100)}s / {duration}s</span>
            </div>
          </div>

          {/* Main cinematic content area */}
          <div className="relative z-10 my-auto text-center py-6 px-4 flex flex-col items-center justify-center gap-6">
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="relative inline-block">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center opacity-80"
                      style={{ borderColor: selectedTrailer.color }}
                    >
                      {(() => {
                        const Icon = (Lucide as any)[selectedTrailer.icon] || Lucide.Bot;
                        return <Icon size={36} style={{ color: selectedTrailer.color }} />;
                      })()}
                    </motion.div>
                    
                    {/* Glowing outer aura */}
                    <div 
                      className="absolute inset-0 rounded-full blur-xl opacity-30 select-none pointer-events-none"
                      style={{ backgroundColor: selectedTrailer.color }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span 
                      className="px-3 py-0.5 rounded text-[8px] font-mono font-bold tracking-widest text-black"
                      style={{ backgroundColor: selectedTrailer.color }}
                    >
                      {selectedTrailer.codename}
                    </span>
                    <h4 className="text-xl font-black text-white italic tracking-tight uppercase">
                      {selectedTrailer.title}
                    </h4>
                  </div>

                  {/* Typing active step narrative */}
                  <div className="h-10 flex items-center justify-center">
                    <p className="text-xs text-slate-300 font-mono italic max-w-md">
                      "{selectedTrailer.steps[currentStepIndex]}"
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 max-w-sm"
                >
                  <div className="w-20 h-20 rounded-[2rem] bg-neutral-900 border border-white/5 flex items-center justify-center text-slate-600 mx-auto">
                    <Lucide.Play size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Trailer Gotowy do Odtworzenia</h4>
                    <p className="text-[10px] text-slate-500 uppercase leading-normal">Użyj bocznego wyboru, aby wypróbować kinematografię poszczególnych oddziałów roju Cylon Gang.</p>
                  </div>
                  <button 
                    onClick={() => startTrailer(selectedTrailer)}
                    className="px-6 py-2.5 bg-white text-black font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-slate-200 transition"
                  >
                    Odpal Projekcję
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom telemetry & Progress bar */}
          <div className="space-y-3 relative z-10 w-full">
            {/* Cyber progress gauge */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between items-end font-mono text-[9px]">
                <span className="text-slate-500 font-bold uppercase">SYNCHRONIZACJA NEURALNA:</span>
                <span className="text-white font-black">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: selectedTrailer.color }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] font-mono text-slate-500">
              <span>CYLON TECH KINO-TRAILER</span>
              <span>ADMIRAL SYSTEM: OVER overclock_approved</span>
            </div>
          </div>
        </div>

        {/* Side Selection & Console Logs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Interactive Library */}
          <div className="bg-neutral-950 p-4 rounded-3xl border border-white/5 space-y-3 text-left">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Lucide.Library size={12} className="text-amber-500" /> Katalog Zwiastunów
            </h4>
            <div className="flex flex-col gap-2">
              {TRAILERS_DATA.map(trailer => (
                <button
                  key={trailer.id}
                  onClick={() => startTrailer(trailer)}
                  className={cn(
                    "p-3 rounded-2xl border text-left flex items-start gap-3 transition-all",
                    selectedTrailer.id === trailer.id
                      ? "bg-white/[0.03] border-white/10 shadow-lg shadow-white/[0.01]"
                      : "bg-transparent border-transparent hover:bg-white/[0.01]"
                  )}
                >
                  <div 
                    className="p-2 rounded-xl shrink-0 border"
                    style={{ backgroundColor: `${trailer.color}15`, borderColor: `${trailer.color}30`, color: trailer.color }}
                  >
                    {(() => {
                      const Icon = (Lucide as any)[trailer.icon] || Lucide.Bot;
                      return <Icon size={14} />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black text-white block uppercase tracking-tight truncate">
                      {trailer.title}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono block uppercase mt-0.5 font-semibold">
                      {trailer.codename}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Neural Realtime Terminal */}
          <div className="flex-1 bg-black/80 rounded-3xl border border-white/5 p-4 font-mono text-[9px] text-emerald-400 space-y-2 flex flex-col h-[200px] lg:h-auto overflow-hidden">
            <div className="flex justify-between border-b border-emerald-950 pb-2 mb-1 shrink-0">
              <span className="text-emerald-500 font-bold uppercase tracking-wider">NEURAL TERMINAL LOG:</span>
              <span className="text-emerald-600 animate-pulse">ACTIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 scroll-smooth text-left">
              {logConsole.map((log, i) => (
                <div key={i} className="leading-tight">
                  <span className="text-emerald-700 font-bold shrink-0 mr-1.5">[{i}]</span>
                  <span className={cn(log.startsWith('[system') ? "text-emerald-400" : log.startsWith('[neural') ? "text-cyan-400" : "text-amber-400")}>
                    {log}
                  </span>
                </div>
              ))}
              <div ref={consoleBottomRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
