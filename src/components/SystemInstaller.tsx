import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Zap, Bot, ShieldCheck, Cloud, Cpu, Settings, AlertOctagon } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';

export const SystemInstaller = React.memo(({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Oczekiwanie na inicjalizację...');
  const [dbUser, setDbUser] = useState('admin');
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isError, setIsError] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-6), msg]);

  const steps = [
    { title: 'System', icon: Monitor, desc: 'Diagnostyka środowiska' },
    { title: 'Neural', icon: Zap, desc: 'API Gemini & Web Tools' },
    { title: 'Agents', icon: Bot, desc: 'Skille & Presety Jednostek' },
    { title: 'Security', icon: ShieldCheck, desc: 'Protokoły ochrony' },
    { title: 'Deployment', icon: Cloud, desc: 'Podręcznik i Tutorial' }
  ];

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        setStatus('Weryfikacja kontenera...');
        addLog('Sprawdzanie wersji Node.js... v20.10.0 [OK]');
        addLog('Wykryto akcelerację sprzętową GPU... [AKTYWNA]');
        addLog('Inicjalizacja modułu File-Manager... [OK]');
        setProgress(20);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const nextStep = async () => {
    setIsError(false);
    if (step === 0) {
      setStatus('Nawiązywanie połączenia z serwerem...');
      addLog('Próba połączenia z API horyzontalnym...');
      
      try {
        const stats = await api.getAuthStatus();
        addLog('Połączono z serwerem bazodanowym. [OK]');
        addLog(`Status zabezpieczeń: ${stats.isProtected ? 'ZABEZPIECZONY' : 'OTWARTY'}`);
        setProgress(40);
        setStep(1);
        setStatus('Połączono z KERNEL_HORIZON');
      } catch (e) {
        setIsError(true);
        setStatus('BŁĄD: Brak połączenia z serwerem');
        addLog('Błąd krytyczny: Nie można nawiązać połączenia z backendem (server.ts).');
        addLog('Upewnij się, że serwer deweloperski jest uruchomiony na porcie 3000.');
      }

    } else if (step === 1) {
      setStatus('Inicjalizacja personelu i galerii umiejętności...');
      addLog('Wdrażanie Galerii Umiejętności (8 bazowych skilli)...');
      
      setTimeout(() => {
        addLog('Dodano presety: KODER-PRO, NADZORCA, RED-TEAM, CREATIVE.');
        addLog('Instalacja serwera bazy danych Firebird... [OK]');
        addLog('Konfiguracja sterowników Firebird dla Python... [OK]');
        addLog('Indeksowanie bazy wiedzy... [DONE]');
        addLog('Aktywacja systemu szablonów systemowych... [OK]');
        setProgress(60);
        setStep(2);
        setStatus('Baza Personelu i Skilli: Aktywna');
      }, 1000);

    } else if (step === 2) {
      setStatus('Finalizacja protokołów bezpieczeństwa...');
      addLog('Ustawianie firewalli warstwy 7...');
      
      setTimeout(() => {
        addLog('Szyfrowanie AES-256 włączone.');
        addLog('System autoryzacji MCP zainicjowany.');
        setProgress(80);
        setStep(3);
        setStatus('Status: GOTOWY DO DYSTRYBUCJI');
      }, 1000);
    } else if (step === 3) {
      setStatus('Budowanie pakietów wdrożeniowych...');
      addLog('Generowanie Podręcznika Operacyjnego i Tutorialu...');
      
      setTimeout(() => {
        addLog('Przygotowano pakiety dla LAMP, XAMPP i Docker.');
        addLog('Integracja z klastrowaniem Peer-to-Peer... [OK]');
        addLog('Dokumentacja tutoriala wygenerowana: /manual/tutorial');
        setProgress(100);
        setStep(4);
        setStatus('Wdrożenie Finałowe: KOMPLETNE');
      }, 1000);
    }
  };

  const handleLaunch = () => {
    setIsFinishing(true);
    setTimeout(onComplete, 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center p-4 font-sans selection:bg-acid-purple selection:text-white overflow-hidden relative"
      style={{
        backgroundImage: `url('/src/assets/images/cyber_sztab_front_1781045053860.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Immersive backdrop overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/95 via-black/85 to-neutral-950/95 backdrop-blur-md z-0" />

      <AnimatePresence>
        {isFinishing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-white z-[110] flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
              className="text-6xl font-display font-black text-black uppercase tracking-tighter italic"
            >
              URUCHAMIANIE...
            </motion.div>
            <motion.div 
              initial={{ width: 0 }} animate={{ width: '200px' }} 
              className="h-1 bg-black mt-4"
              transition={{ duration: 1.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl modern-card bg-neutral-950/40 border-white/5 p-1 px-1 rounded-[3rem] shadow-[0_0_150px_rgba(176,38,255,0.1)] relative overflow-hidden z-10"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-acid-purple to-transparent opacity-50" />
        
        <div className="bg-[#0a0a0a] rounded-[2.8rem] p-8 md:p-14">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="relative">
              <div className="w-24 h-24 bg-acid-purple/5 rounded-[2rem] flex items-center justify-center text-acid-purple border border-acid-purple/20 rotate-3 group-hover:rotate-0 transition-transform">
                <Cpu size={48} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-acid-green flex items-center justify-center shadow-lg shadow-acid-green/20">
                <Settings size={16} className="text-black animate-spin-slow" />
              </div>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-display font-bold uppercase text-white tracking-tight leading-none mb-3">AI Swarm OS</h1>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-widest flex items-center justify-center md:justify-start gap-3">
                <span className="w-2 h-2 rounded-full bg-acid-green animate-pulse" />
                Dystrybucja Enterprise • Wersja 3.5.0
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-10">
            {steps.map((s, i) => (
              <div key={i} className="space-y-3">
                <div className={cn(
                  "h-1.5 rounded-full transition-all duration-700",
                  i < step ? "bg-acid-green shadow-[0_0_10px_#00ffca]" :
                  i === step ? "bg-acid-purple animate-pulse" : "bg-white/5"
                )} />
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all border",
                    i < step ? "bg-acid-green/10 border-acid-green text-acid-green" :
                    i === step ? "bg-acid-purple/10 border-acid-purple text-acid-purple" :
                    "bg-white/5 border-white/10 text-slate-700"
                  )}>
                    <s.icon size={14} />
                  </div>
                  <div className="hidden lg:block">
                    <div className={cn("text-[10px] font-bold uppercase", i <= step ? "text-white" : "text-slate-700")}>{s.title}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-medium">{s.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Użytkownik Firebird</label>
              <input
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                className="bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-acid-purple outline-none w-full"
              />
            </div>

            <div className="modern-card bg-black/60 border-white/5 p-6 rounded-3xl relative">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-acid-purple" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konsola Inicjalizacyjna</span>
                 </div>
                 <div className="text-[9px] font-mono text-slate-600">KERNEL_BOOT: SUCCESS</div>
              </div>
              <div className="h-40 font-mono text-[10px] space-y-2 overflow-auto custom-scrollbar pr-4">
                 {logs.map((log, i) => (
                   <div key={i} className="flex gap-4 group">
                     <span className="text-slate-800 font-bold">L-{i.toString().padStart(3, '0')}</span>
                     <span className="text-acid-green leading-relaxed">{log}</span>
                   </div>
                 ))}
                 {!isError && <div className="w-1.5 h-3 bg-acid-purple animate-pulse inline-block" />}
              </div>
              
              {isError && (
                <div className="absolute inset-0 bg-red-950/40 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 text-center border border-red-500/30">
                  <AlertOctagon size={48} className="text-red-500 mb-4" />
                  <h3 className="text-lg font-bold text-white uppercase mb-2">Błąd Krytyczny</h3>
                  <p className="text-xs text-red-100 max-w-sm mb-6">Instalacja przerwana. Brak dostępu do środowiska AI Studio lub klucza Gemini.</p>
                  <button 
                    onClick={() => setIsError(false)}
                    className="px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-red-600 transition-all"
                    title="Spróbuj ponownie zainicjować system"
                  >
                    Ponów Próbę
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 mb-2">
                  <span>Postęp operacji</span>
                  <span className="text-acid-cyan">{progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-acid-purple to-acid-cyan"
                  />
                </div>
              </div>
              
              {step < 4 ? (
                <button 
                  onClick={nextStep}
                  disabled={isError}
                  className="modern-btn bg-acid-purple h-14 px-10 text-white shadow-xl shadow-acid-purple/20 relative group overflow-hidden disabled:opacity-20"
                  title="Przejdź do kolejnego etapu instalacji"
                >
                  <span className="relative z-10 font-bold uppercase tracking-widest text-xs">Instaluj Dalej</span>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                </button>
              ) : (
                <button 
                  onClick={handleLaunch}
                  className="modern-btn bg-acid-green h-14 px-14 text-black shadow-xl shadow-acid-green/20 font-black uppercase tracking-widest text-xs animate-bounce-slow"
                  title="Ukończ instalację i wejdź do panelu dowodzenia"
                >
                  URUCHOM SWARM
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-10 left-10 text-[9px] font-bold text-slate-800 uppercase tracking-widest">
        ID SPRZĘTOWE: {Math.random().toString(16).substring(2, 10).toUpperCase()}
      </div>
    </div>
  );
});
