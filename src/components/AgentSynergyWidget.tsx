import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SynergyNode {
  source: string;
  target: string;
  score: number;
  trend: 'up' | 'down';
}

export function AgentSynergyWidget() {
  const [synergyData, setSynergyData] = useState<SynergyNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSynergy().then(data => {
      setSynergyData(data.sort((a, b) => b.score - a.score).slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-neutral-900/40 rounded-[2.5rem] border border-white/5">
        <Lucide.Loader2 className="animate-spin text-acid-purple" />
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 border border-white/5 rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden text-left h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-acid-purple/10 text-acid-purple rounded-xl border border-acid-purple/20">
            <Lucide.Combine size={18} />
          </div>
          <div>
            <h3 className="text-white font-black uppercase text-xs tracking-tighter italic">Indeks Synergii Roju</h3>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Współczynniki kolaboracji agentów</p>
          </div>
        </div>
        <Lucide.TrendingUp size={16} className="text-acid-green opacity-30" />
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {synergyData.map((node, i) => (
          <motion.div 
            key={`${node.source}-${node.target}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white uppercase italic">{node.source}</span>
                <Lucide.Zap size={10} className="text-acid-cyan animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase italic">{node.target}</span>
              </div>
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                node.score > 80 ? "bg-acid-green/10 text-acid-green" : "bg-white/10 text-slate-400"
              )}>
                {node.score}% Cohesion
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${node.score}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    node.score > 85 ? "bg-acid-green shadow-[0_0_10px_rgba(34,197,94,0.5)]" : 
                    node.score > 60 ? "bg-acid-purple" : "bg-slate-700"
                  )}
                />
              </div>
              <div className="flex items-center gap-1">
                {node.trend === 'up' ? (
                  <Lucide.ArrowUpRight size={12} className="text-acid-green" />
                ) : (
                  <Lucide.ArrowDownRight size={12} className="text-rose-500" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest italic">Live Neural Mapping</span>
        <button className="text-[9px] font-black text-[#a855f7] uppercase hover:underline opacity-60 hover:opacity-100 transition-all">
          Szczegóły &rarr;
        </button>
      </div>
    </div>
  );
}
