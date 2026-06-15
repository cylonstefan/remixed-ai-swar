import React, { useState } from 'react';
import { Target, BrainCircuit } from 'lucide-react';
import { api } from '../services/api';

export const AgentTrainingFarm = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [stats, setStats] = useState<{ processed: number, corrected: number } | null>(null);

    const runOptimization = async () => {
        setIsOptimizing(true);
        showToast("Optymalizacja modelu: Self-Correction Loop zainicjowana...");
        try {
            const res = await api.runSelfCorrection();
            if (res.success) {
                setStats({ processed: res.processed, corrected: res.corrected });
                showToast(`Zoptymalizowano. Skonwertowano ${res.corrected} / ${res.processed} błędów.`);
            }
        } catch (e: any) {
            showToast(`Błąd treningu: ${e.message}`);
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="modern-card p-3 bg-black/40 border border-white/10 rounded h-full flex flex-col justify-between">
            <div>
                <h3 className="text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-widest">
                    <BrainCircuit size={12} className="text-acid-green" /> Farma Szkoleniowa RLHF
                </h3>
                <p className="text-[8px] text-slate-500 uppercase mt-1 leading-relaxed">
                    Uruchom pętle samouczenia. System analizuje ostatnie błędy agentów (AgentErrorLog) i koryguje ich System Prompt.
                </p>
            </div>
            
            <div className="space-y-2 mt-2">
                {stats && (
                    <div className="text-[8px] flex justify-between text-emerald-400 font-mono border-t border-white/5 pt-1">
                        <span>PRZEPROCESOWANE: {stats.processed}</span>
                        <span>ZAAKCEPTOWANE: {stats.corrected}</span>
                    </div>
                )}
                <button onClick={runOptimization} disabled={isOptimizing} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 font-bold uppercase rounded-sm text-[9px] hover:bg-emerald-600/30 transition-colors border border-emerald-500/20">
                    <Target size={10} /> {isOptimizing ? "Adaptacja Sieci..." : "Trenuj Błędy (Self-Heal)"}
                </button>
            </div>
        </div>
    );
});
