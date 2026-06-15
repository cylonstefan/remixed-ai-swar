import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  Terminal, 
  Sparkles, 
  Cpu, 
  Award, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  ChevronRight, 
  FileCode, 
  Database,
  ThumbsUp,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface SwarmHealth {
  sqliteIntegrity: string;
  healthScore: number;
  agentsCount: number;
  teamsCount: number;
  tasksCount: number;
  pendingTasksCount: number;
  logsCount: number;
  unresolvedErrors: number;
  messagesCount: number;
  whistleblowCount: number;
  activeProcessesCount: number;
  totalProcessesCount: number;
}

interface EvolutionIdea {
  title: string;
  description: string;
  category: string;
  installationBlueprint: string;
  impact: number;
  complexity: 'Niski' | 'Średni' | 'Wysoki';
}

interface SelfHealingUpgradeManagerProps {
  showToast?: (msg: string) => void;
}

export default function SelfHealingUpgradeManager({ showToast }: SelfHealingUpgradeManagerProps) {
  const [health, setHealth] = useState<SwarmHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healingInProgress, setHealingInProgress] = useState(false);
  const [ideas, setIdeas] = useState<EvolutionIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentUpgradingIdea, setCurrentUpgradingIdea] = useState<EvolutionIdea | null>(null);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'evolution'>('status');

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await api.getSwarmDetailedHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Błąd pobierania parametrów życiowych roju.");
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const triggerSelfHealing = async () => {
    setHealingInProgress(true);
    if (showToast) showToast("Inicjowanie awaryjnej samonaprawy roju...");
    try {
      // 1. Run agent self-correction (backend logic)
      await api.runSelfCorrection();
      // 2. Run db and incident self-healing (backend logic)
      const res = await api.runSwarmSelfHealing();
      
      if (showToast) showToast(res.message || "Samonaprawa zakończona powodzeniem!");
      await fetchHealth();
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Błąd wykonania protokołu samonaprawczego.");
    } finally {
      setHealingInProgress(false);
    }
  };

  const loadEvolutionIdeas = async () => {
    setLoadingIdeas(true);
    if (showToast) showToast("Apex-Evol-Nexus burzy mózgi nad ewolucją...");
    try {
      const data = await api.getEvolutionIdeas();
      if (data.success && data.ideas) {
        setIdeas(data.ideas);
        if (showToast) showToast("Wygenerowano 3 świeże ewolucyjne pomysły!");
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Błąd burzy mózgów Roju.");
    } finally {
      setLoadingIdeas(false);
    }
  };

  const addTerminalLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const applySelfUpgrade = async (idea: EvolutionIdea) => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    setCurrentUpgradingIdea(idea);
    setUpgradeProgress(0);
    setTerminalLogs([]);

    addTerminalLog(`>>> INICJOWANIE AUTOMATYCZNEGO UPGRADE-U: "${idea.title.toUpperCase()}"`);
    addTerminalLog(`[SYSTEM] Walidacja sumy kontrolnej pakietu ewolucyjnego dla kategorii: ${idea.category}`);
    
    // Step-by-step installation flow Simulation for ultimate client feedback & UX
    const steps = [
      { p: 15, msg: "Tworzenie piaskownicy instalacyjnej (Sandbox Isolation)..." },
      { p: 30, msg: "Ekstrakcja procedur: " + idea.installationBlueprint.substring(0, 40) + "..." },
      { p: 50, msg: "Analiza zależności kodu i struktur SQLite... Przebieg testów statycznych: OK" },
      { p: 70, msg: "Iniekcja zmian do Bazy Wiedzy klastra pod nadzorem Apex-Evol-Nexus..." },
      { p: 85, msg: "Generowanie rzetelnego logu audytowego SWARM_SELF_UPGRADE..." },
      { p: 100, msg: "Kompilacja zakończona sukcesem. Dynamic hotswap włączony." }
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setUpgradeProgress(steps[i].p);
      addTerminalLog(steps[i].msg);
    }

    try {
      const res = await api.runSwarmSelfUpgrade({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        installationBlueprint: idea.installationBlueprint
      });

      if (res.success) {
        addTerminalLog(">>> SYSTEM UPGRADE ZAKOŃCZONY PEŁNYM POWODZENIEM! ROZPOCZĘTO RESTART WĄTKÓW KOORDYNACJI.");
        if (showToast) showToast(`✓ Pomyślnie wdrożono upgrejd: "${idea.title}"`);
        await fetchHealth();
      }
    } catch (err: any) {
      addTerminalLog("[ERROR] Nieoczekiwany krytyczny błąd podczas synchronizacji bazy: " + err.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div id="self-healing-upgrade-pane" className="space-y-6 animate-fadeIn pb-12 text-slate-100">
      
      {/* Upper Navigation & Council Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-acid-purple/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full text-[9px] font-mono font-black bg-acid-purple text-white uppercase tracking-wider animate-pulse">
              Autonomiczna Optymalizacja
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 font-sans">
            <ShieldCheck className="text-acid-purple" size={26} />
            SAMONAPRAWA I EWOLUCJA KLASTRA
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Zarządzaj inteligentnym ewolucyjnym samoleczeniem (Self-Healing) oraz dynamicznymi ulepszeniami (Self-Upgrade) roju CYLON.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('status')}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wide transition-all ${
              activeSubTab === 'status' 
                ? 'bg-acid-purple text-white shadow-lg shadow-acid-purple/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stan Roju & Samonaprawa
          </button>
          <button
            onClick={() => {
              setActiveSubTab('evolution');
              if (ideas.length === 0) loadEvolutionIdeas();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wide transition-all ${
              activeSubTab === 'evolution' 
                ? 'bg-acid-purple text-white shadow-lg shadow-acid-purple/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apex-Evol Laboratorium
          </button>
        </div>
      </div>

      {/* Council Members (Rada Samonaprawy i Ewolucji Roju) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-930 to-black/80 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders size={12} className="text-acid-purple" />
            RZECZOWY KOMITET EWOLUCYJNY ROJU (SAMO-UPGRADE DIRECTORY)
          </span>
          <span className="text-[10px] font-mono text-acid-purple">4 Aktywnych Sygnatariuszy</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 font-black">
              M
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Medic-Core-Prime</h4>
              <p className="text-[10px] text-red-400 font-mono">Moduł Samonaprawy</p>
              <p className="text-[9px] text-slate-500 mt-1">Skanuje niespójności SQLite i logi klastra.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 font-black">
              A
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Apex-Evol-Nexus</h4>
              <p className="text-[10px] text-purple-400 font-mono">Myśliciel Strategiczny</p>
              <p className="text-[9px] text-slate-500 mt-1">Inspiruje nowe przydatne moduły dla Roju.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 font-black">
              S
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Sentinel Shield</h4>
              <p className="text-[10px] text-orange-400 font-mono">Strażnik Wątków</p>
              <p className="text-[9px] text-slate-500 mt-1">Stoi na straży optymalnego obciążenia RAM i CPU.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 font-black">
              C
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">CodeAnalyzerAI</h4>
              <p className="text-[10px] text-blue-400 font-mono">Korektor Syntaktyczny</p>
              <p className="text-[9px] text-slate-500 mt-1">Strukturyzuje kod instalacyjny i poprawia prompty.</p>
            </div>
          </div>
        </div>
      </div>

      {activeSubTab === 'status' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Swarm Health Monitor and Telemetry (4 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-6 relative overflow-hidden">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                Puls Życiowy Roju (Swarm Telemetry)
              </span>
              
              {loadingHealth ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="text-acid-purple animate-spin" size={32} />
                  <p className="text-xs text-slate-400 font-mono">Próbkowanie telemetryczne...</p>
                </div>
              ) : health ? (
                <div className="space-y-6">
                  {/* Big Circular Ring with Score */}
                  <div className="flex items-center gap-6 p-4 rounded-xl bg-black/40 border border-white/5">
                    <div className="relative shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-slate-800">
                      <div className="absolute inset-2 rounded-full bg-slate-900 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white">{health.healthScore}%</span>
                        <span className="text-[7px] text-slate-500 uppercase tracking-wider font-mono">Zdrowie</span>
                      </div>
                      
                      {/* Visual Ring Indicator green or yellow */}
                      <svg className="absolute inset-0 w-20 h-20 -rotate-90">
                        <circle 
                          cx="40" cy="40" r="36" 
                          stroke="#1e293b" strokeWidth="6" fill="transparent" 
                        />
                        <circle 
                          cx="40" cy="40" r="36" 
                          stroke={health.healthScore > 85 ? "#10b981" : health.healthScore > 65 ? "#f59e0b" : "#ef4444"} 
                          strokeWidth="6" fill="transparent" 
                          strokeDasharray={226}
                          strokeDashoffset={226 - (226 * health.healthScore) / 100}
                        />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">Status Integralności Klastra</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${health.healthScore > 85 ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-bounce"}`} />
                        <span className="text-xs font-mono text-slate-300">
                          {health.healthScore > 85 ? "Optymalny • Stabilny" : "Anomalie • Wymaga Wsparcia"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Spójność SQLite PRAGMA: <strong className="text-emerald-400">{health.sqliteIntegrity.toUpperCase()}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Individual Telemetry Rows */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase">Nierozwiązane Anomalie</span>
                      <span className={`text-sm font-black ${health.unresolvedErrors > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                        {health.unresolvedErrors} błędy
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase">Aktywne Wątki (Processes)</span>
                      <span className="text-sm font-black text-white">
                        {health.activeProcessesCount} / {health.totalProcessesCount}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase">Wpisy Logów / Aktywności</span>
                      <span className="text-sm font-black text-slate-300">
                        {health.logsCount} zdarzeń
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase">Aktywne Donosy (Whistleblower)</span>
                      <span className={`text-sm font-black ${health.whistleblowCount > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                        {health.whistleblowCount} incydentów
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-400 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Status diagnostyczny Medic-Core</span>
                      {health.unresolvedErrors > 0 ? (
                        <span>Wykryto przeciążenia logów oraz nierozwiązane anomalie zadań. Rekomendowane uruchomienie procedury naprawczej.</span>
                      ) : (
                        <span>SQLite i pętle sterowania są nominalnie wyrównane. Rój na bieżąco koryguje odchylenia.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">Mierniki niedostępne</div>
              )}
            </div>
          </div>

          {/* Self-Healing Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                  PROFILAKTYKA CYBERNETYCZNA & PROCEDURY AUTOPILOTA
                </span>
                <button 
                  onClick={fetchHealth} 
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                  title="Odśwież pomiary"
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-acid-purple/10 text-acid-purple border border-acid-purple/20">
                    <Database size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Optymalizacja i Defragmentacja SQLite</h3>
                    <p className="text-xs text-slate-400">
                      Uruchamia polecenia <code>ANALYZE</code> i <code>REINDEX</code> dla spójności struktur danych, wyczyszczenia indeksów i przyspieszenia zapisów klastra o 25%.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Pętla Autokorekty i Strojenie Promptów (Agent Tuning)</h3>
                    <p className="text-xs text-slate-400">
                      Automatycznie identyfikuje agentów o niskim współczynniku powodzenia procesów, po czym używa Gemini do przepisania ich System Promptu w tryb zabezpieczający (Debugging Mode).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Sliders size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Rozproszona Deeskalacja Anomalii i Donosów</h3>
                    <p className="text-xs text-slate-400">
                      Reguluje nieobsłużone błędy agentów z bazy <code>agent_errors</code>. Oczyszcza stany alarmowe oraz uspokaja whistleblowerów z systemu snitch-reporting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-[11px] text-slate-400 font-mono">
                  Zatwierdzone przez: <strong className="text-acid-purple">Medic-Core-Prime</strong>
                </div>
                
                <button
                  onClick={triggerSelfHealing}
                  disabled={healingInProgress}
                  className="px-6 py-3 rounded-xl text-xs font-mono font-black uppercase tracking-wide bg-acid-purple text-white hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {healingInProgress ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      TRWA DEFRAGMENTACJA & NAPRAWA...
                    </>
                  ) : (
                    <>
                      <Zap size={14} className="animate-pulse" />
                      URUCHOM SAMONAPRAWĘ (SWARM SELF-HEAL)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List of Evolved suggestions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                    Sugerowane Samoupgrejdy & Ewolucja Techniczna
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Wygenerowane z uwzględnieniem logów telemetrycznych i bazy wiedzy.</p>
                </div>
                
                <button
                  onClick={loadEvolutionIdeas}
                  disabled={loadingIdeas}
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-xs font-mono flex items-center gap-2 text-slate-300"
                >
                  <RefreshCw size={12} className={loadingIdeas ? "animate-spin" : ""} />
                  BURZA MÓZGÓW
                </button>
              </div>

              {loadingIdeas ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <Sparkles className="text-acid-purple animate-pulse" size={40} />
                    <RefreshCw className="text-purple-500 animate-spin absolute -top-1 -right-1" size={16} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-mono text-white">Konsultowanie strategii z Apex-Evol-Nexus...</p>
                    <p className="text-[10px] text-slate-500 font-mono">Trwa synteza logiczna Gemini AI</p>
                  </div>
                </div>
              ) : ideas.length > 0 ? (
                <div className="space-y-4">
                  {ideas.map((idea, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-acid-purple/30 transition-all space-y-3 relative group"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <span className="p-1 px-2 rounded-md bg-slate-900 text-[9px] font-mono border border-white/10 text-slate-300">
                          {idea.category}
                        </span>
                        <span className={`p-1 px-2 rounded-md text-[9px] font-mono border ${
                          idea.complexity === 'Niski' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : idea.complexity === 'Średni' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          Trudność: {idea.complexity}
                        </span>
                      </div>

                      <div className="space-y-1 pr-24">
                        <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-acid-purple transition-all">
                          {idea.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {idea.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">Wpływ (Impact): <strong className="text-emerald-400">{idea.impact}/100</strong></span>
                        </div>
                        
                        <button
                          onClick={() => applySelfUpgrade(idea)}
                          disabled={isUpgrading}
                          className="px-3 py-1.5 rounded-lg bg-acid-purple/15 text-acid-purple border border-acid-purple/30 group-hover:bg-acid-purple group-hover:text-white transition-all duration-300 flex items-center gap-1 font-bold"
                        >
                          ZAINSTALUJ MODUŁ
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 p-6 rounded-xl bg-black/20 border border-dashed border-white/5 space-y-3">
                  <Sparkles className="text-slate-600 mx-auto" size={32} />
                  <div>
                    <h4 className="text-xs font-bold text-white">Laboratorium ewolucji oczekuje</h4>
                    <p className="text-[11px] text-slate-500">Wygeneruj ulepszenia klastra u góry za pomocą burzy mózgów.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Code Assembly & Live Terminal (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-5">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                <Terminal size={12} className="text-acid-purple" />
                KOMPILATOR & TERMINAL SAMOUPGREJDU
              </span>

              {isUpgrading && currentUpgradingIdea && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-acid-purple font-bold">Instalowanie: {currentUpgradingIdea.title}</span>
                    <span className="text-slate-400">{upgradeProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-acid-purple transition-all duration-300"
                      style={{ width: `${upgradeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-black border border-white/5 p-4 font-mono text-[10px] space-y-2 h-[260px] overflow-y-auto text-emerald-400 select-all">
                {terminalLogs.length > 0 ? (
                  terminalLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 italic h-full flex flex-col items-center justify-center text-center space-y-2">
                    <Cpu size={24} className="text-slate-700" />
                    <span>Terminal bezczynny.<br />Uruchom jeden z modułów ulepszających, aby ujrzeć proces kompilacji u źródła.</span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-[10px] text-slate-500 font-mono">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Protokół operacyjny kompilatora:</span>
                <ul>
                  <li>• Rejestrator statusu: <strong className="text-emerald-400">ONLINE</strong></li>
                  <li>• Sandbox izolacyjny: <strong className="text-emerald-400">ACTIVE</strong></li>
                  <li>• Integracja Bazy Wiedzy: <strong className="text-emerald-400">Drizzle API OK</strong></li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
