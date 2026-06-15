import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Task } from '../types';
import { X, Network, Calendar, ShieldAlert, CheckCircle2, PlayCircle, HelpCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface TaskDependenciesGraphProps {
  tasks: Task[];
  onClose: () => void;
  onUpdate?: () => void;
}

export function TaskDependenciesGraph({ tasks, onClose, onUpdate }: TaskDependenciesGraphProps) {
  // Active selected task for quick edit status modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusValue, setStatusValue] = useState<Task['status']>('todo');
  const [isSaving, setIsSaving] = useState(false);

  // Simple layouting algorithm for nodes
  const { nodes, edges } = useMemo(() => {
    const nds: Node[] = [];
    const eds: Edge[] = [];
    
    // Setup levels based on dependencies
    const taskLevels = new Map<string, number>();
    const calcLevel = (tId: string, visited: Set<string>): number => {
      if (visited.has(tId)) return Array.from(visited).length; // cyclic fallback
      visited.add(tId);
      const task = tasks.find(t => t.id === tId);
      if (!task || !task.dependentOn || task.dependentOn.length === 0) {
        taskLevels.set(tId, 0);
        return 0;
      }
      if (taskLevels.has(tId)) return taskLevels.get(tId)!;
      let maxDepLevel = -1;
      for (const d of task.dependentOn) {
        maxDepLevel = Math.max(maxDepLevel, calcLevel(d, new Set(visited)));
      }
      const lvl = maxDepLevel + 1;
      taskLevels.set(tId, lvl);
      return lvl;
    };

    tasks.forEach(t => calcLevel(t.id, new Set()));

    const levelCounts: Record<number, number> = {};
    
    tasks.forEach(task => {
      const level = taskLevels.get(task.id) || 0;
      const countIdx = levelCounts[level] || 0;
      levelCounts[level] = countIdx + 1;
      
      const statusColor = task.status === 'done' ? '#14b8a6' : task.status === 'in-progress' ? '#a855f7' : '#64748b';

      nds.push({
        id: task.id,
        position: { x: level * 250 + 50, y: countIdx * 120 + 50 },
        data: { label: task.title },
        style: {
          background: 'rgba(0,0,0,0.7)',
          border: `1px solid ${statusColor}`,
          borderRadius: '12px',
          color: '#f8fafc',
          padding: '12px',
          fontSize: '12px',
          width: 180,
          boxShadow: `0 0 10px ${statusColor}40`,
          cursor: 'pointer'
        }
      });

      if (task.dependentOn) {
        task.dependentOn.forEach(depId => {
          eds.push({
            id: `e-${depId}-${task.id}`,
            source: depId,
            target: task.id,
            animated: task.status === 'in-progress',
            style: { stroke: '#a855f7', strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#a855f7',
            },
          });
        });
      }
    });

    return { nodes: nds, edges: eds };
  }, [tasks]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    const task = tasks.find(t => t.id === node.id);
    if (task) {
      setSelectedTask(task);
      setStatusValue(task.status);
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      await api.updateTaskStatus(selectedTask.id, statusValue);
      
      // Log quick status edit operation
      try {
        await api.createLog({
          id: `log-quick-${Math.random().toString(36).substring(2, 9)}`,
          action: 'TASK_STATUS_QUICK_EDITION',
          details: `Zmieniono status zadania "${selectedTask.title}" na '${statusValue.toUpperCase()}' poprzez interaktywny klik na węźle dependencies graph.`
        });
      } catch (_) {}

      if (onUpdate) {
        onUpdate();
      }

      // Mutate local state immediately if parent doesn't propagate in time
      selectedTask.status = statusValue;
      setSelectedTask(null);
    } catch (err) {
      console.error(err);
      alert("Błąd podczas aktualizowania statusu zadania.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase text-white flex items-center gap-2 font-mono tracking-widest">
            <Network className="text-acid-purple" /> 
            Relacje i Zależności Zadań
          </h2>
          <p className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">
            <span className="text-acid-purple">PRO-TIP:</span> Kliknij dowolne zadanie (węzeł), aby błyskawicznie zmienić jego status.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 border border-white/10 rounded-3xl overflow-hidden bg-black relative">
        {tasks.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono">
            Brak zadań w roju do analizy zależności.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            fitView
            className="bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,rgba(0,0,0,0)_70%)]"
          >
            <Background color="#333" gap={20} size={1} />
            <Controls className="bg-neutral-900 border border-white/10 fill-white !text-white" />
          </ReactFlow>
        )}
      </div>

      {/* QUICK STATUS EDIT MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-acid-purple tracking-widest font-mono">Quick Task Allocator</span>
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                  {selectedTask.title}
                </h3>
              </div>

              {selectedTask.dueDate && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Calendar size={13} className="text-slate-500" />
                  <span>Deadline:</span>
                  <span className="text-white font-medium">{selectedTask.dueDate}</span>
                </div>
              )}

              {/* Status selection boxes */}
              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Wybierz Nowy Status:</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { value: 'todo' as const, label: 'Do zrobienia (Todo)', color: '#64748b', icon: <HelpCircle size={15} /> },
                    { value: 'in-progress' as const, label: 'W toku (In-Progress)', color: '#a855f7', icon: <PlayCircle size={15} /> },
                    { value: 'done' as const, label: 'Zrobione (Done)', color: '#14b8a6', icon: <CheckCircle2 size={15} /> }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setStatusValue(item.value)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all select-none ${
                        statusValue === item.value
                          ? 'bg-slate-950 border-slate-700 ring-2'
                          : 'bg-black/40 border-slate-800 hover:border-slate-700'
                      }`}
                      style={{
                        borderColor: statusValue === item.value ? item.color : undefined,
                        boxShadow: statusValue === item.value ? `0 0 12px ${item.color}20` : undefined,
                        outline: 'none'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ color: item.color }}>
                          {item.icon}
                        </div>
                        <span className={`text-xs font-semibold font-mono ${
                          statusValue === item.value ? 'text-white font-black' : 'text-slate-400'
                        }`}>
                          {item.label}
                        </span>
                      </div>
                      {statusValue === item.value && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-white/5 active:bg-white/10 text-slate-300 font-bold font-mono text-xs transition-all uppercase"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-450 active:bg-sky-600 disabled:opacity-50 text-black font-black font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-all uppercase"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    'Zatwierdź'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
