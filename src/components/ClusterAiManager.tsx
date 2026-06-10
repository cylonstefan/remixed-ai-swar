import React, { useState, useEffect } from 'react';
import { Shield, Lock, Server, Smartphone, Cpu, Plus, Trash2, CheckCircle, AlertTriangle, Network } from 'lucide-react';
import { cn } from '../lib/utils';
import { ClusterNode, MCPServer } from '../types';
import { ClusterTopologyGraph } from './ClusterTopologyGraph';
import { api } from '../services/api';

export const ClusterAiManager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [mcpServers, setMcpservers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin') {
      setIsAuthenticated(true);
    } else {
      alert('Niepoprawne hasło!');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        setLoading(true);
        Promise.all([
            api.getClusters(),
            api.getMCPServers ? api.getMCPServers() : Promise.resolve([])
        ]).then(([nodesRes, mcpRes]) => {
            setNodes(nodesRes || []);
            setMcpservers(mcpRes || []);
        }).catch(err => {
            console.error("Failed to fetch Cluster AI data:", err);
        }).finally(() => {
            setLoading(false);
        });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-black/40 rounded-2xl border border-white/5">
        <Lock className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Autoryzacja Administratora</h2>
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Wprowadź hasło admina"
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white mb-4"
          />
          <button type="submit" className="w-full py-3 bg-acid-cyan text-black font-bold rounded-xl hover:bg-acid-cyan/80 transition-all">
            Zaloguj do Klaster AI
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white font-display">Klaster AI: Konfiguracja & Bezpieczeństwo</h2>
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-mono rounded-full border border-emerald-500/20">System Operacyjny: Online</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nodes configuration */}
        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <Cpu className="text-acid-purple" /> Zarządzanie Węzłami
          </h3>
          <div className="space-y-4">
            {nodes.map(node => (
              <div key={node.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  {node.isAndroid ? <Smartphone className="text-pink-400" /> : <Server className="text-acid-cyan" />}
                  <div>
                    <div className="font-bold text-white text-sm">{node.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{node.architecture} | {node.ip}</div>
                  </div>
                </div>
                <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button className="w-full py-2 flex items-center justify-center gap-2 bg-acid-purple/10 text-acid-purple border border-acid-purple/30 rounded-xl hover:bg-acid-purple/20">
              <Plus size={16} /> Dodaj nowy węzeł (Android/Desktop/Chmura)
            </button>
            <button 
              onClick={async () => {
                setLoading(true);
                try {
                    const response = await fetch("/api/integrations/lan-scan", { method: 'POST' });
                    const result = await response.json();
                    alert(`Wykryto urządzenia: \n${result.data}`);
                } catch (e) {
                    alert("Błąd skanowania");
                } finally {
                    setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-2 flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20"
            >
              <Network size={16} /> {loading ? "Skanowanie..." : "Skanuj LAN"}
            </button>
          </div>
        </div>

        {/* MCP Servers */}
        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <Shield className="text-orange-500" /> Serwery MCP & Bezpieczeństwo
          </h3>
          <div className="space-y-4">
            {mcpServers.map(mcp => (
              <div key={mcp.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="text-sm text-white font-mono">{mcp.name}</div>
                <div className="text-emerald-500 text-xs">Active</div>
              </div>
            ))}
            <button className="w-full py-2 flex items-center justify-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-xl hover:bg-orange-500/20">
              <Plus size={16} /> Konfiguruj serwer MCP
            </button>
          </div>
        </div>
        
        {/* Topology */}
        <div className="md:col-span-2 bg-black/40 p-6 rounded-2xl border border-white/5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <Network className="text-emerald-500" /> Topologia Sieci Klastra
            </h3>
            <ClusterTopologyGraph nodes={nodes} />
        </div>
      </div>
    </div>
  );
};
