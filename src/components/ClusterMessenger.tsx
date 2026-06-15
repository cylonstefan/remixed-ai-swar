import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareText, Send, TerminalSquare } from 'lucide-react';
import { api } from '../services/api';

export const ClusterMessenger = React.memo(() => {
    const [messages, setMessages] = useState<{user: string, msg: string, type?: 'err' | 'ok' | 'info'}[]>([
        { user: 'System', msg: 'System inicjalizacji klastra gotowy. Oczekuję na wejście.', type: 'info' }
    ]);
    const [input, setInput] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isExecuting) return;
        const userMsg = input;
        setMessages(prev => [...prev, { user: 'Admin', msg: userMsg, type: 'info' }]);
        setInput('');
        setIsExecuting(true);

        try {
            const res = await api.executePowerShell(userMsg);
            if (res.success) {
                  setMessages(prev => [...prev, { user: 'Node-Router', msg: res.output || res.message, type: 'ok' }]);
            } else {
                  setMessages(prev => [...prev, { user: 'Node-Error', msg: res.error || res.message || 'Nieznany błąd wywołania', type: 'err' }]);
            }
        } catch (e: any) {
             setMessages(prev => [...prev, { user: 'Sys-Warn', msg: `Błąd połączenia: ${e.message}`, type: 'err' }]);
        } finally {
             setIsExecuting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 space-y-2 justify-between">
            <h3 className="text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-widest shrink-0">
                <TerminalSquare size={12} className="text-pink-400" /> CLI Klastra & PowerShell
            </h3>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 bg-black p-2 rounded-sm border border-white/5 font-mono">
                {messages.map((m, i) => (
                    <div key={i} className="text-[8px] leading-tight break-all">
                        <span className={m.user === 'Admin' ? "font-bold text-cyan-400" : m.type === 'err' ? "font-bold text-rose-500" : "font-bold text-pink-400"}>
                            [{m.user}]
                        </span>{" "}
                        <span className={m.user === 'Admin' ? "text-slate-300" : m.type === 'err' ? "text-rose-400/80" : "text-emerald-400/80"}>
                            {m.msg}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex gap-1 shrink-0 pt-1">
                <input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isExecuting}
                    className="flex-1 bg-black/60 border border-white/10 rounded-sm px-2 py-1 text-[9px] text-white font-mono focus:border-pink-500/50 outline-none"
                    placeholder="> wpisz komendę z hosta..."
                />
                <button onClick={handleSend} disabled={isExecuting} className="px-2 bg-pink-600/20 border border-pink-500/30 rounded-sm text-pink-300 hover:bg-pink-600/40 transition-colors">
                    <Send size={10}/>
                </button>
            </div>
        </div>
    );
});
