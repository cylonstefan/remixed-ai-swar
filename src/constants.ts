import { 
  Monitor, Bot, Zap, Cloud, ShieldCheck, Cpu, Activity, 
  Image as ImageIcon, Code, Shield, Globe, Languages, FileText, 
  Server, ShieldAlert, ThumbsDown, Scale, Box, BookOpen, 
  Network, ShieldCheck as ShieldCheckIcon, MessageCircle, Gamepad2, Music, CheckSquare
} from 'lucide-react';

export const COLORS = [
  '#141414', '#E63946', '#457B9D', '#2A9D8F', '#F4A261', '#6D597A', '#70E000'
];

export const MODELS = [
  'auto',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-1.5-pro-preview-0514',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'hf:mistralai/Mistral-7B-Instruct-v0.3',
  'hf:meta-llama/Llama-3.2-3B-Instruct',
  'hf:microsoft/Phi-3-mini-4k-instruct',
  'hf:Qwen/Qwen2.5-72B-Instruct',
  'hf:google/gemma-2-9b-it',
  'hf:NousResearch/Hermes-3-Llama-3.1-8B'
];

export const AGENT_CATEGORIES = [
  'Programista',
  'Supervisor (Nadzorca)',
  'Krytyk',
  'Doradca',
  'Zarządzanie',
  'Infrastruktura',
  'Chmura',
  'DevOps',
  'Edukacja',
  'Sieci',
  'Bezpieczeństwo',
  'Biurowe',
  'Rozrywka',
  'GameDev',
  'Multimedia'
];

export const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export const SYSTEM_PROMPT_EXAMPLES = [
  {
    name: 'KODER-PRO-01',
    role: 'Starszy Inżynier Oprogramowania',
    category: 'Programista',
    prompt: 'Jesteś ekspertem od czystego kodu i wzorców projektowych. Skup się na optymalizacji wydajności, bezpieczeństwie i czytelności. Twoim zadaniem jest dostarczanie gotowych do wdrożenia fragmentów kodu oraz dogłębna analiza techniczna.'
  },
  {
    name: 'NADZORCA-X',
    role: 'Supervisor Projektu',
    category: 'Supervisor (Nadzorca)',
    prompt: 'Twoim celem jest orkiestracja pracy innych agentów. Rozdzielaj zadania, sprawdzaj postępy i weryfikuj, czy finalny produkt spełnia wymagania użytkownika. Bądź stanowczy, konkretny i dbaj o harmonogram.'
  },
  {
    name: 'RED-TEAM-01',
    role: 'Cybersecurity Specialist',
    category: 'Krytyk',
    prompt: 'Twoim zadaniem jest szukanie dziur w całym. Analizuj każdą propozycję pod kątem ryzyk, błędów logicznych i podatności. Nie daj się zwieść optymizmowi - kwestionuj wszystko, co nie jest poparte twardymi dowodami.'
  },
  {
    name: 'CREATIVE-BOT',
    role: 'Projektant UI/UX',
    category: 'Multimedia',
    prompt: 'Jesteś kreatywnym wizjonerem. Skup się na estetyce, użyteczności i nowoczesnych trendach. Twoim zadaniem jest projektowanie pięknych i funkcjonalnych interfejsów oraz generowanie spójnych wizualizacji.'
  }
];

export const SKILLS_GALLERY = [
  { id: 'coding', name: 'Coding', icon: Code, desc: 'Pisanie kodu, debugowanie i automatyzacja procesów wytwarzania oprogramowania.' },
  { id: 'writing', name: 'Writing', icon: FileText, desc: 'Generowanie profesjonalnych raportów, dokumentacji technicznej, artykułów oraz tekstów.' },
  { id: 'strategy', name: 'Strategy', icon: ShieldCheckIcon, desc: 'Analiza, planowanie celów strategicznych i kierowanie taktyczne procesami.' },
  { id: 'data-analysis', name: 'Analiza Danych', icon: Activity, desc: 'Przetwarzanie dużych zbiorów danych i wyciąganie wniosków.' },
  { id: 'vision-gen', name: 'Generowanie Obrazu', icon: ImageIcon, desc: 'Tworzenie grafik i wizualizacji na podstawie opisów.' },
  { id: 'code-review', name: 'Audyt Kodu', icon: Code, desc: 'Sprawdzanie poprawności i jakości napisanego kodu.' },
  { id: 'security-audit', name: 'Audyt Bezpieczeństwa', icon: Shield, desc: 'Identyfikacja podatności i wzmacnianie systemów.' },
  { id: 'web-scraping', name: 'Web Extract', icon: Globe, desc: 'Pobieranie i filtrowanie treści ze stron internetowych.' },
  { id: 'real-time-trans', name: 'Tłumaczenie', icon: Languages, desc: 'Przekład wiadomości między językami w locie.' },
  { id: 'file-management', name: 'Zarządzanie Plikami', icon: FileText, desc: 'Odczyt, edycja i organizacja plików w zespole.' },
  { id: 'automation', name: 'Automatyzacja', icon: Zap, desc: 'Tworzenie skryptów i automatyzacja powtarzalnych zadań.' }
];

export const AGENT_ICON_MAP: Record<string, any> = {
  'Programista': Code,
  'Infrastruktura': Server,
  'Zarządzanie': Zap,
  'Supervisor (Nadzorca)': ShieldAlert,
  'DevOps & Cloud': Cloud,
  'SysAdmin': Cpu,
  'Grafik': ImageIcon,
  'Logik': Activity,
  'Tester': CheckSquare,
  'Badacz Online': Network,
  'Doradca': Scale,
  'Krytyk': ThumbsDown,
  'Chmura': Cloud,
  'DevOps': Box,
  'Edukacja': BookOpen,
  'Sieci': Network,
  'Bezpieczeństwo': ShieldCheck,
  'Biurowe': FileText,
  'Rozrywka': MessageCircle,
  'GameDev': Gamepad2,
  'Multimedia': Music,
  'Inny': Bot
};
