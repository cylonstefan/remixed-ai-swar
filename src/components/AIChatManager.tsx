import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Bot, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { gemini } from '../services/gemini';

export const AIChatManager = React.memo(({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Basic Web Speech Recognition Setup
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pl-PL';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    // Simulate AI response for management
    setMessages(prev => [...prev, { role: 'ai', content: `Przetwarzam polecenie: ${userMsg}...` }]);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-white/10 w-full max-w-lg rounded-3xl flex flex-col h-[500px]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-white font-bold flex items-center gap-2"><Bot size={18} /> AI Manager Chat</h2>
            <button onClick={onClose}><X size={18} className="text-slate-500 hover:text-white"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
                <div key={i} className={cn("p-3 rounded-xl text-xs", m.role === 'user' ? 'bg-acid-purple/20 text-white ml-auto max-w-[80%]' : 'bg-white/5 text-slate-300 mr-auto max-w-[80%]')}>
                    {m.content}
                </div>
            ))}
        </div>
        <div className="p-4 border-t border-white/10 flex gap-2">
            <button 
                onClick={toggleListening}
                className={cn("p-3 rounded-xl transition-all", isListening ? "bg-red-500" : "bg-white/5 hover:bg-white/10")}
            >
                <Mic size={16} className={isListening ? "text-white" : "text-slate-400"} />
            </button>
            <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                placeholder="Wpisz lub powiedz polecenie..."
                onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="p-3 bg-acid-purple hover:bg-white/10 rounded-xl">
                <Send size={16} className="text-white" />
            </button>
        </div>
      </div>
    </div>
  );
});
