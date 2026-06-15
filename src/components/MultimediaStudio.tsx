import React, { useState, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';
import { SwarmTranslator } from './SwarmTranslator';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisResult {
  category: string;
  description: string;
  tags: string[];
}

export function MultimediaStudio({ showToast }: { showToast: (msg: string) => void }) {
  const [activeTab, setActiveTab] = useState<'image' | 'video-analyze' | 'video-generate' | 'translator'>('image');
  
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedMedia, setCapturedMedia] = useState<{ type: 'image' | 'video', data: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [videoPrompt, setVideoPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeTab === 'image' && mode === 'camera' && !stream && !capturedMedia) startCamera();
    else stopCamera();
    return stopCamera;
  }, [activeTab, mode]);

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setCapturedMedia({ type: 'image', data });
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = (re) => {
        setCapturedMedia({ type: isVideo ? 'video' : 'image', data: re.target?.result as string });
        setMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyze = async () => {
    if (!capturedMedia) return;
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeMedia({
        type: capturedMedia.type,
        source: mode,
        data: capturedMedia.data
      });
      if (res.success) {
        setResult(res.categorization);
        showToast("Analiza zakończona pomyślnie");
      } else {
        showToast("Błąd analizy: " + ((res as any).error || 'Nieznany błąd'));
      }
    } catch (e) {
      showToast("Błąd połączenia z serwerem AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationPhase('Inicjalizacja generatora Veo-3.1...');
    setGeneratedVideoUrl(null);
    try {
      const res = await api.generateVideo(videoPrompt);
      if (!res.success || !res.operationName) {
         showToast("Błąd generowania wideo");
         setIsGenerating(false);
         return;
      }
      
      const opName = res.operationName;
      setGenerationPhase('Renderowanie filmu (może to potrwać kilka minut)...');
      
      const interval = setInterval(async () => {
         try {
           const status = await api.checkVideoStatus(opName);
           if (status.done) {
             clearInterval(interval);
             setGenerationPhase('Pobieranie wideo z serwera...');
             const downloadRes = await api.downloadVideo(opName);
             if (downloadRes.success && downloadRes.fileUrl) {
                setGeneratedVideoUrl(downloadRes.fileUrl);
                showToast("Wideo wygenerowane!");
             } else {
                showToast("Błąd pobierania wideo: " + downloadRes.error);
             }
             setIsGenerating(false);
           }
         } catch (e) {
           clearInterval(interval);
           setIsGenerating(false);
           showToast("Błąd połączenia podczas odpytywania statusu");
         }
      }, 5000);
      
    } catch (e) {
      setIsGenerating(false);
      showToast("Wystąpił błąd");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-slate-300 font-sans overflow-hidden border border-white/5 rounded-[3rem]">
      <div className="p-8 border-b border-white/5 flex flex-col gap-6 bg-neutral-900/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-acid-cyan/10 text-acid-cyan rounded-2xl border border-acid-cyan/20">
            <Lucide.Video size={24} />
          </div>
          <div className="text-left">
            <h2 className="text-white font-black text-xl uppercase tracking-tight italic">Studio Multimedialne Cylon-V</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Analiza Obrazu / Wideo & Generowanie Veo</p>
          </div>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={() => { setActiveTab('image'); setCapturedMedia(null); setResult(null); }}
             className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", activeTab === 'image' ? "bg-white/10 text-white border border-white/10" : "text-slate-500 hover:text-slate-300")}
           >
             <Lucide.Image size={14} /> Analiza Obrazu (Wizja)
           </button>
           <button 
             onClick={() => { setActiveTab('video-analyze'); setCapturedMedia(null); setResult(null); setMode('upload'); }}
             className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", activeTab === 'video-analyze' ? "bg-white/10 text-white border border-white/10" : "text-slate-500 hover:text-slate-300")}
           >
             <Lucide.Film size={14} /> Analiza Wideo (Plik)
           </button>
           <button 
             onClick={() => { setActiveTab('video-generate'); stopCamera(); }}
             className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", activeTab === 'video-generate' ? "bg-acid-purple/20 text-acid-purple border border-acid-purple/50" : "text-slate-500 hover:text-slate-300")}
           >
             <Lucide.Video size={14} /> Generator Wideo (Veo-3.1)
           </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-[600px] aspect-video bg-neutral-950 rounded-[2.5rem] border border-white/10 overflow-hidden relative group">
           {activeTab === 'video-generate' ? (
              generatedVideoUrl ? (
                 <video src={generatedVideoUrl} controls autoPlay className="w-full h-full object-contain bg-black" />
              ) : isGenerating ? (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-acid-purple">
                   <Lucide.Video size={64} className="animate-pulse" />
                   <p className="uppercase font-black text-xs tracking-widest">{generationPhase}</p>
                 </div>
              ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-700">
                   <Lucide.Clapperboard size={64} strokeWidth={1} />
                   <p className="uppercase font-black text-[10px] tracking-widest">Wpisz prompt aby rozpocząć rendering Veo</p>
                 </div>
              )
           ) : (
              isCapturing ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-80" />
              ) : capturedMedia ? (
                capturedMedia.type === 'image' ? (
                   <img src={capturedMedia.data} className="w-full h-full object-contain" alt="Captured" />
                ) : (
                   <video src={capturedMedia.data} controls className="w-full h-full object-contain" />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-700">
                  {activeTab === 'image' ? <Lucide.Image size={64} /> : <Lucide.Film size={64} />}
                  <p className="uppercase font-black text-[10px] tracking-widest">Oczekiwanie na sygnał wejściowy...</p>
                </div>
              )
           )}

           <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
           <div className="absolute top-4 right-4 flex gap-2">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
             <span className="text-[8px] font-mono text-red-600 font-bold uppercase tracking-widest">
                {activeTab === 'video-generate' ? 'RENDER ENGINE' : `Feed // ${mode.toUpperCase()}`}
             </span>
           </div>

           {(isAnalyzing || isGenerating) && (
             <motion.div 
               initial={{ top: '0%' }}
               animate={{ top: '100%' }}
               transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
               className={`absolute left-0 right-0 h-1 z-10 ${isGenerating ? 'bg-acid-purple shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'bg-acid-cyan shadow-[0_0_15px_rgba(34,211,238,0.8)]'}`}
             />
           )}
        </div>

        <div className="flex-1 space-y-6 w-full">
           {activeTab === 'video-generate' ? (
              <div className="space-y-4">
                 <textarea 
                   value={videoPrompt}
                   onChange={e => setVideoPrompt(e.target.value)}
                   disabled={isGenerating}
                   placeholder="Opisz wizję... (np. Cinematic shot of a spaceship landing on Mars, highly detailed, neon lights)"
                   className="w-full h-32 bg-neutral-900 border border-white/10 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:border-acid-purple text-white disabled:opacity-50"
                 />
                 <button 
                   onClick={generateVideo}
                   disabled={isGenerating || !videoPrompt.trim()}
                   className="w-full py-6 bg-acid-purple hover:bg-purple-400 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isGenerating ? <Lucide.Loader2 className="animate-spin" /> : <Lucide.Flame />} 
                   {isGenerating ? 'Renderowanie Trwa...' : 'Generuj Wideo (Veo)'}
                 </button>
              </div>
           ) : (
              <div className="grid grid-cols-1 gap-4">
                 {activeTab === 'image' && (
                   <div className="flex gap-2">
                     <button onClick={() => { setMode('camera'); setCapturedMedia(null); }} className={cn("flex-1 py-3 text-xs font-bold uppercase rounded-xl border", mode === 'camera' ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-slate-500")}>
                        <Lucide.Camera size={16} className="inline mr-2"/> Kamera
                     </button>
                     <button onClick={() => { setMode('upload'); stopCamera(); setCapturedMedia(null); }} className={cn("flex-1 py-3 text-xs font-bold uppercase rounded-xl border", mode === 'upload' ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-slate-500")}>
                        <Lucide.UploadCloud size={16} className="inline mr-2"/> Wgraj Plik
                     </button>
                   </div>
                 )}

                 {isCapturing && activeTab === 'image' && (
                   <button onClick={captureFrame} className="w-full py-6 bg-acid-cyan hover:bg-cyan-400 text-black font-black uppercase text-xs rounded-2xl shadow-xl shadow-cyan-500/10 transition-all">
                     <Lucide.Camera size={20} className="inline mr-2"/> Zrób Zdjęcie
                   </button>
                 )}

                 {mode === 'upload' && !capturedMedia && (
                   <label className="w-full py-10 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all">
                     <Lucide.UploadCloud size={48} className="text-slate-500" />
                     <div className="text-center group">
                       <span className="text-white font-black uppercase text-xs">Kliknij aby wybrać plik</span>
                       <p className="text-[9px] text-slate-600 uppercase mt-1">
                         {activeTab === 'image' ? 'Obrazy (JPG/PNG)' : 'Wideo (MP4)'} do 20MB
                       </p>
                     </div>
                     <input 
                        type="file" 
                        className="hidden" 
                        accept={activeTab === 'image' ? "image/*" : "video/*"} 
                        onChange={handleFileUpload} 
                     />
                   </label>
                 )}

                 {capturedMedia && !isAnalyzing && (
                   <button onClick={analyze} className="w-full py-6 bg-acid-green hover:bg-green-400 text-black font-black uppercase text-xs rounded-2xl shadow-xl shadow-green-500/10 transition-all">
                     <Lucide.Search size={20} className="inline mr-2"/> Rozpocznij Klasyfikację AI
                   </button>
                 )}

                 {isAnalyzing && (
                   <div className="w-full py-8 bg-[#a855f7]/10 border border-[#a855f7]/40 rounded-2xl flex flex-col items-center justify-center gap-3">
                      <Lucide.Cpu size={32} className="text-acid-purple animate-spin" />
                      <p className="text-acid-purple font-black uppercase text-[10px] animate-pulse">Neuralne dekodowanie klatek...</p>
                   </div>
                 )}
              </div>
           )}

           <AnimatePresence>
             {result && activeTab !== 'video-generate' && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 bg-neutral-900 border border-white/5 rounded-[2.5rem] space-y-6 text-left">
                 <div className="flex items-center gap-4">
                   <span className="px-3 py-1 bg-acid-purple text-black font-black uppercase text-[10px] rounded-lg tracking-widest">{result.category}</span>
                   <div className="h-px flex-1 bg-white/5" />
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-white font-bold text-sm uppercase tracking-tight italic">Opis Sceny:</h4>
                   <p className="text-xs text-slate-400 leading-relaxed font-sans">{result.description}</p>
                 </div>
                 <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="flex flex-wrap gap-2">
                     {result.tags.map(tag => (
                       <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-slate-300 font-mono uppercase">#{tag}</span>
                     ))}
                   </div>
                 </div>
                 <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[8px] text-slate-600 font-black uppercase">Model: Gemini Flash v3.5-Turbo Vision</span>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
