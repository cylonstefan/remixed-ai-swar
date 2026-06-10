import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Schedule {
  id: string;
  name: string;
  targetId: string;
  targetType: 'agent' | 'team';
  taskTemplate: string;
  cronExpression: string; // Simplistic representation for this UI
  lastRunAt?: string;
  nextRunAt?: string;
  isActive: number;
}

export function SchedulerManager({ showToast }: { showToast: (msg: string) => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // New Form State
  const [newName, setNewName] = useState('');
  const [newTargetType, setNewTargetType] = useState<'agent' | 'team'>('team');
  const [newTargetId, setNewTargetId] = useState('');
  const [newCron, setNewCron] = useState('0 9 * * *');
  const [newTemplate, setNewTemplate] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sList, aList, tList] = await Promise.all([
        api.getSchedules(),
        api.getAgents(),
        api.getTeams()
      ]);
      setSchedules(sList);
      setAgents(aList);
      setTeams(tList);
      if (tList.length > 0) setNewTargetId(tList[0].id);
    } catch (e) {
      showToast("Błąd ładowania harmonogramów");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newName || !newTargetId || !newTemplate) {
      showToast("Wypelnij wszystkie pola");
      return;
    }
    try {
      await api.createSchedule({
        name: newName,
        targetId: newTargetId,
        targetType: newTargetType,
        taskTemplate: newTemplate,
        cronExpression: newCron
      });
      showToast("Harmonogram utworzony!");
      setIsAdding(false);
      loadData();
    } catch (e) {
      showToast("Błąd tworzenia");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleSchedule(id);
      loadData();
    } catch (e) {
      showToast("Błąd zmiany statusu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSchedule(id);
      loadData();
    } catch (e) {
      showToast("Błąd usuwania");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-white font-sans overflow-hidden border border-white/5 rounded-[3rem]">
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-neutral-900/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <Lucide.Clock size={24} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h2 className="text-white font-black text-xl uppercase tracking-tighter italic lg:text-2xl">Planista Cykliczny Chronos ⏳</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Zautomatyzowane misje i zadania klastra</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-3 bg-white text-black font-black uppercase text-[10px] rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
        >
          <Lucide.Plus size={16} /> Zaplanuj Nową Misję
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Lucide.Loader2 size={32} className="animate-spin text-slate-700" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
            <Lucide.CalendarClock size={64} />
            <p className="mt-4 font-black uppercase text-xs tracking-widest">Brak zaplanowanych zadań cyklicznych</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {schedules.map(sch => (
              <div key={sch.id} className="relative group">
                <div className={cn(
                  "p-6 rounded-[2.5rem] border bg-neutral-900/40 transition-all flex flex-col gap-4 text-left",
                  sch.isActive ? "border-white/10" : "border-white/5 opacity-50 grayscale"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        sch.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-700"
                      )} />
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        {sch.targetType} automation
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                         onClick={() => handleToggle(sch.id)}
                         className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
                      >
                         {sch.isActive ? <Lucide.Pause size={14} /> : <Lucide.Play size={14} />}
                      </button>
                      <button 
                         onClick={() => handleDelete(sch.id)}
                         className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 rounded-lg transition-all"
                      >
                         <Lucide.Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white uppercase italic leading-tight">{sch.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                         <Lucide.Terminal size={12} className="text-amber-500" />
                         <span className="text-[9px] font-black uppercase text-slate-600">Zadanie:</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans leading-relaxed">{sch.taskTemplate}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black uppercase text-slate-600 block mb-0.5">Wzór Czasu:</span>
                        <span className="text-[10px] font-mono text-amber-500">{sch.cronExpression}</span>
                      </div>
                      <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black uppercase text-slate-600 block mb-0.5">Ostatni Bieg:</span>
                        <span className="text-[9px] font-mono text-slate-400">{sch.lastRunAt ? new Date(sch.lastRunAt).toLocaleTimeString() : 'NIGDY'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                        <Lucide.Target size={12} />
                     </div>
                     <span className="text-[9px] font-bold text-slate-500">Cel: {sch.targetId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for adding */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-xl"
               onClick={() => setIsAdding(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[3rem] p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <Lucide.CalendarDays size={120} />
              </div>
              
              <div className="relative z-10 space-y-6 text-left">
                <div>
                   <h2 className="text-2xl font-black text-white uppercase italic leading-none">Zaplanuj Automatyzację</h2>
                   <p className="text-slate-500 text-[10px] uppercase font-bold mt-2 tracking-widest">Konfiguracja triggera czasowego klastra</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black font-mono uppercase text-slate-600 block ml-2">Nazwa Harmonogramu</label>
                    <input 
                      type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      placeholder="Np. Poranny Raport Sprzedaży"
                      className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-amber-500 transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black font-mono uppercase text-slate-600 block ml-2">Typ Obiektu</label>
                      <select 
                         value={newTargetType} 
                         onChange={e => setNewTargetType(e.target.value as any)}
                         className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-amber-500 transition-all outline-none text-sm appearance-none"
                      >
                         <option value="team">Rój (Zespół)</option>
                         <option value="agent">Pojedynczy Agent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black font-mono uppercase text-slate-600 block ml-2">Wybierz Cel</label>
                      <select 
                         value={newTargetId} 
                         onChange={e => setNewTargetId(e.target.value)}
                         className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-amber-500 transition-all outline-none text-sm appearance-none"
                      >
                         {newTargetType === 'team' ? (
                           teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                         ) : (
                           agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                         )}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black font-mono uppercase text-slate-600 block ml-2">Cron (Czas/Dzień)</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => setNewCron('0 9 * * *')} className={cn("py-2 rounded-xl text-[9px] font-black uppercase transition-all", newCron === '0 9 * * *' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-slate-500")}>Codziennie 9:00</button>
                       <button onClick={() => setNewCron('0 9 * * 1')} className={cn("py-2 rounded-xl text-[9px] font-black uppercase transition-all", newCron === '0 9 * * 1' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-slate-500")}>Poniedziałek 9:00</button>
                       <button onClick={() => setNewCron('*/15 * * * *')} className={cn("py-2 rounded-xl text-[9px] font-black uppercase transition-all", newCron === '*/15 * * * *' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-slate-500")}>Co 15 Minut</button>
                       <button onClick={() => setNewCron('0 0 * * 0')} className={cn("py-2 rounded-xl text-[9px] font-black uppercase transition-all", newCron === '0 0 * * 0' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-slate-500")}>Niedziela Północ</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black font-mono uppercase text-slate-600 block ml-2">Szablon Zadania (Prompt)</label>
                    <textarea 
                      value={newTemplate} onChange={e => setNewTemplate(e.target.value)}
                      placeholder="Np: Dokonaj analizy wczorajszej aktywności i wyślij podsumowanie..."
                      className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-amber-500 transition-all outline-none text-sm min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     onClick={() => setIsAdding(false)}
                     className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase text-[10px] rounded-2xl transition-all"
                   >
                     Anuluj
                   </button>
                   <button 
                     onClick={handleCreate}
                     className="flex-2 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-amber-500/10 transition-all active:scale-95"
                   >
                     Zatwierdź Harmonogram 🚀
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
