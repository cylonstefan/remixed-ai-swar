import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { api } from '../services/api';
import { AgentErrorLog } from '../types';

export const AgentExperienceMemory = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
    const [experiences, setExperiences] = useState<AgentErrorLog[]>([]);

    useEffect(() => {
        let active = true;
        const fetchErrs = async () => {
            try {
                const errs = await api.getAgentErrors();
                if (active) setExperiences(errs.slice(-4));
            } catch (e) {
                // ignore
            }
        };
        fetchErrs();
        const int = setInterval(fetchErrs, 10000);
        return () => { active = false; clearInterval(int); };
    }, []);

    return (
        <div className="flex flex-col h-full bg-black/40 space-y-2">
            <h3 className="text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-widest shrink-0 border-b border-white/5 pb-1">
                <Database size={12} className="text-emerald-400" /> Wektory Błędów (RLHF)
            </h3>
            <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {experiences.map(ex => (
                    <div key={ex.id} className="p-1.5 bg-black/60 rounded border border-white/5 relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${ex.status === 'TUNED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className="flex justify-between items-start text-[8px] pl-1">
                            <span className="font-bold text-slate-300 truncate">{ex.taskTitle || ex.agentId}</span>
                            <span className={ex.status === 'TUNED' ? "text-emerald-400" : "text-rose-400"}>{ex.status}</span>
                        </div>
                        <p className="text-[7.5px] text-slate-500 mt-1 pl-1 truncate" title={ex.errorMessage}>{ex.errorMessage}</p>
                    </div>
                ))}
                {experiences.length === 0 && (
                    <div className="text-[8px] text-slate-500 p-2 text-center">Brak zapisanych logów błędów.</div>
                )}
            </div>
        </div>
    );
});
