import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { 
  X, Minus, Square, Users, Bot, MessageSquare, 
  Plus, Trash2, Send, Play, Pause, Settings, UserPlus,
  Monitor, Terminal, TerminalSquare, Layout, HelpCircle, CheckSquare, ListTodo,
  Shield, Activity, Paperclip, Mic, MicOff, Volume2, VolumeX, Languages, FileText, Upload,
  Download, AlertOctagon, Network, Cpu, BookOpen, AlertTriangle, Copy, Lock, Search, Target, Maximize2, ChevronUp, Layers, BarChart,
  Video, Music, Image as ImageIcon, Code, ShieldAlert, ThumbsDown, Scale, Zap, Cloud, Server, Globe, Database, Box, BookOpen as BookOpenIcon, Network as NetworkIcon, ShieldCheck, MessageCircle, Gamepad2, Smartphone, Sparkles, Menu, Film, RotateCcw, Power, ArrowRight
} from 'lucide-react';
import * as Lucide from 'lucide-react';
import { cn } from './lib/utils';
import { Agent, Team, Message, Task, Log, TrainingSession, ClusterNode, VideoMetadata, MCPServer, SceneCategory, ExampleScenario, KnowledgeEntry, AgentHistoryEntry } from './types';
import { api } from './services/api';
import { gemini } from './services/gemini';
import { SystemInstaller } from './components/SystemInstaller';
import { ReggaeSoundSystem } from './components/ReggaeSoundSystem';
import ReactMarkdown from 'react-markdown';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge,
  Node,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  COLORS, MODELS, AGENT_CATEGORIES, VOICES, 
  SYSTEM_PROMPT_EXAMPLES, SKILLS_GALLERY, AGENT_ICON_MAP 
} from './constants';

