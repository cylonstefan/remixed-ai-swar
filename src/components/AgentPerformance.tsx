import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

export const AgentPerformance = () => {
  const [stats, setStats] = useState<{ id: string; name: string; color: string; messageCount: number; xp?: number; tasksCompleted?: number }[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, timelineData] = await Promise.all([
          api.getAgentStats(),
          api.getAgentMessagesOverTime()
        ]);
        setStats(statsData);
        setTimeline(timelineData.timeline || []);
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

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Analityka Roju</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">Statusy operacyjne i dojrzałość jednostek AI</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-acid-purple font-black uppercase">Michał Major Core 🥇</div>
          <div className="text-[8px] text-slate-600 font-mono">ENCRYPTED TELEMETRY STREAM</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Message Counts Bar Chart */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-acid-cyan/5 rounded-full blur-3xl" />
          <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-acid-cyan animate-pulse" />
            Wiadomości na Agenta
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c0d12', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="messageCount" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tokens/Messages Over Time Area Chart */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-acid-purple/5 rounded-full blur-3xl" />
          <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-acid-purple animate-pulse" />
            Aktywność w czasie (30 dni)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c0d12', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SWARM MASTERY GRID (Diverse Agent Stats) */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 px-2">
           Dojrzałość i Skala Jednostek
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.map(agent => {
            const mastery = Math.min(100, 70 + (agent.xp || 0) / 10);
            const virtualNodes = 50 + (agent.tasksCompleted || 0) * 10;
            return (
              <div key={agent.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-4 hover:border-white/10 transition-all group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
                    <span className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[100px]">{agent.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-acid-cyan font-bold">v{virtualNodes}n</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                    <span>Swarm Mastery</span>
                    <span>{mastery}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${mastery}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-acid-purple shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                   <div className="space-y-0.5">
                      <div className="text-[7px] text-slate-500 uppercase font-bold">Ekspertyza (XP)</div>
                      <div className="text-[10px] text-white font-mono">{agent.xp || 0} pts</div>
                   </div>
                   <div className="space-y-0.5 text-right">
                      <div className="text-[7px] text-slate-500 uppercase font-bold">Zadania OK</div>
                      <div className="text-[10px] text-acid-green font-mono">{agent.tasksCompleted || 0}</div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
