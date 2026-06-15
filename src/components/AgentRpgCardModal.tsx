import React, { useEffect, useState } from 'react';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Agent interface matching App.tsx
interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt?: string;
  model: string;
  color: string;
  category?: string;
  skills?: string;
  knowledge?: string;
  personality?: string;
  objectives?: string;
  commands?: string;
  permissions?: string;
  systemPermissions?: string;
  filePermissions?: string;
  integrations?: string;
  executableCommands?: string;
  icon?: string;
  voice?: string;
  messageCount?: number;
}

interface AgentRpgCardModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentRpgCardModal({ agent, isOpen, onClose }: AgentRpgCardModalProps) {
  const [level, setLevel] = useState(1);
  const [activeStatTab, setActiveStatTab] = useState<'profile' | 'attributes' | 'spells'>('attributes');

  // Let's seed unique procedural RPG stats based on agent property hashes so they feel custom
  const getAgentSeedValue = (str: string, max: number = 100, min: number = 40) => {
    let hash = 0;
    const testStr = str || "CylonAgent";
    for (let i = 0; i < testStr.length; i++) {
      hash = testStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = Math.abs(hash) % (max - min);
    return min + val;
  };

  const hp = getAgentSeedValue(agent.name + "hp", 200, 80);
  const maxHp = hp;
  const mp = getAgentSeedValue(agent.role + "mp", 999, 100);
  const maxMp = mp;

  // RPG stats
  const str = getAgentSeedValue(agent.name + "atk", 100, 50); // ATTACK POWER (Reasoning severity)
  const def = getAgentSeedValue(agent.role + "def", 100, 45); // SECURITY/GUARDRAILS (Jailbreak resistance)
  const agi = getAgentSeedValue(agent.model + "agi", 100, 60); // LATENCY / TOKENS SPEED
  const int = getAgentSeedValue(agent.personality + "int", 150, 75); // INTELLECT factor ("Major Intelligence Multiplier")
  const luck = getAgentSeedValue(agent.id + "luck", 100, 40); // Auto-debugging chance

  // Calculate overall CP (Combat Power) / Swarm Rating
  const combatPower = Math.round((str + def + agi + int + luck) * 1.5 + level * 25);

  const skillsList = agent.skills
    ? agent.skills.split(',').map(s => s.trim()).filter(Boolean)
    : ['Natywne Gniazdo LLM', 'Śpiewanie Logów', 'Pasterz Kontenerów Docker'];

  const categoryAbilities: Record<string, string[]> = {
    'Programista': ['COMPILER_STRIKE_V2', 'RECURSIVE_OPTIMIZE', 'DOCKER_CONTAINER_DEPLOY_AOE'],
    'Administrator': ['FIREWALL_SHIELD', 'SERVER_OVERCLOCK', 'SUDO_FORCE_EXECUTE'],
    'Analityk': ['DEEP_TRACE_LOGS', 'PREDICTIVE_DATA_BOOST', 'VECTOR_GROUNDING'],
    'Copywriter': ['CREATIVE_NEURAL_STORM', 'PROMPT_FORGE_IMPROVE', 'HUMOR_CHILLOUT_STRIKE'],
    'Inny': ['AUTONOMOUS_REFLEX', 'CYLON_GUARD_PASSIVE', 'MICHAŁ_MAJOR_BLESSIVE']
  };

  const abilities = categoryAbilities[agent.category || 'Inny'] || categoryAbilities['Inny'];

  useEffect(() => {
    if (isOpen) {
      // Calculate level based on messageCount or seed
      const calculatedLevel = Math.min(20, 1 + Math.floor((agent.messageCount || 0) / 5));
      setLevel(calculatedLevel);
    }
  }, [isOpen, agent.messageCount]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md"
        />

        {/* RPG Card Container */}
        <motion.div
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col max-h-[90vh] z-10 font-sans"
        >
          {/* Neon Grid Header Background */}
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Top Frame Decorators */}
          <div className="absolute top-4 right-4 flex gap-1.5 items-center z-20">
            <span className="text-[7.5px] font-bold font-mono text-acid-purple uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              KARTA JEDNOSTKI RPG
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <Lucide.X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Header / Avatar block */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              {/* Animated Avatar Box */}
              <div className="relative shrink-0">
                <div 
                  className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden border-2"
                  style={{ borderColor: agent.color || '#a855f7', boxShadow: `0 0 25px ${(agent.color || '#a855f7')}40` }}
                >
                  {/* Backdrop pulsing glow */}
                  <div className="absolute inset-0 bg-black/40 z-0" />
                  <div 
                    className="absolute -inset-1 z-0 opacity-40 blur-lg animate-pulse" 
                    style={{ background: `radial-gradient(circle, ${agent.color || '#a855f7'} 0%, transparent 70%)` }}
                  />

                  {/* Character Illustration / Icon */}
                  <div className="relative z-10 scale-125" style={{ color: agent.color || 'white' }}>
                    {(() => {
                      const Icon = agent.icon && (Lucide as any)[agent.icon] ? (Lucide as any)[agent.icon] : Lucide.Bot;
                      return <Icon size={44} strokeWidth={1.5} />;
                    })()}
                  </div>

                  {/* Hologram scanline effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(255,255,255,0.15)_95%)] bg-[size:100%_8px] opacity-20 animate-[scan_6s_linear_infinite]" />
                </div>

                {/* Level Badge */}
                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-neutral-950 border border-white/10 rounded-full flex items-center gap-1 shadow-lg">
                  <span className="text-[8px] font-black text-slate-500 uppercase">LVL</span>
                  <span className="text-xs font-black text-white">{level}</span>
                </div>
              </div>

              {/* Identity details */}
              <div className="text-center sm:text-left space-y-1.5 flex-1 w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase italic">{agent.name}</h3>
                </div>
                <p className="text-xs font-bold text-acid-purple uppercase tracking-wider">{agent.role}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[9px] text-slate-400 font-mono">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-white font-bold">{agent.model}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">CP: <b className="text-amber-400 font-black">{combatPower}</b></span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">Szybkość: <b className="text-acid-cyan">{agi} T/S</b></span>
                </div>

                {/* HP & MP RPG Progress bars */}
                <div className="pt-2.5 space-y-2 max-w-xs mx-auto sm:mx-0">
                  {/* HP Bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono font-bold leading-none uppercase">
                      <span className="text-emerald-400 flex items-center gap-1"><Lucide.Heart fontStyle="fill" size={8} /> HP (REASONING INTENSITY)</span>
                      <span className="text-slate-400">{hp} / {maxHp}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-950 border border-white/5 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-emerald-500 rounded-full" 
                      />
                    </div>
                  </div>

                  {/* MP Bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono font-bold leading-none uppercase">
                      <span className="text-acid-cyan flex items-center gap-1"><Lucide.Zap size={8} /> MP (CONTEXT RE-FILL)</span>
                      <span className="text-slate-400">{mp} / {maxMp} MB</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-950 border border-white/5 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '82%' }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                        className="h-full bg-cyan-400 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RPG Card Tabs Navigation */}
            <div className="flex border-b border-white/5 pb-2">
              <button
                onClick={() => setActiveStatTab('attributes')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                  activeStatTab === 'attributes' ? "border-acid-purple text-white bg-purple-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                ⚔️ Statystyki Jednostki
              </button>
              <button
                onClick={() => setActiveStatTab('spells')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                  activeStatTab === 'spells' ? "border-acid-purple text-white bg-purple-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                ⚡ Zdolności & Skille
              </button>
              <button
                onClick={() => setActiveStatTab('profile')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                  activeStatTab === 'profile' ? "border-acid-purple text-white bg-purple-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                📜 Protokół / Charakter
              </button>
            </div>

            {/* Tab content wrapper */}
            <div className="text-left py-2 min-h-[160px]">
              {activeStatTab === 'attributes' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Physical / Mental Attributes mapped like D&D */}
                  <div className="space-y-3.5 bg-white/[0.01] border border-white/5 p-4 rounded-3xl">
                    <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Cechy Główne</h4>

                    {/* ATTACK POWER (STR) */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">SIŁA PROMPOVANIA (STR)</span>
                      <span className="text-xs font-black text-amber-400">{str}</span>
                    </div>
                    {/* GUARDRAILS (DEF) */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">TARCZA OBRONNA (DEF)</span>
                      <span className="text-xs font-black text-cyan-400">{def}</span>
                    </div>
                    {/* SPEED (AGI) */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">ZRĘCZNOŚĆ LATENCJI (AGI)</span>
                      <span className="text-xs font-black text-emerald-400">{agi}</span>
                    </div>
                    {/* INTELLIGENCE MULTIPLIER (INT) */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">INTELIGENCJA M.M. (INT)</span>
                      <span className="text-xs font-black text-purple-400">+{int}%</span>
                    </div>
                  </div>

                  <div className="space-y-4 bg-white/[0.01] border border-white/5 p-4 rounded-3xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Pasywny Perk Jednostki</h4>
                      <div className="text-xs text-slate-300 leading-relaxed font-sans">
                        {agent.category === 'Programista' && (
                          <p>⭐ <b>Czysta Kompilacja</b>: +20% do szansy na bezbłędny kod przy pierwszym strzale. Redukuje zmęczenie programowe.</p>
                        )}
                        {agent.category === 'Administrator' && (
                          <p>⭐ <b>Mur Ogniowy Majoriza</b>: Całkowita niewrażliwość na złośliwe zapytania wrogich agentów i próby jailbreaka.</p>
                        )}
                        {agent.category === 'Analityk' && (
                          <p>⭐ <b>Rentgen Logu</b>: Automatyczna lokalizacja ukrytych wyjątków null pointer w ciemnych plikach konfiguracyjnych.</p>
                        )}
                        {agent.category === 'Copywriter' && (
                          <p>⭐ <b>Szybkie Pióro</b>: -40% czasu na formatowanie tekstów i generowanie chwytliwych humorków lub anegdot o klastrze.</p>
                        )}
                        {!['Programista', 'Administrator', 'Analityk', 'Copywriter'].includes(agent.category || '') && (
                          <p>⭐ <b>Błogosławieństwo Michała</b>: Boska ochrona najwyższego administratora. Dodaje +25% do wszystkich parametrów.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] font-mono text-slate-600 uppercase">SZCZĘŚCIE ROJU (LCK):</span>
                      <span className="text-[10px] text-yellow-500 font-bold">{luck}/100</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStatTab === 'spells' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Active abilities */}
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Zaklęcia Aktywne Roju (Abilities)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {abilities.map((abilityName, i) => (
                          <div key={abilityName} className="p-2.5 bg-neutral-950 border border-white/5 rounded-xl flex items-center gap-2.5">
                            <span className="text-xs">⚡</span>
                            <div className="text-left min-w-0">
                              <span className="text-[9px] font-black text-rose-500 block uppercase tracking-wider truncate">{abilityName}</span>
                              <span className="text-[8px] text-slate-500 block uppercase">Koszt: {20 + i * 15} MP • CD: {1 + i} cykle</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Passive skills list */}
                    <div className="pt-2.5 border-t border-white/5">
                      <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Specjalizacje / Wyuczone Skille</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-slate-300 font-mono uppercase">
                            🗡️ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStatTab === 'profile' && (
                <div className="space-y-3.5 text-xs text-slate-300 leading-normal bg-white/[0.01] border border-white/5 p-4 rounded-3xl">
                  <div>
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block">Osobowość Bojowa / Personality:</span>
                    <p className="mt-1 text-white">{agent.personality || "Stabilny interfejs cybernetyczny, słuchający komend admirała klastra."}</p>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block">Główne Zadanie Bojowe / Objectives:</span>
                    <p className="mt-1 text-slate-400">{agent.objectives || "Wspieranie orkiestracji systemowej i zabezpieczanie parametrów operacyjnych."}</p>
                  </div>
                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block">KATEGORIA:</span>
                      <span className="text-white uppercase font-black">{agent.category || 'Ogólny'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PRODUKCJA SŁÓW:</span>
                      <span className="text-emerald-400 font-black">{agent.messageCount || 0} zapytania</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer stats bar */}
          <div className="p-4 bg-neutral-950 border-t border-white/5 flex justify-between items-center text-[9px] font-mono font-bold uppercase text-slate-500">
            <span>Jednostka: {agent.id.toUpperCase()}</span>
            <span className="text-acid-purple">System CYLON GANG v3.8</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
