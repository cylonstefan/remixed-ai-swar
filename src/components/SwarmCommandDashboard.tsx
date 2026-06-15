import React, { useState } from 'react';
import { Bot, GitBranch, Settings, Mic, Zap, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { decomposeTask, SubTask } from '../lib/SwarmOrchestrator';

export const SwarmCommandDashboard = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
    const [taskInput, setTaskInput] = useState('');
    const [subTasks, setSubTasks] = useState<SubTask[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);

    const handleOrchestration = async () => {
        if (!taskInput) return;
        setIsExecuting(true);
        showToast("Rozpoczęto analizę dekompozycyjną...");
        try {
            const complexity = taskInput.length > 50 ? 'high' : 'medium';
            const tasks = decomposeTask({ id: `main-${Date.now()}`, description: taskInput, complexity });
            
            // Rejestracja w bazie danych uzywajac api.createTask
            for (const t of tasks) {
                 await api.createTask({
                     id: t.id,
                     title: t.description.substring(0, 30),
                     hints: t.description,
                     assignedAgentId: t.assignedLLM || 'system',
                     status: 'todo',
                     priority: t.complexity === 'high' ? 'high' : 'medium',
                     createdAt: new Date().toISOString()
                 });
            }
            
            setSubTasks(tasks);
            setTaskInput('');
            showToast("Zadanie zdekomponowane i przydzielone węzłom roju.");
        } catch (e: any) {
            showToast(`Błąd orkiestracji: ${e.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="p-2 space-y-2">
            <h3 className="text-[10px] font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5 uppercase tracking-widest text-violet-400"><Bot size={12} /> Swarm_Command</span>
            </h3>
            
            <textarea 
                value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Definicja wektora działania..."
                className="w-full bg-black/60 border border-white/10 rounded-sm p-1.5 text-[9px] text-white font-mono focus:border-violet-500/50 outline-none resize-none h-12"
            />
            
            <div className="flex gap-1 mt-1">
                <button onClick={handleOrchestration} disabled={isExecuting} className="flex-1 px-2 py-1.5 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/40 transition-colors rounded-sm text-violet-300 font-bold text-[9px] uppercase tracking-widest">
                    {isExecuting ? "Dekompozycja..." : "Sys_Orkiestruj()"}
                </button>
            </div>

            <div className="space-y-1 mt-2 max-h-[80px] overflow-y-auto custom-scrollbar">
                {subTasks.map(st => (
                    <div key={st.id} className="p-1.5 bg-white/5 rounded-sm border border-white/5 flex items-center justify-between">
                        <div className="text-[8px] text-slate-300 truncate w-32">{st.description}</div>
                        <div className="flex items-center gap-1 text-[8px] text-acid-green font-mono">
                            <Cpu size={10} /> {st.assignedLLM}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
