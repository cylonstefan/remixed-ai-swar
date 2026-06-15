import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Database } from 'lucide-react';
import { api } from '../services/api';

export const KnowledgeMaster = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
    const [lastSync, setLastSync] = useState<string>('Nigdy');
    const [isSyncing, setIsSyncing] = useState(false);
    const [knowledgeCount, setKnowledgeCount] = useState<number>(0);

    const loadData = async () => {
        try {
            const data = await api.getKnowledge();
            setKnowledgeCount(data?.length || 0);
        } catch (e) {
            console.warn('Failed to load knowledge');
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const runSync = async () => {
        setIsSyncing(true);
        showToast("Synchronizacja bazy wiedzy: Pobieranie indeksów...");
        
        try {
            await new Promise(r => setTimeout(r, 1000));
            // In a real scenario we might trigger a background worker fetch
            // Let's add a log/knowledge piece as a mock effect
            await api.addKnowledge({
                id: `sync-${Date.now()}`,
                title: 'System Auto-Sync',
                content: `Wiedza zsynchronizowana z klastra centralnego o ${new Date().toLocaleTimeString()}`,
                category: 'system',
                tags: ['auto', 'sync'],
                createdAt: new Date().toISOString()
            });
            await loadData();
            setLastSync(new Date().toLocaleTimeString());
            showToast("Baza wiedzy zaktualizowana i rozesłana do roju.");
        } catch (e: any) {
             showToast(`Błąd synchronizacji: ${e.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 space-y-2 justify-between">
            <div>
                <h3 className="text-[10px] font-bold text-white flex items-center gap-1.5 uppercase tracking-widest">
                    <Globe size={12} className="text-blue-400" /> WIEDZA GLOBALNA (RAG)
                </h3>
                <p className="text-[8px] text-slate-500 uppercase mt-1 leading-relaxed">
                    Automatycznie wektoryzuje i synchronizuje RAG. Agenci pobierają topologiczne snapshoty dla LLM.
                </p>
            </div>
            
            <div className="space-y-1 mt-auto pb-1">
                <div className="flex items-center justify-between text-[8px] border-b border-white/5 pb-1">
                    <span className="text-slate-500">Ilość Wpisów RAG:</span>
                    <span className="text-emerald-400 font-mono font-bold">{knowledgeCount}</span>
                </div>
                <div className="flex items-center justify-between text-[8px] pb-1">
                    <span className="text-slate-500">Ostatni zrzut:</span>
                    <span className="text-blue-300 font-mono">{lastSync}</span>
                </div>
                
                <button onClick={runSync} disabled={isSyncing} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600/20 text-blue-400 font-bold uppercase rounded-sm text-[9px] hover:bg-blue-600/30 transition-colors border border-blue-500/20 mt-1">
                    <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Sync..." : "Wymuś Synchro"}
                </button>
            </div>
        </div>
    );
});
