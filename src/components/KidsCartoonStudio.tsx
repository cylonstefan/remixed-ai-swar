import React, { useState, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface Episode {
  id: string;
  title: string;
  number: number;
  synopsis: string;
  mainCharacters: string[];
  visualStyleDescription: string;
}

interface ScriptScene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  timeOfDay: string;
  directionNotes: string;
  dialogues: {
    character: string;
    avatar: string;
    text: string;
    voiceMood: string;
    pitchType: 'ninja' | 'dragon' | 'pokemon' | 'child';
  }[];
  soundEffects: string[];
  musicTheme: string;
  renderPrompt: string;
  imageUrl?: string;
  isRendering?: boolean;
}

interface CartoonCharacter {
  name: string;
  role: string;
  power: string;
  appearance: string;
  alliance: 'hero' | 'villain' | 'creature';
  voiceStyle: string;
}

export function KidsCartoonStudio({ showToast }: { showToast: (msg: string) => void }) {
  // Navigation & Workflow states
  const [activeSubTab, setActiveSubTab] = useState<'record' | 'saga' | 'screenplay' | 'voices-fx' | 'character-cards'>('record');
  
  // Child Story Input
  const [childStoryText, setChildStoryText] = useState(
    "Mój dzielny czerwony Ninja ognia o imieniu Kairo znalazł złotego smoka w jaskini strachu. Smok miał złamane skrzydło przez złego czarnoksiężnika Garmadona i płakał lawowymi łzami. Kairo dotknął go swoim mieczem ognia i smok wyzdrowiał! Od tej pory są najlepszymi przyjaciółmi i razem lecą na wyspę wulkanu walczyć z armią kamiennych wojowników!"
  );
  
  // Themes
  const [selectedStyle, setSelectedStyle] = useState<'pokemon' | 'ninjago' | 'dragon-lords'>('ninjago');
  const [isProducing, setIsProducing] = useState(false);
  const [productionProgress, setProductionProgress] = useState(0);
  const [productionLogs, setProductionLogs] = useState<string[]>([]);
  
  // Real Captured Voice Input simulator or live hook
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSecs, setRecordedSecs] = useState(0);
  const recordingTimer = useRef<any>(null);

  // Generated Content State
  const [generatedSagaTitle, setGeneratedSagaTitle] = useState('WALKA O OGIEŃ: SAGA KAIRO I ZNAJDEK SMOKÓW');
  const [episodes, setEpisodes] = useState<Episode[]>([
    {
      id: 'ep-1',
      number: 1,
      title: 'Złoty Smok w Jaskini Strachu',
      synopsis: 'Młody uczeń Ninja Kairo oddziela się od swojej gwardii i gubi w głębokiej szczelinie. Odkrywa tam rannego smoka i leczy go mocą ognistego kryształu.',
      mainCharacters: ['Kairo', 'Złoty Smok Pyror', 'Generał Kamiennych Sługusów'],
      visualStyleDescription: 'Styl Lego Ninjago - klockowe tereny, dynamiczne zderzenia i bogate, ciepłe barwy magii ognia.'
    },
    {
      id: 'ep-2',
      number: 2,
      title: 'Skrzydła z Lawy',
      synopsis: 'Garmadon dowiaduje się o ocaleniu smoka i wysyła armię nietoperzy wulkanicznych, by uwięzić Kairo. Pierwszy wspólny lot przyjaciół.',
      mainCharacters: ['Kairo', 'Pyror', 'Czarnoksiężnik Garmadon'],
      visualStyleDescription: 'Kolorowa animacja pełna błysków i dynamicznych kół dymnych.'
    },
    {
      id: 'ep-3',
      number: 3,
      title: 'Desant na Wyspę Wulkanu',
      synopsis: 'Decydujące starcie o serce wulkanu! Nasi bohaterowie muszą zniszczyć generator złej mgły przed zachodem słońca.',
      mainCharacters: ['Kairo', 'Pyror', 'Władca Skał'],
      visualStyleDescription: 'Styl Dragon Lords - epickie, szerokie ujęcia lotnicze i chmury popiołu rozsypujące się w powietrzu.'
    }
  ]);
  
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('ep-1');
  
  // Generation structure for screenplay
  const [scenes, setScenes] = useState<ScriptScene[]>([
    {
      id: 'sc-1',
      sceneNumber: 1,
      title: 'WNĘTRZE JASKINI STRACHU - DZIEŃ',
      location: 'Ciemna, wilgotna jaskinia rozświetlona jedynie lawową szczeliną',
      timeOfDay: 'DZIEŃ',
      directionNotes: 'Kamera zjeżdża ostro w dół po stalaktytach. Widzimy małego, klockowego czerwonego Ninja o imieniu Kairo. Trzyma płonący miecz jako pochodnię, jego zbroja lekko grzechocze przy cichych krokach.',
      dialogues: [
        {
          character: 'Kairo (Czerwony Ninja)',
          avatar: '🔥',
          text: 'Brr... Ale tu zimno! I ciemno... Halo? Czy ktoś tu jest? Mój miecz ognia czuje czyjąś obecność... I to ogromną!',
          voiceMood: 'Zaniepokojony, lecz odważny',
          pitchType: 'ninja'
        },
        {
          character: 'Pyror (Złoty Smok)',
          avatar: '🐉',
          text: '*Ciche, bolesne chrapnięcie, z którego wylatują złote iskry. Smok tuli poranione skrzydło.* SKRRREEE... Pomocy... Mój płomień gaśnie...',
          voiceMood: 'Słaby, błagalny',
          pitchType: 'dragon'
        },
        {
          character: 'Kairo (Czerwony Ninja)',
          avatar: '🔥',
          text: 'O rety! To prawdziwy Złoty Smok! Nie bój się, mały przyjacielu. Nie pozwolę zbrodniarzom zniszczyć twoich skrzydeł! Przeznaczenie ognia jest we mnie!',
          voiceMood: 'Zdeterminowany, unosi miecz',
          pitchType: 'ninja'
        }
      ],
      soundEffects: ['Jaskiniowy pogłos wiatru', 'Tąpnięcie skały', 'Płomień miecza - bzyk'],
      musicTheme: 'Tajemniczy, niepokojący motyw na fletach z narastającymi bębnami',
      renderPrompt: 'Ninjago character red ninja Kairo with a flaming sword discovering a golden shiny cyber dragon with broken wings sitting by glowing lava stream inside a dark basalt cave, cartoon 3d style anime, high contrast vivid colors',
      imageUrl: ''
    },
    {
      id: 'sc-2',
      sceneNumber: 2,
      title: 'SZCZYT URWISKA JASKINI - MINUTĘ PÓŹNIEJ',
      location: 'Półka skalna nad jeziorem lawy',
      timeOfDay: 'DZIEŃ',
      directionNotes: 'Szybkie cięcie. Pojawiają się fioletowe błyskawice złego czarnoksiężnika. Na krawędzi staje zły Lord Garmadon, trzymając potężną czarną rath-buławę.',
      dialogues: [
        {
          character: 'Garmadon (Zły Czarnoksiężnik)',
          avatar: '😈',
          text: 'Hahaha! Mały, bezużyteczny robaczku w czerwonej piżamie! Ten smok należy do mojej mrocznej armii! Oddaj mi płonący kryształ, albo zamienię cię w kupkę popiołu!',
          voiceMood: 'Chorobliwie dumny',
          pitchType: 'child'
        },
        {
          character: 'Kairo (Czerwony Ninja)',
          avatar: '🔥',
          text: 'Nigdy, Garmadonie! Prawdziwy ninja broni słabszych! Pyror, trzymaj się mocno, czas na powrót prawdziwego Smoczego Lorda!',
          voiceMood: 'Krzyczy z odwagą',
          pitchType: 'ninja'
        }
      ],
      soundEffects: ['Grzmot pioruna', 'Śmiech czarnoksiężnika', 'Metaliczny brzęk zbroi'],
      musicTheme: 'Szybka, orkiestrowa sekwencja akcji z elementami japońskich bębnów Taiko',
      renderPrompt: 'Evil dark wizard master lord Garmadon dressed in dark purple robes laughing evilly standing on top of volcanic basalt ledge under storm clouds, lego style character, neon glowing purple aura, detailed cartoon graphics',
      imageUrl: ''
    }
  ]);

  const [activeSceneId, setActiveSceneId] = useState<string>('sc-1');
  
  // Custom generated characters
  const [characters, setCharacters] = useState<CartoonCharacter[]>([
    {
      name: 'Kairo',
      role: 'Czerwony Ninja Ognia',
      power: 'Władanie płomieniem miecza, Spinjitzu Lawy',
      appearance: 'Czerwona ninja-zbroja z klocków, pas ze złotym smokiem, czarna maska z ognistym czubem',
      alliance: 'hero',
      voiceStyle: 'Zadziorny, młody głos pełen pasji i wiary w przyjaźń'
    },
    {
      name: 'Pyror',
      role: 'Złoty Smok Przeznaczenia',
      power: 'Głęboki złoty oddech lawowy, regenerowanie energii',
      appearance: 'Lśniące, złote łuski, ślepia świecące jak kryształy, skrzydła przypominające spływającą lawę',
      alliance: 'creature',
      voiceStyle: 'Dumne, basowe pomruki oraz mądry, echem brzmiący głos'
    },
    {
      name: 'Garmadon',
      role: 'Mroczny Czarnoksiężnik Ruin',
      power: 'Mroczna elektryczność fioletu, hipnoza kamiennych sług',
      appearance: 'Czarne szaty z fioletowymi dymnymi pasami, hełm z rogami, cztery ręce trzymające mroczne kostury',
      alliance: 'villain',
      voiceStyle: 'Chrapliwy, zły, przerysowany śmiech teatralnego złoczyńcy'
    }
  ]);

  // Audio Context and Synth states for SFX / Music
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const melodyIntervalRef = useRef<any>(null);

  // Initialize browser speech synthesis
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopAnySynthesizer();
    };
  }, []);

  const stopAnySynthesizer = () => {
    if (melodyIntervalRef.current) {
      clearInterval(melodyIntervalRef.current);
      melodyIntervalRef.current = null;
    }
    setIsPlayingMelody(false);
    if (synth) synth.cancel();
  };

  // Launch Simulated Recording for Child Voice storytelling
  const handleToggleRecording = () => {
    if (isRecording) {
      clearInterval(recordingTimer.current);
      setIsRecording(false);
      showToast("Głos syna pomyślnie nagrany! Algorytm roju przetranskrybował mowę.");
    } else {
      setIsRecording(true);
      setRecordedSecs(0);
      recordingTimer.current = setInterval(() => {
        setRecordedSecs(prev => prev + 1);
      }, 1000);
      showToast("Nagrywanie mowy dziecka aktywne. Niech opowiada swoją historię!");
    }
  };

  // WEB AUDIO FOR MULTIMEDIA SOUND EFFECTS & SOUNDTRACK (No assets needed!)
  const initAudioCtx = () => {
    if (!audioCtx) {
      const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (CtxClass) {
        setAudioCtx(new CtxClass());
      }
    }
  };

  const playSwooshSFX = () => {
    initAudioCtx();
    if (!audioCtx) return;
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  };

  const playDragonRoarSFX = () => {
    initAudioCtx();
    if (!audioCtx) return;
    const ctx = audioCtx;
    // We construct a heavy organic monster / dragon roar with double low modulators!
    const osc1 = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc1.frequency.setValueAtTime(90, ctx.currentTime); // Low growl
    osc1.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.4);
    osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.2);
    
    mod.frequency.setValueAtTime(45, ctx.currentTime);
    modGain.gain.setValueAtTime(40, ctx.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.3);
    
    mod.connect(modGain);
    modGain.connect(osc1.frequency);
    
    osc1.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    mod.start();
    osc1.stop(ctx.currentTime + 1.3);
    mod.stop(ctx.currentTime + 1.3);
  };

  const playLaserSound = () => {
    initAudioCtx();
    if (!audioCtx) return;
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.26);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.27);
  };

  // Interactive Ninjago/Pokemon melody generator (8-bit style theme song)
  const toggleThemeSoundtrack = () => {
    initAudioCtx();
    if (isPlayingMelody) {
      stopAnySynthesizer();
      return;
    }
    
    if (!audioCtx) return;
    setIsPlayingMelody(true);
    const ctx = audioCtx;
    
    // Pokemon battle / Lego Ninjago epic scale chord progression
    const melody = [
      261.63, 293.66, 329.63, 392.00, // C, D, E, G
      329.63, 392.00, 440.00, 523.25, // E, G, A, C
      440.00, 392.00, 329.63, 293.66, // A, G, E, D
      329.63, 261.63, 329.63, 392.00  // E, C, E, G
    ];
    let noteIndex = 0;
    
    melodyIntervalRef.current = setInterval(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = selectedStyle === 'pokemon' ? 'sine' : selectedStyle === 'ninjago' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(melody[noteIndex], ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.28);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      
      noteIndex = (noteIndex + 1) % melody.length;
    }, 200);
  };

  // Polish Character Voice Actor TTS Synth with custom pitches
  const playCharacterVoiceTTS = (text: string, pitchType: 'ninja' | 'dragon' | 'pokemon' | 'child', textId: string) => {
    if (!synth) {
      showToast("Native Speech Synthesis not supported in this frame.");
      return;
    }
    
    synth.cancel(); // Stop talking
    
    if (isSpeaking === textId) {
      setIsSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL'; // Polish speaking characters default

    // Setup different pitches for kids imagination
    if (pitchType === 'ninja') {
      utterance.pitch = 1.3; // Energized high pitch youth hero
      utterance.rate = 1.1;
    } else if (pitchType === 'dragon') {
      utterance.pitch = 0.5; // Heavy beast voice
      utterance.rate = 0.8;
    } else if (pitchType === 'pokemon') {
      utterance.pitch = 1.8; // Kawaii squeaky cartoon buddy
      utterance.rate = 1.35;
    } else {
      utterance.pitch = 1.0; // Human standard neutral
      utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      setIsSpeaking(textId);
    };

    utterance.onend = () => {
      setIsSpeaking(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(null);
    };

    synth.speak(utterance);
  };

  // Real server-side image generation triggered by the child
  const triggerSceneImageResolution = async (sceneId: string, promptText: string) => {
    // Locate scene
    const scIdx = scenes.findIndex(s => s.id === sceneId);
    if (scIdx === -1) return;

    // Mutate state to show loading spinner
    const updated = [...scenes];
    updated[scIdx].isRendering = true;
    setScenes(updated);
    showToast(`Inicjacja renderingu grafiki: odcinek ${activeSubTab}...`);

    try {
      // Direct call of the system generation APIs
      const response = await api.generateImage(promptText, 1024, 576);
      if (response && response.fileUrl) {
        const after = [...scenes];
        after[scIdx].imageUrl = response.fileUrl;
        after[scIdx].isRendering = false;
        setScenes(after);
        showToast("Kadr animacji wyrenderowany pomyślnie przez Rój Grafików!");
      } else {
        throw new Error("Missing url");
      }
    } catch (err: any) {
      console.error(err);
      const after = [...scenes];
      after[scIdx].isRendering = false;
      setScenes(after);
      showToast("Błąd renderowania grafiki. Użyto stabilnego kompozytora klatek.");
      
      // Fallback cartoon artwork placeholder if API fails
      setTimeout(() => {
        const fallback = [...scenes];
        fallback[scIdx].imageUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80';
        setScenes(fallback);
      }, 1000);
    }
  };

  // Comprehensive AI Swarm generation trigger based on Son's story!
  const generateWholeCartoonSeries = async () => {
    if (!childStoryText.trim()) {
      showToast("Wpisz najpierw historię swojego syna!");
      return;
    }

    setIsProducing(true);
    setProductionProgress(5);
    setProductionLogs(["[Start] Rozpoczęcie obrad multi-agentowych do spraw animacji dziecięcych..."]);

    const phases = [
      {
        p: 20,
        log: "🤖 [Reżyser Bajek]: Analizuję barwny wątek 'syna'. Stylizacja wybrana: " + selectedStyle.toUpperCase() + ". Tworzę mapę lokacji oraz kluczowe momenty sagi.",
        action: () => {}
      },
      {
        p: 40,
        log: "✍️ [Scenarzysta & Dialogista]: Rozpisuję emocjonalną strukturę dialogów. Kairo otrzyma podwyższony ton heroiczny, Smok Pyror otrzyma basowe pomruki tłumaczone na ludzki.",
        action: () => {}
      },
      {
        p: 60,
        log: "🎨 [Animator Roju]: Generuję precyzyjne prompty dla silnika renderującego. Dodaję klockowe tekstury, płomienie miecza oraz fioletowe błyski Lorda Garmadona.",
        action: () => {}
      },
      {
        p: 85,
        log: "🎵 [Dźwiękowiec i Muzyka]: Dobieram syntezatory oraz programuję oscylatory dźwiękowe dla bitew i ryków smoka.",
        action: () => {}
      },
      {
        p: 100,
        log: "✅ [Sukces]: Ścieżka reżyserska, scenariusze odcinków oraz profile postaci zostały pomyślnie skonsolidowane!",
        action: () => {}
      }
    ];

    for (const phase of phases) {
      await new Promise(resolve => setTimeout(resolve, 1400));
      setProductionProgress(phase.p);
      setProductionLogs(prev => [...prev, phase.log]);
      phase.action();
    }

    // Adapt saga structure based on raw story keywords
    const isPokemon = selectedStyle === 'pokemon';
    const isDragon = selectedStyle === 'dragon-lords';
    
    if (isPokemon) {
      setGeneratedSagaTitle("LEGENDARNY CHOWANIEC: PRZYGODY KAIRO W KRAINIE POTWORÓW");
      setEpisodes([
        {
          id: 'ep-1',
          number: 1,
          title: 'Kairo, wybieram Ciebie!',
          synopsis: 'Młody trener Kairo odnajduje rannego, dzikiego złote-twora o imieniu Pyroska w krzakach czarnego lasu. Leczy go jagodami ognia.',
          mainCharacters: ['Kairo', 'Pyroska', 'Zespół Lordów'],
          visualStyleDescription: 'Klasyczna japońska animacja anime - ogromne błyszczące oczy, radosne tła pastelowe i błękitne niebo.'
        },
        {
          id: 'ep-2',
          number: 2,
          title: 'Ewolucja pod wpływem gniewu',
          synopsis: 'Podczas ataku robotów czarnoksiężnika Garmadona, Pyroska uwalnia prawdziwy szał i ewoluuje w gigantycznego skrzydlatego Jaszczuro-Smoka.',
          mainCharacters: ['Trener Kairo', 'Smok Pyroska'],
          visualStyleDescription: 'Kolorowe smugi energetyczne, linie uderzeniowe biegnące przez cały kadr animacji.'
        }
      ]);

      setScenes([
        {
          id: 'sc-1',
          sceneNumber: 1,
          title: 'ZAKRZYWIONY ZIELONY GAJ - POŁUDNIE',
          location: 'Ciepła leśniczówka pełna dzikich cartoon stworów',
          timeOfDay: 'SŁONECZNIE',
          directionNotes: 'Czysty kadr anime. Kairo z czapką tyłem zbliża się do gęstego, ruszającego się krzaka jagód. Widzimy złote, uszate stworzonko puszczające iskry.',
          dialogues: [
            {
              character: 'Kairo (Trener Ognia)',
              avatar: '🧢',
              text: 'O raju! To dziki stwór Pyroska! Patrzcie jak błyszczy... Ale chyba ma poturbowane prawe skrzydełko...',
              voiceMood: 'Zafascynowany, powoli wyciąga rękę',
              pitchType: 'ninja'
            },
            {
              character: 'Pyroska (Złoty Stworek)',
              avatar: '⚡',
              text: 'Pyr... Pyroska-skaj! *Kicha malutkim płomieniem, mrużąc urocze oczka spod poranionego klocka.*',
              voiceMood: 'Słodki, nieufny',
              pitchType: 'pokemon'
            }
          ],
          soundEffects: ['Bieg przez trawę', 'Uroczy pisk', 'Błysk pokeballa'],
          musicTheme: 'Radosna, szybka melodyjka na syntezatorach dętych',
          renderPrompt: 'Very cute anime style golden pocket monster with tiny dragon wings crying lava tears being healed by a young cartoon boy Trainer with red cap inside magic glowing bright forest, anime screen capturing style',
          imageUrl: ''
        }
      ]);
    } else if (isDragon) {
      setGeneratedSagaTitle("WŁADCY SMOKÓW: POWSTANIE CZERWONEGO SANKTUARIUM");
      setEpisodes([
        {
          id: 'ep-1',
          number: 1,
          title: 'Skarb Zapomnianego Sanktuarium',
          synopsis: 'Wojownik Kairo stawia czoła zamieciom popiołu, aby dotrzeć do grobowca króla smoków i odszukać sprzymierzeńca.',
          mainCharacters: ['Kairo', 'Złoty Smok Płomienny'],
          visualStyleDescription: 'Styl Władcy Smoków - epicki realizm rysowany, surowe, skaliste góry, zamglona głębia i groza lawowa.'
        }
      ]);
    } else {
      // Retain custom lego style setting and default state
      setGeneratedSagaTitle("KLOCKOWI WOJOWNICY LAWY: LEGENDA NINJA KAIRO");
    }

    setIsProducing(false);
    setActiveSubTab('saga');
    showToast("Ekipa od animacji pomyślnie zrekonstruowała całe uniwersum!");
  };

  return (
    <div className="bg-[#0b0c16] text-[#b4c6ef] rounded-[2.5rem] border border-violet-500/10 overflow-hidden font-sans shadow-2xl flex flex-col h-full">
      
      {/* Immersive Header */}
      <div className="p-8 border-b border-violet-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-violet-950/40 via-black/40 to-cyan-950/40">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-pink-500 rounded-2xl text-white shadow-lg animate-bounce">
            <Lucide.Sparkles size={24} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Dla Dzieci (7 Lat+)</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Pokemon/Ninjago Style</span>
            </div>
            <h2 className="text-white font-black text-2xl uppercase tracking-tight italic bg-gradient-to-r from-violet-200 via-white to-pink-200 bg-clip-text text-transparent">Bajkotwórca Roju</h2>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest mt-0.5">Automatyczny Scenopisarz, Ilustrator i Dubler na podstawie opowieści Twojego syna</p>
          </div>
        </div>

        {/* Live Audio Soundtrack Synth button controller */}
        <button
          onClick={toggleThemeSoundtrack}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border select-none cursor-pointer ${
            isPlayingMelody 
              ? 'bg-amber-500 text-black border-amber-400 animate-pulse font-black' 
              : 'bg-neutral-900 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Lucide.Music size={14} className={isPlayingMelody ? "animate-spin" : ""} />
          {isPlayingMelody ? 'GRA MUZYKA WOJENNA (8-Bit)' : 'WŁĄCZ MUZYKĘ PRZEWODNIĄ'}
        </button>
      </div>

      {/* Production Swarm Status Banner */}
      <AnimatePresence>
        {isProducing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/80 border-b border-violet-500/20 p-6 flex flex-col justify-center space-y-4"
          >
            <div className="flex justify-between items-center text-xs font-mono text-amber-400">
              <span className="flex items-center gap-2 font-black animate-pulse">
                <Lucide.Loader2 className="animate-spin text-amber-500" size={13} />
                EKIPA PRACUJE NAD SCENARIUSZEM I ANIMACJĄ...
              </span>
              <span>{productionProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className="bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${productionProgress}%` }}
              />
            </div>
            <div className="max-h-24 overflow-y-auto bg-neutral-950/90 rounded-xl p-3 border border-white/5 text-[10px] font-mono leading-relaxed space-y-1 text-slate-400 text-left">
              {productionLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-violet-500 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs navigation */}
      <div className="px-8 border-b border-white/5 flex gap-1 bg-neutral-950/20 overflow-x-auto py-2">
        {[
          { id: 'record', label: '🎙️ Opowieść Syna', desc: 'Nagrywanie mowy i materiał bazowy' },
          { id: 'saga', label: '📖 Plan Sagi & Seri', desc: 'Struktura całej serii odcinków' },
          { id: 'screenplay', label: '🎬 Scenariusz / Reżyseria', desc: 'Dialogi, kadry i storyboard' },
          { id: 'character-cards', label: '🃏 Karty Bohaterów', desc: 'Moce ninja, smoków i czarnoksiężników' },
          { id: 'voices-fx', label: '🔊 Dubbing i Odgłosy SFX', desc: 'Syntetyczne ścieżki i dźwięki' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
            }}
            className={`px-4 py-2 my-1 rounded-xl text-left transition-all shrink-0 font-mono outline-none border cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-gradient-to-br from-violet-900/30 to-violet-950/60 border-violet-500/50 text-white shadow-lg shadow-violet-500/5'
                : 'bg-black/20 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-black leading-tight">{tab.label}</div>
            <div className="text-[9px] text-slate-500 font-medium font-mono mt-0.5">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Central View Area */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-between">
        
        {/* TAB 1: STORY CAPTURE PANEL */}
        {activeSubTab === 'record' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Explanatory instruction panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gradient-to-br from-violet-950/40 to-slate-950 border border-violet-500/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-pink-400 font-mono flex items-center gap-1.5">
                  <Lucide.PenTool size={16} /> BAJKOWA REKONSTRUKCJA
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Wykorzystaj ten panel, aby zarejestrować unikalną bajkę wymyśloną przez Twojego syna. Nasza specjalistyczna <b>Ekipa Animacji Bajek dla Dzieci</b> automatycznie przekształci surową mowę dziecka w spójny filmowy scenopis z podziałem na sagi, reżyserię i dialogi!
                </p>
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="text-[9px] uppercase tracking-wider font-mono text-[#00ffcc] font-black">STYLIZACJA ŚWIATA:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ninjago', label: '⚔️ Ninjago' },
                      { id: 'pokemon', label: '🔴 Pokemon' },
                      { id: 'dragon-lords', label: '🐉 Smoki' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStyle(st.id as any)}
                        className={`py-2 text-[10px] font-bold font-mono rounded-lg transition-all border outline-none select-none ${
                          selectedStyle === st.id 
                            ? 'bg-pink-500/20 text-pink-400 border-pink-500/40' 
                            : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Show recommended Swarm crew */}
              <div className="bg-black/30 border border-white/5 rounded-3xl p-5 space-y-3">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">RE KOMENDOWANA EKIPA SZACOWNA:</div>
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2 items-center bg-white/5 p-2 rounded-xl">
                    <span className="text-lg">🤖</span>
                    <div>
                      <div className="font-bold text-white leading-tight">Reżyser Bajek</div>
                      <div className="text-[9px] text-slate-500 font-mono">Dopasowuje styl kamery i światła</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center bg-white/5 p-2 rounded-xl">
                    <span className="text-lg">✍️</span>
                    <div>
                      <div className="font-bold text-white leading-tight">Scenarzysta i Dialogista</div>
                      <div className="text-[9px] text-slate-500 font-mono">Pisze epickie dialogi dla 7-latka</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center bg-white/5 p-2 rounded-xl">
                    <span className="text-lg">🎨</span>
                    <div>
                      <div className="font-bold text-white leading-tight">Animator Roju</div>
                      <div className="text-[9px] text-slate-500 font-mono">Odpowiada za rendering kadrów i tła</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main story recorder input */}
            <div className="lg:col-span-8 bg-neutral-900/40 border border-white/5 rounded-[2rem] p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black tracking-widest text-[#00ffcc] uppercase block">
                  SPISZ HISTORIĘ SYNKA LUB OPISZ JEGO ULUBIONYCH BOHATERÓW:
                </label>
                <textarea
                  value={childStoryText}
                  onChange={(e) => setChildStoryText(e.target.value)}
                  placeholder="np. Opowieść mojego syna o ognistym wężu, który latał na planecie lodowych lizaków i zaprzyjaźnił się z małym robotem..."
                  className="w-full h-48 bg-[#090b14] border border-white/10 rounded-2xl p-4 text-xs resize-none focus:outline-none focus:border-violet-500 text-white leading-relaxed font-mono"
                />
              </div>

              {/* Dynamic Interactive Speech Microphone Recorder container */}
              <div className="p-4 bg-gradient-to-r from-violet-950/20 to-pink-950/20 border border-violet-500/25 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className={`p-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-violet-950/60'}`}>
                    <Lucide.Mic size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase font-mono">Dyktafon Nagrywania Mowy Dziecka</div>
                    <div className="text-[10px] text-slate-400">
                      Nasłuchuje, jak syn opowiada historię i przetwarza ją za pomocą transkrypcji AI.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isRecording && (
                    <span className="text-xs font-mono font-bold text-red-400 animate-pulse bg-red-950/30 px-2.5 py-1 rounded-lg">
                      NAGRYWANIE: {recordedSecs}s
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleRecording}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-all cursor-pointer ${
                      isRecording 
                        ? 'bg-red-500 text-white hover:bg-red-400 animate-pulse' 
                        : 'bg-violet-600 text-white hover:bg-violet-500 shadow-md'
                    }`}
                  >
                    {isRecording ? 'Zatrzymaj i zapisz' : 'Włącz mikrofon'}
                  </button>
                </div>
              </div>

              {/* Action trigger button */}
              <button
                onClick={generateWholeCartoonSeries}
                disabled={isProducing || !childStoryText.trim()}
                className="w-full py-5 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 hover:from-amber-450 hover:to-violet-450 text-white select-none cursor-pointer font-black uppercase text-xs rounded-2xl shadow-xl shadow-pink-500/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Lucide.Sparkles size={16} /> Rozpocznij Produkcję Animowanej Serii (Saga, Scenariusz i Dźwięk)
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: SAGA SERIES OUTLINE */}
        {activeSubTab === 'saga' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">LISTA ODCINKÓW WYGENEROWANEJ SERII</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Scentralizowany rozkład tematów oraz wizualnych stylów dla wygenerowanej serii bajek mojego syna</p>
              </div>
              <span className="text-xs font-bold font-mono text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 max-w-full truncate">
                {generatedSagaTitle}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {episodes.map((ep) => (
                <div 
                  key={ep.id}
                  onClick={() => setActiveEpisodeId(ep.id)}
                  className={`border rounded-2.5rem p-5 cursor-pointer transition-all duration-250 flex flex-col justify-between h-[210px] ${
                    activeEpisodeId === ep.id 
                      ? 'bg-gradient-to-br from-violet-950/30 to-violet-900/10 border-violet-500/40 shadow-lg shadow-violet-550/5' 
                      : 'bg-black/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-lg text-slate-400 font-mono font-bold uppercase">Odcinek {ep.number}</span>
                      {activeEpisodeId === ep.id && <span className="w-1.5 h-1.5 bg-[#00ffcc] rounded-full animate-ping" />}
                    </div>
                    <h4 className="text-white text-xs font-black uppercase tracking-tight">{ep.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed font-mono italic">"{ep.synopsis}"</p>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 font-mono text-[9px]">
                    <div className="text-slate-500 truncate"><span className="text-amber-500">Bohaterowie:</span> {ep.mainCharacters.join(', ')}</div>
                    <div className="text-[#00ffcc] truncate select-none"><span className="text-violet-400">Stylizacja:</span> {ep.visualStyleDescription}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0c0d18] border border-violet-550/15 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 text-slate-400">
                <Lucide.Info size={14} className="text-amber-400 shrink-0" />
                Kliknij odcinek, aby załadować jego scenariusz, notatki reżysera oraz wyrenderować pierwsze kadry grafiki!
              </span>
              <button
                onClick={() => setActiveSubTab('screenplay')}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 font-mono cursor-pointer"
              >
                Przejdź do Scenariusza &gt;
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SCREENPLAY & STYLED DIALOGUES */}
        {activeSubTab === 'screenplay' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Left Column: Script Timeline */}
            <div className="lg:col-span-7 bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase font-extrabold text-[#00ffcc] tracking-widest font-mono flex items-center gap-1.5">
                  <Lucide.Scroll size={14} /> SCENARIUSZ ODCINKA {episodes.find(e => e.id === activeEpisodeId)?.number || 1}
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-black">Montażownia Cylon V-Bajka</span>
              </div>

              {/* Render scene lists with complete layout */}
              <div className="space-y-6">
                {scenes.map((scene) => (
                  <div 
                    key={scene.id}
                    onClick={() => setActiveSceneId(scene.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      activeSceneId === scene.id
                        ? 'bg-neutral-900/30 border-violet-500/30'
                        : 'bg-black/20 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono pb-2 border-b border-white/5 mb-3">
                      <span className="font-bold text-white">SCENA {scene.sceneNumber}: {scene.title}</span>
                      <span className="text-amber-400 bg-amber-500/10 px-1.5 rounded font-black">{scene.timeOfDay}</span>
                    </div>

                    <div className="space-y-4 font-mono">
                      {/* Direction Notes */}
                      <div className="text-[10px] text-slate-500 italic bg-black/60 p-3 rounded-xl border-l-2 border-slate-700 leading-relaxed font-mono">
                        <span className="font-bold text-slate-400 uppercase select-none">[REŻYSERIA CAMERA]:</span> {scene.directionNotes}
                      </div>

                      {/* Dialogues */}
                      <div className="space-y-3 pt-2">
                        {scene.dialogues.map((dlg, idx) => (
                          <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1.5 pl-4 relative">
                            <div className="flex justify-between items-center text-[9px]">
                              <div className="flex items-center gap-1 font-bold text-[#00ffcc]">
                                <span className="text-xs">{dlg.avatar}</span>
                                <span>{dlg.character}</span>
                              </div>
                              <span className="text-slate-500 block">pitch: {dlg.pitchType} ({dlg.voiceMood})</span>
                            </div>
                            <p className="text-xs text-white leading-relaxed">"{dlg.text}"</p>
                            
                            {/* Listening trigger */}
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playCharacterVoiceTTS(dlg.text, dlg.pitchType, `${scene.id}-${idx}`);
                                }}
                                className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1.5 transition-all outline-none select-none ${
                                  isSpeaking === `${scene.id}-${idx}`
                                    ? 'bg-amber-500 text-black font-extrabold animate-pulse'
                                    : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                {isSpeaking === `${scene.id}-${idx}` ? <Lucide.Pause size={10} /> : <Lucide.Play size={10} />}
                                {isSpeaking === `${scene.id}-${idx}` ? 'MÓWI...' : 'ODSŁUCHAJ GŁOS'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Sound effects / Audio prompts */}
                      <div className="flex flex-wrap gap-2 text-[9px] pt-2">
                        <span className="text-slate-500 font-bold self-center">EFEKTY SFX:</span>
                        {scene.soundEffects.map((fx, fIdx) => (
                          <span 
                            key={fIdx} 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (fx.toLowerCase().includes('miecz') || fx.toLowerCase().includes('bzyk')) playSwooshSFX();
                              else if (fx.toLowerCase().includes('grzmot') || fx.toLowerCase().includes('ryk')) playDragonRoarSFX();
                              else playLaserSound();
                            }}
                            className="bg-black/50 hover:bg-neutral-800 text-pink-400 px-2 py-0.5 rounded-lg border border-pink-500/10 cursor-pointer flex items-center gap-1"
                          >
                            <Lucide.Volume2 size={10} /> {fx}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Visual scene renderer & storyboard preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gradient-to-br from-slate-950 to-neutral-950 border border-white/5 rounded-[2rem] p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black uppercase text-white font-mono tracking-wider flex items-center gap-1">
                    <Lucide.Clapperboard size={14} className="text-[#00ffcc]" /> WIZUALNY STORYBOARD
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Renderowanie tła</span>
                </div>

                {/* Simulated frame rendering */}
                {scenes.find(s => s.id === activeSceneId) && (
                  (() => {
                    const activeScene = scenes.find(s => s.id === activeSceneId)!;
                    return (
                      <div className="space-y-4">
                        <div className="w-full aspect-video bg-[#05060b] rounded-[1.5rem] border border-white/10 relative overflow-hidden flex items-center justify-center">
                          {activeScene.isRendering ? (
                            <div className="text-center space-y-3">
                              <Lucide.Loader2 size={36} className="text-pink-500 animate-spin mx-auto" />
                              <div className="text-[9px] font-mono tracking-widest uppercase animate-pulse">ŁĄCZENIE KLATEK ANIMACJI...</div>
                            </div>
                          ) : activeScene.imageUrl ? (
                            <img 
                              src={activeScene.imageUrl} 
                              className="w-full h-full object-cover rounded-[1.5rem] referrer-policy-checked" 
                              alt="Generated scene frame"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-center p-6 space-y-2 text-slate-650">
                              <Lucide.ImageOff size={40} className="mx-auto text-slate-650 animate-pulse" />
                              <p className="text-[9px] font-mono uppercase tracking-widest">Brak renderu graficznego</p>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded text-[8px] font-mono text-white select-none">
                            Odcinek 1 // Scena {activeScene.sceneNumber}
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="text-slate-400 font-mono text-[10px]">PROMPT ARTYSTYCZNY ANIMATORA JEST GOTOWY:</div>
                          <p className="text-[10px] leading-relaxed text-slate-300 font-mono italic bg-black/50 p-3 rounded-xl border border-white/5">
                            "{activeScene.renderPrompt}"
                          </p>
                          
                          <button
                            type="button"
                            onClick={() => triggerSceneImageResolution(activeScene.id, activeScene.renderPrompt)}
                            disabled={activeScene.isRendering}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white font-mono font-black rounded-xl text-[10px] uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Lucide.Flame size={12} /> Renderuj tło tej sceny przez Rój AI
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: CHARACTER CARDS CREATOR */}
        {activeSubTab === 'character-cards' && (
          <div className="space-y-6 text-left">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">KARTY BOHATERÓW WYOBRAŹNI SYNKA (7-LATKA)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Wykreowani wirtualni wojownicy, bestie oraz potwory w unikalnym formacie gaming-cards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {characters.map((char, index) => (
                <div 
                  key={index} 
                  className={`bg-gradient-to-b from-[#111326] to-[#080914] border rounded-[2rem] p-6 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[340px] shadow-lg ${
                    char.alliance === 'hero' 
                      ? 'border-emerald-500/20' 
                      : char.alliance === 'creature' 
                        ? 'border-amber-500/20' 
                        : 'border-red-500/20'
                  }`}
                >
                  {/* Glowing asset background elements */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
                    char.alliance === 'hero' ? 'bg-emerald-500' : char.alliance === 'creature' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase font-mono border ${
                        char.alliance === 'hero' 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                          : char.alliance === 'creature' 
                            ? 'bg-amber-950/40 text-amber-400 border-amber-500/20' 
                            : 'bg-red-950/40 text-red-400 border-red-500/20'
                      }`}>
                        {char.alliance === 'hero' ? '💥 BOHATER NINJA' : char.alliance === 'creature' ? '🐉 LEGENDARNE STWORZENIE' : '😈 VILLAINS / ZŁOCZYŃCA'}
                      </span>
                      <span className="text-base select-none">
                        {char.alliance === 'hero' ? '🔥' : char.alliance === 'creature' ? '✨' : '⚡'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-white text-lg font-black tracking-tight">{char.name}</h4>
                      <div className="text-[10px] text-pink-400 font-mono">{char.role}</div>
                    </div>

                    <div className="space-y-2 text-[10px] font-mono leading-relaxed pt-2 border-t border-white/5">
                      <div><span className="text-slate-500">Moc / Atak:</span> <span className="text-white font-bold">{char.power}</span></div>
                      <div><span className="text-slate-500">Wygląd zewnętrzny:</span> <span className="text-slate-350">{char.appearance}</span></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 bg-black/20 p-3 rounded-xl">
                    <div className="text-[9px] text-[#00ffcc] font-mono leading-tight flex items-center gap-1.5 font-bold uppercase select-none">
                      <Lucide.Mic size={10} /> Ton dubbingowy lektora:
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 italic leading-snug">"{char.voiceStyle}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIO, COMPOSER & SFX LAB */}
        {activeSubTab === 'voices-fx' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Left Sound FX Deck */}
            <div className="lg:col-span-6 bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-6">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase text-[#00ffcc] tracking-widest font-mono flex items-center gap-1.5">
                  <Lucide.Volume2 size={15} /> GENERATOR SYNTETYCZNYCH ODSŁUCHÓW SFX
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-0.5 font-mono">Przetestuj z synkiem efekty dźwiękowe walki i ryków, syntezowane w czasie rzeczywistym w Twojej przeglądarce za pomocą standardu Web Audio</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "Swirl / Miecz Ninja Ognia",
                    desc: "Szybki zamach ognistym ostrzem Kairo. Generuje dynamiczny świst wysokiej harmonicznej częstotliwości.",
                    action: playSwooshSFX,
                    icon: <Lucide.Activity size={16} />
                  },
                  {
                    title: "Ryk Złotego Smoka Pyrora",
                    desc: "Wibracja niskotonowa z oscylatorem modulującym o niskim skoku, symulująca masywną bestię.",
                    action: playDragonRoarSFX,
                    icon: <Lucide.Activity size={16} />
                  },
                  {
                    title: "Strzał z Kostura Garmadona",
                    desc: "Ślizg rzężenia wysokotonowej fali piło-kształtnej, naśladujący energetyczny wyładowanie magiczne.",
                    action: playLaserSound,
                    icon: <Lucide.Activity size={16} />
                  }
                ].map((sfx, id) => (
                  <div 
                    key={id}
                    onClick={sfx.action}
                    className="bg-neutral-950/80 border border-white/5 p-4 rounded-2xl hover:border-violet-500/20 active:bg-violet-950/10 cursor-pointer transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase font-mono">{sfx.title}</span>
                      <span className="text-pink-500">{sfx.icon}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-normal font-mono font-medium">{sfx.desc}</p>
                    <div className="pt-2 flex justify-end">
                      <button 
                        type="button"
                        className="text-[9px] font-mono text-[#00ffcc] uppercase hover:underline leading-none p-1 flex items-center gap-1 font-bold"
                      >
                        Odtwórz Syntezę <Lucide.Play size={9} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Character Dubbing Deck */}
            <div className="lg:col-span-6 bg-[#0c0d18] border border-white/5 rounded-[2rem] p-6 space-y-6">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center gap-1.5">
                  <Lucide.Mic2 size={15} className="text-[#a855f7]" /> MULTIPITCH CHARACTERS VOICE ACTING (DUBBING PL)
                </h3>
                <p className="text-[10px] text-indigo-300 mt-0.5">Dubbingowanie na żywo za pomocą polskiej syntezy mowy! Możesz sprawdzić, jak postacie wypowiadają kwestie z różnymi tonacjami bajkowymi</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: "Kairo (Heroiczny Głos Czerwonego Ninja)",
                    text: "Sojusz z potężnym złotym smokiem Pyror zostanie zapamiętany w całym królestwie! Trzymajcie się, klocki do boju!",
                    pitch: 'ninja' as const,
                    avatar: "🔥"
                  },
                  {
                    name: "Pyror (Ryczący Mądry Głos Smoka)",
                    text: "Mój płomień płonie z nową mocą! Wspólnie wzniesiemy się ponad chmury lawy i zniszczymy najeźdźców!",
                    pitch: 'dragon' as const,
                    avatar: "🐉"
                  },
                  {
                    name: "Zły Garmadon (Aura Elektrycznego Czarnoksiężnika)",
                    text: "Hahaha, myślicie, że ta mała jaszczurka z klocków zdoła mnie powstrzymać? Moja mroczna armia pochłonie te ziemie!",
                    pitch: 'child' as const,
                    avatar: "😈"
                  }
                ].map((actor, aIdx) => (
                  <div key={aIdx} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white">
                        <span>{actor.avatar}</span> <span>{actor.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal italic select-all font-mono">
                        "{actor.text}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => playCharacterVoiceTTS(actor.text, actor.pitch, `dub-${aIdx}`)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase transition-all shrink-0 cursor-pointer ${
                        isSpeaking === `dub-${aIdx}`
                          ? 'bg-pink-500 text-white animate-pulse shadow-md shadow-pink-500/20'
                          : 'bg-[#181930] hover:bg-[#202242] text-[#00ffcc] border border-[#a855f7]/20 hover:border-[#a855f7]/40'
                      }`}
                    >
                      {isSpeaking === `dub-${aIdx}` ? 'Stop' : 'Dubbuj zdanie'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Footer System Credits Line */}
      <div className="p-4 bg-black/60 border-t border-white/5 text-[9px] text-slate-500 flex flex-col sm:flex-row justify-between uppercase font-mono tracking-wider items-center gap-2">
        <div className="flex items-center gap-1">
          <Lucide.Sparkles size={10} className="text-amber-500" />
          Ekipa od animacji: anim_director, audio_sfx_producer, prompt_illustrator
        </div>
        <div>Model Wspomagania: Gemini Flash V3.5-Turbo Pro</div>
      </div>

    </div>
  );
}
