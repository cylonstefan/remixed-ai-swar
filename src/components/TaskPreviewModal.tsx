import React from 'react';
import { motion } from 'motion/react';
import { X, GitCommit, GitMerge, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task } from '../types';

interface TaskPreviewModalProps {
  task: Task;
  allTasks?: Task[];
  onClose: () => void;
}

export const TaskPreviewModal: React.FC<TaskPreviewModalProps> = ({ task, allTasks = [], onClose }) => {
  const resolvedDependencies = task.dependencies 
    ? allTasks.filter(t => task.dependencies?.includes(t.id)) 
    : [];
    
  const resolvedDependents = allTasks.filter(t => t.dependencies?.includes(task.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 380 }}
        className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-6 text-left"
      >
        <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
          <div>
            <div className="text-[9px] font-mono font-black text-acid-purple uppercase tracking-widest mb-1">
              PARAMETRY SZYBKIEGO PODGLĄDU
            </div>
            <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">
              {task.title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Status systemowy</span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block",
                task.status === 'done' ? "bg-acid-green/10 text-acid-green border border-acid-green/20" :
                task.status === 'in-progress' ? "bg-acid-cyan/10 text-acid-cyan border border-acid-cyan/20 animate-pulse" :
                "bg-acid-purple/10 text-acid-purple border border-acid-purple/20"
              )}>
                {task.status === 'done' ? 'TERMINATED' :
                 task.status === 'in-progress' ? 'SYSTEM_BUSY' : 'BACKLOG'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Priorytet operacyjny</span>
              <span className="text-[10px] text-white font-bold uppercase tracking-wide block">
                {task.priority === 'high' ? '🔴 HIGH (Krytyczny)' :
                 task.priority === 'medium' ? '🟡 MEDIUM (Średni)' : '🟢 LOW (Niski)'}
              </span>
            </div>

            {task.complexity && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Złożoność (CPLX)</span>
                <span className="text-[10px] text-white font-bold uppercase tracking-wide block">
                  {task.complexity === 'high' ? '⚡ HIGH' :
                   task.complexity === 'medium' ? '⚖️ MEDIUM' : '🌱 LOW'}
                </span>
              </div>
            )}

            {task.taskType && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Typ zadania (TYPE)</span>
                <span className="text-[10px] text-acid-cyan font-bold uppercase tracking-wide block">
                  {task.taskType}
                </span>
              </div>
            )}
            
            {task.expectedOutputFormat && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Format Oczekiwany</span>
                <span className="text-[10px] text-acid-green font-bold uppercase tracking-wide block">
                  {task.expectedOutputFormat}
                </span>
              </div>
            )}
            
            {task.swarmAttitude && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Nastawienie Roju</span>
                <span className="text-[10px] text-acid-purple font-bold uppercase tracking-wide block">
                  {task.swarmAttitude}
                </span>
              </div>
            )}
          </div>

          {task.hints && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-acid-purple/10 space-y-1 text-xs mt-3">
              <span className="text-[8px] font-mono font-black text-acid-purple uppercase tracking-widest block">Podpowiedzi / Instrukcje Rozszerzone</span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                {task.hints}
              </p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs mt-3">
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
              <span>UTWORZONO:</span>
              <span>{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            {task.dueDate && (
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/5 pt-2">
                <span>TERMIN OSTATECZNY:</span>
                <span className="text-acid-cyan font-bold">{new Date(task.dueDate).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* DEPENDENCY VISUALIZATION ROW */}
          {(resolvedDependencies.length > 0 || resolvedDependents.length > 0) && (
            <div className="mt-4 p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <GitMerge size={12} className="text-acid-purple" /> 
                Łańcuch Zależności Roju
              </span>

              <div className="flex flex-col items-center justify-center gap-1 font-mono">
                {/* Parents (Dependencies) */}
                {resolvedDependencies.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                    {resolvedDependencies.map(dep => (
                      <div key={dep.id} className="text-[9px] uppercase border border-slate-700 bg-slate-900 px-3 py-1.5 rounded text-slate-400 max-w-[150px] truncate">
                        {dep.title}
                      </div>
                    ))}
                  </div>
                )}
                {resolvedDependencies.length > 0 && (
                  <div className="flex flex-col items-center opacity-50 py-1">
                    <div className="w-[1px] h-4 bg-acid-purple border-l border-dashed border-acid-purple"></div>
                    <ArrowDown size={12} className="text-acid-purple -mt-1" />
                  </div>
                )}

                {/* Current Task */}
                <div className="px-5 py-2.5 bg-acid-purple/10 border border-acid-purple/40 rounded-lg text-acid-purple text-[10px] uppercase font-black tracking-widest shadow-[0_0_15px_rgba(139,92,246,0.15)] max-w-full truncate text-center">
                  <GitCommit size={10} className="inline-block mr-1.5 -mt-0.5" />
                  {task.title}
                </div>

                {/* Children (Dependents) */}
                {resolvedDependents.length > 0 && (
                  <div className="flex flex-col items-center py-1">
                    <ArrowDown size={12} className="text-acid-cyan opacity-80" />
                    <div className="w-[1px] h-4 bg-acid-cyan/50 border-l border-dashed border-acid-cyan -mt-1"></div>
                  </div>
                )}
                {resolvedDependents.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                    {resolvedDependents.map(dep => (
                      <div key={dep.id} className="text-[9px] uppercase border border-acid-cyan/20 bg-acid-cyan/5 px-3 py-1.5 rounded text-acid-cyan max-w-[150px] truncate">
                        {dep.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
          >
            Zamknij podgląd
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
