import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Shield, Database, Cloud, RefreshCw, X, Filter } from 'lucide-react';
import { subscribeToLogs, LogEntry } from '../services/firebase';
import { cn } from '../lib/utils';

export function FirebaseLogsViewer({ onClose }: { onClose?: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToLogs((fetchedLogs) => {
      setLogs(fetchedLogs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.agentName?.toLowerCase().includes(filter.toLowerCase()) ||
    log.details?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-acid-cyan/10 rounded-lg text-acid-cyan">
              <Cloud size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display uppercase tracking-widest text-white">Centralne Archiwum Logów (Firestore)</h2>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter">Trwała kopia zapasowa operacji roju • synchronizacja live</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-2 py-1 rounded-md mr-4">
              <Filter size={12} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Filtruj historię..." 
                className="bg-transparent border-none outline-none text-[10px] text-white font-mono w-40"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            {onClose && (
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono gap-3">
              <RefreshCw size={32} className="animate-spin text-acid-cyan" />
              <span className="text-[10px] uppercase tracking-widest">Pobieranie logów z chmury Firebase...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono gap-2 opacity-50">
              <History size={48} strokeWidth={1} />
              <span className="text-[10px] uppercase tracking-widest">Brak zapisanych logów centralnych</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[8px] font-black font-mono text-slate-600 uppercase border-b border-white/5 mb-2 tracking-widest">
                <div className="col-span-2">CZAS</div>
                <div className="col-span-2">AGENT</div>
                <div className="col-span-3">AKCJA</div>
                <div className="col-span-5">SZCZEGÓŁY OPERACJI</div>
              </div>
              {filteredLogs.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id} 
                  className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/10 transition-all group items-center"
                >
                  <div className="col-span-2 text-[9px] font-mono text-slate-500 group-hover:text-acid-cyan transition-colors">
                    {new Date(log.timestamp).toLocaleTimeString()}
                    <span className="block text-[7px] text-slate-600 uppercase">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-white font-mono truncate block">
                      {log.agentName || 'SYSTEM'}
                    </span>
                    <span className="text-[7px] text-slate-600 font-mono truncate block">ID: {log.agentId?.slice(0, 8) || 'N/A'}</span>
                  </div>
                  <div className="col-span-3">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black font-mono uppercase tracking-tighter inline-block",
                      log.action.includes('ERROR') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                      log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-acid-cyan/10 text-acid-cyan border border-acid-cyan/20'
                    )}>
                      {log.action}
                    </span>
                  </div>
                  <div className="col-span-5 text-[10px] text-slate-300 font-mono leading-tight pr-2">
                    {log.details || <span className="italic text-slate-600">Brak danych diagnostycznych</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-black/40 flex items-center justify-between text-[8px] font-mono font-bold text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Shield size={10} className="text-emerald-500" /> AUTH: GOOGLE SECRET S-3</span>
            <span className="flex items-center gap-1"><Database size={10} className="text-acid-purple" /> ENGINE: FIRESTORE ENTERPRISE</span>
          </div>
          <p className="uppercase tracking-widest">Kryptograficzna synchronizacja w czasie rzeczywistym</p>
        </div>
      </div>
    </motion.div>
  );
}
