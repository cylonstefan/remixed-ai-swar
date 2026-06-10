import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Task } from '../types';
import { X, Network } from 'lucide-react';

interface TaskDependenciesGraphProps {
  tasks: Task[];
  onClose: () => void;
}

export function TaskDependenciesGraph({ tasks, onClose }: TaskDependenciesGraphProps) {
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
          boxShadow: `0 0 10px ${statusColor}40`
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

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-xl font-black uppercase text-white flex items-center gap-2 font-mono tracking-widest">
          <Network className="text-acid-purple" /> 
          Relacje i Zależności Zadań
        </h2>
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
            fitView
            className="bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,rgba(0,0,0,0)_70%)]"
          >
            <Background color="#333" gap={20} size={1} />
            <Controls className="bg-neutral-900 border border-white/10 fill-white !text-white" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
