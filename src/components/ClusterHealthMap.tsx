import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { ClusterNode } from '../types';
import { Activity, Server, Smartphone, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const HealthNode = ({ data }: { data: any }) => {
  const { node } = data;
  const isOnline = node.status === 'online';
  return (
    <div className={`p-4 rounded-xl border-2 ${isOnline ? 'border-emerald-500/50 bg-black/80' : 'border-rose-500/50 bg-black/80'}`}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-3">
        {node.isAndroid ? <Smartphone className={isOnline ? "text-emerald-400" : "text-rose-400"} /> : <Server className={isOnline ? "text-cyan-400" : "text-rose-400"} />}
        <div>
          <div className="font-bold text-white text-sm">{node.name}</div>
          <div className="text-[10px] text-slate-400 font-mono">{node.ip}</div>
        </div>
        <div className="ml-2 flex items-center justify-center">
            {isOnline ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-rose-500" />}
        </div>
      </div>
      
      {/* CPU Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1 font-mono">
            <span className="text-acid-cyan">CPU</span>
            <span className={node.cpuUsage > 90 ? "text-rose-500" : "text-white"}>{node.cpuUsage || 0}%</span>
        </div>
        <div className="h-1.5 w-full bg-black border border-white/10 rounded-full overflow-hidden">
            <div 
                className={`h-full ${node.cpuUsage > 90 ? 'bg-rose-500 animate-pulse' : 'bg-acid-cyan'}`} 
                style={{ width: `${node.cpuUsage || 0}%` }}
            />
        </div>
      </div>

      {/* RAM Bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1 font-mono">
            <span className="text-violet-400">RAM</span>
            <span className="text-white">{node.ramUsage || 0}%</span>
        </div>
        <div className="h-1.5 w-full bg-black border border-white/10 rounded-full overflow-hidden">
            <div 
                className="h-full bg-violet-500" 
                style={{ width: `${node.ramUsage || 0}%` }}
            />
        </div>
      </div>
      
      <div className="text-[10px] text-slate-500 font-mono mt-3 text-right">
        Latency: {node.latency || 0}ms
      </div>
    </div>
  );
};

const nodeTypes = {
  healthNode: HealthNode,
};

export const ClusterHealthMap = () => {
    const [nodes, setNodes] = useState<ClusterNode[]>([]);
    
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const fetchHealthData = async () => {
            try {
                const data = await api.getClusters();
                setNodes(data);
            } catch (e) {
                console.error("Failed to fetch cluster health data", e);
            }
        };
        fetchHealthData();
        interval = setInterval(fetchHealthData, 3000);
        return () => clearInterval(interval);
    }, []);

    const { flowNodes, flowEdges } = useMemo(() => {
        const fn: Node[] = nodes.map((n, i) => ({
            id: n.id,
            type: 'healthNode',
            data: { node: n },
            position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 200 },
        }));

        const fe: Edge[] = [];
        nodes.forEach((n, i) => {
            if (i > 0) {
                const isBothOnline = nodes[i-1].status === 'online' && n.status === 'online';
                fe.push({
                    id: `e-${nodes[i-1].id}-${n.id}`,
                    source: nodes[i-1].id,
                    target: n.id,
                    animated: isBothOnline,
                    label: isBothOnline ? 'ACTIVE' : 'OFFLINE',
                    labelStyle: { fill: isBothOnline ? '#10b981' : '#f43f5e', fontWeight: 600, fontSize: 10 },
                    style: { stroke: isBothOnline ? '#3b82f6' : '#f43f5e', strokeWidth: 2, opacity: 0.6 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: isBothOnline ? '#3b82f6' : '#f43f5e' },
                });
            }
        });

        // Add cross connections for mesh-like look
        if (nodes.length > 2) {
            fe.push({
                id: `e-${nodes[0].id}-${nodes[nodes.length-1].id}`,
                source: nodes[0].id,
                target: nodes[nodes.length-1].id,
                animated: nodes[0].status === 'online' && nodes[nodes.length-1].status === 'online',
                style: { stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.4 },
            });
        }

        return { flowNodes: fn, flowEdges: fe };
    }, [nodes]);

    return (
        <div className="h-full w-full flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white font-display flex items-center gap-3">
                    <Activity className="text-emerald-500" />
                    Cluster Health Monitoring
                </h2>
                <div className="flex gap-4">
                    <div className="bg-black/30 px-4 py-2 rounded border border-white/5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-400 text-xs font-mono font-bold">LIVE SYNC</span>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl overflow-hidden relative">
                <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Background gap={16} size={1} color="#333" />
                    <Controls className="bg-black border border-white/10" position="bottom-right" />
                </ReactFlow>
            </div>
        </div>
    );
};
