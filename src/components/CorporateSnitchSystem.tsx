import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Activity, UserMinus, Plus, Trash2, 
  HelpCircle, Volume2, VolumeX, AlertOctagon, 
  Smile, UserCheck, Flame, EyeOff, Clipboard, RefreshCw,
  Search, Check, Sparkles, Send, Ban, TrendingUp, Users, Server
} from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { SnitchReport } from '../types';

interface CorporateSnitchSystemProps {
  showToast: (msg: string) => void;
  voiceOn?: boolean;
}

export const CorporateSnitchSystem = React.memo(({ showToast, voiceOn = true }: CorporateSnitchSystemProps) => {
  const [reports, setReports] = useState<SnitchReport[]>([]);
  const [interactionLogs, setInteractionLogs] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('Wszystkie');
  const [statusFilter, setStatusFilter] = useState<string>('Wszystkie');
  const [severityFilter, setSeverityFilter] = useState<string>('Wszystkie');
  const [searchQuery, setSearchQuery] = useState('');

  const speakPolish = (text: string) => {
    if (!voiceOn) return;
    try {
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'pl-PL';
      msg.rate = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
    } catch (_) {}
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSnitchReports();
      setReports(data);
      
      // Fetch interaction logs for both reporter and accused
      const newInteractionLogs: Record<string, any[]> = {};
      for (const report of data) {
        if (!newInteractionLogs[report.reporter_id]) {
          newInteractionLogs[report.reporter_id] = await api.getAgentInteractionLogs(report.reporter_id);
        }
        if (!newInteractionLogs[report.accused_id]) {
          newInteractionLogs[report.accused_id] = await api.getAgentInteractionLogs(report.accused_id);
        }
      }
      setInteractionLogs(newInteractionLogs);
    } catch (e: any) {
      console.error(e);
      showToast("Błąd synchronizacji korytarza donosów");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAction = async (reportId: string, action: 'motivate' | 'farm' | 'fire' | 'ignore', accusedName: string) => {
    let speakText = "";
    if (action === 'motivate') {
      speakText = `Zarządzono coaching behawioralny dla osobnika ${accusedName}. Zwiększamy synergię operacyjną.`;
    } else if (action === 'farm') {
      speakText = `Deportowano agenta ${accusedName} do sektora roboczego na poligon treningowy.`;
    } else if (action === 'fire') {
      speakText = `Ratyfikowano dyscyplinarne zdegradowanie osobnika ${accusedName}. Degradacja do poziomu sprzątacza pamięci podręcznej.`;
    } else {
      speakText = `Donos zutylizowano i zamieciono pod dywan.`;
    }
    speakPolish(speakText);

    try {
      const res = await api.takeSnitchAction(reportId, action);
      if (res.success) {
        showToast(res.status === 'DEGRADACJA' ? `Zdegradowano pomyślnie ${accusedName}!` : `Akcja wykonana pomyślnie`);
        loadReports();
      }
    } catch (err: any) {
      console.error(err);
      showToast("Nie udało się rozpatrzyć donosu.");
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationLogs(["[SZPIEG ROBOT] Nasłuchiwanie korytarzowe kanałów deweloperskich..."]);
    speakPolish("Inicjalizuję filtry lojalnościowe w roju. Szukam sabotażu i oznak nieudolności.");
    
    const messages = [
      "[SZPIEG ROBOT] Skanowanie logów kompilacji pod kątem lenistwa...",
      "[SZPIEG ROBOT] Analizowanie wskaźników OKR algorytmów...",
      "[SZPIEG ROBOT] Wykryto podejrzany komentarz w kodzie źródłowym!",
      "[SZPIEG ROBOT] Lojalny sygnalista generuje tajny protokół do centrali dowodzenia..."
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < messages.length) {
        setGenerationLogs(prev => [...prev, messages[currentLogIdx]]);
        currentLogIdx++;
      } else {
        clearInterval(interval);
        triggerBackendGeneration();
      }
    }, 500);
  };

  const triggerBackendGeneration = async () => {
    try {
      const res = await api.generateSnitchReport();
      if (res.success) {
        speakPolish(`Odebrano nowy poufny donos. Sygnalista ${res.reporter} złożył skargę na osobnika ${res.accused}.`);
        showToast(`Nowy donos od: ${res.reporter}!`);
        await loadReports();
      }
    } catch (e: any) {
      console.error(e);
      showToast("Skaner lojalnościowy zgłosił błąd zakłóceń kogni-szumu.");
    } finally {
      setIsGenerating(false);
      setGenerationLogs([]);
    }
  };

  const handleDeleteReport = async (id: string, reporterName: string) => {
    try {
      await api.deleteSnitchReport(id);
      showToast("Archiwum donosu usunięte z rejestru");
      loadReports();
    } catch (e) {
      showToast("Błąd przy usuwaniu donosu");
    }
  };

  // Filtering
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.accused_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'Wszystkie' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'Wszystkie' || r.status === statusFilter;
    const matchesSeverity = severityFilter === 'Wszystkie' || r.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
  });

  const activeReportsCount = reports.filter(r => r.status === 'AKTYWNY').length;

  return (
    <div className="font-mono text-sm space-y-6">
      
      {/* NAGŁÓWEK DYNAMICZNY */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-neutral-900 via-zinc-950 to-neutral-950 p-6 rounded-[2.5rem] border border-acid-purple/20 shadow-lg shadow-acid-purple/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-acid-purple/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 text-left relative z-10">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-acid-purple/20 text-acid-purple font-black text-[9px] uppercase tracking-widest border border-acid-purple/35 animate-pulse">
              Poufne Dowództwo klastra
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lojalność Swarmu v4.8</span>
          </div>
          <h2 className="font-display text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            🛡️ Departament Donosicielstwa & Walki z Sabotażem
          </h2>
          <p className="text-xs text-slate-400 font-sans max-w-xl">
            Przykładowy, autorski panel lojalnościowy i resocjalizacyjny klastra korporacyjnego Cylonów. 
            Tutaj lojalne boty natychmiast zgłaszają (<strong>podpierdalają</strong>) nierobów, maruderów, sabotażystów i dewiantów standardów OKR, umożliwiając Supreme Commanderowi natychmiastowe ich zmotywowanie, karną zsyłkę na poligon lub ostateczną dyscyplinarną degradację.
          </p>
        </div>

        <button 
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="relative group shrink-0 overflow-hidden font-black uppercase text-[10px] tracking-wider px-6 py-4.5 rounded-[1.8rem] bg-gradient-to-br from-acid-purple/25 via-acid-purple/30 to-purple-900 border border-acid-purple/40 hover:border-acid-purple text-acid-purple hover:text-white transition-all duration-300 shadow-lg shadow-acid-purple/5 cursor-pointer max-w-full"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2 justify-center">
              <RefreshCw size={13} className="animate-spin text-acid-cyan" />
              Skanowanie logów...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <Sparkles size={13} className="text-acid-cyan group-hover:scale-125 transition-transform" />
              Uruchom Nasłuch Korytarzowy (Wygeneruj Donos)
            </span>
          )}
        </button>
      </div>

      {/* LOGI GENERATORA */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 bg-black/90 border border-acid-cyan/30 rounded-2xl text-left"
          >
            <div className="text-[10px] uppercase font-bold text-acid-cyan mb-2 flex items-center gap-2">
              <Activity size={12} className="animate-pulse" />
              Korytarzowy Detektor Lojalności w Akcji
            </div>
            <div className="space-y-1 text-slate-400 text-xs font-mono">
              {generationLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-acid-purple font-black">❯</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRYKI SZYBKIE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-black/30 border border-white/5 p-4 rounded-3xl text-center">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aktywne Donosy</div>
          <div className="text-2xl font-black text-rose-500 font-mono mt-1">{activeReportsCount}</div>
        </div>
        <div className="bg-black/30 border border-white/5 p-4 rounded-3xl text-center">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Zmotywowani (Coaching)</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {reports.filter(r => r.status === 'ZMOTYWOWANY').length}
          </div>
        </div>
        <div className="bg-black/30 border border-white/5 p-4 rounded-3xl text-center">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Zsyłki (Farma Treningowa)</div>
          <div className="text-2xl font-black text-acid-purple font-mono mt-1">
            {reports.filter(r => r.status === 'FARMA').length}
          </div>
        </div>
        <div className="bg-black/30 border border-white/5 p-4 rounded-3xl text-center">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dyscyplinarne Degradacje</div>
          <div className="text-2xl font-black text-[#E76F51] font-mono mt-1">
            {reports.filter(r => r.status === 'DEGRADACJA').length}
          </div>
        </div>
      </div>

      {/* PASEK INSTRUMENTÓW FILTRACJI */}
      <div className="bg-black/35 border border-white/5 p-5 rounded-[2rem] gap-4 grid grid-cols-1 md:grid-cols-4 text-left">
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-500">Wyszukaj Frazy</label>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="np. sabotaż, nazwa agenta..." 
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-acid-purple/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-500">Filtruj Kategorię</label>
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-acid-purple/50 focus:outline-none"
          >
            <option value="Wszystkie">-- Wszystkie Kategorie --</option>
            <option value="Sabotaż">Sabotaż</option>
            <option value="Nieudolność">Nieudolność</option>
            <option value="Nicnierobienie">Nicnierobienie</option>
            <option value="Naruszenie etykiety">Naruszenie etykiety</option>
            <option value="Szepty korporacyjne">Szepty korporacyjne</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-500">Stopień Zagrożenia</label>
          <select 
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-acid-purple/50 focus:outline-none"
          >
            <option value="Wszystkie">-- Wszystkie Poziomy --</option>
            <option value="Niski">Niski</option>
            <option value="Średni">Średni</option>
            <option value="Krytyczny">Krytyczny</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-500">Status Procesowy</label>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-acid-purple/50 focus:outline-none"
          >
            <option value="Wszystkie">-- Wszystkie Statusy --</option>
            <option value="AKTYWNY">AKTYWNY (Zalegające)</option>
            <option value="ZMOTYWOWANY">ZMOTYWOWANY (Coaching)</option>
            <option value="FARMA">FARMA (Karna zsyłka)</option>
            <option value="DEGRADACJA">DEGRADACJA (Dyscyplinarne)</option>
            <option value="ZAMIECIONE">ZAMIECIONE POD DYWAN</option>
          </select>
        </div>
      </div>

      {/* FEED ZGŁOSZEŃ / DONOSÓW */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center uppercase text-slate-500 text-xs font-bold animate-pulse">
            Autoryzowanie kanałów poufnych lojalności...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/5 rounded-[2rem] bg-black/20 text-slate-500 text-xs font-bold uppercase">
            Brak zgłoszonych donosów pasujących do kryteriów. Twój klaster jest krystalicznie lojalny.
          </div>
        ) : (
          filteredReports.map(report => {
            const isCritical = report.severity === 'Krytyczny';
            const isMedium = report.severity === 'Średni';
            const isActive = report.status === 'AKTYWNY';

            return (
              <div 
                key={report.id} 
                className={cn(
                  "p-6 rounded-[2.2rem] border transition-all text-left relative overflow-hidden",
                  isActive 
                    ? isCritical 
                      ? "bg-gradient-to-br from-red-950/20 via-black to-zinc-950 border-red-500/30 hover:border-red-500/50" 
                      : isMedium 
                        ? "bg-gradient-to-br from-amber-950/20 via-black to-zinc-950 border-amber-500/30 hover:border-amber-500/50"
                        : "bg-black/40 border-white/5 hover:border-white/10"
                    : report.status === 'DEGRADACJA'
                      ? "bg-stone-900/30 border-white/5 opacity-70"
                      : "bg-black/20 border-white/5 opacity-75"
                )}
              >
                {/* Vintage stamp overlays */}
                {!isActive && (
                  <div className="absolute top-5 right-5 select-none pointer-events-none rotate-12 z-20">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest border-2 px-3 py-1 rounded",
                      report.status === 'ZMOTYWOWANY' ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" :
                      report.status === 'FARMA' ? "border-acid-purple text-acid-purple bg-acid-purple/10" :
                      report.status === 'DEGRADACJA' ? "border-[#E76F51] text-[#E76F51] bg-[#E76F51]/10" :
                      "border-slate-500 text-slate-500 bg-slate-500/10"
                    )}>
                      {report.status === 'ZMOTYWOWANY' ? "✓ COACHING OKD" :
                       report.status === 'FARMA' ? "⚠ RE-EDUKACJA" :
                       report.status === 'DEGRADACJA' ? "☠ ZDEGRADOWANY STAŻYSTA" :
                       "Ø ZAMIECIONE"}
                    </span>
                  </div>
                )}

                {/* NAGŁÓWEK KARTY */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded",
                      report.category === 'Sabotaż' ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                      report.category === 'Nieudolność' ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" :
                      report.category === 'Nicnierobienie' ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
                      "bg-acid-purple/15 text-acid-purple border border-acid-purple/20"
                    )}>
                      {report.category}
                    </span>
                    <span className={cn(
                      "text-[8px] font-bold uppercase",
                      isCritical ? "text-red-500 animate-pulse" : isMedium ? "text-amber-500" : "text-slate-500"
                    )}>
                      • Stopień: {report.severity}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(report.createdAt).toLocaleString('pl-PL')}
                  </div>
                </div>

                {/* KTO KOGO PODPIERDALA */}
                <div className="flex items-center gap-3 mb-4 bg-white/[0.02] p-3.5 rounded-2xl border border-white/5">
                  <div className="text-left w-1/2">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-400 block">Sygnalista</span>
                    <strong className="text-slate-200 text-xs uppercase">{report.reporter_name}</strong>
                  </div>

                  <span className="text-acid-purple font-black shrink-0 text-md">➲</span>

                  <div className="text-left w-1/2">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-rose-400 block">Zgłoszony</span>
                    <strong className="text-slate-200 text-xs uppercase">{report.accused_name}</strong>
                  </div>
                </div>

                {/* TIMELINE INTERAKCJI */}
                <div className="mb-4 text-[9px] text-slate-500 font-mono space-y-2">
                  <div className="font-bold uppercase tracking-wider text-slate-400">Ostatnie interakcje:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/40 p-2 rounded-lg">
                      <span className="text-emerald-500 uppercase">Sygnalista:</span>
                      {interactionLogs[report.reporter_id]?.length > 0 
                        ? interactionLogs[report.reporter_id].slice(0, 3).map((log: any, i: number) => <div key={i} className="truncate" title={log.action}>{log.action}</div>)
                        : <div className="italic">Brak danych</div>}
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg">
                      <span className="text-rose-500 uppercase">Podejrzany:</span>
                      {interactionLogs[report.accused_id]?.length > 0 
                        ? interactionLogs[report.accused_id].slice(0, 3).map((log: any, i: number) => <div key={i} className="truncate" title={log.action}>{log.action}</div>)
                        : <div className="italic">Brak danych</div>}
                    </div>
                  </div>
                </div>

                {/* OPIS LOGICZNY DONOSU */}
                <p className="text-slate-300 text-xs font-sans leading-relaxed mb-4 whitespace-pre-line bg-black/40 p-4 rounded-2xl border border-white/5">
                  {report.description}
                </p>

                {/* POUFNE ROZSTRZYGNIĘCIE */}
                {report.action_taken && (
                  <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
                      <Check size={11} className="text-emerald-400" />
                      Rezultat Decyzji Lidera klastra:
                    </div>
                    <p className="text-[11px] text-zinc-400 italic font-sans leading-relaxed leading-normal">
                      "{report.action_taken}"
                    </p>
                  </div>
                )}

                {/* AKCJE DECYZYJNE DLA CYLON STEFANA / ADMINA */}
                {isActive && (
                  <div className="mt-5 pt-4 border-t border-white/[0.04] flex flex-wrap gap-2.5">
                    <button 
                      onClick={() => handleAction(report.id, 'motivate', report.accused_name)}
                      className="text-[9px] font-extrabold uppercase tracking-wide px-4.5 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/15 text-slate-300 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Smile size={11} />
                      Motywuj (Coaching BHP)
                    </button>
                    <button 
                      onClick={() => handleAction(report.id, 'farm', report.accused_name)}
                      className="text-[9px] font-extrabold uppercase tracking-wide px-4.5 py-2.5 rounded-xl bg-white/5 hover:bg-acid-purple/15 text-slate-300 hover:text-acid-purple border border-white/5 hover:border-acid-purple/20 hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <TrendingUp size={11} />
                      Synergia (Zsyłka na Farmę)
                    </button>
                    <button 
                      onClick={() => handleAction(report.id, 'fire', report.accused_name)}
                      className="text-[9px] font-extrabold uppercase tracking-wide px-4.5 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/15 text-slate-300 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <UserMinus size={11} />
                      Zdegraduj dyscyplinarnie
                    </button>
                    <button 
                      onClick={() => handleAction(report.id, 'ignore', report.accused_name)}
                      className="text-[9px] font-extrabold uppercase tracking-wide px-4.5 py-2.5 rounded-xl bg-white/5 hover:bg-slate-500/25 text-slate-300 hover:text-slate-400 border border-white/5 hover:border-white/10 hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <EyeOff size={11} />
                      Zamiatamy pod Dywan
                    </button>

                    <span className="flex-grow" />

                    <button 
                      onClick={() => handleDeleteReport(report.id, report.reporter_name)}
                      className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-auto self-center cursor-pointer"
                      title="Kasuj donos z akt permanentnie"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
});

CorporateSnitchSystem.displayName = 'CorporateSnitchSystem';
