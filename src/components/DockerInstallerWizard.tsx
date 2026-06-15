import React, { useState, useEffect } from 'react';
import { Box, FileWarning, CheckCircle, PackageSearch, TerminalSquare } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface DockerInstallerWizardProps {
  showToast?: (msg: string) => void;
}

export function DockerInstallerWizard({ showToast }: DockerInstallerWizardProps) {
  const [step, setStep] = useState(0);
  const [appName, setAppName] = useState("CYLON_Core_System");
  const [port, setPort] = useState("3000");
  const [includeDev, setIncludeDev] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);

  // Wymiary okna to ok 500x380 px - klasyczny rozmiar wizarda Win9x
  
  const handleNext = () => {
    if (step === 2) {
      startBuild();
    } else {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
  };
  
  const startBuild = () => {
    setIsBuilding(true);
    setStep(2);
    setLogs(["Inicjowanie instalatora...", "Analiza zależności systemowych..."]);
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 100) currentProgress = 100;
      setProgress(currentProgress);
      
      const newLogs = [
        "Sprawdzanie Dockerfile...",
        "Kopiowanie package.json...",
        "Instalacja pakietów NPM...",
        "Uruchamianie vite build...",
        "Kompilacja typów TypeScript...",
        "Konfiguracja serwera Express...",
        "Optymalizacja obrazu Docker (slim)...",
        "Eksportowanie gotowego obrazu...",
      ];
      
      const logIndex = Math.floor((currentProgress / 100) * newLogs.length);
      if (logIndex < newLogs.length) {
        setLogs(prev => [...prev, newLogs[logIndex]]);
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsBuilding(false);
          setStep(3);
          if (showToast) showToast("Obraz Docker przygotowany do wdrożenia!");
        }, 1000);
      }
    }, 800);
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-black/60 backdrop-blur-sm p-4">
      {/* Okno kreatora (Classic Windows 95/98 theme) */}
      <div 
        className="w-full max-w-[520px] bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black flex flex-col font-sans text-black relative shadow-[4px_4px_10px_rgba(0,0,0,0.5)]"
        style={{ height: '400px' }}
      >
        
        {/* Title bar */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-500 text-white font-bold text-xs px-2 py-1 flex justify-between items-center select-none shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-1.5">
            <Box size={14} /> 
            <span>Kreator Obrazu Docker - Setup</span>
          </div>
          <div className="bg-[#d4d0c8] border-t border-l border-white border-b-2 border-r-2 border-black w-4 h-4 flex items-center justify-center text-black font-extrabold cursor-pointer hover:bg-red-500 hover:text-white" onClick={() => showToast && showToast("Instalator musi ukończyć proces.")}>
            ×
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lewy pasek wizarda (niebieski z ikoną) */}
          <div className="w-[160px] bg-gradient-to-b from-blue-700 to-blue-400 border-r border-gray-400 p-4 pt-8 flex flex-col items-center">
            <div className="bg-white/10 p-4 rounded-full border border-white/20 shadow-lg mb-8">
               <PackageSearch size={64} className="text-white drop-shadow-md" />
            </div>
            
            <ul className="text-white text-[11px] font-bold space-y-4 text-left w-full pl-2">
               <li className={step === 0 ? "text-yellow-300 drop-shadow flex items-center gap-2" : "opacity-60 flex items-center gap-2"}>
                 <div className={cn("w-2 h-2 rounded-full", step === 0 ? "bg-yellow-300" : "bg-transparent")} /> Witaj
               </li>
               <li className={step === 1 ? "text-yellow-300 drop-shadow flex items-center gap-2" : "opacity-60 flex items-center gap-2"}>
                 <div className={cn("w-2 h-2 rounded-full", step === 1 ? "bg-yellow-300" : "bg-transparent")} /> Konfiguracja
               </li>
               <li className={step === 2 ? "text-yellow-300 drop-shadow flex items-center gap-2" : "opacity-60 flex items-center gap-2"}>
                 <div className={cn("w-2 h-2 rounded-full", step === 2 ? "bg-yellow-300" : "bg-transparent")} /> Budowanie
               </li>
               <li className={step === 3 ? "text-yellow-300 drop-shadow flex items-center gap-2" : "opacity-60 flex items-center gap-2"}>
                 <div className={cn("w-2 h-2 rounded-full", step === 3 ? "bg-yellow-300" : "bg-transparent")} /> Zakończenie
               </li>
            </ul>
          </div>

          {/* Główny panel kreatora */}
          <div className="flex-1 p-6 relative flex flex-col">
            
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-xl mb-4 leading-tight">Witaj w Kreatorze Obrazów Docker</h2>
                <p className="text-xs text-black/80 font-serif leading-relaxed">
                  Ten kreator pomoże Ci wygenerować bezpieczny, zoptymalizowany obraz Docker dla aplikacji <strong>{appName}</strong>.
                </p>
                <p className="text-xs text-black/80 font-serif leading-relaxed mt-2">
                  System operacyjny został zindeksowany. Kod źródłowy jest gotowy do wdrożenia w kontenerze (node:base).
                </p>
                <div className="mt-8 border border-gray-400 bg-white p-3 flex gap-3 shadow-inner">
                    <FileWarning size={24} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] text-gray-700">Ostrzeżenie: Ten proces wymaga dostępu do silnika produkcyjnego. Upewnij się, że repozytorium nie zawiera niezaszyfrowanych sekretów.</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 flex-1">
                <h2 className="font-bold text-lg mb-4 border-b border-gray-400 pb-2">Parametry Obrazu</h2>
                
                <div className="space-y-3 mt-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold">Nazwa aplikacji (Tag):</label>
                    <input 
                      type="text" 
                      value={appName}
                      onChange={e => setAppName(e.target.value)}
                      className="border-t border-l border-gray-500 border-b border-r border-white p-1 text-xs outline-none bg-white font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold">Zewnętrzny port nasłuchu:</label>
                    <input 
                      type="number" 
                      value={port}
                      onChange={e => setPort(e.target.value)}
                      className="border-t border-l border-gray-500 border-b border-r border-white p-1 text-xs outline-none bg-white font-mono w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4">
                    <input 
                      type="checkbox" 
                      id="opt1" 
                      checked={includeDev} 
                      onChange={e => setIncludeDev(e.target.checked)} 
                      className="w-3 h-3"
                    />
                    <label htmlFor="opt1" className="text-xs cursor-pointer">Zachowaj zależności deweloperskie (devDependencies)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="opt2" defaultChecked disabled className="w-3 h-3" />
                    <label htmlFor="opt2" className="text-xs text-gray-600 cursor-not-allowed">Automatyczny start poprzez PM2 / Node</label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
               <div className="flex-1 flex flex-col pt-2">
                 <h2 className="font-bold text-base mb-2">Trwa budowanie kontenera...</h2>
                 <p className="text-xs mb-4">Proszę czekać, instalator kompiluje kod <strong>{appName}</strong>.</p>
                 
                 {/* Pliki / Logi */}
                 <div className="text-[10px] truncate w-full text-black/80 font-mono mb-1 border-b border-gray-400 pb-1 h-4">
                    {logs[logs.length - 1]}
                 </div>

                 {/* Pasek postępu */}
                 <div className="w-full h-5 border-t border-l border-gray-500 border-b border-r border-white bg-white mt-1 relative flex items-center p-[1px]">
                     <div 
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-500" 
                        style={{ width: progress + '%', transition: 'width 0.2s' }} 
                     />
                 </div>

                 {/* Console View */}
                 <div className="mt-4 flex-1 border-t border-l border-gray-500 border-b border-r border-white bg-black w-full p-2 overflow-y-auto font-mono text-[9px] text-green-400 shadow-inner">
                    {logs.map((log, i) => (
                      <div key={i}>{'> '}{log}</div>
                    ))}
                    {isBuilding && <div className="animate-pulse">_</div>}
                 </div>
               </div>
            )}

            {step === 3 && (
               <div className="space-y-4">
                <h2 className="font-bold text-xl mb-4">Zakończono pomyślnie</h2>
                <div className="flex items-center gap-3 text-sm font-bold text-green-700 mb-6">
                  <CheckCircle size={32} />
                  Zbudowano obraz: {appName}:latest
                </div>
                
                <p className="text-xs mb-2 font-serif">Aplikacja jest gotowa. Aby uruchomić nowy kontener skopiuj poniższą komendę:</p>
                <div className="bg-white border-t border-l border-gray-500 border-b border-r border-white p-2 font-mono text-[10px] break-all select-all flex items-center justify-between">
                   <span>docker run -p {port}:3000 --name cylon-instance {appName}:latest</span>
                </div>

                <div className="mt-6 flex gap-2">
                    <TerminalSquare size={16} className="text-gray-500" />
                    <p className="text-[10px] text-gray-700 font-serif">Logi systemowe zostały zapisane. Weryfikacja bezbłędnej instalacji [Pass].</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Bottom controls */}
        <div className="h-12 border-t border-white shadow-[0_-1px_0_rgba(160,160,160,1)] bg-[#d4d0c8] flex items-center justify-between px-4 pb-1">
          <div className="text-[10px] text-gray-600 font-serif pt-1">
             InstallShield Wizard (Docker)
          </div>
          <div className="flex gap-2">
             <button 
                disabled={step === 0 || step === 2 || step === 3}
                onClick={handleBack}
                className={cn(
                  "px-6 py-1 text-xs border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 bg-[#d4d0c8] font-bold active:border-t-2 active:border-l-2 active:border-gray-800 active:border-b-2 active:border-r-2 active:border-white focus:outline-none focus:ring-1 outline-black",
                  (step === 0 || step === 2 || step === 3) && "text-gray-500 border-gray-500/50"
                )}
             >
               {'< Wstecz'}
             </button>
             
             {step < 3 ? (
               <button 
                  disabled={step === 2}
                  onClick={handleNext}
                  className={cn(
                     "px-6 py-1 text-xs border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 bg-[#d4d0c8] font-bold active:border-t-2 active:border-l-2 active:border-gray-800 active:border-b-2 active:border-r-2 active:border-white focus:outline-none focus:ring-1 outline-black",
                     step === 2 && "text-gray-500"
                  )}
               >
                 {step === 1 ? 'Instaluj' : 'Dalej >'}
               </button>
             ) : (
               <button 
                  onClick={() => showToast && showToast("Zamykanie wizarda...")}
                  className="px-6 py-1 text-xs border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 bg-[#d4d0c8] font-bold active:border-t-2 active:border-l-2 active:border-gray-800 active:border-b-2 active:border-r-2 active:border-white focus:outline-none focus:ring-1 outline-black"
               >
                 Zakończ
               </button>
             )}
             
             <div className="w-1 ml-2" />
             <button 
                onClick={() => showToast && showToast("Anulowano")}
                disabled={step === 2}
                className={cn(
                  "px-6 py-1 text-xs border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 bg-[#d4d0c8] font-bold active:border-t-2 active:border-l-2 active:border-gray-800 active:border-b-2 active:border-r-2 active:border-white focus:outline-none focus:ring-1 outline-black",
                  step === 2 && "text-gray-500"
                )}
             >
               Anuluj
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
