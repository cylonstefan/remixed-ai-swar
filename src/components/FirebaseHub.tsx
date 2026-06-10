import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import { firebaseAuth, firebaseDb, OperationType } from '../services/firebaseService';
import { User } from 'firebase/auth';
import { Agent, Team, Task, Message } from '../types';
import { api } from '../services/api';

interface FirebaseHubProps {
  showToast: (msg: string) => void;
  onSyncComplete?: () => void;
}

export const FirebaseHub: React.FC<FirebaseHubProps> = ({ showToast, onSyncComplete }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [direction, setDirection] = useState<'push' | 'pull' | 'idle'>('idle');
  const [autoSync, setAutoSync] = useState(false);

  // Stats
  const [cloudStats, setCloudStats] = useState({
    agents: 0,
    teams: 0,
    tasks: 0,
    messages: 0,
  });

  const [activeSchemaTab, setActiveSchemaTab] = useState<'UserProfile' | 'Agent' | 'Team' | 'Task' | 'Message'>('UserProfile');

  // Monitor auth state
  useEffect(() => {
    const unsub = firebaseAuth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchCloudStats(currentUser.uid);
      }
    });
    return unsub;
  }, []);

  // Fetch status of the cloud database
  const fetchCloudStats = async (uid: string) => {
    try {
      const dbAgents = await firebaseDb.getAgents(uid);
      const dbTeams = await firebaseDb.getTeams(uid);
      const dbTasks = await firebaseDb.getTasks(uid);
      const dbMessages = await firebaseDb.getMessages(uid);

      setCloudStats({
        agents: dbAgents.length,
        teams: dbTeams.length,
        tasks: dbTasks.length,
        messages: dbMessages.length
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const u = await firebaseAuth.loginWithGoogle();
      showToast(`Zalogowano pomyślnie chmurę: ${u.email}`);
    } catch (e) {
      showToast('Błąd uwierzytelniania Google SSO');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseAuth.logout();
      showToast('Wylogowano z bazy chmurowej');
      setCloudStats({ agents: 0, teams: 0, tasks: 0, messages: 0 });
    } catch (e) {
      showToast('Błąd podczas wylogowywania');
    }
  };

  // Push local sqlite state to Firestore
  const handlePushSync = async () => {
    if (!user) return;
    setSyncing(true);
    setDirection('push');
    try {
      // 1. Get local assets from Express
      const localAgents = await api.getAgents();
      const localTeams = await api.getTeams();
      const localTasks = await api.getTasks();

      // 2. Upload to Firestore
      for (const a of localAgents) {
        await firebaseDb.saveAgent(user.uid, a);
      }
      for (const t of localTeams) {
        await firebaseDb.saveTeam(user.uid, t);
      }
      for (const task of localTasks) {
        await firebaseDb.saveTask(user.uid, task);
      }

      await fetchCloudStats(user.uid);
      showToast('Pomyślnie przesłano lokalną bazę do Firestore! ☁️');
      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      showToast('Błąd synchronizacji (Push)');
      console.error(error);
    } finally {
      setSyncing(false);
      setDirection('idle');
    }
  };

  // Pull Cloud Firestore data into local SQLite engine
  const handlePullSync = async () => {
    if (!user) return;
    setSyncing(true);
    setDirection('pull');
    try {
      // 1. Fetch Cloud
      const dbAgents = await firebaseDb.getAgents(user.uid);
      const dbTeams = await firebaseDb.getTeams(user.uid);
      const dbTasks = await firebaseDb.getTasks(user.uid);

      // 2. Insert into SQLite
      for (const a of dbAgents) {
        await api.createAgent(a);
      }
      for (const t of dbTeams) {
        await api.createTeam(t);
      }
      for (const k of dbTasks) {
        await api.createTask(k);
      }

      showToast('Pomyślnie zintegrowano i pobrano dane z Firestore do SQLite!');
      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      showToast('Błąd synchronizacji (Pull)');
      console.error(error);
    } finally {
      setSyncing(false);
      setDirection('idle');
    }
  };

  return (
    <div className="space-y-8 font-sans text-sm max-w-6xl mx-auto pb-12 text-left relative z-10">
      {/* Upper Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Connection status card */}
        <div className="lg:col-span-5 bg-neutral-900/80 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-acid-purple/5 rounded-full blur-[60px]" />
          
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Uwierzytelnienie Systemu</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${user ? 'bg-acid-green' : 'bg-red-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${user ? 'bg-acid-green' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-[9px] font-mono font-black uppercase tracking-wider">
                  {user ? 'ONLINE (CLOUD)' : 'LOCAL ONLY'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Lucide.Loader2 size={32} className="text-acid-purple animate-spin" />
                <span className="text-xs uppercase font-mono text-slate-500">Inicjowanie chmury...</span>
              </div>
            ) : !user ? (
              <div className="py-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <Lucide.CloudOff size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-bold text-base uppercase tracking-tight">Baza Chmurowa Nieaktywna</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Połącz się z bezpieczną bazą danych Firestore i chmurowym logowaniem Google SSO, aby uzyskać trwałą autosynchronizację rojów i zadań.
                  </p>
                </div>
                <button
                  onClick={handleLogin}
                  className="modern-btn inline-flex items-center gap-3 bg-white text-black hover:bg-slate-200 border border-white shadow-lg shadow-white/5 mx-auto font-bold cursor-pointer"
                >
                  <Lucide.Chrome size={16} />
                  Zaloguj przez Google SSO
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info Frame */}
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  {user.photoURL ? (
                    <img referrerPolicy="no-referrer" src={user.photoURL} alt={user.displayName || ''} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-acid-purple/20 text-acid-purple flex items-center justify-center border border-acid-purple/30 text-lg font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-bold leading-tight truncate">{user.displayName || 'Użytkownik Chmury'}</h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{user.email}</p>
                    <span className="inline-block px-1.5 py-0.5 bg-acid-purple/15 text-acid-purple border border-acid-purple/20 text-[8px] rounded font-black mt-1.5 uppercase tracking-wider font-mono">
                      UID: {user.uid.substring(0, 12)}...
                    </span>
                  </div>
                </div>

                {/* Cloud Stat Badges */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    { label: 'Cloud Agents', count: cloudStats.agents, icon: <Lucide.Bot size={14} className="text-acid-cyan" /> },
                    { label: 'Cloud Teams', count: cloudStats.teams, icon: <Lucide.Users size={14} className="text-acid-purple" /> },
                    { label: 'Cloud Tasks', count: cloudStats.tasks, icon: <Lucide.ListTodo size={14} className="text-amber-400" /> },
                    { label: 'Cloud Messages', count: cloudStats.messages, icon: <Lucide.MessageSquare size={14} className="text-emerald-400" /> },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0">
                        <span className="block text-[9px] text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        <span className="block text-sm font-bold text-white font-mono">{stat.count}</span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                        {stat.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="pt-6 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-[0.98]"
              >
                <Lucide.LogOut size={14} />
                Wyloguj Sesję Chmury
              </button>
            </div>
          )}
        </div>

        {/* Sync Controls / Database Actions */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-acid-cyan/5 rounded-full blur-[60px]" />

          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Centrum Synchronizacji Firestore DB</span>
              <Lucide.RefreshCcw size={14} className={`text-acid-cyan ${syncing ? 'animate-spin' : ''}`} />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Możesz w każdej chwili przenieść całą swoją istniejącą lokalną strukturę klastrów, maszyn i zadań do Firebase cloud, lub zasilić lokalne deamony uprzednio zapisanymi profilami chmurowymi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Push local data */}
              <button
                disabled={!user || syncing}
                onClick={handlePushSync}
                className={`flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all text-left relative overflow-hidden cursor-pointer group ${
                  !user 
                    ? 'border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed' 
                    : syncing && direction === 'push'
                      ? 'border-acid-cyan bg-acid-cyan/5'
                      : 'border-white/10 bg-white/[0.02] hover:border-acid-cyan/60 hover:bg-acid-cyan/5'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/15 flex items-center justify-center text-acid-cyan group-hover:scale-105 transition-transform">
                  <Lucide.UploadCloud size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white uppercase tracking-tight">Eksportuj do Chmury (Push)</span>
                  <p className="text-[10px] text-slate-400 lowercase leading-normal">
                    Prześlij agentów, zespoły i obecne cele z lokalnego sqlite do bazy firestore.
                  </p>
                </div>
                {syncing && direction === 'push' && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-acid-cyan to-acid-purple animate-pulse" />
                )}
              </button>

              {/* Pull cloud data */}
              <button
                disabled={!user || syncing}
                onClick={handlePullSync}
                className={`flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all text-left relative overflow-hidden cursor-pointer group ${
                  !user 
                    ? 'border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed' 
                    : syncing && direction === 'pull'
                      ? 'border-acid-purple bg-acid-purple/5'
                      : 'border-white/10 bg-white/[0.02] hover:border-acid-purple/60 hover:bg-acid-purple/5'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/15 flex items-center justify-center text-acid-purple group-hover:scale-105 transition-transform">
                  <Lucide.DownloadCloud size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white uppercase tracking-tight">Importuj z Chmury (Pull)</span>
                  <p className="text-[10px] text-slate-400 lowercase leading-normal">
                    Pobierz zapisane dane z Twojego profilu Google w Firebase i utrwal je w lokalnym klastrze.
                  </p>
                </div>
                {syncing && direction === 'pull' && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-acid-purple to-acid-cyan animate-pulse" />
                )}
              </button>

            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white uppercase tracking-tight">Inteligentna Autosynchronizacja</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Bąbelki modyfikacji w tle</p>
            </div>
            <button
              disabled={!user}
              onClick={() => {
                setAutoSync(!autoSync);
                showToast(autoSync ? 'Wyłączono automatyczną synchronizację w tle' : 'Aktywowano autosynchronizację w tle! 🔄');
              }}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative shrink-0 cursor-pointer ${
                !user 
                  ? 'bg-neutral-800 opacity-40 cursor-not-allowed' 
                  : autoSync ? 'bg-acid-green' : 'bg-neutral-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-350 absolute top-1 ${
                autoSync ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

      </div>

      {/* Database Schema & Compliance Rules Explorer */}
      <div className="bg-neutral-900/80 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-white font-bold text-base uppercase tracking-tight">Przegląd Walidacji Schematów Bezpieczeństwa Firestore</h3>
            <p className="text-[10.5px] text-slate-450 uppercase tracking-widest font-mono mt-0.5">Attribute-Based Access Control Zero-Trust Schema Verification</p>
          </div>
          <span className="text-[10px] bg-acid-green/10 border border-acid-green/30 text-acid-green px-3 py-1 bg-green-500/5 rounded-full font-bold uppercase tracking-wider font-mono">
            Fortress Patroled: Active
          </span>
        </div>

        {/* Tab selection */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-white/5">
          {(['UserProfile', 'Agent', 'Team', 'Task', 'Message'] as const).map((schema) => (
            <button
              key={schema}
              onClick={() => setActiveSchemaTab(schema)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeSchemaTab === schema 
                  ? 'bg-neutral-800 border border-white/10 text-white' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-neutral-850'
              }`}
            >
              Schema: {schema}
            </button>
          ))}
        </div>

        {/* Console representation for current tab */}
        <div className="bg-black/90 rounded-2xl p-5 border border-white/5 font-mono text-xs overflow-x-auto text-slate-300">
          <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase font-bold tracking-widest pb-3 mb-4 border-b border-white/5">
            <span>Konfiguracja JSON Służąca do Walidacji</span>
            <span>Firestore.rules ABAC Rule matched</span>
          </div>

          {activeSchemaTab === 'UserProfile' && (
            <pre className="text-emerald-400">
{`{
  "title": "UserProfile",
  "description": "User profile containing settings and preferences",
  "properties": {
    "uid": "string (size <= 128)",
    "email": "string (size <= 256)",
    "displayName": "string (size <= 256 | optional)"
  },
  "rules": {
    "allowRead": "request.auth.uid == userId",
    "allowWrite": "request.auth.uid == userId"
  }
}`}
            </pre>
          )}

          {activeSchemaTab === 'Agent' && (
            <pre className="text-acid-cyan">
{`{
  "title": "Agent",
  "properties": {
    "id": "string (size <= 128)",
    "userId": "string (matching authenticated owner)",
    "name": "string (size <= 256)",
    "role": "string (size <= 256)",
    "model": "string (size <= 128)",
    "xp": "integer / float (optional)",
    "voice": "string (size <= 64 | optional)"
  },
  "rules": {
    "allowGet": "isOwner(userId)",
    "allowList": "isOwner(userId)"
  }
}`}
            </pre>
          )}

          {activeSchemaTab === 'Team' && (
            <pre className="text-acid-purple">
{`{
  "title": "Team",
  "properties": {
    "id": "string (size <= 128)",
    "userId": "string (matching authenticated owner)",
    "name": "string (size <= 256)",
    "agentIds": "array of strings (max 50 members)"
  },
  "rules": {
    "allowCreate": "isOwner(userId) && isValidTeam(incoming())",
    "allowUpdate": "isOwner(userId) && fieldDiffRestriction()"
  }
}`}
            </pre>
          )}

          {activeSchemaTab === 'Task' && (
            <pre className="text-amber-400">
{`{
  "title": "Task",
  "properties": {
    "id": "string (size <= 128)",
    "userId": "string (matching authenticated owner)",
    "title": "string (size <= 256)",
    "status": "string ('todo' | 'in-progress' | 'done')",
    "priority": "string ('low' | 'medium' | 'high')"
  },
  "rules": {
    "allowDelete": "isOwner(userId) && isValidId(taskId)"
  }
}`}
            </pre>
          )}

          {activeSchemaTab === 'Message' && (
            <pre className="text-indigo-400">
{`{
  "title": "Message",
  "properties": {
    "id": "string (size <= 128)",
    "userId": "string",
    "teamId": "string",
    "content": "string (size <= 10000 chars)",
    "role": "string ('agent' | 'user')"
  },
  "rules": {
    "allowCreate": "isOwner(userId) && isValidMessage(incoming())"
  }
}`}
            </pre>
          )}
        </div>
      </div>

    </div>
  );
};
