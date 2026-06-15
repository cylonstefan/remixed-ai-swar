import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Cpu, Activity, ShieldAlert, Bot, Network, Database, 
  Hexagon, Zap, Layers, Settings, Grid, Wifi, TerminalSquare, 
  BarChart3, Globe, FolderTree, Power, AlertTriangle, MonitorPlay, 
  CheckSquare, Gamepad2, BrainCircuit, Users, Lock, HardDrive, Video, 
  FileCode2, Workflow, Box, DatabaseZap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AIChatManager } from './AIChatManager';
import { ClusterMonitor } from './ClusterMonitor';
import { ClusterMessenger } from './ClusterMessenger';
import { LocalLlmManager } from './LocalLlmManager';
import { McpAutomator } from './McpAutomator';
import { UseCases } from './UseCases';
import { AgentExperienceMemory } from './AgentExperienceMemory';
import { AgentTrainingFarm } from './AgentTrainingFarm';
import { AgentCommunications } from './AgentCommunications';
import { SwarmCommandDashboard } from './SwarmCommandDashboard';
import { KnowledgeMaster } from './KnowledgeMaster';
import { AgentStatsBarWidget } from './AgentStatsBarWidget';

export function DashboardWidgets({ 
  setActiveTab, 
  agentStats,
  showToast,
  openFirebaseLogs,
  openRecoveryMonitor
}: { 
  setActiveTab: (tab: any) => void; 
  agentStats: any;
  showToast: (msg: string) => void;
  openFirebaseLogs?: () => void;
  openRecoveryMonitor?: () => void;
}) {

  // A super dense array of navigation modules
  const NAV_MODULES = [
    { id: 'agents', label: 'Operatywa Agentów', icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'teams', label: 'Zespoły / Formacje', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'tasks', label: 'Kolejka Zadań', icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'clusters', label: 'Węzły Klastra', icon: Server, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'cluster_ai', label: 'Opiekun Klastra AI', icon: BrainCircuit, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    { id: 'security', label: 'Centrum Zabezpieczeń', icon: Lock, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'video_studio', label: 'Studio Multimedialne', icon: Video, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'architect', label: 'Architekt Systemowy', icon: Workflow, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'workspace', label: 'Workspace / Wirtualizacja', icon: Box, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'cloud_db', label: 'Synchronizacja DB', icon: DatabaseZap, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'snitch', label: 'Raportowanie', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { id: 'game_engine', label: 'Silnik Gier', icon: Gamepad2, color: 'text-lime-400', bg: 'bg-lime-500/10' }
  ];

  return (
    <div className="flex flex-col gap-2 h-[calc(100vh-theme(spacing.20))] font-mono text-[10px] text-slate-300 select-none pb-2">
      
      {/* 1. TOP HEADER - ULTRA DENSE HUD */}
      <div className="grid grid-cols-12 gap-2 shrink-0">
        <div className="col-span-12 xl:col-span-3 bg-neutral-950/80 border border-emerald-500/20 rounded p-2 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 p-2 opacity-5 text-emerald-500">
            <Hexagon size={64} />
          </div>
          <div>
            <h1 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} className="animate-pulse" />
              CYLON.GANG // OS
            </h1>
            <p className="text-[7px] text-emerald-700/70 uppercase mt-0.5 tracking-widest font-bold">SYSTEM OVERRIDE / GLOBAL_DASH</p>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-2 z-10 w-full">
            <button
              onClick={() => showToast("Skan Roju: All Nodes Verified.")}
              className="py-1 px-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase text-[8px] rounded-sm flex items-center justify-center gap-1 hover:bg-emerald-500/20 transition-colors"
            >
              <Zap size={9} /> Skan Roju
            </button>
            <button
              onClick={openRecoveryMonitor}
              className="py-1 px-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase text-[8px] rounded-sm flex items-center justify-center gap-1 hover:bg-rose-500/20 transition-colors"
            >
              <ShieldAlert size={9} /> D-RECOV
            </button>
          </div>
        </div>

        {/* HUD Stats Multi-panels */}
        <div className="col-span-12 xl:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div 
            className="bg-neutral-950/60 border border-white/5 rounded p-2 flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 transition-colors"
            onClick={() => setActiveTab('agents')}
          >
            <span className="text-slate-500 font-bold uppercase flex items-center gap-1.5 text-[8px]"><Bot size={10} className="text-emerald-500"/> Agenci Operacyjni</span>
            <div className="flex items-end justify-between mt-1">
              <span className="text-xl font-black text-white leading-none">{agentStats?.length || 0}</span>
              <span className="text-emerald-500 font-bold text-[7px] uppercase tracking-widest mb-0.5">Online</span>
            </div>
          </div>
          
          <div 
            className="bg-neutral-950/60 border border-white/5 rounded p-2 flex flex-col justify-between cursor-pointer hover:border-amber-500/50 transition-colors"
            onClick={() => setActiveTab('tasks')}
          >
            <span className="text-slate-500 font-bold uppercase flex items-center gap-1.5 text-[8px]"><CheckSquare size={10} className="text-amber-500"/> Kolejka Zadań</span>
            <div className="flex items-end justify-between mt-1">
              <span className="text-xl font-black text-white leading-none">PULL</span>
              <span className="text-amber-500 font-bold text-[7px] uppercase tracking-widest mb-0.5">Oczekujące</span>
            </div>
          </div>

          <div 
            className="bg-neutral-950/60 border border-white/5 rounded p-2 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-fuchsia-500/50 transition-colors"
            onClick={() => setActiveTab('clusters')}
          >
             <div className="absolute inset-0 bg-fuchsia-500/5 animate-pulse pointer-events-none" />
             <span className="text-slate-500 font-bold uppercase flex items-center gap-1.5 relative text-[8px]"><Cpu size={10} className="text-fuchsia-400"/> Wydajność Węzłów</span>
             <div className="flex items-end justify-between relative mt-1">
               <span className="text-xl font-black text-white leading-none">98.2%</span>
               <span className="text-fuchsia-400 font-bold text-[7px] uppercase tracking-widest mb-0.5">CPU/GPU</span>
             </div>
          </div>

          <div 
            className="bg-neutral-950/60 border border-white/5 rounded p-2 flex flex-col justify-between cursor-pointer hover:border-cyan-500/50 transition-colors" 
            onClick={openFirebaseLogs}
          >
             <span className="text-slate-500 font-bold uppercase flex items-center gap-1.5 text-[8px]"><Database size={10} className="text-cyan-500"/> Firehose Logi DB</span>
             <div className="flex items-end justify-between mt-1">
               <span className="text-xl font-black text-white leading-none font-mono">LIVE</span>
               <span className="text-cyan-500 font-bold text-[7px] uppercase tracking-widest mb-0.5">Stream</span>
             </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BENTO GRID */}
      <div className="grid grid-cols-12 gap-2 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* COL 1: SYSTEM CONTROLS & NAV */}
        <div className="col-span-12 lg:col-span-2 flex flex-col gap-2 relative">
          <div className="bg-neutral-950/80 rounded border border-white/5 p-2 flex-shrink-0">
            <h3 className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 border-b border-white/5 pb-1 flex items-center gap-1.5"><Grid size={10}/> Matryca Nawigacji</h3>
            <div className="flex flex-col gap-1">
              {NAV_MODULES.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(mod.id)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-sm border border-transparent hover:border-white/10 hover:bg-white/[0.02] transition-colors group text-left w-full"
                >
                  <div className="flex items-center gap-2">
                    <mod.icon size={12} className={cn("opacity-70 group-hover:opacity-100", mod.color)} />
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">{mod.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-neutral-950/80 rounded border border-white/5 p-2 flex-col gap-2 flex">
             <h3 className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1 border-b border-white/5 pb-1 flex items-center gap-1.5"><Settings size={10}/> MCP / LLM Injectors</h3>
             <McpAutomator showToast={showToast} />
             <LocalLlmManager showToast={showToast} />
          </div>
        </div>

        {/* COL 2: SWARM ORCHESTRATION & CLUSTER MONITORS */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
          
          <div className="bg-neutral-950/80 rounded border border-violet-500/20 flex flex-col p-2 relative overflow-hidden h-max">
             <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />
             <SwarmCommandDashboard showToast={showToast} />
          </div>

          <div className="bg-neutral-950/80 rounded border border-white/5 overflow-hidden flex flex-col p-2 min-h-[220px]">
             <ClusterMonitor />
          </div>

          <div className="bg-neutral-950/80 rounded border border-white/5 p-3 overflow-hidden min-h-[300px]">
             <AgentStatsBarWidget />
          </div>

          <div className="bg-neutral-950/80 rounded border border-white/5 p-2 overflow-hidden h-[250px]">
            <AgentTrainingFarm showToast={showToast} />
          </div>

        </div>

        {/* COL 3: KNOWLEDGE & COMMUNICATION HUB */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
          
          <div className="bg-neutral-950/80 rounded border border-white/5 overflow-hidden flex flex-col p-2 min-h-[180px]">
             <KnowledgeMaster showToast={showToast} />
          </div>

          <div className="bg-neutral-950/80 rounded border border-white/5 p-2 min-h-[160px]">
            <ClusterMessenger />
          </div>

          <div className="bg-neutral-950/80 rounded border border-white/5 p-2 min-h-[180px]">
             <AgentCommunications />
          </div>
          
          <div className="bg-neutral-950/80 rounded border border-white/5 p-2 min-h-[180px]">
             <UseCases />
          </div>

        </div>

        {/* COL 4: ACTIVE AI CONSOLE & MEMORY LOGS */}
        <div className="col-span-12 lg:col-span-2 flex flex-col gap-2">
          
          <div className="flex-1 bg-black rounded border border-cyan-500/20 overflow-hidden flex flex-col min-h-[350px]">
            {/* Minimalist AI Wrapper */}
            <AIChatManager onClose={() => {}} />
          </div>

          <div className="bg-neutral-950/80 rounded border border-white/5 p-2 h-[250px] overflow-hidden">
            <AgentExperienceMemory showToast={showToast} />
          </div>

        </div>

      </div>
    </div>
  );
}

