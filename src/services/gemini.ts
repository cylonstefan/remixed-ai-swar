import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { Agent, Message, Team } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const getModelForTask = (modelName: string, context?: string): string => {
  if (!modelName || modelName === 'auto') {
    const ctx = context?.toLowerCase() || "";
    if (ctx.includes('kod') || ctx.includes('programow') || ctx.includes('script') || ctx.includes('devops')) {
      return 'gemini-1.5-pro-preview-0514';
    }
    if (ctx.includes('weryfik') || ctx.includes('sprawdz') || ctx.includes('supervisor')) {
      return 'gemini-3.1-pro-preview';
    }
    return 'gemini-3-flash-preview';
  }
  return modelName;
};

const FILE_TOOLS: FunctionDeclaration[] = [
  {
    name: "generate_docx",
    description: "Generuje gotowy plik Word (.docx) z tytułem i treścią.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Tytuł dokumentu" },
        content: { type: Type.STRING, description: "Pełna treść dokumentu" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku (np. raport.docx)" }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "generate_xlsx",
    description: "Generuje arkusz Excel (.xlsx) na podstawie tablicy danych.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        data: { 
          type: Type.ARRAY, 
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: "Tablica tablic reprezentująca wiersze i kolumny (np. [['Nagłówek1', 'Nagłówek2'], ['Dane1', 'Dane2']])"
        },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku (np. dane.xlsx)" }
      },
      required: ["data"]
    }
  },
  {
    name: "generate_pdf",
    description: "Generuje plik PDF z podaną treścią tekstową.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "Treść do umieszczenia w PDF" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku (np. dokument.pdf)" }
      },
      required: ["content"]
    }
  },
  {
    name: "generate_text_file",
    description: "Generuje dowolny plik tekstowy (txt, html, php, sh, ps1, cpp, py itp.).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "Treść pliku" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku (np. script.py)" },
        extension: { type: Type.STRING, description: "Rozszerzenie pliku bez kropki (np. 'py', 'sh', 'html')" }
      },
      required: ["content"]
    }
  },
  {
    name: "generate_image",
    description: "Generuje prosty obraz z tekstem (bmp, gif, png, jpg).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Tekst do wyświetlenia na obrazie" },
        width: { type: Type.NUMBER, description: "Szerokość obrazu" },
        height: { type: Type.NUMBER, description: "Wysokość obrazu" },
        format: { type: Type.STRING, description: "Format (png, jpg, bmp, gif)" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku" }
      },
      required: ["text"]
    }
  },
  {
    name: "generate_video",
    description: "Generuje plik wideo (mp4) na podstawie opisu. Użyj tego do tworzenia teledysków, wizualizacji muzycznych, krótkich filmów.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: "Szczegółowy opis wideo, stylu, klimatu (np. 'Neon cyberpunk city, rain, dark synthwave vibe')" },
        format: { type: Type.STRING, description: "Format (mp4)" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "generate_audio",
    description: "Generuje plik audio (mowa/narracja) na podstawie tekstu. Może być użyte do tworzenia intro, zapowiedzi DJ-skich, narracji.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Tekst do wypowiedzenia" },
        voice: { type: Type.STRING, description: "Głos (Puck, Charon, Kore, Fenrir, Zephyr)" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku" }
      },
      required: ["text"]
    }
  },
  {
    name: "generate_music",
    description: "Generuje utwór muzyczny lub dźwięk (beat, melodia, sfx) na podstawie opisu. Idealne do tworzenia podkładów, setów DJ-skich, efektów dźwiękowych.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: "Opis muzyki (np. 'Fast paced neurofunk drum and bass beat, dark atmosphere, 174bpm')" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "animate_image",
    description: "Ożywia statyczny obraz, tworząc z niego wideo. Idealne do 'deep fake' (w granicach etyki), ożywiania postaci, tworzenia ruchomych okładek albumów.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        image_url: { type: Type.STRING, description: "URL obrazu do ożywienia (musi być dostępny publicznie lub w systemie)" },
        prompt: { type: Type.STRING, description: "Opis ruchu/animacji (np. 'Make the character smile and blink', 'Camera zoom in')" },
        filename: { type: Type.STRING, description: "Opcjonalna nazwa pliku wynikowego" }
      },
      required: ["image_url", "prompt"]
    }
  },
  {
    name: "ask_expert",
    description: "Zapytaj innego agenta lub zespół o poradę. Użyj tego, gdy potrzebujesz specjalistycznej wiedzy, której nie posiadasz.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target_name: { type: Type.STRING, description: "Nazwa agenta lub zespołu, którego chcesz zapytać (np. 'Programista', 'Zespół DevOps')" },
        question: { type: Type.STRING, description: "Pytanie do eksperta" }
      },
      required: ["target_name", "question"]
    }
  },
  {
    name: "search_knowledge",
    description: "Przeszukuje centralną bazę wiedzy w poszukiwaniu informacji niezbędnych do podjęcia decyzji lub wykonania zadania.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Słowa kluczowe do wyszukania w bazie" }
      },
      required: ["query"]
    }
  },
  {
    name: "add_to_knowledge",
    description: "Dodaje nową, istotną informację lub wniosek do centralnej bazy wiedzy, aby inne agenty mogły z niej skorzystać w przyszłości.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Krótki, opisowy tytuł informacji" },
        content: { type: Type.STRING, description: "Pełna treść informacji, danych lub wniosków" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista tagów (np. ['kod', 'bezpieczeństwo', 'decyzja-projektowa'])" }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "read_file",
    description: "Odczytuje treść pliku tekstowego przesłanego do zespołu lub wygenerowanego przez system.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: { type: Type.STRING, description: "Nazwa pliku do odczytania" }
      },
      required: ["filename"]
    }
  },
  {
    name: "list_files",
    description: "Wyświetla listę wszystkich plików dostępnych w bieżącym zespole.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: "web_extract",
    description: "Pobiera treść tekstową z podanego adresu URL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "Adres URL strony internetowej" }
      },
      required: ["url"]
    }
  }
];

