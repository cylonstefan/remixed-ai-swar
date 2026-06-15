import React from 'react';
import { Lightbulb, Terminal, Network, Code } from 'lucide-react';

const cases = [
    { title: "Zarządzanie Rojem", desc: "Automatyzacja agentów MCP.", icon: <Network size={12} /> },
    { title: "Skan Sieci", desc: "Szybka diagnostyka i logi.", icon: <Terminal size={12} /> },
    { title: "AI Analytics", desc: "Pętle RLHF w czasie rzeczywistym.", icon: <Code size={12} /> }
];

export const UseCases = () => (
    <div className="flex flex-col h-full bg-black/40 space-y-2">
        <h3 className="text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-widest shrink-0 border-b border-white/5 pb-1">
            <Lightbulb size={12} className="text-amber-400" /> Macierz Celów Operacyjnych
        </h3>
        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {cases.map((c, i) => (
                <div key={i} className="p-1.5 bg-black/60 rounded border border-white/5 flex gap-2 items-start group hover:border-amber-500/20 transition-colors">
                    <div className="text-amber-500/60 mt-0.5 group-hover:text-amber-400 transition-colors">{c.icon}</div>
                    <div>
                        <h4 className="text-[9px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">{c.title}</h4>
                        <p className="text-[8px] text-slate-500">{c.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
