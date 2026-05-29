export interface AgentHistoryEntry {
  timestamp: string;
  changes: Record<string, { from: any, to: any }>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model: string;
  color: string;
  voice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
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
  category?: string;
  createdAt?: string;
  usage?: number;
  icon?: string;
  messageCount?: number;
  tasksCompleted?: number;
  advancedTools?: boolean;
  history?: AgentHistoryEntry[];
}

export interface Team {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  agentIds: string[];
  mode?: 'loose' | 'sharp' | 'concrete' | 'business' | 'work' | 'office' | 'debugging' | 'creative' | 'strategic';
  agentTasks?: Record<string, string>;
  memory?: string;
  createdAt?: string;
  clusterNodeId?: string;
  advancedTools?: boolean;
}

export interface Message {
  id: string;
  teamId: string;
  agentId?: string;
  content: string;
  role: 'agent' | 'user';
  fileUrl?: string;
  fileName?: string;
  files?: { url: string; name: string }[];
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  complexity?: 'low' | 'medium' | 'high';
  taskType?: string;
  createdAt?: string;
}

export interface Log {
  id: string;
  agentId?: string;
  agentName?: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface TrainingSession {
  id: string;
  topic: string;
  goal: string;
  status: 'idle' | 'training' | 'completed' | 'failed';
  progress: number;
  result?: string;
  createdAt: string;
}

export interface ClusterNode {
  id: string;
  name: string;
  ip: string;
  dns?: string;
  status: 'online' | 'offline' | 'busy';
  type: 'worker' | 'manager';
  lastSeen: string;
  cpuUsage?: number;
  ramUsage?: number;
  latency?: number;
  protocol?: 'gRPC' | 'WebSocket' | 'REST' | 'RabbitMQ';
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: 'filesystem' | 'database' | 'network' | 'tool' | 'custom';
  status: 'online' | 'offline' | 'configuring';
  config: Record<string, any>;
  capabilities: string[];
}

export type SceneCategory = 'automatyzacja' | 'analiza' | 'bezpieczenstwo' | 'multimedia' | 'programowanie';

export interface ExampleScenario {
  id: string;
  title: string;
  description: string;
  category: SceneCategory;
  steps: string[];
  recommendedAgents: string[];
}

export interface VideoMetadata {
  id: string;
  url: string;
  thumbnail: string;
  prompt: string;
  duration?: number;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  author?: string;
  createdAt: string;
}
