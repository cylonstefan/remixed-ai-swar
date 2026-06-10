import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive } from 'lucide-react';
import { ClusterNode } from '../types';
import { cn } from '../lib/utils';

interface ClusterLoadGaugeProps {
  nodes: ClusterNode[];
}

export const ClusterLoadGauge: React.FC<ClusterLoadGaugeProps> = ({ nodes }) => {
  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <div key={node.id} className="bg-black/40 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-sm text-white font-bold">{node.name}</span>
            <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full", node.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>{node.status}</span>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span className="flex items-center gap-1"><Cpu size={10} /> CPU</span>
                <span>{node.cpuUsage || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${node.cpuUsage || 0}%` }}
                  className="h-full bg-acid-cyan" 
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span className="flex items-center gap-1"><HardDrive size={10} /> RAM</span>
                <span>{node.ramUsage || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${node.ramUsage || 0}%` }}
                  className="h-full bg-acid-purple" 
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
