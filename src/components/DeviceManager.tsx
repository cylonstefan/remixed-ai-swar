import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DeviceActionLog {
  id: string;
  deviceId: string;
  deviceType: 'pc' | 'laptop' | 'smartphone';
  action: string;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'QUESTION_PHASE';
  details: string;
  response?: string;
  timestamp: string;
}

interface DeviceState {
  id: string;
  name: string;
  type: 'pc' | 'laptop' | 'smartphone';
  status: 'online' | 'offline';
  ip: string;
  lastActive: string;
}

export function DeviceManager({ showToast }: { showToast: (msg: string) => void }) {
  const [devices, setDevices] = useState<DeviceState[]>([
    { id: 'dev-pc-01', name: 'CYLON-WORKSTATION-X', type: 'pc', status: 'online', ip: '192.168.1.10', lastActive: new Date().toISOString() },
    { id: 'dev-lt-02', name: 'NOMAD-ULTRABOOK', type: 'laptop', status: 'online', ip: '192.168.1.12', lastActive: new Date().toISOString() },
    { id: 'dev-ph-03', name: 'NEURAL-LINK-S24', type: 'smartphone', status: 'online', ip: '192.168.1.15', lastActive: new Date().toISOString() },
  ]);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0].id);
  const [activeTab, setActiveTab] = useState<'control' | 'logs' | 'power'>('control');
  const [logs, setLogs] = useState<DeviceActionLog[]>([]);
  const [isLearningMode, setIsLearningMode] = useState(true);
  const [questionQueue, setQuestionQueue] = useState<{ id: string; question: string; type: string }[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  
  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  const addLog = (action: string, details: string, status: DeviceActionLog['status'] = 'PENDING') => {
    const newLog: DeviceActionLog = {
      id: Math.random().toString(36).substr(2, 9),
      deviceId: selectedDeviceId,
      deviceType: selectedDevice.type,
      action,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog.id;
  };

  const updateLog = (id: string, updates: Partial<DeviceActionLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleExecute = async (action: string, command: string) => {
    const logId = addLog(action, `Inicjowanie: ${command}`);

    if (isLearningMode) {
      updateLog(logId, { status: 'QUESTION_PHASE', details: `Oczekiwanie na walidację parametrów dla: ${action}` });
      setQuestionQueue([
        { id: logId, question: `Czy na pewno chcesz wykonać "${action}" (${command}) na urządzeniu ${selectedDevice.name}?`, type: 'confirm' },
        { id: logId, question: `Jaki jest priorytet tego zadania (0-10)?`, type: 'param' },
        { id: logId, question: `Czy zapisać szczegółowy raport po zakończeniu?`, type: 'report' },
      ]);
      return;
    }

    try {
      updateLog(logId, { status: 'EXECUTING' });
      // Real API Call Simulation
      const res = await api.executeDeviceCommand(selectedDeviceId, action, command);
      if (res.success) {
        updateLog(logId, { status: 'SUCCESS', details: `Wykonano: ${command}`, response: res.output });
        showToast(`Sukces: ${action} na ${selectedDevice.name}`);
      } else {
        updateLog(logId, { status: 'FAILED', details: `Błąd: ${res.error}` });
        showToast(`Błąd: ${action} nieudane.`);
      }
    } catch (err) {
      updateLog(logId, { status: 'FAILED', details: `Awaria połączenia.` });
    }
  };

  const handleAnswerQuestion = async () => {
    if (questionQueue.length === 0) return;
    const currentQ = questionQueue[0];
    const logId = currentQ.id;

    const remaining = questionQueue.slice(1);
    setQuestionQueue(remaining);

    if (remaining.length === 0) {
      // Finished questions, execute now
      const log = logs.find(l => l.id === logId);
      if (log) {
        updateLog(logId, { status: 'EXECUTING', details: `Zatwierdzono sesję. Trwa wykonywanie: ${log.action}` });
        try {
          const res = await api.executeDeviceCommand(selectedDeviceId, log.action, 'learned_params_active');
          updateLog(logId, { status: 'SUCCESS', response: res.output });
          showToast(`Automatyzacja zatwierdzona i wykonana!`);
        } catch (e) {
          updateLog(logId, { status: 'FAILED' });
        }
      }
    }
    setCurrentResponse('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0e12] text-slate-300 font-mono text-xs overflow-hidden border border-white/5 rounded-3xl">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#1a1c24] to-[#12131a] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-acid-purple/10 text-acid-purple rounded-2xl border border-acid-purple/20">
            <Lucide.Cpu size={24} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h2 className="text-white font-extrabold text-lg uppercase tracking-tighter italic">Orkiestrator Kanałów Dystrybucji 👾</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Centralna Kontrola Urządzeń Multi-Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "px-4 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer",
            isLearningMode ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "bg-white/5 border-white/5 text-slate-500"
          )}
          onClick={() => setIsLearningMode(!isLearningMode)}
          >
            <Lucide.GraduationCap size={16} />
            <span className="font-black uppercase text-[9px]">Tryb Nauki: {isLearningMode ? "ON" : "OFF"}</span>
          </div>
          <div className="p-2 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-white transition-all cursor-pointer">
            <Lucide.RefreshCw size={16} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Device Sidebar */}
        <div className="w-64 border-r border-white/5 bg-[#0a0b0f] p-4 space-y-4">
          <div className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] mb-2 px-2">Dostępne Terminale</div>
          <div className="space-y-1.5">
            {devices.map(dev => (
              <button
                key={dev.id}
                onClick={() => setSelectedDeviceId(dev.id)}
                className={cn(
                  "w-full p-3 rounded-2xl border transition-all flex flex-col gap-1 text-left group",
                  selectedDeviceId === dev.id 
                    ? "bg-acid-purple/10 border-acid-purple/40 shadow-lg shadow-acid-purple/5" 
                    : "bg-transparent border-transparent hover:bg-white/5"
                )}
              >
                <div className="flex items-center justify-between">
                  {dev.type === 'pc' && <Lucide.Monitor size={16} className={selectedDeviceId === dev.id ? "text-acid-purple" : "text-slate-500"} />}
                  {dev.type === 'laptop' && <Lucide.Laptop size={16} className={selectedDeviceId === dev.id ? "text-acid-purple" : "text-slate-500"} />}
                  {dev.type === 'smartphone' && <Lucide.Smartphone size={16} className={selectedDeviceId === dev.id ? "text-acid-purple" : "text-slate-500"} />}
                  <div className="flex items-center gap-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", dev.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-700")} />
                  </div>
                </div>
                <div className={cn("font-bold uppercase tracking-tight text-[11px]", selectedDeviceId === dev.id ? "text-white" : "text-slate-400 group-hover:text-slate-300")}>
                  {dev.name}
                </div>
                <div className="text-[9px] text-slate-600 font-mono">{dev.ip}</div>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-acid-cyan/5 border border-acid-cyan/20 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-acid-cyan font-black uppercase text-[9px]">
               <Lucide.Info size={14} />
               Status Klastra
             </div>
             <div className="space-y-1 text-[8px] text-slate-500 uppercase font-black">
               <div className="flex justify-between"><span>Sync Delay:</span> <span className="text-white">12ms</span></div>
               <div className="flex justify-between"><span>Protokoły:</span> <span className="text-white">SSH, WOL, MCP</span></div>
               <div className="flex justify-between"><span>Region:</span> <span className="text-white">EU-WEST-2</span></div>
             </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col bg-[#0c0d12]">
          {/* Tabs */}
          <div className="flex p-4 gap-4 border-b border-white/5">
            {[
              { id: 'control', label: 'Eskalacja Funkcji', icon: Lucide.Zap },
              { id: 'logs', label: 'Dziennik Operacji', icon: Lucide.ScrollText },
              { id: 'power', label: 'Zarządzanie Energią', icon: Lucide.Power },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  activeTab === tab.id ? "bg-white/10 text-white border border-white/10" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {activeTab === 'control' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Distributions Channels */}
                <ActionCard 
                  title="Hyper-V Orchestrator" 
                  desc="Zarządzaj maszynami wirtualnymi klastra"
                  icon={<Lucide.Layers size={20} />}
                  onAction={() => handleExecute('HYPERV_LIST', 'Get-VM')}
                  color="purple"
                  actions={[
                    { label: 'Uruchom VM-A', cmd: 'Start-VM "Cylon-A"' },
                    { label: 'Snapshot Beta', cmd: 'Check-VM' }
                  ]}
                />
                <ActionCard 
                  title="Network Bridge" 
                  desc="Przełączaj interfejsy i proxy"
                  icon={<Lucide.Network size={20} />}
                  onAction={() => handleExecute('NET_STATUS', 'ipconfig')}
                  color="cyan"
                  actions={[
                    { label: 'Połącz VPN', cmd: 'Connect-Vpn' },
                    { label: 'Reset NIC', cmd: 'Disable-NetAdapter' }
                  ]}
                />
                <ActionCard 
                  title="App Dispatcher" 
                  desc="Zdalne uruchamianie programów"
                  icon={<Lucide.PlayCircle size={20} />}
                  onAction={() => handleExecute('APP_LIST', 'Get-Process')}
                  color="green"
                  actions={[
                    { label: 'Otwórz Chrome', cmd: 'start chrome' },
                    { label: 'Run Python', cmd: 'python main.py' }
                  ]}
                />
                <ActionCard 
                  title="PowerShell Master" 
                  desc="Bezpośrednie komendy powłoki"
                  icon={<Lucide.Terminal size={20} />}
                  onAction={() => handleExecute('PS_INTERACTIVE', 'host')}
                  color="amber"
                  actions={[
                    { label: 'Sprawdź RAM', cmd: 'Get-CimInstance Win32_PhysicalMemory' },
                    { label: 'Lista Plików', cmd: 'dir' }
                  ]}
                />
                {selectedDevice.type === 'smartphone' && (
                  <ActionCard 
                    title="Mobile Remote" 
                    desc="Zarządzanie systemem Android/iOS"
                    icon={<Lucide.Smartphone size={20} />}
                    onAction={() => handleExecute('MOBILE_INFO', 'adb_shell_getprop')}
                    color="rose"
                    actions={[
                      { label: 'Pokaż Ekran', cmd: 'scrcpy' },
                      { label: 'Instaluj APK', cmd: 'adb_install' }
                    ]}
                  />
                )}
                {selectedDevice.type === 'pc' && (
                  <ActionCard 
                    title="System Auth" 
                    desc="Zdalne logowanie i rDP"
                    icon={<Lucide.Lock size={20} />}
                    onAction={() => handleExecute('REMOTE_AUTH', 'logon')}
                    color="blue"
                    actions={[
                      { label: 'Uruchom RDP', cmd: 'mstsc' },
                      { label: 'Wyloguj', cmd: 'logoff' }
                    ]}
                  />
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center gap-4 border border-dashed border-white/5 rounded-[3rem]">
                    <Lucide.Inbox size={48} className="text-white/10" />
                    <p className="text-slate-600 uppercase font-black tracking-widest text-[10px]">Brak odnotowanych operacji na terminalu</p>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-500" :
                          log.status === 'FAILED' ? "bg-rose-500/10 text-rose-500" :
                          log.status === 'QUESTION_PHASE' ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-slate-500"
                        )}>
                          {log.status === 'SUCCESS' && <Lucide.CheckCircle2 size={18} />}
                          {log.status === 'FAILED' && <Lucide.AlertCircle size={18} />}
                          {log.status === 'QUESTION_PHASE' && <Lucide.MessageSquareQuote size={18} className="animate-bounce" />}
                          {log.status === 'EXECUTING' && <Lucide.Cpu size={18} className="animate-spin" />}
                          {log.status === 'PENDING' && <Lucide.Clock size={18} />}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-black uppercase text-[11px]">{log.action}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{log.details}</p>
                          {log.response && (
                            <div className="mt-2 p-2 bg-black/60 rounded-lg text-[9px] text-emerald-400 font-mono border border-emerald-500/20 max-w-lg overflow-x-auto whitespace-pre">
                              {log.response}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all">
                         <button className="p-2 text-slate-500 hover:text-white transition-all">
                           <Lucide.MoreVertical size={16} />
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'power' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-4xl mx-auto py-10 w-full">
                <div className="space-y-6">
                  <div className="text-left">
                    <h3 className="text-white font-black text-2xl uppercase italic leading-tight">Master Power-Switch Control</h3>
                    <p className="text-slate-500 text-xs uppercase font-medium mt-2">Dystrybucja sygnałów sterujących zasilaniem i autoryzacją</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleExecute('POWER_WOL', 'Wake-On-Lan Packet 192.168.1.10')}
                      className="p-6 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 rounded-3xl transition-all flex flex-col items-center gap-3 group"
                    >
                      <Lucide.Power size={24} className="text-emerald-500 group-hover:text-black" />
                      <span className="font-black uppercase text-[10px]">Wake on LAN (WOL)</span>
                    </button>
                    <button 
                      onClick={() => handleExecute('POWER_SHUTDOWN', 'shutdown /s /t 0')}
                      className="p-6 bg-rose-500/10 hover:bg-rose-500 hover:text-black border border-rose-500/20 rounded-3xl transition-all flex flex-col items-center gap-3 group"
                    >
                      <Lucide.LogOut size={24} className="text-rose-500 group-hover:text-black" />
                      <span className="font-black uppercase text-[10px]">Wyłącz Zdalnie</span>
                    </button>
                    <button 
                      onClick={() => handleExecute('POWER_RESTART', 'shutdown /r /t 0')}
                      className="p-6 bg-blue-500/10 hover:bg-blue-500 hover:text-black border border-blue-500/20 rounded-3xl transition-all flex flex-col items-center gap-3 group"
                    >
                      <Lucide.RefreshCw size={24} className="text-blue-500 group-hover:text-black" />
                      <span className="font-black uppercase text-[10px]">Restart Systemu</span>
                    </button>
                    <button 
                      onClick={() => handleExecute('POWER_SLEEP', 'powercfg /h off')}
                      className="p-6 bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 rounded-3xl transition-all flex flex-col items-center gap-3 group"
                    >
                      <Lucide.Moon size={24} className="text-amber-500 group-hover:text-black" />
                      <span className="font-black uppercase text-[10px]">Uśpij Maszynę</span>
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-neutral-900 border border-white/5 rounded-[3rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Lucide.ShieldCheck size={120} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-acid-purple">
                      <Lucide.Fingerprint size={24} />
                      <span className="font-black uppercase text-xs tracking-widest">Procedury Bio-Auth</span>
                    </div>
                    <h4 className="text-lg font-bold text-white uppercase italic">Zdalne Logowanie (Remote Logon)</h4>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">System potrafi wysłać sygnał 'unlocked' do stacji roboczej, symulując obecność operatora przy klawiaturze (Virtual HID Keyboard Injection).</p>
                    <button 
                      onClick={() => handleExecute('REMOTE_LOGIN', 'unlocked_signal_hex')}
                      className="w-full py-4 bg-[#a855f7] hover:bg-purple-600 text-black font-black uppercase text-xs rounded-2xl shadow-xl transition-all active:scale-95"
                    >
                      Wyślij Sygnał Logowania 🔑
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Learning Mode Question Overlay */}
          <AnimatePresence>
            {questionQueue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-x-0 bottom-0 p-8 z-50 pointer-events-none"
              >
                <div className="max-w-xl mx-auto bg-[#1a1c24] border border-[#a855f7]/40 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(168,85,247,0.2)] pointer-events-auto flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className="p-2 bg-[#a855f7]/10 text-[#a855f7] rounded-lg">
                      <Lucide.GraduationCap size={20} className="animate-pulse" />
                    </div>
                    <div className="text-left leading-none">
                      <span className="text-[9px] text-[#a855f7] font-black uppercase tracking-widest">Tryb Nauki: Sekwencja Pytań</span>
                      <h4 className="text-white font-bold text-sm mt-0.5 whitespace-nowrap">Potwierdź Akcję Orkiestratora</h4>
                    </div>
                    <div className="ml-auto text-slate-500 font-mono text-[9px]">Pytanie {logs.find(l => l.id === questionQueue[0].id)?.action ? 1 : 0}/3</div>
                  </div>

                  <div className="text-left">
                    <p className="text-white font-bold text-xs font-sans leading-relaxed tracking-tight">{questionQueue[0].question}</p>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <input 
                      type="text"
                      autoFocus
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnswerQuestion()}
                      placeholder="Twoja odpowiedź lub 'TAK'..."
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-[#a855f7]/50 focus:outline-none transition-all"
                    />
                    <button 
                      onClick={handleAnswerQuestion}
                      className="px-6 py-3 bg-[#a855f7] hover:bg-purple-600 text-black font-black uppercase text-[10px] rounded-xl transition-all active:scale-95"
                    >
                      Dalej &rarr;
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, onAction, color, actions }: { title: string, desc: string, icon: React.ReactNode, onAction: () => void, color: string, actions: { label: string, cmd: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const colorMap: Record<string, string> = {
    purple: 'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/20 hover:border-[#a855f7]/60 shadow-[#a855f7]/5',
    cyan: 'text-acid-cyan bg-acid-cyan/10 border-acid-cyan/20 hover:border-acid-cyan/60 shadow-acid-cyan/5',
    green: 'text-acid-green bg-acid-green/10 border-acid-green/20 hover:border-acid-green/60 shadow-acid-green/5',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/60 shadow-amber-500/5',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 hover:border-rose-500/60 shadow-rose-500/5',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/60 shadow-blue-500/5',
  };

  return (
    <div className={cn(
      "p-6 rounded-[2.5rem] border transition-all flex flex-col gap-4 text-left relative overflow-hidden group",
      colorMap[color] || colorMap.purple
    )}>
      <div className="flex items-center justify-between relative z-10">
        <div className="p-3 bg-black/40 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <button 
          onClick={onAction}
          className="p-2 border border-current rounded-xl hover:bg-white/10 transition-all active:scale-90"
        >
          <Lucide.ChevronRight size={16} />
        </button>
      </div>

      <div className="relative z-10">
        <h4 className="text-white font-extrabold text-sm uppercase italic tracking-tight">{title}</h4>
        <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium leading-tight">{desc}</p>
      </div>

      <div className="mt-2 flex flex-col gap-1.5 relative z-10">
        {actions.map(act => (
          <button 
            key={act.label}
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="w-full py-2 px-3 bg-black/30 hover:bg-black/60 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all text-left flex justify-between items-center"
          >
            {act.label}
            <span className="text-[8px] opacity-30 font-mono">{act.cmd.slice(0, 15)}...</span>
          </button>
        ))}
      </div>

      {/* Decorative bg glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-current opacity-10 rounded-full blur-3xl pointer-events-none group-hover:opacity-20 transition-all" />
    </div>
  );
}
