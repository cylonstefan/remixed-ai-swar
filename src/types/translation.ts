export type TranslationMode = 'standard' | 'technical_cyber' | 'slang' | 'formal';

export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  mode: TranslationMode;
  lowLatency?: boolean;
}

export interface TranslationService {
  translateText: (req: TranslationRequest) => Promise<string>;
  translateFile?: (file: File, mode: TranslationMode) => Promise<string>;
  startRealtimeVoice?: (onResult: (text: string) => void) => Promise<() => void>;
}
