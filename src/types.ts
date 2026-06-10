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
  voicePitch?: number;
  voiceSpeed?: number;
  skills?: string;
  knowledge?: string;
  personality?: string;
  backstory?: string;
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
  tokensUsed?: number;
  successRate?: number;
  icon?: string;
  messageCount?: number;
  tasksCompleted?: number;
  mode?: 'normal' | 'debugging' | 'enhanced' | 'restricted';
  advancedTools?: boolean;
  history?: AgentHistoryEntry[];
  flightMode?: 'autopilot' | 'manual' | 'vr';
  flightConfig?: string;
  xp?: number;
  experienceLevel?: 'novice' | 'intermediate' | 'expert';
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'massive';
  specialization?: string;
  processingPower?: number;
  autonomyLevel?: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  agentIds: string[];
  mode?: 'loose' | 'sharp' | 'concrete' | 'business' | 'work' | 'office' | 'debugging' | 'creative' | 'strategic';
  dynamics?: string; // Added field
  agentTasks?: Record<string, string>;
  memory?: string;
  createdAt?: string;
  clusterNodeId?: string;
  advancedTools?: boolean;
  flightMode?: 'autopilot' | 'manual' | 'vr';
  flightConfig?: string;
  color?: string;
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
  completionPercentage?: number;
  complexity?: 'low' | 'medium' | 'high';
  taskType?: string;
  expectedOutputFormat?: string;
  swarmAttitude?: string;
  hints?: string;
  createdAt?: string;
  dueDate?: string;
  subtasks?: { id: string; title: string; status: 'todo' | 'done' }[];
  dependencies?: string[];
  dependentOn?: string[];
  googleTaskId?: string;
  assignedAgentId?: string;
  teamId?: string; // New field
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

export type NodeArchitecture = 'server' | 'desktop' | 'laptop' | 'phone' | 'hosting' | 'hosting-vps' | 'azure' | 'gcp' | 'aws';

export interface ClusterNode {
  id: string;
  name: string;
  ip: string;
  dns?: string;
  status: 'online' | 'offline' | 'busy';
  type: 'worker' | 'manager';
  lastSeen: string;
  lastActive?: string;
  cpuUsage?: number;
  ramUsage?: number;
  latency?: number;
  protocol?: 'gRPC' | 'WebSocket' | 'REST' | 'RabbitMQ';
  architecture?: NodeArchitecture;
  isAndroid?: boolean;
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
  archived?: boolean;
  lastUsedAt?: string;
}

export interface AgentErrorLog {
  id: string;
  agentId: string;
  agentName: string;
  taskTitle: string;
  errorType: string;
  status: 'FAILED_TO_EXECUTE' | 'TUNED' | 'ADAPTED';
  errorMessage: string;
  createdAt?: string;
}

export interface SnitchReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  accused_id: string;
  accused_name: string;
  category: string;
  description: string;
  severity: 'Niski' | 'Średni' | 'Krytyczny';
  status: 'AKTYWNY' | 'ZROZUMIANO' | 'ZMOTYWOWANY' | 'FARMA' | 'DEGRADACJA' | 'ZAMIECIONE';
  action_taken?: string | null;
  createdAt: string;
}

export interface AgentMemory {
  id: string;
  agentId: string;
  teamId?: string | null;
  content: string;
  category?: 'general' | 'decision' | 'conversation' | 'fact' | 'preference';
  createdAt?: string;
}

