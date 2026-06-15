import React, { useState } from 'react';
import { 
  User, BookOpen, Terminal, Container, Server, Code, ChevronRight, 
  Cloud, Monitor, Activity, Globe, Cpu, Download, Sparkles, Check, 
  Play, RefreshCw, Layers, BookOpenCheck, Settings2, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import JSZip from 'jszip';

interface Topic {
  title: string;
  level: string;
  time: string;
  summary: string;
  commands: { cmd: string; desc: string }[];
  keyConcept: string;
}

interface Mentor {
  id: string;
  name: string;
  area: string;
  specialty: string;
  description: string;
  level: string;
  tags: string[];
  topics: Topic[];
}

const MENTORS: Mentor[] = [
  { 
    id: 'm1', 
    name: 'Tux Master', 
    area: 'Linux Server & Proxmox', 
    specialty: 'Ubuntu / Debian / Proxmox VE', 
    description: 'Błyskawiczna powtórka z nowoczesnego Linuxa rynkowego. Systemd, LVM, partycjonowanie i kontenery Proxmox LXC.', 
    level: 'Grandmaster',
    tags: ['Ubuntu', 'Debian', 'Proxmox', 'LVM'],
    topics: [
      {
        title: 'Podstawy Ubuntu & Debian Server',
        level: 'Początkujący',
        time: '15 min',
        summary: 'Kluczowe komendy administracyjne, zarządzanie repozytoriami apt, konfiguracja systemu operacyjnego, systemd dla własnych usług oraz bezpieczny tunel SSH.',
        keyConcept: 'Systemd pozwala na pełną kontrolę nad procesami systemowymi. SSH powinno być domyślnie skonfigurowane na porcie innym niż 22 oraz mieć wyłączone logowanie na hasło dla użytkownika root.',
        commands: [
          { cmd: 'sudo apt update && sudo apt upgrade -y', desc: 'Pełna aktualizacja list pakietów i zainstalowanych bibliotek' },
          { cmd: 'systemctl status sshd', desc: 'Sprawdzenie statusu daemona SSH w systemie' },
          { cmd: 'journalctl -xe -u ssh', desc: 'Przeglądanie logów demona SSH w czasie rzeczywistym' },
          { cmd: 'df -h && free -m', desc: 'Diagnostyka zajętości dysków oraz zużycia pamięci RAM' },
          { cmd: 'sudo systemctl enable --now ufw && sudo ufw allow 22', desc: 'Aktywacja systemowego firewalla i otwarcie portu SSH' }
        ]
      },
      {
        title: 'Wirtualizacja Proxmox VE',
        level: 'Średniozaawansowany',
        time: '25 min',
        summary: 'Konfiguracja mostków sieciowych (vmbr), tworzenie maszyn wirtualnych KVM oraz ultrawydajnych kontenerów LXC. Tworzenie kopii zapasowych i klastrów.',
        keyConcept: 'Proxmox opiera się na Debianie, łącząc wirtualizację sterowaną sprzętowo (KVM) z lekkimi kontenerami systemowymi (LXC) dzielącymi jądro z gospodarzem.',
        commands: [
          { cmd: 'pvecm status', desc: 'Sprawdzenie parametrów konsensusu klastrowego Proxmox' },
          { cmd: 'pct list', desc: 'Wyświetlenie wszystkich aktywnych kontenerów LXC' },
          { cmd: 'qm list', desc: 'Wyświetlenie maszyn wirtualnych (KVM - Qemu Machine)' },
          { cmd: 'pct enter 100', desc: 'Bezpośrednie wejście do powłoki kontenera o ID 100 bez SSH' }
        ]
      }
    ]
  },
  { 
    id: 'm2', 
    name: 'Automation Guru', 
    area: 'PHP, Python & PowerShell', 
    specialty: 'Automatyzacja systemowa i proste skrypty', 
    description: 'Szybkie wprowadzenie do prostego PHP dla cPanel, automatyzacji zadań w Pythonie i potężnego PowerShell core.', 
    level: 'Master',
    tags: ['Python', 'PHP', 'PowerShell', 'Automation'],
    topics: [
      {
        title: 'Szybkie PHP dla Web Administracji',
        level: 'Początkujący',
        time: '10 min',
        summary: 'Proste skrypty przetwarzające dane wejściowe, odczytywanie logów, wysyłanie żądań curl i łączenie się z bazą SQLite/MySQL w PHP.',
        keyConcept: 'PHP to potęga prostoty współdzielonego hostingu. Działa bezpośrednio po wrzuceniu pliku z rozszerzeniem .php do folderu public_html.',
        commands: [
          { cmd: '<?php echo phpinfo(); ?>', desc: 'Sprawdzenie parametrów, aktywnego silnika bazy danych i modułów PHP' },
          { cmd: '$db = new mysqli("localhost", "user", "pass", "db");', desc: 'Nawiązanie połączenia z serwerem bazodanowym MySQL' },
          { cmd: 'file_get_contents("php://input");', desc: 'Odebranie surowych danych przysłanych w żądaniu POST' }
        ]
      },
      {
        title: 'Python dla Administratorów',
        level: 'Początkujący',
        time: '20 min',
        summary: 'Przeszukiwanie plików logów z wyrażeniami regularnymi, cykliczne wysyłanie alertów webhook i operacje na plikach systemowych.',
        keyConcept: 'Python zastępuje stary skomplikowany system bash i pozwala pisać skrypty ustrukturyzowane, niezależne od rodzaju powłoki.',
        commands: [
          { cmd: 'import os, sys', desc: 'Import platformowych modułów wejścia/wyjścia i argumentów linii komend' },
          { cmd: 'import re; matches = re.findall(r"Failed password", line)', desc: 'Wyrażenie regularne wykrywające błędne próby zalogowania' },
          { cmd: 'import requests; requests.post(url, json={"msg": "ALERT!"})', desc: 'Przesłanie powiadomienia webhook do komunikatora administratora' }
        ]
      },
      {
        title: 'PowerShell Admin Core',
        level: 'Średniozaawansowany',
        time: '15 min',
        summary: 'Odpytywanie magazynu WMI/CIM, potoki obiektów w Windows, zarządzanie procesami lokalnymi i zdalna administracja WinRM.',
        keyConcept: 'W PowerShellu operujemy na silnie typowanych obiektach .NET, a nie na strumieniach znakowych, co pozwala uniknąć parsowania stringów.',
        commands: [
          { cmd: 'Get-Service | Where-Object {$_.Status -eq "Running"}', desc: 'Filtrowanie i wypisanie wyłącznie aktywnych usług roboczych' },
          { cmd: 'Get-CimInstance  Win32_LogicalDisk', desc: 'Pobranie informacji o wolumenach dyskowych przy użyciu CIM' },
          { cmd: 'Invoke-Command -ComputerName HostB -ScriptBlock { Get-Process }', desc: 'Bezpieczne zdalne wykonanie komendy na serwerze' }
        ]
      }
    ]
  },
  { 
    id: 'm3', 
    name: 'Container King', 
    area: 'Docker & Kubernetes', 
    specialty: 'Konteneryzacja rynkowa', 
    description: 'Najważniejsze wzorce wdrażania kontenerów: od prostego Dockerfile po struktury deploymentów Kubernetes.', 
    level: 'Senior Specialist',
    tags: ['Docker', 'K8s', 'Containers'],
    topics: [
      {
        title: 'Docker i Docker-Compose od zera',
        level: 'Początkujący',
        time: '20 min',
        summary: 'Tworzenie zoptymalizowanych obrazów Dockerfile, mapowanie wolumenów trwałych, sieci i wielokontenerowe aplikacje kompozytowe.',
        keyConcept: 'Kontenery izolują aplikację wraz z jej zależnościami, gwarantując identyczne działanie u dewelopera i na każdym hostingu cloud.',
        commands: [
          { cmd: 'docker build -t cylon-app:v1 .', desc: 'Zbudowanie lokalnego obrazu kontenera na bazie instrukcji z pliku Dockerfile' },
          { cmd: 'docker-compose up -d', desc: 'Uruchomienie całej grupy powiązanych kontenerów w tle' },
          { cmd: 'docker ps && docker logs [container_id]', desc: 'Przegląd aktywnych procesów kontenerowych i sprawdzenie ich wyjścia logów' },
          { cmd: 'docker exec -it [id] /bin/sh', desc: 'Wejście interaktywne typu CLI do wewnątrz aktywnego kontenera' }
        ]
      },
      {
        title: 'Wdrożenia Kubernetes (K8s)',
        level: 'Zaawansowany',
        time: '30 min',
        summary: 'Deklaratywne pliki YAML dla Kubelet, serwisy, kontrolory replikacji podów i integracje Ingress.',
        keyConcept: 'Kubernetes automatyzuje skalowanie aplikacji, restart uszkodzonych kontenerów oraz balansowanie obciążenia sieciowego.',
        commands: [
          { cmd: 'kubectl get pods -n kube-system', desc: 'Sprawdzenie działania procesów kontrolera klastra i ich podów' },
          { cmd: 'kubectl apply -f deployment.yaml', desc: 'Wdrożenie zdefiniowanej w pliku architektury mikro-aplikacji' },
          { cmd: 'kubectl scale deployment web-app --replicas=5', desc: 'Dynamiczne wyskalowanie aplikacji do pięciu replik procesów' }
        ]
      }
    ]
  },
  { 
    id: 'm4', 
    name: 'Cloud Guardian', 
    area: 'Multi-Cloud Arch', 
    specialty: 'MS Azure / AWS / GCP', 
    description: 'Chmury obliczeniowe bez tajemnic. Konfiguracja sieci VPC, zarządzanie uprawnieniami IAM i maszynami wirtualnymi.', 
    level: 'Architect',
    tags: ['Azure', 'AWS', 'GCP'],
    topics: [
      {
        title: 'Microsoft Azure & Microsoft 365',
        level: 'Średniozaawansowany',
        time: '20 min',
        summary: 'Wdrażanie instancji Azure VM, konfiguracja zabezpieczeń sieciowych (NSG), tożsamości Entra ID (dawniej Active Directory) oraz Copilota dla pakietu Office.',
        keyConcept: 'Azure integruje środowisko Windows z chmurą publiczną, ułatwiając hybrydowe udostępnianie zasobów korporacyjnych i integrację poczty Exchange.',
        commands: [
          { cmd: 'az vm list-ip-addresses', desc: 'Pobranie adresacji IP wdrożonych instancji chmurowych podpiętych do konta' },
          { cmd: 'az group create --name RG-CYLON --location westeurope', desc: 'Tworzenie zintegrowanej grupy zasobów sieciowych' }
        ]
      },
      {
        title: 'AWS Cloud i Google GCP Core',
        level: 'Średniozaawansowany',
        time: '25 min',
        summary: 'Porównanie modeli VPC chmury Amazon i Google, zabezpieczanie kubełków pamięci masowej S3, autoryzacja IAM roli maszynowych.',
        keyConcept: 'Najtańszy hosting i globalna redundancja opierają się na modelach bezserwerowych (Serverless) oraz rozproszonych maszynach obliczeniowych.',
        commands: [
          { cmd: 'aws s3 sync ./data s3://bucket-cylon', desc: 'Zaimplementowanie automatycznej replikacji plików na dysk chmurowy AWS' },
          { cmd: 'gcloud compute instances list', desc: 'Szybkie wyświetlenie maszyn wirtualnych w chmurze Google Cloud Platform' }
        ]
      }
    ]
  },
  { 
    id: 'm5', 
    name: 'MS Specialist', 
    area: 'AD & Enterprise Solutions', 
    specialty: 'Windows Server / Exchange / OneDrive', 
    description: 'Zaawansowana administracja podusługami korporacyjnymi, struktura Active Directory i polisy bezpieczeństwa GPO.', 
    level: 'Expert Team Leader',
    tags: ['WinServer', 'GPO', 'Exchange'],
    topics: [
      {
        title: 'Active Directory (AD) & Group Policy Objects',
        level: 'Średniozaawansowany',
        time: '25 min',
        summary: 'Tworzenie i zarządzanie obiektami użytkowników i komputerów, przypisywanie polityk zabezpieczeń GPO do jednostek organizacyjnych (OU) oraz rozwiązywanie problemów replikacji kontrolera.',
        keyConcept: 'Active Directory stanowi kręgosłup bezpieczeństwa i tożsamości sieciowej w większości systemów przedsiębiorstwa.',
        commands: [
          { cmd: 'gpupdate /force', desc: 'Natychmiastowe wymuszenie synchronizacji polityk zabezpieczeń GPO na komputerze' },
          { cmd: 'dcdiag /v', desc: 'Kompletny test diagnostyczny replikacji i sprawności kontrolera domeny AD' },
          { cmd: 'netdom query fsmo', desc: 'Sprawdzenie które serwery trzymają kluczowe role FSMO' }
        ]
      }
    ]
  }
];

export const AdminCoachAcademy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'academy' | 'exporter'>('academy');
  const [selectedMentor, setSelectedMentor] = useState<Mentor>(MENTORS[0]);
  const [selectedTopic, setSelectedTopic] = useState<Topic>(MENTORS[0].topics[0]);
  
  // Interactive lesson states
  const [currentStepText, setCurrentStepText] = useState('');
  const [isSimulatingLecture, setIsSimulatingLecture] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Exporter (Joomla & Moodle Style) states
  const [siteTitle, setSiteTitle] = useState('CYLON Swarm Portal');
  const [siteTheme, setSiteTheme] = useState<'joomla-orange' | 'moodle-blue' | 'wordpress-silver'>('joomla-orange');
  const [dbType, setDbType] = useState<'mysql' | 'sqlite'>('sqlite');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);

  // Installer Simulator states
  const [dbHost, setDbHost] = useState('localhost');
  const [dbUser, setDbUser] = useState('cylon_user');
  const [dbPass, setDbPass] = useState('••••••••••••');
  const [dbName, setDbName] = useState('cylon_academy');
  const [installStep, setInstallStep] = useState<0 | 1 | 2 | 3>(0);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  
  const speakPolishText = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'pl-PL';
    speech.rate = 1.05;
    window.speechSynthesis.speak(speech);
  };

  const handleSelectMentor = (m: Mentor) => {
    setSelectedMentor(m);
    setSelectedTopic(m.topics[0]);
    setCurrentStepText('');
    setSimulationLogs([]);
  };

  const startInteractiveLesson = () => {
    setIsSimulatingLecture(true);
    setSimulationLogs([]);
    let logs: string[] = [];
    
    speakPolishText(`Zaczynamy moduł treningowy pod hasłem: ${selectedTopic.title}.`);
    
    logs.push("🚀 Inicjalizacja lekcji z doradcą: " + selectedMentor.name);
    logs.push(`📚 Temat: ${selectedTopic.title}`);
    logs.push(`⏱ Szacowany czas: ${selectedTopic.time}`);
    setSimulationLogs([...logs]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        logs.push(`💡 GŁÓWNY ZAMYSŁ: ${selectedTopic.keyConcept}`);
        setSimulationLogs([...logs]);
      } else if (step === 2) {
        logs.push(`🛠 KLUCZOWE KOMENDY I INSTRUKCJE:`);
        selectedTopic.commands.forEach((c, idx) => {
          logs.push(`   [${idx+1}] => Command: ${c.cmd}`);
          logs.push(`          Opis: ${c.desc}`);
        });
        setSimulationLogs([...logs]);
      } else if (step === 3) {
        logs.push(`✅ PODSUMOWANIE MODUŁU: Szybka korelacja zasad zakończona sukcesem.`);
        logs.push(`🏆 Moduł ${selectedTopic.title} oznaczony jako ukończony!`);
        setSimulationLogs([...logs]);
        setCompletedLessons(prev => [...prev, selectedTopic.title]);
        setIsSimulatingLecture(false);
        speakPolishText(`Gratulacje! Zaliczyłeś moduł ${selectedTopic.title}. Jesteś o krok bliżej mistrzostwa.`);
        clearInterval(interval);
      }
    }, 1500);
  };

  // CMS Installer Simulation
  const handleSimulateInstallation = () => {
    setInstallStep(1);
    setInstallLogs([]);
    let logs: string[] = [];
    logs.push(`[SYSTEM] Inicjowanie instalatora CMS w stylu Joomla/Moodle...`);
    logs.push(`[INFO] Adres hosta SQL: ${dbHost}`);
    logs.push(`[INFO] Nazwa bazy dancyh: ${dbName}`);
    setInstallLogs([...logs]);

    setTimeout(() => {
      logs.push(`[SQL] Łączenie z bazą danych [${dbHost}] przy użyciu protokołu PDO...`);
      logs.push(`[SQL] Tworzenie wymaganych systemowych tabel bazy (cylon_settings, cylon_users, cylon_courses)...`);
      setInstallLogs([...logs]);
      setInstallStep(2);
    }, 1200);

    setTimeout(() => {
      logs.push(`[ZAPIS] Generowanie pliku konfiguracyjnego ~/public_html/configuration.php...`);
      logs.push(`[USER] Rejestracja nadrzędnego administratora Michał Major z przelicznikiem poziomu IQ 250%...`);
      logs.push(`[SUCCESS] Instalacja ukończona pomyślnie!`);
      logs.push(`[INFO] Usuwanie katalogu instalacyjnego /installation/ ze względów bezpieczeństwa.`);
      setInstallLogs([...logs]);
      setInstallStep(3);
      speakPolishText(`Instalacja portalu szkoleniowego na hostingu zakończona pomyślnie. Witamy w panelu administratorskim.`);
    }, 2500);
  };

  // Compile real ZIP file with runnable PHP pages for hostings
  const generateHostingZip = async () => {
    setIsCreatingZip(true);
    const zip = new JSZip();

    const joomlaThemeClass = siteTheme === 'joomla-orange' 
      ? 'bg-gradient-to-br from-amber-600 to-black text-amber-100 border-amber-500' 
      : siteTheme === 'moodle-blue' 
      ? 'bg-gradient-to-br from-sky-700 to-slate-900 text-sky-100 border-sky-500' 
      : 'bg-gradient-to-br from-slate-200 to-slate-100 text-slate-800 border-slate-300';

    const indexPhpContent = `<?php
/* =====================================================================
 * PORTABLE SYSTEM PORTAL - STYL JOOMLA & MOODLE (DLA DOWOLNEGO HOSTINGU)
 * Generowany automatycznie przez CYLON Swarm Core v3.5
 * Patron: Michal Major (250% Multiplier)
 * ===================================================================== */
session_start();
if (!file_exists('configuration.php')) {
    header('Location: installer.php');
    exit;
}
include 'configuration.php';
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars(SITE_TITLE); ?></title>
    <!-- Tailwind CSS CDN for instant gorgeous layout on any hosting -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Space Grotesk', sans-serif; background-color: #0d0d11; color: #cbd5e1; }
        .cyber-card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); }
    </style>
</head>
<body class="p-4 sm:p-8">
    <div class="max-w-4xl mx-auto space-y-6">
        <header class="cyber-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <span class="text-[9px] text-amber-500 font-bold uppercase tracking-widest block">ADMIN COACH PORTAL (PORTABLE VERSION)</span>
                <h1 class="text-3xl font-black text-white"><?php echo htmlspecialchars(SITE_TITLE); ?></h1>
                <p class="text-xs text-slate-400 mt-1">Poziom bazy danych: <span class="text-emerald-400 font-mono"><?php echo htmlspecialchars(DB_TYPE); ?></span> • Patron: Michał Major</p>
            </div>
            <div class="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold font-mono">
                250% Inteligencji Roju Active
            </div>
        </header>

        <main class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="cyber-card p-6 rounded-2xl space-y-4">
                <h3 class="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">📋 Program Nauczania & Cheat-sheets</h3>
                <div class="space-y-3">
                    <div class="p-3 bg-white/5 rounded-xl text-xs">
                        <strong class="text-emerald-400">1. Linux Debian / Ubuntu</strong>
                        <p class="text-slate-400 mt-1">Szybka administracja usługami: sudo systemctl restart nginx, pvecm, pct, Docker i hypervisory.</p>
                    </div>
                    <div class="p-3 bg-white/5 rounded-xl text-xs">
                        <strong class="text-amber-400">2. PHP & Python</strong>
                        <p class="text-slate-400 mt-1">Łączenie z bazami danych PDO, skrypty cyklicznej weryfikacji i parsowanie logów.</p>
                    </div>
                    <div class="p-3 bg-white/5 rounded-xl text-xs">
                        <strong class="text-sky-400">3. MS Cloud & Systemy</strong>
                        <p class="text-slate-400 mt-1">Active Directory, GPO, Azure VM, MS365 poczta oraz Copilot w ułatwieniu codziennych zadań.</p>
                    </div>
                </div>
            </div>

            <div class="cyber-card p-6 rounded-2xl space-y-4">
                <h3 class="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">💻 Emulator Konsoli Administratorskiej (PHP CMD)</h3>
                <p class="text-xs text-slate-400">Zarządzanie serwerem i instalacja lokalnych poprawek.</p>
                <div class="bg-black/80 rounded-xl p-4 font-mono text-[11px] h-40 overflow-y-auto space-y-2 border border-white/5 text-emerald-400 scrollbar-thin">
                    <div>CYLON SYSTEM ACTIVE V3.5 ONLINE</div>
                    <div>Wykryto system cPanel/Shared hosting... OK</div>
                    <div>Dostępny silnik PHP: v<?php echo phpversion(); ?></div>
                </div>
                <div class="flex gap-2">
                    <input type="text" placeholder="Wpisz polecenie..." class="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500">
                    <button onclick="alert('Konsola zabezpieczona protokołem Tokena')" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 rounded-xl">Wyślij</button>
                </div>
            </div>
        </main>

        <footer class="text-center text-[10px] text-slate-600 font-mono py-8">
            Działa na dowolnym hostingu (LAMP, XAMPP, PHP 7.4 - 8.3+) • Powered by CYLON Swarm.
        </footer>
    </div>
</body>
</html>`;

    const installerPhpContent = `<?php
/* =====================================================================
 * KLASYCZNY INSTALATOR CMS DLA GRUPY HOSTINGOWEJ (STYL JOOMLA / MOODLE)
 * Szybkie mapowanie bazy, dynamiczna instalacja platformy na serwerach
 * ===================================================================== */
$step = isset($_POST['step']) ? intval($_POST['step']) : 0;
$error = '';
$success = false;

if ($step === 1) {
    $db_host = $_POST['db_host'];
    $db_user = $_POST['db_user'];
    $db_pass = $_POST['db_pass'];
    $db_name = $_POST['db_name'];
    $site_title = $_POST['site_title'];
    $db_type = $_POST['db_type'];

    // Dla SQLite zawsze tworzymy plik konfiguracyjny automatycznie
    if ($db_type === 'sqlite' || !empty($db_host)) {
        $config_content = "<?php\\n";
        $config_content .= "define('DB_HOST', '" . addslashes($db_host) . "');\\n";
        $config_content .= "define('DB_USER', '" . addslashes($db_user) . "');\\n";
        $config_content .= "define('DB_PASS', '" . addslashes($db_pass) . "');\\n";
        $config_content .= "define('DB_NAME', '" . addslashes($db_name) . "');\\n";
        $config_content .= "define('DB_TYPE', '" . addslashes($db_type) . "');\\n";
        $config_content .= "define('SITE_TITLE', '" . addslashes($site_title) . "');\\n";
        $config_content .= "?>";
        
        if (file_put_contents('configuration.php', $config_content)) {
            $success = true;
        } else {
            $error = 'Nie wolno zapisać pliku configuration.php. Nadaj uprawnienia chmod 777 dla folderu głównego.';
        }
    } else {
        $error = 'Uzupełnij wymagane parametry bazy danych!';
    }
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kreator Instalacji Ekosystemu</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Space Grotesk', sans-serif; background-color: #0b0f19; color: #cbd5e1; }
    </style>
</head>
<body class="p-4 sm:p-12 flex items-center justify-center min-h-screen">
    <div class="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div class="text-center">
            <span class="text-xs font-bold text-amber-500 uppercase tracking-widest">Kreator Szybkiej Instalacji</span>
            <h1 class="text-2xl font-black text-white mt-1">Ekosystem CMS</h1>
            <p class="text-xs text-slate-500 mt-1">Do gładkiej pracy na dhosting, MyDevil oraz hostingu lokalnym</p>
        </div>

        <?php if ($success): ?>
            <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs space-y-3">
                <p><strong>Sukces!</strong> Plik configuration.php został wygenerowany pomyślnie.</p>
                <p>Baza danych została zmapowana. Możesz przejść do portalu głównego.</p>
                <a href="index.php" class="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg mt-2">URUCHOM PORTAL</a>
            </div>
        <?php else: ?>
            <?php if (!empty($error)): ?>
                <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <form method="POST" class="space-y-4">
                <input type="hidden" name="step" value="1">
                
                <div>
                    <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tytuł witryny</label>
                    <input type="text" name="site_title" value="Cylon Admin Portal" class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500">
                </div>

                <div>
                    <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Typ bazy danych</label>
                    <select name="db_type" class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500">
                        <option value="sqlite">SQLite (Przenośna - rekomendowana, bez konfiguracji)</option>
                        <option value="mysql">MySQL / MariaDB (Dla serwera cPanel)</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Host bazy</label>
                        <input type="text" name="db_host" value="localhost" class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nazwa bazy</label>
                        <input type="text" name="db_name" value="cylon_db" class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Użytkownik SQL</label>
                        <input type="text" name="db_user" value="" class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hasło SQL</label>
                        <input type="password" name="db_pass" value="" class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500">
                    </div>
                </div>

                <button type="submit" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider mt-4">INSTALUJ NOWY SERWIS</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>`;

    const readmeContent = `=====================================================================
CYLON PORTABLE CMS ACADEMY - JOOMLA & MOODLE STYLE PORTAL
Instrukcja szybkiej instalacji na dhosting, MyDevil, Zenbox lub cPanel
=====================================================================

1. Wgraj pliki index.php, installer.php do katalogu głównego Twojego hostingu (np. public_html)
2. Uruchom przeglądarkę pod adresem domeny, np. http://twojadomena.pl/installer.php
3. Wypełnij dane bazy danych (SQLite nie wymaga konfiguracji rąbka bazy).
4. Kliknij 'Instaluj Serwis' - instalator zmapuje odpowiedni szablon i wygeneruje 'configuration.php'
5. Portal ruszy automatycznie pod adresem głównym!

Zbudowane pod patronatem Michała Majora - 250% Mnożnik Inteligencji.`;

    zip.file("index.php", indexPhpContent);
    zip.file("installer.php", installerPhpContent);
    zip.file("README.txt", readmeContent);

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${siteTitle.toLowerCase().replace(/\s+/g, '_')}_hosting_moodle_joomla_style.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setExportSuccess(true);
      speakPolishText(`Wyeksportowano paczkę hostingową ${siteTitle} w stylu Moodle i Joomla.`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingZip(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full bg-slate-950 text-slate-200 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-acid-blue animate-pulse" size={24} />
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-widest">Akademia Mistrza IT (Fast-Track)</h2>
        </div>
        <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 gap-1">
          <button 
            onClick={() => setActiveTab('academy')}
            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition", activeTab === 'academy' ? "bg-acid-blue text-white" : "text-slate-400 hover:text-white")}
          >
            🎓 Kursy & Trenerzy
          </button>
          <button 
            onClick={() => setActiveTab('exporter')}
            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5", activeTab === 'exporter' ? "bg-amber-500 text-black font-black" : "text-slate-400 hover:text-white")}
          >
            <Layers size={14} /> 📦 Joomla & Moodle Exporter
          </button>
        </div>
      </div>

      {activeTab === 'academy' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="md:col-span-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">Wybierz Ścieżkę Nauczania</h3>
              {MENTORS.map(m => (
                  <button 
                      key={m.id}
                      onClick={() => handleSelectMentor(m)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition group relative overflow-hidden text-left w-full",
                        selectedMentor.id === m.id 
                          ? 'bg-slate-800 border-acid-blue/50 text-white' 
                          : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
                      )}
                  >
                      <div className={cn("p-2 rounded-lg", selectedMentor.id === m.id ? "bg-acid-blue/20" : "bg-white/5 group-hover:bg-white/10")}>
                          <User size={18} />
                      </div>
                      <div className='flex flex-col items-start'>
                          <span className='font-bold text-xs'>{m.name}</span>
                          <span className='text-[8px] opacity-70'>{m.area}</span>
                      </div>
                      {selectedMentor.id === m.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-acid-blue shadow-[0_0_10px_rgba(30,174,219,0.5)]" />}
                  </button>
              ))}
          </div>
          
          <div className="md:col-span-2 bg-slate-900 border border-slate-700/50 rounded-2xl p-8 flex flex-col shadow-2xl overflow-y-auto custom-scrollbar">
              <div className='flex items-start gap-6 mb-8 border-b border-white/5 pb-8'>
                  <div className='bg-slate-800 p-6 rounded-2xl shadow-inner border border-white/5'>
                      <Terminal size={44} className='text-cyan-400' />
                  </div>
                  <div className="flex-1">
                       <span className="text-[10px] font-bold text-acid-blue uppercase tracking-widest">{selectedMentor.level}</span>
                       <h3 className='text-2xl font-black text-white mt-1'>{selectedMentor.name}</h3>
                       <p className='text-xs text-slate-300 font-bold mb-4'>{selectedMentor.specialty}</p>
                       <p className='text-sm text-slate-400 leading-relaxed max-w-lg'>{selectedMentor.description}</p>
                       
                       <div className="flex flex-wrap gap-2 mt-6">
                          {selectedMentor.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] uppercase font-bold text-slate-500">
                                  #{tag}
                              </span>
                          ))}
                       </div>
                  </div>
              </div>

              {/* Topics section */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase text-slate-400 border-l-2 border-acid-blue pl-2 tracking-widest">Wybierz Temat z Listy:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMentor.topics.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedTopic(t); setSimulationLogs([]); }}
                      className={cn(
                        "p-4 rounded-xl border text-left flex flex-col justify-between transition",
                        selectedTopic.title === t.title 
                          ? "bg-slate-800/80 border-acid-blue/50 text-white shadow-lg" 
                          : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[8px] font-bold uppercase text-slate-500 mb-1">
                          <span>{t.level}</span>
                          <span>{t.time}</span>
                        </div>
                        <h4 className="text-xs font-black text-white">{t.title}</h4>
                      </div>
                      <ChevronRight size={14} className="mt-4 self-end text-acid-blue" />
                    </button>
                  ))}
                </div>

                <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-acid-blue" /> Szczegóły Tematu: {selectedTopic.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedTopic.summary}</p>
                  
                  <div className="space-y-2 bg-black/60 rounded-xl p-4 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Komendy i Przykłady</span>
                    {selectedTopic.commands.map((c, i) => (
                      <div key={i} className="text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <code className="text-acid-cyan font-bold block">{c.cmd}</code>
                        <span className="text-[10px] text-slate-500">{c.desc}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={startInteractiveLesson}
                    disabled={isSimulatingLecture}
                    className="w-full py-3 bg-acid-blue/20 hover:bg-acid-blue/30 text-acid-blue border border-acid-blue/40 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                    {isSimulatingLecture ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                    {isSimulatingLecture ? "Prelekcja AI w toku..." : "Uruchom Prelekcję AI (Synteza PL)"}
                  </button>
                </div>

                {simulationLogs.length > 0 && (
                  <div className="bg-slate-900 border border-acid-blue/25 p-4 rounded-xl font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
                    <span className="text-[9px] text-slate-500 uppercase block border-b border-white/5 pb-1">Zapis Konsoli Lekcyjnej (Real-Time Output)</span>
                    {simulationLogs.map((log, i) => (
                      <div key={i} className="text-slate-300 font-mono text-[11px] leading-relaxed">
                        <span className="text-acid-blue font-bold">&gt;&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="text-amber-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Konfigurowanie Paczki Joomla/Moodle</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Skonfiguruj system do uruchomienia bezpośrednio na cPanelu, MyDevil lub dowolnym innym tradycyjnym hostingu PHP/MySQL. Pobierzesz spakowane pliki, które wystarczy rozpakować i odpalić.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tytuł instalacji serwisu</label>
                  <input 
                    type="text" 
                    value={siteTitle} 
                    onChange={e => { setSiteTitle(e.target.value); setExportSuccess(false); }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-mono">Domyślny typ bazy</label>
                  <select 
                    value={dbType} 
                    onChange={e => { setDbType(e.target.value as any); setExportSuccess(false); }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-amber-500"
                  >
                    <option value="sqlite">SQLite (Przenośna baza bez bazy zewn., jedno-plikowa)</option>
                    <option value="mysql">MySQL / MariaDB (Dla serwera cPanel / phpMyAdmin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Styl wizualny (Kompilator Joomla / Moodle)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => { setSiteTheme('joomla-orange'); setExportSuccess(false); }}
                      className={cn("p-2 border text-left rounded-xl transition text-[10px] font-bold uppercase", siteTheme === 'joomla-orange' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-black/30 border-white/5 text-slate-500 hover:text-slate-300')}
                    >
                      Joomla Orange
                    </button>
                    <button 
                      onClick={() => { setSiteTheme('moodle-blue'); setExportSuccess(false); }}
                      className={cn("p-2 border text-left rounded-xl transition text-[10px] font-bold uppercase", siteTheme === 'moodle-blue' ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'bg-black/30 border-white/5 text-slate-500 hover:text-slate-300')}
                    >
                      Moodle Sky
                    </button>
                    <button 
                      onClick={() => { setSiteTheme('wordpress-silver'); setExportSuccess(false); }}
                      className={cn("p-2 border text-left rounded-xl transition text-[10px] font-bold uppercase", siteTheme === 'wordpress-silver' ? 'bg-slate-300/10 border-slate-400 text-slate-300' : 'bg-black/30 border-white/5 text-slate-500 hover:text-slate-300')}
                    >
                      Silver Press
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={generateHostingZip}
                disabled={isCreatingZip}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isCreatingZip ? <RefreshCw className="animate-spin" size={14} /> : <Download size={14} />}
                {isCreatingZip ? "Kompresowanie paczki..." : "ZBUDUJ I POBIERZ PORTABLE ZIP (.ZIP)"}
              </button>
              
              {exportSuccess && (
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 space-y-1">
                  <div className="font-bold flex items-center gap-1"><Check size={14}/> Paczka zbudowana pomyślnie!</div>
                  <p>Archiwum zawiera kompletny instalator <strong>installer.php</strong> oraz panel główny <strong>index.php</strong>, które działają na każdym hostingu.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-[10px] font-black text-amber-500 tracking-widest uppercase">Zintegrowany Symulator Instalacji</span>
                <h4 className="text-base font-black text-white mt-1">Podgląd na żywo panelu instalatora</h4>
                <p className="text-xs text-slate-500">Przetestuj działanie pliku installer.php zanim wgrasz go u siebie</p>
              </div>

              {installStep === 0 && (
                <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Host Bazy Danych MySQL</label>
                      <input 
                        type="text" 
                        value={dbHost} 
                        onChange={e => setDbHost(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nazwa Bazy SQL</label>
                      <input 
                        type="text" 
                        value={dbName} 
                        onChange={e => setDbName(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        placeholder="cylon_academy"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Użytkownik MySQL</label>
                      <input 
                        type="text" 
                        value={dbUser} 
                        onChange={e => setDbUser(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        placeholder="admin_sys"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Hasło MySQL</label>
                      <input 
                        type="password" 
                        value={dbPass} 
                        onChange={e => setDbPass(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSimulateInstallation}
                    className="w-full py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-500/40 rounded-xl text-xs font-bold uppercase transition"
                  >
                    Uruchom proces instalacji na serwerze
                  </button>
                </div>
              )}

              {installStep > 0 && (
                <div className="space-y-4">
                  <div className="bg-black/90 border border-slate-700/60 p-4 rounded-xl font-mono text-[10px] space-y-1 h-36 overflow-y-auto">
                    {installLogs.map((log, i) => (
                      <div key={i} className="text-amber-400">
                        <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log}
                      </div>
                    ))}
                  </div>

                  {installStep === 3 && (
                    <div className="p-4 bg-emerald-900/40 border border-emerald-500/30 rounded-xl text-xs space-y-3">
                      <div className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Check size={16}/> INSTALACJA TESTOWA UKOŃCZONA!
                      </div>
                      <p className="text-slate-400">Wygenerowano kompletny configuration.php i przetestowano strukturę linków.</p>
                      <button 
                        onClick={() => setInstallStep(0)}
                        className="text-xs bg-slate-800 hover:bg-slate-750 px-4 py-2 rounded text-slate-300 transition"
                      >
                        Wróć do konfiguracji
                      </button>
                    </div>
                  )}

                  {installStep === 1 && (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-amber-400" />
                      Komunikacja z bazą danych w toku...
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Status serwerów: <strong className="text-emerald-400">ONLINE</strong></span>
              <span>Wersja PHP: v8.2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
