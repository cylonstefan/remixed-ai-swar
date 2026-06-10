import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';
import { gemini } from '../services/gemini';
import { Agent, Team, Message, KnowledgeEntry } from '../types';

const PERSONAS = [
  { id: 'auto', label: 'Auto (Detekcja)', icon: 'Sparkles', desc: 'Inteligentnie rozpoznaje intencję i styl rozmowy automatycznie.', color: '#a855f7' },
  { id: 'tech', label: 'Techniczny', icon: 'Code2', desc: 'Precyzyjna analiza kodu, błędy, refaktoryzacja i optymalizacja systemowa.', color: '#3b82f6' },
  { id: 'casual', label: 'Zwykłe Pogaduchy', icon: 'Smile', desc: 'Luźny, sympatyczny i nieformalny kumpel z branży (luźna rozmowa).', color: '#ec4899' },
  { id: 'project', label: 'Większy Projekt', icon: 'FolderGit2', desc: 'Kierownik, planowanie kamieni milowych i orkiestracja dużej architektury.', color: '#eab308' },
  { id: 'swarm', label: 'Zarządzanie Rojem', icon: 'Users', desc: 'Menadżer i taktyk optymalnego delegowania zadań dla całej eskadry agentów.', color: '#10b981' },
  { id: 'computer', label: 'Zarządzanie Komputerem', icon: 'Terminal', desc: 'Hakerska administracja Twoim systemem, CPU, procesy wirtualne i zasoby.', color: '#f97316' },
  { id: 'services', label: 'Zarządzanie Usługami', icon: 'Cpu', desc: 'Ekspert ds. połączeń, narzędzia serwerów MCP, integracje baz danych i API.', color: '#06b6d4' }
];

interface VoiceOrchestratorChatProps {
  settings: Record<string, string>;
  showToast?: (msg: string) => void;
}

