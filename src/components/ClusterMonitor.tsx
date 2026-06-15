import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { ClusterNode } from '../types';

interface NodeDataPoint {
  time: number;
  cpu: number;
  ram: number;
}

export const ClusterMonitor = React.memo(() => {
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [history, setHistory] = useState<Record<string, NodeDataPoint[]>>({});

  useEffect(() => {
    let active = true;
    const fetchNodes = async () => {
      try {
        const data = await api.getClusters();
        if (active) setNodes(data);
      } catch (e) {
        console.warn('Failed to fetch clusters');
      }
    };
    fetchNodes();
    const int = setInterval(fetchNodes, 5000);
    return () => { active = false; clearInterval(int); };
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;
    setHistory(prev => {
      const next = { ...prev };
      nodes.forEach(node => {
        // Calculate percentages
        const cpuUsage = node.cpuUsage || 0;
        const ramUsage = node.ramUsage || 0;
        
        const pt = { time: Date.now(), cpu: cpuUsage, ram: ramUsage };
        const h = [...(next[node.id] || []), pt].slice(-15);
        next[node.id] = h;
      });
      return next;
    });
  }, [nodes]);

  // Fallback to dummy data if empty clusters database (for visual demonstration)
  const displayNodes = nodes.length > 0 ? nodes : [{ id: 'No-Database-Nodes', name: 'Virtual Node', type: 'worker' as const, status: 'offline' as const, cpuUsage: 0, ramUsage: 0, ip: '0.0.0.0', lastSeen: new Date().toISOString() }];

  return (
    <div className="flex flex-col h-full space-y-2 relative">
      <h3 className="text-[10px] font-bold text-white flex items-center justify-between tracking-widest uppercase">
        <span className="flex items-center gap-1.5"><Activity size={12} className="text-cyan-400" /> Monitory Węzłów</span>
      </h3>
      <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
        {displayNodes.map(node => (
          <div key={node.id} className="p-2 bg-black/60 rounded border border-white/5 flex flex-col h-[100px] relative overflow-hidden group">
            <div className="flex justify-between items-start mb-1 z-10">
                <div className="font-bold text-cyan-300 text-[8px] truncate max-w-[80px]" title={node.id}>{node.id}</div>
                <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'online' ? 'bg-cyan-500 animate-pulse' : 'bg-rose-500'}`} />
            </div>
            <div className="w-full flex-1 z-0 relative ml-[-10px] pb-1">
              {history[node.id] && history[node.id].length > 0 ? (
                  <ResponsiveContainer width="105%" height="100%" minHeight={1} minWidth={1}>
                    <LineChart data={history[node.id]}>
                      <Line type="monotone" dataKey="cpu" stroke="#06b6d4" dot={false} strokeWidth={1} isAnimationActive={false} />
                      <Line type="stepAfter" dataKey="ram" stroke="#8b5cf6" dot={false} strokeWidth={1} isAnimationActive={false} opacity={0.5} />
                      <YAxis hide domain={[0, 100]} />
                    </LineChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full w-full flex items-center justify-center text-[8px] text-slate-600">Brak Danych / Czekam</div>
              )}
            </div>
            <div className="z-10 text-[7px] text-slate-500 flex justify-between absolute bottom-1 right-2 left-2">
                <span className="text-cyan-500">CPU</span>
                <span className="text-violet-500">RAM</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
