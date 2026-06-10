import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Eye, 
  Clock, 
  Layers, 
  Cpu, 
  Trash2, 
  Activity, 
  BarChart,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Check,
  Lock,
  AlertTriangle,
  Network
} from 'lucide-react';
import { Task, Agent } from '../types';
import { cn } from '../lib/utils';
import { TaskPreviewModal } from './TaskPreviewModal';
import { TaskDependenciesGraph } from './TaskDependenciesGraph';
import { api } from '../services/api';

interface TaskCardProps {
  task: Task;
  activeSwarmId: string | null;
  swarmSize: number;
  isPlanning: string | null;
  getTaskDueLabel: (dueDateStr?: string) => { text: string; isOverdue: boolean; isApproaching: boolean } | null;
  handleLaunchMassiveSwarm: (task: Task) => void;
  handleAutoTeam: (task: Task) => void;
  handleDelete: (id: string) => void;
  handleUpdateStatus: (id: string, status: 'todo' | 'in-progress' | 'done') => void;
  onUpdate?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  activeSwarmId,
  swarmSize,
  isPlanning,
  getTaskDueLabel,
  handleLaunchMassiveSwarm,
  handleAutoTeam,
  handleDelete,
  handleUpdateStatus,
  onUpdate,
  selected,
  onToggleSelect
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const assignedAgent = allAgents.find(a => a.id === task.assignedAgentId);
  const blockedBy = task.dependentOn?.filter(depId => !allTasks.find(t => t.id === depId && t.status === 'done')) || [];
  const isBlocked = blockedBy.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agents, tasks] = await Promise.all([
          api.getAgents(),
          api.getTasks()
        ]);
        setAllAgents(agents);
        setAllTasks(tasks);
      } catch (err) {
        console.error("Błąd ładowania danych w TaskCard:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssignOpen(false);
      }
    };
    if (isAssignOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isAssignOpen]);

  useEffect(() => {
    if (isExpanded) {
      const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const [allLogs, allErrors] = await Promise.all([
            api.getLogs(),
            api.getAgentErrors()
          ]);
          
          // Filter logs related to task
          const query = task.title.toLowerCase();
          const filteredAllLogs = allLogs.filter((l: any) => 
            (l.action && l.action.toLowerCase().includes(query)) ||
            (l.details && l.details.toLowerCase().includes(query))
          );
          
          const filteredErrors = allErrors.filter((e: any) => 
            (e.taskTitle && e.taskTitle.toLowerCase().includes(query)) ||
            (e.errorMessage && e.errorMessage.toLowerCase().includes(query))
          );
          
          setLogs(filteredAllLogs);
          setErrorLogs(filteredErrors);
        } catch (err) {
          console.error("Błąd ładowania logów zadania:", err);
        } finally {
          setIsLoadingLogs(false);
        }
      };
      
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [isExpanded, task.title]);

  return (
    <motion.div 
      layout="position"
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "glass-panel border border-white/5 p-4 pl-5 hover:border-acid-purple/30 transition-all rounded-2xl group relative overflow-hidden cursor-pointer select-none",
        "task-card-glow",
        {
          "status-todo": task.status === 'todo',
          "status-in-progress": task.status === 'in-progress',
          "status-done": task.status === 'done'
        },
        task.status === 'in-progress' ? "bg-acid-cyan/5 border-acid-cyan/20" : "",
        isExpanded ? "border-acid-purple/40 bg-black/20" : ""
      )}
    >
      {/* Left priority accent bar / paski */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1.5",
        task.priority === 'high' ? "bg-gradient-to-b from-red-600 to-red-400" :
        task.priority === 'medium' ? "bg-gradient-to-b from-amber-500 to-yellow-400" :
        "bg-gradient-to-b from-emerald-500 to-emerald-300"
      )} />

      {/* Quick Action Overlay Row */}
      <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLaunchMassiveSwarm(task);
          }}
          disabled={activeSwarmId !== null || task.status === 'done'}
          className="px-2 py-1 bg-neutral-900/95 hover:bg-acid-cyan/20 border border-white/10 hover:border-acid-cyan/40 rounded-lg text-[9px] font-black uppercase tracking-widest text-acid-cyan shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Szybka Inicjalizacja Roju"
        >
          <Layers size={10} /> Szybka Inicjalizacja
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPreviewOpen(true);
          }}
          className="px-2 py-1 bg-neutral-900/95 hover:bg-acid-purple/20 border border-white/10 hover:border-acid-purple/40 rounded-lg text-[9px] font-black uppercase tracking-widest text-acid-purple shadow-md flex items-center gap-1 cursor-pointer"
        >
          <Eye size={10} /> Szybki podgląd
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsGraphOpen(true);
          }}
          className="px-2 py-1 bg-neutral-900/95 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400 shadow-md flex items-center gap-1 cursor-pointer"
        >
          <Network size={10} /> Graf Zależności
        </button>
      </div>

      {task.status === 'in-progress' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-acid-cyan/5 blur-3xl rounded-full -mr-12 -mt-12 animate-pulse" />
      )}
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected || false}
              onChange={() => {}}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className="w-4 h-4 rounded border-white/10 accent-acid-purple cursor-pointer flex-shrink-0"
            />
          )}
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            task.priority === 'high' ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : 
            task.priority === 'medium' ? "bg-yellow-500 shadow-[0_0_10px_#f59e0b]" : 
            "bg-acid-green shadow-[0_0_10px_#00ffca]"
          )} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-bold uppercase font-display tracking-tight text-sm text-gray-100 truncate block max-w-[200px]", 
                task.status === 'done' && "opacity-40 text-slate-500"
              )}>
                {task.title}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isBlocked) return;
                  const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';
                  handleUpdateStatus(task.id, nextStatus);
                }}
                title={isBlocked ? "Zablokowane przez nieukończone zadania zależne" : "Szybka zmiana statusu"}
                disabled={isBlocked}
                className={cn(
                "text-[8px] font-mono px-1.5 py-0.5 rounded border font-black uppercase tracking-wider transition-all inline-flex items-center gap-1",
                isBlocked ? "bg-red-500/10 text-red-400 border-red-500/30 cursor-not-allowed opacity-60" :
                task.status === 'done' ? "bg-acid-green/10 text-acid-green border-acid-green/20 cursor-pointer hover:opacity-80" :
                task.status === 'in-progress' ? "bg-acid-cyan/10 text-acid-cyan border-acid-cyan/20 animate-pulse cursor-pointer hover:opacity-80" :
                "bg-acid-purple/10 text-acid-purple border-acid-purple/20 cursor-pointer hover:opacity-80"
              )}>
                {isBlocked && <Lock size={7} />}
                {task.status === 'done' ? 'TERMINATED' :
                 task.status === 'in-progress' ? 'SYSTEM_BUSY' : 'BACKLOG'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-1">
              {task.createdAt && (
                <span className="text-[8px] font-mono text-slate-500">
                  INIT: {new Date(task.createdAt).toLocaleString()}
                </span>
              )}
              {task.dueDate && task.status !== 'done' && (
                <>
                  <span className="text-[8px] text-slate-600 font-mono">•</span>
                  {(() => {
                    const label = getTaskDueLabel(task.dueDate);
                    if (!label) return null;
                    return (
                      <span className={cn(
                        "text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded border inline-flex items-center gap-1",
                        label.isOverdue 
                          ? "text-red-500 border-red-500/20 bg-red-500/5 animate-pulse" 
                          : label.isApproaching 
                            ? "text-yellow-500 border-yellow-500/20 bg-yellow-500/5 animate-pulse" 
                            : "text-slate-400 border-white/5 bg-white/5"
                      )}>
                        <Clock size={8} />
                        {label.text}
                      </span>
                    );
                  })()}
                </>
              )}
              <span className="text-[8px] text-slate-600 font-mono">•</span>
              <span className={cn(
                "text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded border inline-flex items-center gap-1",
                task.priority === 'high' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                task.priority === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}>
                PRIORYTET: {task.priority === 'high' ? 'WYSOKI' : task.priority === 'medium' ? 'ŚREDNI' : 'NISKI'}
              </span>
              <span className="text-[8px] text-slate-600 font-mono">•</span>
              <span className="text-[8px] font-mono text-acid-purple flex items-center gap-0.5">
                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />} 
                {isExpanded ? 'Zwiń' : 'Rozwiń parametry'}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 flex flex-col gap-1.5">
               <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono font-bold tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Activity size={10} className={cn(task.status === 'in-progress' ? "text-acid-cyan animate-pulse" : "text-slate-500")} />
                    POSTĘP OPERACYJNY
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded bg-black/40 border border-white/5",
                    task.status === 'done' ? "text-acid-green" : "text-acid-cyan"
                  )}>
                    {task.completionPercentage !== undefined ? task.completionPercentage : Math.round(((
                      (task.dependentOn?.filter(id => allTasks.find(t => t.id === id && t.status === 'done')).length || 0) + 
                      (task.status === 'done' ? 1 : 0) +
                      (task.subtasks?.filter(st => st.status === 'done').length || 0)
                   ) / (
                      (task.dependentOn?.length || 0) + 
                      1 + 
                      (task.subtasks?.length || 0)
                   ) || 1) * 100)}%
                  </span>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative shadow-inner">
                  <div 
                     className={cn("h-full rounded-full transition-all duration-1000 ease-out relative", 
                        (task.completionPercentage === 100 || (((task.dependentOn?.filter(id => allTasks.find(t => t.id === id && t.status === 'done')).length || 0) + (task.status === 'done' ? 1 : 0) + (task.subtasks?.filter(st => st.status === 'done').length || 0)) / ((task.dependentOn?.length || 0) + 1 + (task.subtasks?.length || 0) || 1) * 100) === 100) ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-acid-cyan shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                     )}
                     style={{ width: `${task.completionPercentage !== undefined ? task.completionPercentage : Math.round(((task.dependentOn?.filter(id => allTasks.find(t => t.id === id && t.status === 'done')).length || 0) + (task.status === 'done' ? 1 : 0) + (task.subtasks?.filter(st => st.status === 'done').length || 0)) / ((task.dependentOn?.length || 0) + 1 + (task.subtasks?.length || 0) || 1) * 100)}%` }} 
                  >
                    {task.status === 'in-progress' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 animate-shimmer" />
                    )}
                  </div>
               </div>
            </div>

            {/* Visual Blocked Dependencies Indicator */}
            {isBlocked && (
              <div className="mt-2.5 bg-red-950/20 border border-red-500/20 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-red-400">
                  <AlertTriangle size={11} className="text-red-500 animate-pulse" />
                  <span>Zablokowane — wymaga ukończenia:</span>
                </div>
                <div className="space-y-1">
                  {blockedBy.map(depId => {
                    const depTask = allTasks.find(t => t.id === depId);
                    return (
                      <div key={depId} className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 pl-1">
                        <Lock size={8} className="text-red-500/60" />
                        <span className="truncate">{depTask ? depTask.title : `Zadanie ID: ${depId}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          {isBlocked && (
            <span className="text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
              ZABLOKOWANE ({blockedBy.length})
            </span>
          )}
          {task.status !== 'done' && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchMassiveSwarm(task);
                }}
                disabled={activeSwarmId !== null || isBlocked}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all border border-acid-purple/30 bg-acid-purple/10 text-acid-purple hover:bg-acid-purple/20 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider",
                  (activeSwarmId !== null || isBlocked) && "opacity-40 cursor-not-allowed"
                )}
                title={isBlocked ? "Nie można uruchomić: zadania zależne nieukończone" : "Uruchom równoległy rój mini-agentów"}
              >
                <Layers size={10} className="animate-pulse" />
                Uruchom Rój ({swarmSize})
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAutoTeam(task);
                }}
                disabled={isPlanning !== null || isBlocked}
                className={cn(
                  "p-1.5 rounded-xl transition-all border border-white/5 bg-white/5 text-acid-cyan hover:bg-acid-cyan/10 hover:border-acid-cyan/30",
                  (isPlanning === task.id || isBlocked) && "opacity-40 cursor-not-allowed",
                  isPlanning === task.id ? "animate-pulse border-acid-cyan" : ""
                )}
                title={isBlocked ? "Zablokowane" : "Analiza AI & Dispatch (Klasyczny Zespół)"}
              >
                <Cpu size={14} className={isPlanning === task.id ? "animate-spin" : ""} />
              </button>
            </>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(true);
            }} 
            className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-xl transition-all" 
            title="Usuń zadanie"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl animate-fadeIn">
          <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl text-center max-w-sm">
            <h3 className="text-white font-bold text-lg mb-2">Trwałe usuwanie zadania</h3>
            <p className="text-slate-400 text-xs mb-6">Czy na pewno chcesz usunąć to zadanie? Tej akcji nie można cofnąć.</p>
            <div className="flex gap-3 justify-center">
              <button 
                 onClick={() => setShowConfirm(false)}
                 className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold"
              >
                Anuluj
              </button>
              <button 
                 onClick={() => {
                   setShowConfirm(false);
                   handleDelete(task.id);
                 }}
                 className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                Usuń trwale
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
            className="overflow-hidden space-y-4 pt-3 border-t border-white/5 mt-3 relative z-10"
          >
            {/* Metadata Badges Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {task.complexity && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Złożoność (CPLX)</span>
                  <div className="flex items-center gap-1.5">
                    <Activity size={10} className={cn(
                      task.complexity === 'high' ? "text-red-500" :
                      task.complexity === 'medium' ? "text-yellow-500" : "text-acid-green"
                    )} />
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-200">
                      CPLX: {task.complexity}
                    </span>
                  </div>
                </div>
              )}
              {task.taskType && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Typ zadania (TYPE)</span>
                  <div className="flex items-center gap-1.5">
                    <Layers size={10} className="text-acid-cyan" />
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-200">
                      TYPE: {task.taskType}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Priorytet (PRIO)</span>
                <div className="flex items-center gap-1.5">
                  <BarChart size={10} className="text-acid-purple" />
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-200">
                    PRIO: {task.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Switcher Row */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">
                {isBlocked ? "Edycja Statusu (Zablokowana przez zależności)" : "Edycja Statusu Systemowego"}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(task.id, 'todo');
                  }}
                  className={cn("text-[9px] border px-3 py-1.5 uppercase rounded-xl font-bold transition-all flex-1 cursor-pointer", task.status === 'todo' ? "bg-acid-purple/10 border-acid-purple/50 text-acid-purple shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "border-white/5 text-slate-500 hover:bg-white/5")}
                >
                  BACKLOG
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isBlocked) return;
                    handleUpdateStatus(task.id, 'in-progress');
                  }}
                  disabled={isBlocked}
                  className={cn(
                    "text-[9px] border px-3 py-1.5 uppercase rounded-xl font-bold transition-all flex-1 text-center justify-center items-center flex gap-1", 
                    isBlocked 
                      ? "border-red-500/10 text-red-500/50 bg-red-950/5 cursor-not-allowed" 
                      : task.status === 'in-progress' 
                        ? "bg-acid-cyan/10 border-acid-cyan/50 text-acid-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer" 
                        : "border-white/5 text-slate-500 hover:bg-white/5 cursor-pointer"
                  )}
                >
                  {isBlocked && <Lock size={9} />} SYSTEM_BUSY
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isBlocked) return;
                    handleUpdateStatus(task.id, 'done');
                  }}
                  disabled={isBlocked}
                  className={cn(
                    "text-[9px] border px-3 py-1.5 uppercase rounded-xl font-bold transition-all flex-1 ml-auto text-center justify-center items-center flex gap-1", 
                    isBlocked 
                      ? "border-red-500/10 text-red-500/50 bg-red-950/5 cursor-not-allowed" 
                      : task.status === 'done' 
                        ? "bg-acid-green/10 border-acid-green/50 text-acid-green shadow-[0_0_15px_rgba(0,255,202,0.2)] cursor-pointer" 
                        : "border-white/5 text-slate-500 hover:bg-white/5 cursor-pointer"
                  )}
                >
                  {isBlocked && <Lock size={9} />} TERMINATED
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div className="space-y-1.5">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Format Oczekiwany (w trakcie)</span>
                <select
                  className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 outline-none focus:border-acid-cyan/50 transition-all text-[9px] font-mono text-slate-300"
                  value={task.expectedOutputFormat || ''}
                  onChange={async (e) => {
                    e.stopPropagation();
                    await api.updateTask(task.id, { expectedOutputFormat: e.target.value });
                    if (onUpdate) onUpdate();
                  }}
                >
                  <option value="">Auto (wg woli roju)</option>
                  <option value="json">JSON Strukturalny</option>
                  <option value="markdown">Raport / Dokumentacja</option>
                  <option value="code">Kod źródłowy</option>
                  <option value="summary">Zwięzłe podsumowanie</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">Nastawienie Roju (w trakcie)</span>
                <select
                  className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 outline-none focus:border-acid-purple/50 transition-all text-[9px] font-mono text-slate-300"
                  value={task.swarmAttitude || ''}
                  onChange={async (e) => {
                    e.stopPropagation();
                    await api.updateTask(task.id, { swarmAttitude: e.target.value });
                    if (onUpdate) onUpdate();
                  }}
                >
                  <option value="">Zrównoważone</option>
                  <option value="analytical">Analityczne</option>
                  <option value="creative">Kreatywne</option>
                  <option value="fast">Wysoka Szybkość</option>
                  <option value="deep">Deep Thought</option>
                </select>
              </div>
            </div>

            {/* Telemetry & Logs Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block">TELEMETRIA & HISTORIA OPERACYJNA</span>
                {isLoadingLogs && <span className="text-[8px] font-mono text-acid-cyan animate-pulse">Pobieranie logów...</span>}
              </div>

              {logs.length === 0 && errorLogs.length === 0 ? (
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                  <p className="text-[9px] text-slate-500 italic font-mono">Brak wpisów telemetrycznych dla tego zadania w roju.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-1 animate-fadeIn">
                  {/* Error Logs inside task card */}
                  {errorLogs.map(errLog => (
                    <div key={errLog.id} className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-[9px] font-mono space-y-1">
                      <div className="flex justify-between items-center text-red-400 font-bold">
                        <span>AWARIA: {errLog.agentName}</span>
                        <span className="text-[8px] bg-red-500/20 px-1 py-0.5 rounded uppercase">{errLog.status}</span>
                      </div>
                      <div className="text-slate-300 break-words">{errLog.errorMessage}</div>
                      {errLog.createdAt && (
                        <div className="text-[7px] text-slate-500 text-right">
                          {new Date(errLog.createdAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Standard Logs */}
                  {logs.map(log => (
                    <div key={log.id} className="p-1.5 rounded bg-black/40 border border-white/5 text-[9px] font-mono flex gap-1.5 items-start">
                      <span className="text-slate-500 flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-acid-cyan font-bold mr-1">{log.agentName || 'SYSTEM'}:</span>
                        <span className="text-slate-300 break-words">{log.action}</span>
                        {log.details && <span className="text-slate-500 text-[8px] block mt-0.5">{log.details}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPreviewOpen && (
          <TaskPreviewModal 
            task={task}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGraphOpen && (
          <TaskDependenciesGraph
            tasks={allTasks}
            onClose={() => setIsGraphOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Agent Assign - Bottom Right Corner */}
      <div 
        ref={dropdownRef}
        className="absolute bottom-3 right-3 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAssignOpen(!isAssignOpen);
            }}
            className={cn(
              "flex items-center justify-center rounded-full border shadow-lg transition-all cursor-pointer",
              assignedAgent 
                ? "w-7 h-7" 
                : "w-7 h-7 border-dashed border-white/20 bg-white/5 text-slate-400 hover:text-acid-purple hover:border-acid-purple/50 hover:bg-neutral-900"
            )}
            style={assignedAgent ? {
              backgroundColor: `${assignedAgent.color}20`,
              borderColor: assignedAgent.color,
              color: assignedAgent.color,
              boxShadow: `0 0 10px ${assignedAgent.color}40`
            } : {}}
            title={assignedAgent ? `Przypisany agent: ${assignedAgent.name} (${assignedAgent.role})` : "Szybkie przypisanie agenta"}
          >
            {assignedAgent ? (
              <span className="text-[10px] font-black uppercase text-center tracking-tighter">
                {assignedAgent.name.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <UserPlus size={10} />
            )}
          </button>

          <AnimatePresence>
            {isAssignOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 bottom-9 w-48 bg-neutral-950/95 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-xl p-1 z-50 text-[10px] font-mono flex flex-col gap-0.5 backdrop-blur-md max-h-48 overflow-y-auto custom-scrollbar"
              >
                <div className="px-2 py-1 text-[8px] font-bold text-slate-500 border-b border-white/5 uppercase tracking-wider flex justify-between items-center">
                  <span>Menedżer Przypisania</span>
                  {assignedAgent && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await api.updateTask(task.id, { assignedAgentId: "" });
                          await api.createLog({
                            id: Math.random().toString(36).substr(2, 9),
                            action: 'AGENT_UNASSIGNED',
                            details: `Usunięto przypisanie agenta z zadania "${task.title}".`
                          });
                          if (onUpdate) onUpdate();
                          setIsAssignOpen(false);
                        } catch (err) {
                          console.error("Błąd usuwania przypisania:", err);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 font-black uppercase tracking-tight cursor-pointer"
                    >
                      Cofnij
                    </button>
                  )}
                </div>
                {allAgents.length === 0 ? (
                  <div className="p-2 text-center text-slate-600">
                    Brak dostępnych agentów
                  </div>
                ) : (
                  allAgents.map(ag => {
                    const isSelected = task.assignedAgentId === ag.id;
                    return (
                      <button
                        key={ag.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await api.updateTask(task.id, { assignedAgentId: ag.id });
                            await api.createLog({
                              id: Math.random().toString(36).substr(2, 9),
                              action: 'AGENT_ASSIGNED',
                              details: `Szybkie przypisanie agenta ${ag.name} (${ag.role}) do zadania "${task.title}".`
                            });
                            if (onUpdate) onUpdate();
                            setIsAssignOpen(false);
                          } catch (err) {
                            console.error("Błąd przypisania agenta:", err);
                          }
                        }}
                        className={cn(
                          "w-full text-left px-2 py-1 flex items-center justify-between transition-colors cursor-pointer rounded-lg",
                          isSelected 
                            ? "bg-white/10 text-white font-bold" 
                            : "hover:bg-white/5 text-slate-400 hover:text-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ag.color }}
                          />
                          <div className="truncate">
                            <span className="block font-bold">{ag.name}</span>
                            <span className="text-[7px] text-slate-500 truncate block">{ag.role}</span>
                          </div>
                        </div>
                        {isSelected && <Check size={8} className="text-acid-green flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
