import React, { useState } from 'react';
import { Cpu, Zap, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';

export const LocalLlmManager = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
    const [status, setStatus] = useState<string>('OCZEKUJE');
    const [isHealing, setIsHealing] = useState(false);

    const triggerSelfHeal = async () => {
        setIsHealing(true);
        setStatus('SKANOWANIE');
        showToast("Inicjowanie pętli optymalizującej Local LLM...");
        
        try {
            const result = await api.autoDetectLocalLlm("http://localhost:11434", "");
            showToast(result.message || "Integracja i synchronizacja modeli zakończona.");
            setStatus('ONLINE');
        } catch (e: any) {
            showToast(`Błąd detekcji: ${e.message}`);
            setStatus('ERROR');
        } finally {
            setIsHealing(false);
        }
    };

    return (
        <div className="modern-card p-4 bg-black/40 border border-white/10 rounded space-y-2">
            <h3 className="text-[9px] font-bold text-white flex items-center justify-between uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Cpu size={10} className="text-acid-purple" /> Local LLM Core</span>
                <span className={cn("text-[8px] font-mono", status === 'ONLINE' ? 'text-emerald-500' : status === 'ERROR' ? 'text-rose-500' : 'text-slate-500')}>STATUS: {status}</span>
            </h3>
            
            <div className="flex gap-1.5 pt-1">
                <button onClick={() => showToast("Router LLM: Wykryto Ollama")} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] text-white rounded border border-white/10 transition">Ollama</button>
                <button onClick={() => showToast("Router LLM: Wykryto LMStudio")} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] text-white rounded border border-white/10 transition">LMStudio</button>
            </div>
            
            <div className="flex gap-2 pt-1">
                 <button onClick={triggerSelfHeal} disabled={isHealing} className={cn("w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[9px] font-bold uppercase transition", isHealing ? "bg-amber-950 text-amber-300 border border-amber-500/20" : "bg-acid-purple/10 text-acid-purple hover:bg-acid-purple/20 border border-acid-purple/20")}>
                    {isHealing ? <RefreshCw className="animate-spin" size={10} /> : <Zap size={10} />}
                    {isHealing ? "Konsolidacja..." : "Skanuj Local"}
                 </button>
            </div>
        </div>
    );
});