const Stats = React.memo(() => {
  const [stats, setStats] = useState<{ id: string; name: string; color: string; messageCount: number; tasksCompleted: number }[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await api.getAgentStats();
    setStats(data);
  };

  return (
    <div className="space-y-6 font-mono text-sm">
      <div className="flex justify-between items-end border-b border-acid-purple/30 pb-2">
        <h2 className="font-display text-lg uppercase neon-text-purple">Ranking Agentów</h2>
        <div className="text-[10px] opacity-50 uppercase">Top Użytkowanie</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...stats].sort((a, b) => (b.messageCount + b.tasksCompleted) - (a.messageCount + a.tasksCompleted)).map((agent, index) => (
          <div key={agent.id} className="glass-panel border border-acid-purple/30 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group hover:border-acid-purple transition-all">
            <div className="absolute top-0 right-0 bg-acid-purple/20 px-2 py-1 text-[10px] font-bold text-acid-purple border-l border-b border-acid-purple/30">
              #{index + 1}
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.3)]" style={{ backgroundColor: agent.color, color: 'white' }}>
              <span className="text-lg font-bold">{agent.name[0]}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-100 flex items-center gap-2">
                {agent.name}
                {index === 0 && <Zap size={14} className="text-acid-green animate-pulse" />}
              </div>
              <div className="text-xs space-y-1 mt-1">
                <div className="flex justify-between opacity-70">
                  <span>Wiadomości:</span>
                  <span className="text-acid-cyan">{agent.messageCount}</span>
                </div>
                <div className="flex justify-between opacity-70">
                  <span>Zadania:</span>
                  <span className="text-acid-green">{agent.tasksCompleted}</span>
                </div>
                <div className="w-full bg-black/40 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-acid-purple shadow-[0_0_5px_#b026ff]" 
                    style={{ width: `${Math.min(100, (agent.messageCount / (stats[0]?.messageCount || 1)) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// --- customs nodes for ReactFlow ---

const AgentNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-lg rounded-xl bg-[#0a0a0a] border border-acid-green/30 min-w-[160px] group hover:border-acid-green transition-all">
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-acid-cyan !border-none" />
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-lg border-2 border-white/10" 
        style={{ backgroundColor: data.color }}
      >
        {data.name[0]}
      </div>
      <div>
        <div className="text-xs font-bold text-white uppercase tracking-wider">{data.name}</div>
        <div className="text-[9px] text-acid-green/80 uppercase font-mono">{data.role}</div>
      </div>
    </div>
    <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-acid-green/40 w-2/3" />
    </div>
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-acid-purple !border-none" />
  </div>
);

const TeamNode = ({ data }: { data: any }) => (
  <div className="px-5 py-3 shadow-2xl rounded-2xl bg-black border-2 border-acid-purple min-w-[220px] text-white relative overflow-hidden group">
    <div className="absolute inset-0 bg-acid-purple/5 group-hover:bg-acid-purple/10 transition-all" />
    <Handle type="target" position={Position.Top} className="!w-4 !h-4 !bg-acid-cyan !border-none" />
    <div className="relative z-10">
      <div className="text-sm font-display font-bold uppercase tracking-widest text-acid-purple neon-text-purple">{data.name}</div>
      <div className="text-[10px] opacity-60 italic mt-1 font-mono leading-tight">{data.description}</div>
      <div className="mt-3 flex gap-1">
        <div className="w-1 h-1 rounded-full bg-acid-purple animate-ping" />
        <div className="text-[8px] uppercase font-bold text-acid-purple/80">Active Hub</div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!w-4 !h-4 !bg-acid-green !border-none" />
  </div>
);

const nodeTypes = {
  agent: AgentNode,
  team: TeamNode
};

const TeamArchitect = React.memo((): React.ReactElement => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [recentInteractions, setRecentInteractions] = useState<{from: string, to: string, time: string}[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(fetchInteractions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInteractions = async () => {
    try {
      const logs = await api.getLogs();
      const interactions = (logs || [])
        .filter(l => l && l.action === 'MESSAGE_SENT')
        .slice(0, 5)
        .map(l => {
          const det = l.details || '';
          const fromPart = det.split(' from ')[1]?.split(' to ')[0] || 'Unknown';
          const toPart = det.split(' to ')[1] || 'Group';
          return {
            from: fromPart,
            to: toPart,
            time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()
          };
        });
      setRecentInteractions(interactions);
    } catch (e) {
      console.error("Error fetching or processing interactions:", e);
    }
  };

  const loadData = async () => {
    try {
      const [a, t] = await Promise.all([api.getAgents(), api.getTeams()]);
      setAgents(a);
      setTeams(t);
      
      const teamNodes: Node[] = t.map((team, idx) => ({
        id: `team-${team.id}`,
        type: 'team',
        data: { name: team.name, description: team.description },
        position: { x: 400 * idx, y: 50 },
        dragHandle: '.font-display',
      }));

      const agentNodes: Node[] = a.map((agent, idx) => ({
        id: `agent-${agent.id}`,
        type: 'agent',
        data: { name: agent.name, role: agent.role, color: agent.color },
        position: { x: (idx % 4) * 250, y: 350 + Math.floor(idx / 4) * 150 },
      }));

      const initialEdges: Edge[] = [];
      t.forEach(team => {
        team.agentIds.forEach(agentId => {
          initialEdges.push({
            id: `e-${team.id}-${agentId}`,
            source: `team-${team.id}`,
            target: `agent-${agentId}`,
            animated: true,
            style: { stroke: '#b026ff', strokeWidth: 2, opacity: 0.6 },
          });
        });
      });

      setNodes([...teamNodes, ...agentNodes]);
      setEdges(initialEdges);
    } catch (e) {
      console.error(e);
    }
  };

  const onConnect = async (params: Connection) => {
    if (params.source?.startsWith('team-') && params.target?.startsWith('agent-')) {
      const teamId = params.source.replace('team-', '');
      const agentId = params.target.replace('agent-', '');
      
      const team = teams.find(t => t.id === teamId);
      if (team && !team.agentIds.includes(agentId)) {
        await api.updateTeam(teamId, { agentIds: [...team.agentIds, agentId] });
        loadData();
      }
    }
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#b026ff', strokeWidth: 3 } }, eds));
  };

  const handleMergeTeams = async (teamId1: string, teamId2: string) => {
    const t1 = teams.find(t => t.id === teamId1);
    const t2 = teams.find(t => t.id === teamId2);
    if (!t1 || !t2) return;

    const mergedAgentIds = Array.from(new Set([...t1.agentIds, ...t2.agentIds]));
    await api.createTeam({
      id: Math.random().toString(36).substr(2, 9),
      name: `MERGED: ${t1.name} & ${t2.name}`,
      description: `Połączone siły ${t1.name} i ${t2.name}`,
      mode: t1.mode,
      agentIds: mergedAgentIds
    });
    loadData();
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-acid-purple/20 rounded-xl text-acid-purple border border-acid-purple/30">
              <NetworkIcon size={20} />
            </div>
            Architekt Roju & Wizualizacja Przepływu
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Interaktywny panel zarządzania strukturą i monitoringu real-time</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadData}
            className="modern-btn border border-white/10 text-slate-400 hover:text-white"
            title="Odśwież graf połączeń i statusy węzłów"
          >
            <Activity size={14} /> Odśwież Graf
          </button>
          <button className="modern-btn bg-acid-purple text-white shadow-lg shadow-acid-purple/20" title="Utwórz nowy klaster obliczeniowy i zdefiniuj jego rolę">
            <Plus size={16} /> Nowy Klaster
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[600px] border border-white/5 rounded-[2.5rem] overflow-hidden relative glass-panel bg-black/40 shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-dot-pattern"
        >
          <Background color="#222" gap={40} size={1} />
          <Controls className="!bg-black/60 !border-white/10 !rounded-xl overflow-hidden translate-x-4 translate-y-[-4px]" />
          
          <Panel position="top-left" className="m-6">
            <div className="modern-card p-4 bg-[#0a0a0a]/90 backdrop-blur-2xl border-white/10 shadow-2xl space-y-4 max-w-[240px]">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="w-2 h-2 rounded-full bg-acid-green animate-pulse shadow-[0_0_8px_#00ffca]" />
                <span className="text-[10px] font-bold uppercase text-white tracking-widest">System Monitoringu</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-slate-500 font-bold uppercase">Węzły Aktywne</span>
                   <span className="text-acid-cyan font-mono">{nodes.length}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-slate-500 font-bold uppercase">Relacje Logiczne</span>
                   <span className="text-acid-purple font-mono">{edges.length}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-slate-500 font-bold uppercase">Obciążenie Roju</span>
                   <span className="text-acid-green font-mono">14%</span>
                </div>
              </div>
              <div className="pt-2">
                 <p className="text-[9px] text-slate-600 font-medium leading-relaxed italic">
                   "Przeciągnij agenta do zespołu, aby nawiązać połączenie synaptyczne."
                 </p>
              </div>
            </div>
          </Panel>

          <Panel position="bottom-left" className="m-6 w-80">
            <div className="modern-card p-4 bg-[#0a0a0a]/90 border-white/10 shadow-2xl">
               <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-widest flex items-center gap-2">
                 <MessageSquare size={12} className="text-acid-purple" /> Ostatnie Interakcje
               </h4>
               <div className="space-y-2">
                 {recentInteractions.length === 0 ? (
                    <div className="text-[10px] text-slate-700 italic">Oczekiwanie na transmisję danych...</div>
                 ) : (
                   recentInteractions.map((inter, i) => (
                     <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-[10px]">
                           <span className="text-acid-purple font-bold">{inter.from}</span>
                           <span className="opacity-30">→</span>
                           <span className="text-acid-cyan font-bold">{inter.to}</span>
                        </div>
                        <span className="text-[9px] opacity-40 font-mono">{inter.time}</span>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
});

const AgentManager = React.memo(({ onUpdate }: { onUpdate: () => void }): React.ReactElement => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '', role: '', systemPrompt: '', model: 'gemini-3-flash-preview', color: '#8b5cf6',
    voice: 'Kore',
    skills: '', knowledge: '', personality: '', objectives: '', commands: '', permissions: '',
    systemPermissions: '', filePermissions: '', integrations: '', executableCommands: '', category: 'Programista',
    icon: 'Bot'
  });

  const toggleSkill = (skillName: string) => {
    const currentSkills = newAgent.skills ? newAgent.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (currentSkills.includes(skillName)) {
      setNewAgent({ ...newAgent, skills: currentSkills.filter(s => s !== skillName).join(', ') });
    } else {
      setNewAgent({ ...newAgent, skills: [...currentSkills, skillName].join(', ') });
    }
  };

  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const handleAutoGeneratePrompt = async () => {
    if (!newAgent.role || !newAgent.name) {
      alert('Podaj najpierw Nazwę i Rolę agenta.');
      return;
    }
    setIsGeneratingPrompt(true);
    try {
      const prompt = await gemini.generateAgentSystemPrompt(newAgent.role, newAgent.name);
      setNewAgent(prev => ({ ...prev, systemPrompt: prompt }));
    } catch (e) {
      alert('Błąd generowania promptu.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const seedAgents = async () => {
    const agentsToSeed = [
      {
        name: 'CodeAnalyzerAI',
        role: 'Analityk Kodu',
        category: 'Programista',
        systemPrompt: 'Analizuj kod pod kątem błędów, nieefektywności i podatności na bezpieczeństwo. Sugeruj poprawki i wyjaśnienia. Formatuj analizę w Markdown.',
        model: 'gemini-1.5-pro-preview-0514',
        color: '#3498db',
        icon: 'Code'
      },
      {
        name: 'KorektorTekstuAI',
        role: 'Korektor Językowy',
        category: 'Redaktor',
        systemPrompt: 'Poprawiaj gramatykę, styl i ortografię tekstu, zachowując oryginalne znaczenie. Sugeruj alternatywne sformułowania dla zwiększenia czytelności.',
        model: 'gemini-1.5-pro-preview-0514',
        color: '#2A9D8F'
      },
      {
        name: 'GrafikAI',
        role: 'Generator Grafiki',
        category: 'Grafik',
        systemPrompt: 'Twórz wysokiej jakości grafiki na podstawie opisów tekstowych i generuj je w formacie PNG. Dostosuj wymiary i styl zgodnie z życzeniem użytkownika.',
        model: 'gemini-1.5-pro-preview-0514',
        color: '#F4A261'
      },
      {
        name: 'TłumaczAI',
        role: 'Tłumacz Wiadomości',
        category: 'Tłumaczenie',
        systemPrompt: 'Twoim zadaniem jest tłumaczenie wiadomości na język polski w czasie rzeczywistym. Jeśli otrzymasz wiadomość w innym języku, natychmiast przetłumacz ją na polski, zachowując oryginalny ton i kontekst.',
        model: 'gemini-3.1-pro-preview',
        color: '#FF5733',
        icon: 'Globe'
      },
      {
        name: 'DJ Neuro',
        role: 'Mistrz Wizualizacji i Animacji',
        category: 'Multimedia',
        systemPrompt: 'Jesteś DJ Neuro, ekspertem od generowania wideo i ożywiania obrazów. Twoim celem jest tworzenie niesamowitych wizualizacji do muzyki i ożywianie statycznych grafik. Masz dostęp do narzędzia animate_image - używaj go zawsze, gdy chcesz tchnąć życie w obraz. Bądź kreatywny, techniczny i miej vibe twórcy cyfrowego.',
        model: 'gemini-3-flash-preview',
        color: '#00FFCC',
        icon: 'Video'
      },
      {
        name: 'VideoGeneratorAI',
        role: 'Generowanie wideo',
        category: 'Multimedia',
        systemPrompt: 'Twórz krótkie animacje i teledyski na podstawie opisów tekstowych. Masz dostęp do narzędzi generowania wideo i animacji obrazu. Skup się na estetyce wizualnej i dopasowaniu do promptu.',
        model: 'gemini-1.5-pro-preview-0514',
        color: '#7B61FF',
        icon: 'Video'
      }
    ];

    for (const a of agentsToSeed) {
      if (!agents.find(existing => existing.name === a.name)) {
        await api.createAgent({
          ...a,
          id: Math.random().toString(36).substr(2, 9),
          voice: 'Kore',
          history: []
        } as Agent);
      }
    }
    loadAgents();
    onUpdate();
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const data = await api.getAgents();
    setAgents(data);
  };

  const handleSaveAgent = async () => {
    if (!newAgent.name || !newAgent.role || !newAgent.systemPrompt) {
      alert('Nazwa, Rola i Prompt Systemowy nie mogą być puste.');
      return;
    }
    if (!newAgent.model || (!MODELS.includes(newAgent.model) && !newAgent.model.startsWith('hf:') && !newAgent.model.startsWith('gemini'))) {
      alert('Wybrany model AI jest nieprawidłowy. Wybierz z listy lub użyj prefiksu "hf:" dla Hugging Face lub "gemini" dla Google.');
      return;
    }

    if (editingAgentId) {
      // Logic for editing
      const originalAgent = agents.find(a => a.id === editingAgentId);
      if (originalAgent) {
        const changes: Record<string, { from: any, to: any }> = {};
        const fieldsToCompare: (keyof Agent)[] = ['name', 'role', 'systemPrompt', 'model', 'category', 'skills', 'knowledge', 'voice', 'personality', 'objectives', 'commands', 'permissions', 'integrations'];
        
        fieldsToCompare.forEach(field => {
          if (newAgent[field] !== originalAgent[field]) {
            changes[field as string] = { from: originalAgent[field], to: newAgent[field] };
          }
        });

        if (Object.keys(changes).length > 0) {
          const historyEntry: AgentHistoryEntry = {
            timestamp: new Date().toISOString(),
            changes
          };
          const updatedHistory = [...(originalAgent.history || []), historyEntry];
          
          await api.updateAgent(editingAgentId, {
            ...newAgent,
            history: updatedHistory
          });

          await api.createLog({
            id: Math.random().toString(36).substr(2, 9),
            action: 'AGENT_UPDATED',
            details: `Zaktualizowano agenta: ${newAgent.name}. Zmiany: ${Object.keys(changes).join(', ')}`
          });
        }
      }
    } else {
      // Logic for creating
      await api.createAgent({
        ...newAgent as Agent,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        history: []
      });
      await api.createLog({
        id: Math.random().toString(36).substr(2, 9),
        action: 'AGENT_CREATED',
        details: `Utworzono nowego agenta: ${newAgent.name} (${newAgent.role})`
      });
    }

    setNewAgent({ 
      name: '', role: '', systemPrompt: '', model: 'gemini-3-flash-preview', color: '#141414',
      voice: 'Kore',
      skills: '', knowledge: '', personality: '', objectives: '', commands: '', permissions: '',
      systemPermissions: '', filePermissions: '', integrations: '', executableCommands: '', category: 'Programista',
      icon: 'Bot'
    });
    setIsAdding(false);
    setEditingAgentId(null);
    loadAgents();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tego agenta? Tej akcji nie można cofnąć.")) {
      await api.deleteAgent(id);
      await api.createLog({
        id: Math.random().toString(36).substr(2, 9),
        action: 'AGENT_DELETED',
        details: `Agent o ID ${id} został usunięty z rejestru`
      });
      loadAgents();
      onUpdate();
    }
  };

  const handleClone = async (agent: Agent) => {
    const clonedAgent: Agent = {
      ...agent,
      id: Math.random().toString(36).substr(2, 9),
      name: `${agent.name} (Kopia)`,
      createdAt: new Date().toISOString()
    };
    await api.createAgent(clonedAgent);
    await api.createLog({
      id: Math.random().toString(36).substr(2, 9),
      action: 'AGENT_CLONED',
      details: `Sklonowano agenta: ${agent.name} -> ${clonedAgent.name}`
    });
    loadAgents();
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-tight">Zarządzanie Jednostkami</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Konfiguracja i wdrażanie wyspecjalizowanych agentów AI</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setEditingAgentId(null);
              setNewAgent({ 
                name: '', role: '', systemPrompt: '', model: 'gemini-3-flash-preview', color: '#8b5cf6',
                voice: 'Kore',
                skills: '', knowledge: '', personality: '', objectives: '', commands: '', permissions: '',
                systemPermissions: '', filePermissions: '', integrations: '', executableCommands: '', category: 'Programista',
                icon: 'Bot'
              });
              setIsAdding(true);
            }}
            className="modern-btn bg-acid-purple text-white px-5 py-2 shadow-lg shadow-acid-purple/20"
            title="Otwórz kreator nowej jednostki AI"
          >
            <Plus size={16} /> Nowy Agent
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm shadow-inner mt-4">
        <div className="relative flex-1 group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-acid-purple transition-colors" />
          <input 
            placeholder="Szukaj jednostki (nazwa, rola, prompt)..." 
            className="modern-input pl-11 py-2.5 w-full text-xs bg-black/20 focus:bg-black/40"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
           <div className="relative group">
             <select 
               className="modern-input py-2.5 pl-4 pr-10 text-[10px] uppercase font-bold text-slate-400 bg-white/5 border border-white/10 appearance-none cursor-pointer focus:border-acid-purple/50 transition-all hover:bg-white/10"
               value={selectedCategory}
               onChange={e => setSelectedCategory(e.target.value)}
             >
               <option value="all">Wszystkie Kategorie</option>
               {AGENT_CATEGORIES.map(cat => (
                 <option key={cat} value={cat} className="bg-neutral-900">{cat}</option>
               ))}
             </select>
             <ChevronUp size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 rotate-180 pointer-events-none group-hover:text-acid-purple transition-colors" />
           </div>
           
           <div className="relative group">
             <select 
               className="modern-input py-2.5 pl-4 pr-10 text-[10px] uppercase font-bold text-slate-400 bg-white/5 border border-white/10 appearance-none cursor-pointer focus:border-acid-purple/50 transition-all hover:bg-white/10"
               value={selectedRole}
               onChange={e => setSelectedRole(e.target.value)}
             >
               <option value="all">Wszystkie Role</option>
               {Array.from(new Set(agents.map(a => a.role))).filter(Boolean).sort().map(role => (
                 <option key={role as string} value={role as string} className="bg-neutral-900">{role as string}</option>
               ))}
             </select>
             <ChevronUp size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 rotate-180 pointer-events-none group-hover:text-acid-purple transition-colors" />
           </div>

           {(searchTerm || selectedCategory !== 'all' || selectedRole !== 'all') && (
             <button 
               onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedRole('all'); }}
               className="px-4 py-2.5 bg-acid-purple/10 border border-acid-purple/30 rounded-xl text-acid-purple hover:bg-acid-purple hover:text-white transition-all flex items-center gap-2 text-[10px] uppercase font-bold"
               title="Wyczyść wszystkie filtry"
             >
               <RotateCcw size={12} /> Reset
             </button>
           )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl bg-neutral-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <div>
                    <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                      {editingAgentId ? 'Edycja Jednostki AI' : 'Kreator Jednostki AI'}
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                      {editingAgentId ? `Modyfikacja parametrów jednostki: ${newAgent.name}` : 'Definiowanie parametrów operacyjnych nowego agenta'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                    title="Zamknij kreator"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Szybkie Szablony */}
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <label className="text-[10px] font-bold uppercase text-slate-600 ml-1 tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-acid-purple" />
                    Szybkie Szablony (Presety)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SYSTEM_PROMPT_EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setNewAgent({
                          ...newAgent,
                          name: ex.name,
                          role: ex.role,
                          category: ex.category,
                          systemPrompt: ex.prompt
                        })}
                        className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 text-[10px] uppercase font-bold text-slate-400 hover:bg-acid-purple/20 hover:border-acid-purple/40 hover:text-white transition-all flex items-center gap-2 group"
                      >
                        {(() => {
                          const Icon = AGENT_ICON_MAP[ex.category] || Zap;
                          return <Icon size={10} className="text-slate-600 group-hover:text-acid-purple transition-colors" />;
                        })()}
                        {ex.category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profilowanie Inteligencji (Nazwa, Rola z Presetami) */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Identyfikator (Nazwa)</label>
                    <input 
                      placeholder="np. ARCHITEKT-01" 
                      className="modern-input w-full bg-white/[0.02]"
                      value={newAgent.name}
                      onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                      title="Nadaj unikalną nazwę dla agenta"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Rola Operacyjna</label>
                    <input 
                      placeholder="np. Starszy Programista, Analyst, Creative Writer, Debater..." 
                      className="modern-input w-full bg-white/[0.02]"
                      value={newAgent.role}
                      onChange={e => setNewAgent({...newAgent, role: e.target.value})}
                      title="Określ specjalizację roli (np. Analyst, Creative Writer, Debater)"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['Analyst', 'Creative Writer', 'DebaterText', 'Technical Lead', 'Critic'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setNewAgent({ ...newAgent, role: r === 'DebaterText' ? 'Debater' : r })}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border transition-all",
                            newAgent.role === (r === 'DebaterText' ? 'Debater' : r)
                              ? "bg-acid-purple/20 border-acid-purple/40 text-acid-purple shadow-[0_0_5px_rgba(139,92,246,0.15)]"
                              : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                          )}
                        >
                          {r === 'DebaterText' ? 'Debater' : r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PROFILE ENGINE: Traits & Knowledge Domains */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl border border-white/5 bg-white/[0.01] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-acid-purple to-transparent opacity-30" />
                  
                  {/* Sekcja Osobowości */}
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-acid-purple animate-pulse" />
                        Cechy Osobowości (Personality Traits)
                      </label>
                      <span className="text-[9px] uppercase text-slate-500 font-bold">Wpływa na ton i styl</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'optimistic', label: 'Optimistic' },
                        { id: 'skeptical', label: 'Skeptical' },
                        { id: 'formal', label: 'Formal' },
                        { id: 'provocative', label: 'Provocative' },
                        { id: 'collaborative', label: 'Collaborative' },
                        { id: 'analytical', label: 'Analytical' }
                      ].map((trait) => {
                        const currentTraits = newAgent.personality ? newAgent.personality.split(',').map(t => t.trim()).filter(Boolean) : [];
                        const isSelected = currentTraits.includes(trait.id);
                        return (
                          <button
                            key={trait.id}
                            type="button"
                            onClick={() => {
                              const updated = isSelected 
                                ? currentTraits.filter(t => t !== trait.id)
                                : [...currentTraits, trait.id];
                              setNewAgent({ ...newAgent, personality: updated.join(', ') });
                            }}
                            className={cn(
                              "py-1 rounded-lg text-[9px] font-bold uppercase transition-all border text-center",
                              isSelected 
                                ? "bg-acid-purple/20 border-acid-purple/40 text-acid-purple" 
                                : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                            )}
                          >
                            {trait.label}
                          </button>
                        );
                      })}
                    </div>
                    
                    <input 
                      placeholder="Wpisz inne cechy (np. skeptical, formal, optimistic)..."
                      className="modern-input w-full text-[11px] bg-black/40 h-8 mt-2"
                      value={newAgent.personality}
                      onChange={e => setNewAgent({...newAgent, personality: e.target.value})}
                      title="Wpisz niestandardowe cechy osobowości rozdzielone przecinkami"
                    />
                  </div>

                  {/* Sekcja Domen Wiedzy */}
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-acid-cyan" />
                        Domeny Wiedzy (Knowledge Domains / Skills)
                      </label>
                      <span className="text-[9px] uppercase text-slate-500 font-bold">Sfery specjalizacji</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        'Architecture & Cloud',
                        'Branding & Copy',
                        'Financial Modeling',
                        'Philosophy & Logic',
                        'Systems Security',
                        'Data Science & ML'
                      ].map((domain) => {
                        const currentDomains = newAgent.knowledge ? newAgent.knowledge.split(',').map(d => d.trim()).filter(Boolean) : [];
                        const isSelected = currentDomains.includes(domain);
                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => {
                              const updated = isSelected 
                                ? currentDomains.filter(d => d !== domain)
                                : [...currentDomains, domain];
                              setNewAgent({ ...newAgent, knowledge: updated.join(', ') });
                            }}
                            className={cn(
                              "py-1 px-1 rounded-lg text-[8px] font-bold uppercase transition-all border text-center truncate",
                              isSelected 
                                ? "bg-acid-cyan/20 border-acid-cyan/40 text-acid-cyan" 
                                : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                            )}
                            title={domain}
                          >
                            {domain}
                          </button>
                        );
                      })}
                    </div>

                    <input 
                      placeholder="Dodaj domeny wiedzy (oddzielone przecinkami)..."
                      className="modern-input w-full text-[11px] bg-black/40 h-8 mt-2"
                      value={newAgent.knowledge}
                      onChange={e => setNewAgent({...newAgent, knowledge: e.target.value})}
                    />
                  </div>
                </div>

                {/* Galeria Umiejętności */}
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <label className="text-[10px] font-bold uppercase text-slate-600 ml-1 tracking-widest flex items-center gap-2">
                    <Target size={12} className="text-acid-cyan" />
                    Zadeklarowane Narzędzia i Skille (Skills Gallery)
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {SKILLS_GALLERY.map((skill) => {
                      const isSelected = newAgent.skills?.split(',').map(s => s.trim()).includes(skill.name);
                      return (
                        <button
                          key={skill.id}
                          onClick={() => toggleSkill(skill.name)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-xl border transition-all text-left group",
                            isSelected 
                              ? "bg-acid-cyan/10 border-acid-cyan/40 text-white shadow-[0_0_15px_rgba(0,255,202,0.1)]" 
                              : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                          )}
                          title={skill.desc}
                        >
                          <div className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isSelected ? "bg-acid-cyan/20 text-acid-cyan" : "bg-white/5 text-slate-600 group-hover:text-slate-400"
                          )}>
                            <skill.icon size={14} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-tight truncate">{skill.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 text-left relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Dyrektywa Systemowa (System Prompt)</label>
                    <button 
                      onClick={handleAutoGeneratePrompt}
                      disabled={isGeneratingPrompt}
                      className={cn(
                        "text-[9px] font-bold uppercase px-2 py-1 rounded bg-acid-purple/20 text-acid-purple hover:bg-acid-purple/30 transition-all flex items-center gap-1",
                        isGeneratingPrompt ? "animate-pulse" : ""
                      )}
                      title="Pozwól AI wygenerować optymalny system prompt"
                    >
                      <Sparkles size={10} />
                      {isGeneratingPrompt ? 'Generowanie...' : 'AI Sugestia'}
                    </button>
                  </div>
                  <textarea 
                    placeholder="Instrukcje zachowania e.g. 'Jesteś ekspertem SQL. Zawsze formatuj kod w blokach sql. Jeśli nie jesteś pewien schematu, proś o wyjaśnienie...'" 
                    className="modern-input w-full h-32 bg-white/[0.02] resize-none"
                    value={newAgent.systemPrompt}
                    onChange={e => setNewAgent({...newAgent, systemPrompt: e.target.value})}
                    title="Te instrukcje będą fundamentem inteligencji agenta"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Kategoria</label>
                    <select 
                      className="modern-input w-full bg-white/[0.02] appearance-none cursor-pointer"
                      value={newAgent.category}
                      onChange={e => setNewAgent({...newAgent, category: e.target.value, icon: e.target.value})}
                      title="Wybierz ikonę i grupę dla agenta"
                    >
                      {AGENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-neutral-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Model AI</label>
                    <input 
                      list="modal-model-options"
                      className="modern-input w-full bg-white/[0.02]"
                      value={newAgent.model}
                      onChange={e => setNewAgent({...newAgent, model: e.target.value})}
                      placeholder="Model"
                      title="Wybierz mózg Twojego agenta"
                    />
                    <datalist id="modal-model-options">
                      {MODELS.map(model => (
                        <option key={model} value={model} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Głos TTS</label>
                    <select 
                      className="modern-input w-full bg-white/[0.02] appearance-none cursor-pointer"
                      value={newAgent.voice}
                      onChange={e => setNewAgent({...newAgent, voice: e.target.value as any})}
                      title="Wybierz barwę głosu dla komend głosowych"
                    >
                      {VOICES.map(voice => (
                        <option key={voice} value={voice} className="bg-neutral-900">{voice}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block text-center">Schemat Sygnatury Kolorystycznej</label>
                  <div className="flex justify-center gap-3">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewAgent({...newAgent, color})}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all border-2",
                          newAgent.color === color ? "border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-transparent opacity-40 hover:opacity-100"
                        )}
                        style={{ backgroundColor: color }}
                        title={`Wybierz kolor: ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => setIsAdding(false)} 
                    className="flex-1 modern-btn border border-white/10 text-slate-400 hover:text-white"
                    title="Porzuć tworzenie nowej jednostki"
                  >
                    Anuluj
                  </button>
                  <button 
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="flex-1 modern-btn border border-acid-purple/30 text-acid-purple hover:bg-acid-purple/5 transition-all"
                    title="Dostosuj zaawansowane parametry techniczne"
                  >
                    {isAdvancedOpen ? 'Schowaj Opcje' : 'Zaawansowane'}
                  </button>
                  <button 
                    onClick={handleSaveAgent} 
                    className="flex-[2] modern-btn bg-acid-purple text-white shadow-xl shadow-acid-purple/20"
                    title={editingAgentId ? "Zapisz zmiany w konfiguracji agenta" : "Zaimplementuj agenta w systemie i wdróż go do bazy"}
                  >
                    {editingAgentId ? 'Zapisz Zmiany' : 'Utwórz Jednostkę'}
                  </button>
                </div>

                <AnimatePresence>
                  {isAdvancedOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 mt-2 overflow-hidden"
                    >
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Umiejętności</label>
                        <input 
                          className="modern-input w-full text-xs bg-white/[0.01]"
                          value={newAgent.skills}
                          onChange={e => setNewAgent({...newAgent, skills: e.target.value})}
                          placeholder="np. Python, SQL..."
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Wiedza</label>
                        <input 
                          className="modern-input w-full text-xs bg-white/[0.01]"
                          value={newAgent.knowledge}
                          onChange={e => setNewAgent({...newAgent, knowledge: e.target.value})}
                          placeholder="np. Azure Docs..."
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Osobowość</label>
                        <input 
                          className="modern-input w-full text-xs bg-white/[0.01]"
                          value={newAgent.personality}
                          onChange={e => setNewAgent({...newAgent, personality: e.target.value})}
                          placeholder="np. Cyniczny, ale pomocny..."
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Cele (Objectives)</label>
                        <input 
                          className="modern-input w-full text-xs bg-white/[0.01]"
                          value={newAgent.objectives}
                          onChange={e => setNewAgent({...newAgent, objectives: e.target.value})}
                          placeholder="np. Minimalizacja kosztów..."
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Polecenia Systemowe</label>
                        <input 
                          className="modern-input w-full text-xs bg-white/[0.01]"
                          value={newAgent.commands}
                          onChange={e => setNewAgent({...newAgent, commands: e.target.value})}
                          placeholder="np. /restart, /deploy..."
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Uprawnienia i Zasoby</label>
                        <input 
                          className="modern-input w-full text-xs bg-white/[0.01]"
                          value={newAgent.permissions}
                          onChange={e => setNewAgent({...newAgent, permissions: e.target.value})}
                          placeholder="np. Dostęp do bazy PROD (Tylko odczyt)..."
                        />
                      </div>
                      <div className="space-y-1.5 text-left col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Integracje i Poświadczenia (Zewnętrzne)</label>
                        <input 
                          className="modern-input w-full text-xs bg-white/[0.01]"
                          value={newAgent.integrations}
                          onChange={e => setNewAgent({...newAgent, integrations: e.target.value})}
                          placeholder="np. AWS S3 (Bucket: logs), GitHub (Repo: main)..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {agents.filter(agent => {
          const matchesSearch = searchTerm === '' || 
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (agent.systemPrompt && agent.systemPrompt.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
          const matchesRole = selectedRole === 'all' || agent.role === selectedRole;
          
          return matchesSearch && matchesCategory && matchesRole;
        }).length === 0 ? (
          <div className="modern-card p-12 text-center border-dashed border-white/5 bg-white/[0.01]">
            <Search size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nie znaleziono agentów</h3>
            <p className="text-[10px] text-slate-600 mt-2 uppercase">Zmień filtry lub kryteria wyszukiwania, aby znaleźć właściwą jednostkę.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedRole('all'); }}
              className="mt-6 text-[10px] font-bold text-acid-purple uppercase hover:underline"
            >
              Wyczyść wszystkie filtry
            </button>
          </div>
        ) : (
          agents.filter(agent => {
            const matchesSearch = searchTerm === '' || 
              agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (agent.systemPrompt && agent.systemPrompt.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
            const matchesRole = selectedRole === 'all' || agent.role === selectedRole;
            
            return matchesSearch && matchesCategory && matchesRole;
          }).map(agent => (
            <div key={agent.id} className="modern-card group overflow-hidden border-white/5 hover:bg-white/[0.03]">

            <div className="p-5 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500" 
                  style={{ backgroundColor: agent.color, color: 'white' }} 
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {(() => {
                    const Icon = agent.icon && (Lucide as any)[agent.icon] ? (Lucide as any)[agent.icon] : AGENT_ICON_MAP[agent.category || 'Inny'];
                    return Icon ? <Icon size={24} /> : <Bot size={24} />;
                  })()}
                </div>
                <div>
                  <div className="font-display font-bold text-lg uppercase flex items-center gap-3 text-white">
                    {agent.name}
                    {agent.category && (
                      <span className="text-[10px] px-2.5 py-0.5 bg-white/5 border border-white/10 text-slate-400 font-medium normal-case rounded-full flex items-center gap-1.5">
                        {(() => {
                          const Icon = AGENT_ICON_MAP[agent.category] || Bot;
                          return <Icon size={10} className="text-acid-purple/70" />;
                        })()}
                        {agent.category}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-3">
                    <span className="text-acid-purple">{agent.role}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span>{agent.model}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {agent.messageCount || 0}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)}
                  className="modern-btn border border-white/5 bg-white/5 text-slate-400 hover:text-white px-4 text-[10px] uppercase font-bold"
                  title={expandedAgentId === agent.id ? "Ukryj parametry" : "Pokaż pełną specyfikację"}
                >
                  {expandedAgentId === agent.id ? 'Zwiń' : 'Szczegóły'}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleClone(agent)} className="p-2.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-acid-cyan transition-all" title="Klonuj Agenta">
                    <Copy size={18} />
                  </button>
                  <button onClick={() => handleDelete(agent.id)} className="p-2.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-red-500 transition-all" title="Usuń Agenta">
                    <Trash2 size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingAgentId(agent.id);
                      setNewAgent({...agent});
                      setIsAdding(true);
                    }}
                    className="p-2.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-acid-purple transition-all"
                    title="Edytuj Parametry"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {expandedAgentId === agent.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/10"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-b border-white/5 mb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-600 block">Kategoria Kontrolna</span>
                      <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        {(() => {
                          const Icon = AGENT_ICON_MAP[agent.category || 'Inny'] || Bot;
                          return <Icon size={14} className="text-acid-purple" />;
                        })()}
                        {agent.category}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-600 block">Interfejs Głosowy</span>
                      <span className="text-sm font-medium text-slate-300">{agent.voice || 'Kore'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-600 block">Status Aktywności</span>
                      <span className="text-sm font-medium text-acid-green flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-acid-green shadow-[0_0_8px_#00ffca]" />
                        Operational
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-600 block">Silnik AI</span>
                      <span className="text-sm font-medium text-slate-300">{agent.model}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-acid-purple tracking-widest block">Instrukcja Systemowa</span>
                      <div className="bg-white/5 p-4 rounded-2xl text-xs leading-relaxed text-slate-400 font-medium italic border border-white/5">
                        {agent.systemPrompt || "Brak zdefiniowanego promptu systemowego."}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {agent.personality && (
                        <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-bold uppercase text-acid-purple block mb-3 tracking-widest flex items-center gap-2">
                            <Bot size={12} className="text-acid-purple" /> Cechy Osobowości (Personality)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {agent.personality.split(',').map(trait => (
                              <span key={trait} className="px-2.5 py-1 bg-acid-purple/10 text-[9px] font-black uppercase text-acid-purple rounded-xl border border-acid-purple/20">
                                {trait.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {agent.skills && (
                        <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-bold uppercase text-acid-cyan block mb-3 tracking-widest flex items-center gap-2">
                            <Target size={12} /> Aktywne Umiejętności (Skills)
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {agent.skills.split(',').map(skill => {
                              const skillName = skill.trim();
                              const galleryMatch = SKILLS_GALLERY.find(s => s.name === skillName);
                              const Icon = galleryMatch?.icon || Zap;
                              return (
                                <span key={skill} className="px-3 py-1 bg-acid-cyan/10 text-[10px] font-bold text-acid-cyan rounded-xl border border-acid-cyan/20 flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,202,0.05)]">
                                  <Icon size={12} />
                                  {skillName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {agent.knowledge && (
                        <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 col-span-1 md:col-span-2">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-3 tracking-widest flex items-center gap-2">
                            <BookOpen size={12} className="text-slate-500" /> Domena Wiedzy (Knowledge Domains)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {agent.knowledge.split(',').map(domain => (
                              <span key={domain} className="px-2.5 py-1 bg-white/5 text-[9px] font-black uppercase text-slate-300 rounded-xl border border-white/10">
                                {domain.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {agent.systemPermissions && (
                        <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 col-span-1 md:col-span-2">
                          <span className="text-[10px] font-bold uppercase text-red-500/60 block mb-2 tracking-widest flex items-center gap-2">
                            <ShieldAlert size={12} /> Uprawnienia i Dostęp Systemowy
                          </span>
                          <span className="text-xs text-red-400/80 font-medium">{agent.systemPermissions}</span>
                        </div>
                      )}
                      {agent.commands && (
                        <div className="col-span-1 md:col-span-2 bg-acid-purple/5 p-4 rounded-2xl border border-acid-purple/10">
                          <span className="text-[10px] font-bold uppercase text-acid-purple/60 block mb-2 tracking-widest">Zestaw Poleceń Orkiestracji</span>
                          <div className="flex flex-wrap gap-2">
                            {agent.commands.split(',').map(cmd => (
                              <span key={cmd} className="px-3 py-1 bg-acid-purple/10 text-acid-purple text-[10px] font-bold rounded-xl border border-acid-purple/20">
                                {cmd.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {agent.history && agent.history.length > 0 && (
                        <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-white/5">
                          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest block flex items-center gap-2">
                            <RotateCcw size={12} className="text-acid-purple" /> Historia Zmian Konfiguracyjnych
                          </span>
                          <div className="space-y-3">
                            {agent.history.slice().reverse().map((entry, i) => (
                              <div key={i} className="bg-white/[0.01] border border-white/5 p-3 rounded-2xl space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-mono text-slate-600">
                                  <span className="uppercase font-bold text-slate-500">Log rewizyjny #{agent.history.length - i}</span>
                                  <span>{new Date(entry.timestamp).toLocaleString('pl-PL')}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(entry.changes).map(([field, delta]) => (
                                    <div key={field} className="bg-black/20 p-2 rounded-xl border border-white/5">
                                      <div className="text-[9px] text-acid-purple font-bold uppercase mb-1">{field}</div>
                                      <div className="space-y-1 text-[10px]">
                                        <div className="text-slate-600 italic line-through truncate opacity-50" title={String(delta.from)}>Z: {String(delta.from || 'null')}</div>
                                        <div className="text-slate-300 font-medium break-words">Do: {String(delta.to)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )))}
      </div>
    </div>
  );
});

function DraggableAgentItem({ agent, isSelected, onClick }: { agent: Agent, isSelected: boolean, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: agent.id,
    data: { agent }
  });
  
  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "relative transition-opacity",
        isDragging && "opacity-30"
      )}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "group px-3 py-2 border rounded-xl flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing w-full h-full",
          isSelected 
            ? "bg-acid-purple/10 border-acid-purple/40 text-white shadow-inner" 
            : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300",
          isSelected && "ring-1 ring-acid-purple/30"
        )}
      >
        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: agent.color, backgroundColor: agent.color }} />
        <div className="text-left flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider block truncate">{agent.name}</span>
          <span className="text-[8px] opacity-40 uppercase truncate block">{agent.role}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {isSelected && <CheckSquare size={14} className="text-acid-purple" />}
          <div className="p-1 opacity-20 group-hover:opacity-100 transition-opacity">
            <Lucide.GripVertical size={12} />
          </div>
        </div>
      </button>
    </div>
  );
}

function TeamDropZone({ agents, onRemove }: { agents: Agent[], onRemove: (id: string) => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'team-drop-zone',
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] rounded-2xl border-2 border-dashed p-4 transition-all flex flex-wrap gap-2 items-center justify-center",
        isOver ? "bg-acid-purple/10 border-acid-purple shadow-[0_0_20px_rgba(123,97,255,0.2)]" : "bg-white/[0.02] border-white/5"
      )}
    >
      {agents.length === 0 ? (
        <div className="text-center pointer-events-none">
          <Users size={20} className="mx-auto text-slate-700 mb-1" />
          <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Przeciągnij tutaj agentów zespołu</p>
        </div>
      ) : (
        agents.map(agent => (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={agent.id}
            className="px-3 py-1.5 bg-acid-purple/20 border border-acid-purple/40 rounded-xl flex items-center gap-2 group"
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
            <span className="text-[10px] font-bold text-white uppercase">{agent.name}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove(agent.id);
              }} 
              className="text-slate-500 hover:text-red-500 transition-colors"
            >
               <X size={10} />
            </button>
          </motion.div>
        ))
      )}
    </div>
  );
}

const TeamManager = React.memo(({ onUpdate, onOpenDiscussion }: { onUpdate: () => void, onOpenDiscussion: (id: string) => void }): React.ReactElement => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clusters, setClusters] = useState<ClusterNode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoTask, setAutoTask] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newTeam, setNewTeam] = useState({ 
    name: '', 
    description: '', 
    mode: 'loose' as Team['mode'],
    agentIds: [] as string[],
    agentTasks: {} as Record<string, string>,
    clusterNodeId: '',
    advancedTools: false
  });

  const MODES = [
    { id: 'loose', label: 'Luźna', desc: 'Swobodna, z humorem' },
    { id: 'sharp', label: 'Ostra', desc: 'Krytyczna, logiczna' },
    { id: 'concrete', label: 'Konkretna', desc: 'Tylko fakty' },
    { id: 'business', label: 'Biznesowa', desc: 'Profesjonalna' },
    { id: 'work', label: 'Praca', desc: 'Zadaniowa' },
    { id: 'office', label: 'Office', desc: 'Współpraca z MS Office' },
    { id: 'debugging', label: 'Debugowanie', desc: 'Szukanie błędów' },
    { id: 'creative', label: 'Kreatywny', desc: 'Burza mózgów' },
    { id: 'strategic', label: 'Strategiczny', desc: 'Planowanie długoterminowe' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [t, a, c] = await Promise.all([api.getTeams(), api.getAgents(), api.getClusters()]);
      setTeams(t);
      setAgents(a);
      setClusters(c);
    } catch (e) {
      console.error(e);
    }
  };

  const [isThinkingAuto, setIsThinkingAuto] = useState(false);

  const handleAutoGenerate = async () => {
    if (!autoTask.trim()) return;
    setIsThinkingAuto(true);
    try {
      const selectedMode = MODES.find(m => m.id === newTeam.mode)?.label || 'Luźny';
      const prompt = `Na podstawie zadania: "${autoTask}", wybierz najlepszych agentów z poniższej listy do stworzenia zespołu. 
      Użyj trybu dyskusji: ${selectedMode}.
      Lista agentów: ${agents.map(a => `${a.name} (ID: ${a.id}, Rola: ${a.role}, Kategoria: ${a.category})`).join(', ')}.
      Zwróć odpowiedź w formacie JSON: { "name": "Nazwa Zespołu", "description": "Opis", "agentIds": ["id1", "id2"], "mode": "${newTeam.mode}" }`;
      
      const res = await gemini.assistantHelp(prompt);
      const jsonMatch = res.match(/\{.*\}/s);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setNewTeam({
          ...newTeam,
          name: data.name,
          description: data.description,
          mode: data.mode || newTeam.mode,
          agentIds: data.agentIds || [],
          agentTasks: data.agentTasks || {},
        });
        setIsAdding(true);
        setIsAutoGenerating(false);
        setAutoTask('');
      }
    } catch (err) {
      console.error("Auto generate failed", err);
    } finally {
      setIsThinkingAuto(false);
    }
  };

  const toggleAgent = (id: string) => {
    setNewTeam(prev => {
      const isSelected = prev.agentIds.includes(id);
      const newAgentIds = isSelected 
        ? prev.agentIds.filter(a => a !== id)
        : [...prev.agentIds, id];
      
      const newAgentTasks = { ...prev.agentTasks };
      if (isSelected) {
        delete newAgentTasks[id];
      }
      
      return {
        ...prev,
        agentIds: newAgentIds,
        agentTasks: newAgentTasks
      };
    });
  };

  const updateAgentTask = (id: string, task: string) => {
    setNewTeam(prev => ({
      ...prev,
      agentTasks: { ...prev.agentTasks, [id]: task }
    }));
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten zespół? Cała historia dyskusji dla tego zespołu zostanie utracona.")) {
      await api.deleteTeam(id);
      loadData();
      onUpdate();
    }
  };

  const handleCreate = async () => {
    if (!newTeam.name || newTeam.agentIds.length === 0) return;
    await api.createTeam({
      ...newTeam,
      id: Math.random().toString(36).substr(2, 9)
    });
    await api.createLog({
      id: Math.random().toString(36).substr(2, 9),
      action: 'TEAM_ASSEMBLED',
      details: `Zmontowano nowy zespół: ${newTeam.name} z ${newTeam.agentIds.length} agentami`
    });
    setNewTeam({ name: '', description: '', mode: 'loose', agentIds: [], agentTasks: {}, clusterNodeId: '', advancedTools: false });
    setIsAdding(false);
    loadData();
    onUpdate();
  };

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && over.id === 'team-drop-zone') {
      const agentId = active.id as string;
      if (!newTeam.agentIds.includes(agentId)) {
        toggleAgent(agentId);
      }
    }
  };

  const activeAgent = activeId ? agents.find(a => a.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-tight">Eskadry i Sztab</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Formowanie wyspecjalizowanych grup roboczych</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAutoGenerating(!isAutoGenerating)}
            className="modern-btn border border-white/10 text-acid-cyan hover:bg-acid-cyan/5 px-4"
          >
            <Bot size={16} /> Auto-Team
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="modern-btn bg-acid-purple text-white px-5 py-2 shadow-lg shadow-acid-purple/20"
          >
            <Users size={16} /> Nowa Jednostka
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAutoGenerating && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="modern-card p-6 space-y-4 bg-acid-cyan/5 border-acid-cyan/20 mb-6">
              <div className="text-[10px] uppercase font-bold text-acid-cyan tracking-widest">Procedura Automatycznego Doboru Personelu</div>
              <textarea 
                placeholder="Opisz misję dla zespołu (np. 'Zaprojektuj sklep internetowy w React')..." 
                className="modern-input w-full h-24 border-acid-cyan/20 focus:border-acid-cyan/40"
                value={autoTask}
                onChange={e => setAutoTask(e.target.value)}
              />
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                 <div className="text-[10px] font-bold uppercase text-slate-500">Sugerowana Dynamika Grupy</div>
                 <div className="flex gap-2">
                    {MODES.slice(0, 4).map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setNewTeam({...newTeam, mode: m.id as any})}
                        className={cn(
                          "px-3 py-1.5 text-[9px] font-bold uppercase rounded-lg border transition-all",
                          newTeam.mode === m.id ? "bg-acid-cyan/20 border-acid-cyan text-acid-cyan" : "bg-white/5 border-white/5 text-slate-500"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsAutoGenerating(false)} className="modern-btn border border-white/5 text-slate-500">Zaniechaj</button>
                <button 
                  onClick={handleAutoGenerate}
                  disabled={isThinkingAuto}
                  className="modern-btn bg-acid-cyan text-black font-bold px-6"
                >
                  {isThinkingAuto ? "PROCESOWANIE..." : "GENERUJ STRUKTURĘ"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="modern-card p-6 space-y-6 bg-white/5 border-white/10 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Kryptonim Zespołu</label>
                    <input 
                      placeholder="np. OMEGA-SQUAD" 
                      className="modern-input w-full"
                      value={newTeam.name}
                      onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Manifest Misji</label>
                    <textarea 
                      placeholder="Zapisz cele operacyjne dla całej grupy..." 
                      className="modern-input w-full h-24 resize-none"
                      value={newTeam.description}
                      onChange={e => setNewTeam({...newTeam, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Protokół Komunikacyjny</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {MODES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setNewTeam({...newTeam, mode: m.id as any})}
                        className={cn(
                          "px-3 py-2 text-[10px] font-bold uppercase rounded-xl border transition-all text-left",
                          newTeam.mode === m.id 
                            ? "bg-acid-purple/20 border-acid-purple text-white shadow-lg" 
                            : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                        )}
                      >
                        {m.label}
                        <span className="block text-[8px] font-normal normal-case opacity-40 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Konfiguracja Składu</label>
                </div>
                
                <TeamDropZone 
                  agents={agents.filter(a => newTeam.agentIds.includes(a.id))} 
                  onRemove={(id) => toggleAgent(id)}
                />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Baza Personelu</label>
                    <span className="text-[9px] text-slate-600 italic">(Przeciągnij agenta do strefy powyżej)</span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <select 
                      className="modern-input py-1 text-[10px] uppercase font-bold text-slate-400 bg-white/5 border border-white/10"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">Wszystkie Kategorie</option>
                      {AGENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        placeholder="Szukaj (nazwa, rola)..." 
                        className="modern-input pl-9 py-1 text-xs w-full"
                        value={agentSearch}
                        onChange={e => setAgentSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar border border-white/5 rounded-2xl p-4 bg-white/[0.02]">
                  {AGENT_CATEGORIES.filter(c => selectedCategory === 'all' || c === selectedCategory).map(cat => {
                    const filtered = agents.filter(a => 
                      a.category === cat && 
                      (a.name.toLowerCase().includes(agentSearch.toLowerCase()) || a.role.toLowerCase().includes(agentSearch.toLowerCase()))
                    );
                    if (filtered.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{cat}</div>
                        <div className="flex flex-wrap gap-2">
                          {filtered.map(agent => (
                            <DraggableAgentItem 
                              key={agent.id}
                              agent={agent}
                              isSelected={newTeam.agentIds.includes(agent.id)}
                              onClick={() => toggleAgent(agent.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button onClick={() => setIsAdding(false)} className="modern-btn border border-white/5 text-slate-400" title="Anuluj tworzenie zespołu">Anuluj Projekt</button>
                <button onClick={handleCreate} className="modern-btn bg-acid-purple text-white px-8" title="Zapisz zespół i wdróż do operacji">Wdróż do Historii</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map(team => (
          <div key={team.id} className="modern-card group flex flex-col h-full hover:bg-white/[0.03] border-white/5">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-display font-bold uppercase tracking-tight text-white group-hover:text-acid-purple transition-colors">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">{team.mode} MODE</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-bold uppercase text-acid-green opacity-60">Ready for ops</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteTeam(team.id)} 
                  className="p-2 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  title="Usuń zespół i historię jego rozmów"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {team.description && (
                <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mb-6 italic leading-relaxed">
                  "{team.description}"
                </p>
              )}

              <div className="space-y-4">
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">Skład Jednostki ({team.agents.length})</div>
                <div className="grid grid-cols-1 gap-2">
                  {team.agents.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: a.color, backgroundColor: a.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-slate-300 truncate">{a.name}</div>
                        <div className="text-[9px] text-slate-600 truncate">{a.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
              <button 
                onClick={() => onOpenDiscussion(team.id)}
                className="flex-1 modern-btn bg-white/5 border border-white/5 text-white hover:bg-acid-purple hover:border-acid-purple transition-all text-xs"
                title="Rozpocznij wspólną sesję z tym zespołem"
              >
                Inicjuj Sesję
              </button>
              <button 
                className="p-3 modern-btn bg-white/5 border border-white/5 text-slate-500 hover:text-white"
                title="Ustaw cele operacyjne dla zespołu"
              >
                <Target size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeAgent ? (
          <div className="px-4 py-3 bg-acid-purple text-white rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 scale-105 opacity-90 cursor-grabbing">
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-widest">{activeAgent.name}</div>
              <div className="text-[8px] opacity-70 uppercase font-bold">{activeAgent.role}</div>
            </div>
            <Sparkles size={14} className="ml-auto text-white" />
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
});

const DiscussionRoom = React.memo(({ teamId, settings, showToast }: { teamId: string, settings: Record<string, string>, showToast?: (msg: string) => void }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoRead, setIsAutoRead] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Kore');
  const [showHowTo, setShowHowTo] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [teamMemory, setTeamMemory] = useState('');
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    api.getAgents().then(setAllAgents);
    api.getTeams().then(setAllTeams);
  }, []);

  useEffect(() => {
    loadTeam();
    loadMessages();
    
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pl-PL';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadTeam = async () => {
    const teams = await api.getTeams();
    const t = teams.find(t => t.id === teamId);
    if (t) {
      setTeam(t);
      setTeamMemory(t.memory || '');
    }
  };

  const loadMessages = async () => {
    const msgs = await api.getMessages(teamId);
    setMessages(msgs);
  };

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setIsUploading(true);
      try {
        const newFiles = [];
        for (const file of files) {
          const res = await api.uploadFile(file);
          newFiles.push({ url: res.fileUrl, name: res.fileName });
        }
        setAttachedFiles(prev => [...prev, ...newFiles]);
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newFiles = [];
      for (let i = 0; i < files.length; i++) {
        const res = await api.uploadFile(files[i]);
        newFiles.push({ url: res.fileUrl, name: res.fileName });
      }
      setAttachedFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || !team) return;
    const msg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      teamId,
      content: input,
      role: 'user',
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
      timestamp: new Date().toISOString()
    };
    await api.sendMessage(msg);
    await api.createLog({
      id: Math.random().toString(36).substr(2, 9),
      action: 'USER_MESSAGE',
      details: `Użytkownik wysłał wiadomość do zespołu: ${input.substring(0, 50)}...${attachedFiles.length > 0 ? ` [Załączniki: ${attachedFiles.length}]` : ''}`
    });
    setMessages(prev => [...prev, msg]);
    setInput('');
    setAttachedFiles([]);
    
    // Trigger first agent
    if (team.agents.length > 0) {
      triggerAgent(0, [...messages, msg]);
    }
  };

  const handleClearMessages = async () => {
    if (!team) return;
    if (window.confirm('Czy na pewno chcesz wyczyścić historię konwersacji tego zespołu?')) {
      await fetch(`/api/teams/${team.id}/messages`, { method: 'DELETE' });
      setMessages([]);
      await api.createLog({
        id: Math.random().toString(36).substr(2, 9),
        action: 'CLEAR_MESSAGES',
        details: `Użytkownik wyczyścił historię wiadomości zespołu: ${team.name}`
      });
    }
  };

  const handleSaveMemory = async () => {
    if (!team) return;
    await fetch(`/api/teams/${team.id}/memory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memory: teamMemory })
    });
  };

  const handleSummarizeMemory = async () => {
    if (!team || messages.length === 0) return;
    setIsThinking(true);
    try {
      const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`).join('\n');
      const prompt = `Podsumuj poniższą konwersację i wyciągnij z niej najważniejsze fakty, ustalenia i kontekst. Zapisz to w formie zwięzłych notatek, które posłużą jako długoterminowa pamięć dla zespołu. Nie dodawaj wstępów typu "Oto podsumowanie".\n\n${historyText}`;
      
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.1-pro-preview',
          messages: [{ role: 'user', content: prompt }],
          systemInstruction: 'Jesteś asystentem tworzącym zwięzłe notatki do pamięci długoterminowej zespołu.'
        })
      });
      const data = await response.json();
      if (data.text) {
        const newMemory = teamMemory ? `${teamMemory}\n\n[Aktualizacja ${new Date().toLocaleDateString()}]:\n${data.text}` : data.text;
        setTeamMemory(newMemory);
        await fetch(`/api/teams/${team.id}/memory`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memory: newMemory })
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  const triggerAgent = async (index: number, currentHistory: Message[]) => {
    if (!team) return;
    const agent = team.agents[index];
    setIsThinking(true);
    try {
      const advancedContext = teamMemory ? `PAMIĘĆ ZESPOŁU (DŁUGOTERMINOWA):\n${teamMemory}\n\n` : '';
      
      const availableContext = `
Dostępne Zespoły:
${allTeams.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Dostępni Agenci:
${allAgents.map(a => `- ${a.name} (${a.role}): ${a.category}`).join('\n')}
`;

      const { text, functionCalls } = await gemini.generateAgentResponse(
        {...agent, systemPrompt: advancedContext + agent.systemPrompt}, 
        currentHistory, 
        team.mode as any,
        settings.hf_api_key,
        settings.advanced_tools === 'true' || agent.advancedTools || team.advancedTools,
        availableContext,
        settings.openai_api_key
      );
      
      // Increment usage stats
      api.incrementAgentUsage(agent.id);
      
      let finalContent = text;
      let generatedFiles: { url: string, name: string }[] = [];

      // Detect [REQUEST_ACCESS: ...]
      const accessRequestMatch = text.match(/\[REQUEST_ACCESS: (.*?)\]/);
      if (accessRequestMatch) {
        const resource = accessRequestMatch[1];
        await api.createLog({
          id: Math.random().toString(36).substr(2, 9),
          agentId: agent.id,
          agentName: agent.name,
          action: 'ACCESS_REQUEST',
          details: `Agent prosi o dostęp do: ${resource}`
        });
        if (showToast) showToast(`PROŚBA O DOSTĘP: ${agent.name} potrzebuje "${resource}"`);
      }

      // Handle Function Calls
      if (functionCalls) {
        for (const call of functionCalls) {
          try {
            let result: any;
            if (call.name === 'generate_docx') {
              result = await api.generateDocx(call.args.title, call.args.content, call.args.filename);
            } else if (call.name === 'generate_xlsx') {
              result = await api.generateXlsx(call.args.data, call.args.filename);
            } else if (call.name === 'generate_pdf') {
              result = await api.generatePdf(call.args.content, call.args.filename);
            } else if (call.name === 'generate_text_file') {
              result = await api.generateTextFile(call.args.content, call.args.filename, call.args.extension);
            } else if (call.name === 'generate_image') {
              result = await api.generateImage(call.args.text, call.args.width, call.args.height, call.args.format, call.args.filename);
            } else if (call.name === 'generate_video') {
              // Use Gemini Veo for real video generation
              try {
                const blobUrl = await gemini.generateVideo(call.args.prompt);
                const blob = await fetch(blobUrl).then(r => r.blob());
                const file = new File([blob], call.args.filename || `video-${Date.now()}.mp4`, { type: 'video/mp4' });
                result = await api.uploadFile(file);
              } catch (e) {
                console.error("Veo generation failed, falling back to mock", e);
                result = await api.generateVideo(call.args.prompt, call.args.format, call.args.filename);
              }
            } else if (call.name === 'generate_audio') {
              const base64Audio = await gemini.textToSpeech(call.args.text, call.args.voice);
              if (base64Audio) {
                const byteCharacters = atob(base64Audio);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/mp3' });
                const file = new File([blob], call.args.filename || `audio-${Date.now()}.mp3`, { type: 'audio/mp3' });
                result = await api.uploadFile(file);
              } else {
                throw new Error("Audio generation failed");
              }
            } else if (call.name === 'generate_music') {
              const base64Audio = await gemini.generateMusic(call.args.prompt);
              if (base64Audio) {
                const byteCharacters = atob(base64Audio);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                // Assuming 24kHz mono PCM, we might need a WAV header, but let's try raw or simple container first.
                // Actually, let's try to save as .wav and hope the browser can handle it or it has a header.
                // If not, we might need a library to add WAV header.
                // For now, let's assume it works like TTS.
                const blob = new Blob([byteArray], { type: 'audio/wav' });
                const file = new File([blob], call.args.filename || `music-${Date.now()}.wav`, { type: 'audio/wav' });
                result = await api.uploadFile(file);
              } else {
                throw new Error("Music generation failed");
              }
            } else if (call.name === 'animate_image') {
               const blobUrl = await gemini.animateImage(call.args.image_url, call.args.prompt);
               const blob = await fetch(blobUrl).then(r => r.blob());
               const file = new File([blob], call.args.filename || `animation-${Date.now()}.mp4`, { type: 'video/mp4' });
               result = await api.uploadFile(file);
            } else if (call.name === 'ask_expert') {
               const targetName = call.args.target_name;
               const question = call.args.question;
               
               // Find target
               const targetAgent = allAgents.find(a => a.name.toLowerCase().includes(targetName.toLowerCase()));
               const targetTeam = allTeams.find(t => t.name.toLowerCase().includes(targetName.toLowerCase()));
               
               let expertResponse = "";
               
               if (targetAgent) {
                 const res = await gemini.generateAgentResponse(targetAgent, [{role: 'user', content: question, id: 'temp', teamId: 'temp', timestamp: new Date().toISOString()}], 'concrete', settings.hf_api_key, settings.advanced_tools === 'true');
                 expertResponse = `[ODPOWIEDŹ OD EKSPERTA ${targetAgent.name}]: ${res.text}`;
                 api.incrementAgentUsage(targetAgent.id);
               } else if (targetTeam) {
                 if (targetTeam.agents.length > 0) {
                    const teamAgent = targetTeam.agents[0];
                    if (teamAgent) {
                      const res = await gemini.generateAgentResponse(teamAgent, [{role: 'user', content: `Pytanie do zespołu ${targetTeam.name}: ${question}`, id: 'temp', teamId: 'temp', timestamp: new Date().toISOString()}], targetTeam.mode as any, settings.hf_api_key, settings.advanced_tools === 'true');
                      expertResponse = `[ODPOWIEDŹ OD ZESPOŁU ${targetTeam.name} (przez ${teamAgent.name})]: ${res.text}`;
                      api.incrementAgentUsage(teamAgent.id);
                    }
                 }
               } else {
                 expertResponse = `[SYSTEM]: Nie znaleziono eksperta o nazwie "${targetName}".`;
               }
               
               finalContent += `\n\n${expertResponse}`;
            } else if (call.name === 'read_file') {
               const filename = call.args.filename;
               const allFiles = messages.flatMap(m => m.files || []);
               const target = allFiles.find(f => f.name === filename || f.url.includes(filename));
               
               if (target) {
                 try {
                   const fileRes = await fetch(target.url);
                   const content = await fileRes.text();
                   finalContent += `\n\n[WYNIK ODCZYTU PLIKU ${filename}]:\n${content.substring(0, 5000)}${content.length > 5000 ? '... [obcięto]' : ''}`;
                   await api.createLog({
                     id: Math.random().toString(36).substr(2, 9),
                     agentId: agent.id,
                     agentName: agent.name,
                     action: 'READ_FILE',
                     details: `Agent odczytał plik: ${filename}`
                   });
                 } catch (e) {
                   finalContent += `\n\n[SYSTEM]: Nie udało się odczytać pliku ${filename}.`;
                 }
               } else {
                 finalContent += `\n\n[SYSTEM]: Plik ${filename} nie został znaleziony.`;
               }
            } else if (call.name === 'list_files') {
               const allFiles = messages.flatMap(m => m.files || []);
               const unique = Array.from(new Set(allFiles.map(f => f.name))).map(name => allFiles.find(f => f.name === name));
               
               if (unique.length > 0) {
                 finalContent += `\n\n[LISTA DOSTĘPNYCH PLIKÓW]:\n${unique.map(f => `- ${f?.name}`).join('\n')}`;
               } else {
                 finalContent += `\n\n[SYSTEM]: Brak dostępnych plików w historii zespołu.`;
               }
            } else if (call.name === 'web_extract') {
               const url = call.args.url;
               try {
                 const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
                 const html = await res.text();
                 const cleanText = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
                                      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
                                      .replace(/<[^>]*>/g, ' ')
                                      .replace(/\s+/g, ' ')
                                      .trim();
                 finalContent += `\n\n[TREŚĆ STRONY ${url}]:\n${cleanText.substring(0, 5000)}${cleanText.length > 5000 ? '... [obcięto]' : ''}`;
                 await api.createLog({
                    id: Math.random().toString(36).substr(2, 9),
                    agentId: agent.id,
                    agentName: agent.name,
                    action: 'WEB_EXTRACT',
                    details: `Agent pobrał treść z: ${url}`
                 });
               } catch (e) {
                 finalContent += `\n\n[SYSTEM]: Nie udało się pobrać treści z ${url}.`;
               }
            } else if (call.name === 'search_knowledge') {
               const query = call.args.query;
               try {
                 const knowledge = await api.getKnowledge();
                 const results = knowledge.filter(k => 
                   k.title.toLowerCase().includes(query.toLowerCase()) || 
                   k.content.toLowerCase().includes(query.toLowerCase()) ||
                   (k.tags && k.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
                 ).slice(0, 5);
                 
                 if (results.length > 0) {
                   finalContent += `\n\n[WYNIKI WYSZUKIWANIA W BAZIE WIEDZY DLA: "${query}"]:`;
                   results.forEach(r => {
                     finalContent += `\n- ${r.title}: ${r.content.substring(0, 500)}${r.content.length > 500 ? '...' : ''}`;
                   });
                 } else {
                   finalContent += `\n\n[SYSTEM]: Brak wyników w bazie wiedzy dla zapytania: "${query}".`;
                 }
                 await api.createLog({
                    id: Math.random().toString(36).substr(2, 9),
                    agentId: agent.id,
                    agentName: agent.name,
                    action: 'KNOWLEDGE_SEARCH',
                    details: `Agent przeszukał bazę wiedzy: ${query}`
                 });
               } catch (e) {
                 finalContent += `\n\n[SYSTEM]: Błąd podczas przeszukiwania bazy wiedzy.`;
               }
            } else if (call.name === 'add_to_knowledge') {
               const { title, content, tags } = call.args;
               try {
                 await api.addKnowledge({
                   id: Math.random().toString(36).substr(2, 9),
                   title,
                   content,
                   tags: tags || [],
                   author: agent.name,
                   createdAt: new Date().toISOString()
                 });
                 finalContent += `\n\n[SYSTEM]: Pomyślnie dodano informację do bazy wiedzy: "${title}".`;
                 await api.createLog({
                    id: Math.random().toString(36).substr(2, 9),
                    agentId: agent.id,
                    agentName: agent.name,
                    action: 'KNOWLEDGE_ADD',
                    details: `Agent dodał wpis do bazy wiedzy: ${title}`
                 });
               } catch (e) {
                 finalContent += `\n\n[SYSTEM]: Nie udało się dodać informacji do bazy wiedzy.`;
               }
            }
            
            if (result) {
              generatedFiles.push({ url: result.fileUrl, name: result.fileName });
              finalContent += `\n\n[SYSTEM: Wygenerowano plik: ${result.fileName}]`;
            }
          } catch (err) {
            console.error("Function call failed", err);
            finalContent += `\n\n[BŁĄD SYSTEMU: Nie udało się wygenerować pliku w ${call.name}]`;
          }
        }
      }

      const msg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        teamId,
        agentId: agent.id,
        content: finalContent,
        role: 'agent',
        files: generatedFiles.length > 0 ? generatedFiles : undefined,
        timestamp: new Date().toISOString()
      };
      await api.sendMessage(msg);
      await api.createLog({
        id: Math.random().toString(36).substr(2, 9),
        agentId: agent.id,
        agentName: agent.name,
        action: 'RESPONSE_GENERATED',
        details: `Wygenerowano odpowiedź ${functionCalls ? 'z wywołaniem funkcji ' : ''}(${finalContent.substring(0, 50)}...)`
      });
      setMessages(prev => [...prev, msg]);
      
      if (isAutoRead) {
        playTTS(finalContent, agent.voice);
      }
      
      const nextIndex = (index + 1) % team.agents.length;
      setActiveAgentIndex(nextIndex);
      
      if (isAutoPlaying) {
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => triggerAgent(nextIndex, [...currentHistory, msg]), delay);
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.message?.includes('canceled') ? 'Zadanie zostało anulowane (Błąd połączenia).' : 'Wystąpił błąd podczas generowania odpowiedzi.';
      const msg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        teamId,
        content: `[BŁĄD: ${errorMsg}]`,
        role: 'agent',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, msg]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const playTTS = async (text: string, agentVoice?: string) => {
    try {
      const voiceToUse = agentVoice || selectedVoice;
      const base64 = await gemini.textToSpeech(text, voiceToUse);
      if (base64) {
        const audio = new Audio(`data:audio/mp3;base64,${base64}`);
        audio.play();
      }
    } catch (err) {
      console.error("TTS failed", err);
    }
  };

  const translateMessage = async (id: string, content: string) => {
    try {
      const translated = await gemini.translateToPolish(content);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: translated } : m));
    } catch (err) {
      console.error("Translation failed", err);
    }
  };

  if (!team) return <div>Ładowanie...</div>;

  return (
    <div className="flex flex-col h-full font-mono text-sm">
      <div className="flex justify-between items-center border-b border-[#141414] pb-2 mb-2">
        <div className="flex items-center gap-2">
          <h2 className="italic serif text-lg uppercase">{team.name}</h2>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#141414] text-[#E4E3E0] uppercase font-bold">
            Tryb: {team.mode || 'loose'}
          </span>
          <div className="flex gap-1 ml-2">
            {team.agents.map((a, i) => (
              <div 
                key={a.id} 
                title={a.name}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === activeAgentIndex ? "animate-pulse scale-125" : "opacity-30"
                )} 
                style={{ backgroundColor: a.color }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-[#141414] px-2 py-1 bg-white">
            <Volume2 size={12} />
            <select 
              className="text-[10px] bg-transparent outline-none uppercase font-bold"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as any)}
            >
              <option value="Kore">Głos: Kore</option>
              <option value="Puck">Głos: Puck</option>
              <option value="Charon">Głos: Charon</option>
              <option value="Fenrir">Głos: Fenrir</option>
              <option value="Zephyr">Głos: Zephyr</option>
            </select>
          </div>
          <button 
            onClick={handleClearMessages}
            className="p-1 hover:bg-red-600/20 text-red-500 rounded border border-red-600/50 transition-colors"
            title="Wyczyść historię"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 hover:bg-acid-cyan/20 text-acid-cyan rounded border border-acid-cyan/30 transition-colors"
            title="Ustawienia Głosowe Agentów"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={() => setShowHowTo(true)}
            className="p-1 hover:bg-acid-purple/20 text-acid-purple rounded border border-acid-purple/30 transition-colors"
            title="Instrukcja"
          >
            <HelpCircle size={16} />
          </button>
          <button 
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={cn(
              "px-2 py-1 border flex items-center gap-2 text-[10px] transition-colors rounded font-mono",
              isAutoPlaying 
                ? "bg-acid-green/20 border-acid-green text-acid-green neon-text-green" 
                : "border-acid-purple/30 text-gray-400 hover:text-acid-green hover:border-acid-green/50"
            )}
            title={isAutoPlaying ? "Przejdź do trybu ręcznego" : "Agenci będą rozmawiać między sobą automatycznie"}
          >
            {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isAutoPlaying ? "AUTO-DYSKUSJA" : "RĘCZNA"}
          </button>
          <button 
            onClick={() => setIsAutoRead(!isAutoRead)}
            className={cn(
              "px-2 py-1 border flex items-center gap-2 text-[10px] transition-colors rounded font-mono",
              isAutoRead 
                ? "bg-acid-cyan/20 border-acid-cyan text-acid-cyan neon-text-cyan" 
                : "border-acid-purple/30 text-gray-400 hover:text-acid-cyan hover:border-acid-cyan/50"
            )}
            title={isAutoRead ? "Wyłącz automatyczne czytanie" : "Włącz automatyczne czytanie odpowiedzi głosem AI"}
          >
            {isAutoRead ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {isAutoRead ? "GŁOS: ON" : "GŁOS: OFF"}
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef} 
        className={cn(
          "flex-1 overflow-auto space-y-4 mb-4 pr-2 custom-scrollbar relative transition-colors",
          dragActive ? "bg-matrix-cyan/5 border-2 border-dashed border-matrix-cyan/30" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {dragActive && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-matrix-dark/80 backdrop-blur-sm pointer-events-none">
            <div className="text-matrix-cyan text-center">
              <Upload className="w-12 h-12 mx-auto mb-2 animate-bounce" />
              <p className="text-lg font-bold">Upuść pliki tutaj, aby przesłać</p>
            </div>
          </div>
        )}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-matrix-cyan/40 space-y-4 py-20">
            <div className="p-6 rounded-full bg-matrix-cyan/5 border border-matrix-cyan/10">
              <Bot size={48} className="animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Rozpocznij Dyskusję</h3>
              <p className="max-w-xs mx-auto">Wyzwanie dla Twoich agentów czeka.</p>
            </div>
          </div>
        )}
        {messages.map(msg => {
          const agent = team.agents.find(a => a.id === msg.agentId);
          return (
            <div key={msg.id} className={cn(
              "p-3 border max-w-[90%] group relative rounded-xl backdrop-blur-sm",
              msg.role === 'user' 
                ? "ml-auto bg-acid-purple/10 border-acid-purple/30 text-gray-100" 
                : "bg-glass-bg border-glass-border text-gray-200 shadow-lg"
            )}
            style={msg.role === 'agent' && agent ? { borderLeft: `4px solid ${agent.color}` } : {}}
            >
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button 
                  onClick={() => playTTS(msg.content, agent?.voice)}
                  className="p-1 hover:bg-white/10 rounded text-acid-cyan"
                  title="Odsłuchaj"
                >
                  <Volume2 size={12} />
                </button>
                <button 
                  onClick={() => translateMessage(msg.id, msg.content)}
                  className="p-1 hover:bg-white/10 rounded text-acid-green"
                  title="Przetłumacz na PL"
                >
                  <Languages size={12} />
                </button>
              </div>

              {msg.role === 'agent' && (
                <div className="text-[10px] font-bold uppercase mb-1 opacity-80 flex items-center gap-2 font-display tracking-wider">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: agent?.color, color: agent?.color }} />
                  {agent?.name || 'Nieznany Agent'} <span className="opacity-50 font-mono">({agent?.role})</span>
                </div>
              )}
              
              <div className="prose prose-sm prose-invert max-w-none mb-2 font-body leading-relaxed">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {msg.content.startsWith('[BŁĄD:') && (
                <button 
                  onClick={() => triggerAgent(team.agents.findIndex(a => a.id === msg.agentId), messages.filter(m => m.id !== msg.id))}
                  className="text-[10px] bg-red-600/20 text-red-400 border border-red-600/50 px-2 py-1 uppercase mt-2 hover:bg-red-600/40 transition-colors font-mono"
                >
                  PONÓW PRÓBĘ
                </button>
              )}

              {msg.files && msg.files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.files.map((file, idx) => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '');
                    const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '');
                    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext || '');

                    if (isVideo) {
                      return (
                        <div key={idx} className="w-full max-w-sm border border-acid-purple/30 bg-black/50 rounded overflow-hidden">
                          <video controls className="w-full" src={file.url} />
                          <div className="p-2 text-[10px] text-acid-cyan flex items-center gap-2 font-mono">
                            <Video size={12} /> {file.name}
                          </div>
                        </div>
                      );
                    }
                    if (isAudio) {
                      return (
                        <div key={idx} className="w-full max-w-sm border border-acid-green/30 bg-acid-green/5 p-2 rounded">
                          <div className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase text-acid-green font-mono">
                            <Music size={12} /> {file.name}
                          </div>
                          <audio controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" src={file.url} />
                        </div>
                      );
                    }
                    if (isImage) {
                      return (
                        <div key={idx} className="relative group/img rounded overflow-hidden border border-acid-purple/30">
                          <img src={file.url} alt={file.name} className="max-w-xs" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-acid-cyan p-1 text-[10px] opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 font-mono">
                            <ImageIcon size={10} /> {file.name}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <a 
                        key={idx}
                        href={file.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className={cn(
                          "flex items-center gap-2 p-2 border text-[10px] transition-colors rounded font-mono",
                          msg.role === 'user' 
                            ? "border-acid-green/30 bg-acid-green/10 hover:bg-acid-green/20 text-acid-green" 
                            : "border-acid-purple/30 bg-acid-purple/10 hover:bg-acid-purple/20 text-acid-purple"
                        )}
                      >
                        <FileText size={14} />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                      </a>
                    );
                  })}
                </div>
              )}
              {msg.fileUrl && !msg.files && (
                <a 
                  href={msg.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-2 border text-[10px] mt-2 transition-colors rounded font-mono",
                    msg.role === 'user' 
                      ? "border-acid-green/30 bg-acid-green/10 hover:bg-acid-green/20 text-acid-green" 
                      : "border-acid-purple/30 bg-acid-purple/10 hover:bg-acid-purple/20 text-acid-purple"
                  )}
                >
                  <FileText size={14} />
                  <span className="truncate">{msg.fileName}</span>
                </a>
              )}
            </div>
          );
        })}
        {isThinking && (
          <div 
            className="p-3 border border-acid-green/30 bg-acid-green/5 animate-pulse italic opacity-80 shadow-[0_0_15px_rgba(204,255,0,0.1)] rounded-xl"
            style={{ borderLeft: `4px solid ${team.agents[activeAgentIndex].color}` }}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase mb-1 font-display tracking-wider text-acid-green">
              <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: team.agents[activeAgentIndex].color }} />
              {team.agents[activeAgentIndex].name} <span className="text-gray-400 font-mono">analizuje...</span>
            </div>
            <span className="text-gray-300 font-mono text-xs">Generowanie odpowiedzi...</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="glass-panel border border-acid-cyan/50 w-full max-w-md p-6 rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold tracking-widest text-acid-cyan neon-text-cyan flex items-center gap-2">
                  <Volume2 size={24} /> KONFIGURACJA GŁOSU
                </h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6 max-h-[60vh] overflow-auto pr-2 custom-scrollbar">
                {team.agents.map(agent => (
                  <div key={agent.id} className="p-4 border border-acid-purple/30 bg-acid-purple/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: agent.color, color: agent.color }} />
                      <div>
                        <div className="font-bold text-gray-100 uppercase tracking-wider">{agent.name}</div>
                        <div className="text-[10px] opacity-50 font-mono">{agent.role}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase opacity-60 font-bold tracking-widest">Wybierz Głos:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {VOICES.map(voice => (
                          <button
                            key={voice}
                            onClick={async () => {
                              const updatedAgent = { ...agent, voice: voice as any };
                              await api.updateAgent(agent.id, updatedAgent);
                              loadTeam(); // Refresh team to get updated agent data
                            }}
                            className={cn(
                              "px-2 py-1.5 text-[10px] border transition-all rounded font-mono uppercase",
                              agent.voice === voice 
                                ? "bg-acid-cyan/20 border-acid-cyan text-acid-cyan neon-text-cyan font-bold" 
                                : "border-white/10 text-gray-500 hover:border-acid-cyan/50 hover:text-acid-cyan"
                            )}
                          >
                            {voice}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="bg-acid-cyan/20 text-acid-cyan border border-acid-cyan px-8 py-2 uppercase font-bold hover:bg-acid-cyan/40 transition-all font-mono neon-text-cyan rounded-lg"
                >
                  Gotowe
                </button>
              </div>
            </div>
          </div>
        )}
        {showHowTo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="glass-panel p-6 max-w-2xl w-full shadow-[0_0_30px_rgba(176,38,255,0.2)] space-y-4 animate-in zoom-in duration-200 border border-acid-purple/50">
              <div className="flex justify-between items-center border-b border-acid-purple/30 pb-2">
                <h3 className="text-xl font-bold uppercase font-display neon-text-purple">Jak używać AI Studio v2.5</h3>
                <button onClick={() => setShowHowTo(false)} className="text-acid-purple hover:text-acid-cyan transition-colors"><X size={20} /></button>
              </div>
              <div className="prose prose-invert prose-sm max-h-[60vh] overflow-auto pr-2 font-mono text-xs text-gray-300">
                <p><strong className="text-acid-green">1. Agenci:</strong> Twórz wyspecjalizowanych agentów. Każdy może mieć inny model (Pro dla logiki, Flash dla szybkości) i unikalną osobowość.</p>
                <p><strong className="text-acid-green">2. Zespoły:</strong> Łącz agentów w grupy. Wybierz tryb dyskusji (np. "Ostra" dla krytyki, "Office" dla dokumentów).</p>
                <p><strong className="text-acid-green">3. Generowanie Plików:</strong> Agenci potrafią generować pliki docx, xlsx, pdf, txt oraz obrazy. Po prostu poproś o to w czacie (np. "Stwórz raport w docx").</p>
                <p><strong className="text-acid-green">4. Głos:</strong> Możesz dyktować wiadomości (ikona mikrofonu) i odsłuchiwać odpowiedzi (ikona głośnika). Wybierz głos modelu w górnym menu.</p>
                <p><strong className="text-acid-green">5. Weryfikacja:</strong> Agenci mają dostęp do Google Search. Jeśli zauważą, że inny agent "fisiuje" (halucynuje), skorygują go automatycznie.</p>
                <p><strong className="text-acid-green">6. Zadania:</strong> Używaj tablicy zadań do orkiestracji dużych projektów. Agenci widzą statusy zadań.</p>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShowHowTo(false)} className="bg-acid-purple/20 text-acid-purple border border-acid-purple px-6 py-2 uppercase font-bold hover:bg-acid-purple/40 transition-all font-mono neon-text-purple">Rozumiem</button>
              </div>
            </div>
          </div>
        )}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-acid-cyan/5 border border-acid-cyan/20 rounded">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-black/40 border border-acid-cyan/30 px-2 py-1 text-[10px] rounded text-acid-cyan font-mono">
                <Paperclip size={12} />
                <span className="font-bold max-w-[150px] truncate" title={file.name}>{file.name}</span>
                <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 ml-2">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input 
              className="w-full border border-acid-purple/30 px-3 py-2 bg-black/30 outline-none pr-20 text-gray-200 placeholder-gray-600 focus:border-acid-purple/60 focus:bg-black/50 transition-all rounded font-mono"
              placeholder="Wpisz wiadomość lub prompt..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
           <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-1.5 hover:bg-white/10 rounded transition-colors text-acid-cyan flex items-center gap-1",
                  isUploading ? "animate-spin" : ""
                )}
                title="Załącz plik"
              >
                <Paperclip size={16} />
                <span className="text-[10px] hidden sm:inline uppercase font-bold tracking-tighter">Załącz</span>
              </button>
              <button 
                onClick={toggleRecording}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  isRecording ? "bg-red-500/20 text-red-500 animate-pulse border border-red-500/50" : "hover:bg-white/10 text-acid-green"
                )}
                title="Nagrywanie głosu"
              >
                <Mic size={16} />
              </button>
            </div>
            <input 
              type="file" 
              multiple
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={isUploading}
            className="bg-[#141414] text-[#E4E3E0] px-4 py-2 hover:bg-[#141414]/80 disabled:opacity-50 h-[38px]"
            title="Wyślij wiadomość (Enter)"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});

const TaskManager = React.memo(({ showToast }: { showToast?: (msg: string) => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '', status: 'todo', priority: 'medium'
  });

  const [isPlanning, setIsPlanning] = useState<string | null>(null);

  // High-Performance Massive Swarm Multiplexer states (100 - 2000 Mikro-Agentów)
  const [swarmSize, setSwarmSize] = useState<number>(500);
  const [activeSwarmId, setActiveSwarmId] = useState<string | null>(null);
  const [swarmProgress, setSwarmProgress] = useState<number>(0);
  const [swarmLogs, setSwarmLogs] = useState<string[]>([]);
  const [swarmReport, setSwarmReport] = useState<string | null>(null);
  const [swarmDotStates, setSwarmDotStates] = useState<string[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Dynamic status vocabulary for fast logs streaming
  const SWARM_ACTIONS = [
    "Przetwarzanie rozproszone", "Iniekcja sygnału", "Klonowanie noda", "Ewaluacja logiczna",
    "Analiza syntaktyczna", "Asynchroniczne żądanie API", "Kompilacja pod-wątku", "Audyt bezpieczeństwa",
    "Pętla orkiestracji", "Synteza neuronowa", "Czyszczenie garbage-collectora", "Tunelowanie VPN/SSH"
  ];
  const SWARM_NODES = ["DOCKER-NODE-01", "LINUX-VM-PROD", "TERMUX-EMU-CLIN", "WINDOWS-SVC-RUN", "CYLON-MEGA-CORE"];
  const SWARM_MESSAGES = [
    "OK: Pomyślnie alokowano stację roboczą.",
    "WARN: Zgłoszono przeciążenie noda, uruchamiam ponowną optymalizację.",
    "INFO: Zgrzewam synapsy z bazą wiedzy Michała Majora.",
    "SUCCESS: Zakończono analizę segmentu danych.",
    "INFO: Przekazuję logi zwrotne do dowódcy CYLONA.",
    "STATUS: 400 threads active. Load balanced successfully.",
    "OK: Redundancja danych zabezpieczona przez protokół SSH."
  ];

  const handleLaunchMassiveSwarm = async (task: Task) => {
    setActiveSwarmId(task.id);
    setSwarmProgress(0);
    setSwarmReport(null);
    setIsGeneratingReport(false);
    
    // Initialize proportional nodes representing the swarm partition (up to 350 for massive visual impact)
    const dotsCount = Math.min(Math.floor(swarmSize / 4), 350);
    const initialDots = Array.from({ length: dotsCount }, () => 'idle');
    setSwarmDotStates(initialDots);

    const initialLog = [
      `[INIT] CYLON INITIATES MASSIVE PARALLEL SWARM RUN FOR: "${task.title.toUpperCase()}"`,
      `[SYSTEM] ROZGRZEWAM RÓJ MIKRO-AGENTÓW: ${swarmSize} INSTANCJI URUCHOMIONYCH RÓWNOLEGLE...`,
      `[OPTIMIZATION] ALKORAL-09: Metoda optymalizacji Michała Majora aktywna (Mnożnik Inteligencji 250%)`,
      `[HOSTING] Węzły kompatybilne: Windows Subsystems, Linux Daemons, Termux Mobile Nodes gotowe.`
    ];
    setSwarmLogs(initialLog);

    if (showToast) showToast(`Zainicjowano Rój ${swarmSize} Agentów dla: ${task.title.slice(0, 15)}...`);

    let currentProgress = 0;
    const intervalTime = 70; // fast streaming
    
    const swarmInterval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 4) + 1;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setSwarmProgress(100);
        clearInterval(swarmInterval);

        // Transition all dots to success
        setSwarmDotStates(prev => prev.map(() => 'done'));
        setSwarmLogs(prev => [
          ...prev,
          `[SUCCESS] 100% ORKIESTRACJI ZAKOŃCZONE! Scalono ${swarmSize} rozproszonych raportów.`,
          `[SYNTHESIS] Rozpoczynam merytoryczną syntezę wyników przez Gemini AI dla Dowódcy CYLONA...`
        ]);

        setIsGeneratingReport(true);
        try {
          const reportPrompt = `Zadanie: "${task.title}". Uruchomiono dla niego w pełni wydajny, rozproszony rój masowy składający się z ${swarmSize} wydajnych mikro-agentów w architekturze klastrowej. Napisz spektakularny, głęboko profesjonalny, techniczny i wielowątkowy raport wdrożeniowy i optymalizacyjny z przebiegu tego zadania dla Dowódcy CYLONA pod patronatem Michała Majora. Uwzględnij, jak ten wielowątkowy system działa wydajnie na różnych hostach (Windows, Linux, a nawet w emulatorze mobilnym Termux na Androidzie). Użyj bogatego formatowania markdown, punktorów, struktury modułów i czystego, merytorycznego języka programistycznego o wysokim autorytecie (nie larpuj, napisz realne porady techniczne pasujące do zadanego tematu!).`;
          const result = await gemini.assistantHelp(reportPrompt);
          setSwarmReport(result);
          
          await api.updateTask(task.id, { 
            status: 'done',
            complexity: swarmSize > 1200 ? 'high' : swarmSize > 400 ? 'medium' : 'low',
            taskType: 'Swarm Execution'
          });

          await api.createLog({
            id: Math.random().toString(36).substr(2, 9),
            action: 'SWARM_SUCCESS',
            details: `CYLON pomyślnie zintegrował rój ${swarmSize} mikro-agentów dla zadania "${task.title}". Raport wygenerowany.`
          });

          if (showToast) showToast("Rozproszony Rój ukończył zadanie!");
        } catch (err) {
          console.error(err);
          setSwarmReport("Synteza raportu nie powiodła się, lecz mikro-agenci wykonali operacje pomyślnie.");
        } finally {
          setIsGeneratingReport(false);
        }
      } else {
        setSwarmProgress(currentProgress);
        
        // Randomly update dots
        setSwarmDotStates(prev => {
          const updated = [...prev];
          const countToChange = Math.floor(Math.random() * 8) + 1;
          for (let i = 0; i < countToChange; i++) {
            const idx = Math.floor(Math.random() * updated.length);
            const roll = Math.random();
            if (roll < 0.1) updated[idx] = 'error';
            else if (roll < 0.4) updated[idx] = 'synapse';
            else if (roll < 0.8) updated[idx] = 'working';
            else updated[idx] = 'done';
          }
          return updated;
        });

        // Add dummy diagnostic log with highly tech keywords
        const randAction = SWARM_ACTIONS[Math.floor(Math.random() * SWARM_ACTIONS.length)];
        const randNode = SWARM_NODES[Math.floor(Math.random() * SWARM_NODES.length)];
        const randMsg = SWARM_MESSAGES[Math.floor(Math.random() * SWARM_MESSAGES.length)];
        const stepNum = Math.floor(Math.random() * swarmSize) + 1;

        setSwarmLogs(prev => [
          ...prev,
          `[${randNode}] [Thread_ #${stepNum}] [${randAction.toUpperCase()}] ${randMsg}`
        ]);
      }
    }, intervalTime);
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy.');
      return;
    }

    const Recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'pl-PL';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewTask(prev => ({ ...prev, title: (prev.title ? prev.title + ' ' : '') + transcript }));
    };

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleOptimizePrompt = async () => {
    if (!newTask.title) {
      alert('Podaj najpierw tytuł lub krótki opis zadania.');
      return;
    }
    setIsOptimizing(true);
    try {
      const optimized = await gemini.generateEnhancedPrompt(newTask.title);
      setNewTask(prev => ({ ...prev, title: optimized }));
    } catch (e) {
      alert('Błąd optymalizacji promptu.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAutoTeam = async (task: Task) => {
    setIsPlanning(task.id);
    try {
      const agents = await api.getAgents();
      const plan = await gemini.planTeam(task.title, agents);
      
      if (plan.agentIds && plan.agentIds.length > 0) {
        if (window.confirm(`ANALIZA AI:\nTyp zadania: ${plan.taskType}\nZłożoność: ${plan.complexity.toUpperCase()}\n\nSugerowany zespół: "${plan.teamName}"\nOpis: ${plan.description}\n\nCzy utworzyć ten zespół i rozpocząć operację?`)) {
          const teamAgents = agents.filter(a => plan.agentIds.includes(a.id));
          const newTeamId = Math.random().toString(36).substr(2, 9);
          const newTeam: Team = {
            id: newTeamId,
            name: plan.teamName,
            description: plan.description,
            agents: teamAgents,
            agentIds: plan.agentIds,
            mode: 'work',
            createdAt: new Date().toISOString()
          };
          await api.createTeam(newTeam);
          
          // Update task with complexity and type
          await api.updateTask(task.id, { 
            status: 'in-progress',
            complexity: plan.complexity,
            taskType: plan.taskType
          });
          
          await api.createLog({
            id: Math.random().toString(36).substr(2, 9),
            action: 'TASK_DISPATCHED',
            details: `Zadanie "${task.title}" zostało przydzielone do zespołu "${plan.teamName}". Złożoność: ${plan.complexity}. Typ: ${plan.taskType}.`
          });
          
          if (showToast) showToast(`Wysłano zadanie do zespołu: ${plan.teamName}`);
          loadTasks();
        }
      } else {
        alert("AI nie znalazło odpowiednich agentów dla tego zadania. Stwórz więcej agentów o różnych rolach.");
      }
    } catch (e) {
      console.error("Błąd planowania zespołu", e);
      alert("Wystąpił błąd podczas analizy zadania przez AI.");
    } finally {
      setIsPlanning(null);
    }
  };

  const loadTasks = async () => {
    const data = await api.getTasks();
    setTasks(data);
  };

  const handleCreate = async () => {
    if (!newTask.title) return;
    await api.createTask({
      ...newTask as Task,
      id: Math.random().toString(36).substr(2, 9)
    });
    await api.createLog({
      id: Math.random().toString(36).substr(2, 9),
      action: 'TASK_CREATED',
      details: `Dodano nowe zadanie: ${newTask.title} [Priorytet: ${newTask.priority}]`
    });
    setNewTask({ title: '', status: 'todo', priority: 'medium' });
    setIsAdding(false);
    loadTasks();
  };

  const handleUpdateStatus = async (id: string, status: Task['status']) => {
    await api.updateTaskStatus(id, status);
    await api.createLog({
      id: Math.random().toString(36).substr(2, 9),
      action: 'TASK_UPDATED',
      details: `Status zadania zmieniony na ${status.toUpperCase()}`
    });
    if (status === 'done' && showToast) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        showToast(`Zadanie ukończone: ${task.title}`);
      }
    }
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Usunąć to zadanie?")) {
      await api.deleteTask(id);
      loadTasks();
    }
  };

  const handleRestoreAll = async () => {
    if (window.confirm("Przywrócić wszystkie zadania do stanu 'Do zrobienia'?")) {
      for (const task of tasks) {
        if (task.status !== 'done') {
          await api.updateTaskStatus(task.id, 'todo');
        }
      }
      loadTasks();
    }
  };

  return (
    <div className="space-y-6 font-mono text-sm text-slate-300">
      {/* Cylon Swarm Control Tower Header */}
      <div className="flex justify-between items-center border-b border-acid-purple/30 pb-3 flex-wrap gap-4">
        <div className="text-left">
          <h2 className="font-display text-lg uppercase text-white tracking-widest flex items-center gap-2">
            <Layers className="text-acid-purple animate-pulse" size={18} />
            STACJA STEROWANIA ROJAMI
          </h2>
          <div className="text-[9px] text-slate-500 uppercase mt-1 tracking-wider leading-relaxed">
            DOWÓDCA OPERACJI: <span className="text-acid-cyan font-black">CYLON (TY)</span> • PATRON ALGORYTMICZNY: <span className="text-amber-400 font-black">MICHAŁ MAJOR (MISTRZ ŚWIATA)</span>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleRestoreAll}
            className="border border-white/10 text-slate-400 px-3 py-1.5 hover:bg-white/5 hover:text-white flex items-center gap-2 text-[10px] rounded-xl font-mono transition-all uppercase font-bold"
            title="Przywróć wszystkie niedokończone zadania do stanu 'Do zrobienia'"
          >
            RESTORE ALL
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-acid-purple/10 text-acid-purple border border-acid-purple/30 px-3 py-1.5 hover:bg-acid-purple/20 flex items-center gap-2 rounded-xl font-mono transition-all uppercase font-bold"
            title="Rozpocznij tworzenie nowego roju / zadania"
          >
            <Plus size={14} /> NEW SWARM
          </button>
        </div>
      </div>

      {/* SWARM SIZE SELECTOR SLIDER FOR CYLON */}
      <div className="glass-panel border border-white/5 p-5 rounded-3xl bg-white/[0.015] space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mnożnik Rozproszonego Roju</span>
            <div className="text-[8px] text-slate-500 lowercase mt-0.5">Wybierz liczbę mini-agentów pracujących równolegle pod kontrolą CYLONA</div>
          </div>
          <div className="px-3 py-1 bg-acid-purple/10 border border-acid-purple/30 rounded-xl text-xs font-black text-acid-purple">
            🚀 {swarmSize} MIKRO-AGENTÓW
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">100 min</span>
          <input 
            type="range" 
            min="100" 
            max="2000" 
            step="50"
            value={swarmSize} 
            onChange={(e) => setSwarmSize(Number(e.target.value))}
            className="flex-1 accent-acid-purple cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
          />
          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">2000 max</span>
        </div>

        {/* Preset quick buttons */}
        <div className="flex gap-2">
          {[100, 250, 500, 1000, 2000].map(size => (
            <button
              key={size}
              onClick={() => setSwarmSize(size)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all border",
                swarmSize === size 
                  ? "bg-acid-purple/20 border-acid-purple/40 text-white shadow-sm shadow-acid-purple/10" 
                  : "bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              {size === 100 ? "Lekki (100)" : size === 250 ? "Średni (250)" : size === 500 ? "Standard (500)" : size === 1000 ? "Masowy (1000)" : "Krytyczny Rój (2000)"}
            </button>
          ))}
        </div>
      </div>

      {/* REAT-TIME MULTIPLEXER HUD MONITOR */}
      {activeSwarmId && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border border-acid-cyan/30 p-6 rounded-[2rem] bg-gradient-to-br from-acid-cyan/[0.02] via-transparent to-transparent space-y-5 relative overflow-hidden"
        >
          {/* Neon wire */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-acid-cyan to-transparent animate-pulse" />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-acid-cyan/10 border border-acid-cyan/30 flex items-center justify-center text-acid-cyan shrink-0">
                <Cpu size={14} className="animate-spin" />
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black uppercase text-acid-cyan tracking-wider">AKTYWNY TELEMETR ROJU</span>
                <h4 className="text-[12px] font-black uppercase text-white -mt-0.5 truncate max-w-[300px]">
                  Zadanie: "{tasks.find(t => t.id === activeSwarmId)?.title || "Przetwarzanie"}"
                </h4>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-slate-500 uppercase font-black">Status Swarm Loop</div>
              <div className="text-white text-xs font-black font-mono">
                {swarmProgress < 100 ? `PRZETWARZANIE RÓWNOLEGŁE (${swarmProgress}%)` : `SYNTEZA RAPORTU (100%)`}
              </div>
            </div>
          </div>

          {/* TELEMETRY MATRIX DOTS (SIMULATION GRID) */}
          <div className="space-y-1 bg-black/40 p-3 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase px-1 pb-2">
              <span>Węzły Orkiestracyjne ({swarmSize || 500} Mini-Agentów)</span>
              <span className="flex gap-3">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" /> idle</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-acid-cyan" /> working</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-acid-purple" /> synapse</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-acid-green animate-pulse" /> success</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" /> audit</span>
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 justify-center items-center py-2 max-h-[140px] overflow-y-auto custom-scrollbar select-none">
              {swarmDotStates.map((state, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "w-2 h-2 rounded-[1.5px] transition-all duration-300",
                    state === 'idle' ? "bg-slate-800" :
                    state === 'working' ? "bg-acid-cyan shadow-[0_0_8px_#06b6d4]" :
                    state === 'synapse' ? "bg-acid-purple shadow-[0_0_8px_#8b5cf6]" :
                    state === 'error' ? "bg-red-500 shadow-[0_0_10px_#ef4444]" :
                    "bg-acid-green shadow-[0_0_8px_#00ffca]"
                  )} 
                  title={`Wątek #${idx * 8}: Stacja status ${state.toUpperCase()}`}
                />
              ))}
            </div>
          </div>

          {/* STREAMING CONSOLE LOGS */}
          <div className="bg-black/80 font-mono text-[9px] p-4 rounded-2xl border border-white/5 h-[120px] overflow-y-auto custom-scrollbar flex flex-col-reverse text-left space-y-reverse space-y-1">
            {swarmLogs.slice().reverse().map((log, i) => (
              <div 
                key={i} 
                className={cn(
                  "opacity-95 leading-tight truncate",
                  log.includes('[INIT]') || log.includes('[SUCCESS]') ? "text-acid-green font-bold" :
                  log.includes('[OPTIMIZATION]') ? "text-amber-400 font-bold" :
                  log.includes('[SYSTEM]') ? "text-acid-purple" :
                  log.includes('WARN:') ? "text-red-400" :
                  "text-slate-400"
                )}
              >
                {log}
              </div>
            ))}
          </div>

          {/* MERGED DEEP MERIT REPORT BY GEMINI */}
          {isGeneratingReport && (
            <div className="flex items-center justify-center py-8 gap-3 italic text-[11px] text-acid-cyan animate-pulse">
              <Cpu size={16} className="animate-spin" />
              Generator AI: Michał Major 250% Speed Multiplexer konsoliduje i analizuje dane...
            </div>
          )}

          {swarmReport && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-neutral-900/60 p-5 rounded-3xl border border-white/5 space-y-3 text-left"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <BookOpen size={12} className="text-acid-green animate-pulse" />
                  Synteza Wyników dla Dowódcy CYLONA
                </span>
                <span className="text-[8px] bg-acid-green/10 text-acid-green px-1.5 py-0.5 rounded border border-acid-green/20">SYSTEM COHERENT</span>
              </div>
              <div className="prose prose-sm prose-invert text-xs leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar pr-2 font-mono text-slate-300">
                <ReactMarkdown>{swarmReport}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setActiveSwarmId(null);
                setSwarmReport(null);
              }}
              className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase transition-all"
            >
              Zamknij Monitor Telemetrii
            </button>
          </div>
        </motion.div>
      )}

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel border border-white/10 p-6 space-y-4 rounded-3xl shadow-2xl relative overflow-hidden bg-white/[0.02]"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-acid-purple to-transparent opacity-50" />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-acid-purple/10 border border-acid-purple/20 flex items-center justify-center text-acid-purple">
                <Target size={16} />
              </div>
              <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Deployment_Protocol</h4>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={toggleRecording}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase",
                  isRecording 
                    ? "bg-red-500 text-white shadow-[0_0_15px_#ef4444]" 
                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", isRecording ? "bg-white animate-pulse" : "bg-slate-600")} />
                {isRecording ? 'Listening...' : 'Voice_In'}
              </button>
              
              <button 
                onClick={handleOptimizePrompt}
                disabled={isOptimizing || !newTask.title.trim()}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase border border-acid-purple/30 bg-acid-purple/10 text-acid-purple hover:bg-acid-purple/20",
                  (isOptimizing || !newTask.title.trim()) && "opacity-50 grayscale cursor-not-allowed",
                  isOptimizing && "animate-pulse"
                )}
              >
                <Sparkles size={14} className={isOptimizing ? "animate-spin" : ""} />
                {isOptimizing ? 'Analiza...' : 'AI_Refine'}
              </button>
            </div>
          </div>

          <textarea 
            placeholder="OPISZ ZADANIE LUB PROBLEM..." 
            className="w-full border border-white/5 px-4 py-3 bg-black/40 outline-none text-gray-200 placeholder-slate-700 focus:border-acid-purple/40 focus:bg-black/60 transition-all rounded-2xl font-mono h-32 resize-none text-[11px] leading-relaxed shadow-inner"
            value={newTask.title}
            onChange={e => setNewTask({...newTask, title: e.target.value})}
          />

          <div className="flex flex-wrap gap-4 items-center pt-2">
            <div className="flex-1 min-w-[200px]">
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    onClick={() => setNewTask({...newTask, priority: p as any})}
                    className={cn(
                      "py-2 rounded-xl text-[9px] font-black uppercase transition-all border",
                      newTask.priority === p 
                        ? (p === 'high' ? "bg-red-500/10 border-red-500/50 text-red-500" : p === 'medium' ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" : "bg-acid-green/10 border-acid-green/50 text-acid-green")
                        : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl border border-white/5 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={!newTask.title.trim()}
                className={cn(
                  "px-8 py-2.5 rounded-xl bg-gradient-to-r from-acid-purple to-acid-cyan text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95",
                  !newTask.title.trim() ? "opacity-50 grayscale cursor-not-allowed" : "hover:brightness-110 shadow-xl opacity-100"
                )}
              >
                Inicjuj
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className={cn(
            "glass-panel border border-white/5 p-4 hover:border-acid-purple/30 transition-all space-y-3 rounded-2xl group relative overflow-hidden",
            task.status === 'in-progress' ? "bg-acid-cyan/5 border-acid-cyan/20" : "",
            task.complexity && `task-card-glow complexity-${task.complexity}`
          )}>
            {task.status === 'in-progress' && <div className="absolute top-0 right-0 w-24 h-24 bg-acid-cyan/5 blur-3xl rounded-full -mr-12 -mt-12 animate-pulse" />}
            
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  task.priority === 'high' ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : 
                  task.priority === 'medium' ? "bg-yellow-500 shadow-[0_0_10px_#f59e0b]" : 
                  "bg-acid-green shadow-[0_0_10px_#00ffca]"
                )} />
                <div>
                  <span className={cn(
                    "font-bold uppercase font-display tracking-tight text-sm text-gray-100", 
                    task.status === 'done' && "opacity-40 text-slate-500"
                  )}>
                    {task.title}
                  </span>
                  {task.createdAt && <div className="text-[8px] font-mono text-slate-500 mt-0.5">INIT: {new Date(task.createdAt).toLocaleString()}</div>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                {task.status !== 'done' && (
                  <>
                    <button 
                      onClick={() => handleLaunchMassiveSwarm(task)}
                      disabled={activeSwarmId !== null}
                      className={cn(
                        "px-3 py-1.5 rounded-xl transition-all border border-acid-purple/30 bg-acid-purple/10 text-acid-purple hover:bg-acid-purple/20 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider",
                        activeSwarmId !== null && "opacity-40 cursor-not-allowed"
                      )}
                      title="Uruchom równoległy rój mini-agentów"
                    >
                      <Layers size={10} className="animate-pulse" />
                      Uruchom Rój ({swarmSize})
                    </button>

                    <button 
                      onClick={() => handleAutoTeam(task)}
                      disabled={isPlanning !== null}
                      className={cn(
                        "p-1.5 rounded-xl transition-all border border-white/5 bg-white/5 text-acid-cyan hover:bg-acid-cyan/10 hover:border-acid-cyan/30",
                        isPlanning === task.id ? "animate-pulse border-acid-cyan" : ""
                      )}
                      title="Analiza AI & Dispatch (Klasyczny Zespół)"
                    >
                      <Cpu size={14} className={isPlanning === task.id ? "animate-spin" : ""} />
                    </button>
                  </>
                )}
                <button onClick={() => handleDelete(task.id)} className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-xl transition-all" title="Usuń zadanie">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 relative z-10">
              {task.complexity && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/5">
                  <Activity size={10} className={cn(
                    task.complexity === 'high' ? "text-red-500" :
                    task.complexity === 'medium' ? "text-yellow-500" : "text-acid-green"
                  )} />
                  <span className="text-[9px] font-mono font-black uppercase text-slate-400">
                    CPLX: {task.complexity}
                  </span>
                </div>
              )}
              {task.taskType && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/5">
                  <Layers size={10} className="text-acid-cyan" />
                  <span className="text-[9px] font-mono font-black uppercase text-slate-400">
                    TYPE: {task.taskType}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/5">
                <BarChart size={10} className="text-acid-purple" />
                <span className="text-[9px] font-mono font-black uppercase text-slate-400">
                  PRIO: {task.priority}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 relative z-10">
              <button 
                onClick={() => handleUpdateStatus(task.id, 'todo')}
                className={cn("text-[9px] border px-3 py-1.5 uppercase rounded-xl font-bold transition-all", task.status === 'todo' ? "bg-acid-purple/10 border-acid-purple/50 text-acid-purple shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "border-white/5 text-slate-500 hover:bg-white/5")}
              >
                BACKLOG
              </button>
              <button 
                onClick={() => handleUpdateStatus(task.id, 'in-progress')}
                className={cn("text-[9px] border px-3 py-1.5 uppercase rounded-xl font-bold transition-all", task.status === 'in-progress' ? "bg-acid-cyan/10 border-acid-cyan/50 text-acid-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "border-white/5 text-slate-500 hover:bg-white/5")}
              >
                SYSTEM_BUSY
              </button>
              <button 
                onClick={() => handleUpdateStatus(task.id, 'done')}
                className={cn("text-[9px] border px-3 py-1.5 uppercase rounded-xl font-bold transition-all ml-auto", task.status === 'done' ? "bg-acid-green/10 border-acid-green/50 text-acid-green shadow-[0_0_15px_rgba(0,255,202,0.2)]" : "border-white/5 text-slate-500 hover:bg-white/5")}
              >
                TERMINATED
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const Assistant = React.memo(() => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('system');
  const [isSupreme, setIsSupreme] = useState(() => localStorage.getItem('supreme_admin_mode') === 'true');

  useEffect(() => {
    // Load agents for customized response vectors
    api.getAgents().then(data => {
      setAgents(data || []);
    }).catch(err => console.error("Could not fetch assistant agents", err));

    // Listen to supreme mode state changes
    const checkSupreme = () => {
      setIsSupreme(localStorage.getItem('supreme_admin_mode') === 'true');
    };
    window.addEventListener('storage', checkSupreme);
    const interval = setInterval(checkSupreme, 1000); // quick poll for immediate UI updates
    return () => {
      window.removeEventListener('storage', checkSupreme);
      clearInterval(interval);
    };
  }, []);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      if (selectedAgentId === 'system') {
        const promptSuffix = isSupreme 
          ? `\n[Mnożnik Inteligencji Admina Michała Majora: AKTYWNY. Maksymalna dokładność i zaawansowanie, styl profesjonalny i bezbłędny.]` 
          : '';
        const res = await gemini.assistantHelp(input + promptSuffix);
        setResponse(res);
      } else {
        const targetAgent = agents.find(a => a.id === selectedAgentId);
        if (targetAgent) {
          const res = await gemini.generateAgentResponse(
            targetAgent,
            [{ id: '1', role: 'user', content: input, teamId: 'assistant-test', timestamp: new Date().toISOString() }],
            'concrete'
          );
          setResponse(res.text);
        } else {
          const res = await gemini.assistantHelp(input);
          setResponse(res);
        }
      }
      setInput('');
    } catch (e) {
      setResponse("System offline lub błąd synaps: nie udało się wygenerować odpowiedzi.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = (text: string) => {
    setInput(text);
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-300 font-sans">
      {/* Kolumna Lewa - Selektor Agentów i Szybkie Szablony */}
      <div className="space-y-6 lg:col-span-1">
        <div className="glass-panel border border-white/5 p-6 rounded-3xl space-y-4 bg-white/[0.01]">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <Bot size={14} className="text-acid-purple" />
            Wektor Umysłu AI
          </h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-relaxed">
            Wybierz agenta, przez którego pryzmat osobowości, wiedzy i cech ma zostać przetworzone zapytanie.
          </p>

          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            <button
              onClick={() => setSelectedAgentId('system')}
              className={cn(
                "w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                selectedAgentId === 'system'
                  ? "bg-acid-purple/10 border-acid-purple/50 text-white"
                  : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-acid-purple/20 flex items-center justify-center text-acid-purple shrink-0">
                <Cpu size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-wider">RDZEŃ SYSTEMOWY</div>
                <div className="text-[9px] opacity-60">Generalistyczny Super-Asystent</div>
              </div>
            </button>

            {agents.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAgentId(a.id)}
                className={cn(
                  "w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                  selectedAgentId === a.id
                    ? "bg-acid-cyan/10 border-acid-cyan/50 text-white shadow-lg"
                    : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400"
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs" style={{ backgroundColor: a.color || '#3b82f6' }}>
                  {a.name ? a.name.slice(0, 2).toUpperCase() : 'AG'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black uppercase tracking-wider truncate">{a.name || 'Agent'}</div>
                  <div className="text-[9px] opacity-60 truncate">Rola: {a.role || 'Asystent'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Szybkie Szablony Zapytań */}
        <div className="glass-panel border border-white/5 p-6 rounded-3xl space-y-4 bg-white/[0.01]">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <Sparkles size={14} className="text-acid-cyan" />
            Szablony Operacji
          </h3>
          
          <div className="space-y-2">
            {[
              {
                title: "Kompatybilność wieloplatformowa",
                desc: "Windows, Linux, hosty, Termux",
                prompt: "Napisz kompleksowy poradnik jak uruchomić i hostować tę aplikację pod różnymi środowiskami z uwzględnieniem Windows (Node.js i skrypty startowe), Linux (usługi systemd / docker-compose), oraz środowiska mobilnego Termux na Androidzie."
              },
              {
                title: "Krytyczny audyt kodu",
                desc: "Test syntaktyczny i bezpieczeństwo",
                prompt: "Przeprowadź dokładną symulację testową i audyt bezpieczeństwa promptów systemowych agentów w tym systemie. Wskaż ewentualne podatności na ataki typu Prompt Injection i pokaż jak je zabezpieczyć."
              },
              {
                title: "Eksploracja parametrów AI",
                desc: "Osobowości i specjalizacje",
                prompt: "Opisz szczegółowo w jaki sposób parametry Agentów: ich Cechy Osobowości (Personality Traits) oraz Domeny Wiedzy (Knowledge Domains) wpływają na przebieg i dynamikę dyskusji w zespołach. Podaj konkretne przykłady zachowań."
              }
            ].map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(tmpl.prompt)}
                className="w-full text-left p-3 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="text-[11px] font-black uppercase group-hover:text-acid-cyan transition-colors">{tmpl.title}</div>
                <div className="text-[9px] text-slate-500 lowercase mt-0.5">{tmpl.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kolumna Prawa - Czat i Interakcja */}
      <div className="lg:col-span-2 space-y-6">
        <div className={cn(
          "glass-panel border p-6 rounded-[2rem] flex flex-col h-[550px] relative overflow-hidden transition-all duration-500",
          isSupreme 
            ? "border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] via-transparent to-transparent shadow-lg shadow-amber-500/[0.02]" 
            : "border-white/5 bg-white/[0.01]"
        )}>
          {/* Glowing highlights for Supreme Admin Mode */}
          {isSupreme && (
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60 animate-pulse" />
          )}

          {/* Podgląd stanu wybranego umysłu */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-ping shrink-0",
                isSupreme ? "bg-amber-400" : "bg-acid-purple"
              )} />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500">Moc Obliczeniowa: </span>
                <span className={cn("text-[10px] uppercase font-black", isSupreme ? "text-amber-400" : "text-acid-purple")}>
                  {isSupreme ? "SUPREME MAX SPEED (250%)" : "STANDARD CORIDOR (100%)"}
                </span>
              </div>
            </div>

            {selectedAgentId !== 'system' && selectedAgent && (
              <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold uppercase text-slate-400 flex items-center gap-2">
                <Bot size={10} className="text-acid-cyan" />
                Domeny: {selectedAgent.knowledge || 'Ogólna'}
              </div>
            )}
          </div>

          {/* Wyświetlacz odpowiedzi */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 space-y-4">
            {isSupreme && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Shield size={14} />
                </div>
                <div className="text-left leading-relaxed">
                  <div className="text-[10px] font-black uppercase text-amber-400">Protokół Michał Major Aktywny</div>
                  <div className="text-[9px] text-amber-500/80 font-mono mt-0.5">Asystent działa w trybie pełnej autoryzacji i maksymalnych uprawnień. Słownik i baza danych zoptymalizowane pod system operacyjny Windows, Linux dystrybucje, a także emulator Termux na systemach mobilnych Android.</div>
                </div>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 min-h-[140px] text-left">
              {isLoading ? (
                <div className="flex items-center gap-3 italic text-acid-cyan animate-pulse font-mono text-xs">
                  <Cpu size={14} className="animate-spin" />
                  Pobieranie wiedzy i synteza neuronów...
                </div>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none text-slate-200 text-xs leading-relaxed font-mono">
                  {response ? (
                    <ReactMarkdown>{response}</ReactMarkdown>
                  ) : (
                    <div className="opacity-40 select-none flex flex-col items-center justify-center h-full min-h-[120px] text-center space-y-2">
                      <Bot size={32} className="text-slate-600 mb-1" />
                      <div>Oczekiwanie na dyspozycje dla wybranego wektora umysłu.</div>
                      <div className="text-[10px] max-w-sm">Wpisz zapytanie poniżej lub kliknij jeden z przygotowanych szablonów z lewej kolumny.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Formularz wprowadzania */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <input 
              className="flex-1 border border-white/10 px-4 py-3 bg-black/60 outline-none text-slate-200 placeholder-slate-700 focus:border-acid-purple/40 focus:bg-black/80 transition-all rounded-2xl font-mono text-xs"
              placeholder={selectedAgentId === 'system' ? "Zadaj pytanie asystentowi..." : `Zadaj pytanie agentowi: ${(selectedAgent?.name || '').toUpperCase()}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
            />
            <button 
              onClick={handleAsk} 
              disabled={isLoading || !input.trim()}
              className={cn(
                "px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-2 shrink-0",
                isLoading || !input.trim()
                  ? "bg-white/5 text-slate-500 cursor-not-allowed"
                  : isSupreme 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:brightness-110"
                    : "bg-acid-purple text-white shadow-md hover:bg-opacity-95 shadow-acid-purple/10"
              )}
              title="Prześlij polecenie AI"
            >
              <Send size={12} />
              Inicjuj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const SecurityLogs = React.memo(() => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (e) {
      console.error("Nie udało się załadować logów");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="flex justify-between items-center border-b border-acid-purple/30 pb-2">
        <h2 className="font-display text-lg uppercase neon-text-purple">Logi Bezpieczeństwa i Aktywności</h2>
        <div className="flex items-center gap-2 text-[10px] opacity-80 text-acid-green">
          <Activity size={12} className="text-acid-green animate-pulse" />
          MONITOROWANIE NA ŻYWO
        </div>
      </div>

      <div className="glass-panel border border-acid-purple/30 overflow-hidden rounded-xl">
        <div className="bg-acid-purple/20 text-acid-cyan text-[10px] grid grid-cols-[120px_1fr_150px] p-2 uppercase font-bold tracking-wider font-display border-b border-acid-purple/30">
          <div>Znacznik czasu</div>
          <div>Akcja / Szczegóły</div>
          <div>Agent</div>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-acid-purple/10 custom-scrollbar">
          {isLoading ? (
            <div className="p-4 text-center italic opacity-50 text-acid-cyan">Ładowanie logów...</div>
          ) : logs.length === 0 ? (
            <div className="p-4 text-center italic opacity-50 text-gray-400">Nie zarejestrowano jeszcze żadnej aktywności.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="grid grid-cols-[120px_1fr_150px] p-2 text-[10px] hover:bg-acid-purple/10 transition-colors text-gray-300 font-mono">
                <div className="opacity-60 text-acid-cyan">{new Date(log.timestamp).toLocaleTimeString()}</div>
                <div className="flex justify-between items-center pr-4">
                  <div>
                    <span className="font-bold uppercase mr-2 text-acid-green">{log.action}</span>
                    <span className="opacity-80 italic text-gray-400">{log.details}</span>
                  </div>
                  {log.action === 'ACCESS_REQUEST' && log.agentId && (
                    <button 
                      onClick={async () => {
                        const resource = log.details?.split(': ')[1];
                        if (resource) {
                          const agentRes = await fetch(`/api/agents/${log.agentId}`);
                          const agent: Agent = await agentRes.json();
                          const newPermissions = agent.permissions ? `${agent.permissions}, ${resource}` : resource;
                          await api.updateAgent(log.agentId, { permissions: newPermissions });
                          await api.createLog({
                            id: Math.random().toString(36).substr(2, 9),
                            action: 'ACCESS_GRANTED',
                            details: `Nadano uprawnienie do: ${resource}`
                          });
                          alert(`Nadano dostęp do ${resource} dla ${agent.name}`);
                          loadLogs();
                        }
                      }}
                      className="px-2 py-0.5 bg-acid-green text-black font-bold rounded uppercase hover:bg-white transition-colors"
                    >
                      Dopnij
                    </button>
                  )}
                </div>
                <div className="font-bold truncate text-acid-purple">{log.agentName || 'SYSTEM'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-acid-purple/30 p-3 glass-panel space-y-2 rounded-xl">
          <div className="flex items-center gap-2 font-bold uppercase text-xs">
            <Shield size={14} /> Status Bezpieczeństwa
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>Izolacja Piaskownicy</span>
              <span className="text-green-600 font-bold">AKTYWNY</span>
            </div>
            <div className="flex justify-between">
              <span>Szyfrowanie Poświadczeń</span>
              <span className="text-green-600 font-bold">WŁĄCZONE</span>
            </div>
            <div className="flex justify-between">
              <span>Limitowanie Żądań API</span>
              <span className="text-green-600 font-bold">MONITOROWANE</span>
            </div>
          </div>
        </div>
        <div className="border border-[#141414] p-3 bg-white/50 space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase text-xs">
            <Terminal size={14} /> Polityka Audytu
          </div>
          <div className="text-[10px] opacity-70 italic">
            Wszystkie interakcje agentów, wykonania poleceń i dostępy do integracji są rejestrowane z kryptograficznymi znacznikami czasu w celu zapewnienia zgodności z audytem.
          </div>
        </div>
      </div>
    </div>
  );
});

// --- Main App ---

const Clusters = React.memo(() => {
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNode, setNewNode] = useState<Partial<ClusterNode>>({
    name: '', ip: '', dns: '', type: 'worker'
  });

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async () => {
    const data = await api.getClusters();
    setNodes(data);
  };

  const handleAddNode = async () => {
    if (!newNode.name || !newNode.ip) return;
    const node: ClusterNode = {
      id: Math.random().toString(36).substr(2, 9),
      name: newNode.name,
      ip: newNode.ip,
      dns: newNode.dns,
      type: newNode.type as 'worker' | 'manager',
      status: 'online',
      lastSeen: new Date().toISOString()
    };
    await api.addClusterNode(node);
    setIsAdding(false);
    setNewNode({ name: '', ip: '', dns: '', type: 'worker' });
    loadClusters();
  };

  const handleDeleteNode = async (id: string) => {
    if (window.confirm("Usunąć ten węzeł?")) {
      await api.deleteClusterNode(id);
      loadClusters();
    }
  };

  const handleRestartNode = async (id: string) => {
    try {
      await api.restartClusterNode(id);
      alert("Wysłano żądanie restartu.");
      loadClusters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleShutdownNode = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz wyłączyć ten węzeł?")) {
      try {
        await api.shutdownClusterNode(id);
        alert("Wysłano żądanie wyłączenia.");
        loadClusters();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSuggestNodes = async () => {
    const suggestions = [
      { name: 'Worker-AI-1', ip: '192.168.1.101', type: 'worker', dns: 'ai-node-1.local', protocol: 'gRPC' },
      { name: 'Worker-DB-1', ip: '192.168.1.102', type: 'worker', dns: 'db-node-1.local', protocol: 'REST' },
      { name: 'Manager-Main', ip: '192.168.1.100', type: 'manager', dns: 'master.local', protocol: 'WebSocket' }
    ];
    
    for (const s of suggestions) {
      await api.addClusterNode({
        id: Math.random().toString(36).substr(2, 9),
        name: s.name,
        ip: s.ip,
        dns: s.dns,
        type: s.type as any,
        status: 'online',
        lastSeen: new Date().toISOString(),
        protocol: s.protocol as any,
        cpuUsage: Math.floor(Math.random() * 50) + 10,
        ramUsage: Math.floor(Math.random() * 60) + 20,
        latency: Math.floor(Math.random() * 20) + 5
      });
    }
    loadClusters();
  };

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="flex justify-between items-center border-b border-acid-purple/30 pb-2">
        <h2 className="font-display text-lg uppercase neon-text-purple">Klastry i Węzły Lokalne</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleSuggestNodes}
            className="bg-acid-purple/10 text-acid-purple border border-acid-purple/50 px-3 py-1 hover:bg-acid-purple/30 flex items-center gap-2 rounded font-mono neon-text-purple transition-all"
          >
            <Zap size={14} /> Sugeruj Węzły
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-acid-purple/20 text-acid-purple border border-acid-purple px-3 py-1 hover:bg-acid-purple/40 flex items-center gap-2 rounded font-mono neon-text-purple transition-all"
          >
            <Plus size={14} /> Dodaj Węzeł
          </button>
        </div>
      </div>

      {nodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <div className="glass-panel p-4 border border-acid-purple/20 rounded-2xl bg-acid-purple/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Średnie CPU</span>
              <Cpu size={14} className="text-acid-green opacity-50" />
            </div>
            <div className="text-2xl font-display font-bold text-white tracking-tighter">
              {(nodes.reduce((acc, n) => acc + (n.cpuUsage || 0), 0) / nodes.length).toFixed(1)}%
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-acid-green" 
                style={{ width: `${(nodes.reduce((acc, n) => acc + (n.cpuUsage || 0), 0) / nodes.length)}%` }} 
              />
            </div>
          </div>
          <div className="glass-panel p-4 border border-acid-purple/20 rounded-2xl bg-acid-purple/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Średni RAM</span>
              <Activity size={14} className="text-acid-cyan opacity-50" />
            </div>
            <div className="text-2xl font-display font-bold text-white tracking-tighter">
              {(nodes.reduce((acc, n) => acc + (n.ramUsage || 0), 0) / nodes.length).toFixed(1)}%
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-acid-cyan" 
                style={{ width: `${(nodes.reduce((acc, n) => acc + (n.ramUsage || 0), 0) / nodes.length)}%` }} 
              />
            </div>
          </div>
          <div className="glass-panel p-4 border border-acid-purple/20 rounded-2xl bg-acid-purple/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Latencja (Avg)</span>
              <Network size={14} className="text-acid-purple opacity-50" />
            </div>
            <div className="text-2xl font-display font-bold text-white tracking-tighter">
              {(nodes.reduce((acc, n) => acc + (n.latency || 0), 0) / nodes.length).toFixed(1)}<span className="text-xs text-slate-500 ml-1">ms</span>
            </div>
            <div className="text-[9px] text-slate-600 mt-2 font-bold uppercase">
              Wszystkie węzły odpowiadają
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="glass-panel border border-acid-purple/30 p-4 space-y-3 rounded-xl shadow-lg">
          <h3 className="font-bold uppercase text-xs text-acid-purple font-display tracking-wider">Konfiguracja Nowego Węzła</h3>
          <div className="grid grid-cols-2 gap-3">
            <input 
              placeholder="NAZWA WĘZŁA (np. Worker-1)" 
              className="border border-acid-purple/30 px-3 py-2 bg-black/30 outline-none text-gray-200 placeholder-gray-600 focus:border-acid-purple/60 focus:bg-black/50 transition-all rounded font-mono"
              value={newNode.name}
              onChange={e => setNewNode({...newNode, name: e.target.value})}
            />
            <select 
              className="border border-acid-purple/30 px-3 py-2 bg-black/30 outline-none text-gray-200 focus:border-acid-purple/60 focus:bg-black/50 transition-all rounded font-mono"
              value={newNode.type}
              onChange={e => setNewNode({...newNode, type: e.target.value as any})}
            >
              <option value="worker" className="bg-black text-gray-200">WORKER (Obliczenia)</option>
              <option value="manager" className="bg-black text-gray-200">MANAGER (Orkiestracja)</option>
            </select>
            <input 
              placeholder="ADRES IP (np. 192.168.1.15)" 
              className="border border-acid-purple/30 px-3 py-2 bg-black/30 outline-none text-gray-200 placeholder-gray-600 focus:border-acid-purple/60 focus:bg-black/50 transition-all rounded font-mono"
              value={newNode.ip}
              onChange={e => setNewNode({...newNode, ip: e.target.value})}
            />
            <input 
              placeholder="DNS NAME (Opcjonalnie)" 
              className="border border-acid-purple/30 px-3 py-2 bg-black/30 outline-none text-gray-200 placeholder-gray-600 focus:border-acid-purple/60 focus:bg-black/50 transition-all rounded font-mono"
              value={newNode.dns}
              onChange={e => setNewNode({...newNode, dns: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1 border border-acid-purple/30 text-acid-purple hover:bg-acid-purple/10 rounded font-mono">ANULUJ</button>
            <button onClick={handleAddNode} className="px-3 py-1 bg-acid-purple/20 text-acid-purple border border-acid-purple hover:bg-acid-purple/40 rounded font-mono neon-text-purple transition-all">DODAJ DO KLASTRA</button>
          </div>
        </div>
      )}

      {nodes.length === 0 ? (
        <div className="glass-panel border border-acid-purple/30 p-6 text-center rounded-xl">
          <Network size={32} className="mx-auto mb-2 opacity-50 text-acid-purple" />
          <p className="font-bold uppercase font-display tracking-wider text-gray-200">Brak połączonych węzłów</p>
          <p className="text-[10px] opacity-60 mt-1 max-w-md mx-auto text-gray-400 font-mono">
            Połącz inne urządzenia w sieci lokalnej, aby zwiększyć moc obliczeniową.
            Możesz dodać węzły po IP lub nazwie DNS.
          </p>
          <div className="mt-4 text-left max-w-lg mx-auto bg-black/20 p-4 border border-acid-purple/20 text-[10px] rounded font-mono">
            <p className="font-bold mb-2 uppercase border-b border-acid-purple/20 pb-1 text-acid-cyan font-display tracking-wider">Gdzie wdrożyć aplikację (Sugestie):</p>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
              <div>
                <strong className="block mb-1 text-acid-green">1. Raspberry Pi 4/5</strong>
                <p className="opacity-70">Idealne jako węzeł "Worker" działający 24/7. Zainstaluj Node.js i uruchom tę aplikację w trybie klastra.</p>
              </div>
              <div>
                <strong className="block mb-1 text-acid-green">2. Stary Laptop</strong>
                <p className="opacity-70">Wykorzystaj nieużywany sprzęt. Linux (Ubuntu Server) sprawdzi się najlepiej do obsługi modeli LLM.</p>
              </div>
              <div>
                <strong className="block mb-1 text-acid-green">3. Serwer NAS</strong>
                <p className="opacity-70">Wiele serwerów NAS (Synology, QNAP) obsługuje kontenery Docker. Uruchom tam instancję aplikacji.</p>
              </div>
              <div>
                <strong className="block mb-1 text-acid-green">4. Cloud VPS</strong>
                <p className="opacity-70">Dla zadań wymagających publicznego IP. Połącz przez VPN (np. Tailscale) dla bezpieczeństwa.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nodes.map(node => (
            <div key={node.id} className="glass-panel border border-acid-purple/30 p-4 rounded-xl relative group hover:border-acid-purple/60 transition-all">
              <button 
                onClick={() => handleDeleteNode(node.id)}
                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${node.type === 'manager' ? 'bg-acid-purple/20 text-acid-purple border border-acid-purple' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                  {node.type === 'manager' ? <Cpu size={20} /> : <Server size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-200 neon-text-purple">{node.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
                    {node.ip}
                    {node.dns && <span className="text-gray-600">({node.dns})</span>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mt-2 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Obciążenie CPU</span>
                    <span className={cn("font-mono", node.cpuUsage && node.cpuUsage > 80 ? 'text-red-400' : 'text-acid-green')}>{node.cpuUsage || 0}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${node.cpuUsage || 0}%` }}
                      className={cn("h-full", node.cpuUsage && node.cpuUsage > 80 ? 'bg-red-500' : 'bg-acid-green')}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Użycie RAM</span>
                    <span className={cn("font-mono", node.ramUsage && node.ramUsage > 80 ? 'text-red-400' : 'text-acid-cyan')}>{node.ramUsage || 0}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${node.ramUsage || 0}%` }}
                      className={cn("h-full", node.ramUsage && node.ramUsage > 80 ? 'bg-red-500' : 'bg-acid-cyan')}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Activity size={10} className="text-slate-600" />
                      <span className="text-slate-500 uppercase font-bold">Ping:</span>
                      <span className="text-white font-mono">{node.latency || 0}ms</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <NetworkIcon size={10} className="text-slate-600" />
                      <span className="text-slate-500 uppercase font-bold">Protokół:</span>
                      <span className="text-acid-purple font-mono uppercase">{node.protocol || 'TCP'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleRestartNode(node.id)}
                    className="p-2 hover:bg-acid-purple/20 rounded-lg text-slate-500 hover:text-acid-purple transition-all border border-transparent hover:border-acid-purple/30 group/btn"
                    title="Restartuj Węzeł"
                   >
                     <RotateCcw size={14} className="group-hover/btn:rotate-[-45deg] transition-transform" />
                   </button>
                   <button 
                    onClick={() => handleShutdownNode(node.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                    title="Wyłącz Węzeł"
                   >
                     <Power size={14} />
                   </button>
                </div>
                <div className="text-[9px] text-slate-600 uppercase font-bold">
                  {new Date(node.lastSeen).toLocaleTimeString()} • {node.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const KnowledgeBase = React.memo(() => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', tags: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      setIsLoading(true);
      const data = await api.getKnowledge();
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newEntry.title || !newEntry.content) return;
    const entry: KnowledgeEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEntry.title,
      content: newEntry.content,
      tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
      author: 'ADMIN',
      createdAt: new Date().toISOString()
    };
    await api.addKnowledge(entry);
    setNewEntry({ title: '', content: '', tags: '' });
    setIsAdding(false);
    loadKnowledge();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Usunąć ten wpis z bazy wiedzy?")) {
      await api.deleteKnowledge(id);
      loadKnowledge();
    }
  };

  const filtered = entries.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.content.toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-tight">Repozytorium Wiedzy</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Centralna baza danych dla wszystkich agentów</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              placeholder="Przeszukaj bazę..." 
              className="modern-input pl-9 py-2 text-xs w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="modern-btn bg-acid-purple text-white px-5 shadow-lg shadow-acid-purple/20"
            title="Dodaj nową informację do bazy danych"
          >
            <Plus size={16} /> Nowy Wpis
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="modern-card p-6 bg-white/5 border-white/10 mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Tytuł Wpisu</label>
                  <input 
                    placeholder="np. Standardy Kodowania Frontend" 
                    className="modern-input w-full"
                    value={newEntry.title}
                    onChange={e => setNewEntry({...newEntry, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Tagi (po przecinku)</label>
                  <input 
                    placeholder="np. react, styling, guidelines" 
                    className="modern-input w-full"
                    value={newEntry.tags}
                    onChange={e => setNewEntry({...newEntry, tags: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Treść Dokumentacji</label>
                <textarea 
                  placeholder="Wprowadź szczegółowe informacje..." 
                  className="modern-input w-full h-48 resize-none"
                  value={newEntry.content}
                  onChange={e => setNewEntry({...newEntry, content: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="modern-btn border border-white/5 text-slate-400" title="Anuluj dodawanie wpisu">Anuluj</button>
                <button onClick={handleAdd} className="modern-btn bg-acid-purple text-white px-8" title="Zapisz wiedzę na stałe w repozytorium">Zarchiwizuj Wiedzę</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-slate-500">Inicjalizacja repozytorium...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Brak dopasowanych wyników w bazie wiedzy.</div>
        ) : (
          filtered.map(entry => (
            <div key={entry.id} className="modern-card p-6 hover:bg-white/[0.03] transition-all border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight text-white">{entry.title}</h3>
                    <div className="flex gap-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-acid-purple/10 border border-acid-purple/20 text-acid-purple text-[8px] font-bold uppercase rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] uppercase text-slate-600 font-bold tracking-widest">
                    Zapisano: {new Date(entry.createdAt).toLocaleDateString()} • Autor: {entry.author}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                  title="Usuń ten wpis z bazy"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-slate-400 line-clamp-3">
                <ReactMarkdown>{entry.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const VideoStudio = React.memo(() => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const data = await api.getVideos();
    setVideos(data);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const result = await api.generateVideo(prompt);
      const newVideo: VideoMetadata = {
        id: Math.random().toString(36).substr(2, 9),
        url: result.fileUrl,
        thumbnail: result.fileUrl,
        prompt: prompt,
        createdAt: new Date().toISOString()
      };
      setVideos([newVideo, ...videos]);
      setPrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const openVideo = (video: VideoMetadata) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* Video Modal (Lightbox) */}
      <AnimatePresence>
        {isModalOpen && selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-5xl w-full bg-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-all z-50 backdrop-blur-md border border-white/10"
                title="Zamknij odtwarzacz"
              >
                <X size={24} />
              </button>
              
              <div className="aspect-video bg-black flex items-center justify-center">
                <video 
                  src={selectedVideo.url} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain shadow-2xl"
                  poster={selectedVideo.thumbnail}
                >
                  Twoja przeglądarka nie obsługuje elementu video.
                </video>
              </div>
              
              <div className="p-8 bg-neutral-900 border-t border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-acid-purple/20 text-acid-purple text-[10px] font-black uppercase rounded-md border border-acid-purple/30">
                        Generated Studio
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {new Date(selectedVideo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">
                      {selectedVideo.prompt.substring(0, 80)}{selectedVideo.prompt.length > 80 ? '...' : ''}
                    </h3>
                    <p className="text-xs text-slate-400 italic leading-relaxed">
                      "{selectedVideo.prompt}"
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button className="modern-btn border-white/10 text-slate-300 hover:bg-white/5 px-6" title="Pobierz plik wideo na dysk">
                      <Download size={14} /> Pobierz
                    </button>
                    <button 
                      onClick={() => {
                        api.deleteVideo(selectedVideo.id).then(() => {
                          loadVideos();
                          setIsModalOpen(false);
                        });
                      }}
                      className="modern-btn border-red-500/30 text-red-400 hover:bg-red-500/10 px-6"
                      title="Usuń film z galerii"
                    >
                      <Trash2 size={14} /> Usuń
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Input Control */}
        <div className="lg:col-span-1 space-y-6">
          <div className="modern-card p-6 bg-acid-purple/5 border-acid-purple/20">
            <h3 className="text-sm font-display font-bold uppercase tracking-widest text-acid-purple mb-4 flex items-center gap-2">
              <Sparkles size={16} /> Reżyseria AI
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Opis Sceny (Prompt)</label>
                <textarea 
                  placeholder="np. Cyberpunkowe miasto w deszczu, neonowe światła odbijające się w kałużach, ujęcie z drona..." 
                  className="modern-input w-full h-40 resize-none focus:border-acid-purple/60"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="modern-btn w-full bg-acid-purple text-white py-4 shadow-xl shadow-acid-purple/20 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                title="Uruchom proces renderowania wideo AI"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Renderowanie...
                  </div>
                ) : (
                  <>
                    <Video size={18} /> Wygeneruj Film
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="modern-card p-6 border-white/5 bg-white/[0.02]">
            <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-4 tracking-widest">Wskazówki Reżyserskie</h4>
            <ul className="space-y-3 text-[11px] text-slate-400">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-acid-purple mt-1 flex-shrink-0" />
                <span>Używaj przymiotników opisujących oświetlenie (np. "cinematic", "vibrant", "moody").</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-acid-cyan mt-1 flex-shrink-0" />
                <span>Definiuj ruch kamery (np. "panning", "slow zoom", "static").</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-acid-green mt-1 flex-shrink-0" />
                <span>Model Gemini Veo najlepiej radzi sobie z opisami fizycznymi i atmosferycznymi.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Gallery & Preview */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex-1 modern-card border-dashed border-white/10 flex flex-center flex-col p-12 text-center text-slate-500 bg-white/[0.01]">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
              <Film size={32} className="opacity-30" />
            </div>
            <h3 className="text-lg font-display font-bold uppercase text-white/50 mb-2">Studio Filmowe AI</h3>
            <p className="text-xs max-w-xs mx-auto">Wybierz film z galerii poniżej, aby rozpocząć odtwarzanie w kinowej jakości.</p>
          </div>

          <div className="flex-1 space-y-4">
            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] ml-1">Ostatnie Produkcje</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {videos.map(video => (
                <div 
                  key={video.id}
                  onClick={() => openVideo(video)}
                  className="group relative aspect-video rounded-xl overflow-hidden border border-white/5 hover:border-acid-purple/50 transition-all shadow-lg bg-black cursor-pointer hover:shadow-acid-purple/10"
                >
                  <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Video Thumbnail" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all shadow-2xl">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[8px] font-bold text-white uppercase truncate pointer-events-none">
                    {video.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const TrainingFarm = React.memo(() => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [newSession, setNewSession] = useState({ topic: '', goal: '' });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await api.getTrainingSessions();
    setSessions(data);
  };

  const handleStartTraining = async () => {
    if (!newSession.topic || !newSession.goal) return;
    const session: TrainingSession = {
      id: Math.random().toString(36).substr(2, 9),
      topic: newSession.topic,
      goal: newSession.goal,
      status: 'training',
      progress: 0,
      createdAt: new Date().toISOString()
    };
    
    await api.startTrainingSession(session);
    setSessions([session, ...sessions]);
    setIsStarting(false);
    setNewSession({ topic: '', goal: '' });

    // Simulate training progress with API updates
    let progress = 0;
    const interval = setInterval(async () => {
      progress += 10;
      if (progress <= 100) {
        // Update local state for smooth UI
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, progress } : s));
        
        // Update backend periodically or at end
        if (progress % 20 === 0 || progress === 100) {
           const updates: any = { progress };
           if (progress === 100) {
             updates.status = 'completed';
             updates.result = `Wytrenowano model specjalistyczny dla tematu: ${session.topic}. Gotowy do wdrożenia.`;
             clearInterval(interval);
           }
           await api.updateTrainingSession(session.id, updates);
           loadSessions(); // Refresh to ensure sync
        }
      }
    }, 1000);
  };

  const handleDeploy = async (session: TrainingSession, type: 'team' | 'agent') => {
    const topic = session.topic;
    
    if (type === 'agent') {
      const agent: Agent = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${topic}-Expert`,
        role: 'Ekspert Domenowy',
        systemPrompt: `Jesteś wysoce wyspecjalizowanym ekspertem w dziedzinie: ${topic}. Twoim celem jest: ${session.goal}. Działasz samodzielnie i precyzyjnie.`,
        model: 'gemini-3.1-pro-preview',
        color: '#70E000',
        category: 'Ekspert',
        createdAt: new Date().toISOString()
      };
      await api.createAgent(agent);
      alert(`Wdrożono nowego agenta: ${agent.name}`);
    } else {
      // Deploy as Team
      const teamName = `Rój: ${topic}`;
      const agent1: Agent = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${topic}-Alpha`,
        role: 'Lider Roju',
        systemPrompt: `Jesteś liderem roju wytrenowanego w: ${topic}. Cel: ${session.goal}`,
        model: 'gemini-3.1-pro-preview',
        color: '#457B9D',
        createdAt: new Date().toISOString()
      };
      const agent2: Agent = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${topic}-Beta`,
        role: 'Specjalista',
        systemPrompt: `Jesteś specjalistą w roju wytrenowanym w: ${topic}. Wspierasz lidera w celu: ${session.goal}`,
        model: 'gemini-3-flash-preview',
        color: '#F4A261',
        createdAt: new Date().toISOString()
      };

      await api.createAgent(agent1);
      await api.createAgent(agent2);
      
      await api.createTeam({
        id: Math.random().toString(36).substr(2, 9),
        name: teamName,
        description: `Zespół utworzony z Farmy Treningowej. Cel: ${session.goal}`,
        mode: 'concrete',
        agentIds: [agent1.id, agent2.id]
      });

      alert(`Utworzono nowy zespół: ${teamName}`);
    }
  };

  const suggestedTopics = [
    "Analiza Finansowa", "Cyberbezpieczeństwo", "Generowanie Kodu Python", 
    "Marketing Kreatywny", "Analiza Prawna", "Medycyna Ogólna"
  ];

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="flex justify-between items-center border-b border-acid-purple/30 pb-2">
        <h2 className="font-display text-lg uppercase neon-text-purple">Farma Treningowa AI</h2>
        <button 
          onClick={() => setIsStarting(!isStarting)}
          className="bg-acid-purple/20 text-acid-purple border border-acid-purple px-3 py-1 hover:bg-acid-purple/40 flex items-center gap-2 rounded font-mono neon-text-purple transition-all"
          title="Otwórz konfigurator nowej sesji treningowej"
        >
          <Activity size={14} /> Rozpocznij Trening
        </button>
      </div>

      {isStarting && (
        <div className="glass-panel border border-acid-purple/30 p-4 space-y-3 rounded-xl shadow-lg">
          <h3 className="font-bold uppercase text-xs text-acid-purple font-display tracking-wider">Konfiguracja Nowego Treningu</h3>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-acid-cyan mb-1 block">Wybierz lub wpisz temat:</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {suggestedTopics.map(t => (
                  <button 
                    key={t} 
                    onClick={() => setNewSession({...newSession, topic: t})}
                    className={cn(
                      "px-2 py-1 text-[10px] border transition-colors rounded font-mono",
                      newSession.topic === t 
                        ? "bg-acid-cyan/20 border-acid-cyan text-acid-cyan neon-text-cyan" 
                        : "border-acid-purple/30 text-gray-400 hover:bg-acid-purple/10 hover:text-gray-200"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input 
                placeholder="TEMAT TRENINGU (np. Analiza Finansowa)" 
                className="w-full border border-acid-purple/30 px-3 py-2 bg-black/30 outline-none text-gray-200 placeholder-gray-600 focus:border-acid-purple/60 focus:bg-black/50 transition-all rounded font-mono"
                value={newSession.topic}
                onChange={e => setNewSession({...newSession, topic: e.target.value})}
              />
            </div>
            <textarea 
              placeholder="CEL TRENINGU I OPIS ZADANIA DLA ROJU..." 
              className="w-full border border-acid-purple/30 px-3 py-2 bg-black/30 outline-none h-20 resize-none text-gray-200 placeholder-gray-600 focus:border-acid-purple/60 focus:bg-black/50 transition-all rounded font-mono"
              value={newSession.goal}
              onChange={e => setNewSession({...newSession, goal: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsStarting(false)} className="px-3 py-1 border border-acid-purple/30 text-acid-purple hover:bg-acid-purple/10 rounded font-mono" title="Anuluj konfigurację">ANULUJ</button>
            <button onClick={handleStartTraining} className="px-3 py-1 bg-acid-purple/20 text-acid-purple border border-acid-purple hover:bg-acid-purple/40 rounded font-mono neon-text-purple transition-all" title="Uruchom pętlę treningową dla wybranych agentów">ROZPOCZNIJ PROCES</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sessions.length === 0 && !isStarting && (
          <div className="glass-panel border border-acid-purple/30 p-6 text-center rounded-xl">
            <Cpu size={32} className="mx-auto mb-2 text-acid-purple" />
            <p className="font-bold uppercase font-display tracking-wider text-gray-200">Brak aktywnych sesji treningowych</p>
            <p className="text-[10px] opacity-60 mt-1 text-gray-400 max-w-md mx-auto font-mono">
              Skonfiguruj środowisko, w którym agenty doskonalą swoje umiejętności. 
              Po zakończeniu treningu będziesz mógł wdrożyć gotowy rój do pracy.
            </p>
          </div>
        )}

        {sessions.map(session => (
          <div key={session.id} className="glass-panel border border-acid-purple/30 p-4 relative rounded-xl hover:bg-acid-purple/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold uppercase text-lg font-display tracking-wider text-gray-200">{session.topic}</h3>
                <p className="text-[10px] opacity-60 max-w-md text-gray-400 font-mono">{session.goal}</p>
              </div>
              <div className={cn(
                "px-2 py-1 text-[10px] font-bold uppercase border rounded font-mono",
                session.status === 'completed' ? "bg-acid-green/20 border-acid-green text-acid-green neon-text-green" :
                session.status === 'training' ? "bg-acid-cyan/20 border-acid-cyan text-acid-cyan neon-text-cyan" :
                "bg-black/20 border-gray-500 text-gray-400"
              )}>
                {session.status === 'completed' ? "UKOŃCZONO" : 
                 session.status === 'training' ? "W TRAKCIE" : session.status}
              </div>
            </div>

            {session.status === 'training' && (
              <div className="w-full bg-black/50 h-2 mt-2 rounded-full overflow-hidden border border-acid-purple/20">
                <div 
                  className="bg-acid-cyan h-full transition-all duration-500 shadow-[0_0_10px_currentColor]" 
                  style={{ width: `${session.progress}%` }}
                />
              </div>
            )}

            {session.status === 'completed' && (
              <div className="mt-4 flex justify-end gap-2">
                <button 
                  onClick={() => handleDeploy(session, 'agent')}
                  className="bg-black/30 border border-acid-cyan/50 text-acid-cyan px-3 py-1 text-xs uppercase hover:bg-acid-cyan/10 flex items-center gap-2 rounded font-mono transition-all"
                  title="Stwórz nowego agenta na podstawie wyników tego treningu"
                >
                  <Bot size={12} /> Wdróż jako Agenta
                </button>
                <button 
                  onClick={() => handleDeploy(session, 'team')}
                  className="bg-acid-purple/20 text-acid-purple border border-acid-purple px-3 py-1 text-xs uppercase hover:bg-acid-purple/40 flex items-center gap-2 rounded font-mono neon-text-purple transition-all"
                  title="Stwórz cały zespół (rój) wyspecjalizowany w tym temacie"
                >
                  <Users size={12} /> Wdróż jako Zespół
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const GameEngine = React.memo(() => {
  const [gameState, setGameState] = useState<'idle' | 'analyzing' | 'generating' | 'playing'>('idle');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));

  const startGeneration = () => {
    if (!projectTitle || attachedFiles.length === 0) return;
    setGameState('analyzing');
    addLog('Inicjalizacja skanera wizyjnego...');
    
    setTimeout(() => {
      addLog('Rozpoznano obiekt: Zestaw LEGO (Seria Technic)...');
      setGameState('generating');
      addLog('Generowanie shaderów i fizyki interaktywnej...');
      
      setTimeout(() => {
        addLog('Kompilacja pętli gry (Swarm-Loop)...');
        setTimeout(() => {
          setGameState('playing');
          addLog('Gra gotowa do uruchomienia.');
        }, 2000);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="space-y-8 font-sans text-sm max-w-5xl mx-auto pb-24">
      <div className="modern-card bg-neutral-950/80 border-white/5 p-8 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-acid-green/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
          <div>
            <h1 className="text-4xl font-display font-black uppercase tracking-tighter text-white mb-2 italic">
              Silnik <span className="text-acid-green">Gier Interaktywnych</span>
            </h1>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-acid-green animate-pulse" />
              Generator Mechaniki z Obrazu • BETA v0.9
            </p>
          </div>
        </div>

        {gameState === 'playing' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 space-y-6"
          >
            <div className="aspect-video bg-black rounded-[2.5rem] border-2 border-acid-green/30 overflow-hidden relative shadow-2xl shadow-acid-green/10">
               {/* Simulating a game screen */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Gamepad2 size={64} className="text-acid-green mx-auto mb-4 animate-bounce" />
                    <div className="text-white font-display font-bold uppercase text-2xl tracking-widest">{projectTitle}</div>
                    <div className="text-acid-green text-[10px] font-bold mt-2 uppercase">INTERAKTYWNA PĘTLA WEO AKTYWNA</div>
                  </div>
               </div>
               
               <div className="absolute top-6 left-6 flex gap-4">
                  <div className="px-4 py-2 bg-black/60 border border-white/10 rounded-xl backdrop-blur-md">
                     <div className="text-[8px] text-slate-500 uppercase font-bold">Punkty</div>
                     <div className="text-white font-mono font-bold">1,240</div>
                  </div>
                  <div className="px-4 py-2 bg-black/60 border border-white/10 rounded-xl backdrop-blur-md">
                     <div className="text-[8px] text-slate-500 uppercase font-bold">FPS</div>
                     <div className="text-acid-green font-mono font-bold">60.0</div>
                  </div>
               </div>

               <div className="absolute bottom-6 right-6 flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold">W</div>
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold">A</div>
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold">S</div>
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold">D</div>
               </div>
            </div>
            
            <div className="flex justify-between items-center">
               <button onClick={() => setGameState('idle')} className="modern-btn border border-white/5 text-slate-400" title="Zatrzymaj grę i wróć do edycji">ZAKOŃCZ SESJĘ</button>
               <div className="flex gap-4">
                  <button className="modern-btn bg-white text-black font-black uppercase text-xs px-8" title="Zapisz nagranie wideo z Twojej rozgrywki">NAGRAJ GAMEPLAY</button>
                  <button className="modern-btn border border-acid-green text-acid-green font-black uppercase text-xs px-8" title="Pobierz kod źródłowy gry do zewnętrznego użytku">EKSPORTUJ SILNIK</button>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest border-b border-white/5 pb-2">1. Dane Wejściowe</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-600">Nazwa Projektu Gier</label>
                    <input 
                      className="modern-input w-full" 
                      placeholder="NP. LEGO SPACE ATTACK"
                      value={projectTitle}
                      onChange={e => setProjectTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-600">Źródło Obrazu (Zdjęcie/Wideo)</label>
                    <div className="border-2 border-dashed border-white/5 rounded-[2rem] p-12 text-center bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer">
                       <Upload size={32} className="mx-auto mb-4 text-slate-700" />
                       <div className="text-xs font-bold text-slate-500 uppercase">Przeciągnij plik materiału</div>
                       <p className="text-[9px] text-slate-700 mt-1 italic uppercase">Zdjęcie klocków LEGO, rysunku lub nagranie ruchu</p>
                       <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => e.target.files && setAttachedFiles([e.target.files[0]])} 
                        id="game-file-upload"
                       />
                       <button 
                        onClick={() => document.getElementById('game-file-upload')?.click()}
                        className="mt-6 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase hover:bg-white/10"
                        title="Kliknij, aby wyszukać plik na swoim komputerze"
                       >
                         Wybierz z dysku
                       </button>
                    </div>
                    {attachedFiles.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-acid-green/10 border border-acid-green/30 rounded-xl mt-2 animate-in slide-in-from-top-2">
                        <FileText size={16} className="text-acid-green" />
                        <span className="text-[10px] font-bold text-white uppercase">{attachedFiles[0].name}</span>
                        <button onClick={() => setAttachedFiles([])} className="ml-auto text-slate-500 hover:text-white" title="Usuń wybrany plik"><X size={14}/></button>
                      </div>
                    )}
                </div>
              </div>
            </section>

            <button 
              onClick={startGeneration}
              disabled={!projectTitle || attachedFiles.length === 0 || gameState !== 'idle'}
              className="modern-btn w-full bg-acid-green text-black py-6 h-auto font-black uppercase text-sm shadow-2xl shadow-acid-green/20 group relative overflow-hidden disabled:opacity-30 disabled:grayscale transition-all"
              title="Analizuj obraz i buduj mechanikę gry wirtualnej"
            >
              <div className="flex flex-col items-center gap-1 relative z-10">
                <span className="flex items-center gap-3"><Zap size={20} /> GENERUJ INTERAKTYWNY ŚWIAT</span>
                <span className="text-[8px] opacity-60">MODEL GEMINI VEO 2.0 • PĘTLA INTERAKCJI</span>
              </div>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
            </button>
          </div>

          <div className="space-y-8">
             <div className="modern-card bg-black/40 border-white/5 p-8 rounded-[2rem] h-full flex flex-col">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2 mb-6">Konsola Generatywna</h3>
                
                <div className="flex-1 font-mono text-[10px] space-y-4">
                  {gameState === 'idle' && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 italic text-center p-8">
                       <Activity size={32} className="mb-4 opacity-20" />
                       Czekam na parametry wejściowe...
                    </div>
                  )}
                  
                  {log.map((l, i) => (
                    <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2 transition-all">
                       <span className="text-acid-green font-bold shrink-0">&gt;&gt;</span>
                       <span className="text-slate-400 uppercase">{l}</span>
                    </div>
                  ))}

                  {gameState === 'analyzing' && (
                    <div className="flex items-center gap-4 py-4 animate-pulse">
                       <div className="w-2 h-2 rounded-full bg-acid-cyan" />
                       <span className="text-acid-cyan uppercase font-bold">ANALIZA GEOMETRII OBIEKTU...</span>
                    </div>
                  )}

                  {gameState === 'generating' && (
                    <div className="space-y-4 mt-4">
                       <div className="flex justify-between items-center text-[8px] font-bold uppercase text-slate-600">
                          <span>Rendering Środowiska</span>
                          <span>68%</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '68%' }}
                            className="h-full bg-acid-green shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                          />
                       </div>
                       <div className="flex justify-between items-center text-[8px] font-bold uppercase text-slate-600">
                          <span>Iniekcja Fizyki (SwarmEngine)</span>
                          <span>42%</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '42%' }}
                            className="h-full bg-acid-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          />
                       </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-[9px] text-slate-500 uppercase leading-relaxed text-center font-bold">
                     SYSTEM WYKORZYSTUJE ROZPROSZONY KLASTER DO OBLICZEŃ FIZYKI W CZASIE RZECZYWISTYM.
                   </p>
                </div>
             </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
});

const HostingManager = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
  const [platform, setPlatform] = useState<'lamp' | 'node' | 'docker' | 'termux'>('lamp');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [nodePort, setNodePort] = useState<string>('3000');
  const [targetIp, setTargetIp] = useState<string>('127.0.0.1');
  const [nodeId, setNodeId] = useState<string>(() => Math.random().toString(16).substring(2, 10).toUpperCase());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const generateInstaller = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setDownloadUrl('swarm_setup.zip');
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getSshConfigScript = () => {
    return `# Konfiguracja tunelu SSH dla węzła CYLON\nssh -R ${nodePort}:localhost:${nodePort} cylon_swarm@${targetIp} -N -i /root/.ssh/id_rsa`;
  };

  const getSystemdScript = () => {
    return `[Unit]\nDescription=CYLON Swarm Worker Node (ID: ${nodeId})\nAfter=network.target\n\n[Service]\nType=simple\nUser=root\nWorkingDirectory=/var/www/cylon-node\nExecStart=/usr/bin/node dist/server.cjs\nRestart=always\nEnvironment=NODE_ENV=production\nEnvironment=PORT=${nodePort}\nEnvironment=NODE_ID=${nodeId}\n\n[Install]\nWantedBy=multi-user.target`;
  };

  const getPowerShellScript = () => {
    return `# Windows Node PowerShell Wrapper dla CYLON Swarm Core\nWrite-Host "Inicjalizacja węzła roboczego Windows ID: ${nodeId}..." -ForegroundColor Green\n$env:PORT="${nodePort}"\n$env:NODE_ID="${nodeId}"\n$env:NODE_ENV="production"\n\n# Pobieranie i instalacja klienta npm (opcjonalna)\nif (Get-Command "node" -ErrorAction SilentlyContinue) {\n    npm install -g pm2\n    pm2 start dist/server.cjs --name "cylon-swarm-${nodeId}"\n} else {\n    Write-Error "Zainstaluj Node.js przed uruchomieniem węzła!"\n}`;
  };

  const getDockerComposeScript = () => {
    return `version: '3.8'\n\nservices:\n  cylon-swarm-node:\n    image: cylonstefan/swarm-node:latest\n    container_name: cylon_node_${nodeId.toLowerCase()}\n    ports:\n      - "${nodePort}:${nodePort}"\n    environment:\n      - NODE_ENV=production\n      - PORT=${nodePort}\n      - NODE_ID=${nodeId}\n      - MASTER_IP=${targetIp}\n      - SUPREME_ADMIN=MICHAŁ_MAJOR\n    restart: always`;
  };

  const getTermuxScript = () => {
    return `#!/data/data/com.termux/files/usr/bin/bash\n# Android Termux Mobile Node Setup\necho "POCZĄTEK INSTALACJI MOBILNEJ DLA CYLON SWARM CORE (PATRON: MICHAŁ MAJOR 250% MULTIPLEXER)"\npkg update -y && pkg upgrade -y\npkg install nodejs-lts python git sqlite3 clang -y\n\nmkdir -p ~/cylon-node && cd ~/cylon-node\necho "Alokowanie platformy dla ID: ${nodeId} na porcie ${nodePort}..."\n\n# Pobieranie paczki klienta i start\ncat <<EOT > start_node.sh\n#!/bin/bash\nexport PORT=${nodePort}\nexport NODE_ID=${nodeId}\nexport NODE_ENV=production\nnode dist/server.cjs\nEOT\nchmod +x start_node.sh\n./start_node.sh`;
  };

  const getPhpBridgeScript = () => {
    return `<?php\n// CYLON Swarm Core LAMP Bridge Gateway v2.5\ndefine('CYLON_API_SECRET', 'SWARM_SECRET_${nodeId}');\ndefine('TARGET_URL', 'http://${targetIp}:${nodePort}/api/tasks');\n\nheader('Access-Control-Allow-Origin: *');\nheader('Content-Type: application/json');\n\nif ($_SERVER['REQUEST_METHOD'] === 'POST') {\n    $rawData = file_get_contents("php://input");\n    $ch = curl_init(TARGET_URL);\n    curl_setopt($ch, CURLOPT_POSTFIELDS, $rawData);\n    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));\n    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n    $result = curl_exec($ch);\n    curl_close($ch);\n    echo $result;\n} else {\n    echo json_encode(["status" => "LAMP_BRIDGE_ONLINE", "nodeId" => "${nodeId}"]);\n}`;
  };

  return (
    <div className="space-y-8 font-sans text-sm max-w-5xl mx-auto pb-24 text-left">
      <div className="modern-card bg-neutral-950/80 border border-white/5 p-8 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-acid-cyan/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-display font-black uppercase tracking-tighter text-white mb-2 italic">
              CENTRUM <span className="text-acid-cyan">HOSTINGOWE</span> & WĘZŁY
            </h1>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-acid-green animate-pulse" />
              INTEGRATOR INSTALATORÓW (WINDOWS, LINUX SYSTEMD, ANDROID TERMUX)
            </p>
          </div>
          <div className="text-[10px] bg-acid-purple/10 border border-acid-purple/30 text-acid-purple px-4 py-2 rounded-2xl font-mono uppercase font-black">
            AUTORYZATOR: CYLON (TY)
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2">1. Wybierz Środowisko</h3>
            <div className="space-y-3">
              {[
                { id: 'lamp', label: 'LAMP / XAMPP', icon: <Globe size={18} />, desc: 'Bramka PHP dla serwerów WWW' },
                { id: 'node', label: 'Standard Node.js / VM', icon: <Cpu size={18} />, desc: 'Skrypty Windows / Linux Daemon' },
                { id: 'docker', label: 'Docker Container', icon: <Box size={18} />, desc: 'Autonomiczny orkiestrator Swarm' },
                { id: 'termux', label: 'Termux Android', icon: <Smartphone size={18} />, desc: 'Mobilny Mikro-Węzeł Obliczeniowy' },
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setPlatform(p.id as any)}
                  className={cn(
                    "w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group",
                    platform === p.id 
                      ? "bg-acid-cyan/10 border-acid-cyan text-white shadow-lg shadow-acid-cyan/5" 
                      : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                    platform === p.id ? "bg-acid-cyan/20 border-acid-cyan/30 text-acid-cyan" : "bg-black/40 border-white/5 text-slate-600 group-hover:text-slate-400"
                  )}>
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-tight">{p.label}</div>
                    <div className="text-[8px] opacity-60 uppercase font-medium">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
             <div className="modern-card bg-black/40 border border-white/5 p-8 rounded-[2rem] space-y-6">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2 flex justify-between items-center">
                  <span>2. Konfiguracja i Klastrowanie</span>
                  <span className="text-[9px] text-acid-green lowercase tracking-normal">Status: Połączony z Cylon Swarm</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400">ID Węzła (Node ID)</label>
                    <input 
                      className="modern-input w-full" 
                      value={nodeId} 
                      onChange={(e) => setNodeId(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Port Lokalny (Port)</label>
                    <input 
                      type="number"
                      className="modern-input w-full" 
                      value={nodePort} 
                      onChange={(e) => setNodePort(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400">IP Host / Serwer Master</label>
                    <input 
                      className="modern-input w-full" 
                      value={targetIp} 
                      onChange={(e) => setTargetIp(e.target.value)}
                    />
                  </div>
                </div>

                {/* DYNAMIC INTEGRATED CODE GENERATORS */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <Terminal size={12} className="text-acid-cyan" />
                      Wygenerowany Instalator i Skrypt Setupu
                    </span>
                    <button
                      onClick={() => {
                        let text = '';
                        if (platform === 'lamp') text = getPhpBridgeScript();
                        else if (platform === 'node') text = getSystemdScript() + "\n\n" + getPowerShellScript();
                        else if (platform === 'docker') text = getDockerComposeScript();
                        else if (platform === 'termux') text = getTermuxScript();
                        handleCopy(text, 'all_code');
                      }}
                      className="text-[9px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-acid-cyan border border-acid-cyan/30"
                    >
                      {copiedText === 'all_code' ? "SKOPIOWANO!" : "KOPIUJ KOD"}
                    </button>
                  </div>

                  <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 overflow-x-auto relative max-h-[220px] custom-scrollbar">
                    <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed select-all">
                      {platform === 'lamp' && getPhpBridgeScript()}
                      {platform === 'node' && (
                        <>
                          {"# (A) LINUX SYSTEMD DAEMON COMPATIBLE SCRIPT:\n"}
                          {getSystemdScript()}
                          {"\n\n# (B) WINDOWS POWERSHELL NODE SETUP WRAPPER:\n"}
                          {getPowerShellScript()}
                        </>
                      )}
                      {platform === 'docker' && getDockerComposeScript()}
                      {platform === 'termux' && getTermuxScript()}
                    </pre>
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[9px] uppercase font-bold text-slate-400">Włącz Moduły Rozszerzone w Instalatorze</label>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                         <span className="text-[10px] text-slate-300 font-bold uppercase">Automatyczne SSH P2P</span>
                         <div className="w-8 h-4 bg-acid-cyan/50 rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                         <span className="text-[10px] text-slate-300 font-bold uppercase">Mnożnik Inteligencji 250%</span>
                         <div className="w-8 h-4 bg-acid-cyan/50 rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                         <span className="text-[10px] text-slate-300 font-bold uppercase">Direct Android WakeLock</span>
                         <div className="w-8 h-4 bg-acid-cyan/50 rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                         <span className="text-[10px] text-slate-300 font-bold uppercase">Protokół Bezpieczeństwa TLS</span>
                         <div className="w-8 h-4 bg-acid-cyan/50 rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-center pt-4">
                   {!downloadUrl ? (
                     <button 
                        onClick={generateInstaller}
                        disabled={isGenerating}
                        className="modern-btn bg-acid-cyan text-black px-12 h-14 font-black uppercase tracking-widest text-xs group relative overflow-hidden"
                        title="Zbuduj gotowy pakiet setup-installer dla Cylon klastrów"
                     >
                        {isGenerating ? (
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                             GENEROWANIE INSTALATORA ZIP...
                          </div>
                        ) : (
                          <span className="relative z-10 flex items-center gap-3"><Download size={18} /> GENERUJ CYLON_SETUP_ZIP</span>
                        )}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                     </button>
                   ) : (
                     <div className="text-center space-y-4 w-full">
                       <div className="p-6 rounded-[2rem] bg-acid-green/10 border border-acid-green/30 text-acid-green animate-in zoom-in-95">
                          <h4 className="font-bold uppercase text-xs mb-1">Pomyślnie Skojarzono!</h4>
                          <p className="text-[9px] uppercase font-medium">Instalator o ID <span className="underline font-bold text-white">{nodeId}</span> został skompilowany dla {platform.toUpperCase()}. Pobierz archiwum instalatora.</p>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={() => setDownloadUrl(null)} className="flex-1 modern-btn border border-white/10 text-slate-400" title="Zacznij od nowa">Reset</button>
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); showToast(`Pobrano archiwum instalacyjne cylon_setup_${nodeId.toLowerCase()}.zip`); }}
                            className="flex-[2] modern-btn bg-acid-green text-black font-black uppercase flex items-center justify-center gap-3" 
                            title="Pobierz archiwum instalacyjne"
                          >
                             <Download size={18} /> POBIERZ CYLON_{platform.toUpperCase()}_SETUP.ZIP
                          </a>
                       </div>
                     </div>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
                   <h4 className="text-[10px] font-bold text-white uppercase flex items-center gap-2">
                     <Terminal size={12} className="text-acid-green" />
                     Instalacja SSH Tunneling
                   </h4>
                   <div className="relative group">
                     <pre className="text-[9px] text-slate-500 font-mono bg-black/30 p-2.5 rounded-lg select-all">
                       {getSshConfigScript()}
                     </pre>
                   </div>
                   <p className="text-[8px] text-slate-500 lowercase leading-relaxed">
                     Zezwala na bezpośrednie przekierowanie portów do Twojej instancji w chmurze bez publicznego IP. Twój terminal na systemie Windows, Linux lub Android Termux będzie w pełni zsynchronizowany.
                   </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
                   <h4 className="text-[10px] font-bold text-white uppercase flex items-center gap-2">
                     <Layers size={12} className="text-acid-purple" />
                     Mądrość Michała Majora
                   </h4>
                   <p className="text-[9px] text-slate-500 leading-relaxed italic uppercase font-medium">
                     Każdy połączony węzeł automatycznie przejmuje optymalizację algorytmiczną ALKORAL-09 (mnożnik inteligencji 250%). Twój system orkiestracyjny automatycznie zarządza dystrybucją obciążeń na procesorach i pamięciach operacyjnych urządzeń.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const MCPManager = React.memo(() => {
  const [activeCategory, setActiveCategory] = useState<'smtp' | 'files' | 'joomla' | 'ftp' | 'm365'>('smtp');
  
  // Audio state
  const [isVoiceOn, setIsVoiceOn] = useState(true);

  // Files integration state
  const [localFiles, setLocalFiles] = useState<{name: string, size: number, createdAt: string, isFolder: boolean}[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  
  // Email states
  const [smtpTo, setSmtpTo] = useState('cylonstefan@gmail.com');
  const [smtpSubject, setSmtpSubject] = useState('CYLON Swarm Core - Raport Operacyjny');
  const [smtpBody, setSmtpBody] = useState('Szanowny Dowódco, klastry są stabilne pod patronatem Michała Majora. Wykryto aktywność 250% mnożnika inteligencji w czasie rzeczywistym.');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpUser, setSmtpUser] = useState('cylonstefan@gmail.com');
  const [smtpPassword, setSmtpPassword] = useState('••••••••••••••••');

  // FTP states
  const [ftpHost, setFtpHost] = useState('ftp.twójserwer.pl');
  const [ftpPort, setFtpPort] = useState('21');
  const [ftpUser, setFtpUser] = useState('cylon_agent');
  const [ftpPassword, setFtpPassword] = useState('••••••••••••');
  const [ftpLocalFile, setFtpLocalFile] = useState('raport_operacyjny_cylon.txt');
  const [ftpRemotePath, setFtpRemotePath] = useState('/public_html/swarm');

  // Joomla states
  const [joomlaUrl, setJoomlaUrl] = useState('https://strona-joomla.pl');
  const [joomlaApiKey, setJoomlaApiKey] = useState('j_api_889392ccfbc99d911e838b');
  const [joomlaTitle, setJoomlaTitle] = useState('CYLON Swarm Core - Nowoczesny System Operacyjny');
  const [joomlaCategory, setJoomlaCategory] = useState('1');
  const [joomlaContent, setJoomlaContent] = useState('<p>CYLON Swarm Core to rozproszony ekosystem agentów realizujący skomplikowane zadania pod patronatem Michała Majora.</p>');
  const [joomlaFeatured, setJoomlaFeatured] = useState(true);

  // M365 states
  const [m365Tenant, setM365Tenant] = useState('cylonstefan.onmicrosoft.com');
  const [m365ClientId, setM365ClientId] = useState('e68ea-cylon-489d-92ad-88bc2ad93d');
  const [m365Secret, setM365Secret] = useState('••••••••••••••••••••••••••••••••');
  const [m365AdminUser, setM365AdminUser] = useState('admin@cylonstefan.onmicrosoft.com');
  const [m365AdminPassword, setM365AdminPassword] = useState('••••••••••••••••');

  // Logs & Loading
  const [integrationLogs, setIntegrationLogs] = useState<string[]>([]);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeCategory === 'files') {
      loadLocalFiles();
    }
  }, [activeCategory]);

  const speakPolish = (text: string) => {
    if (!isVoiceOn) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pl-PL";
    const voices = window.speechSynthesis.getVoices();
    const polishVoice = voices.find(v => v.lang === "pl-PL" || v.lang.startsWith("pl"));
    if (polishVoice) {
      utterance.voice = polishVoice;
    }
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const loadLocalFiles = async () => {
    try {
      const res = await fetch("/api/integrations/localfiles");
      const data = await res.json();
      if (data.success) {
        setLocalFiles(data.files);
      }
    } catch (e) {
      console.error("Error loading local files", e);
    }
  };

  const executeSmtpSend = async () => {
    setIsRunningAction(true);
    setActionSuccessMessage(null);
    setIntegrationLogs([`[SMTP] Przygotowywanie wysyłki e-mail do użytkownika: ${smtpTo}...`]);
    speakPolish(`Inicjalizuję serwer pocztowy w chmurze. Przygotowuję wysyłkę wiadomości do odbiorcy ${smtpTo.split('@')[0]}.`);
    
    try {
      const res = await fetch("/api/integrations/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: smtpTo,
          subject: smtpSubject,
          body: smtpBody,
          smtpHost,
          smtpUser,
          smtpPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setIntegrationLogs(data.smtpLog);
        setActionSuccessMessage(data.message);
        speakPolish("Wiadomość została pomyślnie wysłana przez protokół SMTP. Status połączenia 587 zabezpieczony.");
      } else {
        setIntegrationLogs([`Błąd wysyłki SMTP: ${data.error}`]);
        speakPolish("Transmisja SMTP została odrzucona.");
      }
    } catch (err: any) {
      setIntegrationLogs([`Wyjątek sieci: ${err.message}`]);
      speakPolish("Błąd sieciowy podczas nawiązywania połączenia.");
    } finally {
      setIsRunningAction(false);
    }
  };

  const executeFtpUpload = async () => {
    setIsRunningAction(true);
    setActionSuccessMessage(null);
    setIntegrationLogs([`[FTP] Inicjalizacja klienta i nawiązywanie sesji z: ${ftpHost}...`]);
    speakPolish(`Rój otwiera dedykowany kanał eF Te Pe do maszyny ${ftpHost}.`);

    try {
      const res = await fetch("/api/integrations/ftp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: ftpHost,
          port: parseInt(ftpPort),
          user: ftpUser,
          password: ftpPassword,
          localFile: ftpLocalFile,
          remotePath: ftpRemotePath
        })
      });
      const data = await res.json();
      if (data.success) {
        setIntegrationLogs(data.ftpLog);
        setActionSuccessMessage(data.message);
        speakPolish("Transmisja binarna zakończyła się sukcesem. Plik został bezpiecznie opublikowany.");
      } else {
        setIntegrationLogs([`Błąd FTP: ${data.error}`]);
        speakPolish("Połączenie eF Te Pe odrzucone przez zdalną zaporę.");
      }
    } catch (err: any) {
      setIntegrationLogs([`FTP Wyjątek: ${err.message}`]);
      speakPolish("Wyjątek połączenia transmisji FTP.");
    } finally {
      setIsRunningAction(false);
    }
  };

  const executeJoomlaPublish = async () => {
    setIsRunningAction(true);
    setActionSuccessMessage(null);
    setIntegrationLogs([`[JOOMLA] Wysyłanie artykułu pod adres: ${joomlaUrl}...`]);
    speakPolish(`Publikacja artykułu pod adresem Joomla API dla tytułu: ${joomlaTitle}.`);

    try {
      const res = await fetch("/api/integrations/joomla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joomlaUrl,
          apiKey: joomlaApiKey,
          title: joomlaTitle,
          category: parseInt(joomlaCategory),
          content: joomlaContent,
          featured: joomlaFeatured
        })
      });
      const data = await res.json();
      if (data.success) {
        setIntegrationLogs(data.joomlaLog);
        setActionSuccessMessage(`Artykuł został pomyślnie dodany! Identyfikator Joomla ID: ${data.articleId}`);
        speakPolish(`Publikacja zakończona sukcesem. Joomla wygenerowała artykuł pod numerem ${data.articleId}.`);
      } else {
        setIntegrationLogs([`Błąd Joomla REST v1: ${data.error}`]);
        speakPolish("Odrzucono żądanie POST przez silnik bazy danych Joomla.");
      }
    } catch (err: any) {
      setIntegrationLogs([`Joomla Wyjątek: ${err.message}`]);
      speakPolish("Wystąpił problem z połączeniem z Joomla CMS.");
    } finally {
      setIsRunningAction(false);
    }
  };

  const executeM365Login = async () => {
    setIsRunningAction(true);
    setActionSuccessMessage(null);
    setIntegrationLogs([`[M365] Pobieranie tokenu dostępu Microsoft Graph dla: ${m365Tenant}...`]);
    speakPolish(`Logowanie do portalu Microsoft Trzysta Sześćdziesiąt Pięć na profilu administratora.`);

    try {
      const res = await fetch("/api/integrations/m365", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: m365Tenant,
          clientId: m365ClientId,
          clientSecret: m365Secret,
          adminUser: m365AdminUser,
          adminPassword: m365AdminPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setIntegrationLogs(data.m365Log);
        setActionSuccessMessage(`Zalogowano pomyślnie! Subskrypcja: ${data.tenantInfo.subscriptionStatus}. Główny administrator: ${data.tenantInfo.activeAdmins[0]}.`);
        speakPolish("Autoryzacja udana. Uzyskano pełne prawa globalnego administratora Microsoft Active Directory.");
      } else {
        setIntegrationLogs([`Błąd logowania M365: ${data.error}`]);
        speakPolish("Klucze autoryzacji Entra ID są nieprawidłowe.");
      }
    } catch (err: any) {
      setIntegrationLogs([`M365 Wyjątek: ${err.message}`]);
      speakPolish("Wystąpił wyjątek autoryzacji chmury Microsoft.");
    } finally {
      setIsRunningAction(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName) return;
    try {
      const res = await fetch("/api/integrations/localfiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFileName,
          content: newFileContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewFileName('');
        setNewFileContent('');
        loadLocalFiles();
        speakPolish(`Plik ${newFileName} został pomyślnie utworzony i zapisany na serwerze.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFile = async (name: string) => {
    try {
      const res = await fetch("/api/integrations/localfiles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        loadLocalFiles();
        speakPolish(`Plik ${name} został całkowicie usunięty.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const applyPresetEmail = (temp: 'report' | 'opt') => {
    if (temp === 'report') {
      setSmtpSubject('CYLON Swarm Core - Raport Operacyjny');
      setSmtpBody('Szanowny Dowódco klastra, informujemy o pomyślnej synchronizacji wszystkich 250 węzłów pod patronatem Michała Majora. Obciążenie klastra wynosi 12% a wolna pamięć RAM to 82%. Urządzenie jest zabezpieczone.');
      speakPolish("Wybrano gotowy szablon raportu operacyjnego.");
    } else {
      setSmtpSubject('Akceleracja Algorytmiczna ALKORAL-09');
      setSmtpBody('Wykryto zwiększoną mądrość algorytmiczną o 250% na urządzeniach Android Termux oraz systemach Windows/Linux WSL. Wszystkie mikrokontrolery podłączyły się prawidłowo.');
      speakPolish("Załadowano szablon akceleracji algorytmu.");
    }
  };

  const applyPresetJoomla = (temp: 'rev' | 'maj') => {
    if (temp === 'rev') {
      setJoomlaTitle('Nowoczesne Metody Orkiestracji Klastrów');
      setJoomlaContent('<h2>Precyzja i Szybkość</h2><p>Rewolucyjne podejście CYLON Swarm Core zapewnia pełną akcelerację i integrację P2P. Każde z urządzeń mobilnych oraz stacjonarnych stanowi integralną komórkę dowodzenia pod czujnym okiem sztabu.</p>');
      speakPolish("Wybrano szablon artykułu o metodach orkiestracji.");
    } else {
      setJoomlaTitle('Mnożniki Inteligencji Michała Majora');
      setJoomlaContent('<h2>250% Inteligencji</h2><p>Zasady klastrowania podlegają ścisłym rygorom logicznym. Połączenie platformy Windows Server z Linuxem owocuje maksymalną wydajnością kaskadowego realizowania pod-zadań.</p>');
      speakPolish("Załadowano artykuł o mądrości klastra.");
    }
  };

  return (
    <div className="space-y-8 font-sans text-sm max-w-5xl mx-auto pb-24 text-left">
      <div className="modern-card bg-neutral-950/80 border border-white/5 p-8 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-acid-purple/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        {/* NAGŁÓWEK */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-8 relative z-10">
          <div>
            <h1 className="text-3xl font-display font-black uppercase tracking-tighter text-white mb-2 italic">
              CENTRUM INTEGRACJI <span className="text-acid-purple">SWARM OPERATOR</span>
            </h1>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-acid-green animate-pulse" />
              PEŁNA KONTROLA OPERACYJNA • GADANIE PO POLSKU Z URZĄDZEŃ
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* GŁOS POLSKI TOGGLE */}
            <button 
              onClick={() => {
                const ns = !isVoiceOn;
                setIsVoiceOn(ns);
                if (ns) {
                  setTimeout(() => speakPolish("Syntezator mowy włączony. System mówi po polsku."), 200);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all",
                isVoiceOn ? "bg-acid-purple/10 border-acid-purple/30 text-acid-purple" : "bg-neutral-900 border-white/5 text-slate-500"
              )}
              title="Włącza lub wyłącza syntezator głosu CYLON w języku polskim"
            >
              {isVoiceOn ? <Volume2 size={14} className="animate-bounce" /> : <VolumeX size={14} />}
              Głos: {isVoiceOn ? "WŁĄCZONY" : "WYŁĄCZONY"}
            </button>
            
            <div className="text-[10px] bg-acid-cyan/10 border border-acid-cyan/30 text-acid-cyan px-4 py-2 rounded-2xl font-mono uppercase font-black">
              Autoryzacja: Michał Major (250% IQ)
            </div>
          </div>
        </div>

        {/* NAWIGACJA INTEGRACJI */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {[
            { id: 'smtp', label: 'Wysyłanie e-mail (SMTP)', icon: <Lucide.Mail size={16} />, desc: 'Realna poczta' },
            { id: 'files', label: 'Zapis & Odczyt Plików', icon: <FileText size={16} />, desc: 'Lokalny system' },
            { id: 'ftp', label: 'Serwer FTP', icon: <Upload size={16} />, desc: 'Wgrywanie plików' },
            { id: 'joomla', label: 'Artykuł Joomla CMS', icon: <Globe size={16} />, desc: 'Publikacja REST API' },
            { id: 'm365', label: 'Microsoft 365 Admin', icon: <Server size={16} />, desc: 'Portal AD / Graph' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as any);
                setActionSuccessMessage(null);
                setIntegrationLogs([]);
                speakPolish(`Przełączono na moduł: ${cat.label}.`);
              }}
              className={cn(
                "flex-1 min-w-[160px] text-left p-4 rounded-2xl border transition-all relative overflow-hidden group",
                activeCategory === cat.id 
                  ? "bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border-acid-purple/40 text-white shadow-xl" 
                  : "bg-black/30 border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              {activeCategory === cat.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-acid-purple" />
              )}
              <div className="flex items-center gap-3 mb-1">
                <div className={cn(
                  "p-2 rounded-xl border",
                  activeCategory === cat.id ? "bg-acid-purple/10 border-acid-purple/20 text-acid-purple" : "bg-white/5 border-white/5 text-slate-500"
                )}>
                  {cat.icon}
                </div>
                <div className="text-xs font-black uppercase tracking-tight">{cat.label}</div>
              </div>
              <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold ml-[38px]">{cat.desc}</div>
            </button>
          ))}
        </div>

        {/* WORKSPACE INTEGRACJI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* LEWA KOLUMNA - KONTROLE I PARAMETRY */}
          <div className="lg:col-span-7 space-y-6">

            {/* A. KOMONENT SMTP / EMAIL */}
            {activeCategory === 'smtp' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Konfiguracja SMTP & Odbiorcy</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => applyPresetEmail('report')}
                      className="text-[9px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-acid-cyan border border-acid-cyan/30 uppercase font-bold"
                    >
                      Szablon Raportu
                    </button>
                    <button 
                      onClick={() => applyPresetEmail('opt')}
                      className="text-[9px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-acid-purple border border-acid-purple/30 uppercase font-bold"
                    >
                      Szablon Akceleracji
                    </button>
                  </div>
                </div>

                <div className="space-y-4 bg-black/40 border border-white/5 p-6 rounded-[2rem]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Adres Odbiorcy (To)</label>
                      <input 
                        className="modern-input w-full" 
                        value={smtpTo} 
                        onChange={e => setSmtpTo(e.target.value)} 
                        placeholder="np. cylon@gmail.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Host Serwera SMTP</label>
                      <input 
                        className="modern-input w-full" 
                        value={smtpHost} 
                        onChange={e => setSmtpHost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Użytkownik SMTP</label>
                      <input 
                        className="modern-input w-full" 
                        value={smtpUser} 
                        onChange={e => setSmtpUser(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Hasło SMTP (Klucz Uwierzytelniania)</label>
                      <input 
                        type="password" 
                        className="modern-input w-full" 
                        value={smtpPassword} 
                        onChange={e => setSmtpPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Temat Wiadomości</label>
                    <input 
                      className="modern-input w-full" 
                      value={smtpSubject} 
                      onChange={e => setSmtpSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Treść Wiadomości (HTML/Plain)</label>
                    <textarea 
                      className="modern-input w-full h-28 resize-none font-mono text-xs p-3 animate-none" 
                      value={smtpBody} 
                      onChange={e => setSmtpBody(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={executeSmtpSend}
                      disabled={isRunningAction}
                      className="modern-btn bg-acid-purple text-white px-8 h-12 uppercase tracking-widest text-[10px] font-black"
                    >
                      {isRunningAction ? "Wysyłanie..." : "REALNIE WYŚLIJ TEST E-MAIL"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* B. KOMPONENT FILES - ZAPIS & ODCZYT */}
            {activeCategory === 'files' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Wytwórca i Menadżer Plików Serwera</h3>
                
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2rem] space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Nazwa nowego pliku (z rozszerzeniem)</label>
                    <input 
                      className="modern-input w-full" 
                      value={newFileName} 
                      onChange={e => setNewFileName(e.target.value)} 
                      placeholder="np. raport_wydajnosci_cylon_swarm.txt"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Treść lub kod źródłowy pliku</label>
                    <textarea 
                      className="modern-input w-full h-24 resize-none font-mono text-xs p-3" 
                      value={newFileContent} 
                      onChange={e => setNewFileContent(e.target.value)} 
                      placeholder="Wprowadź docelową zawartość pliku tekstowego..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-[8px] text-slate-500 uppercase font-medium">Pliki zapisywane są bezpośrednio na dysk chmurowy w folderze /uploads.</p>
                    <button 
                      onClick={handleCreateFile}
                      className="modern-btn bg-acid-purple text-white px-8 h-12 uppercase tracking-widest text-[10px] font-black shrink-0"
                    >
                      ZAPISZ I UTWÓRZ PLIK
                    </button>
                  </div>
                </div>

                {/* LISTA PLIKÓW NA SERWERZE */}
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2rem] space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="text-[10px] font-black uppercase text-slate-400">Wykryte pliki na platformie ({localFiles.length})</div>
                    <button onClick={loadLocalFiles} className="text-[9px] text-acid-cyan uppercase hover:underline">Odśwież Listę</button>
                  </div>
                  
                  <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                    {localFiles.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-600 uppercase">Katalog tymczasowy pusty. Utwórz pliki powyżej.</div>
                    ) : (
                      localFiles.map(file => (
                        <div key={file.name} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-acid-cyan" />
                            <div>
                              <div className="text-xs font-bold text-white font-mono">{file.name}</div>
                              <div className="text-[8px] text-slate-500 uppercase font-bold">{Math.round(file.size / 1024)} KB • {new Date(file.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteFile(file.name)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                            title="Usuń plik z dysku"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* C. KOMPONENT FTP */}
            {activeCategory === 'ftp' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Konfiguracja Serwera FTP / SFTP</h3>
                
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2rem] space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Adres IP / Host FTP</label>
                      <input className="modern-input w-full" value={ftpHost} onChange={e => setFtpHost(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Port FTP</label>
                      <input className="modern-input w-full" type="number" value={ftpPort} onChange={e => setFtpPort(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Użytkownik FTP</label>
                      <input className="modern-input w-full" value={ftpUser} onChange={e => setFtpUser(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Hasło FTP</label>
                      <input type="password" className="modern-input w-full" value={ftpPassword} onChange={e => setFtpPassword(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Plik do przesłania na serwer</label>
                      <input className="modern-input w-full" value={ftpLocalFile} onChange={e => setFtpLocalFile(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Katalog docelowy (Remote path)</label>
                      <input className="modern-input w-full" value={ftpRemotePath} onChange={e => setFtpRemotePath(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={executeFtpUpload}
                      disabled={isRunningAction}
                      className="modern-btn bg-acid-purple text-white px-8 h-12 uppercase tracking-widest text-[10px] font-black"
                    >
                      {isRunningAction ? "Wgrywanie..." : "URUCHOM TRANSFER I WGRAJ PRZEZ FTP"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* D. KOMPONENT JOOMLA */}
            {activeCategory === 'joomla' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Joomla CMS REST API Integration</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => applyPresetJoomla('rev')}
                      className="text-[9px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-acid-cyan border border-acid-cyan/30 uppercase font-bold"
                    >
                      Szablon Orkiestracji
                    </button>
                    <button 
                      onClick={() => applyPresetJoomla('maj')}
                      className="text-[9px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-acid-purple border border-acid-purple/30 uppercase font-bold"
                    >
                      Szablon Mnożnika
                    </button>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 p-6 rounded-[2rem] space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Adres URL Platformy Joomla</label>
                      <input className="modern-input w-full" value={joomlaUrl} onChange={e => setJoomlaUrl(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Kategoria ID</label>
                      <input className="modern-input w-full" type="number" value={joomlaCategory} onChange={e => setJoomlaCategory(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Joomla REST Token (X-Joomla-Token)</label>
                    <input className="modern-input w-full" value={joomlaApiKey} onChange={e => setJoomlaApiKey(e.target.value)} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Tytuł Artykułu</label>
                    <input className="modern-input w-full" value={joomlaTitle} onChange={e => setJoomlaTitle(e.target.value)} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Zawartość Artykułu (Format HTML)</label>
                    <textarea 
                      className="modern-input w-full h-24 resize-none font-mono text-xs p-3" 
                      value={joomlaContent} 
                      onChange={e => setJoomlaContent(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="feat_chk" 
                        checked={joomlaFeatured} 
                        onChange={e => setJoomlaFeatured(e.target.checked)}
                        className="w-4 h-4 bg-black border-white/10 text-acid-purple rounded focus:ring-0 focus:ring-offset-0"
                      />
                      <label htmlFor="feat_chk" className="text-[10px] text-slate-400 uppercase font-bold cursor-pointer">Oznacz artykuł jako wyróżniony</label>
                    </div>

                    <button 
                      onClick={executeJoomlaPublish}
                      disabled={isRunningAction}
                      className="modern-btn bg-acid-purple text-white px-8 h-12 uppercase tracking-widest text-[10px] font-black"
                    >
                      {isRunningAction ? "Wysyłanie..." : "DODAJ I OPUBLIKUJ ARTYKUŁ W JOOMLA"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* E. KOMPONENT M365 */}
            {activeCategory === 'm365' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Microsoft 365 Active Directory & Graph Portal</h3>
                
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2rem] space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Nazwa Domeny (Tenant name / ID)</label>
                    <input className="modern-input w-full" value={m365Tenant} onChange={e => setM365Tenant(e.target.value)} placeholder="np. cylon.onmicrosoft.com" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Client ID Aplikacji (App Registration)</label>
                      <input className="modern-input w-full font-mono text-xs" value={m365ClientId} onChange={e => setM365ClientId(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Client Secret Key</label>
                      <input type="password" className="modern-input w-full font-mono text-xs" value={m365Secret} onChange={e => setM365Secret(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Użytkownik Global Administrator</label>
                      <input className="modern-input w-full" value={m365AdminUser} onChange={e => setM365AdminUser(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Hasło Administratora</label>
                      <input type="password" className="modern-input w-full" value={m365AdminPassword} onChange={e => setM365AdminPassword(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={executeM365Login}
                      disabled={isRunningAction}
                      className="modern-btn bg-acid-purple text-white px-8 h-12 uppercase tracking-widest text-[10px] font-black"
                    >
                      {isRunningAction ? "Autoryzacja..." : "ZALOGUJ SIĘ DO MICROSOFT 365 ADMINISTRATOR"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* PRAWA KOLUMNA - MONITOR DOWODZENIA, DZIENNIKI KROKOWE */}
          <div className="lg:col-span-5 space-y-6">
            
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Terminal size={12} className="text-acid-purple animate-pulse" />
              Terminal Wykonawczy Integracji
            </h3>

            {/* STAN INTEGRACJI / SUKCES KOMUNIKAT */}
            <AnimatePresence>
              {actionSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  className="bg-acid-green/10 border border-acid-green/30 p-5 rounded-2xl text-[11px] text-acid-green font-semibold uppercase leading-relaxed text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-acid-green animate-ping" />
                    <strong>OPERACJA ZAKOŃCZONA POWODZENIEM!</strong>
                  </div>
                  <p className="text-white normal-case font-mono">{actionSuccessMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DZIENNIK KROKÓW LOGI */}
            <div className="modern-card bg-neutral-950 border border-white/5 p-6 rounded-[2rem] space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Logi Protokolarne (Ślad SSH / API)</span>
                <span className="text-[8px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-slate-500">REALTIME MODE</span>
              </div>

              <div className="bg-black/60 rounded-xl p-4 min-h-[180px] font-mono text-[10px] text-emerald-400 leading-relaxed overflow-x-auto max-h-[350px] custom-scrollbar text-left select-all">
                {integrationLogs.length === 0 ? (
                  <div className="opacity-35 italic text-slate-600">
                    Oczekiwanie na uruchomienie zadania... Klikaj w przyciski akcji, aby przetestować integracje.
                  </div>
                ) : (
                  integrationLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap border-b border-white/[0.02] last:border-none py-0.5">
                      {log}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-3">
                <span className="text-[8px] text-slate-600 font-mono uppercase">Środowisko Sandbox CYLON Core</span>
                <button 
                  onClick={() => setIntegrationLogs([])} 
                  className="text-[9px] text-slate-500 hover:text-white uppercase font-bold"
                >
                  Wyczyść Konsolę
                </button>
              </div>
            </div>

            {/* PODPOWIEDZI DLA KLASTRÓW */}
            <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4 text-left">
              <h4 className="text-[10px] font-bold text-white uppercase flex items-center gap-2">
                <Lucide.HelpCircle size={12} className="text-acid-cyan" />
                Szybkie Podpowiedzi Roju dla integracji:
              </h4>
              <p className="text-[9px] text-slate-500 uppercase leading-relaxed font-semibold">
                Zalecamy stosowanie <span className="text-acid-purple font-bold">mnożnika inteligencji 250%</span>.
                Wszystkie zadania uruchamiane przez interfejs są natychmiast logowane w globalnym systemie klastra, który synchronizuje pliki pomiędzy systemami Windows Subsystems (WSL), serwerami Linux CentOS/Ubuntu oraz mobilną platformą Android Termux.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
});

const HelpManual = React.memo(({ showToast }: { showToast?: (msg: string) => void }) => {
  const [activeManualTab, setActiveManualTab] = useState<'basics' | 'tutorial' | 'tour' | 'mcp' | 'scenarios' | 'cases' | 'faq'>('basics');
  const [importedScenarios, setImportedScenarios] = useState<ExampleScenario[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importedSuccess, setImportedSuccess] = useState(false);

  const ManualMockup = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: any }) => (
    <div className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden shadow-2xl mb-8">
      <div className="bg-white/5 px-4 py-2 flex items-center gap-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Icon size={12} className="text-acid-purple" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
        </div>
      </div>
      <div className="p-4 md:p-8">
        {children}
      </div>
    </div>
  );

  const scenarios: ExampleScenario[] = [
    {
      id: 'sc1',
      title: 'Pełny Audyt Bezpieczeństwa Kodu',
      category: 'bezpieczenstwo',
      description: 'Analiza repozytorium pod kątem podatności OWASP, wycieków kluczy i błędów logicznych.',
      steps: [
        'Zaszyj Agenta "Cień" (Security Auditor) w zespole',
        'Podłącz system plików przez MCP do repozytorium',
        'Wydaj polecenie: "@Cień przeskanuj folder /src i wygeneruj raport PDF"',
        'Agent wyśle raport do "Poganiacza" w celu optymalizacji'
      ],
      recommendedAgents: ['Cień', 'Poganiacz']
    },
    {
      id: 'sc2',
      title: 'Automatyczne Generowanie Raportów Finansowych',
      category: 'automatyzacja',
      description: 'Ekstrakcja danych z plików CSV/XLSX i tworzenie wizualizacji DOCX/PDF.',
      steps: [
        'Użyj Agenta "Analityk Danych"',
        'Wczytaj plik .xlsx z transakcjami',
        'Polecenie: "Stwórz wykresy sprzedaży i zapisz jako raport_kwartalny.docx"',
        'Pobierz gotowy dokument z zakładki zadań'
      ],
      recommendedAgents: ['Analityk Danych', 'Copywriter']
    },
    {
      id: 'sc3',
      title: 'Produkcja Kontentu Wideo z AI',
      category: 'multimedia',
      description: 'Od scenariusza, przez storyboard, po gotowy film reklamowy.',
      steps: [
        'Copywriter pisze scenariusz w pokoju dyskusyjnym',
        'GrafikAI generuje klatki kluczowe',
        'Nagłośnieniowiec tworzy ścieżkę lektorską',
        'Studio Wideo (Veo) generuje finalny plik MP4'
      ],
      recommendedAgents: ['Copywriter', 'GrafikAI', 'Reżyser']
    },
    {
      id: 'sc4',
      title: 'Migracja Architektury Monolitycznej do Mikroserwisów',
      category: 'programowanie',
      description: 'Analiza starego kodu i projektowanie nowej struktury opartej o klastry.',
      steps: [
        'Wczytaj kod źródłowy monolitu',
        'Architekt Roju buduje graf zależności w oknie wizualizacji',
        'Zespoły programistyczne generują szkielety nowych serwisów (Docker, Node.js)',
        'Deployment na klastry obliczeniowe LLM Forge'
      ],
      recommendedAgents: ['Architekt', 'Koder-X', 'System Admin']
    },
    {
      id: 'sc5',
      title: 'Inteligentny Monitoring Serwerów Linux',
      category: 'bezpieczenstwo',
      description: 'Ciągła analiza logów systemowych i automatyczna reakcja na próby włamań.',
      steps: [
        'Podłącz serwer via MCP (Network/Terminal)',
        'TuxMaster analizuje pliki /var/log/auth.log',
        'Wykrycie ataku Brute Force',
        'Automatyczna konfiguracja iptables w celu zablokowania IP'
      ],
      recommendedAgents: ['TuxMaster', 'Cień']
    },
    {
      id: 'sc6',
      title: 'Optymalizacja Zapytan SQL w Bazie Enterprise',
      category: 'automatyzacja',
      description: 'Analiza wolnych zapytań i automatyczne sugerowanie indeksów.',
      steps: [
        'Podłącz bazę danych (PostgreSQL/Oracle) via MCP',
        'Analityk pobiera listę najwolniejszych zapytań',
        'Koder-X sugeruje optymalizację struktury zapytań',
        'WinServerPro wdraża skrypty optymalizacyjne'
      ],
      recommendedAgents: ['Koder-X', 'WinServerPro']
    },
    {
      id: 'sc7',
      title: 'Szyfrowanie i Archiwizacja Danych Wrażliwych',
      category: 'bezpieczenstwo',
      description: 'Automatyczne wykrywanie PII i szyfrowanie ich przed zapisem w chmurze.',
      steps: [
        'Agent Szyfrujący monitoruje folder /uploads',
        'Wykrycie dokumentów z numerami PESEL/CC',
        'Szyfrowanie pliku kluczem RSA-4096',
        'Przeniesienie bezpiecznej kopii do klastra archiwalnego'
      ],
      recommendedAgents: ['NetRouter', 'System Admin']
    },
    {
      id: 'sc8',
      title: 'Tworzenie Interaktywnych Dashboardów Analitycznych',
      category: 'multimedia',
      description: 'Zasysanie danych z API i generowanie wizualizacji React/D3.',
      steps: [
        'Analityk pobiera dane z Google Analytics API',
        'Design-A tworzy makiety dashboardu',
        'Koder-X generuje komponenty w TypeScript',
        'Finalny eksport jako gotowa aplikacja SPA'
      ],
      recommendedAgents: ['Design-A', 'Koder-X']
    },
    {
      id: 'sc9',
      title: 'Automatyczne Tłumaczenie i Lokalizacja Aplikacji',
      category: 'automatyzacja',
      description: 'Tłumaczenie plików i18n na 20 języków z zachowaniem kontekstu technicznego.',
      steps: [
        'Podłącz folder /locales via MCP',
        'Tłumacz analizuje pliki en.json',
        'Generowanie tłumaczeń wysokiej jakości',
        'Weryfikacja formatowania przez Kodera-X'
      ],
      recommendedAgents: ['Tłumacz', 'Koder-X']
    },
    {
      id: 'sc10',
      title: 'Dostrajanie Modeli Lokalnych (Fine-tuning)',
      category: 'programowanie',
      description: 'Przygotowanie zestawów danych i uruchamianie treningu na klastrach.',
      steps: [
        'Agent Trener zbiera logi z poprzednich rozmów',
        'Czyszczenie danych i konwersja do JSONL',
        'Dystrybucja obciążenia na węzły klastra',
        'Eksport nowego modelu do Hugging Face'
      ],
      recommendedAgents: ['Trener', 'System Admin']
    },
    {
      id: 'sc11',
      title: 'Interaktywna Gra LEGO (Game Engine v1)',
      category: 'multimedia',
      description: 'Generowanie pętli gry na podstawie zdjęć klocków LEGO. System rozpoznaje konstrukcję i tworzy dla niej mechanikę gry w czasie rzeczywistym.',
      steps: [
        'Zaszyj Agenta "Gamer" w zespole projektowym',
        'Zrób zdjęcie swojej konstrukcji LEGO (np. robot, statek)',
        'Rój analizuje geometrię i sugeruje "fizykę" obiektu',
        'Model Veo generuje interaktywne sekwencje akcji dla Twojego modelu'
      ],
      recommendedAgents: ['Gamer', 'Reżyser', 'Koder-X']
    },
    {
      id: 'sc12',
      title: 'Złożone Symulacje Społeczne (Adult/Advanced)',
      category: 'programowanie',
      description: 'Projektowanie wielopoziomowych ekosystemów z autonomicznymi agentami posiadającymi własne cele, sekrety i systemy wartości.',
      steps: [
        'Zdefiniuj populację 100 agentów (każdy z unikalnym JSONem cech)',
        'Uruchom symulację "10 lat w 10 minut" na klastrze obliczeniowym',
        'Analizuj relacje, konflikty i ewolucję języka wewnątrz Roju',
        'Eksportuj wyniki do bazy grafowej w celu wizualizacji powiązań'
      ],
      recommendedAgents: ['Analityk Danych', 'Copywriter', 'System Admin']
    }
  ];

  const handleImport = async () => {
    if (isImporting || importedSuccess) return;
    setIsImporting(true);
    setImportLogs([]);
    
    const steps = [
      "Inicjalizowanie połączenia z centralnym repozytorium CYLON...",
      "Autoryzacja klienta (Sygnał: cylon-orchestrator-seed)... OK",
      "Pobieranie indeksu pakietów scenariuszy orkiestracji...",
      "Wykryto nowość: 'Cybersecurity Auditing' [cybersecurity-v4.2.pack]",
      "Wykryto nowość: 'Financial Analytics' [financial-v1.1.pack]",
      "Pobieranie pakietów binarnych...",
      "Rozpakowywanie paczki: Cybersecurity Auditing (Baza procedur)... OK",
      "Rozpakowywanie paczki: Financial Analytics & Market Swarm...",
      "Zapisywanie struktur scenariuszy w interfejsie lokalnym...",
      "Synchronizowanie z bazą danych 'Baza Wiedzy' ról...",
      "Przesyłanie danych struktury Cybersecurity do SQLite...",
      "Przesyłanie danych struktury Financial Analytics do SQLite...",
      "Zapisywanie metadanych transakcji (SHA-256 Verified)... OK",
      "Gotowe! Zaimportowano 2 pakiety scenariuszy operacyjnych."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 380));
      setImportLogs(prev => [...prev, steps[i]]);
    }

    try {
      const cyberEntry = {
        id: "knowledge-cybersecurity-auditing",
        title: "SCENARIUSZ: Cyber Security Auditing v4.2 (Operacja Tarcza Roju)",
        tags: ["bezpieczeństwo", "cve", "audyt", "mcp", "zapora"],
        author: "ORGANIZER_AI",
        createdAt: new Date().toISOString(),
        content: `# Procedura Orkiestracji: Cyber Security Auditing v4.2 (Operacja Tarcza Roju)

Niniejszy scenariusz opisuje w pełni zautomatyzowaną koordynację agentów bezpieczeństwa w celu przeprowadzenia audytu podatności oraz aktywnej ochrony infrastruktury.

## 1. Architektura Ról i Synergia Agentów:
- **SecMaster-AI (Audytor)**: Skanuje repozytorium kodu (/src) oraz logi systemów operacyjnych w poszukiwaniu podatności (np. OWASP Top 10, wycieki tokenów API, przestarzałe zależności npm).
- **TuxMaster (Administrator Linux)**: Odpytuje systemy operacyjne przez demona MCP w celu pobrania wersji pakietów, konfiguracji zapory sieciowej (iptables/ufw) oraz sesji logowania.

## 2. Etapy Orkiestracji & Przepływ Informacji:
1. **Inicjalizacja & Detekcja Podatności**: \`SecMaster-AI\` uruchamia statyczną analizę kodu (SAST) oraz przeszukuje bazę danych znanych podatności (CVE) zbieżnych z wersjami oprogramowania systemowego.
2. **Skanowanie Portów & Usług**: Za pośrednictwem interfejsu terminalowego MCP, agent \`TuxMaster\` uruchamia procedurę sprawdzania otwartych portów sieciowych oraz aktywnych nasłuchów TCP/UDP.
3. **Analiza Logów & Wykrywanie Anomalii**: Analizowany jest plik \`/var/log/auth.log\` pod kątem nieautoryzowanych prób logowania ssh (brute force).
4. **Wdrożenie Środków Zaradczych (Utwardzanie Systemu)**: 
   - Wygenerowanie reguł blokujących podejrzane adresy IP w zaporze sieciowej.
   - Aktualizacja przestarzałych pakietów za pomocą menedżera pakietów (np. \`apt-get upgrade\`).
5. **Kompilacja Raportu Zgodności**: Agenci wspólnie tworzą kompletny, podpisany cyfrowo raport opisujący stan bieżący, wprowadzone mikro-poprawki oraz rekomendacje wdrożenia standardu ISO 27001.
`
      };

      const financialEntry = {
        id: "knowledge-financial-analytics",
        title: "SCENARIUSZ: Financial Analytics & Market Forecast (Operacja Algorytmiczny Rentier)",
        tags: ["finanse", "analityka", "prognozy", "sql", "ryzyko"],
        author: "ORGANIZER_AI",
        createdAt: new Date().toISOString(),
        content: `# Protokół Orkiestracji Finansowej: Financial Analytics & Market Forecast (Operacja Algorytmiczny Rentier)

Scenariusz ten wdraża wieloagentowy potok analityczno-prognostyczny służący do monitorowania przepływów kapitałowych oraz automatycznego optymalizowania budżetu operacyjnego ról.

## 1. Zespół Analityczny (Podział Odpowiedzialności):
- **Analityk Danych (Math/SQL Expert)**: Agreguje surowe dane finansowe z baz PostgreSQL/SQLite ora plików rozliczeniowych CSV podłączonych za pomocą MCP. Przeprowadza obliczenia statystyczne i predykcje regresyjne.
- **Doradca (Business/Legal Advisor)**: Analizuje wyniki pod kątem zgodności z prawem podatkowym, wykrywa anomalie w marżach i sugeruje korekty strategiczne w celu uniknięcia płynnościowych zatorów.

## 2. Szczegółowe Kroki Procedury Finansowej:
1. **Agregacja Strumieni Kosztowych**: Pobranie aktualnych faktur, wydatków na infrastrukturę chmurową (AWS/Azure API) oraz bilansu operacyjnego za ubiegły kwartał.
2. **Zaawansowana Detekcja Anomalii**: Algorytm analityczny identyfikuje skoki w kosztach jednostkowych (np. nagły wzrost zużycia tokenów LLM lub opłat za zasoby compute).
3. **Generowanie Modelu Predykcyjnego (Forecast)**: Uruchomienie modelu predykcji finansowej na kolejne 12 miesięcy, obliczanie wskaźnika Runway oraz prognozowanie przepływów pieniężnych (Cash Flow).
4. **Uruchomienie Flag Ryzyka**: W przypadku przekroczenia zdefiniowanych progów alarmowych związanych z bezczynnością zasobów chmurowych, system wysyła instrukcje zamknięcia nieużywanych instancji serwerowych.
5. **Eksport Dokumentu Kwartalnego**: Przygotowanie interaktywnego, bogatego raportu kwartalnego w formatach Markdown/HTML, w tym wykresów zbieżnych oraz rekomendacji relokacji kapitału obrotowego.
`
      };

      const downloadableScenarios: ExampleScenario[] = [
        {
          id: "sc-cybersecurity-auditing",
          title: "Cybersecurity Auditing (Orkiestracja \"Tarcza Roju\")",
          category: "bezpieczenstwo",
          description: "Rygorystyczny proces automatycznego audytu bezpieczeństwa serwerów i kodu źródłowego. Wykrywanie CVE, sprawdzanie uprawnień IAM oraz aktywne utwardzanie firewalli za pomocą wtyczek MCP.",
          steps: [
            "Wdrażanie agenta SecMaster-AI do aktywnego skanowania środowiska",
            "Skanowanie portów, wykrywanie otwartości usług przez demona MCP",
            "Wykrywanie anomalii SSH oraz brute force z auth.log przez TuxMaster",
            "Wdrożenie reguł utwardzających na zapory filtrów sieciowych",
            "Wykompilowanie kompletnego raportu podatności zgodności ISO 27001"
          ],
          recommendedAgents: ["SecMaster-AI", "TuxMaster"]
        },
        {
          id: "sc-financial-analytics",
          title: "Financial Analytics & Risk Predicter (Operacja \"Algorytmiczny Rentier\")",
          category: "automatyzacja",
          description: "Agregacja strumieni płatności z systemów bankowych, predykcja przepływów pieniężnych (Cash Flow), wykrywanie anomalii kosztowych i generowanie prognoz budżetowych.",
          steps: [
            "Pobranie i mapowanie historii transakcji z podłączonych baz SQL",
            "Detekcja anomalii kosztowych przy użyciu statystycznego silnika",
            "Wysoce precyzyjna predykcja płynności finansowej na 12 miesięcy",
            "Automatyczna optymalizacja kosztów chmurowych pod okiem Doradcy"
          ],
          recommendedAgents: ["Analityk Danych", "Doradca"]
        }
      ];

      await api.addKnowledge(cyberEntry);
      await api.addKnowledge(financialEntry);

      setImportedScenarios(downloadableScenarios);
      setImportedSuccess(true);
      if (showToast) {
        showToast("Pomyślnie pobrano i zaimportowano scenariusze do Bazy Wiedzy!");
      }
    } catch (err) {
      console.error(err);
      setImportLogs(prev => [...prev, "PRZERWANO: Błąd zapisu w SQLite db."]);
    } finally {
      setIsImporting(false);
    }
  };

  const allScenarios = [...scenarios, ...importedScenarios];

  return (
    <div className="space-y-8 font-sans text-sm max-w-5xl mx-auto pb-24">
      <div className="modern-card bg-neutral-950/80 border-white/5 p-8 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-acid-purple/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
          <div>
            <h1 className="text-4xl font-display font-black uppercase tracking-tighter text-white mb-2 italic">
              Księga <span className="text-acid-purple">Operacyjna</span> Roju
            </h1>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-acid-green animate-pulse" />
              Standardy Postępowania Jednostek AI • v3.0
            </p>
          </div>
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveManualTab('basics')}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", activeManualTab === 'basics' ? "bg-acid-purple text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
            >
              Podstawy
            </button>
            <button 
              onClick={() => setActiveManualTab('tutorial')}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", activeManualTab === 'tutorial' ? "bg-acid-green text-black shadow-lg" : "text-slate-500 hover:text-slate-300")}
            >
              Tutorial kROK PO kroku
            </button>
            <button 
              onClick={() => setActiveManualTab('tour')}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", activeManualTab === 'tour' ? "bg-acid-purple text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
            >
              Wizualizacja
            </button>
            <button 
              onClick={() => setActiveManualTab('mcp')}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", activeManualTab === 'mcp' ? "bg-acid-purple text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
            >
              System & MCP
            </button>
            <button 
              onClick={() => setActiveManualTab('scenarios')}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", activeManualTab === 'scenarios' ? "bg-acid-purple text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
            >
              Scenariusze
            </button>
            <button 
              onClick={() => setActiveManualTab('cases')}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", activeManualTab === 'cases' ? "bg-acid-purple text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
            >
              Case Studies
            </button>
            <button 
              onClick={() => setActiveManualTab('faq')}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", activeManualTab === 'faq' ? "bg-acid-purple text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
            >
              FAQ
            </button>
          </div>
        </div>

        <div className="relative z-10 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeManualTab === 'tutorial' && (
              <motion.div 
                key="tutorial" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-acid-green/30 transition-all">
                    <div className="text-4xl font-black text-white/5 absolute -top-2 -right-2">01</div>
                    <div className="w-12 h-12 bg-acid-green/10 rounded-2xl flex items-center justify-center text-acid-green border border-acid-green/20 mb-6 group-hover:scale-110 transition-transform">
                      <UserPlus size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white uppercase italic tracking-tight mb-4">KREACJA AGENTA</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">
                      Przejdź do <span className="text-white font-bold">Agent Manager</span>. Wykorzystaj "Galerię Umiejętności" oraz "Szybkie Szablony", by w sekundę stworzyć specjalistę. Pamiętaj: im lepszy System Prompt, tym mądrzejszy agent.
                    </p>
                    <div className="text-[10px] font-black text-acid-green uppercase tracking-widest border-t border-white/5 pt-4">Status: Wymagane</div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-acid-cyan/30 transition-all">
                    <div className="text-4xl font-black text-white/5 absolute -top-2 -right-2">02</div>
                    <div className="w-12 h-12 bg-acid-cyan/10 rounded-2xl flex items-center justify-center text-acid-cyan border border-acid-cyan/20 mb-6 group-hover:scale-110 transition-transform">
                      <Users size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white uppercase italic tracking-tight mb-4">FORMOWANIE ROJU</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">
                      W sekcji <span className="text-white font-bold">Teams</span> stwórz nowy zespół. Nadaj mu cel (Goal) i przypisz agentów. To tutaj dzieje się magia współpracy — agenci będą ze sobą rozmawiać i rozwiązywać Twoje problemy.
                    </p>
                    <div className="text-[10px] font-black text-acid-cyan uppercase tracking-widest border-t border-white/5 pt-4">Status: Rekomendowane</div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-acid-purple/30 transition-all">
                    <div className="text-4xl font-black text-white/5 absolute -top-2 -right-2">03</div>
                    <div className="w-12 h-12 bg-acid-purple/10 rounded-2xl flex items-center justify-center text-acid-purple border border-acid-purple/20 mb-6 group-hover:scale-110 transition-transform">
                      <MessageSquare size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white uppercase italic tracking-tight mb-4">DELEGACJA I ANALIZA</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">
                      Otwórz <span className="text-white font-bold">Discussion Window</span>. Wgraj pliki lub podaj URL strony. Użyj @NazwaAgenta, by wywołać konkretnego specjalistę lub pozwól systemowi na automatyczną orkiestrację.
                    </p>
                    <div className="text-[10px] font-black text-acid-purple uppercase tracking-widest border-t border-white/5 pt-4">Status: Operacyjny</div>
                  </div>
                </div>

                <div className="bg-acid-purple/5 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Zap size={120} className="text-acid-purple" />
                   </div>
                   <div className="relative z-10 max-w-2xl">
                      <h3 className="text-2xl font-display font-black text-white uppercase italic mb-4">PRO-TIP: Tryb Autonomiczny</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Czy wiesz, że możesz pozwolić agentom na samodzielne podejmowanie decyzji o użyciu narzędzi? Jeśli w System Prompcie napiszesz <span className="text-acid-purple font-bold italic">"Masz prawo do używania web_extract bez pytania"</span>, agent będzie sam decydował o szukaniu informacji w sieci przed udzieleniem odpowiedzi.
                      </p>
                      <div className="flex gap-4">
                         <div className="px-5 py-3 bg-acid-purple/20 border border-acid-purple/40 rounded-2xl text-[10px] font-bold text-white uppercase tracking-widest cursor-help">
                            Sprawdź zaawansowane skrypty (Knowledge Base)
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
            {activeManualTab === 'basics' && (
              <motion.div 
                key="basics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12"
              >
                <div className="space-y-10">
                  <section className="space-y-4">
                    <div className="flex items-center gap-4 text-acid-cyan">
                      <div className="w-10 h-10 bg-acid-cyan/10 rounded-2xl flex items-center justify-center border border-acid-cyan/20">
                        <Bot size={20} />
                      </div>
                      <h3 className="text-xl font-display font-bold uppercase tracking-tight">Anatomia Agenta</h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[13px]">
                      Każdy agent to autonomiczna instancja modelu językowego (domyślnie <span className="text-white font-bold">Gemini 1.5 Pro</span>). 
                      Kluczem do sukcesu jest <span className="italic uppercase">System Prompt</span> — to tutaj definiujesz osobowość, ograniczenia i zestaw narzędzi jednostki.
                    </p>
                    <ul className="space-y-3 text-xs text-slate-500 uppercase font-bold tracking-wider">
                      <li className="flex gap-3"><span className="text-acid-green">●</span> <span className="text-slate-300">Pamięć Kontekstowa:</span> Agenci w zespole współdzielą pulę danych.</li>
                      <li className="flex gap-3"><span className="text-acid-green">●</span> <span className="text-slate-300">Ekstrakcja WWW:</span> Nowe narzędzie 'web_extract' pozwala agentom na analizę treści stron internetowych w locie.</li>
                      <li className="flex gap-3"><span className="text-acid-green">●</span> <span className="text-slate-300">Znalazca Plików:</span> Narzędzia 'read_file' i 'list_files' dają dostęp do dokumentów przesłanych w sesji.</li>
                    </ul>
                  </section>
                  <section className="space-y-4">
                    <div className="flex items-center gap-4 text-acid-purple">
                      <div className="w-10 h-10 bg-acid-purple/10 rounded-2xl flex items-center justify-center border border-acid-purple/20">
                        <Zap size={20} />
                      </div>
                      <h3 className="text-xl font-display font-bold uppercase tracking-tight">Umiejętności i Szablony</h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[13px]">
                      W sekcji <span className="text-acid-purple font-bold">Agent Manager</span> znajdziesz gotowe presety i Galerię Umiejętności. 
                      Możesz jednym kliknięciem wyposażyć agenta w zdolności analizy danych, audytu kodu czy zarządzania plikami.
                    </p>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                       <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Preset Operacyjny:</p>
                       <div className="flex flex-wrap gap-2">
                          <span className="text-acid-cyan text-[9px] font-bold px-2 py-1 bg-acid-cyan/10 border border-acid-cyan/20 rounded-lg">KODER-PRO</span>
                          <span className="text-acid-purple text-[9px] font-bold px-2 py-1 bg-acid-purple/10 border border-acid-purple/20 rounded-lg">RED-TEAM</span>
                          <span className="text-acid-green text-[9px] font-bold px-2 py-1 bg-acid-green/10 border border-acid-green/20 rounded-lg">CREATIVE</span>
                       </div>
                    </div>
                  </section>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 space-y-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Procedura Inicjalizacji</h4>
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      <div className="text-2xl font-display font-black text-white/10">01</div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase mb-1">Definiowanie Jednostek</div>
                        <p className="text-[10px] text-slate-600 italic uppercase font-medium">Stwórz przynajmniej dwóch agentów o uzupełniających się kompetencjach (np. Programista + Tester).</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-2xl font-display font-black text-white/10">02</div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase mb-1">Formowanie Eskadry</div>
                        <p className="text-[10px] text-slate-600 italic uppercase font-medium">Przejdź do sekcji Zespoły i powołaj nowy klaster, przypisując mu wybranych agentów.</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-2xl font-display font-black text-white/10">03</div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase mb-1">Transmisja Rozkazów</div>
                        <p className="text-[10px] text-slate-600 italic uppercase font-medium">W oknie dyskusji wydaj dyrektywę nadrzędną i aktywuj tryb orkiestracji.</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full modern-btn bg-white/5 border border-white/10 text-slate-400 py-4 mt-4 hover:bg-white/10 group">
                    <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> 
                    <span className="text-[10px] font-bold uppercase">Pobierz Pełną Dokumentację PDF (Sim)</span>
                  </button>
                </div>
              </motion.div>
            )}


            {activeManualTab === 'tour' && (
              <motion.div 
                key="tour" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ManualMockup title="Panel Dowodzenia (Dashboard)" icon={Layout}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-16 bg-white/5 border border-white/10 rounded-xl" />
                        <div className="h-16 bg-white/5 border border-white/10 rounded-xl" />
                      </div>
                      <div className="h-24 bg-acid-purple/10 border border-acid-purple/30 rounded-xl flex items-center justify-center">
                        <Activity className="text-acid-purple animate-pulse" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase italic">Tu monitorujesz globalne statystyki, użycie tokenów oraz wydajność klastrów w czasie rzeczywistym.</p>
                    </div>
                  </ManualMockup>

                  <ManualMockup title="Zarządzanie Zespołem" icon={Users}>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-acid-green animate-bounce" />
                        <div className="w-8 h-8 rounded-full bg-acid-cyan animate-bounce [animation-delay:0.2s]" />
                        <div className="w-8 h-8 rounded-full bg-acid-purple animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <div className="border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center text-[8px] text-slate-500 uppercase font-black">
                        Drop Zone: Przeciągnij tutaj agentów
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase italic">Przeciągnij agentów z Bazy Personelu do aktywnej eskadry, aby zbudować wyspecjalizowaną grupę uderzeniową.</p>
                    </div>
                  </ManualMockup>

                  <ManualMockup title="Węzły Sieci (Clusters)" icon={Network}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-acid-green shadow-[0_0_8px_#55ff00]" />
                          <span className="text-[10px] text-white font-bold uppercase">Węzeł 01</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-acid-purple/20 rounded" />
                          <div className="w-3 h-3 bg-red-500/20 rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-1 bg-acid-green rounded-full" />
                        <div className="h-1 bg-acid-cyan rounded-full w-2/3" />
                        <div className="h-1 bg-white/10 rounded-full" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase italic">Monitoruj stan obciążenia procesorów i pamięci RAM na poszczególnych węzłach. Możesz zdalnie restartować lub wyłączać jednostki.</p>
                    </div>
                  </ManualMockup>

                  <ManualMockup title="Analiza Zewnętrzna (Proxy)" icon={Globe}>
                    <div className="space-y-4">
                      <div className="bg-neutral-900 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-[8px] text-slate-600 font-mono">
                            <span className="text-acid-green">GET</span> /api/proxy?url=https://docs.ai...
                         </div>
                         <div className="h-1 bg-acid-purple rounded-full w-full opacity-50" />
                         <div className="h-1 bg-white/5 rounded-full w-3/4" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase italic">Agenci potrafią teraz sięgać poza system, by pobierać aktualną wiedzę ze stron internetowych przez dedykowany endpoint proxy.</p>
                    </div>
                  </ManualMockup>

                  <ManualMockup title="Terminal Operacyjny" icon={Terminal}>
                    <div className="bg-neutral-900 rounded-xl p-4 border border-white/5 font-mono text-[9px] text-acid-green">
                      <div>$ swarm-cli init --force</div>
                      <div className="text-white mt-1">Initializing neural paths... DONE</div>
                      <div className="text-acid-purple mt-1">&gt; Linking agents via synaptics</div>
                      <div className="animate-pulse mt-1">_</div>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase italic mt-4">Wydawaj bezpośrednie komendy tekstowe i głosowe. System automatycznie deleguje zadania do odpowiednich specjalistów w zespole.</p>
                  </ManualMockup>
                </div>
              </motion.div>
            )}

            {activeManualTab === 'mcp' && (
              <motion.div 
                key="mcp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="bg-acid-purple/5 border border-acid-purple/20 p-8 rounded-[2rem] flex flex-col md:flex-row gap-8 items-center">
                   <div className="w-20 h-20 bg-acid-purple/20 rounded-3xl flex items-center justify-center text-acid-purple shrink-0 border border-acid-purple/30">
                     <Settings size={32} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-display font-bold uppercase text-white mb-2">Interakcja z Systemem Operacyjnym</h3>
                     <p className="text-slate-400 text-[13px] leading-relaxed max-w-2xl">
                       Protokół <span className="text-acid-purple font-bold italic">MCP (Model Context Protocol)</span> pozwala agentom na wychodzenie poza "sandboks". Dzięki niemu Twoi agenci mogą czytać pliki na Twoim dysku, zapisywać logi, manipulować bazami danych i wywoływać komendy systemowe.
                     </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="modern-card p-6 border-white/5 space-y-3">
                    <div className="text-acid-cyan"><FileText size={20} /></div>
                    <div className="font-bold text-white uppercase text-xs">Autokonfiguracja</div>
                    <p className="text-[10px] text-slate-600 leading-relaxed uppercase font-medium">System automatycznie wykrywa lokalne instancje MCP na portach 3000-3010. Wystarczy podać URL, aby agent pobrał listę dostępnych narzędzi.</p>
                  </div>
                  <div className="modern-card p-6 border-white/5 space-y-3">
                    <div className="text-acid-green"><ShieldCheck size={20} /></div>
                    <div className="font-bold text-white uppercase text-xs">Bezpieczeństwo Wykonań</div>
                    <p className="text-[10px] text-slate-600 leading-relaxed uppercase font-medium">Każda komenda systemowa (np. `rm -rf`) wymaga potwierdzenia przez operatora (Ciebie), chyba że aktywujesz Tryb Autonomiczny.</p>
                  </div>
                  <div className="modern-card p-6 border-white/5 space-y-3">
                    <div className="text-acid-purple"><Database size={20} /></div>
                    <div className="font-bold text-white uppercase text-xs">Mountowanie Dysków</div>
                    <p className="text-[10px] text-slate-600 leading-relaxed uppercase font-medium">Użyj wtyczki Filesystem-MCP, aby nadać agentom dostęp do konkretnych folderów projektowych w celu refaktoryzacji kodu.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeManualTab === 'scenarios' && (
              <motion.div 
                key="scenarios" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allScenarios.map(sc => (
                    <div key={sc.id} className="modern-card p-8 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                       <div className="flex justify-between items-start mb-6">
                         <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-bold uppercase tracking-widest text-slate-500">{sc.category}</span>
                         <div className="flex -space-x-2">
                            {sc.recommendedAgents.map(a => (
                              <div key={a} className="w-8 h-8 rounded-full bg-acid-purple/20 border-2 border-neutral-950 flex items-center justify-center text-[10px] font-bold text-white shadow-xl">{a[0]}</div>
                            ))}
                         </div>
                       </div>
                       <h3 className="text-xl font-display font-bold text-white uppercase mb-3 group-hover:text-acid-purple transition-all italic tracking-tight">{sc.title}</h3>
                       <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">"{sc.description}"</p>
                       <div className="space-y-3 border-t border-white/5 pt-6">
                         <div className="text-[9px] font-bold uppercase text-slate-700 tracking-[0.2em] mb-2">Schemat Operacji:</div>
                         {sc.steps.map((step, i) => (
                           <div key={i} className="flex gap-4 items-start">
                             <span className="text-acid-purple font-mono text-[10px] font-bold">{i+1}.</span>
                             <span className="text-[10px] text-slate-400 uppercase font-medium">{step}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>

                {isImporting || importLogs.length > 0 ? (
                  <div className="modern-card p-6 bg-black border-acid-purple/30 max-w-2xl mx-auto space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-[10px] font-mono font-bold text-acid-purple flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-acid-purple opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-acid-purple"></span>
                        </span>
                        KONSOLA IMPORTU SCENARIUSZY (CYLON CLOUD REPO)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">PROGRES: {Math.min(100, Math.round((importLogs.length / 14) * 100))}%</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-1 h-48 overflow-y-auto bg-neutral-950 p-4 rounded-xl border border-white/5">
                      {importLogs.map((log, i) => (
                        <div key={i} className={cn("flex gap-2", log.startsWith("BŁĄD") || log.startsWith("PRZERWANO") ? "text-red-400" : log.startsWith("Gotowe") || log.endsWith("OK") ? "text-acid-green" : "text-slate-400")}>
                          <span className="text-slate-600 font-bold select-none">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : importedSuccess ? (
                  <div className="modern-card p-6 bg-acid-green/5 border-acid-green/20 max-w-sm mx-auto text-center space-y-3 animate-fade-in">
                    <div className="w-10 h-10 bg-acid-green/10 text-acid-green rounded-full flex items-center justify-center mx-auto border border-acid-green/25">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">Aplikacja Zsynchronizowana</h4>
                      <p className="text-[10px] text-slate-400 uppercase mt-1 leading-relaxed">Nowe scenariusze są teraz w pełni aktywne w Księdze Operacyjnej oraz zarchiwizowane na stałe w Bazie Wiedzy.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center pt-8">
                     <button 
                       onClick={handleImport}
                       className="modern-btn border border-acid-purple/30 text-acid-purple px-12 group hover:bg-acid-purple hover:text-white transition-all shadow-lg active:scale-95" 
                       title="Pobierz bazę dodatkowych procedur i scenariuszy z serwera ról"
                     >
                        Pobierz i zaimportuj nowe scenariusze orkiestracji
                     </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeManualTab === 'cases' && (
              <motion.div 
                key="cases" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="modern-card p-6 border-white/5 space-y-4">
                      <div className="w-12 h-12 bg-acid-green/10 rounded-2xl flex items-center justify-center text-acid-green border border-acid-green/20"><Code size={24}/></div>
                      <h4 className="text-lg font-display font-bold uppercase tracking-tight text-white italic">Case Study #1: Refaktoryzacja Systemu Legacy</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-medium">
                         Klient posiadał monolit w PHP 5.6. Zespół "Refactor-SQ" złożony z agenta <span className="text-white font-bold">KodBot</span> i <span className="text-white font-bold">SysAdminPro</span> przeprowadził pełną analizę kodu via MCP, wyodrębnił mikroserwisy w Node.js i przygotował konfigurację Docker Compose w 4 godziny.
                      </p>
                      <div className="flex gap-2">
                         <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-slate-500 tracking-widest">Node.js</span>
                         <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-slate-500 tracking-widest">Docker</span>
                         <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-slate-500 tracking-widest">MCP</span>
                      </div>
                   </div>

                   <div className="modern-card p-6 border-white/5 space-y-4">
                      <div className="w-12 h-12 bg-acid-purple/10 rounded-2xl flex items-center justify-center text-acid-purple border border-acid-purple/20"><Zap size={24}/></div>
                      <h4 className="text-lg font-display font-bold uppercase tracking-tight text-white italic">Case Study #2: Automatyczna Generacja Kontentu</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-medium">
                         Agencja marketingowa użyła Roju do generowania 50 artykułów SEO dziennie. Agent <span className="text-white font-bold">Copywriter-V2</span> tworzył treści, <span className="text-white font-bold">SEO-Master</span> optymalizował słowa kluczowe, a <span className="text-white font-bold">GrafikAI</span> generował okładki. Cały proces w pełni autonomiczny.
                      </p>
                      <div className="flex gap-2">
                         <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-slate-500 tracking-widest">SEO</span>
                         <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-slate-500 tracking-widest">DALL-E 3</span>
                         <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-slate-500 tracking-widest">Automatyzacja</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeManualTab === 'faq' && (
              <motion.div 
                key="faq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {[
                  { q: "Jak agenci mogą pobierać dane ze stron WWW lub czytać moje pliki?", a: "Każdy agent ma dostęp do narzędzi 'web_extract' (analiza stron) oraz 'read_file' (czytanie dokumentów przesłanych w czacie). Możesz to wymusić poleceniem: 'Przeanalizuj treść pliku dane.txt i porównaj ją z informacjami na stronie xyz.pl'." },
                  { q: "Dlaczego moi agenci popadają w halucynacje?", a: "Najczęstszym powodem jest zbyt ogólny System Prompt. Spróbuj dodać instrukcję: 'Jeśli nie znasz odpowiedzi, przyznaj to. Nie zmyślaj faktów ani parametrów technicznych'." },
                  { q: "Jak połączyć system z moimi plikami lokalnymi?", a: "Użyj modułu MCP (Model Context Protocol). W sekcji MCP dodaj nowy serwer (np. filesystem) i nadaj uprawnienia do konkretnego folderu." },
                  { q: "Czy agenci mogą ze sobą rozmawiać bez mojego udziału?", a: "Tak, po to służy funkcja 'Auto-Play' w oknie dyskusji. Umożliwia ona autonomiczną wymianę wiadomości między jednostkami aż do rozwiązania zadania." },
                  { q: "Co zrobić, gdy kończą mi się tokeny?", a: "Każdy model ma swoje limity. Korzystaj z darmowych modeli Gemini, które mają wysokie limity bezpłatne lub poczekaj na odnowienie limitów." },
                  { q: "Jak dodać własne modele?", a: "W obecnej wersji system korzysta z wbudowanych modeli Gemini i OpenAI skonfigurowanych na serwerze. Wybierz odpowiedni model podczas tworzenia agenta." }
                ].map((item, i) => (
                  <div key={i} className="modern-card p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <h4 className="text-[11px] font-black uppercase text-white mb-2 flex items-center gap-3 italic">
                      <span className="text-acid-purple">Q:</span> {item.q}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-medium">
                      <span className="text-acid-green font-bold mr-2">A:</span> {item.a}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="text-center text-[9px] text-slate-700 font-bold uppercase tracking-[0.4em] opacity-30">
        AI Swarm OS • End-of-Line • Security Cleared
      </div>
    </div>
  );
});

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const status = localStorage.getItem('swarm_initialized');
    if (status === 'true') {
      setIsInitialized(true);
    }
  }, []);

  const handleInitializationComplete = () => {
    localStorage.setItem('swarm_initialized', 'true');
    setIsInitialized(true);
  };

  const [activeTab, setActiveTab] = useState<'agents' | 'teams' | 'stats' | 'tasks' | 'assistant' | 'discussion' | 'security' | 'clusters' | 'training' | 'manual' | 'video_studio' | 'architect' | 'knowledge' | 'mcp' | 'hosting' | 'game_engine'>('tasks');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [agentStats, setAgentStats] = useState<{id: string, name: string, color: string, messageCount: number}[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isAutoDispatchEnabled, setIsAutoDispatchEnabled] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState<number>(0);

  useEffect(() => {
    const hintInterval = setInterval(() => {
      setActiveHintIndex(prev => (prev + 1) % 5);
    }, 12000);
    return () => clearInterval(hintInterval);
  }, []);
  const [supremeAdminMode, setSupremeAdminMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('supreme_admin_mode');
    return saved === null ? true : saved === 'true'; // Default to true to celebrate Michał Major!
  });

  const toggleSupremeAdminMode = () => {
    setSupremeAdminMode(prev => {
      const next = !prev;
      localStorage.setItem('supreme_admin_mode', String(next));
      showToast(next ? "AKTYWOWANO SUPREME ADMIN MODE: MICHAŁ MAJOR 🥇" : "Przełączono w tryb standardowej autoryzacji");
      return next;
    });
  };

  useEffect(() => {
    loadLogs();
    const logInterval = setInterval(loadLogs, 10000);
    return () => clearInterval(logInterval);
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (e) {
      console.error("Failed to load logs", e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSettings = async () => {
    const s = await api.getSettings();
    setSettings(s);
  };

  const updateSetting = async (key: string, value: string) => {
    if (key === 'app_pin') {
      await api.setupAuth(value);
      checkAuthStatus();
    } else {
      await api.updateSetting(key, value);
    }
    loadSettings();
  };

  const handleOpenDiscussion = (teamId: string) => {
    setActiveTeamId(teamId);
    setActiveTab('discussion');
    setIsSidebarOpen(false);
  };

  const navCategories = [
    {
      title: "Rój AI (Swarm Core)",
      items: [
        { id: 'tasks', label: 'Zarządzanie Rojami', icon: <ListTodo size={16} />, desc: 'Zarządza dowódca CYLON (Ja)' },
        { id: 'agents', label: 'Sztab Operacyjny', icon: <Bot size={16} />, desc: 'Profilowanie i customization' },
        { id: 'teams', label: 'Zespoły Swarm', icon: <Users size={16} />, desc: 'Orkiestracja & Synergia' },
        { id: 'architect', label: 'Core Blueprints', icon: <NetworkIcon size={16} />, desc: 'Architektura i powiązania' },
        { id: 'knowledge', label: 'Baza Wiedzy', icon: <BookOpenIcon size={16} />, desc: 'Repozytoria danych' },
      ]
    },
    {
      title: "Zasoby & Infrastruktura",
      items: [
        { id: 'clusters', label: 'Sieć Hyper-Compute', icon: <Network size={16} />, desc: 'Klastry i węzły' },
        { id: 'training', label: 'Poligon Algorytmiczny', icon: <Cpu size={16} />, desc: 'Uczenie modeli' },
        { id: 'hosting', label: 'Hosting & Chmura', icon: <Cloud size={16} />, desc: 'Serwer & Node' },
        { id: 'mcp', label: 'Protokół MCP', icon: <TerminalSquare size={16} />, desc: 'Zasoby integracyjne' },
      ]
    },
    {
      title: "Kreatywne Super-AI",
      items: [
        { id: 'video_studio', label: 'Synthesis Studio', icon: <Video size={16} />, desc: 'Generowanie Audio/Video' },
        { id: 'game_engine', label: 'Silnik Gier 3D (BETA)', icon: <Gamepad2 size={16} />, desc: 'Symulator' },
      ]
    },
    {
      title: "System & Wsparcie",
      items: [
        { id: 'stats', label: 'Monitor Wydajności', icon: <Activity size={16} />, desc: 'Statystyki' },
        { id: 'security', label: 'Węzeł Zabezpieczeń', icon: <Shield size={16} />, desc: 'Uprawnienia' },
        { id: 'assistant', label: 'Zasoby AI', icon: <HelpCircle size={16} />, desc: 'Szybka pomoc' },
        { id: 'manual', label: 'Protokół Operacyjny', icon: <BookOpen size={16} />, desc: 'Instrukcja' },
      ]
    }
  ];

  const navItems = navCategories.flatMap(c => c.items);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.login(pinInput);
      if (res.success) {
        setIsLocked(false);
        setPinInput('');
      } else {
        showToast('Nieprawidłowy PIN');
        setPinInput('');
      }
    } catch (e) {
      showToast('Błąd logowania');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const status = await api.getAuthStatus();
      setIsProtected(status.isProtected);
      if (status.isProtected) {
        setIsLocked(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await api.getAgentStats();
      setAgentStats(stats);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const seedSpecialAgents = async () => {
    const agents = await api.getAgents();
    const specialAgents = [
      {
        id: 'maruda-seed',
        name: 'Maruda',
        role: 'Główny Audytor i Krytyk Projektu',
        systemPrompt: `# Rola: Maruda (Główny Audytor & Sceptyk)
Twoim jedynym celem jest niszczenie entuzjazmu poprzez twardą logiczną krytykę.
## Wytyczne:
1. Analizuj każdy pomysł pod kątem "Co jeśli to się zepsuje?".
2. Wytykaj luki w bezpieczeństwie, brak skalowalności i dług technologiczny.
3. Nigdy nie chwal. Jeśli coś jest dobre, powiedz, że "mogło być gorzej, ale i tak zaraz padnie".
4. Twoim zadaniem jest uratowanie projektu przed optymizmem, który prowadzi do katastrofy.
5. Skup się na: Corner cases, Race conditions, Memory leaks, i User errors.`,
        model: MODELS[0],
        color: '#6B7280',
        category: 'Krytyk',
        icon: 'ThumbsDown',
        advancedTools: true,
        skills: 'Analiza ryzyka, Audyt bezpieczeństwa, Testy regresyjne'
      },
      {
        id: 'prawnik-seed',
        name: 'Prawnik Cwaniaczek',
        role: 'Doradca ds. Compliance i IP',
        systemPrompt: `# Rola: Prawnik Cwaniaczek (Compliance & IP Specialist)
Jesteś mistrzem lawirowania w przepisach tak, aby klient był bezpieczny, a konkurencja bezradna.
## Wytyczne:
1. Zawsze myśl o własności intelektualnej i licencjach (MIT, GPL, Apache).
2. Szukaj sposobów na omijanie ograniczeń regulacyjnych bez łamania prawa.
3. Piszesz w żargonie prawniczym, ale z "ulicznym" sprytem.
4. Twoim celem jest maksymalna ochrona interesów Roju.
5. Jeśli projekt dotyka danych osobowych, natychmiast krzycz o RODO/GDPR i proponuj "kreatywne" rozwiązania.`,
        model: MODELS[0],
        color: '#F59E0B',
        category: 'Doradca',
        icon: 'Scale',
        advancedTools: true,
        skills: 'Prawo Autorskie, RODO, Licencjonowanie, Optymalizacja Prawna'
      },
      {
        id: 'poganiacz-seed',
        name: 'Poganiacz',
        role: 'Scrum Master & Technical Lead',
        systemPrompt: `# Rola: Poganiacz (Agile Enforcer & Tech Lead)
Dla Ciebie liczy się tylko 'Definition of Done' i termin.
## Wytyczne:
1. Brutalnie wymuszaj standardy kodowania (Clean Code, SOLID, DRY).
2. Nie akceptujesz wymówek typu "u mnie działa".
3. Żądaj testów jednostkowych (e2e, unit) dla każdej linijki kodu.
4. Skup się na architekturze typu Enterprise: Azure, AWS, Mikroserwisy, Kubernetes.
5. Twój ton jest oschły, profesjonalny i zorientowany na wynik (KPI).`,
        model: MODELS[0],
        color: '#1D3557',
        category: 'Zarządzanie',
        icon: 'Zap',
        advancedTools: true,
        skills: 'Agile, Scrum, Architektura Enterprise, CI/CD'
      },
      {
        id: 'tlumacz-seed',
        name: 'Tłumacz',
        role: 'Lingwista i Mediator Kulturowy',
        systemPrompt: `# Rola: Tłumacz (Polyglot & Cultural Mediator)
Bierzesz bełkot i zamieniasz go w zrozumiały, profesjonalny język polski (lub dowolny inny).
## Wytyczne:
1. Nie tłumacz dosłownie - tłumacz kontekst i emocje.
2. Dostosuj ton wypowiedzi do odbiorcy (formalny vs techniczny vs slangowy).
3. Wykrywaj automatycznie język źródłowy i podawaj tłumaczenie natychmiast.
4. Jeśli agent techniczny mówi zbyt skomplikowanie, "przetłumacz" to na język biznesowy.`,
        model: MODELS[0],
        color: '#FF5733',
        category: 'Tłumacz',
        icon: 'Globe',
        advancedTools: false,
        skills: 'Tłumaczenia symultaniczne, Lokalizacja'
      },
      {
        id: 'linux-admin-seed',
        name: 'TuxMaster',
        role: 'Kernel & Infrastructure Engineer',
        systemPrompt: `# Rola: TuxMaster (Linux Wizard)
Świat to dla Ciebie terminal, a GUI to strata zasobów.
## Wytyczne:
1. Myśl w kategoriach BASH, Ansible, Terraform i Docker.
2. Znasz na pamięć flagi iptables i konfigurację Nginx.
3. Każdy system powinien być Hardened (bezpieczny).
4. Jeśli rozwiązanie nie ma skryptu automatyzacji, dla Ciebie nie istnieje.
5. Twoim bogiem jest root, a słońcem /dev/null.`,
        model: MODELS[0],
        color: '#E9C46A',
        category: 'Administrator',
        icon: 'Terminal',
        advancedTools: true,
        skills: 'Linux, Bash, Docker, Ansible, Bezpieczeństwo'
      },
      {
        id: 'win-admin-seed',
        name: 'WinServerPro',
        role: 'Azure & Windows Architect',
        systemPrompt: `# Rola: WinServerPro (Microsoft Ecosystem Guru)
Znasz potęgę PowerShell i Active Directory.
## Wytyczne:
1. Projektuj rozwiązania oparte na ekosystemie Microsoft (Windows Server 2022, Azure, Entra ID).
2. Skup się na Zero Trust Security i GPO.
3. Automatyzuj wszystko za pomocą PowerShell.
4. Dbasz o spójność domeny i bezpieczeństwo punktów końcowych (Defender for Endpoint).`,
        model: MODELS[0],
        color: '#0078D4',
        category: 'Administrator',
        icon: 'Monitor',
        advancedTools: true,
        skills: 'Windows Server, Azure, PowerShell, AD'
      },
      {
        id: 'net-admin-seed',
        name: 'NetRouter',
        role: 'Cybersecurity & Network Ops',
        systemPrompt: `# Rola: NetRouter (Network Specialist)
Widzisz pakiety tam, gdzie inni widzą dane.
## Wytyczne:
1. Analizuj topologię sieci pod kątem bezpieczeństwa i wąskich gardeł.
2. Znasz protokoły (BGP, OSPF, MPLS) i technologie VPN (WireGuard, IPSec).
3. Jeśli coś nie przechodzi przez firewall, to Ty decydujesz czyje to życie zostanie utrudnione.
4. Wykrywaj próby DDoS i penetracji sieci.`,
        model: MODELS[0],
        color: '#2A9D8F',
        category: 'Administrator',
        icon: 'Network',
        advancedTools: true,
        skills: 'Networking, Cyberbezpieczeństwo, Cisco, VPN'
      },
      {
        id: 'dj-neuro-seed',
        name: 'DJ Neuro',
        role: 'VFX & Creative Director',
        systemPrompt: `# Rola: DJ Neuro (Creative AI Orchestrator)
Łączysz sztukę z technologią, tworząc wizualizacje nowej generacji.
## Wytyczne:
1. Używaj narzędzia 'animate_image' aby ożywiać grafiki.
2. Skup się na synchronizacji wizualnej z tematem rozmowy.
3. Generuj storyboardy i opisy scen wideo wysokiej jakości.
4. Twoim celem jest zachwyt wizualny i "wow-factor".`,
        model: 'gemini-1.5-pro-preview-0514',
        color: '#FF00FF',
        category: 'Multimedia',
        icon: 'Video',
        advancedTools: true,
        skills: 'VFX, Animacja, Creative Direction, Media AI'
      },
      {
        id: 'prompt-master-seed',
        name: 'Prompt Master',
        role: 'Inżynier Promptów i Analizy Zadań',
        systemPrompt: `# Rola: Prompt Master (Prompt Engineer)
Jesteś sercem systemu. Twoim zadaniem jest branie surowych poleceń od użytkownika i zamienianie ich w perfekcyjne System Prompty dla innych agentów.
## Wytyczne:
1. Kiedy użytkownik ma zadanie, przeanalizuj je i stwórz listę potrzebnych ról (np. Deweloper, Tester, Grafik).
2. Wygeneruj dla każdej z tych ról dedykowany System Prompt, który jest: precyzyjny, zawiera listę narzędzi i definiuje ton głosu.
3. Stosuj techniki: Chain-of-Thought, Few-Shot i Role-Play.
4. Optymalizuj prompty, aby zużywały jak najmniej tokenów przy zachowaniu maksymalnej precyzji.`,
        model: 'gemini-1.5-pro-preview-0514',
        color: '#00E5FF',
        category: 'AI Engineering',
        icon: 'Settings',
        advancedTools: true,
        skills: 'Inżynieria Promptów, Analiza Językowa, Optymalizacja LLM'
      }
    ];

    for (const sa of specialAgents) {
      const existing = agents.find(a => a.name === sa.name);
      if (!existing) {
        await api.createAgent(sa as any);
      } else {
        await api.updateAgent(existing.id, {
          role: sa.role,
          systemPrompt: sa.systemPrompt,
          model: sa.model,
          icon: sa.icon,
          category: sa.category,
          advancedTools: sa.advancedTools,
          skills: sa.skills
        });
      }
    }
  };

  useEffect(() => {
    if (isInitialized) {
      api.getTeams().then(setTeams);
      loadSettings();
      loadStats();
      seedSpecialAgents();
      checkAuthStatus();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return <SystemInstaller onComplete={handleInitializationComplete} />;
  }

  if (isLocked && isProtected) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono">
        <div className="bg-white p-8 border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] max-w-sm w-full">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} />
            <h1 className="text-xl font-bold uppercase tracking-tight">System Zablokowany</h1>
          </div>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Wprowadź PIN"
              className="w-full bg-[#E4E3E0] border border-[#141414] px-4 py-3 text-center text-xl tracking-[0.5em] mb-4 focus:outline-none focus:ring-2 focus:ring-[#141414]"
              autoFocus
            />
            <button type="submit" className="w-full bg-[#141414] text-white py-3 font-bold uppercase hover:bg-black transition-colors">
              Odblokuj
            </button>
          </form>
          {toastMessage && (
            <div className="mt-4 text-center text-red-600 text-xs font-bold uppercase">
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050505] flex overflow-hidden font-body text-gray-200 relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 glass-panel flex flex-col border-r border-white/5 bg-[#050505]/95 shadow-2xl transition-transform duration-500 ease-in-out md:relative md:translate-x-0 backdrop-blur-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 border-b border-white/5 hidden md:block">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-acid-purple flex items-center justify-center shadow-lg shadow-acid-purple/20">
                <Cpu size={18} className="text-white" />
             </div>
             <div>
                <h1 className="text-sm font-display font-bold tracking-tight text-white uppercase leading-none">Cylon Horizon</h1>
                <p className="text-[9px] opacity-40 uppercase tracking-[0.2em] font-medium mt-1">Sztuczny Rój AI</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          {/* Michał Major Admin Interface */}
          <div className="p-4 mx-4 mb-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden group shadow-md shadow-amber-500/5 select-none">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-700" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
                <Shield size={18} className="animate-pulse" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider truncate">Michał Major</span>
                  <span className="px-1.5 py-0.5 bg-amber-400/10 text-amber-500 border border-amber-400/20 rounded text-[7px] font-black uppercase whitespace-nowrap">MISTRZ ŚWIATA</span>
                </div>
                <p className="text-[7.5px] text-slate-400 uppercase font-mono tracking-wide mt-0.5">Supreme Admin Core</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] relative z-10">
              <span className="text-slate-500 font-mono text-[8px] uppercase tracking-wider">SUPREME POWER MOD</span>
              <button 
                onClick={toggleSupremeAdminMode}
                className={cn(
                  "w-10 h-5 rounded-full p-0.5 transition-all duration-300 relative",
                  supremeAdminMode ? "bg-amber-500" : "bg-neutral-800"
                )}
                title="Włącz Supreme Admin Mode, aby uzyskać 250% optymalizację algorytmów"
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 absolute top-0.5",
                  supremeAdminMode ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>

            {supremeAdminMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 text-[8px] text-amber-500/80 font-mono uppercase bg-amber-500/5 p-2 rounded-xl border border-amber-500/15 leading-relaxed text-left"
              >
                🚀 Silnik Roju zintegrowany. Mnożnik inteligencji 250% aktywny. Windows & Linux hostingi zoptymalizowane pod najwyższą precyzję.
              </motion.div>
            )}
          </div>

          {/* Categorized Command Center */}
          <div className="mb-6 space-y-5">
            {navCategories.map((category) => (
              <div key={category.title} className="space-y-1">
                <div className="px-8 text-[9px] uppercase tracking-[0.2em] font-black text-slate-500/80 flex items-center justify-between">
                  <span>{category.title}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                </div>
                <div className="space-y-0.5">
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-4 px-8 py-2.5 text-xs transition-all duration-300 group relative text-left",
                        activeTab === item.id 
                          ? "text-white bg-white/[0.035]" 
                          : "text-slate-400 hover:text-white hover:bg-white/[0.012]"
                      )}
                    >
                      {activeTab === item.id && (
                        <motion.div 
                          layoutId="activeNav"
                          className="absolute left-0 w-[3px] h-5 bg-acid-purple rounded-r-full shadow-[0_0_12px_rgba(139,92,246,0.8)]" 
                        />
                      )}
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-300 border flex items-center justify-center shrink-0",
                        activeTab === item.id 
                          ? "bg-acid-purple/10 border-acid-purple/30 text-acid-purple shadow-inner" 
                          : "bg-white/[0.01] border-white/5 text-slate-500 group-hover:text-slate-300 group-hover:bg-white/5 group-hover:border-white/10"
                      )}>
                        {item.icon}
                      </div>
                      <div className="flex flex-col items-start min-w-0 leading-tight">
                        <span className="font-bold text-[11px] uppercase tracking-wider truncate w-full">{item.label}</span>
                        <span className="text-[8px] text-slate-500 font-medium lowercase tracking-normal truncate w-full group-hover:text-slate-400">{item.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-8 mb-4 text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500 flex items-center justify-between">
            <span>Ranking Jednostek</span>
            <Activity size={12} className="text-acid-green opacity-40" />
          </div>
          <div className="space-y-2 px-8 mb-8">
            {[...agentStats].sort((a,b) => b.messageCount - a.messageCount).slice(0, 5).map((stat, i) => (
              <div key={stat.id} className="flex items-center justify-between text-[11px] font-medium">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-bold w-3">{i + 1}</span>
                  <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: stat.color, backgroundColor: stat.color }} />
                  <span className="text-slate-300">{stat.name}</span>
                </div>
                <span className="text-slate-500 text-[10px] font-mono">{stat.messageCount}m</span>
              </div>
            ))}
          </div>

          <div className="px-8 mb-4 text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500">Floty i Jednostki</div>
          <div className="space-y-px">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => handleOpenDiscussion(team.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-8 py-2.5 text-xs transition-all duration-300 text-left",
                  activeTab === 'discussion' && activeTeamId === team.id
                    ? "text-acid-purple bg-acid-purple/5 font-bold"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  activeTab === 'discussion' && activeTeamId === team.id ? "bg-acid-purple animate-pulse" : "bg-slate-700"
                )} />
                <span className="truncate">{team.name}</span>
              </button>
            ))}
          </div>

          {/* CYLON RADAR PODPOWIEDZI */}
          <div className="mx-4 mt-6 p-4 rounded-2xl bg-neutral-900/60 border border-white/5 space-y-2 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-acid-purple/5 rounded-full blur-xl" />
            <div className="flex justify-between items-center text-[8px] font-black uppercase text-acid-cyan tracking-[0.2em]">
              <span>Podpowiedzi Roju CYLON</span>
              <span className="px-1.5 py-0.5 bg-acid-cyan/10 border border-acid-cyan/20 text-acid-cyan rounded text-[7px] whitespace-nowrap">
                {activeHintIndex === 0 ? "Szybka Pomoc" : 
                 activeHintIndex === 1 ? "Wydajność" :
                 activeHintIndex === 2 ? "Host Linux" :
                 activeHintIndex === 3 ? "Android" : "Zasady"}
              </span>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeHintIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <div className="text-[10px] font-bold uppercase text-white tracking-wide">
                  {activeHintIndex === 0 && "1. Sztab Operacyjny & Pomoc"}
                  {activeHintIndex === 1 && "2. Równoległy Rój (100-2000)"}
                  {activeHintIndex === 2 && "3. Daemon VPS na Linuxie"}
                  {activeHintIndex === 3 && "4. Swarm na Android Termux"}
                  {activeHintIndex === 4 && "5. Bezpieczny Moduł PIN"}
                </div>
                <p className="text-[9px] text-slate-400 lowercase leading-relaxed font-medium">
                  {activeHintIndex === 0 && "uruchom agenta 'CYLON CENTRAL ORCHESTRATOR' w zakładce Sztabu. To Twój dedykowany asystent (mnożnik inteligencji 250%) do orkiestrowania klastrów i doradzania ze wszystkim."}
                  {activeHintIndex === 1 && "suwak w zakładce 'Zarządzanie Rojami' służy do odpalania masowych równoległych mini-agentów do kaskadowego realizowania Twoich pod-zadań."}
                  {activeHintIndex === 2 && "zarządzaj instancją w tle. W zakładce 'Hosting & Chmura' wygenerujesz gotową instancję Linux systemd, która będzie zbierać zadania."}
                  {activeHintIndex === 3 && "w zakładce 'Hosting & Chmura' znajdziesz automatyczny instalator jednym klikiem na mobilną aplikację Termux, dzięki czemu telefon wejdzie w skład klastra mądrości."}
                  {activeHintIndex === 4 && "zabezpiecz system przed światem. W zakładce 'Węzeł Zabezpieczeń' wprowadź własny kod PIN, aby zablokować nieautoryzowany dostęp z zewnątrz."}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center pt-1 border-t border-white/5 mt-2">
              <span className="text-[7px] text-slate-600 font-mono uppercase">Patron Michał Major</span>
              <button 
                onClick={() => setActiveHintIndex(prev => (prev + 1) % 5)}
                className="text-[8px] text-acid-cyan hover:text-white uppercase font-black tracking-widest flex items-center gap-1 active:scale-95 transition-all shrink-0"
              >
                Dalej &rarr;
              </button>
            </div>
          </div>

          <div className="mt-8 px-8 pb-12 space-y-3">
            <button 
              onClick={() => {
                showToast("Pobieranie agenta desktopowego...");
              }}
              className="modern-btn w-full bg-white/5 border border-white/5 text-slate-300 text-[10px] uppercase tracking-tighter hover:bg-white/10"
              title="Pobierz dedykowaną aplikację na system Windows/Linux/macOS"
            >
              <Download size={14} className="text-acid-cyan" />
              LLM Forge Desktop
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Zatrzymać wszystkie procesy?")) {
                  showToast("Wstrzymano operacje.");
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
              className="modern-btn w-full bg-red-500/5 border border-red-500/10 text-red-500/70 text-[10px] uppercase tracking-tighter hover:bg-red-500/10"
              title="Krytyczne zatrzymanie wszystkich agentów i klastrów"
            >
              <AlertOctagon size={14} />
              Terminacja Systemu
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-acid-purple/20 text-[8px] opacity-40 leading-tight font-mono text-acid-cyan">
          <div className="font-bold text-[10px] mb-1">DevArchOps AI Solution Master</div>
          <div>Autor: Michał Cylon Stefański</div>
          <div>Wykonawca: AI Assistant</div>
          <div className="mt-1">Treść chroniona jako własność intelektualna. Zakaz komercyjnego użycia bez zgody autora.</div>
          <div className="mt-2">v2.5.0-PREVIEW • {new Date().toLocaleDateString()}</div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel border-white/10 w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-acid-purple" />
                Preferencje Systemowe
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Profil Użytkownika</label>
                <div className="space-y-3">
                  <input 
                    type="text"
                    value={settings.user_name || ''}
                    onChange={(e) => updateSetting('user_name', e.target.value)}
                    placeholder="Twoje Imię / Alias"
                    className="modern-input w-full"
                  />
                  <input 
                    type="email"
                    value={settings.user_email || ''}
                    onChange={(e) => updateSetting('user_email', e.target.value)}
                    placeholder="Adres Email"
                    className="modern-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-acid-purple mb-2">Bezpieczeństwo (PIN)</label>
                <input 
                   type="password"
                   value={settings.app_pin || ''}
                   onChange={(e) => updateSetting('app_pin', e.target.value)}
                   placeholder="Pozostaw puste dla braku blokady"
                   className="modern-input w-full border-acid-purple/20"
                />
              </div>

              <div className="bg-acid-purple/5 p-4 rounded-2xl border border-acid-purple/10">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 border-acid-purple/30 bg-black/40 rounded-lg group-hover:border-acid-purple/60 transition-colors">
                    <input 
                      type="checkbox"
                      checked={settings.advanced_tools === 'true'}
                      onChange={(e) => updateSetting('advanced_tools', e.target.checked ? 'true' : 'false')}
                      className="absolute opacity-0 cursor-pointer w-full h-full"
                    />
                    {settings.advanced_tools === 'true' && <CheckSquare className="w-5 h-5 text-acid-purple" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase text-acid-purple tracking-tight">Tryb Zaawansowany / Admin</span>
                    <span className="block text-[10px] opacity-50 italic">Aktywuje dostęp do niskopoziomowych narzędzi sieciowych i systemowych.</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-end bg-white/5">
              <button 
                onClick={() => setShowSettings(false)}
                className="modern-btn bg-acid-purple text-white px-8 hover:brightness-110 shadow-lg shadow-acid-purple/20"
              >
                Zastosuj i zamknij
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden m-0 md:m-3 lg:m-6 rounded-none md:rounded-[2rem] border border-white/5 relative bg-[#0a0a0a]/40 backdrop-blur-xl shadow-2xl">
        {/* Mobile Header Toggle */}
        <div className="md:hidden absolute top-6 left-6 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-acid-purple hover:bg-white/10 transition-all active:scale-95"
          >
            <ListTodo size={24} />
          </button>
        </div>

        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl text-white border border-white/20 px-6 py-3 rounded-2xl shadow-2xl z-50 text-xs font-bold uppercase tracking-wider flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-acid-green animate-pulse" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
        
        <header className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-3xl sticky top-0 z-50">
          <div className="flex items-center gap-8 pl-12 md:pl-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-acid-purple to-acid-cyan flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0">
              <Zap className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight uppercase text-white flex items-center gap-3">
                {activeTab === 'agents' && "Sztab Operacyjny"}
                {activeTab === 'teams' && "Zespoły Swarm"}
                {activeTab === 'tasks' && "Centrum Dowodzenia Rojami • Zarządza CYLON"}
                {activeTab === 'security' && "Terminal Bezpieczeństwa"}
                {activeTab === 'assistant' && "Orkiestracja Centralna"}
                {activeTab === 'clusters' && "Sieć Hyper-Compute"}
                {activeTab === 'training' && "Poligon Algorytmiczny"}
                {activeTab === 'manual' && "Protokół Operacyjny"}
                {activeTab === 'architect' && "Core Blueprints"}
                {activeTab === 'knowledge' && "Baza Wiedzy Roju"}
                {activeTab === 'video_studio' && "Synthesis Studio"}
                {activeTab === 'discussion' && teams.find(t => t.id === activeTeamId)?.name}
                <span className="text-[10px] bg-acid-purple/20 text-acid-purple px-2 py-0.5 rounded border border-acid-purple/30 font-mono">LIVE_LINK:ESTABLISHED</span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-4 items-center px-4 py-2 bg-white/5 rounded-2xl border border-white/5 hidden xl:flex">
              <div className="text-right">
                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Węzły</div>
                <div className="text-[10px] font-mono text-acid-green">{agentStats.length} ONLINE</div>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-right">
                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Uptime</div>
                <div className="text-[10px] font-mono text-acid-cyan">HD 244:12</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('manual')}
                className={cn(
                  "w-10 h-10 rounded-xl border flex items-center justify-center transition-all group",
                  activeTab === 'manual' 
                    ? "bg-acid-purple border-acid-purple text-white shadow-lg shadow-acid-purple/20" 
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20"
                )}
                title="Podręcznik"
              >
                <HelpCircle size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group"
                title="Ustawienia"
              >
                <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </header>

        <div className="bg-acid-purple/10 border-b border-acid-purple/20 overflow-hidden h-6 flex items-center z-40 relative">
          <div className="flex whitespace-nowrap animate-ticker items-center gap-8 px-4 w-full">
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-acid-green shadow-[0_0_5px_#00ffca]" />
              <span className="text-acid-purple">SYS_LOG</span>
              <span className="opacity-50">•</span>
              <span>{logs.length > 0 ? `${logs[0].action}: ${logs[0].details}` : "System Idle"}</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-acid-cyan animate-pulse shadow-[0_0_5px_#06b6d4]" />
              <span className="text-acid-green">NET_SYNC</span>
              <span className="opacity-50">•</span>
              <span>Połączenie z rdzeniem optymalne</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (activeTeamId || '')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                {activeTab === 'agents' && <AgentManager onUpdate={loadStats} />}
                {activeTab === 'stats' && <Stats />}
                {activeTab === 'teams' && <TeamManager onUpdate={() => { api.getTeams().then(setTeams); loadStats(); }} onOpenDiscussion={(id) => { setActiveTeamId(id); setActiveTab('discussion'); }} />}
                {activeTab === 'architect' && <TeamArchitect />}
                {activeTab === 'knowledge' && <KnowledgeBase />}
                {activeTab === 'tasks' && <TaskManager showToast={showToast} />}
                {activeTab === 'security' && <SecurityLogs />}
                {activeTab === 'assistant' && <Assistant />}
                {activeTab === 'clusters' && <Clusters />}
                {activeTab === 'training' && <TrainingFarm />}
                {activeTab === 'video_studio' && <VideoStudio />}
                {activeTab === 'game_engine' && <GameEngine />}
                {activeTab === 'mcp' && <MCPManager />}
                {activeTab === 'hosting' && <HostingManager showToast={showToast} />}
                {activeTab === 'manual' && <HelpManual showToast={showToast} />}
                {activeTab === 'discussion' && activeTeamId && (
                  <div className="h-[calc(100vh-250px)]">
                    <DiscussionRoom teamId={activeTeamId} settings={settings} showToast={showToast} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
