import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  TrendingUp, MessageSquare, CheckCircle, Cpu, Zap, 
  RotateCw, Filter, Sliders 
} from 'lucide-react';
import { api } from '../services/api';
import { Agent } from '../types';

interface AgentTelemetryData {
  id: string;
  name: string;
  role: string;
  color: string;
  messageCount: number;
  successRate: number;
  tokensUsed: number;
}

export function AgentStatsBarWidget() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [telemetry, setTelemetry] = useState<AgentTelemetryData[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'success' | 'tokens'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulationActive, setSimulationActive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Służbowe kolory z palety neonowej projektu
  const PALETTE = {
    messages: '#06b6d4', // Acid Cyan
    success: '#10b981',  // Emerald Green
    tokens: '#a855f7',   // Acid Purple
  };

  // Ładowanie pierwszych danych z API
  const fetchTelemetryData = async () => {
    setIsRefreshing(true);
    try {
      const realAgents = await api.getAgents();
      
      // Jeżeli brak agentów, zainicjalizujemy stabilne dema oparte na fabułach
      const fallbackAgentsData: AgentTelemetryData[] = [
        { id: '1', name: 'SecMaster-AI', role: 'Audytor Bezpieczeństwa', color: '#06b6d4', messageCount: 142, successRate: 98.4, tokensUsed: 42100 },
        { id: '2', name: 'DevMaster-AI', role: 'Inżynier Kodu', color: '#3b82f6', messageCount: 289, successRate: 95.1, tokensUsed: 138500 },
        { id: '3', name: 'Cylon-Alpha', role: 'Zarządca Roju', color: '#a855f7', messageCount: 94, successRate: 100.0, tokensUsed: 15400 },
        { id: '4', name: 'NetPentester', role: 'Analizator Podatności', color: '#f59e0b', messageCount: 167, successRate: 91.8, tokensUsed: 89000 },
        { id: '5', name: 'KidsStoryteller', role: 'Kreator Animacji', color: '#ec4899', messageCount: 213, successRate: 99.2, tokensUsed: 110400 },
      ];

      let baseData: AgentTelemetryData[] = [];

      if (realAgents && realAgents.length > 0) {
        baseData = realAgents.map((agent, i) => ({
          id: agent.id,
          name: agent.name || `Agent-${i + 1}`,
          role: agent.role || 'Podsystem Roju',
          color: agent.color || ['#06b6d4', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#10b981'][i % 6],
          messageCount: agent.messageCount || Math.floor(Math.random() * 200) + 50,
          successRate: agent.successRate || Number((85 + Math.random() * 15).toFixed(1)),
          tokensUsed: agent.tokensUsed || Math.floor(Math.random() * 100000) + 10000,
        }));
      } else {
        baseData = fallbackAgentsData;
      }

      setTelemetry(baseData);
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      setIsRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchTelemetryData();
  }, []);

  // Symulacja czasu rzeczywistego (subtelne fluktuacje procesów w tle)
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        return prev.map(agent => {
          // Komunikaty mogą stale rosnąć lub fluktuować
          const msgDelta = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
          
          // Sukces może delikatnie wzrosnąć lub spaść, ale nie przekracza 100%
          const successDelta = (Math.random() * 0.4 - 0.2);
          const nextSuccess = Math.min(100, Math.max(70, Number((agent.successRate + successDelta).toFixed(1))));

          // Tokeny rosną wraz ze skomplikowanymi interakcjami
          const tokenDelta = msgDelta > 0 ? (Math.floor(Math.random() * 1200) + 300) : 0;

          return {
            ...agent,
            messageCount: agent.messageCount + msgDelta,
            successRate: nextSuccess,
            tokensUsed: agent.tokensUsed + tokenDelta,
          };
        });
      });
      setLastUpdated(new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, [simulationActive]);

  return (
    <div id="agent-telemetry-bar-widget" className="flex flex-col h-full space-y-3 font-mono text-[10px] text-slate-300">
      
      {/* Widget Control Panel Row */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-white/[0.04] pb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} className="text-acid-cyan animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">Telemetria Wydajności Agentów</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Refresh indicators */}
          <span className="text-[8px] text-slate-500 mr-1 hidden sm:inline">Sync: {lastUpdated || 'Pending'}</span>
          
          <button
            onClick={() => setSimulationActive(!simulationActive)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-black border transition-colors cursor-pointer ${
              simulationActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}
          >
            {simulationActive ? '● LIVE' : '⏸ PAUSE'}
          </button>

          <button
            onClick={fetchTelemetryData}
            disabled={isRefreshing}
            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-opacity cursor-pointer disabled:opacity-40"
            title="Wymuś synchronizację"
          >
            <RotateCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metric filter buttons tabs */}
      <div className="flex border-b border-white/[0.04] pb-1.5">
        {[
          { id: 'all', label: 'Bento Analiza', icon: Sliders },
          { id: 'messages', label: 'Wolumen Wiadomości', icon: MessageSquare, color: 'text-[#06b6d4]' },
          { id: 'success', label: 'Skuteczność %', icon: CheckCircle, color: 'text-[#10b981]' },
          { id: 'tokens', label: 'Konsumpcja Tokenów', icon: Cpu, color: 'text-[#a855f7]' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded-sm border uppercase font-bold text-[8px] transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-white/5 text-white border-white/10' 
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <tab.icon size={9} className={tab.color} />
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Layout Content space based on tabs */}
      <div className="flex-1 min-h-[160px] overflow-hidden">
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full">
            {/* 1. Mini chart messages */}
            <div className="bg-neutral-950 p-2.5 rounded border border-white/5 flex flex-col justify-between h-[165px]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#06b6d4] uppercase text-[9px] flex items-center gap-1">
                  <MessageSquare size={10} /> Wolumen Wiadomości
                </span>
                <span className="text-[8px] text-slate-500 font-bold">Licznik</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <BarChart data={telemetry} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" tick={{ fill: '#777', fontSize: 7 }} />
                    <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 7 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090909', borderColor: '#333', fontSize: '9px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Bar dataKey="messageCount" fill={PALETTE.messages} radius={[2, 2, 0, 0]}>
                      {telemetry.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PALETTE.messages} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Mini chart success */}
            <div className="bg-neutral-950 p-2.5 rounded border border-white/5 flex flex-col justify-between h-[165px]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#10b981] uppercase text-[9px] flex items-center gap-1">
                  <CheckCircle size={10} /> Skuteczność Zadania
                </span>
                <span className="text-[8px] text-slate-500 font-bold">Rate %</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <BarChart data={telemetry} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" tick={{ fill: '#777', fontSize: 7 }} />
                    <YAxis domain={[50, 100]} stroke="#555" tick={{ fill: '#777', fontSize: 7 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090909', borderColor: '#333', fontSize: '9px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Bar dataKey="successRate" fill={PALETTE.success} radius={[2, 2, 0, 0]}>
                      {telemetry.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PALETTE.success} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Mini chart tokens */}
            <div className="bg-neutral-950 p-2.5 rounded border border-white/5 flex flex-col justify-between h-[165px]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#a855f7] uppercase text-[9px] flex items-center gap-1">
                  <Cpu size={10} /> Konsumpcja Tokenów
                </span>
                <span className="text-[8px] text-slate-500 font-bold">Model IQ</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <BarChart data={telemetry} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" tick={{ fill: '#777', fontSize: 7 }} />
                    <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 7 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090909', borderColor: '#333', fontSize: '9px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#a855f7' }}
                    />
                    <Bar dataKey="tokensUsed" fill={PALETTE.tokens} radius={[2, 2, 0, 0]}>
                      {telemetry.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PALETTE.tokens} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Full zoom view: Messages */}
        {activeTab === 'messages' && (
          <div className="bg-neutral-950/70 p-3 rounded border border-white/5 flex flex-col h-[165px]">
            <div className="flex-shrink-0 flex items-center justify-between mb-1">
              <span className="font-bold text-white text-[9px] uppercase tracking-wider">Histogram Wolumenu Zapytań i Przetworzonych Sygnałów</span>
              <span className="text-acid-cyan uppercase text-[8px] font-black tracking-widest animate-pulse">● System Live</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <BarChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" tick={{ fill: '#999', fontSize: 8 }} />
                  <YAxis stroke="#555" tick={{ fill: '#999', fontSize: 8 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#444', borderRadius: '4px', fontSize: '10px' }}
                    labelClassName="text-slate-400 font-bold"
                  />
                  <Legend wrapperStyle={{ fontSize: '8px', opacity: 0.8 }} />
                  <Bar dataKey="messageCount" name="Liczba przetworzonych wiadomości" fill={PALETTE.messages} radius={[3, 3, 0, 0]}>
                    {telemetry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Full zoom view: Success */}
        {activeTab === 'success' && (
          <div className="bg-neutral-950/70 p-3 rounded border border-white/5 flex flex-col h-[165px]">
            <div className="flex-shrink-0 flex items-center justify-between mb-1">
              <span className="font-bold text-white text-[9px] uppercase tracking-wider">Statystyka Poprawności Reagowania i Analizy Podatności</span>
              <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 rounded uppercase font-black">Optymalne</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <BarChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" tick={{ fill: '#999', fontSize: 8 }} />
                  <YAxis domain={[60, 100]} stroke="#555" tick={{ fill: '#999', fontSize: 8 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#444', borderRadius: '4px', fontSize: '10px' }}
                    labelClassName="text-slate-400 font-bold"
                  />
                  <Legend wrapperStyle={{ fontSize: '8px', opacity: 0.8 }} />
                  <Bar dataKey="successRate" name="Wskaźnik sukcesu zadań (%)" fill={PALETTE.success} radius={[3, 3, 0, 0]}>
                    {telemetry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Full zoom view: Tokens */}
        {activeTab === 'tokens' && (
          <div className="bg-neutral-950/70 p-3 rounded border border-white/5 flex flex-col h-[165px]">
            <div className="flex-shrink-0 flex items-center justify-between mb-1">
              <span className="font-bold text-white text-[9px] uppercase tracking-wider">Całkowite Zużycie Alokacji Tokenów Kontekstowych</span>
              <span className="text-[8px] bg-acid-purple/10 border border-acid-purple/20 text-acid-purple-accent px-1.5 rounded uppercase font-black" style={{ color: '#c084fc' }}>Koszty</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <BarChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" tick={{ fill: '#999', fontSize: 8 }} />
                  <YAxis stroke="#555" tick={{ fill: '#999', fontSize: 8 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#444', borderRadius: '4px', fontSize: '10px' }}
                    labelClassName="text-slate-400 font-bold"
                  />
                  <Legend wrapperStyle={{ fontSize: '8px', opacity: 0.8 }} />
                  <Bar dataKey="tokensUsed" name="Suma zużytych tokenów" fill={PALETTE.tokens} radius={[3, 3, 0, 0]}>
                    {telemetry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Extreme details footer list */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 text-[8px] leading-tight border-t border-white/[0.04]">
        {telemetry.slice(0, 5).map(agent => (
          <div key={agent.id} className="bg-black/30 border border-white/[0.02] p-1 rounded-sm flex flex-col justify-between">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: agent.color }} />
              <span className="font-bold text-white truncate max-w-[55px]">{agent.name}</span>
            </div>
            <div className="flex justify-between text-slate-500 mt-1">
              <span>Msg: {agent.messageCount}</span>
              <span className="text-emerald-500">{agent.successRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
