import React, { useState, useRef } from 'react';
import { Languages, Mic, FileText, Bot, Shield, Terminal, Upload } from 'lucide-react';
import { translationService } from '../services/translationService';
import { TranslationMode } from '../types/translation';

export const TranslationHub: React.FC = () => {
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
        // Immediate audio feedback to secure lowest voice latency
        const utterance = new SpeechSynthesisUtterance(result);
        utterance.lang = 'pl-PL';
        utterance.rate = 1.05; // slightly faster for quick response
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
        
        // If lowLatency is turned on, trigger instant translate and speak as soon as we notice speech finality
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
              // ignore overlap errors
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
    <div className="flex flex-col gap-6 p-6 h-full bg-slate-950 text-slate-200 font-mono">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
        <Languages className="text-acid-blue" size={24} />
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Centrum Translacji Neuralnej</h2>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs resize-none focus:border-acid-blue focus:outline-none"
            placeholder="Wprowadź tekst lub użyj rozpoznawania głosu..."
          />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value as TranslationMode)}
                className="bg-slate-800 border border-slate-700 rounded p-2 text-xs flex-1"
                >
                <option value="standard">Standardowy</option>
                <option value="technical_cyber">Techniczny/Cyber</option>
                <option value="slang">Slang</option>
                <option value="formal">Oficjalny</option>
                </select>
                <button 
                    onClick={() => handleTranslate()}
                    disabled={isTranslating}
                    className="flex-[2] bg-acid-blue/20 border border-acid-blue/50 text-acid-blue hover:bg-acid-blue/40 rounded py-2 text-xs uppercase font-bold"
                >
                    {isTranslating ? 'Analiza...' : 'Transluj'}
                </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked={isContinuous} onChange={(e) => setIsContinuous(e.target.checked)} className="accent-acid-blue" />
                  Tryb ciągły (nasłuchiwanie aktywne)
              </label>
              <label className="flex items-center gap-2 text-[10px] text-amber-400 cursor-pointer select-none font-bold">
                  <input type="checkbox" checked={lowLatency} onChange={(e) => setLowLatency(e.target.checked)} className="accent-amber-400" />
                  🔥 Niska latencja & Szybka Odpowiedź (Insta-TTS)
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs whitespace-pre-wrap overflow-y-auto">
                {output || 'Wynik translacji pojawi się tutaj...'}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt" />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded py-2 text-xs text-slate-400"
                >
                    <Upload size={14} /> Importuj .txt
                </button>
                <button 
                  onClick={handleToggleRecording}
                  className={`flex items-center justify-center gap-2 rounded py-2 text-xs transition ${
                    isRecording ? 'bg-red-900 text-red-100 border border-red-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                >
                    <Mic size={14} /> {isRecording ? 'Słucham...' : 'Nagrywaj'}
                </button>
                <button 
                    onClick={handleSpeak}
                    className="col-span-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded py-2 text-xs text-acid-blue font-bold"
                >
                    <Bot size={14} /> Odsłuchaj translację
                </button>
            </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-700 flex justify-between items-center text-[10px] text-slate-500">
          <span>STATUS: ŁĄCZE NEURALNE AKTYWNE</span>
          <span className="flex items-center gap-1"><Shield size={10} className="text-green-500"/> OCHRONA CYBER-SEC</span>
      </div>
    </div>
  );
};