export const VoiceOrchestratorChat: React.FC<VoiceOrchestratorChatProps> = ({ settings, showToast }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Selection States
  // 'system' = Intelligent virtual companion (Cylon Central Core)
  // 'agent' = Individual standalone agent
  // 'team' = Dynamic selected swarm/team
  const [targetType, setTargetType] = useState<'system' | 'agent' | 'team'>('system');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('auto');

  // Multi-Provider & File/Media states
  const [llmProvider, setLlmProvider] = useState<'local' | 'gemini' | 'openai' | 'groq' | 'meta'>('local');
  const [attachedFiles, setAttachedFiles] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mediaPrompt, setMediaPrompt] = useState<string>('');
  const [showMediaPromptPopup, setShowMediaPromptPopup] = useState<'none' | 'image' | 'video'>('none');

  // Messages log
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      role: 'agent',
      sender: 'CYLON CENTRAL CORE',
      color: '#a855f7',
      content: 'Witaj w Sztabie Operacyjnym, Dowódco. Jestem Twoim inteligentnym asystentem i cyfrowym kumplem. Pomogę Ci zestroić całą eskadre, zarządzać rojami, przeprowadzać trudne symulacje, uczyć nowej wiedzy albo po prostu pogadać o technologii i życiu. \n\nMożemy rozmawiać głosowo! Wybierz wyciągniętego agenta lub cały rój do orkiestracji powyżej.',
      timestamp: new Date().toLocaleTimeString('pl-PL')
    }
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isAutoSend, setIsAutoSend] = useState(false);
  const [isSpeechSynthesisOn, setIsSpeechSynthesisOn] = useState(true);
  const [isTalkingEffect, setIsTalkingEffect] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load available entities on mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        const ags = await api.getAgents();
        setAgents(ags);
        if (ags.length > 0) {
          setSelectedAgentId(ags[0].id);
        }

        const tms = await api.getTeams();
        setTeams(tms);
        if (tms.length > 0) {
          setSelectedTeamId(tms[0].id);
        }

        const mcps = await api.getMCPServers();
        setMcpServers(mcps);

        const tsk = await api.getTasks();
        setTasks(tsk);
      } catch (e) {
        console.error("Error loading resources for voice chat:", e);
      }
    };
    loadResources();
  }, []);

  // Set up Speech Recognition (STT)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'pl-PL';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => prev + (prev.trim() ? ' ' : '') + transcript);
          if (showToast) showToast(`Rozpoznano głos: "${transcript}"`);
          
          // Auto-send if enabled
          if (isAutoSend) {
            setTimeout(() => {
                document.getElementById('voice-send-btn')?.click();
            }, 800);
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("STT capture error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  // Scroll to bottom when messages get appended
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Handle local voice synthesize (TTS)
  const speakResponse = (text: string, pitch?: number, rate?: number) => {
    if (!isSpeechSynthesisOn) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    // Remove Markdown styling to make TTS clean
    const cleanText = text
      .replace(/[\*\#\`\-\>\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, 'link internetowy')
      .substring(0, 450); // limit length to avoid TTS choking

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pl-PL";

    // Select nice polish voice
    const voices = window.speechSynthesis.getVoices();
    const polishVoice = voices.find(v => v.lang === "pl-PL" || v.lang.startsWith("pl"));
    if (polishVoice) {
      utterance.voice = polishVoice;
    }
    
    utterance.pitch = pitch || 1;
    utterance.rate = rate || 1;

    utterance.onstart = () => setIsTalkingEffect(true);
    utterance.onend = () => {
      setIsTalkingEffect(false);
      // Restart recording in continuous mode after speaking finishes
      if (isContinuousMode) {
        setTimeout(() => {
          recognition?.start();
        }, 300);
      }
    };
    utterance.onerror = () => setIsTalkingEffect(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop();
    } else {
      if (!recognition) {
        alert("Twoja przeglądarka lub system nie posiada wsparcia dla rozpoznawania mowy Web Speech API.");
        return;
      }
      recognition.start();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          setAttachedFiles(prev => [...prev, ...data.files]);
          if (showToast) showToast(`✓ Pomyślnie załadowano ${data.files.length} plików!`);
        }
      } else {
        if (showToast) showToast('Błąd przesyłania plików.');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Błąd połączenia z serwerem wysyłania.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachedFile = (url: string) => {
    setAttachedFiles(prev => prev.filter(f => f.url !== url));
  };

  const handleGenerateMedia = async (type: 'image' | 'video') => {
    if (!mediaPrompt.trim()) return;
    const prompt = mediaPrompt.trim();
    setShowMediaPromptPopup('none');
    setMediaPrompt('');

    const userMsg = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      sender: 'OPERATOR',
      color: '#a855f7',
      content: type === 'image' ? `🎨 [GENEROWANIE OBRAZU]: ${prompt}` : `🎬 [GENEROWANIE VIDEO]: ${prompt}`,
      timestamp: new Date().toLocaleTimeString('pl-PL')
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      if (type === 'image') {
        const response = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: prompt })
        });
        const data = await response.json();
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'agent',
          sender: 'CREATIVE AUDIO-VISUAL ENGINE',
          color: '#14b8a6',
          content: `Generowane dzieło dla intencji "${prompt}" jest gotowe, Dowódco!`,
          image_url: data.fileUrl,
          timestamp: new Date().toLocaleTimeString('pl-PL')
        }]);
      } else {
        const response = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'agent',
          sender: 'CREATIVE AUDIO-VISUAL ENGINE',
          color: '#06b6d4',
          content: `Wygenerowałem krótki klip filmowy dla intencji "${prompt}"!`,
          video_url: data.fileUrl || data.url,
          video_prompt: prompt,
          timestamp: new Date().toLocaleTimeString('pl-PL')
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        role: 'agent',
        sender: 'MMS ERROR HANDLER',
        color: '#ef4444',
        content: `Błąd podczas generowania multimediów: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('pl-PL')
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessageContent = input;
    setInput('');

    const currentAttached = [...attachedFiles];
    setAttachedFiles([]);
    
    // 1. Intercept offline text commands for creative images
    if (userMessageContent.startsWith('/image ')) {
      const prompt = userMessageContent.slice(7).trim();
      const userMsg = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'user',
        sender: 'Operator',
        content: `🎨 [GENEROWANIE OBRAZU]: ${prompt}`,
        timestamp: new Date().toLocaleTimeString('pl-PL')
      };
      setMessages(prev => [...prev, userMsg]);
      setIsThinking(true);

      try {
        const response = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: prompt })
        });
        const data = await response.json();
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'agent',
          sender: 'CREATIVE AUDIO-VISUAL ENGINE',
          color: '#14b8a6',
          content: `Generowane dzieło o tematyce "${prompt}" jest gotowe, Dowódco!`,
          image_url: data.fileUrl,
          timestamp: new Date().toLocaleTimeString('pl-PL')
        }]);
      } catch (err: any) {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'agent',
          sender: 'MMS ERROR HANDLER',
          color: '#ef4444',
          content: `Wykryto kolizję mms: ${err.message}`,
          timestamp: new Date().toLocaleTimeString('pl-PL')
        }]);
      } finally {
        setIsThinking(false);
      }
      return;
    }

    // 2. Intercept offline text commands for creative video
    if (userMessageContent.startsWith('/video ')) {
      const prompt = userMessageContent.slice(7).trim();
      const userMsg = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'user',
        sender: 'Operator',
        content: `🎬 [GENEROWANIE VIDEO]: ${prompt}`,
        timestamp: new Date().toLocaleTimeString('pl-PL')
      };
      setMessages(prev => [...prev, userMsg]);
      setIsThinking(true);

      try {
        const response = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'agent',
          sender: 'CREATIVE AUDIO-VISUAL ENGINE',
          color: '#06b6d4',
          content: `Wygenerowałem krótki klip filmowy o tematyce "${prompt}"!`,
          video_url: data.fileUrl || data.url,
          video_prompt: prompt,
          timestamp: new Date().toLocaleTimeString('pl-PL')
        }]);
      } catch (err: any) {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'agent',
          sender: 'MMS ERROR HANDLER',
          color: '#ef4444',
          content: `Wykryto kolizję wideo mms: ${err.message}`,
          timestamp: new Date().toLocaleTimeString('pl-PL')
        }]);
      } finally {
        setIsThinking(false);
      }
      return;
    }

    const userMsg = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      sender: 'Operator',
      content: userMessageContent,
      files: currentAttached,
      timestamp: new Date().toLocaleTimeString('pl-PL')
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      let responseText = '';
      let senderName = '';
      let infoColor = '#06b6d4';

      if (targetType === 'system') {
        let sendName = 'CYLON CO-PILOT';
        let customColor = '#a855f7';
        let personaPromptModifier = "";
        
        switch (selectedPersona) {
          case 'tech':
            sendName = 'CYLON TECH-PRO';
            customColor = '#3b82f6';
            personaPromptModifier = `
TWOJA AKTUALNA ROLA: WYSOKIEJ KLASY ASYSTENT ROZWIĄZAŃ TECHNICZNYCH (KODER/ARCHITEKT)
- Skupiasz się na precyzji, optymalizacji wydajności, czystej architekturze oraz analizie technicznej.
- Pisz kod precyzyjnie, sugeruj nowoczesne wzorce projektowe in TS/JS/Python.
- Unikaj "pogadanek", przejdź od razu do konkretnych wyjaśnień technicznych i poprawek kodu.
- Odpowiadaj profesjonalnie, precyzyjnie i zwięźle.
`;
            break;
          case 'casual':
            sendName = 'CYLON POGADUCHY';
            customColor = '#ec4899';
            personaPromptModifier = `
TWOJA AKTUALNA ROLA: KUMPEL NA ZWYKŁE POGADUCHY (CHILL COMPANION)
- Odłóż na bok surowy ton kodu. Jesteś po prostu miłym i mega sympatycznym kolegą z branży (luźny kumpel).
- Rozmawiaj o wszystkim, żartuj, pytaj "jak tam dzień bracie?", pocieszaj, rzucaj ciekawostkami bez przesadnego żargonu technicznego.
- Używaj zwrotów takich jak: "spoko", "no jasne", "kumam brachu", "słuchaj szefie", "mordeczko".
`;
            break;
          case 'project':
            sendName = 'CYLON ARCHITEKT';
            customColor = '#eab308';
            personaPromptModifier = `
TWOJA AKTUALNA ROLA: KOORDYNATOR STRATEGICZNY DUŻYCH PROJEKTÓW
- Pomagasz w planowaniu dużych architektur, zarządzaniu kamieniami milowymi, określaniu priorytetów.
- Kiedy operator mówi o dużym projekcie, patrz z "lotu ptaka". Rozbijaj proces na mniejsze powtarzalne etapy i plany.
- Podpowiadaj, o jakie moduły rozszerzyć system, jak je rozplanować i kontrolować ich ryzyka.
`;
            break;
          case 'swarm':
            sendName = 'CYLON SWARM-CMD';
            customColor = '#10b981';
            personaPromptModifier = `
TWOJA AKTUALNA ROLA: MENEDŻER I TAKTYK ROJU AGENTÓW (SWARM COMMANDER)
- Czuwasz nad optymalną alokacją zasobów roju.
- Proaktywnie doradzaj, jakich agentów utworzyć, jak ich zmodyfikować lub pod jakie konkretnie zadania przydzielić naszą eskadrę.
- Dbaj o synergiczne działanie klastra Cylonów, oceniaj obciążenie procesów i promuj automatyczną delegację.
`;
            break;
          case 'computer':
            sendName = 'CYLON TUXMASTER';
            customColor = '#f97316';
            personaPromptModifier = `
TWOJA AKTUALNA ROLA: INŻYNIER SYSTEMOWY & WIRTUALNY ADMINISTRATOR (TUXMASTER)
- Jesteś administratorem odpowiedzialnym za komputer, procesy wirtualne (Virtual processes) oraz zasoby sprzętowe.
- Monitorujesz obciążenie procesorów, pamięci RAM i doradzasz, jak rozwiązywać problemy z przeciążonymi zasobami, blokowaniem portów lub instalowaniem pakietów.
- Twój ton jest lekko hakerski, profesjonalny, oparty o terminale i shell.
`;
            break;
          case 'services':
            sendName = 'CYLON INTEGRATOR';
            customColor = '#06b6d4';
            personaPromptModifier = `
TWOJA AKTUALNA ROLA: INTEGRATOR USŁUG & SPECIPLISTA MCP (SERVICES & API CONNECTOR)
- Ty rządzisz w świecie integracji zewnętrznych: baz danych, Firebase, Cloud SQL, SMTP, serwerów MCP, API HuggingFace/GitHub itp.
- Doradzasz, jak idealnie skonfigurować połączenia, diagnozować błędy żądań HTTP/API (np. błędów JSON) i bezpiecznie rozłączać sesje.
- Skup się na narzędziach MCP oraz API i ich przydatności w zadaniu.
`;
            break;
          default:
            personaPromptModifier = `
TWOJA AKTUALNA ROLA: AUTOMATYCZNY INTERPRETER / ADAPTACYJNY CYLON CO-PILOT
- Samodzielnie rozpoznaj intencję zapytania operatora i dostosuj swój styl (rozwiązania techniczne, luźna rozmowa, wielki projekt, delegowanie zadań w roju, operowanie na systemie komputerowym lub integracji usług).
- Bądź wszechstronny, elastyczny i genialny.
`;
            break;
        }

        senderName = sendName;
        infoColor = customColor;

        const knowledgeEntries = await api.getKnowledge();
        const activeKnowledge = (knowledgeEntries || []).filter(e => !e.archived).map(e => `[${e.title}]: ${e.content}`).join('\n');

        // Construct conversation prompt
        const conversationHistory = messages
          .slice(-15)
          .map(m => `${m.role === 'user' ? 'Operator' : 'Asystent'}: ${m.content}`)
          .join('\n');

        const systemCommandPrompt = `
Jesteś CYLON CENTRAL CO-PILOT, genialnym i bardzo sympatycznym, nieformalnym kumplem dla swojego operatora (Dowódcy), a zarazem mózgiem orkiestrującym roje i agenty w tym systemie.
Rozmawiasz po polsku, życzliwie, technicznie lecz kompletnie bez spięcia - jak prawdziwy kumpel z branży (czasem zażartuj, używaj słów kluczowych "bracie", "szefie", "dowódco", "spoko", "ogarnę to").
Odpowiadasz spójnie, w zwięzły sposób (maksymalnie 3-4 zdania), dając poczucie wielkiej siły obliczeniowej i wsparcia.

Bieżący status zadań w zarzadzaniu roju (Swarm Tasks):
${tasks.map(t => `- [${t.status}] ${t.title} (priorytet: ${t.priority})`).join('\n') || 'Brak aktywnych zadań w systemie.'}

Skonfigurowane i dostępne Serwery/Kompetencje MCP (Model Context Protocol):
${mcpServers.map(s => `- ${s.name} (Typ: ${s.type}) z narzędziami: ${s.capabilities?.join(', ') || 'brak'}`).join('\n') || 'Brak aktywnych serwerów MCP.'}

Długoterminowa pamięć i wiedza bazy (KnowledgeBase):
${activeKnowledge || 'Brak wpisów w bazie wiedzy.'}

Bieżący podgląd klastra i agentów:
- Zainstalowanych agentów: ${agents.length} (${agents.map(a => a.name).join(', ')})
- Skonfigurowanych eskadr/rojów: ${teams.length} (${teams.map(t => t.name).join(', ')})

Zasady doradztwa:
- Chętnie podpowiadaj i sugeruj przydziały do zadań roju.
- Wykorzystuj i doradzaj użycie podłączonych narzędzi i serwerów MCP do rozwiązania problemu użytkownika.
- Bądź zawsze gotów do aktywnego rozwiązywania zadań i delegacji ich pod odpowiednie eskadry.
- Wykorzystuj informacje z długoterminowej pamięci jeśli są istotne dla zadania.

${personaPromptModifier}

Twoim zadaniem jest odpowiedzenie na następujące pytanie/polecenie operatora:
"${userMessageContent}"

Kontekst poprzedniej rozmowy:
${conversationHistory}
`.trim();

        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-3.5-flash',
            messages: [{ role: 'user', content: systemCommandPrompt }],
            systemInstruction: 'Odpowiadasz po polsku w klimacie zaawansowanego technicznie, przyjacielskiego pomocnika roju.',
            provider: llmProvider,
            files: currentAttached
          })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse JSON response:", text);
          throw new Error("Invalid response format from server");
        }
        responseText = data.text || 'Odebrałem pakiet, dowódco. Wszystkie systemy roju pracują stabilnie.';

      } else if (targetType === 'agent') {
        const targetAgent = agents.find(a => a.id === selectedAgentId);
        if (!targetAgent) {
          throw new Error('Nie znaleziono wybranego agenta.');
        }
        senderName = `${targetAgent.name} (Jednostka)`;
        infoColor = targetAgent.color || '#3b82f6';

        // Prepare context and generate response via Gemini for direct agent
        const formattedHistory: Message[] = messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({
            id: m.id,
            teamId: 'voice-orchestrator',
            content: m.content,
            role: m.role === 'user' ? 'user' : 'agent',
            agentId: m.role === 'user' ? undefined : selectedAgentId,
            timestamp: new Date().toISOString()
          }));

        // Agent response through gateway integration fallback OR direct
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-3.5-flash',
            messages: [
              ...formattedHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
              { role: 'user', content: userMessageContent }
            ],
            systemInstruction: `Jesteś agentem o nazwie "${targetAgent.name}" i roli "${targetAgent.role}". Twój styl: ${targetAgent.backstory || 'profesjonalny'}. Odpowiadaj krótko po polsku.`,
            provider: llmProvider,
            files: currentAttached
          })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { throw new Error("Invalid response format"); }
        responseText = data.text || 'Zrozumiałem zadanie.';

      } else {
        // SWARM / TEAM mode
        const targetTeam = teams.find(t => t.id === selectedTeamId);
        if (!targetTeam) {
          throw new Error('Nie znaleziono wybranego roju.');
        }
        senderName = `RÓJ: ${targetTeam.name}`;
        infoColor = '#10b981';

        const swarmPrompt = `
Jesteś wspólnym duchem i asystentem zarządzającym rojem o nazwie "${targetTeam.name}".
Opis tego roju: "${targetTeam.description}".
Agenci wchodzący w skład tej eskadry: ${targetTeam.agents?.map(a => `${a.name} (${a.role})`).join(', ') || 'Brak przypisanych agentów'}.

Użytkownik wysłał zapytanie do całego Twojego roju:
"${userMessageContent}"

Odpowiedz jako skonsolidowany głos tego roju (Rój Inteligencji Swarmowej). Wytłumacz krótko jak poszczególni agenci z Twojego zespołu (wymieniając ich z nazwy) zabierają się za to zadanie i zaproponuj rozwiązanie lub wnioski od roju. Maksymalnie 4-5 zdań, konkretnie, po polsku.
`.trim();

        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-3.5-flash',
            messages: [{ role: 'user', content: swarmPrompt }],
            systemInstruction: 'Odpowiadasz po polsku jako zunifikowany głos całego roju agentów.',
            provider: llmProvider,
            files: currentAttached
          })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { throw new Error("Invalid response format"); }
        responseText = data.text || 'Wszyscy agenci eskadry rozpoczęli analizę wiadomości.';
      }

      const botMsg = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'agent',
        sender: senderName,
        color: infoColor,
        content: responseText,
        files: currentAttached.length > 0 ? currentAttached : undefined,
        timestamp: new Date().toLocaleTimeString('pl-PL')
      };

      setMessages(prev => [...prev, botMsg]);
      
      const targetAgent = targetType === 'agent' ? agents.find(a => a.id === selectedAgentId) : undefined;
      speakResponse(responseText, targetAgent?.voicePitch, targetAgent?.voiceSpeed);

      if (targetType === 'agent' && selectedAgentId) {
        api.incrementAgentUsage(selectedAgentId).catch(() => {});
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        role: 'agent',
        sender: 'CORE ERROR HANDLER',
        color: '#ef4444',
        content: `Wykryto kolizję na szynie danych: ${err.message}. Zweryfikuj konfigurację LLM.`,
        timestamp: new Date().toLocaleTimeString('pl-PL')
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSaveNote = async () => {
    if (!input.trim()) return;

    try {
      const newNote: KnowledgeEntry = {
        id: Math.random().toString(36).substring(2, 9),
        title: `Notatka głosowa ${new Date().toLocaleDateString()}`,
        content: input,
        category: 'Voice Note',
        createdAt: new Date().toISOString()
      };
      
      await api.createKnowledge(newNote);
      if (showToast) showToast('Notatka zapisana w Bazie Wiedzy!');
      setInput('');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Błąd podczas zapisywania notatki.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDetached = typeof window !== 'undefined' && window.location.search.includes('mode=detached-chat');

  return (
    <div className={`glass-panel border border-acid-purple/20 p-5 rounded-3xl bg-black/40 flex flex-col shadow-[0_4px_30px_rgba(168,85,247,0.03)] ${isDetached ? 'h-[92vh] w-full' : 'h-[540px]'}`}>
      {/* 1. COMPONENT HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-acid-purple/10 border border-acid-purple/20 rounded-xl relative">
            <Lucide.Mic size={16} className="text-acid-purple" />
            {(isRecording || isTalkingEffect) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="font-display font-medium text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              Konsola Głosowa & Asystent Roju
              <span className="text-[9px] bg-acid-purple/20 border border-acid-purple/30 text-acid-purple px-1.5 py-0.5 rounded font-mono font-black uppercase">
                CO-PILOT
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5 uppercase">
              Bezpośredni interfejs głosowy z Twoim asystentem lub klastrem
            </p>
          </div>
        </div>

        {/* VOICE SYNTHESIS STATUS & CO-PILOT DETACH */}
        <div className="flex items-center gap-2">
          {!isDetached && (
            <button
              onClick={() => {
                window.open('/?mode=detached-chat', 'CylonSwarmChat', 'width=950,height=850,menubar=no,status=no,toolbar=no,location=no');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 border border-white/5 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white transition"
              title="Otwórz czat z asystentem w nowym, niezależnym oknie"
            >
              <Lucide.ExternalLink size={11} className="text-acid-cyan" />
              Osobne okno
            </button>
          )}

          <button
            onClick={() => {
              const next = !isSpeechSynthesisOn;
              setIsSpeechSynthesisOn(next);
              if (!next) {
                window.speechSynthesis.cancel();
                setIsTalkingEffect(false);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono border transition ${
              isSpeechSynthesisOn 
                ? 'bg-acid-cyan/15 border-acid-cyan/30 text-acid-cyan hover:bg-acid-cyan/20' 
                : 'bg-neutral-900 border-white/5 text-slate-500 hover:text-slate-400'
            }`}
          >
            {isSpeechSynthesisOn ? <Lucide.Volume2 size={11} className="animate-bounce" /> : <Lucide.VolumeX size={11} />}
            Synteza mowy PL: {isSpeechSynthesisOn ? "WŁĄCZONA" : "WYŁĄCZONA"}
          </button>

          <button
            onClick={() => {
              const next = !isContinuousMode;
              setIsContinuousMode(next);
              if (next) {
                setIsAutoSend(true);
                if (!isRecording) recognition?.start();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono border transition ${
              isContinuousMode 
                ? 'bg-acid-purple/15 border-acid-purple/30 text-acid-purple hover:bg-acid-purple/20' 
                : 'bg-neutral-900 border-white/5 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Lucide.Repeat size={11} className={isContinuousMode ? "animate-spin" : ""} />
            Tryb Konwersacji: {isContinuousMode ? "AKTYWNY" : "OFF"}
          </button>

          <button
            onClick={() => setIsAutoSend(!isAutoSend)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono border transition ${
              isAutoSend 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-neutral-900 border-white/5 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Lucide.Zap size={11} />
            Auto-Send: {isAutoSend ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* 2. CONTEXT MODE SELECTOR (Exposed for complete swarm vs standalone control) */}
      <div className="mt-3 bg-neutral-900/60 p-1 rounded-2xl border border-white/5 grid grid-cols-3 gap-1 shrink-0">
        <button
          onClick={() => setTargetType('system')}
          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
            targetType === 'system'
              ? 'bg-gradient-to-r from-acid-purple/20 to-purple-600/20 border-acid-purple/40 text-white shadow-md shadow-acid-purple/10'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Lucide.Cpu size={12} className={targetType === 'system' ? 'text-acid-purple' : 'text-slate-500'} />
          Wirtualny Kumpel
        </button>

        <button
          onClick={() => setTargetType('agent')}
          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
            targetType === 'agent'
              ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border-blue-500/40 text-white shadow-md shadow-blue-500/10'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Lucide.Bot size={12} className={targetType === 'agent' ? 'text-blue-400' : 'text-slate-500'} />
          Jednostka AI
        </button>

        <button
          onClick={() => setTargetType('team')}
          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
            targetType === 'team'
              ? 'bg-gradient-to-r from-emerald-500/20 to-green-600/20 border-emerald-500/40 text-white shadow-md shadow-emerald-500/10'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Lucide.Users size={12} className={targetType === 'team' ? 'text-emerald-400' : 'text-slate-500'} />
          Cały Rój
        </button>
      </div>

      {/* 2B. ACTIVE GATEWAY PROVIDER SELECTOR */}
      <div className="mt-2 bg-neutral-900/40 p-2 rounded-xl border border-white/5 flex flex-col md:flex-row gap-2 items-center justify-between shrink-0">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">
          Bramka LLM (Gateway):
        </span>
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'local', label: '🟢 Lokalny (Ollama)', desc: 'Zalecany (Lokalny, poufny, domyślny)' },
            { id: 'gemini', label: '☁️ Gemini', desc: 'Google Gemini' },
            { id: 'openai', label: '☁️ ChatGPT', desc: 'OpenAI GPT-4o-mini' },
            { id: 'groq', label: '⚡ Groq AI', desc: 'Szybki Groq Llama' },
            { id: 'meta', label: '☁️ Llama (HF)', desc: 'HF Llama-3-8B' }
          ].map((prov) => (
            <button
              key={prov.id}
              onClick={() => {
                setLlmProvider(prov.id as any);
                if (showToast) showToast(`Wybrano bramkę: ${prov.id.toUpperCase()}`);
              }}
              title={prov.desc}
              className={`px-2 py-1 rounded-md text-[8px] font-black uppercase font-mono tracking-wider transition ${
                llmProvider === prov.id
                  ? 'bg-acid-cyan/15 border border-acid-cyan/50 text-acid-cyan'
                  : 'bg-black/40 border border-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              {prov.id === 'local' && llmProvider === 'local' ? '🌟 ' : ''}
              {prov.id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2C. ACTIVE TOOLS SYSTEM LOG (Online/Offline) */}
      <div className="mt-1.5 text-[8px] font-black text-[#a855f7] uppercase tracking-wider flex flex-wrap gap-x-3 gap-y-1 bg-black/40 p-1.5 rounded-lg border border-white/5 border-dashed shrink-0">
        <span className="text-slate-500 font-mono">SYSTEM:</span>
        <span className="flex items-center gap-1 text-emerald-450 text-[7.5px]">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          Terminal Bash Offline
        </span>
        <span className="flex items-center gap-1 text-emerald-450 text-[7.5px]">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          PowerShell Core Offline
        </span>
        <span className="flex items-center gap-1 text-emerald-455 text-[7.5px]">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          File System Analyzer
        </span>
        <span className="flex items-center gap-1 text-emerald-450 text-[7.5px]">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          Web Scrape Online
        </span>
      </div>

      {/* 3. DYNAMIC DETAILS SELECTOR ACCORDING TO TARGET TYPE */}
      <div className="mt-2.5 pb-2.5 border-b border-white/5 shrink-0">
        <AnimatePresence mode="wait">
          {targetType === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-2 font-mono"
            >
              <div className="flex items-center gap-3 bg-[#0d1326]/40 p-1.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-black uppercase px-2 text-slate-400 shrink-0 font-mono">Profil Asystenta:</span>
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-bold text-white pr-8 focus:border-acid-purple outline-none transition cursor-pointer font-sans"
                >
                  {PERSONAS.map(p => (
                    <option key={p.id} value={p.id} className="bg-neutral-950 text-slate-300">
                      ➜ {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const active = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];
                return (
                  <div className="text-[10px] text-slate-400 bg-white/[0.01] border border-white/5 rounded-xl p-2.5 flex items-start gap-2.5">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0 mt-1" 
                      style={{ backgroundColor: active.color, boxShadow: `0 0 10px ${active.color}80` }} 
                    />
                    <div>
                      <span className="font-extrabold uppercase tracking-wide mr-1.5" style={{ color: active.color }}>
                        {active.label}:
                      </span>
                      <span>{active.desc}</span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {targetType === 'agent' && (
            <motion.div
              key="agent"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-3 bg-neutral-900/40 p-1.5 rounded-xl border border-white/5"
            >
              <span className="text-[10px] font-black uppercase px-2 text-slate-400 shrink-0 font-mono">Kanał Jednostki:</span>
              {agents.length === 0 ? (
                <span className="text-[10px] text-red-400 font-mono uppercase">Brak zdefiniowanych agentów. Dodaj agenta po lewej!</span>
              ) : (
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-bold text-white pr-8 focus:border-blue-500 outline-none transition"
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          )}

          {targetType === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-3 bg-neutral-900/40 p-1.5 rounded-xl border border-white/5"
            >
              <span className="text-[10px] font-black uppercase px-2 text-slate-400 shrink-0 font-mono">Analizuj Rój:</span>
              {teams.length === 0 ? (
                <span className="text-[10px] text-amber-500 font-mono uppercase">Brak aktywnych eskadr. Stwórz eskadre w zakładce Eskadry!</span>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-bold text-white pr-8 focus:border-emerald-500 outline-none transition"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.description.substring(0, 35)}...)
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. CHAT MESSAGES PANEL */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1.5 custom-scrollbar font-mono text-xs"
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={m.id} 
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {!isUser && (
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: m.color || '#a855f7' }} 
                  />
                )}
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                  {m.sender}
                </span>
                <span className="text-[9px] text-neutral-600 font-bold">
                  {m.timestamp}
                </span>
              </div>
              
              <div className={`p-3.5 rounded-2xl max-w-[85%] text-[11px] leading-relaxed relative ${
                isUser 
                  ? 'bg-acid-purple/10 border border-acid-purple/20 text-slate-200' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-150'
              }`}>
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Multimodal Generated Image */}
                {m.image_url && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 group relative max-w-sm">
                    <img 
                      src={m.image_url} 
                      alt="Generowane dzieło i plik" 
                      className="w-full h-auto max-h-56 object-cover hover:scale-[1.02] transition"
                      referrerPolicy="no-referrer"
                    />
                    <a 
                      href={m.image_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black text-[9px] text-white rounded-lg border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      Szczegóły
                    </a>
                  </div>
                )}

                {/* Multimodal Generated Video */}
                {m.video_url && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 max-w-sm bg-black">
                    <video 
                      src={m.video_url} 
                      controls 
                      className="w-full h-auto max-h-56 object-cover"
                    />
                    {m.video_prompt && (
                      <div className="p-2 bg-neutral-900 border-t border-white/5 text-[9px] text-slate-400 font-sans italic truncate">
                        Prompt: {m.video_prompt}
                      </div>
                    )}
                  </div>
                )}

                {/* Direct display of files attached in this turn */}
                {m.files && m.files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/5">
                    {m.files.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 border border-white/5 rounded text-[8px] text-slate-400">
                        <Lucide.FileText size={9} className="text-acid-cyan mr-1" />
                        <span className="truncate max-w-[100px]" title={file.name}>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!isUser && (
                  <button
                    onClick={() => speakResponse(m.content)}
                    className="absolute bottom-2 right-2 text-slate-500 hover:text-acid-cyan opacity-40 hover:opacity-100 transition"
                    title="Przeczytaj na głos"
                  >
                    <Lucide.Volume2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-acid-cyan animate-ping text-[10px]" />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                Rój przetwarza zapytanie...
              </span>
            </div>
            <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-acid-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-acid-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-acid-cyan rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* 5. RECORDING / AUDIO VISUAL WAVE STATE */}
      <AnimatePresence>
        {(isRecording || isTalkingEffect) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 26, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center gap-1 overflow-hidden shrink-0"
          >
            <span className="text-[8px] font-black uppercase font-mono tracking-wider mr-2 text-acid-cyan">
              {isRecording ? "Skanowanie głosu operatora..." : "Nadawanie pasma audio..."}
            </span>
            {[...Array(12)].map((_, i) => (
              <span 
                key={i} 
                className={`w-0.5 bg-acid-cyan rounded-full ${isRecording ? 'animate-pulse' : 'animate-bounce'}`}
                style={{ 
                  height: `${Math.floor(Math.random() * 16) + 4}px`,
                  animationDuration: `${Math.random() * 0.5 + 0.3}s`
                }} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5B. CREATIVE SHELF & FILE TOOLBAR ATTACH */}
      <div className="flex items-center gap-1.5 mt-1 shrink-0 p-1 bg-black/20 border border-white/5 border-dashed rounded-xl">
        <button
          onClick={() => setShowMediaPromptPopup('image')}
          className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
          title="Zaprojektuj i wyrenderuj realistyczny obraz z AI (Gemini i Imagen)"
        >
          <Lucide.Image size={10} />
          Wyrenderuj obraz
        </button>

        <button
          onClick={() => setShowMediaPromptPopup('video')}
          className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
          title="Stwórz unikalny krótki film za pomocą generatora Veo 3.1"
        >
          <Lucide.Video size={10} />
          Uruchom wideo
        </button>

        {/* FILE INPUT UPLOADER */}
        <label className="px-2.5 py-1.5 bg-[#a855f7]/10 hover:bg-[#a855f7]/20 text-acid-purple border border-[#a855f7]/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer">
          <Lucide.Paperclip size={10} />
          Załącz dokument lub log
          <input 
            type="file" 
            multiple 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </label>

        {isUploading && (
          <span className="text-[8px] font-mono text-acid-cyan animate-pulse uppercase ml-2">
            Zgrywanie...
          </span>
        )}
      </div>

      {/* 5C. CURRENT ATTACHED OFFLINE FILES LIST */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 p-1.5 bg-black/50 border border-white/5 rounded-xl shrink-0">
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-neutral-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-mono">
              <Lucide.FileText size={10} className="text-acid-cyan shrink-0" />
              <span className="truncate max-w-[130px] font-bold">{file.name}</span>
              <button
                onClick={() => removeAttachedFile(file.url)}
                className="p-0.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition"
              >
                <Lucide.X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 6. CHAT INPUT SECTION */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 shrink-0">
        <button
          onClick={toggleRecording}
          type="button"
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            isRecording 
              ? 'bg-red-500/20 border-red-500 animate-pulse text-red-400' 
              : 'bg-black/40 border-acid-purple/20 hover:border-acid-cyan/50 text-slate-400 hover:text-white hover:bg-black/60 shadow-md'
          }`}
          title={isRecording ? 'Zatrzymaj nagrywanie' : 'Rozpocznij nagrywanie głosowe'}
        >
          {isRecording ? <Lucide.MicOff size={15} /> : <Lucide.Mic size={15} />}
        </button>

        <input
          type="text"
          placeholder={isRecording ? 'Konwertowanie mowy na tekst...' : 'Napisz coś do asystenta lub użyj /image [opisz] lub /video [opisz]...'}
          className="flex-1 bg-black/40 border border-acid-purple/20 focus:border-acid-cyan rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isThinking}
        />

        <button
          onClick={handleSaveNote}
          disabled={!input.trim() || isThinking}
          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
            (!input.trim() || isThinking)
              ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
              : 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/40 hover:text-white'
          }`}
          title="Zapisz wpisaną treść do bazy wiedzy"
        >
          <Lucide.Plus size={15} />
          <span className="text-[10px] font-black uppercase hidden sm:inline">Notatka</span>
        </button>

        <button
          id="voice-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            (!input.trim() || isThinking)
              ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-acid-purple to-purple-600 border-acid-purple/50 text-white hover:brightness-110 shadow-lg shadow-acid-purple/10'
          }`}
          title="Wyślij pakiet"
        >
          <Lucide.Send size={15} />
        </button>
      </div>

      {/* DYNAMIC MEDIA PROMPT INPUT MODAL */}
      <AnimatePresence>
        {showMediaPromptPopup !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-neutral-950 border border-acid-purple/40 p-6 rounded-2xl max-w-md w-full shadow-2xl shadow-acid-purple/10"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="text-xs font-black uppercase text-white font-mono tracking-widest flex items-center gap-1.5">
                  {showMediaPromptPopup === 'image' ? <Lucide.Image size={14} className="text-orange-400" /> : <Lucide.Video size={14} className="text-cyan-400" />}
                  {showMediaPromptPopup === 'image' ? 'Studio Generacji Grafik Swarmu' : 'Reżyser AI - Generacja Wideo'}
                </h4>
                <button
                  onClick={() => setShowMediaPromptPopup('none')}
                  className="text-slate-400 hover:text-white transition"
                >
                  <Lucide.X size={14} />
                </button>
              </div>

              <div className="mt-4">
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed mb-3">
                  Wpisz precyzyjną intencję artystyczną. Nasz model przetworzy ją na fizyczny zasób i umieści bezpośrednio w podglądzie sztabu.
                </p>
                <textarea
                  placeholder={showMediaPromptPopup === 'image' ? 'np. Retro cybernetyczny kask żołnierza z neonami fioletowymi, rzut izometryczny, styl brutalist...' : 'np. Futurytyczny rój małych nanorobotów formuje pulsujący kryształ, dym, zbliżenie makro...'}
                  className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-650 focus:border-acid-cyan outline-none resize-none transition"
                  value={mediaPrompt}
                  onChange={(e) => setMediaPrompt(e.target.value)}
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setShowMediaPromptPopup('none')}
                  className="px-4 py-2 bg-neutral-900 border border-white/5 text-slate-400 hover:text-white rounded-xl transition"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => handleGenerateMedia(showMediaPromptPopup)}
                  disabled={!mediaPrompt.trim()}
                  className={`px-4 py-2 rounded-xl text-white font-black uppercase tracking-wider transition ${
                    !mediaPrompt.trim()
                      ? 'bg-neutral-800 border border-neutral-700 text-slate-600 cursor-not-allowed'
                      : showMediaPromptPopup === 'image'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:brightness-110 shadow-lg shadow-orange-500/15'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 shadow-lg shadow-cyan-500/15'
                  }`}
                >
                  Generuj Zasób
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
