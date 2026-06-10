import React, { useState, useEffect } from 'react';
import { Network, Link2, Info, Unplug, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import { ClusterNode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const QuickClusterPreview = React.memo(({ onConfigure }: { onConfigure: () => void }) => {
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadNodes();
    const int = setInterval(loadNodes, 5000);
    return () => clearInterval(int);
  }, []);

  const loadNodes = async () => {
    try {
      const data = await api.getClusters();
      setNodes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      // Simulate connect
      alert('Połączono z węzłami logicznymi klastra.');
    }, 1500);
  };

  const handleDisconnect = () => {
    alert('Odłączono magistralę klastra.');
  };

  const activeNodes = nodes.filter(n => n.status === 'online').length;

  return (
    <div className="mx-4 mb-4 rounded-xl bg-gradient-to-br from-[#2a2d32] to-[#1e2024] border border-[#4a4f55] shadow-lg overflow-hidden relative">
      {/* Specular highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Network size={12} />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase text-white tracking-wider">Klaster LLM</span>
            <span className="block text-[9px] text-emerald-400 font-mono">{activeNodes} Węzłów Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
            />
            {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#3e4246] overflow-hidden bg-black/20"
          >
            <div className="p-3 grid grid-cols-2 gap-2">
              <button 
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-bold uppercase transition-colors"
              >
                <Link2 size={10} className={connecting ? "animate-spin" : ""} />
                {connecting ? 'ŁĄCZENIE...' : 'POŁĄCZ'}
              </button>
              
              <button 
                onClick={handleDisconnect}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[9px] font-bold uppercase transition-colors"
              >
                <Unplug size={10} />
                ROZŁĄCZ
              </button>

              <button 
                onClick={() => alert(`Analiza węzłów operacyjnych:\nZarejestrowano ${nodes.length} instancji.\nW tym ${activeNodes} aktywnych jednostek logicznych.\nGotowość bojowa potwierdzona.`)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[9px] font-bold uppercase transition-colors"
              >
                <Info size={10} />
                INFO
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); onConfigure(); }}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-[9px] font-bold uppercase transition-colors"
              >
                <Settings size={10} />
                KONFIGURUJ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
