import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, RefreshCw, Zap, Server, Shield, Clock, Activity, 
  Play, Pause, BarChart3, Users, Cpu, Thermometer, Info, Compass, Sparkles, CheckCircle
} from 'lucide-react';
import { Team, Agent } from '../types';

interface TeamWorkloadHeatmapProps {
  teams: Team[];
  agents: Agent[];
  defaultTeamId?: string | null;
  onClose?: () => void;
}

export const TeamWorkloadHeatmap = ({ teams, agents, defaultTeamId, onClose }: TeamWorkloadHeatmapProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<{
    agentName: string;
    hour: string;
    intensity: number;
    activityText: string;
  } | null>(null);

  // Time slots (using dynamic last 12 hours counting down to current hour)
  const timeSlots = useMemo(() => {
    const slots = [];
    const currentHour = new Date().getHours();
    for (let i = 11; i >= 0; i--) {
      const h = (currentHour - i + 24) % 24;
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Set default team on load
  useEffect(() => {
    if (defaultTeamId) {
      setSelectedTeamId(defaultTeamId);
    } else if (teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    }
  }, [defaultTeamId, teams]);

  const selectedTeam = useMemo(() => {
    return teams.find(t => t.id === selectedTeamId) || teams[0] || null;
  }, [teams, selectedTeamId]);

  // Seedable activity log lists based on agent categories/roles to make logs feel genuine and human/cybernautic
  const getActivityType = (role: string, category: string, intensity: number, hour: string) => {
    const normRole = role.toLowerCase();
    const isNetwork = normRole.includes('sieć') || normRole.includes('lan') || normRole.includes('wan') || normRole.includes('host') || category.toLowerCase() === 'narzędzia';
    const isCommander = normRole.includes('dowódca') || normRole.includes('orkiestrator') || normRole.includes('lider') || category.toLowerCase() === 'komunikacja';
    const isCoder = normRole.includes('analityk') || normRole.includes('program') || normRole.includes('fullstack') || category.toLowerCase() === 'programowanie';

    if (intensity === 0) {
      return `Tryb oszczędzania energii (Idle). Minimalny ping tętna klastra, zwolnienie buforów pamięci.`;
    }

    if (isNetwork) {
      if (intensity < 30) return `Skanowanie pasywne portów klastra LAN w tle. Status: PING_OK.`;
      if (intensity < 60) return `Optymalizacja podsieci i routingu tuneli VPN IPSec. Pakiety kontrolne wysłane bez strat.`;
      if (intensity < 85) return `Wymiana sygnałów Wake-On-LAN celem wzbudzenia zapasowych węzłów cyber-roju.`;
      return `[OVERLOAD] Aktywny odpór cyberataku lub test obciążeniowy przepustowości d3 LAN (Skierowano 10Gb/s)`;
    }

    if (isCoder) {
      if (intensity < 30) return `Rutynowa analiza spójności schematów SQLite/Better-Sqlite3.`;
      if (intensity < 60) return `Refaktoryzacja asynchronicznych endpointów API serwera Express i orkiestratora.`;
      if (intensity < 85) return `Kompilacja natywnych modułów C++ (node-gyp) dla silników fizyki wektorowej Lego.`;
      return `[OVERLOAD] Gwałtowna rekonstrukcja bazy i automatyczne rozwiązywanie konfliktów migracyjnych. 92% rdzenia zaangażowane.`;
    }

    if (isCommander) {
      if (intensity < 30) return `Czuwanie, agregacja logów telemetrycznych z podwładnych modułów.`;
      if (intensity < 60) return `Planowanie kolejnej fazy debaty wieloagentowej. Koordynacja przydziałów kognitywnych.`;
      if (intensity < 85) return `Bezpośrednia orkiestracja przydziału zadań na tablicy Kanban. Ustalanie wag klastrowych.`;
      return `[OVERLOAD] Synteza merytoryczna wyników z modelami Gemini dla Dowództwa. Przetwarzanie 2.5mln tokenów.`;
    }

    // Default
    if (intensity < 30) return `Konsumpcja energii w normie. Przesunięcie mniejszych pakietów w tle.`;
    if (intensity < 60) return `Zdalne przetwarzanie podzadań, synchronizacja pamięci podręcznej.`;
    if (intensity < 85) return `Uruchomiony zaawansowany proces optymalizacji statystyk telemetrycznych.`;
    return `[OVERLOAD] Wykryto peak transakcyjny lub zapętlenie algorytmu wyszukiwania d3. Kompilator pracuje w trybie ostrym.`;
  };

  // Keep a state for actual grid workload matrix so we can mutate it or simulate real-time updates!
  // Map of selectedTeam.id -> Record<agentId, Record<hour, intensity>>
  const [workloads, setWorkloads] = useState<Record<string, Record<string, Record<string, number>>>>({});

  // Initialize workload database on build
  useEffect(() => {
    if (teams.length === 0) return;
    
    setWorkloads(prev => {
      const updated = { ...prev };
      teams.forEach(t => {
        if (!updated[t.id]) {
          updated[t.id] = {};
          t.agents.forEach(a => {
            updated[t.id][a.id] = {};
            timeSlots.forEach(slot => {
              // Deterministic seed but natural looking pattern based on char codes of name
              const charSum = a.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
              const hourNum = parseInt(slot.split(':')[0]);
              let baseVal = (charSum * (hourNum + 7)) % 101;
              // Make sure some slots are zero/idle, some are high
              if (baseVal < 15) baseVal = 0;
              else if (baseVal > 85) baseVal = Math.floor(Math.random() * 15) + 85; 
              else baseVal = Math.floor(Math.random() * 50) + 20;

              updated[t.id][a.id][slot] = baseVal;
            });
          });
        }
      });
      return updated;
    });
  }, [teams, timeSlots]);

  // Live simulation tick - updates some cells in real-time to simulate true worker activity
  useEffect(() => {
    if (!isLiveSimulating || !selectedTeam) return;

    const interval = setInterval(() => {
      setWorkloads(prev => {
        const teamId = selectedTeam.id;
        if (!prev[teamId]) return prev;

        const updatedTeamWorkload = { ...prev[teamId] };
        
        // Pick 1-2 random agents to alter 1 random recent hour intensity (last 3 columns for realism of real-time)
        selectedTeam.agents.forEach(a => {
          if (Math.random() > 0.45) { // 55% chance to update each agent's current state
            const targetHours = timeSlots.slice(-4); // last 4 hours
            const randomHour = targetHours[Math.floor(Math.random() * targetHours.length)];
            
            if (updatedTeamWorkload[a.id]) {
              const currentVal = updatedTeamWorkload[a.id][randomHour] || 30;
              let change = Math.floor(Math.random() * 31) - 15; // change by -15 to +15%
              let newVal = Math.max(0, Math.min(100, currentVal + change));

              // Occasional spike
              if (Math.random() > 0.9) newVal = 95;

              updatedTeamWorkload[a.id] = {
                ...updatedTeamWorkload[a.id],
                [randomHour]: newVal
              };
            }
          }
        });

        const next = {
          ...prev,
          [teamId]: updatedTeamWorkload
        };

        // If a cell is currently selected, live update its content as well
        if (selectedCell) {
          const agentId = selectedTeam.agents.find(a => a.name === selectedCell.agentName)?.id;
          if (agentId && updatedTeamWorkload[agentId]) {
            const freshIntensity = updatedTeamWorkload[agentId][selectedCell.hour] ?? selectedCell.intensity;
            const agentObj = selectedTeam.agents.find(a => a.id === agentId);
            if (agentObj) {
              setSelectedCell(prevCell => prevCell ? {
                ...prevCell,
                intensity: freshIntensity,
                activityText: getActivityType(agentObj.role, agentObj.category || 'Ogólne', freshIntensity, prevCell.hour)
              } : null);
            }
          }
        }

        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveSimulating, selectedTeam, timeSlots, selectedCell]);

  const currentTeamWorkloads = useMemo(() => {
    if (!selectedTeam) return {};
    return workloads[selectedTeam.id] || {};
  }, [workloads, selectedTeam]);

  // Aggregate Stats
  const teamStats = useMemo(() => {
    if (!selectedTeam || selectedTeam.agents.length === 0) {
      return { avgIntensity: 0, overloadedCount: 0, mostActiveAgent: 'Brak', peakHour: 'Brak' };
    }

    let totalSum = 0;
    let totalCount = 0;
    let maxIntensityObj = { agentName: 'Brak', val: -1 };
    let hourSums: Record<string, number> = {};
    let overloaded = 0;

    selectedTeam.agents.forEach(a => {
      const agentHours = currentTeamWorkloads[a.id] || {};
      timeSlots.forEach(slot => {
        const val = agentHours[slot] || 0;
        totalSum += val;
        totalCount++;

        if (val > 80) overloaded++;

        if (val > maxIntensityObj.val) {
          maxIntensityObj = { agentName: a.name, val };
        }

        hourSums[slot] = (hourSums[slot] || 0) + val;
      });
    });

    const avg = totalCount > 0 ? Math.round(totalSum / totalCount) : 0;
    
    let peakHour = 'Brak';
    let maxHourSum = -1;
    timeSlots.forEach(slot => {
      const sum = hourSums[slot] || 0;
      if (sum > maxHourSum) {
        maxHourSum = sum;
        peakHour = slot;
      }
    });

    return {
      avgIntensity: avg,
      overloadedCount: overloaded,
      mostActiveAgent: maxIntensityObj.agentName,
      peakHour
    };
  }, [selectedTeam, currentTeamWorkloads, timeSlots]);

  // Translate intensity to colors & text
  const getCellDetails = (intensity: number) => {
    if (intensity === 0) return {
      bgColor: 'bg-slate-950/80 border-slate-900',
      textColor: 'text-slate-600',
      label: 'IDLE (0%)',
      glow: '',
      percentColor: 'text-slate-500'
    };
    if (intensity < 30) return {
      bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
      textColor: 'text-emerald-400',
      label: 'NISKIE',
      glow: '',
      percentColor: 'text-emerald-400/80'
    };
    if (intensity < 60) return {
      bgColor: 'bg-blue-600/20 border-blue-500/30 hover:bg-blue-500/30',
      textColor: 'text-blue-300',
      label: 'ŚREDNIE',
      glow: '',
      percentColor: 'text-blue-300'
    };
    if (intensity < 85) return {
      bgColor: 'bg-indigo-600/30 border-indigo-500/40 hover:bg-indigo-500/40',
      textColor: 'text-indigo-300',
      label: 'WYSOKIE',
      glow: '',
      percentColor: 'text-indigo-200'
    };
    return {
      bgColor: 'bg-fuchsia-600/40 border-fuchsia-500/60 hover:bg-fuchsia-500/50 shadow-[inset_0_0_8px_rgba(168,85,247,0.3)]',
      textColor: 'text-fuchsia-300',
      label: 'KRYTYCZNE',
      glow: 'shadow-[0_0_12px_rgba(240,78,152,0.3)] border-fuchsia-400',
      percentColor: 'text-fuchsia-200 font-extrabold'
    };
  };

  const handleCellClick = (agent: Agent, hour: string, intensity: number) => {
    setSelectedCell({
      agentName: agent.name,
      hour,
      intensity,
      activityText: getActivityType(agent.role, agent.category || 'Ogólne', intensity, hour)
    });
  };

  const forceRegenerate = () => {
    if (!selectedTeam) return;
    setWorkloads(prev => {
      const updated = { ...prev };
      const teamId = selectedTeam.id;
      updated[teamId] = {};
      selectedTeam.agents.forEach(a => {
        updated[teamId][a.id] = {};
        timeSlots.forEach(slot => {
          let baseVal = Math.floor(Math.random() * 100);
          if (baseVal < 20) baseVal = 0;
          updated[teamId][a.id][slot] = baseVal;
        });
      });
      return updated;
    });

    if (selectedCell) {
      const agentObj = selectedTeam.agents.find(a => a.name === selectedCell.agentName);
      if (agentObj) {
        const freshVal = Math.floor(Math.random() * 100);
        setSelectedCell({
          ...selectedCell,
          intensity: freshVal,
          activityText: getActivityType(agentObj.role, agentObj.category || 'Ogólne', freshVal, selectedCell.hour)
        });
      }
    }
  };

  // Safe check
  if (!selectedTeam) {
    return (
      <div className="modern-card p-12 text-center border-dashed border-white/10 text-slate-400">
        <Users size={32} className="mx-auto text-slate-700 mb-2 animate-bounce" />
        <p className="text-sm font-bold uppercase tracking-wider">Brak zdefiniowanych eskadr</p>
        <p className="text-xs text-slate-600 mt-1">Stwórz nowy podzespół, aby generować i wizualizować cybezmierz obciążenia w czasie rzeczywistym.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-left">
      {/* Top Controls Action Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/5 border border-white/5 p-5 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-acid-green/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Title & Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-acid-green bg-acid-green/10 border border-acid-green/20 px-2 py-0.5 rounded tracking-widest">
              Live telemetry grid
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">REAL-TIME INGESTION ACTIVE</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-5 h-5 text-acid-green shrink-0 animate-bounce" />
            Mapa Obciążeń i Intensywności Pracy Agentów
          </h3>
          <p className="text-xs text-slate-400 max-w-xl font-mono leading-tight">
            Przeglądaj w czasie rzeczywistym aktywność wieloagentową. Każda sekcja to chronologiczne okno telemetrii.
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 items-center">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 px-2.5">Eskadra:</span>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSelectedCell(null);
              }}
              className="bg-neutral-900 border-none text-[11px] font-bold text-acid-cyan uppercase tracking-wider py-1 px-2.5 rounded-lg focus:outline-none cursor-pointer outline-none max-w-[200px]"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsLiveSimulating(!isLiveSimulating)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition flex items-center gap-1.5 cursor-pointer border ${
              isLiveSimulating 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25' 
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
            }`}
            title="Włącz/wyłącz dynamiczną symulację impulsów pracy w czasie rzeczywistym"
          >
            {isLiveSimulating ? <Pause size={12} className="animate-pulse" /> : <Play size={12} />}
            {isLiveSimulating ? 'SIM ACTIVE' : 'SIM PAUSED'}
          </button>

          <button
            onClick={forceRegenerate}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[10px] uppercase rounded-xl border border-white/5 hover:border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            title="Przeskanuj ponownie całą infrastrukturę klastra"
          >
            <RefreshCw size={12} />
            SKANUJ PONOWNIE
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-acid-green/10 border border-acid-green/20 flex items-center justify-center text-acid-green shrink-0">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Śr. Obciążenie Roju</span>
            <span className="text-lg font-bold font-mono tracking-tight text-white">
              {teamStats.avgIntensity}%
            </span>
            <span className="text-[9px] text-slate-400 block font-mono">Dopuszczalnie: 85%</span>
          </div>
        </div>

        <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0">
            <Flame size={20} className="animate-bounce" />
          </div>
          <div>
            <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Wątki w Overloadzie</span>
            <span className="text-lg font-bold font-mono tracking-tight text-fuchsia-400">
              {teamStats.overloadedCount} <span className="text-xs text-slate-500 font-normal">węzłów</span>
            </span>
            <span className="text-[9px] text-slate-400 block font-mono">Powyżej 80% aktywności</span>
          </div>
        </div>

        <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Najgorętszy Proces</span>
            <span className="text-xs font-bold text-white truncate max-w-[150px] block mt-1.5 uppercase tracking-wide">
              {teamStats.mostActiveAgent}
            </span>
            <span className="text-[9px] text-blue-400 block font-mono">Status: IN_PROGRESS</span>
          </div>
        </div>

        <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Thermometer size={20} />
          </div>
          <div>
            <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Szczyt Dobowy (Peak)</span>
            <span className="text-lg font-bold font-mono tracking-tight text-white">
              {teamStats.peakHour}
            </span>
            <span className="text-[9px] text-slate-550 block font-mono">Wtedy zanotowano maksimum</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Core Heatmap Board Card */}
        <div className="col-span-12 lg:col-span-8 bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-6 shadow-xl relative overflow-x-auto">
          {/* Legend and Section Head */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTeam.color || '#a855f7' }} />
              <span className="text-xs uppercase font-black text-white tracking-widest">
                Struktura Sygnałów: {selectedTeam.name} ({selectedTeam.agents.length} agentów)
              </span>
            </div>
            {/* Color ranges bar */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mr-1.5">Klasy:</span>
              <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 border border-white/5 rounded-lg">
                <span className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-900" title="Idle" />
                <span className="text-[8px] font-mono text-slate-500 mr-1.5">0%</span>
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30" title="Low" />
                <span className="text-[8px] font-mono text-emerald-400 mr-1.5">1-30%</span>
                <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500/30" title="Medium" />
                <span className="text-[8px] font-mono text-blue-300 mr-1.5">31-60%</span>
                <span className="w-2.5 h-2.5 rounded bg-indigo-500/30 border border-indigo-500/40" title="High" />
                <span className="text-[8px] font-mono text-indigo-300 mr-1.5">61-80%</span>
                <span className="w-2.5 h-2.5 rounded bg-fuchsia-500/40 border border-fuchsia-400" title="Critical" />
                <span className="text-[8px] font-mono text-fuchsia-300 font-bold">81-100%</span>
              </div>
            </div>
          </div>

          {selectedTeam.agents.length === 0 ? (
            <div className="text-center py-16 text-slate-600 italic">
              Ten zespół nie posiada przypisanych agentów. Dodaj agentów do zespołu w widoku Siatki!
            </div>
          ) : (
            <div className="space-y-4">
              {/* Heatmap Grid Wrapper */}
              <div className="min-w-[650px] space-y-2">
                {/* Hours column axis header */}
                <div className="grid grid-cols-12 gap-1.5 pl-[160px] pb-1 border-b border-white/[0.03]">
                  {timeSlots.map((slot, idx) => (
                    <div key={idx} className="text-center text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                      {slot}
                    </div>
                  ))}
                </div>

                {/* Agent row matrix mappings */}
                <div className="space-y-3">
                  {selectedTeam.agents.map(agent => {
                    const agentHours = currentTeamWorkloads[agent.id] || {};
                    return (
                      <div key={agent.id} className="grid grid-cols-12 gap-1.5 items-center relative group">
                        
                        {/* Agent Identity Label Left */}
                        <div className="col-span-12 absolute left-0 w-[150px] flex items-center gap-2 pr-2 border-r border-white/5 truncate z-10 bg-[#121418] h-full">
                          <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]" style={{ color: agent.color }} />
                          <div className="text-left truncate">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 block truncate group-hover:text-acid-cyan transition-colors">{agent.name}</span>
                            <span className="text-[8px] text-slate-500 block truncate leading-none uppercase font-mono font-medium">{agent.role}</span>
                          </div>
                        </div>

                        {/* Spacer to push cells past absolute label */}
                        <div className="col-span-12 pl-[160px] grid grid-cols-12 gap-1.5 w-full">
                          {timeSlots.map(slot => {
                            const intensity = agentHours[slot] ?? 0;
                            const cell = getCellDetails(intensity);
                            const isCellSelected = selectedCell?.agentName === agent.name && selectedCell?.hour === slot;

                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => handleCellClick(agent, slot, intensity)}
                                className={`h-11 rounded-lg border flex flex-col justify-between p-1.5 transition-all outline-none duration-150 relative cursor-pointer group/cell ${cell.bgColor} ${cell.glow} ${
                                  isCellSelected ? 'ring-2 ring-white border-white scale-[1.05] z-20 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''
                                }`}
                              >
                                {/* Core status pulse */}
                                {intensity > 80 && (
                                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-ping pointer-events-none" />
                                )}

                                {/* Intensity digits */}
                                <span className={`text-[9px] font-mono select-none block text-left ${cell.percentColor}`}>
                                  {intensity}%
                                </span>

                                {/* Quality index block */}
                                <span className={`text-[7px] font-bold block text-right font-mono truncate tracking-wider opacity-60 group-hover/cell:opacity-100 uppercase`}>
                                  {cell.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions footer prompt */}
              <div className="flex gap-2 p-3 bg-white/[0.01] border border-white/5 rounded-2xl items-center text-[10px] text-slate-400 font-mono">
                <Info size={14} className="text-acid-cyan shrink-0 animate-bounce" />
                <span>Kliknij dowolną kafelkową komórkę obciążenia w siatce, aby zdekodować i wyświetlić szczegółowy, ustrukuryzowany log telemetryczny agenta.</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Cell Activity Inspector panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2 border-b border-white/5 pb-3">
              <Compass size={16} className="text-indigo-400" />
              Skaner Kognitywny Węzła
            </h3>

            {selectedCell ? (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedCell.agentName + selectedCell.hour}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 flex-1 flex flex-col pt-1"
                >
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
                    <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest block">Badany Obiekt:</span>
                    <div>
                      <span className="text-xs font-black uppercase text-white block tracking-wider">{selectedCell.agentName}</span>
                      <span className="text-[9px] text-slate-400 font-mono tracking-wide block">Zarejestrowane w oknie: {selectedCell.hour}</span>
                    </div>
                  </div>

                  {/* Level Details */}
                  <div className="p-4 rounded-2xl bg-[#1e1c2a]/40 border border-indigo-505/20 divide-y divide-white/[0.03] space-y-3">
                    <div className="flex justify-between items-center pb-2.5">
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Pomiar obciążenia:</span>
                      <span className={`text-base font-black font-mono px-2 py-0.5 rounded ${
                        selectedCell.intensity < 30 ? 'text-emerald-400' :
                        selectedCell.intensity < 60 ? 'text-blue-300' :
                        selectedCell.intensity < 85 ? 'text-indigo-300' :
                        'text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-500/20'
                      }`}>
                        {selectedCell.intensity}%
                      </span>
                    </div>

                    <div className="pt-2.5 text-[11px] text-slate-300 leading-relaxed font-sans text-left italic">
                      "{selectedCell.activityText}"
                    </div>
                  </div>

                  {/* Diagnostics telemetry output */}
                  <div className="bg-black/90 p-4 rounded-2xl border border-white/5 font-mono text-[9px] space-y-2 flex-1 overflow-y-auto max-h-[180px]">
                    <span className="text-slate-600 block uppercase font-bold text-[8px] tracking-widest border-b border-white/[0.03] pb-1.5">TELEMETRIA WĘZŁA LOG:</span>
                    <div className="space-y-1.5 text-slate-400">
                      <div className="flex justify-between text-emerald-400">
                        <span>CPU CORE TEMP:</span>
                        <span>{37 + Math.floor(selectedCell.intensity / 2)}°C</span>
                      </div>
                      <div className="flex justify-between text-cyan-400">
                        <span>VOLTAGE OFFSET:</span>
                        <span>0.{12 + Math.floor(selectedCell.intensity / 10)}V</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PROCESS SPEED:</span>
                        <span>{selectedCell.intensity === 0 ? 0 : 25 + selectedCell.intensity * 12} tok/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>REPLY LATENCY:</span>
                        <span>{selectedCell.intensity === 0 ? 'N/A' : `${45 + (100 - selectedCell.intensity)}ms`}</span>
                      </div>
                      <div className="flex justify-between text-yellow-500 font-bold">
                        <span>SYNAPSE LOCK:</span>
                        <span>{selectedCell.intensity > 80 ? 'CRITICAL_ZONE' : 'HEALTHY_SYNC'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-600 border border-dashed border-white/5 rounded-2xl py-12">
                <Sparkles size={28} className="text-slate-700 animate-pulse mb-3" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">OCZEKIWANIE NA PROCES</span>
                <p className="text-[10px] text-slate-600 max-w-xs mt-1.5 leading-relaxed leading-sans">
                  Skaner kognitywny uaktywni się, gdy wybierzesz komórkę aktywności z lewej matrycy obciążeń.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
