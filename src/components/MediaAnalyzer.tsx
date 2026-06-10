import React, { useState, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisResult {
  category: string;
  description: string;
  tags: string[];
}

export function MediaAnalyzer({ showToast }: { showToast: (msg: string) => void }) {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setIsCapturing(true);
      showToast("Kamera aktywowana");
    } catch (err) {
      showToast("Błąd dostępu do kamery");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setCapturedImage(data);
      stopCamera();
    }
  };

  const analyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeMedia({
        type: 'image',
        source: mode,
        data: capturedImage
      });
      if (res.success) {
        setResult(res.categorization);
        showToast("Analiza zakończona pomyślnie");
      } else {
        showToast("Błąd analizy obrazu");
      }
    } catch (e) {
      showToast("Błąd połączenia z serwerem AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        setCapturedImage(re.target?.result as string);
        setMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-slate-300 font-sans overflow-hidden border border-white/5 rounded-[3rem]">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-neutral-900/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-acid-cyan/10 text-acid-cyan rounded-2xl border border-acid-cyan/20">
            <Lucide.Camera size={24} />
          </div>
          <div className="text-left">
            <h2 className="text-white font-black text-xl uppercase tracking-tight italic">Wizualny Analizator Cylon-V</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Klasyfikacja i kategoryzacja multimediów AI</p>
          </div>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={() => { setMode('camera'); startCamera(); setCapturedImage(null); setResult(null); }}
             className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", mode === 'camera' ? "bg-white/10 text-white border border-white/10" : "text-slate-500 hover:text-slate-300")}
           >
             <Lucide.Aperture size={14} /> Kamera
           </button>
           <button 
             onClick={() => { setMode('upload'); stopCamera(); setCapturedImage(null); setResult(null); }}
             className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", mode === 'upload' ? "bg-white/10 text-white border border-white/10" : "text-slate-500 hover:text-slate-300")}
           >
             <Lucide.Upload size={14} /> Wgraj Plik
           </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto flex flex-col lg:flex-row gap-8 items-start">
        {/* Viewport */}
        <div className="w-full lg:w-[600px] aspect-video bg-neutral-950 rounded-[2.5rem] border border-white/10 overflow-hidden relative group">
           {isCapturing ? (
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale opacity-80" />
           ) : capturedImage ? (
             <img src={capturedImage} className="w-full h-full object-contain" alt="Captured" />
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-700">
               <Lucide.Image size={64} strokeWidth={1} />
               <p className="uppercase font-black text-[10px] tracking-widest">Oczekiwanie na sygnał wejściowy...</p>
             </div>
           )}

           <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
           <div className="absolute top-4 right-4 flex gap-2">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
             <span className="text-[8px] font-mono text-red-600 font-bold uppercase tracking-widest">Live Feed // {mode.toUpperCase()}</span>
           </div>

           {/* Scanning line animation */}
           {isAnalyzing && (
             <motion.div 
               initial={{ top: '0%' }}
               animate={{ top: '100%' }}
               transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
               className="absolute left-0 right-0 h-1 bg-acid-cyan shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10"
             />
           )}
        </div>

        {/* Controls and Results */}
        <div className="flex-1 space-y-6 w-full">
           <div className="grid grid-cols-1 gap-4">
              {isCapturing && (
                <button 
                  onClick={captureFrame}
                  className="w-full py-6 bg-acid-cyan hover:bg-cyan-400 text-black font-black uppercase text-xs rounded-2xl shadow-xl shadow-cyan-500/10 transition-all flex items-center justify-center gap-3"
                >
                  <Lucide.Camera size={20} /> Zrób Zdjęcie do Analizy
                </button>
              )}

              {capturedImage && !isAnalyzing && (
                <button 
                  onClick={analyze}
                  className="w-full py-6 bg-acid-green hover:bg-green-400 text-black font-black uppercase text-xs rounded-2xl shadow-xl shadow-green-500/10 transition-all flex items-center justify-center gap-3"
                >
                  <Lucide.Search size={20} /> Rozpocznij Klasyfikację AI
                </button>
              )}

              {mode === 'upload' && !capturedImage && (
                <label className="w-full py-10 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all">
                  <Lucide.UploadCloud size={48} className="text-slate-500" />
                  <div className="text-center group">
                    <span className="text-white font-black uppercase text-xs">Kliknij aby wybrać plik</span>
                    <p className="text-[9px] text-slate-600 uppercase mt-1">Obrazy (JPG/PNG) do 20MB</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}

              {isAnalyzing && (
                <div className="w-full py-8 bg-[#a855f7]/10 border border-[#a855f7]/40 rounded-2xl flex flex-col items-center justify-center gap-3">
                   <Lucide.Cpu size={32} className="text-acid-purple animate-spin" />
                   <p className="text-acid-purple font-black uppercase text-[10px] animate-pulse">Neuralne dekodowanie klatek...</p>
                </div>
              )}
           </div>

           {/* Results Panel */}
           <AnimatePresence>
             {result && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="p-8 bg-neutral-900 border border-white/5 rounded-[2.5rem] space-y-6 text-left"
               >
                 <div className="flex items-center gap-4">
                   <span className="px-3 py-1 bg-acid-purple text-black font-black uppercase text-[10px] rounded-lg tracking-widest">{result.category}</span>
                   <div className="h-px flex-1 bg-white/5" />
                 </div>

                 <div className="space-y-2">
                   <h4 className="text-white font-bold text-sm uppercase tracking-tight italic">Opis Sceny:</h4>
                   <p className="text-xs text-slate-400 leading-relaxed font-sans">{result.description}</p>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/5">
                   <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] block">Słowa Kluczowe / Tagi:</span>
                   <div className="flex flex-wrap gap-2">
                     {result.tags.map(tag => (
                       <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-slate-300 font-mono uppercase">#{tag}</span>
                     ))}
                   </div>
                 </div>

                 <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[8px] text-slate-600 font-black uppercase">Model: Gemini Vision v3.5-Turbo</span>
                    <button 
                      onClick={() => { setCapturedImage(null); setResult(null); if (mode==='camera') startCamera(); }}
                      className="text-[10px] text-acid-cyan font-black uppercase hover:underline"
                    >
                      Nowa Analiza &rarr;
                    </button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
