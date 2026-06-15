import React, { useState, useRef } from 'react';
import { Languages, Upload, Bot, Shield, Mic, Loader2, Volume2 } from 'lucide-react';
import { TranslationMode } from '../types/translation';
import { translationService } from '../services/translationService';

export const SwarmTranslator: React.FC = () => {
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<TranslationMode>('standard');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [lowLatency, setLowLatency] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);

  const lowLatencyRef = useRef(lowLatency);
  const modeRef = useRef(mode);
  const isContinuousRef = useRef(isContinuous);
  const isRecordingRef = useRef(isRecording);

  React.useEffect(() => {
    lowLatencyRef.current = lowLatency;
    modeRef.current = mode;
    isContinuousRef.current = isContinuous;
    isRecordingRef.current = isRecording;
  }, [lowLatency, mode, isContinuous, isRecording]);

  const handleTranslate = async (textOverride?: string) => {
    const textToTranslate = textOverride !== undefined ? textOverride : text;
    if (!textToTranslate.trim()) return;

    setIsTranslating(true);
    try {
      const result = await translationService.translateText({
        text: textToTranslate,
        sourceLang: 'auto',
        targetLang: 'pl',
        mode: modeRef.current,
        lowLatency: lowLatencyRef.current
      });
      setOutput(result);
      if (lowLatencyRef.current) {
        const utterance = new SpeechSynthesisUtterance(result);
        utterance.lang = 'pl-PL';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = isContinuous;
      recognition.current.interimResults = true;
      recognition.current.lang = 'pl-PL';
      
      recognition.current.onresult = (event: any) => {
        let isFinal = false;
        const transcript = Array.from(event.results)
          .map((result: any) => {
            if (result.isFinal) isFinal = true;
            return result[0].transcript;
          })
          .join('');
        
        setText(transcript);
        
        if (isFinal && !isContinuousRef.current) {
          setIsRecording(false);
          recognition.current?.stop();
          if (transcript.trim()) {
            handleTranslate(transcript);
          }
        }
      };

      recognition.current.onend = () => {
        if (isContinuousRef.current && isRecordingRef.current) {
            try {
              recognition.current?.start();
            } catch (e) {
              // ignore overlap
            }
        } else {
            setIsRecording(false);
        }
      };
    }
  }, [isContinuous]);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognition.current?.stop();
      setIsRecording(false);
    } else {
      setText('');
      setOutput('');
      try {
        recognition.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSpeak = () => {
    if (!output) return;
    const utterance = new SpeechSynthesisUtterance(output);
    utterance.lang = 'pl-PL';
    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTranslating(true);
    try {
        const result = await translationService.translateFile(file, mode);
        setOutput(result);
        if (lowLatency) {
          const utterance = new SpeechSynthesisUtterance(result);
          utterance.lang = 'pl-PL';
          window.speechSynthesis.speak(utterance);
        }
    } catch(err: any) {
        setOutput(`Błąd: ${err.message}`);
    } finally {
        setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full bg-neutral-900 border border-white/5 rounded-3xl text-slate-300 font-mono">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Languages className="text-acid-cyan" size={24} />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Moduł Translatora Roju</h2>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] text-amber-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Niska Latencja Aktywna
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-xs resize-none focus:border-acid-cyan focus:outline-none text-white min-h-[150px]"
            placeholder="Wprowadź tekst lub użyj rozpoznawania głosu..."
          />
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value as TranslationMode)}
                className="bg-black border border-white/10 rounded-xl p-3 text-xs text-white col-span-1"
              >
                <option value="standard">Standardowy</option>
                <option value="technical_cyber">Techniczny/Cyber</option>
                <option value="slang">Slang</option>
                <option value="formal">Oficjalny</option>
              </select>
              <button 
                  onClick={() => handleTranslate()}
                  disabled={isTranslating}
                  className="bg-acid-cyan/20 border border-acid-cyan/50 text-white hover:bg-acid-cyan/30 rounded-xl py-2 text-xs uppercase font-bold col-span-2"
              >
                  {isTranslating ? 'Neurony pracują...' : 'Transluj'}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked={isContinuous} onChange={(e) => setIsContinuous(e.target.checked)} className="accent-acid-cyan" />
                  Tryb ciągły (nasłuchiwanie)
              </label>
              <label className="flex items-center gap-2 text-[10px] text-amber-400 cursor-pointer select-none font-bold">
                  <input type="checkbox" checked={lowLatency} onChange={(e) => setLowLatency(e.target.checked)} className="accent-amber-400" />
                  Szybka Odpowiedź (Insta-TTS)
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
            <div className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-xs whitespace-pre-wrap overflow-y-auto text-slate-300 min-h-[150px]">
                {isTranslating ? <div className='flex items-center gap-2 text-slate-400'><Loader2 className='animate-spin text-acid-cyan' size={16}/> Przetwarzanie...</div> : (output || 'Wynik translacji pojawi się tutaj...')}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.pdf,.docx" />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl py-3 text-xs text-white border border-white/10"
                >
                    <Upload size={14} /> Importuj Dokument
                </button>
                <button 
                  onClick={handleToggleRecording}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs transition border ${
                    isRecording 
                      ? 'bg-red-950 text-red-100 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                >
                    <Mic size={14} className={isRecording ? 'animate-pulse text-red-400' : ''} /> 
                    {isRecording ? 'Słucham...' : 'Nagrywaj'}
                </button>
                <button 
                    onClick={handleSpeak}
                    disabled={!output}
                    className="col-span-2 flex items-center justify-center gap-2 bg-acid-cyan/10 hover:bg-acid-cyan/25 border border-acid-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 text-xs text-white font-bold"
                >
                    <Volume2 size={14} /> Odsłuchaj translację (TTS)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
