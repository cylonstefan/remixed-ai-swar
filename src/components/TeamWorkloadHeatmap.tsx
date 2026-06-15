import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, RefreshCw, Zap, Shield, Activity, 
  Play, Pause, Users, Cpu, Thermometer, Info, Compass, Sparkles, 
  CheckCircle, AlertTriangle, UserPlus, Award, ArrowRight, Server, BookOpen, Layers
} from 'lucide-react';
import { Team, Agent } from '../types';
import { api } from '../services/api'; // Direct API access to update teams!

interface TeamWorkloadHeatmapProps {
  teams: Team[];
  agents: Agent[];
  defaultTeamId?: string | null;
  onClose?: () => void;
  onUpdateTeams?: () => void;
  showToast?: (msg: string) => void;
}

interface Skill {
  key: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

// Global Core Skills definitions
const SKILLS_LIST: Skill[] = [
  { key: 'coding', name: 'Software Development', category: 'Programowanie', description: 'Tworzenie modułów, optymalizacja kodu TypeScript, usuwanie błędów i kompilacja.', icon: '💻' },
  { key: 'security', name: 'Cybersecurity', category: 'Bezpieczeństwo', description: 'Analiza podatności, ochrona danych, RODO/GDPR i polityka dostępu.', icon: '🛡️' },
  { key: 'architecture', name: 'System Architecture', category: 'Architektura', description: 'Projektowanie sieci klastrów, konteneryzacja Docker i planowanie infrastruktury.', icon: '🏛️' },
  { key: 'databases', name: 'Data & DB Ops', category: 'Bazy danych', description: 'Konfiguracja Drizzle/SQLite, migracje schematów i wydajność transakcji.', icon: '🗄️' },
  { key: 'comms', name: 'Orchestration & Comms', category: 'Komunikacja', description: 'Debata wieloagentowa, orkiestracja zadań i synteza danych wyjściowych.', icon: '🗣️' },
  { key: 'networks', name: 'Network Tools', category: 'Narzędzia sieciowe', description: 'Pakiety Wake-On-LAN, diagnostyka SSH, VPN i integracje terminali.', icon: '🌐' }
];

// Helper: Calculate an agent's expertise in a skill dynamically based on role, category, prompt, and model
export const getAgentSkills = (agent: Agent): Record<string, number> => {
  const normRole = (agent.role || '').toLowerCase();
  const normPrompt = (agent.systemPrompt || '').toLowerCase();
  const normCat = (agent.category || '').toLowerCase();

  const skills: Record<string, number> = {
    coding: 25,
    security: 20,
    architecture: 20,
    databases: 25,
    comms: 30,
    networks: 20,
  };

  // Category influence
  if (normCat.includes('progr') || normCat.includes('dev') || normCat.includes('kod')) {
    skills.coding += 55;
    skills.architecture += 30;
    skills.databases += 35;
  } else if (normCat.includes('bezp') || normCat.includes('sec') || normCat.includes('prawn')) {
    skills.security += 65;
    skills.comms += 25;
  } else if (normCat.includes('kom') || normCat.includes('czat') || normCat.includes('talk') || normCat.includes('discus') || normCat.includes('telemet')) {
    skills.comms += 55;
    skills.coding += 15;
  } else if (normCat.includes('narz') || normCat.includes('tool') || normCat.includes('sys') || normCat.includes('admin') || normCat.includes('sieć') || normCat.includes('mcp')) {
    skills.networks += 50;
    skills.architecture += 35;
    skills.databases += 35;
  }

  // Role details
  if (normRole.includes('kod') || normRole.includes('deweloper') || normRole.includes('engineer') || normRole.includes('fullstack') || normRole.includes('architect')) {
    skills.coding += 15;
    skills.databases += 10;
  }
  if (normRole.includes('prawn') || normRole.includes('audyt') || normRole.includes('complian') || normRole.includes('security') || normRole.includes('bezpieczeństwo')) {
    skills.security += 20;
  }
  if (normRole.includes('dowódca') || normRole.includes('orkie') || normRole.includes('lider') || normRole.includes('orchestrator') || normRole.includes('manager')) {
    skills.comms += 20;
    skills.architecture += 10;
  }
  if (normRole.includes('lan') || normRole.includes('wan') || normRole.includes('sieć') || normRole.includes('sysops') || normRole.includes('devops')) {
    skills.networks += 20;
    skills.architecture += 10;
  }

  // Model influence (smarter models get +10 accuracy boost)
  if (agent.model.includes('pro') || agent.model.includes('ultra')) {
    Object.keys(skills).forEach(k => {
      skills[k] += 12;
    });
  }

  // Bounds
  Object.keys(skills).forEach(k => {
    skills[k] = Math.min(100, Math.max(10, skills[k]));
  });

  return skills;
};

export const TeamWorkloadHeatmap = ({ teams, agents, defaultTeamId, onClose, onUpdateTeams, showToast }: TeamWorkloadHeatmapProps) => {
  const [activeSubMode, setActiveSubMode] = useState<'workload' | 'skills'>('skills'); // Defaulting to skills to showcase the feature prominently!
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(true);

  // Skills interactive selection
  const [selectedSkillTeamId, setSelectedSkillTeamId] = useState<string>('');
  const [selectedSkillKey, setSelectedSkillKey] = useState<string>('coding');
  const [isAssigningExpert, setIsAssigningExpert] = useState<boolean>(false);

  // Time-based Workload Cell Activity selected
  const [selectedCell, setSelectedCell] = useState<{
    agentName: string;
    hour: string;
    intensity: number;
    activityText: string;
  } | null>(null);

  // Time slots for telemetria (12 hours)
  const timeSlots = useMemo(() => {
    const slots = [];
    const currentHour = new Date().getHours();
    for (let i = 11; i >= 0; i--) {
      const h = (currentHour - i + 24) % 24;
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Set default team and skill selection on load
  useEffect(() => {
    if (defaultTeamId) {
      setSelectedTeamId(defaultTeamId);
      setSelectedSkillTeamId(defaultTeamId);
    } else if (teams.length > 0) {
      setSelectedTeamId(teams[0].id);
      setSelectedSkillTeamId(teams[0].id);
    }
  }, [defaultTeamId, teams]);

  const selectedTeam = useMemo(() => {
    return teams.find(t => t.id === selectedTeamId) || teams[0] || null;
  }, [teams, selectedTeamId]);

  const selectedSkillTeam = useMemo(() => {
    return teams.find(t => t.id === selectedSkillTeamId) || teams[0] || null;
  }, [teams, selectedSkillTeamId]);

  // Seedable activity log lists based on agent categories/roles to make logs feel genuine
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

    if (intensity < 30) return `Konsumpcja energii w normie. Przesunięcie mniejszych pakietów w tle.`;
    if (intensity < 60) return `Zdalne przetwarzanie podzadań, synchronizacja pamięci podręcznej.`;
    if (intensity < 85) return `Uruchomiony zaawansowany proces optymalizacji statystyk telemetrycznych.`;
    return `[OVERLOAD] Wykryto peak transakcyjny lub zapętlenie algorytmu wyszukiwania d3. Kompilator pracuje w trybie ostrym.`;
  };

  // State for dynamic workload matrix (selectedTeam -> agentId -> hour -> intensity)
  const [workloads, setWorkloads] = useState<Record<string, Record<string, Record<string, number>>>>({});

  // Initialize workloads
  useEffect(() => {
    if (teams.length === 0) return;
    
    setWorkloads(prev => {
      const updated = { ...prev };
      teams.forEach(t => {
        if (!updated[t.id]) {
          updated[t.id] = {};
          t.agents?.forEach(a => {
            updated[t.id][a.id] = {};
            timeSlots.forEach(slot => {
              const charSum = a.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
              const hourNum = parseInt(slot.split(':')[0]);
              let baseVal = (charSum * (hourNum + 7)) % 101;
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

  // Telemetry simulation tick
  useEffect(() => {
    if (!isLiveSimulating || !selectedTeam || activeSubMode !== 'workload') return;

    const interval = setInterval(() => {
      setWorkloads(prev => {
        const teamId = selectedTeam.id;
        if (!prev[teamId]) return prev;

        const updatedTeamWorkload = { ...prev[teamId] };
        
        selectedTeam.agents?.forEach(a => {
          if (Math.random() > 0.45) {
            const targetHours = timeSlots.slice(-4);
            const randomHour = targetHours[Math.floor(Math.random() * targetHours.length)];
            
            if (updatedTeamWorkload[a.id]) {
              const currentVal = updatedTeamWorkload[a.id][randomHour] || 30;
              let change = Math.floor(Math.random() * 31) - 15;
              let newVal = Math.max(0, Math.min(100, currentVal + change));

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

        if (selectedCell) {
          const agentId = selectedTeam.agents?.find(a => a.name === selectedCell.agentName)?.id;
          if (agentId && updatedTeamWorkload[agentId]) {
            const freshIntensity = updatedTeamWorkload[agentId][selectedCell.hour] ?? selectedCell.intensity;
            const agentObj = selectedTeam.agents?.find(a => a.id === agentId);
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
  }, [isLiveSimulating, selectedTeam, timeSlots, selectedCell, activeSubMode]);

  const currentTeamWorkloads = useMemo(() => {
    if (!selectedTeam) return {};
    return workloads[selectedTeam.id] || {};
  }, [workloads, selectedTeam]);

  // Aggregate telemetry stats
  const teamStats = useMemo(() => {
    if (!selectedTeam || !selectedTeam.agents || selectedTeam.agents.length === 0) {
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
      selectedTeam.agents?.forEach(a => {
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
      const agentObj = selectedTeam.agents?.find(a => a.name === selectedCell.agentName);
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


  // --- DYNAMIC TEAM SKILLS COVERAGE COMPUTATIONS ---
  // Calculates direct coverage score (max score) for each team & skill
  const teamSkillsCoverage = useMemo(() => {
    const coverage: Record<string, Record<string, number>> = {};
    
    teams.forEach(team => {
      coverage[team.id] = {};
      SKILLS_LIST.forEach(skill => {
        if (!team.agents || team.agents.length === 0) {
          coverage[team.id][skill.key] = 0;
          return;
        }
        
        // Cumulative or Max capacity indicator
        let maxExpertise = 0;
        team.agents.forEach(agent => {
          const s = getAgentSkills(agent);
          if (s[skill.key] > maxExpertise) {
            maxExpertise = s[skill.key];
          }
        });
        coverage[team.id][skill.key] = maxExpertise;
      });
    });
    
    return coverage;
  }, [teams]);

  // General audit diagnostics helper
  const skillsAuditDiagnostics = useMemo(() => {
    const warnings: { teamId: string; teamName: string; skillKey: string; skillName: string; score: number }[] = [];
    const highCoverage: { teamId: string; teamName: string; skillKey: string; skillName: string; score: number }[] = [];

    teams.forEach(team => {
      SKILLS_LIST.forEach(skill => {
        const score = teamSkillsCoverage[team.id]?.[skill.key] ?? 0;
        if (score < 40) {
          warnings.push({
            teamId: team.id,
            teamName: team.name,
            skillKey: skill.key,
            skillName: skill.name,
            score
          });
        } else if (score >= 80) {
          highCoverage.push({
            teamId: team.id,
            teamName: team.name,
            skillKey: skill.key,
            skillName: skill.name,
            score
          });
        }
      });
    });

    return { warnings, highCoverage };
  }, [teams, teamSkillsCoverage]);

  // Skill cells colors
  const getSkillCellColor = (score: number) => {
    if (score === 0) return {
      bgColor: 'bg-red-950/20 border-red-900/40 text-red-400',
      label: 'DEFICYT (0%)',
      badgeClass: 'bg-red-500/10 border-red-500/20 text-red-400',
      textClass: 'text-red-500'
    };
    if (score < 40) return {
      bgColor: 'bg-[#ff3b30]/10 border-[#ff3b30]/25 text-[#ff3b30] hover:bg-[#ff3b30]/15',
      label: 'KRYTYCZNY BRAK',
      badgeClass: 'bg-red-500/10 border-red-500/20 text-[#ff453a]',
      textClass: 'text-[#ff453a] font-bold'
    };
    if (score < 65) return {
      bgColor: 'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15',
      label: 'UMIARKOWANY',
      badgeClass: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
      textClass: 'text-amber-400'
    };
    if (score < 85) return {
      bgColor: 'bg-sky-500/10 border-sky-500/25 text-sky-450 hover:bg-sky-500/15',
      label: 'ZAAWANSOWANY',
      badgeClass: 'bg-sky-500/10 border-sky-500/25 text-sky-400',
      textClass: 'text-sky-400'
    };
    return {
      bgColor: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]',
      label: 'EKSPERCKI',
      badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      textClass: 'text-emerald-400 font-extrabold'
    };
  };

  const selectedSkillDetails = useMemo(() => {
    return SKILLS_LIST.find(s => s.key === selectedSkillKey) || SKILLS_LIST[0];
  }, [selectedSkillKey]);

  const selectedSkillScore = useMemo(() => {
    if (!selectedSkillTeam) return 0;
    return teamSkillsCoverage[selectedSkillTeam.id]?.[selectedSkillKey] ?? 0;
  }, [selectedSkillTeam, selectedSkillKey, teamSkillsCoverage]);

  // Find non-member expert recommendation from the external global list
  const bestExternalExpert = useMemo(() => {
    if (!selectedSkillTeam) return null;
    const memberIds = new Set(selectedSkillTeam.agents?.map(a => a.id) || []);
    
    // Filter agents globally who are NOT in the current team
    const nonMembers = agents.filter(a => !memberIds.has(a.id));
    if (nonMembers.length === 0) return null;

    // Calculate score for each and sort
    const scoredNonMembers = nonMembers.map(a => {
      const skills = getAgentSkills(a);
      return {
        agent: a,
        score: skills[selectedSkillKey] || 0
      };
    }).sort((a, b) => b.score - a.score);

    return scoredNonMembers[0] || null;
  }, [selectedSkillTeam, agents, selectedSkillKey]);

  // Handles adding the suggested expert live to database
  const handleAddExpertToTeam = async () => {
    if (!selectedSkillTeam || !bestExternalExpert) return;
    setIsAssigningExpert(true);

    try {
      const currentAgentIds = selectedSkillTeam.agents?.map(a => a.id) || [];
      const updatedAgentIds = [...currentAgentIds, bestExternalExpert.agent.id];

      // Direct service API write integration!
      await api.updateTeam(selectedSkillTeam.id, {
        agentIds: updatedAgentIds
      });

      // Write a beautiful audit log for the action
      await api.createLog({
        id: Math.random().toString(36).substr(2, 9),
        action: 'TEAM_REINFORCED',
        details: `Dodano eksperta ds. ${selectedSkillDetails.name} (${bestExternalExpert.agent.name}) do zespołu "${selectedSkillTeam.name}" w celu pokrycia kompetencji.`
      });

      if (showToast) {
        showToast(`Super! Dodano agenta ${bestExternalExpert.agent.name} do zespołu ${selectedSkillTeam.name}. Deficyt zażegnany! 🛡️⚡`);
      }

      if (onUpdateTeams) {
        onUpdateTeams();
      }
    } catch (err) {
      console.error("Failed to reinforce team skills", err);
      if (showToast) {
        showToast("Nie udało się przydzielić agenta do klastra.");
      }
    } finally {
      setIsAssigningExpert(false);
    }
  };


  // Safe guard empty teams check
  if (teams.length === 0) {
    return (
      <div className="modern-card p-12 text-center border-dashed border-white/10 text-slate-400">
        <Users size={32} className="mx-auto text-slate-700 mb-2 animate-bounce" />
        <p className="text-sm font-bold uppercase tracking-wider">Brak zdefiniowanych eskadr</p>
        <p className="text-xs text-slate-600 mt-1">Stwórz nowy podzespół w menedżerze zespołów, aby badać pokrycie umiejętności.</p>
        {onClose && (
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-[10px] uppercase font-bold hover:bg-white/10">
            Powrót
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-left">
      {/* Top Header Controls Action Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-acid-cyan/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Title & Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-acid-cyan bg-acid-cyan/10 border border-acid-cyan/25 px-2 py-0.5 rounded tracking-widest">
              Analytical matrix
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Skills Audit Ledger Active</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-acid-cyan shrink-0" />
            Wizualizator Pokrycia i Braków Kompetencji (Skills Heatmap)
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl font-mono leading-tight">
            Interaktywna macierz kompetencji zespołu. Zidentyfikuj natychmiast, które eskadry posiadają deficyty w kluczowych rygorach technologicznych.
          </p>
        </div>

        {/* Dynamic Mode Switcher (Workload vs Skills) */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setActiveSubMode('workload');
                setSelectedCell(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                activeSubMode === 'workload' 
                  ? 'bg-acid-green text-black font-extrabold shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Obciążenie Transakcyjne (Live)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubMode('skills');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                activeSubMode === 'skills' 
                  ? 'bg-acid-cyan text-black font-extrabold shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pokrycie Umiejętności (Hard Skills)
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs text-slate-350 rounded-xl border border-white/5 transition font-bold"
            >
              ZAMKNIJ
            </button>
          )}
        </div>
      </div>

      {/* RENDER MODE A: WORKLOAD TELEMETRY HEATMAP */}
      {activeSubMode === 'workload' && (
        <>
          {/* Workload KPI Stats Cards */}
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
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-455 shrink-0">
                <Cpu size={20} />
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Najgorętszy Proces</span>
                <span className="text-xs font-bold text-white truncate max-w-[150px] block mt-1.5 uppercase tracking-wide">
                  {teamStats.mostActiveAgent}
                </span>
                <span className="text-[9px] text-cyan-400 block font-mono">Status: IN_PROGRESS</span>
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
                <span className="text-[9px] text-slate-550 block font-mono">Maksymalny ruch węzła</span>
              </div>
            </div>
          </div>

          {/* Interactive Workload Panel Structure */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* Core Workload Heatmap Grid */}
            <div className="col-span-12 lg:col-span-8 bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-6 shadow-xl relative overflow-x-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTeam.color || '#a855f7' }} />
                  <span className="text-xs uppercase font-black text-white tracking-widest">
                    Zasoby Eskadry: {selectedTeam.name} ({selectedTeam.agents?.length || 0} agentów)
                  </span>
                </div>
                
                {/* Simulated / Controls toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLiveSimulating(!isLiveSimulating)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition flex items-center gap-1 cursor-pointer border ${
                      isLiveSimulating 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
                        : 'bg-white/5 text-slate-400 border-white/5'
                    }`}
                  >
                    {isLiveSimulating ? 'SIM ENABL' : 'SIM PAUS'}
                  </button>
                  <button onClick={forceRegenerate} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[9px] uppercase border border-white/5 rounded-lg transition-all">
                    Skan telemetrii
                  </button>
                </div>
              </div>

              {!selectedTeam.agents || selectedTeam.agents.length === 0 ? (
                <div className="text-center py-16 text-slate-600 italic">
                  Ta eskadra nie posiada przypisanych agentów. Dodaj agentów do eskadry w zakładce "Siatka" powyżej.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="min-w-[650px] space-y-2">
                    {/* Hours headers */}
                    <div className="grid grid-cols-12 gap-1.5 pl-[160px] pb-1 border-b border-white/[0.03]">
                      {timeSlots.map((slot, idx) => (
                        <div key={idx} className="text-center text-[9px] font-mono text-slate-550 font-black">
                          {slot}
                        </div>
                      ))}
                    </div>

                    {/* Matrix Row mapped */}
                    <div className="space-y-3">
                      {selectedTeam.agents.map(agent => {
                        const agentHours = currentTeamWorkloads[agent.id] || {};
                        return (
                          <div key={agent.id} className="grid grid-cols-12 gap-1.5 items-center relative group">
                            
                            {/* Left Label */}
                            <div className="col-span-12 absolute left-0 w-[150px] flex items-center gap-2 pr-2 border-r border-white/5 truncate z-10 bg-[#121418] h-full">
                              <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]" style={{ color: agent.color }} />
                              <div className="text-left truncate">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 block truncate group-hover:text-acid-cyan transition-all">{agent.name}</span>
                                <span className="text-[8px] text-slate-500 block truncate uppercase font-mono">{agent.role}</span>
                              </div>
                            </div>

                            {/* Main Cells grid */}
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
                                    {intensity > 80 && (
                                      <span className="absolute top-1 right-1 w-1 h-1 bg-fuchsia-400 rounded-full animate-ping pointer-events-none" />
                                    )}
                                    <span className={`text-[9px] font-mono select-none block text-left ${cell.percentColor}`}>
                                      {intensity}%
                                    </span>
                                    <span className={`text-[7px] font-black block text-right font-mono truncate tracking-wider opacity-60 uppercase`}>
                                      {cell.label.split(' ')[0]}
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

                  <div className="flex gap-2 p-3 bg-white/[0.01] border border-white/5 rounded-2xl items-center text-[10px] text-slate-400 font-mono">
                    <Info size={14} className="text-acid-green shrink-0 animate-bounce" />
                    <span>Kliknij dowolne pole w siatce koordynacyjnej czasu obciążeń, aby zdekodować log klastra i profil zużycia energii procesowej.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Workload Cell Diagnostics */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-start">
                <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2 border-b border-white/5 pb-3">
                  <Compass size={16} className="text-indigo-400" />
                  Skaner Kognitywny Węzła
                </h3>

                {selectedCell ? (
                  <div className="space-y-4 p-1 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest block">Badany Obiekt:</span>
                        <span className="text-xs font-black uppercase text-white block tracking-wider">{selectedCell.agentName}</span>
                        <span className="text-[9px] text-slate-400 font-mono block">Log zdarzenia w oknie: {selectedCell.hour}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#1e1c2a]/40 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">Pomiar aktywności:</span>
                          <span className="text-sm font-black font-mono text-cyan-400">{selectedCell.intensity}%</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed font-sans italic">
                          "{selectedCell.activityText}"
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/80 p-4 rounded-xl border border-white/5 font-mono text-[9px] space-y-2 max-h-[160px] overflow-y-auto">
                      <span className="text-slate-600 font-bold block border-b border-white/[0.05] pb-1">REAL-TIME TELEMETRY LOGS:</span>
                      <div className="space-y-1.5 text-slate-400">
                        <div className="flex justify-between">
                          <span>TEMPERATURA CORES:</span>
                          <span className="text-emerald-400">{41 + Math.floor(selectedCell.intensity / 2)}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NAPIĘCIE KANNAAL:</span>
                          <span className="text-blue-300">0.{12 + Math.floor(selectedCell.intensity / 9)}V</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GENEROWANE TPT:</span>
                          <span>{selectedCell.intensity === 0 ? 0 : 35 + selectedCell.intensity * 8} toks/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SYNAPSE LOCK status:</span>
                          <span className={selectedCell.intensity > 80 ? "text-yellow-500" : "text-emerald-500"}>
                            {selectedCell.intensity > 80 ? 'HIGH_CONGESTION' : 'NOMINAL_SYNC'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-600 border border-dashed border-white/5 rounded-2xl py-14">
                    <Sparkles size={24} className="text-slate-705 animate-pulse mb-3" />
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Oczekiwanie na sygnał</span>
                    <p className="text-[10px] text-slate-600 max-w-xs mt-1 leading-relaxed">
                      Skaner uaktywni się automatycznie, po wybraniu dowolnego elementu czasu.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* RENDER MODE B: COGNITIVE SKILLS COVERAGE HEATMAP */}
      {activeSubMode === 'skills' && (
        <>
          {/* Skills Coverage Audit Statistics Head cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-acid-cyan/10 border border-acid-cyan/20 flex items-center justify-center text-acid-cyan shrink-0">
                <Award size={18} />
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Globalny Audyt Kompetencji</span>
                <span className="text-lg font-bold font-mono tracking-tight text-white">
                  {Math.round(teams.reduce((acc, t) => {
                    let teamScores = SKILLS_LIST.map(s => teamSkillsCoverage[t.id]?.[s.key] || 0);
                    let avg = teamScores.reduce((sum, val) => sum + val, 0) / (teamScores.length || 1);
                    return acc + avg;
                  }, 0) / (teams.length || 1))}%
                </span>
                <span className="text-[9px] text-[#06b6d4] font-mono block">Cel minimalny klastra: 65%</span>
              </div>
            </div>

            <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle size={18} className="animate-pulse" />
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Wykryte Deficyty Wiedzy</span>
                <span className="text-lg font-bold font-mono tracking-tight text-red-400">
                  {skillsAuditDiagnostics.warnings.length} <span className="text-xs text-slate-500 font-normal">obszarów</span>
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">Pokrycie poniżej 40%</span>
              </div>
            </div>

            <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-550/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Niezależne Specjalizacje</span>
                <span className="text-lg font-bold font-mono tracking-tight text-emerald-400">
                  {skillsAuditDiagnostics.highCoverage.length} <span className="text-xs text-slate-500 font-normal">eskadr</span>
                </span>
                <span className="text-[9px] text-slate-550 block font-mono">Standard ekspercki (&gt;80%)</span>
              </div>
            </div>

            <div className="p-4 bg-[#121418]/90 border border-white/5 rounded-2xl flex items-center gap-3.5 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7] shrink-0">
                <Users size={18} strokeWidth={2.5} />
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest">Maks. Elastyczność Roju</span>
                <span className="text-xs font-bold text-white truncate max-w-[155px] block mt-1.5 uppercase font-mono">
                  {teams.map(t => {
                    const lowestScore = Math.min(...SKILLS_LIST.map(s => teamSkillsCoverage[t.id]?.[s.key] || 0));
                    return { name: t.name, lowestScore };
                  }).sort((a,b) => b.lowestScore - a.lowestScore)[0]?.name || 'Brak'}
                </span>
                <span className="text-[9px] text-pink-400 block font-mono">Dopasowana do wielu zadań</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Core Skills Coverage Heatmap Matrix Table */}
            <div className="col-span-12 lg:col-span-8 bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-6 shadow-xl relative overflow-x-auto flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Header Title Section inside Table */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-xs uppercase font-black text-white tracking-widest">
                      MACIERZ KOMPETENCJI KLASTRA: PORÓWNANIE ZESPOŁÓW
                    </span>
                  </div>
                  
                  {/* Legend bar */}
                  <div className="flex items-center gap-1.5 bg-black/35 px-2.5 py-1 border border-white/5 rounded-lg text-[8px]">
                    <span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Legenda:</span>
                    <span className="w-2 h-2 rounded bg-red-500/20 border border-red-500/30" />
                    <span className="text-[#ff453a] font-mono font-bold mr-1">&lt;40%</span>
                    <span className="w-2 h-2 rounded bg-amber-500/20 border border-amber-500/30" />
                    <span className="text-amber-450 font-mono mr-1">40-64%</span>
                    <span className="w-2 h-2 rounded bg-sky-500/20 border border-sky-500/30" />
                    <span className="text-sky-350 font-mono mr-1">65-79%</span>
                    <span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/30" />
                    <span className="text-emerald-450 font-mono font-bold">&gt;80%</span>
                  </div>
                </div>

                {/* Heatmap Matrix Table */}
                <div className="min-w-[650px] space-y-2.5 pt-1.5">
                  {/* Skill names column headers */}
                  <div className="grid grid-cols-12 gap-2 pl-[180px] pb-1.5 border-b border-white/[0.03]">
                    {SKILLS_LIST.map((skill, idx) => (
                      <div key={idx} className="col-span-2 text-center text-[9px] font-black uppercase tracking-wider text-slate-450 font-mono">
                        <span className="mr-1">{skill.icon}</span>{skill.name.split(' ')[0]}
                      </div>
                    ))}
                  </div>

                  {/* Team rows rendering */}
                  <div className="space-y-4 pt-1">
                    {teams.map(team => {
                      return (
                        <div key={team.id} className="grid grid-cols-12 gap-2 items-center relative group">
                          
                          {/* Team Identity Label Left */}
                          <div className="col-span-12 absolute left-0 w-[170px] flex items-center gap-2.5 pr-2 border-r border-white/5 truncate z-10 bg-[#121418] h-full">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ color: team.color || '#a855f7' }} />
                            <div className="text-left truncate">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100 block truncate group-hover:text-acid-cyan transition-all">
                                {team.name}
                              </span>
                              <span className="text-[7.5px] text-slate-500 block truncate leading-none uppercase font-mono font-black">
                                {team.agents?.length || 0} CYBER-AGENTÓW
                              </span>
                            </div>
                          </div>

                          {/* Skill strength coverage cells */}
                          <div className="col-span-12 pl-[180px] grid grid-cols-12 gap-2 w-full">
                            {SKILLS_LIST.map(skill => {
                              const score = teamSkillsCoverage[team.id]?.[skill.key] ?? 0;
                              const cellColor = getSkillCellColor(score);
                              const isCellSelected = selectedSkillTeamId === team.id && selectedSkillKey === skill.key;

                              return (
                                <button
                                  key={skill.key}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSkillTeamId(team.id);
                                    setSelectedSkillKey(skill.key);
                                  }}
                                  className={`col-span-2 h-12 rounded-xl border flex flex-col justify-between p-2 transition-all outline-none duration-150 relative cursor-pointer ${cellColor.bgColor} ${
                                    isCellSelected 
                                      ? 'ring-2 ring-white border-white scale-[1.04] z-20 shadow-[0_0_15px_rgba(6,182,212,0.25)]' 
                                      : 'border-white/[0.04]'
                                  }`}
                                >
                                  {/* Warning critical exclamation for deficits */}
                                  {score < 40 && (
                                    <span className="absolute top-1.5 right-1.5 text-[8px] animate-pulse">⚠️</span>
                                  )}

                                  <div className="flex justify-between items-center w-full">
                                    <span className={`text-[10px] font-mono tracking-tight font-black ${cellColor.textClass}`}>
                                      {score}%
                                    </span>
                                  </div>

                                  {/* Progress mini indicator */}
                                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1.5">
                                    <div 
                                      className="h-full transition-all duration-500"
                                      style={{ 
                                        width: `${score}%`, 
                                        backgroundColor: score < 40 ? '#ff3b30' : score < 65 ? '#f59e0b' : score < 85 ? '#06b6d4' : '#10b981'
                                      }}
                                    />
                                  </div>

                                  <span className="text-[6.5px] text-slate-500 font-bold tracking-widest uppercase block text-left mt-1 font-mono truncate">
                                    {cellColor.label}
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

              </div>

              {/* Instructions footer prompt */}
              <div className="flex gap-2 p-3.5 bg-[#06b6d4]/5 border border-[#06b6d4]/15 rounded-2xl items-center text-[10px] text-slate-400 font-mono mt-6">
                <Info size={14} className="text-acid-cyan shrink-0 animate-bounce" />
                <span>
                  Wybierz dowolną komórkę macierzy powyżej. Panel po prawej stronie natychmiast wykona <strong>Audyt Kompetencyjny</strong> i zaproponuje optymalnych deweloperów/prawników z bazy, aby zalepić luki!
                </span>
              </div>

            </div>

            {/* Right Skills Auditor Details Inspector Container */}
            <div className="col-span-12 lg:col-span-4 flex flex-col justify-between items-stretch bg-[#121418]/95 border border-white/5 p-6 rounded-3xl shadow-xl">
              
              <div className="space-y-4 flex-1 flex flex-col">
                <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2 border-b border-white/5 pb-3">
                  <Compass size={16} className="text-[#06b6d4]" />
                  Audytor Kompetencji Roju
                </h3>

                {selectedSkillTeam ? (
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Active Cell Card */}
                      <div className="p-4 rounded-2xl bg-black/45 border border-white/5 space-y-2">
                        <span className="text-[7.5px] font-black font-mono text-[#06b6d4] uppercase tracking-widest block">Analizowany Zespół i Obszar:</span>
                        <div>
                          <span className="text-xs font-black uppercase text-white block tracking-wider font-display">
                            {selectedSkillTeam?.name}
                          </span>
                          <span className="text-[9px] text-cyan-400 font-mono tracking-wide flex items-center gap-1.5 mt-1">
                            <span>{selectedSkillDetails.icon}</span>
                            <span>{selectedSkillDetails.name}</span>
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-400 leading-relaxed font-sans pt-1 border-t border-white/[0.03]">
                          {selectedSkillDetails.description}
                        </p>
                      </div>

                      {/* Score highlights */}
                      <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px] font-serif font-semibold text-slate-350">Pokrycie zespołu:</span>
                          <span className={`text-base font-black font-mono px-2 py-0.5 rounded ${getSkillCellColor(selectedSkillScore).badgeClass}`}>
                            {selectedSkillScore}%
                          </span>
                        </div>

                        {/* Deficit Warnings alerts */}
                        {selectedSkillScore < 40 ? (
                          <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl flex items-start gap-2.5">
                            <AlertTriangle size={15} className="text-[#ff3b30]" />
                            <div className="text-left">
                              <span className="text-[9px] font-extrabold text-[#ff453a] uppercase block">Krytyczny brak wiedzy!</span>
                              <span className="text-[8px] text-slate-400 block leading-tight mt-0.5 font-mono">
                                Ten zespół nie posiada żadnego aktywnego eksperta w tej dziedzinie. Istnieje ryzyko przestojów procesowych.
                              </span>
                            </div>
                          </div>
                        ) : selectedSkillScore < 65 ? (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl flex items-start gap-2.5">
                            <AlertTriangle size={15} className="text-amber-400" />
                            <div className="text-left">
                              <span className="text-[9px] font-bold text-amber-400 uppercase block">Umiarkowana odporność</span>
                              <span className="text-[8px] text-slate-400 block leading-tight mt-0.5 font-mono">
                                Poziom podstawowy. Zespół posiada elementom wiedzę, ale brakuje wyrafinowanej mądrości klasy Pro.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl flex items-start gap-2.5">
                            <CheckCircle size={15} className="text-emerald-400" />
                            <div className="text-left">
                              <span className="text-[9px] font-bold text-emerald-400 uppercase block">Infrastruktura bezpieczna</span>
                              <span className="text-[8px] text-slate-400 block leading-tight mt-0.5 font-mono">
                                Klasa inżynieryjna w pełni kompetentna. Zadania będą realizowane bez opóźnień i uchybień bezpieczeństwa.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Current member contributions breakdown inside team */}
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest pl-1">Bieżący członkowie i stopień wkładu:</span>
                        {!selectedSkillTeam.agents || selectedSkillTeam.agents.length === 0 ? (
                          <span className="text-[8.5px] text-slate-600 block italic pl-1">Brak agentów w zespole.</span>
                        ) : (
                          selectedSkillTeam.agents.map(ag => {
                            const val = getAgentSkills(ag)[selectedSkillKey] || 0;
                            return (
                              <div key={ag.id} className="flex justify-between items-center text-[9px] bg-black/20 px-3 py-1.5 rounded-lg border border-white/[0.03]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ag.color }} />
                                  <span className="text-slate-300 font-extrabold truncate">{ag.name}</span>
                                </div>
                                <span className={`font-mono font-bold ${
                                  val < 40 ? 'text-red-400' : val < 65 ? 'text-amber-400' : 'text-emerald-400'
                                }`}>{val}%</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* DYNAMIC SMART ADVICE & REMEDIATION REMEDY AREA (FIX BRAKÓW) */}
                    <div className="pt-3 border-t border-white/[0.05] space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-cyan-400 shrink-0" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">AUTOPILOT: Rekomendacja wdrożeniowa</span>
                      </div>

                      {bestExternalExpert ? (
                        <div className="bg-[#06b6d4]/5 p-3.5 rounded-2xl border border-[#06b6d4]/15 space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: `${bestExternalExpert.agent.color}25`, color: bestExternalExpert.agent.color, border: `1px solid ${bestExternalExpert.agent.color}40` }}>
                              {bestExternalExpert.agent.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left truncate">
                              <span className="text-[9px] font-black dark:text-white uppercase tracking-wider block truncate">
                                {bestExternalExpert.agent.name}
                              </span>
                              <span className="text-[8px] text-slate-400 block truncate font-mono uppercase leading-tight pt-0.5">
                                {bestExternalExpert.agent.role}
                              </span>
                            </div>
                          </div>

                          <div className="text-[8.5px] leading-tight text-slate-400 font-mono text-left">
                            Ten agent posiada ekspercki stopień kompetencji w <strong>{selectedSkillDetails.name}</strong> równy <span className="text-cyan-400 font-bold">{bestExternalExpert.score}%</span>. Przypisanie go podniesie pokrycie zespołu do <span className="text-emerald-400 font-bold">{bestExternalExpert.score}%</span>.
                          </div>

                          <button
                            type="button"
                            onClick={handleAddExpertToTeam}
                            disabled={isAssigningExpert}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg shadow-md hover:shadow-cyan-500/10 cursor-pointer transition"
                          >
                            {isAssigningExpert ? (
                              <>
                                <RefreshCw size={10} className="animate-spin" />
                                PRZEPRAWDZAM PROCEDURY...
                              </>
                            ) : (
                              <>
                                <UserPlus size={11} />
                                WZMOCNIJ ZESPÓŁ KOOPERACYJNIE
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-[9px] text-slate-600 font-mono italic">
                          Brak dostępnych ekspertów wolnych w bazie do przypisania.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-600 border border-dashed border-white/5 rounded-2xl py-14">
                    <Sparkles size={24} className="text-slate-705 animate-pulse mb-3" />
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Wybierz komórkę klastra</span>
                    <p className="text-[9px] text-slate-650 max-w-xs mt-1.5 leading-relaxed font-sans">
                      Wybierz konkretne zderzenie zespołu i technologii, aby otrzymać porady orkiestrujące braki kompetencyjne.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};
