import { Agent, Message, Team } from "../types";

export const gemini = {
  async generateAgentResponse(
    agent: Agent,
    history: Message[],
    teamMode: Team['mode'] = 'loose',
    hfKey?: string,
    advancedTools: boolean = false,
    availableContext?: string,
    openaiKey?: string
  ): Promise<{ text: string, functionCalls?: any[] }> {
    const res = await fetch("/api/gemini/generateAgentResponse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, history, teamMode, hfKey, advancedTools, availableContext, openaiKey })
    });
    if (!res.ok) throw new Error("Server error from generateAgentResponse");
    return res.json();
  },

  async assistantHelp(prompt: string): Promise<string> {
    const res = await fetch("/api/gemini/assistantHelp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error("Server error from assistantHelp");
    const data = await res.json();
    return data.text;
  },

  async textToSpeech(text: string, voice: string = 'Kore'): Promise<string> {
    const res = await fetch("/api/gemini/textToSpeech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice })
    });
    if (!res.ok) throw new Error("Server error from textToSpeech");
    const data = await res.json();
    return data.audio; // base64 string
  },

  async speechToText(audioData: string): Promise<string> {
    const res = await fetch("/api/gemini/speechToText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioData })
    });
    if (!res.ok) throw new Error("Server error from speechToText");
    const data = await res.json();
    return data.text;
  },

  async translateToPolish(text: string): Promise<string> {
    const res = await fetch("/api/gemini/translateToPolish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("Server error from translateToPolish");
    const data = await res.json();
    return data.text;
  },

  async translateMessage(text: string): Promise<string> {
    const res = await fetch("/api/gemini/translateMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("Server error from translateMessage");
    const data = await res.json();
    return data.text;
  },

  async generateMusic(prompt: string): Promise<string> {
    const res = await fetch("/api/gemini/generateMusic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error("Server error from generateMusic");
    const data = await res.json();
    return data.audio; // base64 string
  },

  async generateVideo(prompt: string): Promise<string> {
    const res = await fetch("/api/gemini/generateVideo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error("Server error from generateVideo");
    const data = await res.json();
    return data.url; // Object URL or static file URL
  },

  async animateImage(imageUrl: string, prompt: string): Promise<string> {
    const res = await fetch("/api/gemini/animateImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, prompt })
    });
    if (!res.ok) throw new Error("Server error from animateImage");
    const data = await res.json();
    return data.url; // Object URL or static file URL
  },

  async planTeam(goal: string, availableAgents: Agent[]): Promise<{ teamName: string, description: string, agentIds: string[], tasks: string[], complexity: 'low' | 'medium' | 'high', taskType: string }> {
    const res = await fetch("/api/gemini/planTeam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, availableAgents })
    });
    if (!res.ok) throw new Error("Server error from planTeam");
    return res.json();
  },

  async generateEnhancedPrompt(task: string): Promise<string> {
    const res = await fetch("/api/gemini/generateEnhancedPrompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })
    });
    if (!res.ok) throw new Error("Server error from generateEnhancedPrompt");
    const data = await res.json();
    return data.text;
  },

  async generateAgentSystemPrompt(role: string, name: string): Promise<string> {
    const res = await fetch("/api/gemini/generateAgentSystemPrompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, name })
    });
    if (!res.ok) throw new Error("Server error from generateAgentSystemPrompt");
    const data = await res.json();
    return data.text;
  },

  async validateAgentSystemPrompt(systemPrompt: string): Promise<string> {
    const res = await fetch("/api/gemini/validateAgentSystemPrompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt })
    });
    if (!res.ok) throw new Error("Server error from validateAgentSystemPrompt");
    const data = await res.json();
    return data.text;
  }
};
