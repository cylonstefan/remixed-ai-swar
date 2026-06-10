import React, { useState, useEffect } from 'react';
import { 
  Terminal, Cpu, Play, CheckCircle, AlertTriangle, RefreshCw, Zap, 
  Download, Server, Monitor, Activity, ShieldCheck, Search, HelpCircle, 
  ArrowRight, Check, X, Info, ExternalLink, FileText, Clipboard, AlertCircle, Plus
} from 'lucide-react';
import { api } from '../services/api';
import { gemini } from '../services/gemini';

interface DepItem {
  id: string;
  name: string;
  category: 'node' | 'system_win' | 'system_linux' | 'container';
  desc: string;
  status: 'pending' | 'ok' | 'missing' | 'checking' | 'failed';
  version?: string;
  details?: string;
  checkCmd: string;
  fixCmd: string;
}

export const SystemOrchestrator = () => {
    // Tab switching
    const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'dependencies'>('terminal');

    // Platform Target Filter
    const [targetPlatform, setTargetPlatform] = useState<'live_container' | 'win_target' | 'linux_target'>('live_container');

    // PowerShell state
    const [commandLog, setCommandLog] = useState<{ id: string; command: string; output: string; err?: string; type: 'info' | 'success' | 'err'; timestamp: string }[]>([
        { id: '1', command: 'System-Init', output: 'Cylon PowerShell Interface Initialized.\nOS: ' + navigator.userAgent + '\nStatus: Active and Integrated with Server Terminal Core', type: 'info', timestamp: new Date().toLocaleTimeString() }
    ]);
    const [manualCmd, setManualCmd] = useState('Get-Process -Name node* | Format-Table Id, Name, CPU, WorkingSet -AutoSize');
    const [executingCmd, setExecutingCmd] = useState(false);

    // LLM auto-detection state
    const [detecting, setDetecting] = useState(false);
    const [detectResult, setDetectResult] = useState<{
        success: boolean;
        provider: string;
        detectedHardware: { ramGB: number; cores: number; platform: string };
        recommendation: { size: string; details: string; uncensoredFirst: boolean };
        discoveredModels: string[];
        matchedUncensored: string[];
        chosenModel: string;
        message: string;
    } | null>(null);

    // Ollama pull state
    const [pullingModel, setPullingModel] = useState(false);
    const [pullModelName, setPullModelName] = useState('dolphin-llama3');
    const [pullResult, setPullResult] = useState<string | null>(null);

    // Dynamic Dependency State
    const [dependencies, setDependencies] = useState<DepItem[]>([
        // Node packages
        { id: 'genai', name: '@google/genai', category: 'node', desc: 'Neuronowe SDK do integracji z całą gamą modeli Gemini i Deep Research', status: 'pending', checkCmd: 'node -e "try { require(\'@google/genai\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install @google/genai' },
        { id: 'express', name: 'express', category: 'node', desc: 'Serwer API i orkiestrator komunikacji z fizycznymi klastrami i systemem operacyjnym', status: 'pending', checkCmd: 'node -e "try { require(\'express\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install express' },
        { id: 'sqlite3', name: 'better-sqlite3', category: 'node', desc: 'Lokalna, wbudowana baza danych SQLite dla audit logów i scenariuszy roju', status: 'pending', checkCmd: 'node -e "try { require(\'better-sqlite3\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install better-sqlite3' },
        { id: 'canvas', name: 'canvas', category: 'node', desc: 'Modyfikator i silnik renderowania obrazów dla modułu Lego Physics i Game Engine', status: 'pending', checkCmd: 'node -e "try { require(\'canvas\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install canvas' },
        { id: 'motion', name: 'motion', category: 'node', desc: 'Silnik animacji framer-motion/motion dla wysoce responsywnych wejść i przejść UI', status: 'pending', checkCmd: 'node -e "try { require(\'motion\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install motion' },
        { id: 'recharts', name: 'recharts', category: 'node', desc: 'Biblioteka do generowania wizualizacji KPI i grafów obciążenia telemetrycznego d3', status: 'pending', checkCmd: 'node -e "try { require(\'recharts\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install recharts' },
        { id: 'exceljs', name: 'exceljs / xlsx', category: 'node', desc: 'Elementy budujące pliki binarne arkuszy księgowych Microsoft Excel', status: 'pending', checkCmd: 'node -e "try { require(\'exceljs\') || require(\'xlsx\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install exceljs xlsx' },
        { id: 'docx', name: 'docx / jspdf', category: 'node', desc: 'Centrum kompilacji raportów Word (DOCX) oraz eksportu dokumentów Adobe PDF', status: 'pending', checkCmd: 'node -e "try { require(\'docx\') || require(\'jspdf\'); console.log(\'OK\'); } catch(e) { console.log(\'FAIL\'); }"', fixCmd: 'npm install docx jspdf' },

        // Windows system DLLs
        { id: 'vcruntime', name: 'Visual C++ Redistributable 2015-2022 (msvcp140.dll)', category: 'system_win', desc: 'Krytyczne biblioteki DLL wymagane do poprawnego działania modułów natywnych w systemie Windows', status: 'pending', checkCmd: 'powershell -NoProfile -Command "if (Test-Path C:\\Windows\\System32\\vcruntime140.dll) { echo \'OK\' } else { echo \'FAIL\' }"', fixCmd: 'powershell -NoProfile -Command "Start-Process -FilePath \'https://aka.ms/vs/17/release/vc_redist.x64.exe\' -ArgumentList \'/quiet /norestart\' -Wait"' },
        { id: 'sqlite_dll', name: 'sqlite3.dll (System32)', category: 'system_win', desc: 'Zewnętrzna, standalone biblioteka binarnego silnika SQLite skopiowana do folderu systemowego PC', status: 'pending', checkCmd: 'powershell -NoProfile -Command "if (Test-Path C:\\Windows\\System32\\sqlite3.dll) { echo \'OK\' } else { echo \'FAIL\' }"', fixCmd: 'powershell -NoProfile -Command "Invoke-WebRequest -Uri \'https://www.sqlite.org/2026/sqlite-dll-win64-x64-3450300.zip\' -OutFile \'$env:TEMP\\sqlite.zip\'; Expand-Archive -Path \'$env:TEMP\\sqlite.zip\' -DestinationPath \'C:\\Windows\\System32\' -Force"' },
        { id: 'node_gyp', name: 'node-gyp compilers', category: 'system_win', desc: 'Moduł kompilatora ułatwiający automatyczną relokację i przebudowę modułów natywnych na PC', status: 'pending', checkCmd: 'powershell -NoProfile -Command "if (Get-Command node-gyp -ErrorAction SilentlyContinue) { echo \'OK\' } else { echo \'FAIL\' }"', fixCmd: 'npm install --global node-gyp' },

        // Linux system tools
        { id: 'gcc_linux', name: 'build-essential (g++, gcc, make)', category: 'system_linux', desc: 'Kompilatory języka C++ niezbędne do dynamicznej kompilacji modułów natywnych z kodu źródłowego', status: 'pending', checkCmd: 'if command -v g++ &>/dev/null; then echo "OK"; else echo "FAIL"; fi', fixCmd: 'sudo apt-get update && sudo apt-get install -y build-essential' },
        { id: 'sqlite3_linux', name: 'sqlite3 & libsqlite3-dev', category: 'system_linux', desc: 'Sterownik binarnej bazy SQLite oraz biblioteki SDK (wymagane w kontenerach Alpine/Ubuntu)', status: 'pending', checkCmd: 'if command -v sqlite3 &>/dev/null; then echo "OK"; else echo "FAIL"; fi', fixCmd: 'sudo apt-get update && sudo apt-get install -y sqlite3 libsqlite3-dev' },
        { id: 'glibc_linux', name: 'glibc / libc6-dev', category: 'system_linux', desc: 'Główna biblioteka wykonawcza systemu Linux, stanowiąca fundament kompilatorów binarnych', status: 'pending', checkCmd: 'if ldconfig -p | grep libc.so &>/dev/null; then echo "OK"; else echo "FAIL"; fi', fixCmd: 'sudo apt-get update && sudo apt-get install -y libc6-dev' },

        // Containers & Docker
        { id: 'docker_cli', name: 'Docker Client Suite', category: 'container', desc: 'Narzędzie CLI niezbędne do zarządzania kontenerami, replikami i rozproszonymi węzłami robotów', status: 'pending', checkCmd: 'if command -v docker &>/dev/null; then echo "OK"; else echo "FAIL"; fi', fixCmd: 'curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh' },
        { id: 'docker_compose', name: 'Docker Compose Orchestrator', category: 'container', desc: 'Menedżer orkiestracji klastrów pozwalający jednym kliknięciem powołać i połączyć wielopoziomowy rój', status: 'pending', checkCmd: 'if command -v docker-compose &>/dev/null || docker compose version &>/dev/null; then echo "OK"; else echo "FAIL"; fi', fixCmd: 'sudo apt-get update && sudo apt-get install -y docker-compose-plugin' },
    ]);

    const [scanningAll, setScanningAll] = useState(false);
    
    // Swarm AI search/repair state
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<string | null>(null);

    // Clipboard copy state
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Preset PowerShell Commands
    const presets = [
        { label: 'Procesy Node (Node Processes)', cmd: 'Get-Process -Name node* | Format-Table Id, Name, CPU -AutoSize', desc: 'Wyświetla obciążenie serwera Node' },
        { label: 'Informacje o Systemie (OS Info)', cmd: 'Write-Output "=== SYSTEM INFO ==="; [System.Environment]::OSVersion; Write-Output "Cores:"; [System.Environment]::ProcessorCount; Write-Output "Uptime (miliseconds):"; [System.Environment]::TickCount', desc: 'Skanuje parametry jądra i platformę' },
        { label: 'Skaner Portów Roju (Port Scan)', cmd: 'Write-Output "Badanie portu klastra reverse proxy..."; Test-NetConnection -ComputerName localhost -Port 3000 | Format-List', desc: 'Sprawdza drożność portu 3000' },
        { label: 'Struktura Bazy (SQLite Query)', cmd: 'Write-Output "Badanie bazy klastra SQLite..."; Get-ChildItem -Filter *.db', desc: 'Wyszukuje lokalne pliki baz danych' },
    ];

    // Trigger local Hardware & LLM Auto-detection
    const runAutoDetection = async () => {
        setDetecting(true);
        try {
            const res = await api.autoDetectLocalLlm();
            setDetectResult(res);
            // Log to terminal
            setCommandLog(prev => [
                {
                    id: Math.random().toString(),
                    command: 'Invoke-HardwareSensing -Target "Local LLM"',
                    output: `SUCCESS: Auto-tuned network with Local LLM Host.\nProvider: ${res.provider}\nDetected RAM: ${res.detectedHardware.ramGB} GB\nCores: ${res.detectedHardware.cores}\nTarget Platform: ${res.detectedHardware.platform}\nOptimal Model Size: ${res.recommendation.size.toUpperCase()}\nStatus message: ${res.message}`,
                    type: res.success ? 'success' : 'info',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev
            ]);
        } catch (err: any) {
            setDetectResult({
                success: false,
                provider: 'Brak',
                detectedHardware: { ramGB: 4, cores: 2, platform: 'Unknown' },
                recommendation: { size: '1.5b', details: 'Błąd połączenia. Domyślny tryb lekki.', uncensoredFirst: true },
                discoveredModels: [],
                matchedUncensored: [],
                chosenModel: 'dolphin-llama3',
                message: `Wystąpił błąd podczas sondowania lokalnego środowiska: ${err.message}`
            });
        } finally {
            setDetecting(false);
        }
    };

    // Run powershell command
    const handleExecuteCommand = async (cmdText: string) => {
        if (!cmdText.trim() || executingCmd) return;
        setExecutingCmd(true);

        try {
            const res = await api.executePowerShell(cmdText);
            setCommandLog(prev => [
                {
                    id: Math.random().toString(),
                    command: cmdText,
                    output: res.output || '(brak standardowego wyjścia)',
                    err: res.error,
                    type: res.success ? 'success' : 'err',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev
            ]);
        } catch (err: any) {
            setCommandLog(prev => [
                {
                    id: Math.random().toString(),
                    command: cmdText,
                    output: '',
                    err: `Błąd połączenia z API PowerShell: ${err.message}`,
                    type: 'err',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev
            ]);
        } finally {
            setExecutingCmd(false);
        }
    };

    // Pull model via Ollama background endpoint
    const handlePullModel = async () => {
        if (!pullModelName.trim() || pullingModel) return;
        setPullingModel(true);
        setPullResult(null);

        try {
            const res = await api.pullLocalLlmModel('http://localhost:11434', pullModelName);
            setPullResult(res.message);
            // Log to console
            setCommandLog(prev => [
                {
                    id: Math.random().toString(),
                    command: `ollama pull ${pullModelName}`,
                    output: `Wyzwolono procedurę pobierania modelu w Ollama.\nStatus: IN_PROGRESS\nKomunikat: ${res.message}`,
                    type: 'success',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev
            ]);
        } catch (err: any) {
            setPullResult(`Błąd podczas wywoływania pobierania: ${err.message}`);
        } finally {
            setPullingModel(false);
        }
    };

    // Diagnostics logic
    const checkDependency = async (id: string, customList?: DepItem[]) => {
        setDependencies(prev => prev.map(d => d.id === id ? { ...d, status: 'checking', details: undefined } : d));
        const list = customList || dependencies;
        const dep = list.find(d => d.id === id);
        if (!dep) return;

        try {
            const res = await api.executePowerShell(dep.checkCmd);
            const output = (res.output || '').trim();
            const err = (res.error || '').trim();
            
            // Check success logic
            // Since some processes output OK directly
            const isOk = res.success && 
                         (output.toLowerCase().includes('ok') || 
                          (output.length > 0 && !output.toLowerCase().includes('fail') && !err.toLowerCase().includes('not found')));

            setDependencies(prev => prev.map(d => d.id === id ? {
                ...d,
                status: isOk ? 'ok' : 'missing',
                version: isOk ? (output.length > 2 && output.length < 24 ? output : 'Wykryto (vLocal)') : undefined,
                details: err || output || (res.success ? 'Skan zakończony' : 'Błąd wykonywania')
            } : d));

            // Standardize log stream
            setCommandLog(prev => [
                {
                    id: Math.random().toString(),
                    command: `Verify-Dependency -Id "${dep.id}"`,
                    output: `ZAKOŃCZONO SKAN [${dep.name}]: ${isOk ? 'OK' : 'BRAK_BIBLIOTEKI'}\nWyjście: ${output}\nInformacje dodatkowe: ${err}`,
                    type: isOk ? 'success' : 'err',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev
            ]);

        } catch (error: any) {
            setDependencies(prev => prev.map(d => d.id === id ? {
                ...d,
                status: 'failed',
                details: `Błąd komunikacji: ${error.message}`
            } : d));
        }
    };

    const installDependency = async (id: string) => {
        setDependencies(prev => prev.map(d => d.id === id ? { ...d, status: 'checking', details: 'Rozpoczynanie instalacji...' } : d));
        const dep = dependencies.find(d => d.id === id);
        if (!dep) return;

        try {
            setCommandLog(prev => [
                {
                    id: Math.random().toString(),
                    command: `Install-Dependency -Target "${dep.id}"`,
                    output: `Uruchamianie instalatora na systemie gospodarza...\nKomenda: ${dep.fixCmd}`,
                    type: 'info',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev
            ]);

            const res = await api.executePowerShell(dep.fixCmd);
            
            setCommandLog(prev => [
                {
                    id: Math.random().toString(),
                    command: dep.fixCmd,
                    output: res.output || 'Skrypt zakończył pracę pomyślnie.',
                    err: res.error,
                    type: res.success ? 'success' : 'err',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev
            ]);

            // Re-run dynamic check
            await checkDependency(id);

        } catch (err: any) {
            setDependencies(prev => prev.map(d => d.id === id ? {
                ...d,
                status: 'failed',
                details: `Instalacja nie powiodła się: ${err.message}`
            } : d));
        }
    };

    const scanAllDependencies = async () => {
        setScanningAll(true);
        // Only run checks that match the active platform for integrity, 
        // but scan Node dependencies universally since node modules are checked inside the workspace!
        for (const dep of dependencies) {
            if (dep.category === 'node' || 
                (targetPlatform === 'live_container' && dep.category === 'system_linux') || 
                (targetPlatform === 'win_target' && dep.category === 'system_win') ||
                (targetPlatform === 'linux_target' && dep.category === 'system_linux') ||
                dep.category === 'container') {
                await checkDependency(dep.id);
            }
        }
        setScanningAll(false);
    };

    // AI Research / Web search module
    const handleSwarmSearch = async () => {
        if (!searchQuery.trim() || searching) return;
        setSearching(true);
        setSearchResult(null);

        try {
            const prompt = `Jako Główny Orkiestrator Cyber-Roju CYLON OS, przeanalizuj ten problem z biblioteką, pakietem lub plikiem DLL: "${searchQuery}". 
Przejrzyj systemowe dokumentacje i podaj kompleksowy przewodnik naprawczy. 

Odpowiedz w ustrukturyzowanej formie:
### 🔍 CHARAKTERYSTYKA PROBLEMU I DIAGNOZA
Dokładny opis dlaczego ten błąd występuje i jaki ma wpływ na stabilność wieloagentową.

### 🛠️ ROZWIĄZANIA KROK PO KROKU
Wskaż dedykowane drogi naprawcze dla systemów:
- **Windows / Windows Server** (instalacja brakujących DLL, pakiety VC++, instalatory PowerShell)
- **Linux / Docker** (brakujące pakiety systemowe, dev system libraries, apt-get, gyp rebuild)

### 💻 GOTOWE DO URUCHOMIENIA KOD-BLOKI
Udostępnij dokładne, kompletne skrypty naprawcze wraz z instrukcją ich wklejenia. Zapewnij komendy PowerShell, Linux bash oraz npm.`;

            const res = await gemini.assistantHelp(prompt);
            setSearchResult(res);
        } catch (error: any) {
            setSearchResult(`### ⚠️ Błąd Wyszukiwarki Roju\nNie udało się nawiązać połączenia z modułem AI Gemini: ${error.message}`);
        } finally {
            setSearching(false);
        }
    };

    const copyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Run scans and LLM sensing on startup
    useEffect(() => {
        runAutoDetection();
    }, []);

    // Filter dependencies by current tab selections
    const filteredDeps = dependencies.filter(d => {
        if (targetPlatform === 'live_container') {
            return d.category === 'node' || d.category === 'system_linux' || d.category === 'container';
        } else if (targetPlatform === 'win_target') {
            return d.category === 'node' || d.category === 'system_win' || d.category === 'container';
        } else {
            return d.category === 'node' || d.category === 'system_linux' || d.category === 'container';
        }
    });

    const isHealthy = dependencies.every(d => d.status !== 'missing' && d.status !== 'failed');

    return (
        <div className="space-y-6 w-full font-sans text-sm text-slate-300">
            {/* Swarm Intel Header banner */}
            <div className="p-6 bg-gradient-to-r from-[#002040]/80 via-[#001025]/90 to-black/90 border border-acid-cyan/40 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-acid-cyan/10 rounded-full blur-3xl pointer-events-none" />
                <div className="z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <span className="text-[9px] font-black uppercase text-acid-cyan bg-acid-cyan/15 px-2 py-0.5 rounded border border-acid-cyan/30 tracking-widest inline-block mb-2">MODUŁ AUTONOMICZNY CYLON</span>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <Cpu className="w-5 h-5 text-acid-cyan animate-pulse shrink-0" />
                            Zarządzanie Systemem, Diagnostyka & Dependencje
                        </h2>
                        <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed uppercase font-mono">
                            Zarządzaj lokalnymi LLM, uruchamiaj komendy PowerShell bezpośrednio na hoście roju, kontroluj zależności Node.js oraz systemowe biblioteki DLL w Windows/Linux.
                        </p>
                    </div>

                    <div className="flex gap-2.5 w-full md:w-auto shrink-0">
                        <button 
                            onClick={() => setActiveSubTab('terminal')}
                            className={`flex-1 md:flex-initial px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-[11px] transition flex items-center gap-2 justify-center cursor-pointer ${
                                activeSubTab === 'terminal' 
                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                            }`}
                        >
                            <Terminal className="w-4 h-4" /> KONSOLA LLM
                        </button>
                        <button 
                            onClick={() => {
                                setActiveSubTab('dependencies');
                                scanAllDependencies();
                            }}
                            className={`flex-1 md:flex-initial px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-[11px] transition flex items-center gap-2 justify-center cursor-pointer ${
                                activeSubTab === 'dependencies' 
                                ? 'bg-acid-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30 font-black' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                            }`}
                        >
                            <Server className="w-4 h-4" /> HUB ZALEŻNOŚCI & DLL
                        </button>
                    </div>
                </div>
            </div>

            {activeSubTab === 'terminal' ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: POWERSHELL CONSOLE */}
                    <div className="col-span-12 xl:col-span-7 flex flex-col gap-6">
                        <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-5 shadow-xl relative">
                            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse animate-duration-1000"></span>
                                <span className="text-[9px] font-mono text-blue-400 uppercase font-black">PowerShell Console v7.4</span>
                            </div>

                            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2.5">
                                <Terminal size={18} className="text-blue-400 animate-bounce" />
                                KONSOLA TERMINALA POWERSHELL & SYSTEMU
                            </h3>

                            <div className="space-y-2 pt-2">
                                <div className="flex gap-2">
                                    <div className="text-blue-400 font-mono text-xs select-none self-center font-bold px-1.5 py-1 bg-blue-950/40 rounded border border-blue-900/40">PS C:\&gt;</div>
                                    <input 
                                        className="modern-input flex-1 font-mono text-xs text-emerald-400 bg-black/60 border-white/10 focus:border-blue-500 pl-3" 
                                        placeholder="Get-Process | Sort-Object CPU -Descending | Select-Object -First 5..." 
                                        value={manualCmd} 
                                        onChange={e => setManualCmd(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && handleExecuteCommand(manualCmd)}
                                    />
                                    <button 
                                        onClick={() => handleExecuteCommand(manualCmd)} 
                                        disabled={executingCmd || !manualCmd.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-bold uppercase text-[10px] tracking-widest cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                                    >
                                        {executingCmd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play size={12} />}
                                        RUN
                                    </button>
                                </div>
                            </div>

                            {/* Presets Grid */}
                            <div className="space-y-2">
                                <span className="block text-[8px] font-black uppercase text-slate-500 font-mono tracking-widest mb-1">
                                    SZYBKIE PRESETY SKRYPTÓW (SYSTEM & SWARM DIAGNOSTICS):
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {presets.map((p, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => {
                                                setManualCmd(p.cmd);
                                                handleExecuteCommand(p.cmd);
                                            }}
                                            className="p-3 bg-white/[0.01] hover:bg-blue-950/20 rounded-xl border border-white/5 hover:border-blue-500/40 text-left transition duration-200 group cursor-pointer"
                                        >
                                            <div className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:bg-acid-cyan"></span>
                                                {p.label}
                                            </div>
                                            <p className="text-[9px] text-slate-400 mt-1 font-mono leading-tight truncate">{p.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Live Terminal Output Container */}
                            <div className="space-y-1.5">
                                <span className="block text-[8px] font-black uppercase text-slate-500 font-mono tracking-widest">
                                    HISTORIA WYKONAŃ SKRYPTÓW:
                                </span>
                                <div className="bg-black/90 p-4 rounded-2xl border border-white/5 font-mono text-[10px] h-80 overflow-y-auto space-y-4 shadow-inner relative">
                                    {commandLog.length === 0 ? (
                                        <div className="text-slate-600 italic">Brak zarejestrowanych operacji...</div>
                                    ) : (
                                        commandLog.map((log) => (
                                            <div key={log.id} className="border-b border-white/[0.03] pb-3.5 last:border-0 last:pb-0 space-y-1.5">
                                                <div className="flex justify-between items-center text-[9px] text-slate-400 border-b border-white/[0.02] pb-1">
                                                    <span className="font-bold text-blue-400 max-w-[80%] truncate">PS &gt; {log.command}</span>
                                                    <span className="text-[8px] opacity-70 shrink-0 font-mono">{log.timestamp}</span>
                                                </div>
                                                <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-[10px] bg-black/40 p-2 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
                                                    {log.output}
                                                </pre>
                                                {log.err && (
                                                    <div className="text-red-400 text-[10px] bg-red-950/30 p-2 rounded-xl border border-red-500/20 font-mono flex gap-1.5 items-start">
                                                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                                        <div className="whitespace-pre-wrap leading-tight">{log.err}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: HARDWARE SENSING & MODEL TUNER */}
                    <div className="col-span-12 xl:col-span-5 flex flex-col gap-6">
                        <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-5 shadow-xl">
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2.5">
                                <Cpu size={18} className="text-acid-cyan" />
                                DOBÓR LLM & DOPASOWANIE SPRZĘTOWE
                            </h3>

                            {detectResult ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-slate-400 tracking-wider">WYKRYTY SPRZĘT KLASTRA:</span>
                                            <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono rounded font-bold uppercase">✓ Live Sensed</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                                                <span className="block text-[8px] text-slate-500 font-mono">FIZYCZNY RAM</span>
                                                <span className="block text-sm font-bold text-white mt-1">{detectResult.detectedHardware.ramGB} GB</span>
                                            </div>
                                            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                                                <span className="block text-[8px] text-slate-500 font-mono">CPU CORES</span>
                                                <span className="block text-sm font-bold text-white mt-1">{detectResult.detectedHardware.cores} U</span>
                                            </div>
                                            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                                                <span className="block text-[8px] text-slate-500 font-mono">PLATFORMA</span>
                                                <span className="block text-xs font-mono font-bold text-acid-cyan mt-1.5 truncate uppercase">{detectResult.detectedHardware.platform}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendation Box */}
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-acid-cyan/10 to-blue-950/20 border border-acid-cyan/20 space-y-2">
                                        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                                            <Zap className="w-4 h-4 text-acid-cyan" />
                                            <span>REKOMENDACJA SYSTEMOWA CYLON</span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Wykryty rozmiar: <span className="text-white font-bold font-mono">Models {detectResult.recommendation.size.toUpperCase()}</span>. {detectResult.recommendation.details}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Priorytet: Uncensored Models (Nieograniczone)</span>
                                        </div>
                                    </div>

                                    {/* Models in Ollama storage details */}
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                                            <span>ZASOBY LLM W KONTENERZE:</span>
                                            <span className="text-white font-mono">{detectResult.discoveredModels.length} DETECTED</span>
                                        </div>

                                        {detectResult.success ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                                                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                                    <div className="text-[11px] text-slate-300">
                                                        Połączono pomyślnie z serwerem <span className="font-bold text-white">{detectResult.provider}</span>.
                                                    </div>
                                                </div>

                                                {detectResult.discoveredModels.length > 0 ? (
                                                    <div className="bg-black/40 p-3.5 rounded-2xl border border-white/5 space-y-2.5">
                                                        <div>
                                                            <span className="block text-[8px] text-slate-500 font-mono uppercase tracking-wider">Aktualnie załadowany / aktywny model:</span>
                                                            <span className="text-xs font-mono text-acid-cyan font-bold">{detectResult.chosenModel || "Brak wybranego"}</span>
                                                        </div>
                                                        {detectResult.matchedUncensored.length > 0 && (
                                                            <div className="pt-2 border-t border-white/5">
                                                                <span className="text-[8px] font-mono font-black text-emerald-400 uppercase tracking-widest block mb-1">WYKRYTE ZASOBY BEZ CENZURY:</span>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {detectResult.matchedUncensored.map(um => (
                                                                        <span key={um} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 font-mono text-[9px] text-emerald-300 rounded">
                                                                            ★ {um}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-slate-400">
                                                        Połączono z serwerem, ale nie znaleziono pobranych modeli.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-2.5">
                                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                <div className="text-xs text-rose-300 leading-normal">
                                                    Nie wykryto działających w tle usług na domyślnych portach.<br />
                                                    <span className="text-slate-400 font-mono mt-1 block">Zostanie automatycznie załadowany tryb fallback w chmurze Gemini.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                                    <RefreshCw className="animate-spin w-6 h-6 text-acid-cyan/50" />
                                    <span className="text-xs text-slate-500 font-mono">BADANIE TOPOLOGII...</span>
                                </div>
                            )}
                        </div>

                        {/* Model puller */}
                        <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl">
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2.5">
                                <Download size={18} className="text-indigo-400" />
                                INTEGRACJA I PULL MODELI LLM
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                                Pobieraj unfiltrowane modele z bazy Ollama bezpośrednio do pamięci hosta.
                            </p>

                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <span className="block text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">WYBIERZ MODEL DLA ROJU:</span>
                                    <select 
                                        value={pullModelName}
                                        onChange={e => setPullModelName(e.target.value)}
                                        className="w-full bg-black/60 border border-white/5 p-2.5 rounded-xl text-xs font-mono text-white focus:border-blue-500"
                                    >
                                        <option value="dolphin-llama3">dolphin-llama3 (8B, Uncensored - Zalecane)</option>
                                        <option value="mistral:uncensored">mistral:uncensored (7B, Uncensored)</option>
                                        <option value="dolphin-phi">dolphin-phi (2.7B, Uncensored)</option>
                                        <option value="llama3.2">llama3.2 (3B - Standard)</option>
                                        <option value="qwen2.5-coder:7b">qwen2.5-coder:7b (7B - Coder)</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handlePullModel}
                                    disabled={pullingModel || !pullModelName}
                                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
                                >
                                    {pullingModel ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                            POBIERANIE MODELU W TLE...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            WYŚLIJ ZLECENIE PULL
                                        </>
                                    )}
                                </button>
                                {pullResult && (
                                    <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[10px] font-mono text-indigo-300">
                                        {pullResult}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* DEPENDENCY & DIAGNOSTICS WORKSPACE */
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: DEPENDENCY MONITOR & STATUS GRID */}
                    <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                        
                        <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-6 shadow-xl">
                            
                            {/* Platform filter and action header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
                                <div className="space-y-1">
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Server className="w-4 h-4 text-acid-cyan animate-pulse" />
                                        Stan Zasobów i Bibliotek Systemowych
                                    </h3>
                                    <p className="text-[11px] text-slate-400 uppercase font-mono">
                                        Fizyczne monitorowanie modułów wewnątrz bazy roboczej
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                                    {/* State target selection */}
                                    <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 items-center">
                                        <button 
                                            onClick={() => {
                                                setTargetPlatform('live_container');
                                                setTimeout(scanAllDependencies, 50);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer ${
                                                targetPlatform === 'live_container' 
                                                ? 'bg-acid-cyan text-black' 
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            🐳 Live Container
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setTargetPlatform('win_target');
                                                setTimeout(scanAllDependencies, 50);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer ${
                                                targetPlatform === 'win_target' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            🪟 Windows PC
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setTargetPlatform('linux_target');
                                                setTimeout(scanAllDependencies, 50);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer ${
                                                targetPlatform === 'linux_target' 
                                                ? 'bg-orange-600 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            🐧 Linux VPS
                                        </button>
                                    </div>

                                    <button
                                        onClick={scanAllDependencies}
                                        disabled={scanningAll}
                                        className="px-4 py-2 bg-gradient-to-r from-acid-cyan to-blue-600 text-white font-bold text-[10px] uppercase rounded-xl hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                    >
                                        <RefreshCw size={12} className={scanningAll ? 'animate-spin' : ''} />
                                        {scanningAll ? 'Skanowanie...' : 'Skanuj Wszystko'}
                                    </button>
                                </div>
                            </div>

                            {/* Global Health Indicator */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                                isHealthy 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/5 border-red-500/20 text-red-500'
                            }`}>
                                <div className="flex items-center gap-3">
                                    {isHealthy ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <Check className="w-5 h-5 text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <h4 className="font-bold text-xs uppercase text-white tracking-wider">
                                            {isHealthy ? 'System W pełni Zgodny z Wymaganiami' : 'Sondowano Braki w Zależnościach'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 mt-1 leading-none uppercase font-mono">
                                            {isHealthy 
                                            ? 'Wszystkie krytyczne pakiety i interfejsy zostały zweryfikowane pozytywnie.' 
                                            : 'Klastry zgłaszają brakujące biblioteki lub pakiety NPM. Zastosuj automatyczną korektę.'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase border ${
                                    isHealthy 
                                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                                    : 'bg-red-500/10 border-red-500/30'
                                }`}>
                                    {isHealthy ? 'ZABEZPIECZONY [OK]' : 'WYMAGA NAPRAWY'}
                                </span>
                            </div>

                            {/* Dependency List cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredDeps.map(dep => {
                                    return (
                                        <div 
                                            key={dep.id}
                                            className="p-4 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between transition-all duration-200 group text-left"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/10 uppercase font-mono font-bold">
                                                            {dep.category === 'node' ? '📦 Node.js Package' : 
                                                             dep.category === 'system_win' ? '🪟 Windows DLL' : 
                                                             dep.category === 'system_linux' ? '🐧 Linux Lib' : '🐳 Vector Container'}
                                                        </span>
                                                        <h4 className="text-white font-bold text-xs uppercase font-mono mt-1 group-hover:text-acid-cyan transition">
                                                            {dep.name}
                                                        </h4>
                                                    </div>

                                                    {/* Badge statuses */}
                                                    {dep.status === 'checking' && (
                                                        <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                            TEST...
                                                        </span>
                                                    )}
                                                    {dep.status === 'ok' && (
                                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 font-mono">
                                                            <Check className="w-3 h-3 text-emerald-400" />
                                                            ZAINSTALOWANO
                                                        </span>
                                                    )}
                                                    {dep.status === 'missing' && (
                                                        <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 font-mono">
                                                            <X className="w-3 h-3 text-red-400" />
                                                            BRAK / BŁĄD
                                                        </span>
                                                    )}
                                                    {dep.status === 'pending' && (
                                                        <span className="text-[9px] bg-white/5 text-slate-500 border border-white/10 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                                                            NIEBADANY
                                                        </span>
                                                    )}
                                                    {dep.status === 'failed' && (
                                                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                                                            AWARIA SKANU
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-[11px] text-slate-400 leading-normal">
                                                    {dep.desc}
                                                </p>

                                                {dep.version && (
                                                    <div className="bg-black/40 px-2.5 py-1 rounded font-mono text-[9px] text-emerald-400 border border-emerald-500/10 inline-block">
                                                        Status: {dep.version}
                                                    </div>
                                                )}

                                                {dep.details && dep.status !== 'ok' && (
                                                    <div className="bg-red-950/20 border border-red-500/10 p-2.5 rounded-xl font-mono text-[9px] text-red-300 max-h-24 overflow-y-auto leading-tight truncate-3-lines">
                                                        Log: {dep.details}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action tools */}
                                            <div className="flex gap-2.5 mt-4 pt-3 border-t border-white/[0.03]">
                                                {dep.category === 'node' ? (
                                                    <button
                                                        onClick={() => installDependency(dep.id)}
                                                        disabled={dep.status === 'checking'}
                                                        className="flex-1 py-2 rounded-xl bg-acid-cyan/10 hover:bg-acid-cyan hover:text-black border border-acid-cyan/20 font-black uppercase text-[10px] tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5"
                                                    >
                                                        <Download className="w-3.5 h-3.5 shrink-0" />
                                                        Doinstaluj automatycznie
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => copyText(dep.fixCmd, dep.id)}
                                                            className={`flex-1 py-2 rounded-xl font-bold uppercase text-[10px] tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                                                                copiedId === dep.id 
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {copiedId === dep.id ? (
                                                                <>
                                                                    <Check className="w-3.5 h-3.5" /> Skopiowano!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Skopiuj skrypt instalacji
                                                                </>
                                                            )}
                                                        </button>
                                                        {targetPlatform === 'live_container' && (dep.category === 'system_linux' || dep.category === 'container') && (
                                                            <button 
                                                                onClick={() => installDependency(dep.id)}
                                                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold uppercase text-[10px] tracking-wide transition shrink-0 cursor-pointer"
                                                                title="Uruchom skrypt instalatora na bieżącym kontenerze Linux"
                                                            >
                                                                Napraw
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => checkDependency(dep.id)}
                                                    className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition cursor-pointer"
                                                    title="Skanuj ponownie ten pakiet"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${dep.status === 'checking' ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </div>

                    {/* RIGHT COLUMN: SWARM DESIGNATED SEARCH SOLVER & DIAGNOSTICS HELP */}
                    <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                        
                        {/* Wyszukiwarka debug Cyber-Roju */}
                        <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl text-left relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-acid-cyan/5 rounded-full blur-2xl pointer-events-none" />
                            
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                                <Search className="w-4 h-4 text-acid-cyan animate-pulse" />
                                Wyszukiwarka Cyber-Roju (Swarm Solver)
                            </h3>
                            <p className="text-[11px] text-slate-400 uppercase font-mono leading-relaxed">
                                Wklej dowolny kod błędu, brak pliku DLL (np. msvcp140, sqlite3) lub log instalacji. Rój wyszuka i wygeneruje instrukcje naprawy.
                            </p>

                            <div className="space-y-3 pt-2">
                                <textarea
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Np. Error: Cannot find module 'better-sqlite3' lub sqlite3.dll not found..."
                                    className="w-full h-24 bg-black/60 border border-white/5 p-3 rounded-2xl text-xs font-mono text-emerald-400 focus:border-acid-cyan outline-none resize-none leading-relaxed"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            handleSwarmSearch();
                                        }
                                    }}
                                />

                                <button
                                    onClick={handleSwarmSearch}
                                    disabled={searching || !searchQuery.trim()}
                                    className="w-full h-11 bg-gradient-to-r from-acid-cyan to-blue-600 text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
                                >
                                    {searching ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin text-black" />
                                            PRZESZUKIWANE SEKTORY SIECI...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 text-black" />
                                            SZUKAJ ROZWIĄZANIA W ROJU
                                        </>
                                    )}
                                </button>
                            </div>

                            {searchResult && (
                                <div className="mt-4 p-4 rounded-2xl bg-black/80 border border-white/5 font-mono text-[11px] h-96 overflow-y-auto space-y-4 shadow-inner text-slate-300 pointer-events-auto select-text leading-relaxed select-all">
                                    <div className="flex justify-between items-center bg-white/5 -mx-4 -mt-4 px-4 py-2 border-b border-white/5 text-[9px] font-mono text-acid-cyan font-bold">
                                        <span>ZASÓB WYGENEROWANY PRZEZ AI ROJU</span>
                                        <button 
                                            onClick={() => copyText(searchResult, 'result')}
                                            className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white uppercase text-[8px] hover:bg-white/10"
                                        >
                                            {copiedId === 'result' ? 'Skopiowano!' : 'Kopiuj'}
                                        </button>
                                    </div>
                                    <div className="space-y-3 prose prose-invert max-w-none text-left whitespace-pre-wrap">
                                        {searchResult}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Reference Manual card */}
                        <div className="bg-[#121418]/95 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl text-left">
                            <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <BadgeInfo className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                Pomocnik Klastra
                            </h3>
                            <div className="space-y-3 text-[11px] text-slate-400 font-mono">
                                <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                                    <span className="block text-white font-bold mb-1 uppercase text-[10px]">Częsty błąd: sqlite3.dll</span>
                                    Dla Windows, po zainstalowaniu better-sqlite3 za pomocą npm, silnik może wyrzucić błąd modułu binarnego. Rozwiązaniem jest wrzucenie biblioteki sqlite3.dll do folderu System32 lub zainstalowanie narzędzi kompilacji VC++.
                                </div>
                                <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                                    <span className="block text-white font-bold mb-1 uppercase text-[10px]">Częsty błąd: canvas.node</span>
                                    Instalacja canvas wymaga skompilowania kodu natywnego gyp. Na systemach Linux upewnij się, że masz pakiet build-essential, a w Windows zainstalowany compiler g++ za pomocą npm-build-tools.
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

// Simple Fallback BadgeInfo component if needed to prevent compile warnings
const BadgeInfo = ({ className }: { className?: string }) => (
    <Info className={className} size={14} />
);
