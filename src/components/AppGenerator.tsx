import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, Sparkles, Mic, MicOff, Play, Code, Layout, Terminal, 
  CheckCircle2, Copy, Download, Users, Sliders, ArrowRight, 
  FolderOpen, FileCode, Check, RefreshCw, Layers, Star, 
  Palette, Database, Heart, Volume2, ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';

interface AgentHelper {
  name: string;
  role: string;
  avatarColor: string;
  avatarChar: string;
  desc: string;
  model: string;
  specialty: string;
  status: 'ONLINE' | 'STANDBY' | 'WORKING';
}

const DEFAULT_HELPERS: AgentHelper[] = [
  {
    name: "Nestor-UX",
    role: "Architekt Frontendu & UI",
    avatarColor: "#A855F7", // Purple Accent
    avatarChar: "N",
    desc: "Specjalizuje się w projektowaniu zachwycających, responsywnych interfejsów przy użyciu Tailwind i czystego HTML5/React.",
    model: "gemini-2.5-pro",
    specialty: "Przejrzysta typografia, animacje, układ mobilny",
    status: 'ONLINE'
  },
  {
    name: "Vektor-DB",
    role: "Logika Systemowa & Skrypty",
    avatarColor: "#06B6D4", // Cyan Accent
    avatarChar: "V",
    desc: "Tworzy bezbłędne skrypty optymalizacyjne Bash/Python, struktury baz danych oraz mostki integracyjne LAN.",
    model: "gemini-2.5-flash",
    specialty: "Zarządzanie stanem, parsery plików, skrypty cron",
    status: 'ONLINE'
  },
  {
    name: "Aria-Writer",
    role: "UX Copywriter & Analityk Treści",
    avatarColor: "#10B981", // Emerald Accent
    avatarChar: "A",
    desc: "Odpowiada za generowanie angażujących słów, dokumentacji technicznej oraz instrukcji krok-po-kroku dla laików.",
    model: "gemini-2.5-flash",
    specialty: "Humorystyczny ton, dokumentacja, onboarding",
    status: 'ONLINE'
  }
];

interface GeneratedTemplate {
  title: string;
  tech: string;
  category: 'spa' | 'script' | 'landing';
  voicePrompt: string;
  description: string;
  mockupHtml: React.ReactNode;
  files: { name: string; content: string; language: string }[];
}

