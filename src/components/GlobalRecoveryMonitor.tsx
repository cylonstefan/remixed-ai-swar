import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, RefreshCw, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { api } from '../services/api';
import { AgentErrorLog, Agent } from '../types';
import { cn } from '../lib/utils';

export function GlobalRecoveryMonitor({ onClose }: { onClose?: () => void }) {
  const [errors, setErrors] = useState<AgentErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuningId, setTuningId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [errorLogs, agentList] = await Promise.all([
        api.getAgentErrors(),
        api.getAgents()
      ]);
      setErrors(errorLogs.filter(log => log.status === 'FAILED_TO_EXECUTE'));
      setAgents(agentList);
    } catch (err) {
      console.error("Failed to load recovery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleRetrain = async (log: AgentErrorLog) => {
    setTuningId(log.id);
    try {
      // 1. Mark error as TUNED
      await api.updateAgentErrorStatus(log.id, 'TUNED');
      
      // 2. Refine agent prompt
      const agent = agents.find(a => a.id === log.agentId);
      if (agent) {
        const refinedPrompt = `${agent.systemPrompt}\n\n[GLOBAL RECOVERY REFINEMENT]: Podczas zadania "${log.taskTitle}" wystąpiła krytyczna awaria. Błąd: "${log.errorMessage}". Twoim priorytetem jest teraz unikanie tego błędu poprzez dokładniejszą walidację parametrów wejściowych i stosowanie bezpiecznych procedur wykonawczych.`;
        await api.updateAgent(agent.id, { 
          ...agent, 
          systemPrompt: refinedPrompt,
          xp: (agent.xp || 0) + 50, // Reward training
          experienceLevel: (agent.xp || 0) + 50 > 1000 ? 'expert' : (agent.xp || 0) + 50 > 500 ? 'intermediate' : 'novice'
        });
      }
      
      // 3. Refresh list
      await loadData();
    } catch (err) {
      console.error("Retraining failed:", err);
    } finally {
      setTuningId(null);
    }
  };

  const handleRetrainAll = async () => {
    if (errors.length === 0) return;
    setLoading(true);
    for (const error of errors) {
      await handleRetrain(error);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <div className="bg-neutral-900 border border-red-500/30 rounded-2xl w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)]">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <ShieldAlert size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display uppercase tracking-widest text-white flex items-center gap-2">
                Global Recovery Monitor
                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                  {errors.length} AWARIE
                </span>
              </h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                System Nadzoru Krytycznego • Wykrywanie 'FAILED_TO_EXECUTE' • Automatyczna Rekultywacja Agentów
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {errors.length > 0 && (
              <button 
                onClick={handleRetrainAll}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
              >
                <Zap size={14} /> Retrain All
              </button>
            )}
            <button 
              onClick={loadData}
              className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading && errors.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono gap-4">
              <RefreshCw size={40} className="animate-spin text-red-500" />
              <span className="text-xs uppercase tracking-widest animate-pulse">Skanowanie logów błędu...</span>
            </div>
          ) : errors.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono gap-4 opacity-50">
              <CheckCircle size={60} strokeWidth={1} className="text-emerald-500" />
              <div className="text-center">
                <span className="text-sm uppercase tracking-widest block font-bold text-white mb-1">Status: OK</span>
                <span className="text-[10px] uppercase tracking-tighter">Brak aktywnych awarii FAILED_TO_EXECUTE w roju</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {errors.map((error) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={error.id} 
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex gap-4">
                        <div className="p-2.5 bg-red-500/10 rounded-lg h-fit text-red-400 group-hover:bg-red-500/20 transition-colors">
                          <AlertTriangle size={18} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                              {error.taskTitle}
                            </h3>
                            <span className="text-[9px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded font-black tracking-widest border border-red-500/20">
                              {error.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                            <span className="flex items-center gap-1.5"><Zap size={10} className="text-acid-cyan" /> AGENT: <strong>{error.agentName}</strong></span>
                            <span className="flex items-center gap-1.5"><Info size={10} className="text-acid-purple" /> TYP: {error.errorType}</span>
                            <span className="opacity-40">{new Date(error.createdAt || '').toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5 italic mt-2 leading-relaxed">
                            "{error.errorMessage}"
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleRetrain(error)}
                        disabled={tuningId === error.id}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 sm:p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl transition-all min-w-[100px] gap-1 shadow-lg",
                          tuningId === error.id && "opacity-50 cursor-wait bg-orange-500/10 text-orange-400 border-orange-500/20"
                        )}
                      >
                        {tuningId === error.id ? (
                          <>
                            <RefreshCw className="animate-spin" size={18} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Retraining...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={18} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Autorecover</span>
                          </>
                        )}
                      </button>
                    </div>
                    {/* Background glow effect on group hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> RECOVERY ENGINE: ACTIVE</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-acid-cyan animate-pulse" /> AI RECURSIVE TUNING: ONLINE</span>
          </div>
          <p className="opacity-50">Cylon Intelligence Systems • v2.0-RECOVERY</p>
        </div>
      </div>
    </motion.div>
  );
}
