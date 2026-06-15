import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Network, 
  Users, 
  RefreshCw, 
  Mic, 
  TrendingUp, 
  CheckCircle2, 
  MessageSquare, 
  Target, 
  Sparkles, 
  Bot, 
  Activity,
  Cpu,
  Bookmark,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { VoiceOrchestrationPanel } from './VoiceOrchestrationPanel';
import { api } from '../services/api';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  AreaChart,
  Area
} from 'recharts';

interface JoinedAgentStat {
  id: string;
  name: string;
  role: string;
  color: string;
  messageCount: number;
  tasksCompleted: number;
  usage: number;
  successRate: number;
  model: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div id="recharts-custom-tooltip" className="bg-slate-950/95 border border-white/10 p-3 rounded-xl font-mono text-[10px] space-y-1.5 shadow-2xl">
        <p className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex justify-between items-center gap-6">
            <span style={{ color: entry.stroke || entry.fill || entry.color }} className="text-slate-400">
              {entry.name}:
            </span>
            <span className="font-bold text-white text-right">
              {entry.value}
              {entry.name.includes('%') || entry.name.toLowerCase().includes('skuteczn') ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SystemManagementHub = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
  const [files, setFiles] = useState<{name: string, isDirectory: boolean}[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  
  // Stats and Recharts Data
  const [agentsStats, setAgentsStats] = useState<JoinedAgentStat[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [chartMode, setChartMode] = useState<'composed' | 'activity' | 'success'>('composed');
  const [sortBy, setSortBy] = useState<'messages' | 'success' | 'name'>('messages');

  const loadFiles = async (dirPath: string) => {
    try {
        const response = await fetch('/api/fs/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dirPath })
        });
        const data = await response.json();
        setFiles(data.items || []);
        setCurrentPath(dirPath);
    } catch (e) {
        showToast("Błąd ładowania plików");
    }
  };

  const deleteFile = async (name: string) => {
    try {
        await fetch('/api/fs/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: `${currentPath}/${name}` })
        });
        showToast("Usunięto pomyślnie");
        loadFiles(currentPath);
    } catch (e) {
        showToast("Błąd usuwania");
    }
  };

  const fetchPerformanceData = async () => {
    setLoadingCharts(true);
    try {
      const [agentsData, statsData] = await Promise.all([
        api.getAgents(),
        api.getAgentStats()
      ]);

      const merged: JoinedAgentStat[] = agentsData.map(agent => {
        const statsRow = statsData.find(s => s.id === agent.id);
        const usage = agent.usage || 0;
        const tasksCompleted = agent.tasksCompleted || 0;
        const successRate = usage > 0 ? Math.round((tasksCompleted / usage) * 100) : 100;
        
        return {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          color: agent.color || '#3b82f6',
          messageCount: statsRow ? statsRow.messageCount : 0,
          tasksCompleted: tasksCompleted,
          usage: usage,
          successRate: Math.min(100, Math.max(0, successRate)),
          model: agent.model
        };
      });

      setAgentsStats(merged);
    } catch (e) {
      console.error(e);
      showToast("Błąd pobierania statystyk wydajności agentów");
    } finally {
      setLoadingCharts(false);
    }
  };

  useEffect(() => { 
    loadFiles('uploads'); 
    fetchPerformanceData();
  }, []);

  // Sort logic
  const getSortedData = () => {
    const dataCopy = [...agentsStats];
    if (sortBy === 'messages') {
      return dataCopy.sort((a, b) => b.messageCount - a.messageCount);
    } else if (sortBy === 'success') {
      return dataCopy.sort((a, b) => b.successRate - a.successRate);
    } else {
      return dataCopy.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const sortedData = getSortedData();

  // Aggregate Metrics
  const totalMessages = agentsStats.reduce((sum, a) => sum + a.messageCount, 0);
  const totalInvocations = agentsStats.reduce((sum, a) => sum + a.usage, 0);
  const averageSuccessRate = agentsStats.length > 0 
    ? Math.round(agentsStats.reduce((sum, a) => sum + a.successRate, 0) / agentsStats.length)
    : 100;

  const busiestAgent = agentsStats.length > 0 
    ? [...agentsStats].sort((a, b) => b.messageCount - a.messageCount)[0] 
    : null;

  const highestSuccessAgent = agentsStats.length > 0 
    ? [...agentsStats].filter(a => a.usage > 0).sort((a, b) => b.successRate - a.successRate)[0] || [...agentsStats].sort((a, b) => b.successRate - a.successRate)[0]
    : null;

  return (
    <div id="system-mgt-hub-wrapper" className="p-6 space-y-6 text-slate-100">
        
        {/* Banner header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-1">
                <span className="p-1 px-2 rounded-full text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest font-black">
                    Węzeł Operacyjny CYLON
                </span>
                <h2 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-2.5">
                    <HardDrive className="text-cyan-400" /> SYSTEM MANAGEMENT HUB
                </h2>
                <p className="text-xs text-slate-400 max-w-xl">
                    Centrum administracyjne, monitoring dystrybucji zasobów dyskowych oraz inteligentna analityka wydajności pętli komunikacyjnej klastra.
                </p>
            </div>
            <button 
              onClick={() => { loadFiles(currentPath); fetchPerformanceData(); }} 
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all self-start md:self-auto"
            >
              <RefreshCw size={13} className="animate-spin-slow" />
              SYNCHRONIZUJ DANE
            </button>
        </div>

        {/* Dynamic Files and Users row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Folder Explorer */}
            <div id="file-explorer-card" className="modern-card p-6 bg-black/40 border border-white/5 rounded-[2rem] col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <HardDrive size={16} className="text-cyan-400" /> Repozytorium Plików: <span className="text-xs text-slate-400 font-mono">uploads/</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">{files.length} plików</span>
                </div>
                
                {files.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 italic font-mono">
                        Katalog uploads/ jest pusty
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                        {files.map(f => (
                            <div key={f.name} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 text-xs transition-all">
                                 <div className="flex items-center gap-2">
                                     <div className={`w-1.5 h-1.5 rounded-full ${f.isDirectory ? "bg-cyan-400 animate-pulse" : "bg-slate-400"}`} />
                                     <span className={`font-mono text-[11px] truncate max-w-xs md:max-w-md ${f.isDirectory ? "text-cyan-300 font-bold" : "text-slate-300"}`}>{f.name}</span>
                                 </div>
                                 {!f.isDirectory && (
                                    <button 
                                      onClick={() => deleteFile(f.name)} 
                                      className="text-red-400 hover:text-red-300 font-black px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] transition-all"
                                      title="Skasuj plik"
                                    >
                                      USUŃ
                                    </button>
                                 )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Network / Client status info panel */}
            <div id="network-info-card" className="modern-card p-6 bg-black/40 border border-white/5 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Users size={16} className="text-purple-400 animate-pulse" /> Status Komunikacji
                    </h3>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                <div className="space-y-4 font-mono text-xs text-slate-300">
                    <div className="p-3 rounded-xl bg-slate-900/30 border border-white/5 space-y-1.5">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Łącze Centralne</span>
                        <div className="flex justify-between text-xs font-black text-white">
                            <span>Szybkość:</span>
                            <span className="text-cyan-400">10 Gbps (Optic Swarm)</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/30 border border-white/5 space-y-1.5">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Węzły Klastra Virtual</span>
                        <div className="flex justify-between text-xs font-black text-white">
                            <span>Aktywne połączenia:</span>
                            <span className="text-purple-400">All Nodes Secure</span>
                        </div>
                    </div>
                    
                    <p className="text-[10px] leading-relaxed text-slate-500">
                        Zabezpieczenia kryptograficzne SHA-256 dla pętli wiadomości roju są aktywne. Wszystkie logi audytowe klastra trafiają bezpośrednio pod nadzór dowódcy Michała Majora.
                    </p>
                </div>
            </div>
        </div>

        {/* Dedicated Recharts Agent Performance Analytics Panel */}
        <div id="agent-performance-chart-card" className="modern-card p-6 bg-black/40 border border-white/5 rounded-[2rem] space-y-6">
            
            {/* Header, Controls & Mode selectors */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                        <TrendingUp size={16} className="text-cyan-400 animate-pulse" />
                        Analiza Wydajności i Obciążenia Agentów (Agent Performance Metrics)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Porównaj liczbę wysłanych wiadomości (obciążenie) ze wskaźnikiem udanych operacji (skuteczność) dla każdej jednostki AI.
                    </p>
                </div>

                {/* Controls and Toggles */}
                <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
                    
                    {/* Sort state */}
                    <div className="flex items-center gap-1.5 text-xs bg-slate-900/60 p-1 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 px-2 uppercase font-black font-mono">Sortowanie:</span>
                        <button 
                          onClick={() => setSortBy('messages')} 
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${sortBy === 'messages' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Aktywność
                        </button>
                        <button 
                          onClick={() => setSortBy('success')} 
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${sortBy === 'success' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Skuteczność
                        </button>
                    </div>

                    {/* Chart Mode */}
                    <div className="flex items-center gap-1.5 text-xs bg-slate-900/60 p-1 rounded-xl border border-white/5">
                        <button 
                          onClick={() => setChartMode('composed')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${chartMode === 'composed' ? 'bg-amber-500 text-black font-black' : 'text-slate-400 hover:text-white'}`}
                          title="Połączony widok podwójnej osi"
                        >
                          Połączony
                        </button>
                        <button 
                          onClick={() => setChartMode('activity')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${chartMode === 'activity' ? 'bg-cyan-500 text-black font-black' : 'text-slate-400 hover:text-white'}`}
                          title="Tylko wolumen aktywności (wiadomości)"
                        >
                          Wolumen
                        </button>
                        <button 
                          onClick={() => setChartMode('success')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${chartMode === 'success' ? 'bg-purple-500 text-white font-black' : 'text-slate-400 hover:text-white'}`}
                          title="Wykres procentowej celności"
                        >
                          Skuteczność %
                        </button>
                    </div>

                </div>
            </div>

            {loadingCharts ? (
              <div className="py-24 text-center space-y-3 font-mono text-xs text-slate-400">
                  <RefreshCw className="animate-spin text-cyan-400 mx-auto" size={28} />
                  <p>Próbkowanie telemetryczne pętli wiadomości...</p>
              </div>
            ) : agentsStats.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 italic font-mono">
                  Brak informacji o agentach w bazie danych.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Visual Chart Canvas */}
                <div className="h-80 w-full bg-slate-950/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartMode === 'composed' ? (
                        <ComposedChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#475569" 
                            fontSize={9} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                          />
                          <YAxis 
                            yAxisId="left" 
                            stroke="#06b6d4" 
                            fontSize={9} 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#a855f7" 
                            fontSize={9} 
                            axisLine={false} 
                            tickLine={false} 
                            domain={[0, 100]}
                          />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }} 
                          />
                          <Bar 
                            yAxisId="left" 
                            dataKey="messageCount" 
                            name="Wolumen Wiadomości" 
                            fill="#06b6d4" 
                            radius={[6, 6, 0, 0]} 
                            barSize={32}
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="successRate" 
                            name="Skuteczność %" 
                            stroke="#d946ef" 
                            strokeWidth={3} 
                            dot={{ fill: '#d946ef', r: 5, strokeWidth: 1 }}
                            activeDot={{ r: 8 }}
                          />
                        </ComposedChart>
                      ) : chartMode === 'activity' ? (
                        <BarChart data={sortedData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#475569" 
                            fontSize={9} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                          />
                          <YAxis stroke="#06b6d4" fontSize={9} axisLine={false} tickLine={false} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} 
                          />
                          <Bar 
                            dataKey="messageCount" 
                            name="Wolumen Wiadomości" 
                            fill="#06b6d4" 
                            radius={[6, 6, 0, 0]} 
                            barSize={36}
                          />
                        </BarChart>
                      ) : (
                        <AreaChart data={sortedData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#475569" 
                            fontSize={9} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                          />
                          <YAxis stroke="#a855f7" fontSize={9} axisLine={false} tickLine={false} domain={[0, 100]} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="successRate" 
                            name="Skuteczność %" 
                            stroke="#a855f7" 
                            fill="rgba(168, 85, 247, 0.1)" 
                            strokeWidth={3} 
                            dot={{ fill: '#a855f7', r: 5 }} 
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                </div>

                {/* Analytical summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
                            <MessageSquare size={12} className="text-cyan-400" />
                            Przepływ wiadomości
                        </span>
                        <div className="flex justify-between items-baseline">
                            <span className="text-lg font-black text-white">{totalMessages}</span>
                            <span className="text-[10px] font-mono text-slate-500">Suma</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
                            <Target size={12} className="text-purple-400" />
                            Inicjalizacje AI
                        </span>
                        <div className="flex justify-between items-baseline">
                            <span className="text-lg font-black text-white">{totalInvocations}</span>
                            <span className="text-[10px] font-mono text-slate-500">Uruchomień</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            Średnia celność
                        </span>
                        <div className="flex justify-between items-baseline">
                            <span className="text-lg font-black text-emerald-400">{averageSuccessRate}%</span>
                            <span className="text-[10px] font-mono text-slate-500">Średni parametr</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
                            <Award size={12} className="text-amber-400 animate-pulse" />
                            Zwycięski modul
                        </span>
                        <div className="text-xs font-bold text-amber-400 truncate mt-1">
                            {highestSuccessAgent ? `${highestSuccessAgent.name} (${highestSuccessAgent.successRate}%)` : "Brak operacji"}
                        </div>
                    </div>

                </div>

                {/* Breakdown detail tables lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="p-4 bg-slate-900/30 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                            <Activity size={10} className="text-cyan-400 animate-pulse" />
                            OBCIĄŻENIE ELEMENTÓW - NAJAKTYWNIEJSI AGENCI ROLI
                        </span>
                        <div className="space-y-1.5">
                            {agentsStats.slice(0, 3).map((agent, i) => (
                                <div key={agent.id} className="flex justify-between items-center text-xs font-mono py-1 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-[9px]">#{i+1}</span>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                                        <span className="font-bold text-white max-w-[130px] truncate">{agent.name}</span>
                                    </div>
                                    <span className="text-cyan-400 font-bold">{agent.messageCount} wiadomości</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900/30 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                            <Target size={10} className="text-purple-400" />
                            PRECYZJA DIAGNOSTYCZNA - NAJLEPSZA SKUTECZNOŚĆ PRACY
                        </span>
                        <div className="space-y-1.5">
                            {[...agentsStats].sort((a,b)=>b.successRate - a.successRate).slice(0, 3).map((agent, i) => (
                                <div key={agent.id} className="flex justify-between items-center text-xs font-mono py-1 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-[9px]">#{i+1}</span>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                                        <span className="font-bold text-white max-w-[130px] truncate">{agent.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-[10px]">{agent.tasksCompleted}/{agent.usage} tasks</span>
                                        <span className="text-emerald-400 font-bold">{agent.successRate}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

              </div>
            )}
        </div>

        {/* Existing voice command panel / tools list */}
        <div id="voice-orchestration-wrapper" className="col-span-1 lg:col-span-3">
            <VoiceOrchestrationPanel showToast={showToast} />
        </div>

    </div>
  );
});
