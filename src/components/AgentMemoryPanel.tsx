import React, { useState, useEffect } from 'react';
import { Brain, Trash2, Plus, Sparkles, RefreshCw, Calendar, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Agent, Team, AgentMemory } from '../types';
import { cn } from '../lib/utils';

export const AgentMemoryPanel: React.FC<{ agent: Agent; showToast?: (msg: string) => void }> = ({ agent, showToast }) => {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New Memory Form
  const [newContent, setNewContent] = useState('');
  const [category, setCategory] = useState<'general' | 'decision' | 'conversation' | 'fact' | 'preference'>('general');

  useEffect(() => {
    loadMemories();
    loadTeams();
  }, [agent.id]);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAgentMemories(agent.id);
      setMemories(data || []);
    } catch (e) {
      console.error("Failed to load agent memories:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const allTeams = await api.getTeams();
      // Only keep teams that include this agent
      const agentTeams = allTeams.filter(t => t.agentIds?.includes(agent.id) || (t.agents && t.agents.some((a: any) => a.id === agent.id)));
      setTeams(agentTeams);
      if (agentTeams.length > 0) {
        setSelectedTeamId(agentTeams[0].id);
      }
    } catch (e) {
      console.error("Failed to load teams for memory panel:", e);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      const memoryId = Math.random().toString(36).substring(2, 11);
      await api.addAgentMemory(agent.id, {
        id: memoryId,
        content: newContent,
        category,
        teamId: null
      });
      setNewContent('');
      loadMemories();
      if (showToast) {
        showToast(`Dodano nowe wspomnienie do pamięci agenta ${agent.name}`);
      }
    } catch (e) {
      console.error("Failed to add memory:", e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.deleteAgentMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      if (showToast) {
        showToast("Wspomnienie usunięte z rejestru permanentnego.");
      }
    } catch (e) {
      console.error("Failed to delete memory:", e);
    }
  };

  const handleConsolidate = async () => {
    if (!selectedTeamId) {
      alert("Wybierz zespół, z którego chcesz skonkretować pamięć.");
      return;
    }
    setIsConsolidating(true);
    try {
      const teamName = teams.find(t => t.id === selectedTeamId)?.name || "Zespołu";
      const res = await api.consolidateMemories(agent.id, selectedTeamId);
      if (res.success) {
        loadMemories();
        if (showToast) {
          showToast(`Skonsolidowano pamięć! Wydobyto ${res.count} kluczowych wspomnień z rozmów zespołu ${teamName}.`);
        }
      } else {
        alert("Model nie zwrócił żadnych strukturyzowanych wspomnień do zapisu.");
      }
    } catch (e) {
      console.error("Error consolidating agent memories:", e);
      alert("Wystąpił błąd podczas konsolidacji pamięci przez model. Upewnij się, że w wybranym zespole są jakieś wiadomości.");
    } finally {
      setIsConsolidating(false);
    }
  };

  return (
    <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-white/5 pb-3 font-sans">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
          <Brain size={14} className="text-acid-cyan animate-pulse animate-duration-3000" />
          Permanentny System Pamięci i Świadomości
        </h3>
        <span className="text-[10px] font-mono font-bold bg-acid-cyan/10 text-acid-cyan border border-acid-cyan/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">
          SQLite Long-Term Store
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
        {/* Lewa strona - konsolidacja i dodawanie wspomnień */}
        <div className="lg:col-span-5 space-y-4">
          {/* Konsolidacja z zespołów */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-acid-cyan uppercase tracking-widest block flex items-center gap-1.5 align-middle">
              <Sparkles size={11} className="inline" /> Konsolidacja Świadomości
            </span>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Automatycznie przeanalizuj ostatnie rozmowy zespołu AI za pomocą modelu <b>Gemini Flash</b> w celu wyodrębnienia decyzji technicznych i faktów dla <b>{agent.name}</b>.
            </p>

            {teams.length === 0 ? (
              <div className="text-[10px] text-slate-500 font-medium italic bg-white/[0.01] border border-white/5 rounded-xl p-3 flex items-center gap-1.5">
                <AlertCircle size={12} />
                Agent nie należy jeszcze do żadnego zespołu, posiadającego wątki czatowe.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Wybierz Źródło (Team Chat)</label>
                  <select
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    className="bg-black border border-white/10 text-[10px] rounded-xl px-3 py-1.5 text-slate-300 font-bold focus:outline-none focus:border-acid-cyan cursor-pointer w-full"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.agents?.length || 0} agentów)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleConsolidate}
                  disabled={isConsolidating}
                  className="w-full py-2 bg-acid-cyan/10 hover:bg-acid-cyan/20 border border-acid-cyan/30 hover:border-acid-cyan text-acid-cyan rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isConsolidating ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Konsolidacja świadomości...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Wyciągnij refleksje z konwersacji
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Ręczne programowanie wspomnień */}
          <form onSubmit={handleAddMemory} className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-acid-purple uppercase tracking-widest block flex items-center gap-1.5 align-middle">
              <Plus size={12} className="inline" /> Ręczny zapis w pamięci
            </span>
            <p className="text-[10px] text-slate-400 font-medium">
              Wprowadź nową informację permanentną, którą agent zainicjuje w swoim wątku systemowym.
            </p>

            <div className="space-y-2">
              <textarea
                placeholder="np. 'Użytkownik prosił, aby kod generowany był zawsze zgodnie ze standardem ES modules i zawierał obszerne komentarze.'"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={2}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-acid-purple placeholder-slate-600 resize-none font-medium leading-relaxed"
              />

              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Kategoria</span>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="bg-black border border-white/10 text-[9px] rounded-lg px-2 py-1 text-slate-300 font-bold focus:outline-none focus:border-acid-purple cursor-pointer"
                  >
                    <option value="general">Ogólne (general)</option>
                    <option value="decision">Ważna decyzja (decision)</option>
                    <option value="preference">Preferencja (preference)</option>
                    <option value="fact">Fakt techniczny (fact)</option>
                    <option value="conversation">Ustalenie (conversation)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={!newContent.trim()}
                    className="px-4 py-1.5 bg-acid-purple border border-acid-purple text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:bg-neutral-900 hover:border-white/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check size={10} />
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Prawa strona - Interaktywny rejestr memories */}
        <div className="lg:col-span-7 flex flex-col h-[280px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            Permanentny log wspomnień ({memories.length})
          </span>

          <div className="flex-1 overflow-y-auto border border-white/5 bg-black/20 rounded-2xl p-3 space-y-2">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-500 gap-1.5 font-bold uppercase">
                <RefreshCw size={12} className="animate-spin" />
                Odczyt z bazy danych...
              </div>
            ) : memories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Brain size={24} className="text-slate-700 mb-2 animate-bounce animate-duration-4000" />
                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Czysta karta pamięci</p>
                <p className="text-[9px] text-slate-600 mt-1 max-w-[200px]">
                  Brak zapisanych wspomnień długoterminowych. Dodaj wspomnienie ręcznie lub skonsoliduj wątek!
                </p>
              </div>
            ) : (
              memories.map((m) => (
                <div
                  key={m.id}
                  className="group bg-white/[0.02] border border-white/5 hover:border-white/10 p-3 rounded-xl transition-all flex justify-between items-start gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[7px] font-black uppercase rounded border",
                          m.category === 'decision' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          m.category === 'preference' && "bg-acid-cyan/10 text-acid-cyan border-acid-cyan/20",
                          m.category === 'fact' && "bg-acid-green/10 text-acid-green border-acid-green/20",
                          m.category === 'conversation' && "bg-acid-purple/10 text-acid-purple border-acid-purple/20",
                          m.category === 'general' && "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}
                      >
                        {m.category || 'general'}
                      </span>
                      {m.teamId && (
                        <span className="text-[8px] font-mono text-slate-600">
                          Powiązane z klastrem / wątkiem
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium leading-relaxed break-words text-left">
                      {m.content}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 bg-white/5 hover:bg-red-500/10 rounded border border-white/5 hover:border-red-500/20 text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                    title="Skasuj wspomnienie permanentnie"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