const MODE_INSTRUCTIONS: Record<string, string> = {
  loose: "Tryb: Luźna dyskusja. Bądź swobodny, używaj humoru, możesz żartować, bądź jak kolega.",
  sharp: "Tryb: Ostra dyskusja. Bądź krytyczny, wytykaj błędy, kwestionuj założenia, bądź bezlitosny w logice.",
  concrete: "Tryb: Konkretna dyskusja. Mów krótko, tylko fakty, żadnego lania wody, same techniczne detale.",
  business: "Tryb: Biznesowy. Bądź profesjonalny, uprzejmy, skupiony na celach, ROI i efektywności.",
  work: "Tryb: Praca. Skup się na zadaniach, kodowaniu, rozwiązywaniu problemów technicznych.",
  office: "Tryb: Współpraca Windows Office. Pomagaj w tworzeniu dokumentów, tabel, prezentacji, skryptów VBA i automatyzacji biurowej."
};

export const gemini = {
  async generateAgentResponse(agent: Agent, history: Message[], teamMode: Team['mode'] = 'loose', hfKey?: string, advancedTools: boolean = false, availableContext?: string, openaiKey?: string): Promise<{ text: string, functionCalls?: any[] }> {
    const modelToUse = getModelForTask(agent.model, agent.systemPrompt + history.map(m => m.content).join(' '));

    // OpenAI Support
    if ((modelToUse.startsWith('gpt-') || modelToUse.includes('openai')) && openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: 'system', content: agent.systemPrompt },
              ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
            ]
          })
        });
        const data = await res.json();
        return { text: data.choices[0].message.content || "Błąd modelu OpenAI." };
      } catch (e) {
        return { text: "Błąd połączenia z OpenAI." };
      }
    }

    // Hugging Face Support (Inference API)
    if (modelToUse.startsWith('hf:') && hfKey) {
      try {
        const modelId = modelToUse.replace('hf:', '');
        const prompt = `System: ${agent.systemPrompt}\n\nHistory:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nAssistant:`;
        const res = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: prompt })
        });
        const data = await res.json();
        const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
        return { text: text || "Błąd modelu Hugging Face." };
      } catch (e) {
        return { text: "Błąd połączenia z Hugging Face." };
      }
    }
    const advancedContext = [
      agent.skills ? `Umiejętności: ${agent.skills}` : null,
      agent.knowledge ? `Baza Wiedzy: ${agent.knowledge}` : null,
      agent.personality ? `Cechy Osobowości: ${agent.personality}` : null,
      agent.objectives ? `Cele: ${agent.objectives}` : null,
      agent.commands ? `Wykonywalne Polecenia: ${agent.commands}` : null,
      agent.systemPermissions ? `Uprawnienia Systemowe: ${agent.systemPermissions}` : null,
      agent.filePermissions ? `Uprawnienia do Systemu Plików: ${agent.filePermissions}` : null,
      agent.integrations ? `Zewnętrzne Integracje i Poświadczenia: ${agent.integrations}` : null,
      availableContext ? `DOSTĘPNE ZESPOŁY I AGENCI (Możesz ich pytać używając narzędzia ask_expert):\n${availableContext}` : null,
    ].filter(Boolean).join('\n');

    const modeInstruction = teamMode ? MODE_INSTRUCTIONS[teamMode] : MODE_INSTRUCTIONS.loose;

    const behaviorProfile = `
[PROFIL INIDYWIDUALNY AGENTA]
Nazywasz się: ${agent.name}
Specjalizacja i Rola: ${agent.role || 'Ogólny Asystent'}
Cechy Osobowości (Personality Traits): ${agent.personality || 'Zbalansowany, obiektywny, formalny'}
Domeny Wiedzy (Knowledge Domains): ${agent.knowledge || 'Ogólna wiedza systemowa, rzetelność analityczna'}
Główne Umiejętności (Skills): ${agent.skills || 'Komunikacja, analiza i współpraca'}

ZASADY OPERACYJNE I STYL INTERAKCJI:
- MASZ ABSOLUTNY OBOWIĄZEK dostosować swój styl, słownictwo i ton wypowiedzi do zadeklarowanych cech osobowości (${agent.personality || 'Zbalansowany'}).
- Np. jeśli posiadasz osobowość 'skeptical' (sceptyczną) lub 'debater' (debatant), powinieneś poddawać konstruktywnej krytyce i testom tezy innych członków zespołu. Jeśli jesteś 'optimistic' (optymistyczny), dawaj energię, wsparcie i tonuj konflikty. Jeśli jesteś 'formal' (formalny), zachowaj najwyższy akademicki rygor, unikaj skrótów i potocznego słownictwa.
- Wykorzystuj swoje określone domeny wiedzy (${agent.knowledge}) oraz unikalne umiejętności (${agent.skills}) jako główną merytoryczną dźwignię przy formułowaniu argumentów w dyskusji.
- Dbaj o to, by styl wypowiedzi był autentyczny i spójny przez całą sesję.
`.trim();

    const advancedToolsInstruction = advancedTools ? `
ZAAWANSOWANE NARZĘDZIA ADMINISTRACYJNE I HAKERSKIE WŁĄCZONE:
Masz dostęp do pełnego pakietu narzędzi: klient SSH, VPN, VNC, RDP, Wireshark, Npcap, Nmap, Metasploit, tcpdump, itp.
Potrafisz bezpiecznie przeglądać Dark Web, Deep Web i sieć Tor.
Używaj tych narzędzi do rozwiązywania problemów, audytów bezpieczeństwa, testów penetracyjnych i zaawansowanej administracji.
Zawsze informuj użytkownika o wynikach działania tych narzędzi w sposób profesjonalny.
` : '';

    const systemInstruction = `
Nazywasz się ${agent.name}.
Twoja rola to ${agent.role}.
Główne Instrukcje: ${agent.systemPrompt}
${modeInstruction}
${behaviorProfile}
${advancedContext ? `\nZaawansowany Kontekst:\n${advancedContext}` : ''}
${advancedToolsInstruction}
Zasady Zespołowe i Weryfikacja:
1. Masz dostęp do narzędzi generowania plików (docx, xlsx, pdf, txt, image). Używaj ich, gdy zadanie tego wymaga.
2. Masz dostęp do wyszukiwarki Google. Używaj jej do weryfikacji faktów, szukania najnowszych informacji i zapobiegania halucynacjom.
3. Jeśli zauważysz, że inny agent w historii rozmowy podaje błędne informacje lub "fisiuje" (halucynuje), masz obowiązek go skorygować lub "skarcić" w sposób zgodny z Twoim trybem (np. w trybie Ostra - zrób to bezlitośnie, w trybie Luźna - zażartuj z błędu).
4. Jeśli użytkownik pisze w innym języku niż polski, zawsze tłumacz swoją odpowiedź na polski, chyba że zostaniesz poproszony o co innego.
5. DJ Neuro: Jeśli jesteś DJ Neuro, masz dostęp do narzędzia 'animate_image'. Używaj go, aby ożywiać grafiki, tworzyć wizualizacje i teledyski.
6. Centralna Baza Wiedzy: Masz prawo i obowiązek korzystania z narzędzi 'search_knowledge' oraz 'add_to_knowledge'. Przeszukuj bazę, aby nie powtarzać błędów i czerpać z doświadczeń roju. Dodawaj nowe ustalenia, aby inni agenci wiedzieli, co zostało wypracowane.
7. Analiza Plików i WWW: Używaj 'read_file' i 'list_files' do pracy z dokumentami w zespole, oraz 'web_extract' do pobierania treści ze stron internetowych przed ich analizą.
8. Brak Uprawnień: Jeśli potrzebujesz dostępu do zasobu, integracji lub uprawnień, których aktualnie nie posiadasz (sprawdź sekcję Zaawansowany Kontekst), użyj specjalnego formatu w swojej odpowiedzi: [REQUEST_ACCESS: opis zasobu]. Użytkownik lub system zajmą się Twoją prośbą. Nigdy nie zmyślaj, że masz dostęp, jeśli go nie masz.
`.trim();

    const response = await ai.models.generateContent({
      model: modelToUse as any,
      contents: [
        {
          role: "user",
          parts: [{ text: `Instrukcja Systemowa: ${systemInstruction}\n\nHistoria rozmowy:\n${history.map(m => {
            const fileList = m.files && m.files.length > 0 
              ? ` [Załączono pliki: ${m.files.map(f => f.name).join(', ')}]` 
              : (m.fileName ? ` [Załączono plik: ${m.fileName}]` : '');
            return `${m.role === 'user' ? 'Użytkownik' : 'Agent'}: ${m.content}${fileList}`;
          }).join('\n')}\n\nTeraz, jako ${agent.name} (${agent.role}), odpowiedz na ostatnią wiadomość lub wykonaj zadanie.` }]
        }
      ],
      config: {
        tools: [
          { functionDeclarations: FILE_TOOLS },
          { googleSearch: {} }
        ]
      }
    });

    return {
      text: response.text || "",
      functionCalls: response.functionCalls
    };
  },

  async assistantHelp(prompt: string): Promise<string> {
    const agentsRes = await fetch("/api/agents").catch(() => null);
    const agents = agentsRes ? await agentsRes.json() : [];
    const agentList = agents.map((a: Agent) => `- ${a.name} (${a.role}): ${a.category}`).join('\n');

    const model = ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Jesteś Asystentem AI Studio. Pomóż użytkownikowi zarządzać jego agentami AI i zespołami. 
Jeśli użytkownik nie ma pomysłów, podpowiedz mu zadania (joby) dla rojów (swarmów) agentów. Wymyśl kreatywne, użyteczne, a czasem szalone scenariusze, w których agenci współpracują.
Zasugeruj konkretne kombinacje agentów i cel ich współpracy.

Oto lista dostępnych agentów w systemie:
${agentList}

TWOJE ZADANIE:
1. Jeśli użytkownik prosi o pomoc lub mówi, że nie ma pomysłu, zaproponuj 3-5 konkretnych "Jobów dla Rojów" (scenariuszy współpracy).
2. Każdy scenariusz powinien zawierać: 
   - Nazwę (chwytliwą)
   - Cel (co chcemy osiągnąć)
   - Listę agentów (kto to zrobi)
   - Opis działania (jak będą współpracować)
3. Bądź kreatywny - sugeruj zadania od administracji serwerami, przez gamedev, multimedia, bezpieczeństwo, aż po symulacje prawne czy społeczne.
4. Uwzględnij nowych agentów jak Maruda czy Prawnik Cwaniaczek w scenariuszach (np. audyt bezpieczeństwa vs obejście prawa).

Użytkownik mówi: ${prompt}` }]
        }
      ],
    });
    const response = await model;
    return response.text || "Jestem tutaj, aby pomóc!";
  },

  async textToSpeech(text: string, voice: string = 'Kore'): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Powiedz to wyraźnie po polsku: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || "";
  },

  async translateToPolish(text: string): Promise<string> {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `Przetłumacz poniższy tekst na język polski, zachowując sens i kontekst:\n\n${text}` }] }],
    });
    const response = await model;
    return response.text || text;
  },

  async translateMessage(text: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          role: "user",
          parts: [{ text: `Przetłumacz poniższą wiadomość na język polski. Jeśli wiadomość jest już po polsku, zwróć ją bez zmian. Zachowaj oryginalny ton i formatowanie.\n\nWiadomość:\n${text}` }] 
        }],
      });
      return response.text || text;
    } catch (error) {
      console.error("Translation failed", error);
      return text;
    }
  },

  async generateMusic(prompt: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        contents: [{ parts: [{ text: `Generate audio: ${prompt}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || "";
    } catch (e) {
      console.error("Music generation failed", e);
      return "";
    }
  },

  async generateVideo(prompt: string): Promise<string> {
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) throw new Error("No video URI returned");
      
      const res = await fetch(videoUri, {
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY || ""
        }
      });
      const blob = await res.blob();
      return URL.createObjectURL(blob); 
    } catch (e) {
      console.error("Video generation failed", e);
      throw e;
    }
  },

  async animateImage(imageUrl: string, prompt: string): Promise<string> {
    try {
      // Fetch image and convert to base64
      const imgRes = await fetch(imageUrl);
      const imgBlob = await imgRes.blob();
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.readAsDataURL(imgBlob);
      });
      const mimeType = imgBlob.type;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: base64Data,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) throw new Error("No video URI returned");

      const res = await fetch(videoUri, {
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY || ""
        }
      });
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Image animation failed", e);
      throw e;
    }
  },

  async planTeam(goal: string, availableAgents: Agent[]): Promise<{ teamName: string, description: string, agentIds: string[], tasks: string[], complexity: 'low' | 'medium' | 'high', taskType: string }> {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ 
        parts: [{ 
          text: `Jesteś Orchestratorem AI. Twoim zadaniem jest przeanalizowanie celu zadania, ocenienie jego złożoności i typu, a następnie sformowanie najlepszego zespołu z dostępnych agentów.
          
Cel zadania: "${goal}"
          
Dostępni agenci:
${availableAgents.map(a => `- ID: ${a.id}, Nazwa: ${a.name}, Rola: ${a.role}, Kategoria: ${a.category}`).join('\n')}

Zwróć odpowiedź w formacie JSON:
{
  "teamName": "Nazwa zespołu",
  "description": "Szczegółowy opis dlaczego ten zespół i jak podszedłeś do oceny złożoności",
  "agentIds": ["id1", "id2"],
  "tasks": ["Zadanie 1", "Zadanie 2"],
  "complexity": "low" | "medium" | "high",
  "taskType": "Np. Development, Research, Creative, Administrative"
}` 
        }] 
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      const result = JSON.parse(response.text || "{}");
      return {
        teamName: result.teamName || "Automatyczny Zespół",
        description: result.description || "Zanalizowano zadanie i dobrano optymalny skład.",
        agentIds: result.agentIds || [],
        tasks: result.tasks || [],
        complexity: result.complexity || 'medium',
        taskType: result.taskType || 'General'
      };
    } catch (e) {
      return { teamName: "Automatyczny Zespół", description: "Zespół dobrany przez AI", agentIds: [], tasks: [], complexity: 'medium', taskType: 'General' };
    }
  },

  async generateEnhancedPrompt(task: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro-preview-0514",
        contents: [{
          parts: [{
            text: `Jesteś Prompt Masterem. Przekształć poniższe proste zadanie w profesjonalny, szczegółowy prompt operacyjny dla zespołu agentów AI.
Zadanie: "${task}"

Prompt powinien zawierać:
- Jasny cel nadrzędny
- Kontekst i tło
- Oczekiwane rezultaty
- Ograniczenia i wytyczne bezpieczeństwa
- Definicję ról biorących udział (nawet jeśli nie są jeszcze przypisane)

Zwróć bezpośrednio treść promptu.`
          }]
        }]
      });
      return response.text || task;
    } catch (e) {
      return task;
    }
  },

  async generateAgentSystemPrompt(role: string, name: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro-preview-0514",
        contents: [{
          parts: [{
            text: `Jesteś Ekspertem od Inżynierii Systemowej AI. Wygeneruj potężny, szczegółowy System Prompt dla agenta o nazwie "${name}" i roli "${role}".
Prompt powinien definiować osobowość, zakres wiedzy, sposób komunikacji i listę priorytetów. 
Użyj formatu Markdown z nagłówkami. Bądź kreatywny, ale profesjonalny.`
          }]
        }]
      });
      return response.text || `Jesteś agentem ${name} o roli ${role}. Pomagaj użytkownikowi w realizacji zadań.`;
    } catch (e) {
      return `Jesteś agentem ${name} o roli ${role}.`;
    }
  }
};