export default function AppGenerator({ showToast }: { showToast: (msg: string) => void }) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [helpers, setHelpers] = useState<AgentHelper[]>(DEFAULT_HELPERS);
  
  // Custom states
  const [voiceQuery, setVoiceQuery] = useState('Stwórz prostą aplikację Todo List z lokalnym zapisem i eleganckimi animacjami');
  const [isListening, setIsListening] = useState(false);
  const [appCategory, setAppCategory] = useState<'spa' | 'script' | 'landing'>('spa');
  const [customTitle, setCustomTitle] = useState('Projekt Szybkiego Roju');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeAgentSpeaker, setActiveAgentSpeaker] = useState<string | null>(null);
  const [genLogs, setGenLogs] = useState<string[]>([]);
  
  // Success state with generated code
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [generatedResult, setGeneratedResult] = useState<GeneratedTemplate | null>(null);
  
  // Simulate speaking indicator
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  // Audio effect variables (simulated sound waves)
  const [waveHeights, setWaveHeights] = useState<number[]>([15, 30, 10, 45, 20, 35, 12, 28, 42, 10]);

  // Handle simulated sound waves when listening
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setWaveHeights(Array.from({ length: 12 }, () => Math.floor(Math.random() * 45) + 5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Voice recognition simulation presets
  const VOICE_SAMPLES = [
    "Stwórz minimalistyczny landing page dla kawiarni serwującej kawy specialty",
    "Napisz skrypt w Pythonie do automatycznego backupu bazy SQL i wysyłania ZIPa przez sieć",
    "Stwórz interaktywną aplikację do nauki języków z fiszkami i licznikiem punktów",
    "Stwórz piękny landing page dla rzemieślniczego browaru i dopasuj styl rustykalny",
    "Wygeneruj skrypt Bash do czyszczenia logów z informacją dźwiękową w Termux"
  ];

  const handleSimulateVoiceInput = () => {
    setIsListening(true);
    setVoiceQuery('');
    showToast("Aktywowano nasłuchiwanie kognitywne... Powiedz coś!");
    
    // Pick random sample
    const randomSample = VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)];
    
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < randomSample.length) {
        setVoiceQuery(prev => prev + randomSample.charAt(currentIdx));
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsListening(false);
        showToast("Rozpoznano mowę pomyślnie!");
        // Auto-detect category
        const lower = randomSample.toLowerCase();
        if (lower.includes('skrypt') || lower.includes('python') || lower.includes('bash')) {
          setAppCategory('script');
        } else if (lower.includes('landing') || lower.includes('kawiarni') || lower.includes('browaru')) {
          setAppCategory('landing');
        } else {
          setAppCategory('spa');
        }
        
        // Auto update project name based on first nouns
        if (lower.includes('kawiarni')) setCustomTitle('Cafe-Specialty-Landing');
        else if (lower.includes('backupu') || lower.includes('pythona')) setCustomTitle('Auto-Net-Backup-Script');
        else if (lower.includes('nauki') || lower.includes('fiszkami')) setCustomTitle('Lingo-Flash-Card-App');
        else if (lower.includes('kalkulatora')) setCustomTitle('Smart-Retro-Calculator');
        else setCustomTitle('Syntetyczny-App-System');
      }
    }, 45);
  };

  // Predefined templates that are highly beautiful
  const DYNAMIC_TEMPLATES: Record<string, GeneratedTemplate> = {
    spa: {
      title: "Lingo-Flash-Card-App",
      tech: "React 19 + Tailwind CSS + LocalStorage Study",
      category: 'spa',
      voicePrompt: "Stwórz interaktywną aplikację do nauki języków z fiszkami i licznikiem punktów",
      description: "Gotowy program webowy dający natychmiastowe rezultaty bez instalacji serwerów. Idealny do nauki pojęć technicznych, języków obcych i komend Linux/Termux.",
      mockupHtml: (
        <div className="bg-[#0b0c16] rounded-2xl border border-purple-500/35 p-5 text-left text-white max-w-sm mx-auto shadow-xl flex flex-col justify-between h-[280px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-black">LingoFlash v1.0</span>
              <span className="text-xs text-yellow-400 font-bold font-mono">🏆 Punkty: 15 / 20</span>
            </div>
            
            <div className="bg-gradient-to-br from-purple-950/40 to-neutral-900/60 p-5 rounded-xl border border-white/5 text-center my-2 cursor-pointer hover:border-purple-500/30 transition-all min-h-[90px] flex items-center justify-center">
              <p className="font-sans font-medium text-sm text-purple-200">Jakie jest główne zadanie komendy "wakeonlan"?</p>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 p-2 rounded-lg text-[10px] uppercase font-black hover:bg-emerald-500/10 cursor-pointer">
                Pokaż odpowiedź
              </button>
              <button className="bg-[#121323] hover:border-white/10 text-slate-400 p-2 rounded-lg text-[10px] uppercase font-bold cursor-pointer border border-white/5">
                Następne
              </button>
            </div>
            <p className="text-[8.5px] text-center text-slate-500 font-mono">Generowane przez Nestor-UX & Aria-Writer</p>
          </div>
        </div>
      ),
      files: [
        {
          name: "App.jsx",
          language: "javascript",
          content: `// Pobrałeś gotowy kod wygenrowany przez Twoje Zespół Roju. Możesz go odpalić od razu!
import React, { useState } from 'react';

// Stabilne dane pytań w pamięci
const FLASHCARDS = [
  { id: 1, question: "Co oznacza termin WoL w sieci?", answer: "Wake-on-LAN - protokół zdalnego włączania komputerów przez sieć lokalną." },
  { id: 2, question: "Co robi flaga -s w systemowej komendzie ping?", answer: "Określa rozmiar pakietu ping wysyłanego do odpytywanego hosta." },
  { id: 3, question: "Gdzie w Termux przechowywane są pakiety systemowe?", answer: "W katalogu $PREFIX/etc/apt/ lub po prostu z operacją pkg install." }
];

export default function FlashcardApp() {
  const [cards, setCards] = useState(FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handleAnswerCorrect = (isCorrect) => {
    if (isCorrect) setScore(prev => prev + 10);
    handleNext();
  };

  const activeCard = cards[currentIndex];

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#0a0b12', color: '#fff', minHeight: '100vh', padding: '30px', textAlign: 'center' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#a855f7', textTransform: 'uppercase', letterSpacing: '2px' }}>CYLON LINGO CARDS</h1>
        <p style={{ color: '#888', fontSize: '13px' }}>Twój naukowy asystent pamięciowy</p>
        <div style={{ background: '#111', display: 'inline-block', padding: '10px 20px', borderRadius: '10px', marginTop: '10px' }}>
          <strong>Wyniki uzytkownika: {score} PKT</strong>
        </div>
      </header>

      <main style={{ maxWidth: '400px', margin: '0 auto', background: '#151624', padding: '30px', borderRadius: '20px', border: '1px solid #a855f7' }}>
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ minHeight: '150px', background: '#0c0d1b', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed #333' }}
        >
          <h3 style={{ margin: 0, fontWeight: 'normal', color: isFlipped ? '#06b6d4' : '#fff' }}>
            {isFlipped ? activeCard.answer : activeCard.question}
          </h3>
        </div>

        <p style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>*Kliknij na kartę, aby odwrócić i poznać odpowiedź*</p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button onClick={() => handleAnswerCorrect(true)} style={{ flex: 1, background: '#10b981', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Znam to! (+10)</button>
          <button onClick={() => handleAnswerCorrect(false)} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Nie wiem</button>
        </div>
      </main>
    </div>
  );
}`
        },
        {
          name: "index.html",
          language: "html",
          content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Lingo-Flash-Card UI</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
        }
      ]
    },
    script: {
      title: "Auto-Net-Backup-Script",
      tech: "Python 3 + Multihost Network SSH Backup + ZIP Sync",
      category: 'script',
      voicePrompt: "Napisz skrypt w Pythonie do automatycznego backupu bazy SQL i wysyłania ZIPa przez sieć",
      description: "Wydajny skrypt operacyjny przeznaczony do automatyzacji backupu baz SQLite / MySQL z podłączonych maszyn z możliwością przesyłu SFTP/LAN do serwera głownego.",
      mockupHtml: (
        <div className="bg-[#060810] rounded-2xl border border-cyan-500/35 p-5 text-left text-white max-w-sm mx-auto shadow-xl flex flex-col justify-between h-[280px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono font-bold">BACKUP_MODULE.py</span>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] text-emerald-400 uppercase font-bold">READY</span>
              </div>
            </div>
            
            <div className="bg-[#030408] p-4 rounded-xl border border-white/5 font-mono text-[9.5px] leading-relaxed text-indigo-300">
              <div className="text-emerald-400">[SYSTEM CONFIG] Host: 192.168.1.150</div>
              <div>[DATABASE] SQL dump triggered successfully.</div>
              <div>[COMPRESS] backup_2026-06-06.zip size = 12.4 MB</div>
              <div className="text-cyan-400">[SFTP] Synced cleanly to Backup-Node-B.</div>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <button className="w-full bg-cyan-950/20 hover:bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 p-2 rounded-lg text-[10px] uppercase font-black cursor-pointer flex items-center justify-center gap-1">
              <Play size={10} /> Testuj wykonanie skryptu
            </button>
            <p className="text-[8px] text-center text-slate-500 font-mono">Zoptymalizowane przez Vektor-DB</p>
          </div>
        </div>
      ),
      files: [
        {
          name: "backup_sync.py",
          language: "python",
          content: `# ==============================================================================
# SCRIPT COMPILATION - CYLON AUTOMATIC NETWORK BACKUP
# Generated globally for any Linux / Termux operator. No external tools needed!
# ==============================================================================
import os
import sys
import shutil
import datetime
import subprocess

print("==========================================================")
print("  CYLON COGNITIVE CO-PILOT: AUTOMATIC NETWORK BACKUP      ")
print("==========================================================")

# Konfiguracja uproszczona
DB_FILE = os.getenv("CYLON_SOURCE_DB", "swarm_local_data.db")
BACKUP_DIR = "./backups"
REMOTE_HOST = "192.168.1.150"
REMOTE_PATH = "/var/swarm_backups"

def run():
    # 1. Sprawdź pliki
    if not os.path.exists(DB_FILE):
        print(f"[-] Błąd: Plik bazy {DB_FILE} nie istnieje! Tworzę pusty plik testowy...")
        with open(DB_FILE, "w") as f:
            f.write("CYLON_SWARM_NODE_SNAPSHOT_TEST_DATA")

    # 2. Tworzenie folderów
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"[+] Utworzono katalog wyjściowy: {BACKUP_DIR}")

    # 3. Kopiowanie z datownikiem
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"snapshot_{timestamp}.db"
    dest_path = os.path.join(BACKUP_DIR, backup_filename)

    shutil.copy2(DB_FILE, dest_path)
    print(f"[SUCCESS] Zrzut bazy SQLite skopiowany do: {dest_path}")

    # 4. Pakowanie
    archive_name = f"{BACKUP_DIR}/cluster_backup_{timestamp}"
    shutil.make_archive(archive_name, 'zip', BACKUP_DIR)
    print(f"[SUCCESS] Bezpieczne spakowanie do archiwum: {archive_name}.zip")

    # 5. Informacja sieciowa
    print(f"[INFO] Gotowy do eksportu. SCP komenda w gotowości:")
    print(f" scp {archive_name}.zip admin@{REMOTE_HOST}:{REMOTE_PATH}")
    print("[SUCCESS] Zakończono wykonywanie skryptu.")

if __name__ == "__main__":
    run()`
        },
        {
          name: "Uruchom_skrypt.sh",
          language: "bash",
          content: `#!/bin/bash
# Skrypt rozruchowy przygotowany przez Aria-Writer dla systemów Linux i Android (Termux)
echo "Odpalanie skryptu Python..."
python3 backup_sync.py`
        }
      ]
    },
    landing: {
      title: "Cafe-Specialty-Landing",
      tech: "Modern Semantic HTML5 + CSS grid + SVG illustration Layout",
      category: 'landing',
      voicePrompt: "Stwórz minimalistyczny landing page dla kawiarni serwującej kawy specialty",
      description: "Przepiękny i czysty landing page ucieleśniający harmonię barw ciepłego karmelu i drewna. Wysoce dopracowany pod urządzenia mobilne i tablety.",
      mockupHtml: (
        <div className="bg-[#181210]/95 rounded-2xl border border-amber-600/35 p-5 text-left text-white max-w-sm mx-auto shadow-xl flex flex-col justify-between h-[280px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold">Symphony Cafe</span>
              <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">SPECIALTY</span>
            </div>
            
            <div className="space-y-1 text-center my-4">
              <h4 className="font-display font-bold text-xs text-amber-100 uppercase tracking-wide">Prawdziwa Kawa, Czysta Pasja</h4>
              <p className="text-[9px] text-orange-200/70 font-sans max-w-xs mx-auto">Rustykalne ziarna z Etiopii i Kolumbii wypalane lokalnie przez mistrzów smaku.</p>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <button className="w-full bg-amber-500 hover:bg-amber-400 text-black p-2 rounded-xl text-[10px] uppercase font-black cursor-pointer">
              Zarezerwuj ziarna kawy online
            </button>
            <p className="text-[8.5px] text-center text-orange-300/40 font-mono">Oprawa tekstu i layout: Aria-Writer & Nestor-UX</p>
          </div>
        </div>
      ),
      files: [
        {
          name: "index.html",
          language: "html",
          content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Symphony Cafe - Ziarna Specialty</title>
  <style>
    body {
      margin: 0;
      font-family: 'Inter', sans-serif;
      background-color: #120e0c;
      color: #f7ede2;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      max-width: 450px;
      background: #1e1613;
      border: 1px solid #d4a373;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      text-align: center;
    }
    h1 {
      color: #e6ccb2;
      font-size: 24px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    p {
      color: #b7b7a4;
      font-size: 14px;
      line-height: 1.6;
    }
    .beans-badge {
      display: inline-block;
      background: rgba(212, 163, 115, 0.15);
      color: #ddb892;
      font-size: 11px;
      font-weight: bold;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #ddb892;
      margin-bottom: 20px;
    }
    .btn {
      display: block;
      background: #d4a373;
      color: #000;
      font-weight: bold;
      text-decoration: none;
      padding: 14px;
      border-radius: 12px;
      margin-top: 30px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #e6ccb2;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="beans-badge">KAWA PREMIUM SPECIALTY</div>
    <h1>Symphony Cafe</h1>
    <p>Odkryj niezwykłe odcienie owocowych nut w świeżo parzonych ziarnach z Etiopii Guji (Single Origin). Palimy lekko, aby zachować czysty smak rzemiosła.</p>
    <a href="#" class="btn">ZAMÓW Z DOSTAWĄ DO DOMU</a>
  </div>
</body>
</html>`
        }
      ]
    }
  };

  const handleStartCodeGeneration = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedResult(null);
    setGenLogs([]);
    
    // Step-by-step parallel simulation of 3 agents working on it
    const logIntervals = [
      { pr: 10, agent: "Nestor-UX", log: "Inicjalizuję szkielet aplikacji w oparciu o najlepsze praktyki UX. Tworzę responsywne kontenery HTML." },
      { pr: 25, agent: "Vektor-DB", log: "Wpisuję logikę wstrzykiwania do stanu aplikacji oraz skrypty automatyzujące. Zoptymalizowano proces pod wydajność klastrową." },
      { pr: 45, agent: "Aria-Writer", log: "Narzucam wyrafinowaną oprawę językową oraz przyjazną instrukcję rozruchu dla nietechnicznych." },
      { pr: 65, agent: "Nestor-UX", log: "Dekoruję formularze i karty z pomocą precyzyjnych klas Tailwind. Kontrasty i czytelność gotowe na 100%." },
      { pr: 85, agent: "Vektor-DB", log: "Kompilacja i walidacja syntaxu kodu źródłowego. Brak wyjątków i ostrzeżeń." },
      { pr: 100, agent: "Aria-Writer", log: "Złożenie kodu w jeden spójny system. Gotowe do natychmiastowego pobrania i uruchomienia." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logIntervals.length) {
        const stepInfo = logIntervals[currentStep];
        setGenerationProgress(stepInfo.pr);
        setActiveAgentSpeaker(stepInfo.agent);
        
        // Update helper statuses
        setHelpers(prev => prev.map(h => {
          if (h.name === stepInfo.agent) return { ...h, status: 'WORKING' };
          return { ...h, status: 'ONLINE' };
        }));

        setGenLogs(prev => [
          ...prev,
          `[${stepInfo.agent}] ${stepInfo.log}`
        ]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        setActiveAgentSpeaker(null);
        setHelpers(DEFAULT_HELPERS);
        
        // Pick proper template
        const finalResult = DYNAMIC_TEMPLATES[appCategory];
        // Set proper project name based on user override
        const adjustedResult = {
          ...finalResult,
          title: customTitle || finalResult.title
        };

        setGeneratedResult(adjustedResult);
        setSelectedFileIndex(0);
        setActiveStep(3); // Success Screen
        
        // Record log to system
        api.createLog({
          id: Math.random().toString(36).substr(2, 9),
          action: 'APP_SMITH_GEN',
          details: `Pomyślnie wygenerowano program "${adjustedResult.title}" za pomocą polecenia głosowego roju.`
        }).catch(err => console.log(err));

        showToast(`Wygenerowano pomyślnie program: ${adjustedResult.title}!`);
      }
    }, 1500);
  };

  const currentTemplate = generatedResult || DYNAMIC_TEMPLATES[appCategory];

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-[#090b14]/90 p-6 rounded-[2rem] border border-acid-purple/35 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-acid-purple/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-acid-purple/10 text-acid-purple p-3 rounded-2xl border border-acid-purple/30 animate-pulse">
              <Cpu size={24} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-white tracking-widest bg-purple-900/40 text-acid-purple border border-acid-purple/30 px-2 py-0.5 rounded font-mono">
                  PROSTE TWORZENIE OPROGRAMOWANIA • DLA KAŻDEGO
                </span>
                <span className="text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-black uppercase font-mono">
                  GŁOS-TO-KOD (V2)
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-display font-medium text-white uppercase tracking-wider mt-0.5">
                Kreator Aplikacji i Skryptów Roju
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-1 max-w-3xl leading-relaxed">
                Niezwykle zaawansowana pod spodem, ale <strong className="text-acid-purple">banalna w obsłudze</strong> technologia. Wypowiedz głośno instrukcję po polsku, a nasi 3 wbudowani cyber-agenci automatycznie skompletują i wygenerują dla Ciebie gotową do wgrania na komputer lub telefon paczkę oprogramowania.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-neutral-900/80 px-3.5 py-2 rounded-xl border border-white/5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-acid-purple animate-ping" />
            <span className="text-[10px] text-acid-purple font-mono font-black uppercase">APPMATE_STANDBY</span>
          </div>
        </div>
      </div>

      {/* 3 PRE-ASSIGNED ONBOARD HELPERS GRAPHICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {helpers.map((agent) => (
          <div 
            key={agent.name} 
            className={cn(
              "glass-panel border p-4.5 rounded-2xl bg-black/40 text-left relative overflow-hidden transition-all duration-300",
              activeAgentSpeaker === agent.name 
                ? "border-acid-purple shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.02] bg-purple-950/10" 
                : "border-white/5 hover:border-white/10"
            )}
          >
            {activeAgentSpeaker === agent.name && (
              <div className="absolute top-0 right-0 bg-acid-purple text-black text-[7px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg font-mono flex items-center gap-1">
                <Volume2 size={8} className="animate-bounce" /> MÓWI TERAZ
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-2.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black border"
                style={{ 
                  backgroundColor: `${agent.avatarColor}20`, 
                  color: agent.avatarColor,
                  borderColor: `${agent.avatarColor}40`
                }}
              >
                {agent.avatarChar}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{agent.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8.5px] text-slate-400 font-medium font-sans">{agent.role}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-500" />
                  <span className={cn(
                    "text-[7px] font-mono font-black",
                    agent.status === 'WORKING' ? 'text-purple-400' : 'text-emerald-400'
                  )}>
                    {agent.status}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {agent.desc}
            </p>

            <div className="bg-black/50 border border-white/5 p-2 rounded-xl mt-3 space-y-1">
              <div className="flex justify-between items-center text-[8.5px]">
                <span className="text-slate-500 font-bold uppercase font-sans">Model klastrowy:</span>
                <span className="text-white font-mono font-medium">{agent.model}</span>
              </div>
              <div className="flex justify-between items-center text-[8.5px]">
                <span className="text-slate-500 font-bold uppercase font-sans">Mocna strona:</span>
                <span className="text-acid-cyan font-sans font-medium">{agent.specialty}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* THREE-STEP GENERATION WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROLS & VOICE IMPORTS (5 COLS) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="glass-panel border border-acid-purple/20 p-5 rounded-2xl bg-black/40 text-left space-y-5">
            <div>
              <span className="text-[8.5px] text-acid-purple uppercase font-black tracking-widest block font-mono">ZASILANIE KOGNITYWNE (KROK 1)</span>
              <h3 className="font-display font-medium text-xs text-white uppercase tracking-wider mt-0.5">Komendy Głosowe & Założenia</h3>
            </div>

            {/* Voice Simulation Button with fancy animated wave container */}
            <div className="space-y-3">
              <label className="text-[9px] font-bold uppercase text-slate-400 block font-mono">1. INTUICYJNE PODAWANIE PARAMETRÓW:</label>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={handleSimulateVoiceInput}
                  disabled={isListening || isGenerating}
                  className={cn(
                    "w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-3 border transition active:scale-95 cursor-pointer shadow-lg",
                    isListening 
                      ? "bg-rose-950/20 border-rose-500 text-rose-300 shadow-rose-950/20"
                      : "bg-[#0f111e] hover:bg-[#15192c] border-acid-purple/50 text-white shadow-acid-purple/5"
                  )}
                >
                  <div className="relative">
                    {isListening ? (
                      <MicOff size={16} className="text-rose-400 animate-pulse" />
                    ) : (
                      <Mic size={16} className="text-acid-purple animate-ping absolute" />
                    )}
                    <Mic size={16} className={isListening ? 'text-rose-400' : 'text-acid-purple relative'} />
                  </div>
                  {isListening ? "NASŁUCHIWANIE GŁOSOWE... MÓW TERAZ" : "Naciśnij i Mów w języku polskim"}
                </button>

                {/* Animated Sound Wave visual representation */}
                {isListening && (
                  <div className="bg-black/80 rounded-xl p-3 border border-rose-500/20 flex items-center justify-center gap-1.5 h-12">
                    {waveHeights.map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: h }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-1 bg-gradient-to-t from-acid-purple to-rose-400 rounded-full"
                        style={{ height: '15px' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editable query and inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="text-[9px] font-bold uppercase text-slate-500 block font-mono mb-1">PROMPT (Słowa rozpoznane z dźwięku):</label>
                <textarea
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  disabled={isGenerating || isListening}
                  rows={3}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-acid-purple outline-none transition font-sans resize-none font-medium leading-relaxed"
                  placeholder="np. Stwórz skrypt do czyszczenia śmieci"
                />
              </div>

              {/* Advanced / Auto choices explained in Human terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8.5px] font-bold uppercase text-slate-500 block font-mono mb-1">PROSTY TYP PROGRAMU:</label>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value as any)}
                    disabled={isGenerating}
                    className="w-full bg-[#14151e] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:border-acid-purple outline-none"
                  >
                    <option value="spa">Aplikacja webowa z kafelkami</option>
                    <option value="script">Pożyteczny skrypt komputerowy</option>
                    <option value="landing font-medium">Strona internetowa (Landing Page)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8.5px] font-bold uppercase text-slate-500 block font-mono mb-1">KODOWA NAZWA PROJEKTU:</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value.replace(/\s+/g, '-'))}
                    disabled={isGenerating}
                    placeholder="np. MojaAplikacja"
                    className="w-full bg-[#14151e] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white focus:border-acid-purple outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartCodeGeneration}
                disabled={isGenerating || !voiceQuery.trim()}
                className={cn(
                  "w-full py-3 rounded-xl uppercase font-black tracking-widest text-xs transition active:scale-95 flex items-center justify-center gap-2 border cursor-pointer",
                  isGenerating 
                    ? "bg-neutral-900 border-white/5 text-slate-600 cursor-not-allowed"
                    : "bg-acid-purple hover:bg-purple-400 text-black border-purple-500 font-extrabold shadow-lg shadow-purple-500/10"
                )}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> TRWA TWORZENIE KODU ({generationProgress}%)
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> WYSTUKAJ / ROZPOCZNIJ TWORZENIE KODU
                  </>
                )}
              </button>
            </div>
            
            {/* Template shortcuts */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <label className="text-[8px] font-bold uppercase text-slate-500 block font-mono">LUB KLIKNIJ GOTOWY PROJEKT NA START:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'spa', label: 'Edukacyjne Fiszki' },
                  { id: 'script', label: 'Auto-Backup Sieci' },
                  { id: 'landing', label: 'Strona Cafe' }
                ].map(shortcut => (
                  <button
                    key={shortcut.id}
                    onClick={() => {
                      setAppCategory(shortcut.id as any);
                      const templ = DYNAMIC_TEMPLATES[shortcut.id];
                      setVoiceQuery(templ.voicePrompt);
                      setCustomTitle(templ.title);
                      setGeneratedResult(templ);
                      showToast(`Załadowano szablon: ${shortcut.label}`);
                    }}
                    className={cn(
                      "py-1.5 px-1 text-[8.5px] font-sans font-semibold border rounded-lg text-center transition cursor-pointer",
                      appCategory === shortcut.id
                        ? "bg-acid-purple/10 border-acid-purple text-acid-purple"
                        : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
                    )}
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: SIMULATION FLOW & OUTPUT PREVIEW (7 COLS) */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* STEP 2: AGENTS TRACE COLLABORATION LOGS WHEN BUSY */}
          {isGenerating && (
            <div className="glass-panel border border-acid-purple/20 p-5 rounded-2xl bg-[#090b14] text-left space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest font-mono">DOPASOWANIE KOGNITYWNE (KROK 2)</span>
                </div>
                <span className="text-[7.5px] text-amber-300 font-mono font-bold bg-amber-950/40 border border-amber-500/20 px-1 rounded">TRWA OBRADA ROJU</span>
              </div>

              {/* Logs output */}
              <div className="bg-black/90 p-4 border border-white/10 rounded-xl font-mono text-[9px] text-indigo-300 h-[190px] overflow-y-auto custom-scrollbar space-y-1.5">
                {genLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed border-l-2 border-acid-purple/50 pl-2">
                    {log}
                  </div>
                ))}
                <div className="text-slate-600 italic text-[8.5px] py-2 animate-pulse">
                  &gt; Narzędzia asynchroniczne i synteza klastrów Termux są zaangażowane w strumieniowanie parametrów...
                </div>
              </div>
              
              {/* Progress bar container */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] text-slate-400">
                  <span>POSTĘP SYNTETYZATORA APPMATE</span>
                  <span className="text-[10px] text-acid-purple font-mono font-black">{generationProgress}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="bg-gradient-to-r from-acid-purple to-acid-cyan h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: OUTPUT CODE & VISUAL SCREEN */}
          <div className="glass-panel border border-acid-purple/20 p-5 rounded-2xl bg-black/40 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 flex-wrap gap-2">
              <div className="text-left">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest font-mono block">REPOZYTORIUM I EKRAN PODGLĄDU (KROK 3)</span>
                <span className="text-xs text-white font-bold font-sans">
                  {currentTemplate.title} ({currentTemplate.tech})
                </span>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentTemplate.files[selectedFileIndex].content);
                    showToast("Skopiowano kod pomyślnie do schowka!");
                  }}
                  className="text-[9px] bg-purple-950/30 text-acid-purple border border-acid-purple/35 hover:bg-acid-purple hover:text-black hover:border-purple-300 px-3 py-1.5 rounded-xl uppercase font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy size={11} /> Kopiuj Kod
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([currentTemplate.files[selectedFileIndex].content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = currentTemplate.files[selectedFileIndex].name;
                    link.click();
                    showToast("Pobrano pliki projektu!");
                  }}
                  className="text-[9px] bg-cyan-950/30 text-acid-cyan border border-acid-cyan/35 hover:bg-acid-cyan hover:text-black hover:border-cyan-300 px-3 py-1.5 rounded-xl uppercase font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={11} /> Pobierz
                </button>
              </div>
            </div>

            {/* Grid for splitting File Explorer + Code View VS Live Visual Mockup Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Explorer (4 cols) */}
              <div className="md:col-span-4 space-y-4 text-xs font-sans">
                
                {/* Visual File Explorer list */}
                <div className="bg-[#030408]/90 border border-white/5 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-slate-500 uppercase mb-2 font-mono">
                    <FolderOpen size={11} className="text-amber-500" /> Drzewo Plików wyjściowych
                  </div>
                  {currentTemplate.files.map((file, idx) => (
                    <button
                      key={file.name}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={cn(
                        "w-full px-2.5 py-2 rounded-lg text-left font-mono text-[10.5px] flex items-center gap-2 border transition cursor-pointer",
                        selectedFileIndex === idx
                          ? "bg-acid-purple/10 border-acid-purple/40 text-white font-extrabold"
                          : "bg-black/40 border-transparent text-slate-400 hover:text-white"
                      )}
                    >
                      <FileCode size={11} className={selectedFileIndex === idx ? "text-acid-purple" : "text-slate-500"} />
                      {file.name}
                    </button>
                  ))}
                </div>

                {/* Humans explanation box */}
                <div className="bg-emerald-950/15 border border-emerald-500/20 p-3 rounded-xl space-y-1">
                  <span className="text-[8.5px] font-bold text-emerald-400 uppercase font-mono flex items-center gap-1">
                    <CheckCircle2 size={10} /> Gotowy na start
                  </span>
                  <p className="text-[10px] text-emerald-300/80 font-sans leading-relaxed">
                    Powyższy kod jest w pełni kompletny i zoptymalizowany. Nie potrzebujesz żadnej konfiguracji API ani npm by go wypróbować. Skopiuj i odpal na dowolnym komputerze.
                  </p>
                </div>

              </div>

              {/* Code window and visually reactive mockup (8 cols) */}
              <div className="md:col-span-8 space-y-4">
                
                {/* Reactively changing mockup display card - Visual Outcome */}
                <div className="bg-[#080911] border border-white/5 rounded-2xl p-4.5 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-[#161a2b] text-[7.5px] font-mono font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-br-lg">
                    Interaktywny Podgląd Wyniku
                  </div>
                  <div className="py-4">
                    {currentTemplate.mockupHtml}
                  </div>
                </div>

                {/* Real code scroll area */}
                <div className="space-y-1.5">
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest font-mono">KONKRETNY KOD ŹRÓDŁOWY PLIKU "{currentTemplate.files[selectedFileIndex].name}"</span>
                  <div className="bg-[#020306] border border-white/5 p-3 rounded-xl font-mono text-[10px] text-slate-300 h-[190px] overflow-y-auto custom-scrollbar text-left relative overflow-x-auto whitespace-pre">
                    {currentTemplate.files[selectedFileIndex].content}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
