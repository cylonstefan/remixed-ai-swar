import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { 
  Loader2, 
  Sparkles, 
  Bot, 
  AlertCircle, 
  Coins, 
  Cpu, 
  Zap, 
  Activity, 
  Gauge, 
  Info, 
  TrendingUp 
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-white/10 p-3 rounded-xl font-mono text-[10px] space-y-1.5 shadow-2xl">
        <p className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry: any) => {
          const nameLower = entry.name.toLowerCase();
          const isCost = nameLower.includes('koszt') || nameLower.includes('cost') || nameLower.includes('budget');
          const isPercent = entry.name.includes('%') || nameLower.includes('efektywność') || nameLower.includes('skuteczność') || nameLower.includes('rate') || nameLower.includes('efficiency');
          let displayVal = entry.value;
          if (isCost) {
            displayVal = `$${parseFloat(entry.value).toFixed(4)}`;
          } else if (isPercent) {
            displayVal = `${entry.value}%`;
          }
          return (
            <div key={entry.name} className="flex justify-between items-center gap-6">
              <span style={{ color: entry.stroke || entry.fill || entry.color }} className="text-slate-400">
                {entry.name}:
              </span>
              <span className="font-bold text-white text-right">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const AgentOptimizer = () => {
  const [failedTasks, setFailedTasks] = useState<{id: string, name: string, error: string}[]>([]);
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    // Simulating API fetch + AI analysis
    setTimeout(() => {
        setFailedTasks([
            { id: 't1', name: 'Network Scan', error: 'Timeout' },
            { id: 't2', name: 'File Copy', error: 'PermDenied' }
        ]);
        setSuggestions("Zwiększ timeout w systemPrompcie dla 'Network Scan'. Dodaj 'permission_check' do 'File Copy'. Wprowadź tańsze modele flash dla powtarzalnych zadań.");
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" /> Inteligentny Optymalizator Promptów i Kosztów
        </h3>
        <button onClick={analyze} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-black font-bold uppercase rounded-lg text-xs hover:bg-amber-400">
             {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />} 
             {loading ? "Analizuję..." : "Analizuj optymalność agentów (Prompt & API Cost)"}
        </button>
        {suggestions && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/5 font-mono text-[10px] text-slate-300">
                <span className="text-amber-400 font-bold block mb-1">Sugestie optymalizacyjne AI:</span>
                {suggestions}
            </div>
        )}
    </div>
  );
};

export const AgentPerformance = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [heatmap24h, setHeatmap24h] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, agentsData, timelineData, heatmapData] = await Promise.all([
          api.getAgentStats(),
          api.getAgents(),
          api.getAgentMessagesOverTime(),
          api.getAgentActivity24h()
        ]);
        
        // Merge stats with agent details to compute custom efficiency and cost metrics
        const merged = statsData.map(stat => {
          const agentDetails = agentsData.find(a => a.id === stat.id);
          const model = agentDetails?.model || 'gemini-3-flash-preview';
          const xp = agentDetails?.xp || 0;
          const tasksCompleted = stat.tasksCompleted || agentDetails?.tasksCompleted || 0;
          const usage = agentDetails?.usage || stat.messageCount || 1;
          const mCount = stat.messageCount || 0;
          
          // Cost rate lookup based on Swarm LLM Model Configurations:
          let modelCostPerRequest = 0.0015; // standard cheap Flash/medium
          if (model.includes('pro')) {
            modelCostPerRequest = 0.0450; // premium Pro compute resources
          } else if (model.includes('gpt-4')) {
            modelCostPerRequest = 0.0300;
          } else if (model.includes('preview')) {
            modelCostPerRequest = 0.0025;
          } else if (model.includes('local') || model.includes('llama')) {
            modelCostPerRequest = 0.0003; // offline server host
          }

          const totalModelCost = mCount * modelCostPerRequest;
          
          // Cost per task matches actual messages spent divided by successfully finished tasks.
          const modelCostPerTask = tasksCompleted > 0 
            ? parseFloat((totalModelCost / tasksCompleted).toFixed(5))
            : parseFloat(totalModelCost.toFixed(5)) || modelCostPerRequest;

          // Resource Efficiency Score (0-100%):
          // Evaluates task completion vs usage execution rate, message footprint efficiency,
          // and a slight compute model payload penalty (Pro models consume more GPU clusters)
          const completionRate = usage > 0 ? (tasksCompleted / usage) : 0.8;
          const costWeight = model.includes('pro') ? 0.70 : 0.95; 
          const powerUsed = agentDetails?.processingPower || 50;

          let resourceEfficiency = Math.round(
            (completionRate * 0.6 + (1 - (powerUsed / 200)) * 0.2 + costWeight * 0.2) * 100
          );
          
          if (mCount === 0 && tasksCompleted === 0) {
            resourceEfficiency = 0;
          } else {
            resourceEfficiency = Math.min(100, Math.max(25, resourceEfficiency));
          }

          return {
            ...stat,
            model,
            xp,
            tasksCompleted,
            usage,
            processingPower: agentDetails?.processingPower || 60,
            autonomyLevel: agentDetails?.autonomyLevel || 70,
            modelCostPerRequest,
            totalModelCost,
            modelCostPerTask,
            resourceEfficiency
          };
        });

        setStats(merged);
        setTimeline(timelineData.timeline || []);
        setHeatmap24h(heatmapData.heatmap || []);
      } catch (err) {
        console.error("Błąd ładowania danych wydajności:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-acid-cyan" /></div>;
  }

  // Summary indicators computed globally across the entire active agent cluster
  const totalClusterCost = stats.reduce((acc, agent) => acc + (agent.totalModelCost || 0), 0);
  const averageCostPerTask = stats.reduce((acc, agent) => acc + (agent.modelCostPerTask || 0), 0) / Math.max(1, stats.length);
  const averageResourceEfficiency = Math.round(stats.reduce((acc, agent) => acc + (agent.resourceEfficiency || 0), 0) / Math.max(1, stats.length));
  const mostEfficientAgent = stats.length > 0 ? [...stats].sort((a, b) => b.resourceEfficiency - a.resourceEfficiency)[0] : null;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Analityka Roju</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">Telemetryczny pulpit wydajności, ekonomii kosztów i efektywności zasobów</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-acid-purple font-black uppercase">Michał Major Core 🥇</div>
          <div className="text-[8px] text-slate-600 font-mono">SECURE REALTIME SWARM FEED</div>
        </div>
      </div>

      {/* Dynamic Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
        
        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-bl-full pointer-events-none" />
          <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
            <Coins size={10} className="text-cyan-400" />
            Suma kosztów modeli
          </span>
          <div className="text-xl font-black text-white font-mono">
            ${totalClusterCost.toFixed(4)}
          </div>
          <span className="text-[8px] text-slate-600 block">Dla wszystkich jednostek</span>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-bl-full pointer-events-none" />
          <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
            <TrendingUp size={10} className="text-amber-400" />
            Średni Koszt Zadania
          </span>
          <div className="text-xl font-black text-amber-400 font-mono">
            ${averageCostPerTask.toFixed(4)}
          </div>
          <span className="text-[8px] text-slate-600 block">Wskaźnik ekonomii pracy</span>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-bl-full pointer-events-none" />
          <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
            <Zap size={10} className="text-emerald-400 animate-pulse" />
            Wydajność Zasobów
          </span>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {averageResourceEfficiency}%
          </div>
          <span className="text-[8px] text-slate-600 block">Średnia klastra Swarm</span>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-bl-full pointer-events-none" />
          <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono flex items-center gap-1.5">
            <Cpu size={10} className="text-purple-400" />
            Lider Optymalizacji
          </span>
          <div className="text-xs font-black text-white truncate my-1.5 uppercase font-mono">
            {mostEfficientAgent ? mostEfficientAgent.name : 'Brak danych'}
          </div>
          <span className="text-[8px] text-slate-600 block">Najmniej narzutu / wysoka celność</span>
        </div>

      </div>
      
      {/* Advanced performance Bento chart grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Activity Volume */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-acid-cyan/5 rounded-full blur-3xl" />
          <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Activity className="text-acid-cyan animate-pulse mt-0.5" size={14} />
            Wiadomości na Agenta (Obciążenie)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="messageCount" name="Wiadomości" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Resource Efficiency % (Requested Metric) */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
          <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Zap className="text-emerald-400 animate-pulse" size={14} />
            Efektywność Zasobów (%)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="resourceEfficiency" name="Efektywność zasobów" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Model Cost Per Task USD (Requested Metric) */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
          <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Coins className="text-amber-400 animate-pulse" size={14} />
            Model Cost per Task (USD)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <AreaChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="modelCostPerTask" name="Koszt na zadanie" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Time Timeline Activity */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-acid-purple/5 rounded-full blur-3xl" />
          <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Info className="text-acid-purple animate-pulse" size={14} />
            Aktywność w czasie (30 dni)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0c0d12', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="count" name="Aktywność klastra" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      
      <AgentOptimizer />
      
      {/* 24h Heatmap Component */}
      <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-pink-500" />
                Mapa Aktywności (Ostatnie 24H)
            </h3>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-white/5"></div><span className="text-[9px] font-mono text-slate-500">Idle</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-pink-500/20 border border-pink-500/30"></div><span className="text-[9px] font-mono text-slate-500">Low</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-pink-500/60 border border-pink-500/80"></div><span className="text-[9px] font-mono text-slate-500">Normal</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div><span className="text-[9px] font-mono text-slate-500">High</span></div>
            </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-max flex">
                <div className="flex flex-col gap-1 pr-4 border-r border-white/10 shrink-0 w-32">
                     <div className="h-5 flex items-end"><span className="text-[9px] font-mono text-slate-500">Agent</span></div>
                     {stats.map(agent => (
                        <div key={agent.id} className="h-6 flex items-center" title={agent.name}>
                            <span className="text-[10px] font-bold text-white truncate w-full" style={{ color: agent.color || '#fff' }}>
                                {agent.name.length > 12 ? agent.name.substring(0,10) + '..' : agent.name}
                            </span>
                        </div>
                     ))}
                </div>
                
                <div className="flex gap-1 pl-4 shrink-0">
                    {heatmap24h.map((hourData, i) => (
                        <div key={i} className="flex flex-col gap-1 group/col">
                             <div className="h-5 flex items-end justify-center mb-1">
                                 <span className="text-[8px] font-mono text-slate-500 whitespace-nowrap transform -rotate-45 block group-hover/col:text-white transition-colors">{hourData.hour}</span>
                             </div>
                             {stats.map(agent => {
                                 const aData = hourData[agent.name] || { activity: 0, status: 'idle', messages: 0, tasksCompleted: 0 };
                                 const isIdle = aData.status === 'idle';
                                 
                                 let bgClass = "bg-white/5 border border-transparent";
                                 if (!isIdle) {
                                     if (aData.activity < 20) bgClass = "bg-pink-500/20 border border-pink-500/30";
                                     else if (aData.activity < 60) bgClass = "bg-pink-500/60 border border-pink-500/80";
                                     else bgClass = "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] border border-pink-400";
                                 }

                                 return (
                                     <div key={`${agent.id}-${i}`} className="relative group/cell cursor-crosshair">
                                         <div className={`w-6 h-6 rounded-sm ${bgClass} transition-colors duration-200 hover:border-white`}></div>
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/cell:flex items-center justify-center p-2 bg-slate-900 border border-white/20 rounded z-50 whitespace-nowrap shadow-xl">
                                             <div className="text-[9px] font-mono px-1">
                                                 <div className="text-white font-bold border-b border-white/10 pb-1 mb-1">{agent.name} <span className="text-slate-400 font-normal ml-2">{hourData.hour}</span></div>
                                                 <div className="text-slate-300">Aktywność: <span className="text-amber-400 font-bold ml-1">{aData.activity}%</span></div>
                                                 <div className="text-slate-300">Wiadomości: <span className="text-cyan-400 font-bold ml-1">{aData.messages}</span></div>
                                                 <div className="text-slate-300">Ukończone Taski: <span className="text-emerald-400 font-bold ml-1">{aData.tasksCompleted}</span></div>
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Grid listing the agents with advanced indicators and telemetry */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 px-2">
           Szczegółowa Dojrzałość i Parametry Telemetrii Agentów
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.map(agent => {
            const mastery = Math.min(100, 70 + (agent.xp || 0) / 10);
            const virtualNodes = 50 + (agent.tasksCompleted || 0) * 10;
            const modelShort = agent.model?.replace('gemini-', 'gem-')?.replace('-preview', '') || 'unknown-m';
            
            // Highlight efficiency statuses
            const isCostEffective = agent.modelCostPerTask < 0.012 && agent.tasksCompleted > 0;
            const isHeavyCompute = agent.model?.includes('pro') || agent.processingPower > 75;

            return (
              <div key={agent.id} className="bg-black/40 border border-white/5 p-5 rounded-3xl space-y-4 hover:border-white/10 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-bl-full pointer-events-none" />
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
                      <span className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[110px]" title={agent.name}>{agent.name}</span>
                    </div>
                    <span className="text-[8.5px] font-mono text-slate-500 uppercase bg-white/5 px-2 py-0.5 rounded tracking-wider italic block">
                      {modelShort}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-acid-cyan font-bold bg-acid-cyan/5 border border-acid-cyan/15 px-1.5 py-0.5 rounded">v{virtualNodes}n</span>
                </div>
                
                {/* Efficiency progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                    <span className="flex items-center gap-1"><Zap size={8} className="text-emerald-400" /> Resource Efficiency</span>
                    <span className="text-emerald-400 font-bold">{agent.resourceEfficiency}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${agent.resourceEfficiency}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    />
                  </div>
                </div>

                {/* Swarm Mastery progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                    <span>Swarm Mastery</span>
                    <span>{mastery}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${mastery}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-acid-purple shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                    />
                  </div>
                </div>

                {/* Specific and advanced metrics grid (USD Cost & Compute Level) */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 font-mono">
                   <div className="space-y-0.5">
                      <div className="text-[7px] text-slate-500 uppercase font-bold">Cost per task</div>
                      <div className="text-[10px] text-amber-400 font-semibold" title={`Est. usage cost: $${(agent.totalModelCost || 0).toFixed(4)}`}>
                        ${(agent.modelCostPerTask || 0).toFixed(4)}
                      </div>
                   </div>
                   <div className="space-y-0.5 text-right flex flex-col items-end justify-center">
                      <div className="text-[7px] text-slate-500 uppercase font-bold">Invocations</div>
                      <div className="text-[10px] text-white">{agent.usage || agent.messageCount || 0} runs</div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono text-[9px]">
                   <div className="text-slate-500">
                      XP: <span className="text-white font-semibold">{agent.xp || 0} pts</span>
                   </div>
                   <div className="text-right text-slate-500">
                      Done: <span className="text-acid-green font-semibold">{agent.tasksCompleted || 0}</span>
                   </div>
                </div>

                {/* Performance profile tag feedback */}
                <div className="flex justify-between items-center pt-1 animate-fadeIn gap-1">
                  {isCostEffective ? (
                    <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                      Eco Saver 🏷️
                    </span>
                  ) : isHeavyCompute ? (
                    <span className="text-[7px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                      Heavy Compute ⚙️
                    </span>
                  ) : (
                    <span className="text-[7px] bg-slate-500/10 text-slate-400 border border-slate-500/20 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                      Balanced ⚖️
                    </span>
                  )}
                  
                  <span className="text-[7.5px] font-mono text-slate-500 text-right">
                    Perf Index: {Math.round((agent.resourceEfficiency * 0.7) + (mastery * 0.3))}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
