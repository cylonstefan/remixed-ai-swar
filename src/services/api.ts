import { Agent, Team, Message, Task, ClusterNode, TrainingSession, KnowledgeEntry, VideoMetadata, AgentErrorLog } from "../types";

export const api = {
  async getAgentStats(): Promise<{ id: string; name: string; color: string; messageCount: number; tasksCompleted: number }[]> {
    const res = await fetch("/api/stats/agents");
    return res.json();
  },
  async getSwarmHealth(): Promise<any> {
    const res = await fetch("/api/stats/swarm-health");
    return res.json();
  },
  async getAgents(): Promise<Agent[]> {
    const res = await fetch("/api/agents");
    return res.json();
  },
  async createAgent(agent: Agent): Promise<void> {
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent),
    });
  },
  async deleteAgent(id: string): Promise<void> {
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
  },
  async updateAgent(id: string, agent: Partial<Agent>): Promise<void> {
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent),
    });
  },
  async incrementAgentUsage(id: string): Promise<void> {
    await fetch(`/api/agents/${id}/usage`, { method: "PATCH" });
  },
  async getTeams(): Promise<Team[]> {
    const res = await fetch("/api/teams");
    return res.json();
  },
  async getSettings(): Promise<Record<string, string>> {
    const res = await fetch("/api/settings");
    return res.json();
  },
  async updateSetting(key: string, value: string): Promise<void> {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  },
  async testLocalLlm(address: string, apiKey: string): Promise<{ success: boolean; provider: string; models: string[]; error?: string; message: string }> {
    const res = await fetch("/api/settings/test-local-llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, apiKey }),
    });
    return res.json();
  },
  async executePowerShell(command: string): Promise<{ success: boolean; output: string; error?: string; powershellUsed: boolean; fallbackUsed: boolean; message: string }> {
    const res = await fetch("/api/powershell/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    return res.json();
  },
  async getSynergy(): Promise<any[]> {
    const res = await fetch("/api/stats/synergy");
    return res.json();
  },
  async getSchedules(): Promise<any[]> {
    const res = await fetch("/api/schedules");
    return res.json();
  },
  async getPairingSuggestions(): Promise<any[]> {
    const res = await fetch("/api/teams/pairing-suggestions");
    return res.json();
  },
  async createSchedule(data: any): Promise<{ id: string; success: boolean }> {
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteSchedule(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    return res.json();
  },
  async toggleSchedule(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/schedules/${id}/toggle`, { method: "PATCH" });
    return res.json();
  },
  async executeDeviceCommand(deviceId: string, action: string, command: string): Promise<{ success: boolean; output: string; error?: string }> {
    const res = await fetch("/api/devices/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, action, command }),
    });
    return res.json();
  },
  async analyzeMedia(mediaData: { type: 'image' | 'video', source: 'camera' | 'upload', data: string }): Promise<{ success: boolean; result: string; categorization: any }> {
    const res = await fetch("/api/media/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mediaData),
    });
    return res.json();
  },
  async autoDetectLocalLlm(address?: string, apiKey?: string): Promise<{ success: boolean; provider: string; detectedHardware: { ramGB: number; cores: number; platform: string }; recommendation: { size: string; details: string; uncensoredFirst: boolean }; discoveredModels: string[]; matchedUncensored: string[]; chosenModel: string; message: string }> {
    const res = await fetch("/api/settings/auto-detect-local-llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, apiKey }),
    });
    return res.json();
  },
  async pullLocalLlmModel(address: string, model: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch("/api/settings/local-llm/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, model }),
    });
    return res.json();
  },
  async getCredentials(): Promise<any[]> {
    const res = await fetch("/api/credentials");
    return res.json();
  },
  async saveCredential(credential: any): Promise<void> {
    await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    });
  },
  async deleteCredential(id: string): Promise<void> {
    await fetch(`/api/credentials/${id}`, { method: "DELETE" });
  },
  async createTeam(team: { id: string; name: string; description: string; mode?: string; agentIds: string[]; agentTasks?: Record<string, string>; flightMode?: 'autopilot' | 'manual' | 'vr'; flightConfig?: string; color?: string }): Promise<void> {
    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    });
  },
  async deleteTeam(id: string): Promise<void> {
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
  },
  async updateTeam(id: string, team: Partial<Team>): Promise<void> {
    await fetch(`/api/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    });
  },
  async getMessages(teamId: string): Promise<Message[]> {
    const res = await fetch(`/api/messages/${teamId}`);
    return res.json();
  },
  async sendMessage(message: Message): Promise<void> {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  },
  async getTasks(): Promise<Task[]> {
    const res = await fetch("/api/tasks");
    if (!res.ok) throw new Error("Failed to load tasks");
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        console.error("DEBUG: Expected JSON but got", contentType);
        throw new Error("Invalid response from server");
    }
    return res.json();
  },
  async createTask(task: Task): Promise<void> {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
  },
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  },
  async updateTaskStatus(id: string, status: string): Promise<void> {
    return this.updateTask(id, { status: status as any });
  },
  async deleteTask(id: string): Promise<void> {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  },
  async uploadFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append("files", file); // Changed from "file" to "files" to match server
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    // Server returns { files: [{url, name}] }
    return data.files[0];
  },
  async getLogs(): Promise<any[]> {
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Could not retrieve system logs, falling back to empty array:", err);
      return [];
    }
  },
  async createLog(log: { id: string; agentId?: string; agentName?: string; action: string; details?: string }): Promise<void> {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
  },

  // File Generation
  async generateDocx(title: string, content: string, filename?: string): Promise<{ fileUrl: string; fileName: string }> {
    const res = await fetch("/api/generate/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, filename }),
    });
    return res.json();
  },
  async generateXlsx(data: string[][], filename?: string): Promise<{ fileUrl: string; fileName: string }> {
    const res = await fetch("/api/generate/xlsx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, filename }),
    });
    return res.json();
  },
  async generatePdf(content: string, filename?: string): Promise<{ fileUrl: string; fileName: string }> {
    const res = await fetch("/api/generate/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, filename }),
    });
    return res.json();
  },
  async generateTextFile(content: string, filename?: string, extension?: string): Promise<{ fileUrl: string; fileName: string }> {
    const res = await fetch("/api/generate/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, filename, extension }),
    });
    return res.json();
  },
  async generateImage(text: string, width?: number, height?: number, format?: string, filename?: string): Promise<{ fileUrl: string; fileName: string }> {
    const res = await fetch("/api/generate/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, width, height, format, filename }),
    });
    return res.json();
  },
  async generateVideo(prompt: string, format?: string, filename?: string): Promise<{ fileUrl: string; fileName: string }> {
    const res = await fetch("/api/generate/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, format, filename }),
    });
    return res.json();
  },
  async generateMultimedia(data: {
    prompt: string;
    mode: "text-to-video" | "picture-to-video" | "text-to-image" | "voice-to-video" | "voice-to-image" | "text-to-audio";
    image_url?: string;
    audio_url?: string;
    voiceName?: string;
    duration?: number;
    speed?: number;
    effect?: string;
    bgMusic?: string;
  }): Promise<any> {
    const res = await fetch("/api/generate/multimedia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to generate multimedia");
    }
    return res.json();
  },
  async diagnoseImage(image_url: string, diagnosticType: string, customPrompt?: string): Promise<any> {
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url, diagnosticType, customPrompt }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to run diagnostics");
    }
    return res.json();
  },
  async compileVideo(data: {
    scenes: any[];
    bgMusic: string;
    watermark?: string;
  }): Promise<any> {
    const res = await fetch("/api/videos/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to compile storyboard");
    }
    return res.json();
  },
  async getVideos(): Promise<any[]> {
    const res = await fetch("/api/videos");
    return res.json();
  },
  async deleteVideo(id: string): Promise<void> {
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
  },

  // Clusters
  async getClusters(): Promise<ClusterNode[]> {
    const res = await fetch("/api/clusters");
    if (!res.ok) {
        console.error("Failed to fetch clusters:", res.status, res.statusText);
        return [];
    }
    try {
        return await res.json();
    } catch (e) {
        console.error("Failed to parse cluster JSON:", e);
        return [];
    }
  },
  async addClusterNode(node: ClusterNode): Promise<void> {
    await fetch("/api/clusters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(node),
    });
  },
  async deleteClusterNode(id: string): Promise<void> {
    await fetch(`/api/clusters/${id}`, { method: "DELETE" });
  },
  async restartClusterNode(id: string): Promise<void> {
    await fetch(`/api/clusters/${id}/restart`, { method: "POST" });
  },
  async shutdownClusterNode(id: string): Promise<void> {
    await fetch(`/api/clusters/${id}/shutdown`, { method: "POST" });
  },
  async simulateIdle(id: string): Promise<void> {
    await fetch(`/api/clusters/${id}/simulate_idle`, { method: "POST" });
  },
  async wakeClusterNode(id: string): Promise<void> {
    await fetch(`/api/clusters/${id}/wake`, { method: "POST" });
  },

  // Training
  async getTrainingSessions(): Promise<TrainingSession[]> {
    const res = await fetch("/api/training");
    return res.json();
  },
  async startTrainingSession(session: TrainingSession): Promise<void> {
    await fetch("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
  },
  async updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<void> {
    await fetch(`/api/training/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  },

  async getAgentErrors(agentId?: string): Promise<AgentErrorLog[]> {
    const url = agentId ? `/api/agents/${agentId}/errors` : "/api/training/errors";
    const res = await fetch(url);
    return res.json();
  },
  async logAgentError(errorLog: AgentErrorLog): Promise<void> {
    await fetch("/api/training/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorLog),
    });
  },
  async updateAgentErrorStatus(id: string, status: 'FAILED_TO_EXECUTE' | 'TUNED' | 'ADAPTED'): Promise<void> {
    await fetch(`/api/training/errors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },

  // MCP & Scenarios
  async getMCPServers(): Promise<any[]> {
    const res = await fetch("/api/mcp/servers");
    return res.json();
  },
  async configureMCP(id: string, config: any): Promise<void> {
    await fetch(`/api/mcp/servers/${id}/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  },
  async pingMCPServer(id: string): Promise<any> {
    const res = await fetch(`/api/mcp/servers/${id}/ping`, {
      method: "POST"
    });
    return res.json();
  },
  async discoverMCPServer(id: string): Promise<any> {
    const res = await fetch(`/api/mcp/servers/${id}/discover`, {
      method: "POST"
    });
    return res.json();
  },
  async executeMCPTool(id: string, tool: string, args: any): Promise<any> {
    const res = await fetch(`/api/mcp/servers/${id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, arguments: args })
    });
    return res.json();
  },
  async getSnitchReports(): Promise<any[]> {
    const res = await fetch("/api/snitch/reports");
    return res.json();
  },
  async getAgentInteractionLogs(agentId: string): Promise<any[]> {
    const res = await fetch(`/api/agents/${agentId}/interaction-logs`);
    return res.json();
  },
  async generateSnitchReport(): Promise<any> {
    const res = await fetch("/api/snitch/reports/generate", {
      method: "POST"
    });
    return res.json();
  },
  async takeSnitchAction(id: string, action: 'motivate' | 'farm' | 'fire' | 'ignore'): Promise<any> {
    const res = await fetch(`/api/snitch/reports/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    return res.json();
  },
  async deleteSnitchReport(id: string): Promise<any> {
    const res = await fetch(`/api/snitch/reports/${id}`, {
      method: "DELETE"
    });
    return res.json();
  },
  async getScenarios(): Promise<any[]> {
    const res = await fetch("/api/scenarios");
    return res.json();
  },
  
  // Knowledge Base
  async getKnowledge(): Promise<KnowledgeEntry[]> {
    const res = await fetch("/api/knowledge");
    return res.json();
  },
  async createKnowledge(entry: KnowledgeEntry): Promise<void> {
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  },
  async updateKnowledge(entry: KnowledgeEntry): Promise<void> {
    await fetch(`/api/knowledge/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  },
  async addKnowledge(entry: KnowledgeEntry): Promise<void> {
    return this.createKnowledge(entry);
  },
  async deleteKnowledge(id: string): Promise<void> {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
  },

  // Auth
  async getAuthStatus(): Promise<{ isProtected: boolean }> {
    const res = await fetch("/api/auth/status");
    return res.json();
  },
  async login(password: string): Promise<{ success: boolean }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return res.json();
  },
  async setupAuth(password: string): Promise<{ success: boolean }> {
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return res.json();
  },

  // Real Integration operations
  async sendRealEmail(data: any): Promise<any> {
    const res = await fetch("/api/integrations/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getLocalFiles(): Promise<any[]> {
    const res = await fetch("/api/integrations/files/list");
    return res.json();
  },
  async readLocalFile(filename: string): Promise<any> {
    const res = await fetch("/api/integrations/files/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    return res.json();
  },
  async writeLocalFile(filename: string, content: string): Promise<any> {
    const res = await fetch("/api/integrations/files/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content }),
    });
    return res.json();
  },
  async deleteLocalFile(filename: string): Promise<any> {
    const res = await fetch("/api/integrations/files/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    return res.json();
  },
  async postToJoomla(data: any): Promise<any> {
    const res = await fetch("/api/integrations/joomla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async uploadToFtp(data: any): Promise<any> {
    const res = await fetch("/api/integrations/ftp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async runM365Action(data: any): Promise<any> {
    const res = await fetch("/api/integrations/m365", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async addMCPServer(server: any): Promise<void> {
    await fetch("/api/mcp/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(server),
    });
  },
  async updateMCPServer(server: any): Promise<void> {
    await fetch(`/api/mcp/servers/${server.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(server),
    });
  },
  async deleteMCPServer(id: string): Promise<void> {
    await fetch(`/api/mcp/servers/${id}`, { method: "DELETE" });
  },
  async getProcessStates(): Promise<any[]> {
    const res = await fetch("/api/process_states");
    return res.json();
  },
  async runProcessAction(id: string, action: string): Promise<any> {
    const res = await fetch(`/api/process_states/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return res.json();
  },
  async updateProcessState(id: string, updates: any): Promise<any> {
    const res = await fetch(`/api/process_states/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async dumpProcessCommand(id: string): Promise<any> {
    const res = await fetch(`/api/process_states/${id}/dump`, {
      method: "POST"
    });
    return res.json();
  },
  async getAgentMemories(agentId: string): Promise<any[]> {
    const res = await fetch(`/api/agents/${agentId}/memories`);
    return res.json();
  },
  async addAgentMemory(agentId: string, memory: { id: string; teamId?: string | null; content: string; category?: string }): Promise<void> {
    await fetch(`/api/agents/${agentId}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memory),
    });
  },
  async deleteAgentMemory(id: string): Promise<void> {
    await fetch(`/api/agents/memories/${id}`, { method: "DELETE" });
  },
  async consolidateMemories(agentId: string, teamId: string): Promise<{ success: boolean; count: number; memories?: any[] }> {
    const res = await fetch(`/api/agents/${agentId}/memories/consolidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    return res.json();
  },
  async runSelfCorrection(): Promise<{ success: boolean; processed: number; corrected: number; details: any[] }> {
    const res = await fetch("/api/agents/self-correction", { method: "POST" });
    return res.json();
  },
  async getAgentMessagesOverTime(): Promise<{ agents: { id: string; name: string; color: string }[]; timeline: any[] }> {
    const res = await fetch("/api/stats/agent-messages-over-time");
    return res.json();
  },
};
