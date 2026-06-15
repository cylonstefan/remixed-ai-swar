import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Bot, Settings, Save, Loader2 } from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'] as const;

export const VoiceOrchestrationPanel: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState<string | null>(null);

  useEffect(() => {
    api.getAgents().then(setAgents).finally(() => setLoading(false));
  }, []);

  const handleVoiceUpdate = async (agentId: string, voice: string) => {
    // This is a proxy for updating the agent in the real system.
    // Assuming the API supports updating agents.
    try {
      await api.updateAgent(agentId, { voice: voice as any });
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, voice: voice as any } : a));
      showToast(`Zaktualizowano głos dla ${agents.find(a => a.id === agentId)?.name}`);
    } catch (e) {
      showToast("Błąd aktualizacji głosu");
    }
  };

  const previewVoice = (name: string, voice: string) => {
    setPreviewing(name);
    const text = `System operacyjny i infrastruktura sieciowa są zoptymalizowane. Głos ${voice} przetestowany poprawnie.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    // Mapping our voices to some available synthesis voices is complex.
    // For now just speak the text.
    window.speechSynthesis.speak(utterance);
    utterance.onend = () => setPreviewing(null);
  };

  if (loading) return <div className="p-4 text-slate-400">Ładowanie jednostek...</div>;

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-slate-300 font-mono">
      <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
        <Settings size={16} className="text-violet-400" /> Voice Orchestration
      </h3>
      <div className="space-y-4">
        {agents.map(agent => (
          <div key={agent.id} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Bot size={14} style={{ color: agent.color }} /> {agent.name}
              </span>
              <button 
                onClick={() => previewVoice(agent.name, agent.voice || 'Puck')}
                className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 flex items-center gap-1"
              >
                  {previewing === agent.name ? <Loader2 size={10} className="animate-spin"/> : <Volume2 size={10}/>} Preview
              </button>
            </div>
            <select
                value={agent.voice || 'Puck'}
                onChange={(e) => handleVoiceUpdate(agent.id, e.target.value)}
                className="bg-black/50 border border-white/10 rounded p-1 text-xs"
            >
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
