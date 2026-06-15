import { TranslationRequest, TranslationMode } from '../types/translation';

// Future integration point for actual backend calls
export const translationService = {
  async translateText(req: TranslationRequest): Promise<string> {
    // In a real application, this would call /api/translate
    // Simulated delay based on low-latency setting
    const delay = req.lowLatency ? 30 : 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate translation based on mode
    let translation = `[${req.mode.toUpperCase()}] Translated (${req.sourceLang} -> ${req.targetLang}): ${req.text}`;
    
    if (req.mode === 'technical_cyber') {
      translation = `[CYBER-SEC MOD] Refined context: ${translation}`;
    }
    
    return translation;
  },

  // Future extensibility placeholders
  async translateFile(file: File, mode: TranslationMode): Promise<string> {
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      throw new Error('Obsługiwane są tylko pliki .txt');
    }

    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });

    // Reuse translateText logic after reading file
    return await this.translateText({
      text,
      sourceLang: 'auto',
      targetLang: 'pl',
      mode
    });
  },

  async startRealtimeVoice(onResult: (text: string) => void): Promise<() => void> {
    console.log("Realtime voice enabled");
    const interval = setInterval(() => {
        onResult("...live translation stream active...");
    }, 2000);
    return () => clearInterval(interval);
  }
};
