import React, { useState, useEffect } from 'react';
import { MessageSquareText } from 'lucide-react';
import { api } from '../services/api';

export const AgentCommunications = React.memo(() => {
    const [messages, setMessages] = useState<{from: string, msg: string}[]>([
        { from: 'Orchestrator', msg: 'System Oczekuje...' }
    ]);

    useEffect(() => {
        let active = true;
        const fetchLogs = async () => {
            try {
                const logs = await api.getLogs();
                if (active && logs.length > 0) {
                    // Map generic logs to "P2P" comms styling
                    setMessages(logs.slice(-5).map((l: any) => ({
                         from: l.agentName || 'Sys-Core',
                         msg: `[${l.action}] ${l.details || ''}`
                    })));
                }
            } catch (e) {
                // silience error on loop
            }
        };
        fetchLogs();
        const int = setInterval(fetchLogs, 4000);
        return () => { active = false; clearInterval(int); };
    }, []);

    return (
        <div className="flex flex-col h-full bg-black/40 space-y-1">
            <h3 className="text-[10px] font-bold text-white flex items-center justify-between uppercase tracking-widest shrink-0 border-b border-white/5 pb-1">
                <span className="flex items-center gap-1.5"><MessageSquareText size={12} className="text-violet-400" /> Sieć Neuronowa P2P</span>
            </h3>
            <div className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className="text-[8px] p-1.5 bg-black/40 border border-white/5 rounded-sm">
                        <span className="font-bold text-violet-300">@{m.from}:</span> <span className="text-slate-300 ml-1">{m.msg}</span>
                    </div>
                ))}
                {messages.length === 0 && (
                     <div className="text-[8px] text-slate-500 p-2 text-center">Nasłuchiwanie magistrali...</div>
                )}
            </div>
        </div>
    );
});
