import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';

interface ProcessState {
  entity_id: string;
  entity_type: string;
  status: 'RUNNING' | 'STOPPED' | 'PAUSED' | 'KILLED';
  last_updated: string;
  pid: number | null;
  priority: 'REAL_TIME' | 'HIGH' | 'ABOVE_NORMAL' | 'NORMAL' | 'BELOW_NORMAL' | 'LOW';
  cpu_limit: number;
  ram_limit: number;
  launch_command: string;
  uptime_seconds: number;
  name: string;
  subType: 'agent' | 'swarm' | 'node';
  // optional:
  role?: string;
  model?: string;
  desc?: string;
  mode?: string;
  ip?: string;
  type?: string;
}

interface ProcessLog {
  id: string;
  agentId?: string;
  agentName?: string;
  action: string;
  details: string;
  timestamp: string;
}

export function WindowsTaskManager({ showToast }: { showToast: (msg: string, type: 'success' | 'err' | 'info') => void }) {
  const [processes, setProcesses] = useState<ProcessState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'agent' | 'swarm' | 'node'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'RUNNING' | 'STOPPED' | 'PAUSED' | 'KILLED'>('all');
  const [activeTab, setActiveTab] = useState<'services' | 'explorer' | 'event_viewer'>('services');
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom properties modal
  const [isPropsOpen, setIsPropsOpen] = useState(false);
  const [propsProcess, setPropsProcess] = useState<ProcessState | null>(null);
  const [editPriority, setEditPriority] = useState<ProcessState['priority']>('NORMAL');
  const [editCpu, setEditCpu] = useState(100);
  const [editRam, setEditRam] = useState(4096);
  const [editCmd, setEditCmd] = useState('');

  // Local event viewer logs
  const [eventLogs, setEventLogs] = useState<ProcessLog[]>([]);

  const loadProcesses = async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const data = await api.getProcessStates();
      // Ensure we sort consistently by type then name
      const sorted = data.sort((a, b) => {
        if (a.subType !== b.subType) return a.subType.localeCompare(b.subType);
        return a.name.localeCompare(b.name);
      });
      setProcesses(sorted);
      if (isInitial && sorted.length > 0) {
        setSelectedId(sorted[0].entity_id);
      }
    } catch (e) {
      console.error(e);
      showToast("Błąd ładowania listy procesów", "err");
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  const loadEventLogs = async () => {
    try {
      const logs = await api.getLogs();
      // Filter for process-related actions to populate Windows Event Viewer
      const pLogs = logs
        .filter((l: any) => l.action && l.action.startsWith('PROCESS_'))
        .map((l: any) => ({
          id: l.id,
          agentId: l.agentId,
          agentName: l.agentName,
          action: l.action,
          details: l.details || '',
          timestamp: l.timestamp || new Date().toISOString()
        }));
      setEventLogs(pLogs);
    } catch (err) {
      console.warn("Could not load process logs:", err);
    }
  };

  // Poll process state and system logs regularly to feel extremely alive
  useEffect(() => {
    loadProcesses(true);
    loadEventLogs();

    const interval = setInterval(() => {
      loadProcesses(false);
      loadEventLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const selectedProcess = processes.find(p => p.entity_id === selectedId) || null;

  const handleAction = async (id: string, action: 'start' | 'stop' | 'pause' | 'resume' | 'kill') => {
    try {
      const res = await api.runProcessAction(id, action);
      if (res.success) {
        let actionLabel = "";
        switch (action) {
          case 'start': actionLabel = "uruchomiono pomyślnie"; break;
          case 'stop': actionLabel = "zatrzymano pomyślnie"; break;
          case 'pause': actionLabel = "zawieszono pomyślnie"; break;
          case 'resume': actionLabel = "wznowiono pomyślnie"; break;
          case 'kill': actionLabel = "uwalono twardym sygnałem KILL"; break;
        }
        showToast(`Usługa [${id.substring(0, 8)}...] - ${actionLabel}`, "success");
        // Reload list immediately
        loadProcesses(false);
        loadEventLogs();
      } else {
        showToast(`Błąd: ${res.error || "Nie udało się wykonać akcji"}`, "err");
      }
    } catch (err: any) {
      showToast(`Błąd sieci: ${err.message}`, "err");
    }
  };

  const openProperties = (proc: ProcessState) => {
    setPropsProcess(proc);
    setEditPriority(proc.priority || 'NORMAL');
    setEditCpu(proc.cpu_limit || 100);
    setEditRam(proc.ram_limit || 4096);
    setEditCmd(proc.launch_command || '');
    setIsPropsOpen(true);
  };

  const saveProperties = async () => {
    if (!propsProcess) return;
    try {
      const res = await api.updateProcessState(propsProcess.entity_id, {
        priority: editPriority,
        cpu_limit: editCpu,
        ram_limit: editRam,
        launch_command: editCmd
      });
      if (res.success) {
        showToast(`Zaktualizowano właściwości procesu: ${propsProcess.name}`, "success");
        setIsPropsOpen(false);
        loadProcesses(false);
      } else {
        showToast("Nie udało się zapisać zmian", "err");
      }
    } catch (err: any) {
      showToast(`Błąd zapisu: ${err.message}`, "err");
    }
  };

  const handleDumpScript = async (proc: ProcessState) => {
    try {
      const res = await api.dumpProcessCommand(proc.entity_id);
      if (res.success && res.fileUrl) {
        showToast(`Wygenerowano i zwizualizowano skrypt startowy .bat!`, "success");
        // Open download link or prompt download 
        const a = document.createElement('a');
        a.href = res.fileUrl;
        a.download = res.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showToast("Nie udało się zrzucić komendy do pliku", "err");
      }
    } catch (err: any) {
      showToast(`Błąd zapisu skryptu: ${err.message}`, "err");
    }
  };

  // Filter items
  const filteredProcesses = processes.filter(p => {
    const matchesText = p.name.toLowerCase().includes(filterText.toLowerCase()) || 
      p.entity_id.toLowerCase().includes(filterText.toLowerCase()) ||
      (p.launch_command && p.launch_command.toLowerCase().includes(filterText.toLowerCase())) ||
      (p.model && p.model.toLowerCase().includes(filterText.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || p.subType === typeFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesText && matchesType && matchesStatus;
  });

  const getStatusColor = (status: ProcessState['status']) => {
    switch (status) {
      case 'RUNNING': return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      case 'STOPPED': return 'text-gray-400 bg-gray-900 border-gray-700';
      case 'PAUSED': return 'text-amber-400 bg-amber-950/30 border-amber-800';
      case 'KILLED': return 'text-rose-500 bg-rose-950/40 border-rose-800';
      default: return 'text-slate-300 bg-slate-800';
    }
  };

  const getStatusLabel = (status: ProcessState['status']) => {
    switch (status) {
      case 'RUNNING': return 'Uruchomiony';
      case 'STOPPED': return 'Zatrzymany';
      case 'PAUSED': return 'Wstrzymany (Pauza)';
      case 'KILLED': return 'Killed (Zabity)';
      default: return 'Nieznany';
    }
  };

  // Formatter for uptime
  const formatUptime = (seconds: number) => {
    if (seconds <= 0) return '0 segmentów';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'g ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
  };

  // Calculate sum counts
  const totalThreadCount = processes.length;
  const runningThreadCount = processes.filter(p => p.status === 'RUNNING').length;
  const pausedThreadCount = processes.filter(p => p.status === 'PAUSED').length;
  const avgCpuLimit = Math.min(100, Math.round(processes.reduce((sum, p) => sum + (p.status === 'RUNNING' ? p.cpu_limit : 0), 0) / (runningThreadCount || 1)));
  const totalRamAllocation = processes.reduce((sum, p) => sum + (p.status === 'RUNNING' ? p.ram_limit : 0), 0);

  return (
    <div id="windows_manager_root" className="flex flex-col h-full bg-[#0a0f1d] border border-slate-800 rounded-lg overflow-hidden text-slate-100 font-sans shadow-2xl">
      {/* Title Bar in Retro Windows style with modern developer aesthetic */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-900 via-[#101931] to-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          {/* Virtual blue miniature windows logo */}
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4 text-sky-400">
            <div className="bg-sky-400/80 w-1.5 h-1.5 rounded-xs"></div>
            <div className="bg-sky-400/80 w-1.5 h-1.5 rounded-xs"></div>
            <div className="bg-sky-400/80 w-1.5 h-1.5 rounded-xs"></div>
            <div className="bg-sky-500 w-1.5 h-1.5 rounded-xs"></div>
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-300 font-mono">
            WINDOWS SERVICES & TASK ORCHESTRATOR [v10.26.5]
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded font-mono border border-slate-700">
            PID: SERVER_DAEMON_3000
          </span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute"></div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Orchestrator Menu & Workspace */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Windows-style Explorer Sidebar */}
        <div className="w-full md:w-56 bg-[#0c1224] border-r border-slate-800 flex flex-col justify-between">
          <div className="p-3 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2 mb-1.5">
              Menu Zarządzania
            </div>
            
            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium font-mono border transition ${
                activeTab === 'services' 
                  ? 'bg-sky-950/50 text-sky-400 border-sky-800/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
              }`}
            >
              <Lucide.Sliders size={15} />
              <span>Usługi Roju i Węzłów</span>
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium font-mono border transition ${
                activeTab === 'explorer' 
                  ? 'bg-sky-950/50 text-sky-400 border-sky-800/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
              }`}
            >
              <Lucide.Activity size={15} />
              <span>Menedżer Wydajności</span>
            </button>

            <button
              onClick={() => setActiveTab('event_viewer')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium font-mono border transition ${
                activeTab === 'event_viewer' 
                  ? 'bg-sky-950/50 text-sky-400 border-sky-800/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
              }`}
            >
              <Lucide.FileClock size={15} />
              <span>Dziennik Zdarzeń (MMC)</span>
            </button>

            {/* Quick action divider */}
            <div className="border-t border-slate-800/60 my-4 pt-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">
                Filtry Procesów
              </div>
              <div className="space-y-1.5">
                <select
                  value={typeFilter}
                  onChange={(e: any) => setTypeFilter(e.target.value)}
                  className="w-full bg-[#11182c] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="all">Typ: Wszystkie</option>
                  <option value="agent">Typ: Agenci (Thread)</option>
                  <option value="swarm">Typ: Roje (Swarms)</option>
                  <option value="node">Typ: Węzły (Compute)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#11182c] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="all">Status: Wszystkie</option>
                  <option value="RUNNING">Status: Uruchomione</option>
                  <option value="STOPPED">Status: Zatrzymane</option>
                  <option value="PAUSED">Status: Wstrzymane</option>
                  <option value="KILLED">Status: Killed</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t border-slate-900 bg-slate-950/30">
            <div className="flex items-center gap-2 mb-1">
              <Lucide.Cpu size={14} className="text-sky-400" />
              <span className="text-[10px] text-slate-500 font-mono uppercase">Statystyki RAM/CPU</span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono space-y-1">
              <div>Aktywne wątki: {runningThreadCount} / {totalThreadCount}</div>
              <div>Śr. dławienie CPU: {avgCpuLimit}%</div>
              <div>Zarezerwowany RAM: {totalRamAllocation} MB</div>
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 flex flex-col bg-[#080d1a] overflow-hidden">
          {/* Top Process Operational Actions Panel (Just like Windows MMC Actions Pane) */}
          <div className="p-3.5 bg-[#0b1020] border-b border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                disabled={!selectedId || !selectedProcess || selectedProcess.status === 'RUNNING'}
                onClick={() => selectedId && handleAction(selectedId, 'start')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-400 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Lucide.Play size={13} fill="currentColor" />
                <span>Uruchom (Start)</span>
              </button>

              <button
                disabled={!selectedId || !selectedProcess || selectedProcess.status === 'STOPPED'}
                onClick={() => selectedId && handleAction(selectedId, 'stop')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-600/10 border border-gray-500/30 hover:bg-gray-600/25 text-gray-300 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Lucide.Square size={13} fill="currentColor" />
                <span>Zatrzymaj (Stop)</span>
              </button>

              <button
                disabled={!selectedId || !selectedProcess || selectedProcess.status !== 'RUNNING'}
                onClick={() => selectedId && handleAction(selectedId, 'pause')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/20 text-amber-400 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Lucide.Pause size={13} fill="currentColor" />
                <span>Pauzuj (Wstrzymaj)</span>
              </button>

              <button
                disabled={!selectedId || !selectedProcess || selectedProcess.status !== 'PAUSED'}
                onClick={() => selectedId && handleAction(selectedId, 'resume')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600/10 border border-sky-500/30 hover:bg-sky-600/20 text-sky-400 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Lucide.Play size={13} />
                <span>Wznów (Resume)</span>
              </button>

              <button
                disabled={!selectedId || !selectedProcess || selectedProcess.status === 'KILLED' || selectedProcess.status === 'STOPPED'}
                onClick={() => selectedId && handleAction(selectedId, 'kill')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600/25 text-rose-400 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Lucide.Skull size={13} />
                <span>Zabij / Przerwij</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-2 lg:mt-0">
              <button
                disabled={!selectedProcess}
                onClick={() => selectedProcess && openProperties(selectedProcess)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151f38] border border-slate-700 hover:border-sky-500 hover:text-sky-400 text-slate-200 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition"
                title="Edytuj priorytet procesora, parametry limitowania RAM oraz CPU i komendę"
              >
                <Lucide.Settings size={13} />
                <span>Właściwości</span>
              </button>

              <button
                disabled={!selectedProcess}
                onClick={() => selectedProcess && handleDumpScript(selectedProcess)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-sky-600/15 border border-sky-500/40 hover:bg-sky-600/30 text-sky-400 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none transition"
                title="Zrzuca komendę co odpala proces usługi do pliku kompatybilnego z systemem Windows i pobiera go"
              >
                <Lucide.Download size={13} />
                <span>Zrzut Skryptu (.bat)</span>
              </button>
            </div>
          </div>

          {/* Secondary Actions Tab Contents */}

          {/* TAB 1: SERVICES & PROCESS TABLE LIST */}
          {activeTab === 'services' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search filter row */}
              <div className="p-3 bg-[#0d1326] border-b border-slate-800 flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lucide.Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Szukaj nazwy, ID, modelu lub komendy..."
                    value={filterText}
                    onChange={(e: any) => setFilterText(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#090d1a] border border-slate-800 rounded font-mono text-xs focus:outline-none focus:border-sky-500 text-slate-200"
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Pokazano {filteredProcesses.length} z {processes.length} procesów
                </div>
              </div>

              {/* Real Table */}
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#0d1326] text-slate-400 select-none border-b border-slate-800 shadow-sm z-10">
                    <tr>
                      <th className="p-2.5 font-medium border-r border-slate-800/50 w-10">Icon</th>
                      <th className="p-2.5 font-medium border-r border-slate-800/50">Nazwa Procesu (Service)</th>
                      <th className="p-2.5 font-medium border-r border-slate-800/50 w-24">PID</th>
                      <th className="p-2.5 font-medium border-r border-slate-800/50 w-36">Typ Zasobu</th>
                      <th className="p-2.5 font-medium border-r border-slate-800/50 w-36">Status</th>
                      <th className="p-2.5 font-medium border-r border-slate-800/50 w-24">Priorytet</th>
                      <th className="p-2.5 font-medium border-r border-slate-800/50 w-20">CPU %</th>
                      <th className="p-2.5 font-medium border-r border-slate-800/50 w-24">Memory Allocated</th>
                      <th className="p-2.5 font-medium">U uptime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          <Lucide.RefreshCw className="animate-spin inline-block mr-2 text-sky-400" size={16} />
                          Ładowanie rejestru uslug Windows Orchestrator...
                        </td>
                      </tr>
                    ) : filteredProcesses.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          Brak wyników pasujących do kryteriów wyszukiwania. Poczekaj na inicjalizację lub zmień filtry.
                        </td>
                      </tr>
                    ) : (
                      filteredProcesses.map(proc => {
                        const isSelected = selectedId === proc.entity_id;
                        return (
                          <tr
                            key={proc.entity_id}
                            onClick={() => setSelectedId(proc.entity_id)}
                            className={`cursor-pointer border-b border-slate-800/40 hover:bg-slate-900/40 transition select-none ${
                              isSelected ? 'bg-sky-950/30' : ''
                            }`}
                          >
                            <td className="p-2.5 border-r border-slate-800/30 text-center">
                              {proc.subType === 'agent' && <Lucide.Bot size={15} className="text-sky-400 inline" />}
                              {proc.subType === 'swarm' && <Lucide.Users size={15} className="text-purple-400 inline" />}
                              {proc.subType === 'node' && <Lucide.Server size={15} className="text-emerald-400 inline" />}
                            </td>
                            <td className="p-2.5 border-r border-slate-800/30">
                              <div className="font-semibold text-slate-200">{proc.name}</div>
                              <div className="text-[10px] text-slate-500 max-w-sm truncate whitespace-nowrap" title={proc.launch_command}>
                                {proc.launch_command}
                              </div>
                            </td>
                            <td className="p-2.5 border-r border-slate-800/30">
                              {proc.pid ? (
                                <span className="text-emerald-400 font-mono font-semibold">{proc.pid}</span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className="p-2.5 border-r border-slate-800/30">
                              <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold border ${
                                proc.subType === 'agent' 
                                  ? 'bg-sky-950/20 text-sky-400 border-sky-900/60' 
                                  : proc.subType === 'swarm'
                                  ? 'bg-purple-950/20 text-purple-400 border-purple-900/60'
                                  : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/60'
                              }`}>
                                {proc.subType === 'agent' ? 'AGENT THREAD' : proc.subType === 'swarm' ? 'ROJ SWARM' : 'COMPUTE NODE'}
                              </span>
                            </td>
                            <td className="p-2.5 border-r border-slate-800/30">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border inline-block ${getStatusColor(proc.status)}`}>
                                {getStatusLabel(proc.status)}
                              </span>
                            </td>
                            <td className="p-2.5 border-r border-slate-800/30 text-slate-400">
                              {proc.priority || 'NORMAL'}
                            </td>
                            <td className="p-2.5 border-r border-slate-800/30 text-slate-300">
                              {proc.status === 'RUNNING' ? `${proc.cpu_limit}%` : '0%'}
                            </td>
                            <td className="p-2.5 border-r border-slate-800/30 text-slate-300">
                              {proc.status === 'RUNNING' ? `${proc.ram_limit} MB` : '0 MB'}
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {proc.status === 'RUNNING' ? formatUptime(proc.uptime_seconds) : 'nieaktywny'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Process Properties bar containing launch config */}
              {selectedProcess && (
                <div className="p-4 bg-[#0a0f1d] border-t border-slate-800 flex flex-col md:flex-row gap-5">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-widest">Wskazana Komenda Startowa:</span>
                      <span className="text-[10px] text-sky-400 font-mono">Domyślna instalacja uruchamiania procesu Windows</span>
                    </div>
                    <div className="p-2 bg-[#050812] border border-slate-800 rounded font-mono text-[11px] text-amber-500 break-all select-all flex items-center justify-between">
                      <code>{selectedProcess.launch_command}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedProcess.launch_command);
                          showToast("Komenda skopiowana do schowka!", "info");
                        }}
                        className="text-slate-400 hover:text-white ml-2 shrink-0 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded p-1"
                        title="Kopiuj Komendę"
                      >
                        <Lucide.Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full md:w-64 space-y-1 bg-[#0f1629]/50 border border-slate-800/80 p-2.5 rounded text-[11px] font-mono text-slate-400 shrink-0">
                    <div><span className="text-slate-500">Unikalny Ident:</span> <span className="text-slate-300 text-[10px] break-all">{selectedProcess.entity_id}</span></div>
                    <div><span className="text-slate-500">Typ procesu:</span> <span className="text-slate-300">{selectedProcess.entity_type.toUpperCase()} ({selectedProcess.subType})</span></div>
                    <div><span className="text-slate-500">Wirtualny PID:</span> <span className="text-slate-300 font-bold text-emerald-400">{selectedProcess.pid || 'BRAK'}</span></div>
                    <div><span className="text-slate-500">Ostatnia zmiana:</span> <span className="text-slate-300">{new Date(selectedProcess.last_updated).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERFORMANCE PROCESS MONITOR */}
          {activeTab === 'explorer' && (
            <div className="flex-1 p-4 overflow-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lucide.ShieldCheck size={14} className="text-emerald-500" />
                  Zużycie zasobów i dławienie procesora (Simulated Throttling Host)
                </div>
                <div className="text-[11px] font-mono text-sky-400">
                  Odświeżanie automatyczne co 4s
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {processes.map(proc => {
                  const isRunning = proc.status === 'RUNNING';
                  const isPaused = proc.status === 'PAUSED';
                  let cpuPct = isRunning ? Math.round((proc.cpu_limit * 0.8) + (Math.random() * 15)) : 0;
                  if (isPaused) cpuPct = 2; // minor suspended thread signature
                  const ramAlloc = isRunning ? proc.ram_limit : 0;
                  const ramPct = isRunning ? Math.round((proc.ram_limit / 8192) * 100) : 0;

                  return (
                    <div key={proc.entity_id} className={`p-3.5 bg-[#0b1122] border rounded-lg space-y-3 transition shadow-sm ${
                      isRunning ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {proc.subType === 'agent' && <Lucide.Bot size={14} className="text-sky-400" />}
                          {proc.subType === 'swarm' && <Lucide.Users size={14} className="text-purple-400" />}
                          {proc.subType === 'node' && <Lucide.Server size={14} className="text-emerald-400" />}
                          <span className="text-xs font-semibold font-mono text-slate-200 truncate max-w-[140px]">{proc.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono border px-1.5 py-0.2 rounded ${
                          proc.status === 'RUNNING' ? 'text-emerald-400 border-emerald-800/60 bg-emerald-950/20' : 
                          proc.status === 'PAUSED' ? 'text-amber-400 border-amber-800/60 bg-amber-950/20' : 'text-slate-500 border-slate-800'
                        }`}>
                          {proc.status}
                        </span>
                      </div>

                      {/* CPU slider simulation */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-500">Użycie CPU klienta:</span>
                          <span className={`${isRunning ? 'text-sky-400' : 'text-slate-500'}`}>{cpuPct}%</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              cpuPct > 85 ? 'bg-rose-500' : cpuPct > 50 ? 'bg-amber-400' : 'bg-sky-400'
                            }`}
                            style={{ width: `${cpuPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>Limit dławienia:</span>
                          <span>{proc.cpu_limit}%</span>
                        </div>
                      </div>

                      {/* Memory slider simulation */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-500">Strona pamięci RAM:</span>
                          <span className={`${isRunning ? 'text-purple-400' : 'text-slate-500'}`}>
                            {isRunning ? `${ramAlloc} MB` : '0 MB'}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                          <div 
                            className="h-full bg-purple-500 transition-all duration-1000"
                            style={{ width: `${isRunning ? ramPct : 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>Limit fizyczny:</span>
                          <span>8192 MB (8GB)</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-900/65 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500/80">
                        <span>Wątek: PID {proc.pid || '-'}</span>
                        <span>Priorytet: {proc.priority}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EVENT VIEWER LOGS */}
          {activeTab === 'event_viewer' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 bg-[#0d1326] border-b border-slate-800 flex items-center justify-between select-none">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lucide.ShieldEllipsis size={14} className="text-sky-400" />
                  PODGLĄD SPECYFIKACJI ZDARZEŃ WINDOWS (EVENT VIEWER)
                </div>
                <button
                  onClick={() => loadEventLogs()}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded font-mono text-[10px] hover:border-slate-700"
                >
                  <Lucide.RefreshCw size={11} />
                  <span>Odśwież logi zdarzeń</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 min-h-0">
                <div className="space-y-2 max-w-4xl mx-auto">
                  {eventLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800/80 rounded">
                      Brak zdarzeń procesów w dzienniku Windows Event Viewer. Zmień stan procesu (Zatrzymaj, Uruchom, Pauzuj, Kill), aby wywołać telemetryczne logi!
                    </div>
                  ) : (
                    eventLogs.map((log, index) => {
                      let logClass = "border-sky-900/40 bg-sky-950/5 text-slate-300";
                      let iconColor = "text-sky-400";
                      if (log.action === 'PROCESS_START') {
                        logClass = "border-emerald-900/40 bg-emerald-950/5 text-emerald-200";
                        iconColor = "text-emerald-400";
                      } else if (log.action === 'PROCESS_STOP') {
                        logClass = "border-gray-800 bg-gray-900/10 text-slate-300";
                        iconColor = "text-gray-400";
                      } else if (log.action === 'PROCESS_PAUSE') {
                        logClass = "border-amber-900/40 bg-amber-950/5 text-amber-200";
                        iconColor = "text-amber-400";
                      } else if (log.action === 'PROCESS_KILL') {
                        logClass = "border-rose-900/40 bg-rose-950/5 text-rose-300";
                        iconColor = "text-rose-400";
                      }

                      return (
                        <div key={log.id} className={`p-3 border rounded-lg font-mono text-xs flex gap-3 shadow-xs ${logClass}`}>
                          <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                            <Lucide.Info size={15} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <span className="font-bold tracking-wide">ID Zdarzenia: MMC_EVENT_2026_{index + 1000}</span>
                              <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-slate-300">{log.details}</div>
                            <div className="flex flex-wrap text-[10px] text-slate-500/80 gap-3">
                              <span>Źródło: Micro-Services Windows Orchestrator</span>
                              <span>Prywatny tag: {log.action}</span>
                              <span>ID Modułu: {log.agentId}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER SUMMARY STRIP */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-900 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 select-none">
        <div className="flex items-center gap-4">
          <span>Łącznie procesów w systemie: <strong className="text-sky-400">{processes.length}</strong></span>
          <span>Aktywne wątki: <strong className="text-emerald-400">{runningThreadCount}</strong></span>
          <span>Wstrzymane (Paused): <strong className="text-amber-400">{pausedThreadCount}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Strona pamięci RAM (szczyt): <strong className="text-purple-400">{totalRamAllocation} MB</strong></span>
          <span>Śr. dławienie CPU: <strong className="text-sky-400">{avgCpuLimit}%</strong></span>
        </div>
      </div>

      {/* PROPERTIES / SETTINGS MODAL */}
      {isPropsOpen && propsProcess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all" id="win_mgr_props_modal">
          <div className="w-full max-w-lg bg-[#0e1428] border border-slate-700 rounded-lg overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Title bar */}
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-slate-800 select-none">
              <div className="flex items-center gap-2">
                <Lucide.Sliders size={15} className="text-sky-400" />
                <span className="text-xs font-semibold font-mono tracking-wide text-slate-200 uppercase">
                  Właściwości: {propsProcess.name}
                </span>
              </div>
              <button 
                onClick={() => setIsPropsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <Lucide.X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs font-mono max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3.5 bg-slate-950/40 p-3 rounded border border-slate-900 mb-2">
                <div>
                  <div className="text-slate-500">Unikalny Identyfikator:</div>
                  <div className="text-slate-300 break-all text-[10px] select-all">{propsProcess.entity_id}</div>
                </div>
                <div>
                  <div className="text-slate-500">Klasa Procesu:</div>
                  <div className="text-slate-300">{propsProcess.entity_type.toUpperCase()} ({propsProcess.subType})</div>
                </div>
              </div>

              {/* Priority Dropdown */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">Klasa Priorytetu Procesora (Windows Priority Class)</label>
                <select
                  value={editPriority}
                  onChange={(e: any) => setEditPriority(e.target.value)}
                  className="w-full bg-[#11182c] border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
                >
                  <option value="REAL_TIME">REAL_TIME (Czas rzeczywisty - Max uprzywilejowanie)</option>
                  <option value="HIGH">HIGH (Wysoki priorytet wykonania wątków)</option>
                  <option value="ABOVE_NORMAL">ABOVE_NORMAL (Ponadprzeciętny)</option>
                  <option value="NORMAL">NORMAL (Standardowy harmonogram Windows OS)</option>
                  <option value="BELOW_NORMAL">BELOW_NORMAL (Poniżej przeciętnej)</option>
                  <option value="LOW">LOW (Tło bezwzględne / Niski pobór)</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Ustaw priorytet, aby system Windows optymalnie rozdzielił cykle procesora na wątki tego agenta.
                </p>
              </div>

              {/* Resource slider row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">
                    Dławienie CPU (Max %): {editCpu}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={editCpu}
                    onChange={(e) => setEditCpu(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-900 rounded-full appearance-none"
                  />
                  <span className="text-[10px] text-slate-500 block text-right">Zakres: 10% - 100%</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">
                    Przydział RAMu (Limiter MB): {editRam} MB
                  </label>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={editRam}
                    onChange={(e) => setEditRam(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-900 rounded-full appearance-none"
                  />
                  <span className="text-[10px] text-slate-500 block text-right">Max Alokacja: 8GB (8192MB)</span>
                </div>
              </div>

              {/* Executable Command line */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">Komenda Rozruchowa procesu (CLI command)</label>
                <textarea
                  rows={4}
                  value={editCmd}
                  onChange={(e) => setEditCmd(e.target.value)}
                  className="w-full bg-[#11182c] border border-slate-800 rounded px-3 py-2 text-amber-500 focus:outline-none focus:border-sky-500 font-mono text-[11px] leading-relaxed resize-none"
                  placeholder="Format komendy startowej np. node script.js"
                />
                <p className="text-[10px] text-slate-500">
                  Ta komenda jest wywoływana przy włączaniu instancji rąbka usługi oraz eksportowana przy zrzucie pliku skryptu .bat.
                </p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end gap-2">
              <button 
                onClick={() => setIsPropsOpen(false)}
                className="px-3.5 py-2 font-mono text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-900 transition"
              >
                Anuluj
              </button>
              <button 
                onClick={() => saveProperties()}
                className="px-4 py-2 font-mono text-xs rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition flex items-center gap-1.5"
              >
                <Lucide.Save size={13} />
                <span>Zastosuj Zmiany</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
