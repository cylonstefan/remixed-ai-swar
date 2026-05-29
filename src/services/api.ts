import { Agent, Team, Message, Task, ClusterNode, TrainingSession, KnowledgeEntry, VideoMetadata } from "../types";

export const api = {
  async getAgentStats(): Promise<{ id: string; name: string; color: string; messageCount: number; tasksCompleted: number }[]> {
    const res = await fetch("/api/stats/agents");
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
  async createTeam(team: { id: string; name: string; description: string; mode?: string; agentIds: string[]; agentTasks?: Record<string, string> }): Promise<void> {
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
    return res.json();
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
  async deleteMCPServer(id: string): Promise<void> {
    await fetch(`/api/mcp/servers/${id}`, { method: "DELETE" });
  },
};
