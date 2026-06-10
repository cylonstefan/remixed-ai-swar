import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { ClusterNode } from '../types';
import { ShieldCheck, ShieldAlert, Server, Smartphone, Cpu } from 'lucide-react';

interface ClusterTopologyGraphProps {
  nodes: ClusterNode[];
}

export const ClusterTopologyGraph: React.FC<ClusterTopologyGraphProps> = ({ nodes }) => {
  const { flowNodes, flowEdges } = useMemo(() => {
    const fn: Node[] = nodes.map((n, i) => ({
      id: n.id,
      data: { label: n.name, type: n.architecture },
      position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 150 },
      className: n.status === 'online' ? 'node-active-pulsate' : '',
      style: { 
        background: '#000', 
        border: '1px solid #777', 
        color: '#fff',
        borderRadius: '8px',
        padding: '10px'
      },
    }));

    const fe: Edge[] = [];
    nodes.forEach((n, i) => {
      // Connect to the previous node to show a basic topology
      if (i > 0) {
        fe.push({
          id: `e-${nodes[i-1].id}-${n.id}`,
          source: nodes[i-1].id,
          target: n.id,
          animated: true,
          label: 'AES-256',
          labelStyle: { fill: '#10b981', fontWeight: 700, fontSize: 10 },
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });
      }
    });

    return { flowNodes: fn, flowEdges: fe };
  }, [nodes]);

  return (
    <div className="h-[400px] w-full bg-black/50 border border-white/10 rounded-2xl overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
      >
        <Background gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
