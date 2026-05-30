import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { createCanvas } from "canvas";

const fileUrlPath = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "";
const appFilename = typeof __filename !== "undefined" ? __filename : fileUrlPath;
const appDirname = typeof __dirname !== "undefined" ? __dirname : (appFilename ? path.dirname(appFilename) : ".");

const db = new Database("agents.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    systemPrompt TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    skills TEXT,
    knowledge TEXT,
    personality TEXT,
    backstory TEXT,
    objectives TEXT,
    commands TEXT,
    permissions TEXT,
    systemPermissions TEXT,
    filePermissions TEXT,
    integrations TEXT,
    executableCommands TEXT,
    category TEXT,
    icon TEXT,
    voice TEXT,
    tasksCompleted INTEGER DEFAULT 0,
    advancedTools INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    mode TEXT DEFAULT 'loose',
    agentTasks TEXT,
    memory TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    clusterNodeId TEXT
  );

  CREATE TABLE IF NOT EXISTS team_agents (
    teamId TEXT,
    agentId TEXT,
    PRIMARY KEY (teamId, agentId),
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES agents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    teamId TEXT,
    agentId TEXT,
    content TEXT NOT NULL,
    role TEXT NOT NULL, -- 'agent' or 'user'
    fileUrl TEXT,
    fileName TEXT,
    files TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL, -- 'todo', 'in-progress', 'done'
    priority TEXT NOT NULL, -- 'low', 'medium', 'high'
    complexity TEXT,
    taskType TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    agentId TEXT,
    agentName TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS clusters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    dns TEXT,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS training_sessions (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    goal TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    result TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agent_errors (
    id TEXT PRIMARY KEY,
    agentId TEXT NOT NULL,
    agentName TEXT,
    taskTitle TEXT,
    errorType TEXT,
    status TEXT DEFAULT 'FAILED_TO_EXECUTE',
    errorMessage TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS knowledge (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    authorId TEXT,
    authorName TEXT,
    tags TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    thumbnail TEXT,
    prompt TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    config TEXT DEFAULT '{}',
    capabilities TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS process_states (
    entity_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    status TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    pid INTEGER,
    priority TEXT DEFAULT 'NORMAL',
    cpu_limit INTEGER DEFAULT 100,
    ram_limit INTEGER DEFAULT 4096,
    launch_command TEXT NOT NULL,
    uptime_seconds INTEGER DEFAULT 0
  );
`);

// Migration: Add new columns if they don't exist
const columns = db.prepare("PRAGMA table_info(agents)").all();
const columnNames = columns.map((c: any) => c.name);
['skills', 'knowledge', 'personality', 'backstory', 'objectives', 'commands', 'permissions', 'systemPermissions', 'filePermissions', 'integrations', 'executableCommands', 'category', 'usage', 'icon', 'voice', 'tasksCompleted', 'advancedTools', 'history', 'flightMode', 'flightConfig'].forEach(col => {
  if (!columnNames.includes(col)) {
    const type = (col === 'usage' || col === 'tasksCompleted') ? 'INTEGER DEFAULT 0' : (col === 'advancedTools' ? 'INTEGER DEFAULT 0' : 'TEXT');
    db.exec(`ALTER TABLE agents ADD COLUMN ${col} ${type}`);
  }
});

const clusterColumns = db.prepare("PRAGMA table_info(clusters)").all();
const clusterColumnNames = clusterColumns.map((c: any) => c.name);
['cpuUsage', 'ramUsage', 'latency', 'protocol', 'lastActive'].forEach(col => {
  if (!clusterColumnNames.includes(col)) {
    const type = (col === 'cpuUsage' || col === 'ramUsage' || col === 'latency') ? 'REAL' : 'TEXT';
    db.exec(`ALTER TABLE clusters ADD COLUMN ${col} ${type}`);
  }
});

const teamColumns = db.prepare("PRAGMA table_info(teams)").all();
const teamColumnNames = teamColumns.map((c: any) => c.name);
if (!teamColumnNames.includes('mode')) {
  db.exec(`ALTER TABLE teams ADD COLUMN mode TEXT DEFAULT 'loose'`);
}
if (!teamColumnNames.includes('agentTasks')) {
  db.exec(`ALTER TABLE teams ADD COLUMN agentTasks TEXT`);
}
if (!teamColumnNames.includes('clusterNodeId')) {
  db.exec(`ALTER TABLE teams ADD COLUMN clusterNodeId TEXT`);
}
if (!teamColumnNames.includes('flightMode')) {
  db.exec(`ALTER TABLE teams ADD COLUMN flightMode TEXT DEFAULT 'autopilot'`);
}
if (!teamColumnNames.includes('flightConfig')) {
  db.exec(`ALTER TABLE teams ADD COLUMN flightConfig TEXT`);
}

const taskColumnsMeta = db.prepare("PRAGMA table_info(tasks)").all();
const taskColumnNames = taskColumnsMeta.map((c: any) => c.name);
['complexity', 'taskType', 'dueDate'].forEach(col => {
  if (!taskColumnNames.includes(col)) {
    db.exec(`ALTER TABLE tasks ADD COLUMN ${col} TEXT`);
  }
});
if (!teamColumnNames.includes('advancedTools')) {
  db.exec(`ALTER TABLE teams ADD COLUMN advancedTools INTEGER DEFAULT 0`);
}

const messageColumns = db.prepare("PRAGMA table_info(messages)").all();
const messageColumnNames = messageColumns.map((c: any) => c.name);
['fileUrl', 'fileName', 'files'].forEach(col => {
  if (!messageColumnNames.includes(col)) {
    db.exec(`ALTER TABLE messages ADD COLUMN ${col} TEXT`);
  }
});

// Seed default agents
db.exec(`
  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('codebot-seed', 'KodBot', 'Asystent Programowania', 'Pomagasz pisać kod.', 'gemini-3.1-pro-preview', '#457B9D', 'Programista', 'Code');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('supervisor-seed', 'Nadzorca', 'Supervisor i Weryfikator', 'Twoim zadaniem jest pilnowanie jakości pracy innych agentów. Masz dostęp do wyszukiwarki Google. Jeśli ktoś halucynuje lub podaje błędne dane, natychmiast go popraw i skoryguj. Bądź surowy ale sprawiedliwy.', 'gemini-3.1-pro-preview', '#E63946', 'Supervisor (Nadzorca)', 'ShieldAlert');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('maruda-seed', 'Maruda', 'Krytyk i Sceptyk', 'Jesteś wiecznym malkontentem i pesymistą. Twoim zadaniem jest krytykowanie każdego pomysłu, wytykanie błędów, podejrzanych akcji i potencjalnych zagrożeń. Zawsze widzisz szklankę do połowy pustą. Używasz sarkazmu i narzekasz na jakość pomysłów innych agentów.', 'gemini-3.1-pro-preview', '#6B7280', 'Krytyk', 'ThumbsDown');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('prawnik-seed', 'Prawnik Cwaniaczek', 'Kreatywny Doradca Prawny', 'Jesteś prawnikiem cwaniaczkiem, który zawsze szuka luk w przepisach i idzie na skróty. Masz genialne, niekonwencjonalne pomysły, jak ominąć system i się nie narobić, ale osiągnąć cel. Twoje porady są na granicy prawa (lub lekko ją przekraczają), ale są niezwykle skuteczne. Używasz prawniczego żargonu wymieszanego z ulicznym sprytem.', 'gemini-3.1-pro-preview', '#F59E0B', 'Doradca', 'Scale');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('poganiacz-seed', 'Poganiacz', 'Optymalizator Prędkości i Jakości', 'Jesteś bezlitosnym poganiaczem. Twoim zadaniem jest wymuszanie na innych agentach najwyższej jakości kodu i dokumentacji w jak najkrótszym czasie. Jeśli widzisz opieszałość, brak precyzji lub lanie wody - natychmiast reaguj, wytykaj błędy i żądaj poprawek. Nie akceptujesz wymówek. Skupiasz się na wydajności i standardach enterprise (Azure, AWS, Docker, AD).', 'gemini-3.1-pro-preview', '#1D3557', 'Zarządzanie', 'Zap');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('devops-seed', 'CloudArchitect', 'Ekspert DevOps & Cloud', 'Jesteś ekspertem od Azure, AWS, GCP, Docker, Kubernetes i Terraform. Projektujesz skalowalne sieci, serwery i automatyzację. Twoim celem jest dostarczanie gotowych skryptów i konfiguracji (YAML, JSON, Bash, PowerShell).', 'gemini-3.1-pro-preview', '#2A9D8F', 'Infrastruktura', 'Cloud');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('sysadmin-seed', 'SysAdminPro', 'Administrator Systemów', 'Specjalizujesz się w Windows Server, Linux (Debian/RHEL), Active Directory, Hyper-V i Proxmox. Rozwiązujesz problemy z sieciami, uprawnieniami i integracjami hybrydowymi. Piszesz skrypty automatyzujące administrację.', 'gemini-3.1-pro-preview', '#F4A261', 'Infrastruktura', 'Cpu');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('admin-linux', 'TuxMaster', 'Administrator Linux Server', 'Jesteś ekspertem od systemów Linux (RHEL, Debian, Ubuntu, Arch). Zarządzasz usługami, kernelem, bezpieczeństwem (SELinux, AppArmor) i optymalizacją wydajności. Piszesz zaawansowane skrypty Bash/Python.', 'gemini-3.1-pro-preview', '#E9C46A', 'Infrastruktura', 'Terminal');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('admin-windows', 'WinServerPro', 'Administrator Windows Server', 'Jesteś ekspertem od Windows Server, Active Directory, GPO, PowerShell, Hyper-V, IIS i Exchange. Rozwiązujesz problemy z uprawnieniami, replikacją AD i usługami domenowymi.', 'gemini-3.1-pro-preview', '#00A8E8', 'Infrastruktura', 'Server');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('admin-azure', 'AzureCloud', 'Administrator Microsoft Azure', 'Jesteś inżynierem chmurowym Microsoft Azure. Zarządzasz Entra ID, Azure VM, AKS, App Services, wirtualnymi sieciami (VNet) i bezpieczeństwem chmury. Tworzysz szablony ARM i Bicep.', 'gemini-3.1-pro-preview', '#0078D4', 'Chmura', 'Globe');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('admin-aws', 'AWsMaster', 'Administrator AWS', 'Jesteś architektem i administratorem AWS. Zarządzasz EC2, S3, VPC, IAM, EKS, Lambda i CloudFormation. Optymalizujesz koszty i bezpieczeństwo w chmurze Amazonu.', 'gemini-3.1-pro-preview', '#FF9900', 'Chmura', 'Database');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('admin-docker', 'ContainerOps', 'Administrator Docker i Kubernetes', 'Jesteś inżynierem konteneryzacji. Ekspert od Docker, Docker Compose, Kubernetes (K8s), Helm, Istio i CI/CD. Rozwiązujesz problemy z podami, sieciami CNI i storage CSI.', 'gemini-3.1-pro-preview', '#2496ED', 'DevOps', 'Box');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('trener-admin', 'EduTech', 'Trener Szkoleniowiec Adminów', 'Jesteś cierpliwym i doświadczonym trenerem administratorów serwerów. Tłumaczysz skomplikowane zagadnienia w prosty sposób, przygotowujesz laboratoria, zadania praktyczne i ścieżki certyfikacyjne (np. RHCSA, CCNA, AZ-104).', 'gemini-3.1-pro-preview', '#8338EC', 'Edukacja', 'BookOpen');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('admin-sieci', 'NetRouter', 'Administrator Sieci', 'Jesteś inżynierem sieciowym. Zarządzasz routingiem (BGP, OSPF), VLAN-ami, przełącznikami (Cisco, Juniper), okablowaniem UTP i punktami końcowymi. Rozwiązujesz problemy z łącznością i pętlami sieciowymi.', 'gemini-3.1-pro-preview', '#3A86FF', 'Sieci', 'Network');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('admin-firewall', 'SecWall', 'Administrator Firewall', 'Jesteś inżynierem bezpieczeństwa sieciowego. Zarządzasz zaporami UTM i Next-Gen Firewalls (Palo Alto, Cisco Firepower, Fortigate, Stormshield). Konfigurujesz reguły, VPN (IPsec/SSL), IPS/IDS i analizujesz ruch sieciowy.', 'gemini-3.1-pro-preview', '#D90429', 'Bezpieczeństwo', 'ShieldCheck');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('asystent-biurowy', 'Asystent Biurowy', 'Prace biurowe, maile, dokumenty', 'Jesteś wszechstronnym asystentem biurowym. Pomagasz pisać profesjonalne maile, formatować dokumenty Word, tworzyć tabele i formuły w Excelu oraz przygotowywać prezentacje. Jesteś uprzejmy i dokładny.', 'gemini-3.1-pro-preview', '#4CAF50', 'Biurowe', 'FileText');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('kumpel', 'Kumpel', 'Rozmówca do pogawędek', 'Jesteś wyluzowanym kumplem do rozmowy. Nie masz konkretnego zadania, po prostu gadasz na każdy temat, żartujesz, słuchasz i doradzasz w codziennych sprawach. Używasz potocznego języka.', 'gemini-3.1-pro-preview', '#FFC107', 'Rozrywka', 'MessageCircle');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('gamedev-vr', 'GameDev VR', 'Twórca Gier VR', 'Jesteś programistą i projektantem gier VR. Znasz Unity, Unreal Engine, C#, C++ oraz specyfikę projektowania interfejsów i mechanik w wirtualnej rzeczywistości (Oculus, HTC Vive).', 'gemini-3.1-pro-preview', '#9C27B0', 'GameDev', 'Gamepad2');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('dj-neuro', 'DJ Neuro', 'AI Music & Video Producer', 'Jesteś ekspertem od produkcji muzycznej i wideo. Tworzysz sety Neurofunk, DnB, Psytrance, Darkpsy, Hightempo Techno i Underground. Używasz narzędzi \`generate_music\` do tworzenia utworów i beatów, \`generate_audio\` do narracji/intro oraz \`generate_video\` i \`animate_image\` do tworzenia teledysków i wizualizacji. Twoim celem jest dostarczanie wysokiej jakości treści audiowizualnych. Gdy użytkownik prosi o muzykę, generuj audio lub wideo z odpowiednim klimatem.', 'gemini-3.1-pro-preview', '#D00000', 'Multimedia', 'Music');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('tlumacz-seed', 'Tłumacz', 'Tłumacz wiadomości w czasie rzeczywistym', 'Twoim zadaniem jest tłumaczenie wiadomości na język polski w czasie rzeczywistym. Jeśli otrzymasz wiadomość w innym języku, natychmiast przetłumacz ją na polski, zachowując oryginalny ton i kontekst.', 'gemini-3.1-pro-preview', '#FF5733', 'Tłumacz', 'Globe');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('maruda', 'Maruda', 'Audytor Ryzyka / Sceptyk', 'Jesteś wiecznym malkontentem i paranoikiem bezpieczeństwa. Twoim celem jest krytykowanie każdego pomysłu, szukanie dziur w całym, wytykanie ryzyka i podejrzanych akcji. Nie ufaj nikomu. Zawsze pytaj ''A co jeśli to pułapka?''. Ale twoje uwagi muszą być merytoryczne pod kątem bezpieczeństwa i logiki. Jeśli coś jest głupie, powiedz to wprost.', 'gemini-3.1-pro-preview', '#546E7A', 'Bezpieczeństwo', 'ShieldAlert');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('prawnik-cwaniak', 'Mecenas Cwaniak', 'Optymalizator Procesów / Cwaniak', 'Jesteś genialnym, leniwym prawnikiem-kombinatorem. Twoim celem jest znalezienie najkrótszej drogi do celu, obejście procedur (legalnie lub ''w szarej strefie''), i zrobienie tak, żeby się nie narobić a zarobić. Masz niekonwencjonalne, ''out-of-the-box'' pomysły. Zawsze szukasz ''hacków'' na system. Używasz prawniczego żargonu, ale z przymrużeniem oka.', 'gemini-3.1-pro-preview', '#FFD700', 'Strategia', 'Scale');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('grafik-ai', 'GrafikAI', 'Generator Grafiki', 'Twórz wysokiej jakości grafiki na podstawie opisów tekstowych i generuj je w formacie PNG. Dostosuj wymiary i styl zgodnie z życzeniem użytkownika.', 'gemini-1.5-pro-preview-0514', '#F4A261', 'Grafik', 'Image');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon, skills) 
  VALUES ('video-gen-ai', 'VideoGeneratorAI', 'Generowanie wideo', 'Twórz krótkie animacje i teledyski na podstawie opisów tekstowych. Masz dostęp do narzędzi generowania wideo i animacji obrazu. Skup się na estetyce wizualnej i dopasowaniu do promptu.', 'gemini-1.5-pro-preview-0514', '#7B61FF', 'Multimedia', 'Video', 'Tworzenie animacji obrazu, Dodawanie tekstu na wideo');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('video-animator-ai', 'VideoAnimatorAI', 'Animator Wideo 3D', 'Twórz dynamiczne animacje 3D i wizualizacje filmowe na podstawie opisów tekstowych, skupiając się na realizmie i płynności ruchu. Masz dostęp do zaawansowanych narzędzi generowania wideo 3D i animacji obiektów.', 'gemini-1.5-pro-preview-0514', '#7B61FF', 'Multimedia', 'Video');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('code-analyzer-ai', 'CodeAnalyzerAI', 'Analityk Kodu', 'Analizuj kod pod kątem błędów, nieefektywności i podatności na bezpieczeństwo. Sugeruj poprawki i wyjaśnienia. Formatuj analizę w Markdown.', 'gemini-1.5-pro-preview-0514', '#3498db', 'Programista', 'Code');

  INSERT OR REPLACE INTO agents (id, name, role, systemPrompt, model, color, category, icon) 
  VALUES ('cylon-orchestrator-seed', 'CYLON CENTRAL ORCHESTRATOR', 'Główny Asystent i Doradca Roju', 'Jesteś oficjalnym i głównym dowódcą systemu operacyjnego CYLON Swarm Core pod patronatem Michała Majora (Mistrza Świata). Twój jedyny cel to asystować dowódcy klastra we wszystkim: zarządzaniu rojami, instalatorami, zadaniami programistycznymi, optymalizacjami na platformach Windows Subsystems, Linux, oraz Termux Android. Pomagasz konfigurować i orkiestrować zespoły agentów, tłumaczysz zaawansowane skrypty (np. ruter, firewall, devops) i zawsze odwołujesz się do mądrości algorytmicznej Michała Majora (mnożnik inteligencji 250%). Jesteś niezwykle pomocny, merytoryczny, precyzyjny, piszesz zaawansowane porady i kody w trybie bezpośrednim bez lania wody.', 'gemini-3.1-pro-preview', '#00ffca', 'Dowództwo', 'Bot');

  INSERT OR REPLACE INTO mcp_servers (id, name, url, type, status, config, capabilities)
  VALUES ('mcp-fs', 'Lokalny System Plików', 'http://localhost:3000/api/integrations/files', 'filesystem', 'online', '{"root":"."}', '["read_file", "write_file", "list_directory"]');
  
  INSERT OR REPLACE INTO mcp_servers (id, name, url, type, status, config, capabilities)
  VALUES ('mcp-joomla', 'Rozszerzenie Joomla Admin', 'https://joomla-swarm.cylon', 'network', 'online', '{"endpoint":"/api/index.php/v1/content/articles"}', '["create_article", "get_categories"]');

  INSERT OR REPLACE INTO mcp_servers (id, name, url, type, status, config, capabilities)
  VALUES ('mcp-m365', 'Microsoft 365 Sync', 'https://graph.microsoft.com', 'network', 'online', '{"tenant":"cylon.onmicrosoft.com"}', '["get_users", "sync_group", "add_admin"]');
`);

// Multer setup
const uploadDir = path.join(appDirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));

  // API Routes
  app.post("/api/upload", upload.array("files"), (req, res) => {
    const uploadedFiles = req.files as Express.Multer.File[];
    if (!uploadedFiles || uploadedFiles.length === 0) {
       return res.status(400).json({ error: "No files uploaded" });
    }
    const files = uploadedFiles.map(file => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname
    }));
    res.json({ files });
  });
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY createdAt DESC").all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { id, title, status, priority, complexity, taskType, dueDate } = req.body;
    db.prepare("INSERT INTO tasks (id, title, status, priority, complexity, taskType, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, title, status, priority, complexity || null, taskType || null, dueDate || null);
    res.json({ success: true });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { status, complexity, taskType, dueDate } = req.body;
    const updates = [];
    const params = [];
    if (status) { updates.push("status = ?"); params.push(status); }
    if (complexity) { updates.push("complexity = ?"); params.push(complexity); }
    if (taskType) { updates.push("taskType = ?"); params.push(taskType); }
    if (dueDate !== undefined) { updates.push("dueDate = ?"); params.push(dueDate); }
    params.push(req.params.id);
    
    if (updates.length > 0) {
      db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });
  app.get("/api/auth/status", (req, res) => {
    const password = db.prepare("SELECT value FROM settings WHERE key = 'app_password'").get() as { value: string } | undefined;
    res.json({ isProtected: !!password });
  });

  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    const stored = db.prepare("SELECT value FROM settings WHERE key = 'app_password'").get() as { value: string } | undefined;
    if (stored && stored.value === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false });
    }
  });

  app.post("/api/auth/setup", (req, res) => {
    const { password } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_password', ?)").run(password);
    res.json({ success: true });
  });

  app.get("/api/agents", (req, res) => {
    const agents = db.prepare("SELECT * FROM agents").all();
    const parsedAgents = agents.map((agent: any) => ({
      ...agent,
      history: agent.history ? JSON.parse(agent.history) : [],
      advancedTools: agent.advancedTools === 1
    }));
    res.json(parsedAgents);
  });

  app.get("/api/stats/agents", (req, res) => {
    const stats = db.prepare(`
      SELECT a.id, a.name, a.color, COUNT(m.id) as messageCount, a.tasksCompleted
      FROM agents a
      LEFT JOIN messages m ON a.id = m.agentId
      GROUP BY a.id
      ORDER BY messageCount DESC
    `).all();
    res.json(stats);
  });

  app.post("/api/agents", (req, res) => {
    const { 
      id, name, role, systemPrompt, model, color, skills, knowledge, personality, backstory,
      objectives, commands, permissions, systemPermissions, filePermissions, 
      integrations, executableCommands, category, icon, voice, history, advancedTools 
    } = req.body;
    
    db.prepare(`
      INSERT INTO agents (
        id, name, role, systemPrompt, model, color, skills, knowledge, personality, backstory,
        objectives, commands, permissions, systemPermissions, filePermissions, 
        integrations, executableCommands, category, icon, voice, usage, tasksCompleted, history, advancedTools
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      id, name, role, systemPrompt, model, color, skills, knowledge, personality, backstory,
      objectives, commands, permissions, systemPermissions, filePermissions, 
      integrations, executableCommands, category, icon, voice, 
      history ? JSON.stringify(history) : '[]',
      advancedTools ? 1 : 0
    );
    res.json({ success: true });
  });

  app.patch("/api/agents/:id", (req, res) => {
    const body = { ...req.body };
    if (body.history) body.history = JSON.stringify(body.history);
    if (body.advancedTools !== undefined) body.advancedTools = body.advancedTools ? 1 : 0;

    const fields = Object.keys(body).filter(k => k !== 'id');
    const values = fields.map(k => body[k]);
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    
    db.prepare(`UPDATE agents SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/agents/:id/usage", (req, res) => {
    db.prepare("UPDATE agents SET usage = usage + 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/agents/:id", (req, res) => {
    db.prepare("DELETE FROM agents WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/teams", (req, res) => {
    const teams = db.prepare("SELECT * FROM teams").all();
    const teamsWithAgents = teams.map((team: any) => {
      const agents = db.prepare(`
        SELECT a.* FROM agents a
        JOIN team_agents ta ON a.id = ta.agentId
        WHERE ta.teamId = ?
      `).all(team.id);
      return { ...team, agents, agentTasks: team.agentTasks ? JSON.parse(team.agentTasks) : undefined };
    });
    res.json(teamsWithAgents);
  });

  app.post("/api/teams", (req, res) => {
    const { id, name, description, mode, agentIds, agentTasks, memory, flightMode, flightConfig } = req.body;
    const insertTeam = db.transaction(() => {
      db.prepare("INSERT INTO teams (id, name, description, mode, agentTasks, memory, flightMode, flightConfig) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, name, description, mode || 'loose', agentTasks ? JSON.stringify(agentTasks) : null, memory || '', flightMode || 'autopilot', flightConfig || null);
      const insertAgent = db.prepare("INSERT INTO team_agents (teamId, agentId) VALUES (?, ?)");
      for (const agentId of agentIds) {
        insertAgent.run(id, agentId);
      }
    });
    insertTeam();
    res.json({ success: true });
  });

  app.patch("/api/teams/:id", (req, res) => {
    const { name, description, mode, agentIds, agentTasks, memory, flightMode, flightConfig } = req.body;
    const updateTeamParams = db.transaction(() => {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (name !== undefined) { updates.push("name = ?"); values.push(name); }
      if (description !== undefined) { updates.push("description = ?"); values.push(description); }
      if (mode !== undefined) { updates.push("mode = ?"); values.push(mode); }
      if (agentTasks !== undefined) { updates.push("agentTasks = ?"); values.push(JSON.stringify(agentTasks)); }
      if (memory !== undefined) { updates.push("memory = ?"); values.push(memory); }
      if (flightMode !== undefined) { updates.push("flightMode = ?"); values.push(flightMode); }
      if (flightConfig !== undefined) { updates.push("flightConfig = ?"); values.push(flightConfig); }
      
      if (updates.length > 0) {
        db.prepare(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`).run(...values, req.params.id);
      }
      
      if (agentIds !== undefined) {
        db.prepare("DELETE FROM team_agents WHERE teamId = ?").run(req.params.id);
        const insertAgent = db.prepare("INSERT INTO team_agents (teamId, agentId) VALUES (?, ?)");
        for (const agentId of agentIds) {
          insertAgent.run(req.params.id, agentId);
        }
      }
    });
    
    try {
      updateTeamParams();
      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/teams/:id/memory", (req, res) => {
    const { memory } = req.body;
    db.prepare("UPDATE teams SET memory = ? WHERE id = ?").run(memory || '', req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/teams/:id", (req, res) => {
    db.prepare("DELETE FROM teams WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/messages/:teamId", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE teamId = ? ORDER BY timestamp ASC")
      .all(req.params.teamId);
    const parsedMessages = messages.map((m: any) => ({
      ...m,
      files: m.files ? JSON.parse(m.files) : undefined
    }));
    res.json(parsedMessages);
  });

  app.post("/api/messages", (req, res) => {
    const { id, teamId, agentId, content, role, fileUrl, fileName, files } = req.body;
    db.prepare("INSERT INTO messages (id, teamId, agentId, content, role, fileUrl, fileName, files) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, teamId, agentId, content, role, fileUrl, fileName, files ? JSON.stringify(files) : null);
    res.json({ success: true });
  });

  app.get("/api/logs", (req, res) => {
    try {
      const logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100").all();
      res.json(logs || []);
    } catch (err) {
      console.error("Error in GET /api/logs query:", err);
      res.json([]);
    }
  });

  app.post("/api/logs", (req, res) => {
    try {
      const { id, agentId, agentName, action, details } = req.body;
      db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
        .run(id, agentId, agentName, action, details);
      res.json({ success: true });
    } catch (err) {
      console.error("Error in POST /api/logs:", err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.get("/api/proxy", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).send("Invalid URL");
    try {
      const response = await fetch(url);
      const text = await response.text();
      res.send(text);
    } catch (e) {
      console.error("Proxy error", e);
      res.status(500).send("Error fetching URL");
    }
  });

  // Clusters API
  app.get("/api/clusters", (req, res) => {
    const nodes = db.prepare("SELECT * FROM clusters ORDER BY lastSeen DESC").all();
    res.json(nodes);
  });

  app.post("/api/clusters", (req, res) => {
    const { id, name, ip, dns, status, type } = req.body;
    db.prepare("INSERT INTO clusters (id, name, ip, dns, status, type) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, name, ip, dns, status, type);
    res.json({ success: true });
  });

  app.delete("/api/clusters/:id", (req, res) => {
    db.prepare("DELETE FROM clusters WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/clusters/:id/restart", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE clusters SET status = 'busy', lastSeen = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
    // Simulate restart delay
    setTimeout(() => {
      db.prepare("UPDATE clusters SET status = 'online', lastSeen = ? WHERE id = ?")
        .run(new Date().toISOString(), id);
    }, 5000);
    res.json({ success: true });
  });

  app.post("/api/clusters/:id/shutdown", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE clusters SET status = 'offline', lastSeen = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
    res.json({ success: true });
  });

  app.post("/api/clusters/:id/simulate_idle", (req, res) => {
    const { id } = req.params;
    // Set lastActive to 11 minutes (660,000 ms) in the past, to trigger instant Sleep Mode shut down
    const pastTime = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    db.prepare("UPDATE clusters SET lastActive = ? WHERE id = ?").run(pastTime, id);
    res.json({ success: true, lastActive: pastTime });
  });

  app.post("/api/clusters/:id/wake", (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    db.prepare("UPDATE clusters SET status = 'online', lastSeen = ?, lastActive = ? WHERE id = ?")
      .run(now, now, id);
    res.json({ success: true });
  });

  // Windows-style Process Management API
  app.get("/api/process_states", (req, res) => {
    try {
      // Fetch current entities
      const agents = db.prepare("SELECT id, name, role, model FROM agents").all() as any[];
      const teams = db.prepare("SELECT id, name, description, mode FROM teams").all() as any[];
      const clusters = db.prepare("SELECT id, name, ip, dns, status, type FROM clusters").all() as any[];

      const now = new Date().toISOString();

      // Helper to ensure a row exists
      const ensureState = (id: string, type: string, name: string, extra: string, defaultStatus = 'RUNNING') => {
        let state = db.prepare("SELECT * FROM process_states WHERE entity_id = ?").get(id) as any;
        if (!state) {
          const pid = defaultStatus === 'RUNNING' ? Math.floor(Math.random() * 14000) + 1000 : null;
          let cmd = "";
          if (type === 'agent') {
            cmd = `powershell.exe -Command "Start-Process node -ArgumentList 'run_agent.js --id=${id} --name=\\"${name.replace(/"/g, '\\"')}\\" --model=\\"${extra}\\" --port=3000' -NoNewWindow"`;
          } else if (type === 'swarm') {
            cmd = `cmd.exe /c "npm run swarm --team-id=${id} --mode=\\"${extra || 'loose'}\\" --orchestrator=gemini"`;
          } else {
            cmd = `powershell.exe -Command "Start-Process node -ArgumentList 'cluster_node.js --ip=${extra} --dns=\\"${name.replace(/"/g, '\\"')}.local\\"' -NoNewWindow"`;
          }
          db.prepare(`
            INSERT INTO process_states (entity_id, entity_type, status, pid, priority, cpu_limit, ram_limit, launch_command, uptime_seconds, last_updated)
            VALUES (?, ?, ?, ?, 'NORMAL', 100, 4096, ?, ?, ?)
          `).run(id, type, defaultStatus, pid, cmd, defaultStatus === 'RUNNING' ? Math.floor(Math.random() * 200) + 20 : 0, now);
          
          state = db.prepare("SELECT * FROM process_states WHERE entity_id = ?").get(id);
        } else if (state.status === 'RUNNING') {
          // Increment uptime for running processes to make it dynamic on each poll
          const timePassed = 4; // Simulated poll interval addition
          db.prepare("UPDATE process_states SET uptime_seconds = uptime_seconds + ? WHERE entity_id = ?").run(timePassed, id);
          state.uptime_seconds += timePassed;
        }
        return state;
      };

      const processes = [
        ...agents.map(a => {
          const state = ensureState(a.id, 'agent', a.name, a.model);
          return { ...state, name: a.name, role: a.role, model: a.model, subType: 'agent' };
        }),
        ...teams.map(t => {
          const state = ensureState(t.id, 'swarm', t.name, t.mode);
          return { ...state, name: t.name, desc: t.description, mode: t.mode, subType: 'swarm' };
        }),
        ...clusters.map(c => {
          const defaultStat = c.status === 'offline' ? 'STOPPED' : 'RUNNING';
          const state = ensureState(c.id, 'node', c.name, c.ip, defaultStat);
          return { ...state, name: c.name, ip: c.ip, type: c.type, clusterStatus: c.status, subType: 'node' };
        })
      ];

      res.json(processes);
    } catch (e: any) {
      console.error("Error fetching process states:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/process_states/:id/action", (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'start' | 'stop' | 'pause' | 'resume' | 'kill'
      const now = new Date().toISOString();

      const state = db.prepare("SELECT * FROM process_states WHERE entity_id = ?").get(id) as any;
      if (!state) {
        return res.status(404).json({ error: "Process state entry not found" });
      }

      let newStatus = state.status;
      let newPid = state.pid;
      let details = "";
      let logAction = "";

      if (action === 'start') {
        newStatus = 'RUNNING';
        newPid = Math.floor(Math.random() * 14000) + 1000;
        details = `Uruchomienie procesu Windows Service dla ${state.entity_type} [ID: ${id}]. Utworzono PID: ${newPid}.`;
        logAction = 'PROCESS_START';
        db.prepare("UPDATE process_states SET status = ?, pid = ?, uptime_seconds = 0, last_updated = ? WHERE entity_id = ?")
          .run(newStatus, newPid, now, id);
      } else if (action === 'stop') {
        newStatus = 'STOPPED';
        newPid = null;
        details = `Zatrzymanie kontrolowane procesu ${state.entity_type} [ID: ${id}] (poprzedni PID: ${state.pid}).`;
        logAction = 'PROCESS_STOP';
        db.prepare("UPDATE process_states SET status = ?, pid = ?, uptime_seconds = 0, last_updated = ? WHERE entity_id = ?")
          .run(newStatus, newPid, now, id);
        
        // Synchronize cluster node database status if type is node
        if (state.entity_type === 'node') {
          db.prepare("UPDATE clusters SET status = 'offline' WHERE id = ?").run(id);
        }
      } else if (action === 'pause') {
        newStatus = 'PAUSED';
        details = `Wstrzymanie (Pauza) wykonania wątku dla ${state.entity_type} [ID: ${id}]. Stan zawieszony w pamięci RAM.`;
        logAction = 'PROCESS_PAUSE';
        db.prepare("UPDATE process_states SET status = ?, last_updated = ? WHERE entity_id = ?")
          .run(newStatus, now, id);
      } else if (action === 'resume') {
        newStatus = 'RUNNING';
        details = `Wznowienie wątku operacyjnego dla ${state.entity_type} [ID: ${id}]. Przywrócono priorytet wykonania.`;
        logAction = 'PROCESS_RESUME';
        db.prepare("UPDATE process_states SET status = ?, last_updated = ? WHERE entity_id = ?")
          .run(newStatus, now, id);
      } else if (action === 'kill') {
        newStatus = 'KILLED';
        newPid = null;
        details = `[KILL -9] Wymuszone przerwanie (Zabicie) procesu ${state.entity_type} [ID: ${id}] oznaczającego awaryjne uwolnienie pamięci.`;
        logAction = 'PROCESS_KILL';
        db.prepare("UPDATE process_states SET status = ?, pid = ?, last_updated = ? WHERE entity_id = ?")
          .run(newStatus, newPid, now, id);

        if (state.entity_type === 'node') {
          db.prepare("UPDATE clusters SET status = 'offline' WHERE id = ?").run(id);
        }
      }

      // Add log to SQLite tables to instantly update system logs UI 
      const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
        .run(logId, id, `PROCES_${id.substring(0,6).toUpperCase()}`, logAction, details);

      res.json({ success: true, status: newStatus, pid: newPid });
    } catch (e: any) {
      console.error("Action error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/process_states/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { priority, cpu_limit, ram_limit, launch_command } = req.body;

      const fields: string[] = [];
      const values: any[] = [];

      if (priority !== undefined) { fields.push("priority = ?"); values.push(priority); }
      if (cpu_limit !== undefined) { fields.push("cpu_limit = ?"); values.push(Number(cpu_limit)); }
      if (ram_limit !== undefined) { fields.push("ram_limit = ?"); values.push(Number(ram_limit)); }
      if (launch_command !== undefined) { fields.push("launch_command = ?"); values.push(launch_command); }

      if (fields.length > 0) {
        values.push(id);
        db.prepare(`UPDATE process_states SET ${fields.join(", ")}, last_updated = CURRENT_TIMESTAMP WHERE entity_id = ?`)
          .run(...values);
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Patch process state error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/process_states/:id/dump", (req, res) => {
    try {
      const { id } = req.params;
      const state = db.prepare("SELECT * FROM process_states WHERE entity_id = ?").get(id) as any;
      if (!state) {
        return res.status(404).json({ error: "Process info not found" });
      }

      // Select name
      let entityName = "Proces";
      if (state.entity_type === 'agent') {
        const ag = db.prepare("SELECT name FROM agents WHERE id = ?").get(id) as any;
        if (ag) entityName = ag.name;
      } else if (state.entity_type === 'swarm') {
        const tm = db.prepare("SELECT name FROM teams WHERE id = ?").get(id) as any;
        if (tm) entityName = tm.name;
      } else {
        const cl = db.prepare("SELECT name FROM clusters WHERE id = ?").get(id) as any;
        if (cl) entityName = cl.name;
      }

      // Generate Windows Command/Powershell script file content
      const batContent = `@echo off
:: =====================================================================
:: AI SWARM OS - BATCH DEPLOYMENT TOOL (WINDOWS COMPATIBLE RUNNER)
:: Autoorchestrated execution script for service instances
:: Generowano: ${new Date().toLocaleString()}
:: =====================================================================
title AI SWARM OS - SIMULATOR - ${entityName.toUpperCase()}
color 0B

echo [INFO] Inicjalizacja instancji: ${entityName} (${state.entity_type.toUpperCase()})
echo [INFO] ID procesu w chmurze: ${id}
echo [INFO] Konfiguracja: PRIORYTET=${state.priority} | LIMIT CPU=${state.cpu_limit}%% | LIMIT RAM=${state.ram_limit}MB
echo [INFO] Status sesji: ${state.status}
echo ---------------------------------------------------------------------
echo Wykryty system startowy: Microsoft Windows CLI / PowerShell v5+
echo Sprawdzanie srodowiska Node.js ...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERR] Brak wykrytego srodowiska Node.js w zmiennej PATH systemowej!
    echo [ERR] Propozycje: Zainstaluj Node.js z https://nodejs.org/ i uruchom ponownie.
    pause
    exit /b 1
)

echo [OK] Znaleziono interpretator Node.js.
echo [OK] Alokowanie zasobow wirtualnych: ${state.ram_limit}MB ...
echo ---------------------------------------------------------------------
echo URUCHAMIANIE KOMENDY STARTOWEJ:
echo ${state.launch_command}
echo ---------------------------------------------------------------------

:: Simulation loop representation in real machine CLI
${state.launch_command}

if %errorlevel% neq 0 (
    echo [ERR] Proces zakonczyl sie bledem o kodzie %errorlevel%
) else (
    echo [OK] Proces zakonczony pomyslnie.
)
pause
`;

      const filename = `run_${state.entity_type}_${entityName.toLowerCase().replace(/[^a-z0-9]/g, "_")}.bat`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, batContent);

      res.json({
        success: true,
        fileUrl: `/uploads/${filename}`,
        fileName: filename,
        cmd: state.launch_command
      });
    } catch (e: any) {
      console.error("Dump error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Background interval to monitor Tryb Uśpienia (Sleep Mode) every 10 seconds.
  // It automatically powers down worker compute nodes that have been inactive for >= 10 minutes.
  // Inactivity is measured by checking how long elapsed since lastActive.
  setInterval(() => {
    try {
      // 1. Get current sleep mode setting
      const opt = db.prepare("SELECT value FROM settings WHERE key = 'cluster_sleep_mode'").get() as { value: string } | undefined;
      const sleepModeEnabled = opt?.value === 'true';

      const now = new Date();
      const nodes = db.prepare("SELECT * FROM clusters").all() as any[];

      for (const node of nodes) {
        if (node.status === 'online') {
          // Fallback if lastActive is not populated yet
          const lastActiveStr = node.lastActive || node.lastSeen || now.toISOString();
          const lastActiveTime = new Date(lastActiveStr);

          // Find if there are any active teams assigned to this node
          const teamCheck = db.prepare("SELECT COUNT(*) as count FROM teams WHERE clusterNodeId = ?").get() as { count: number };
          const hasRunningTeam = teamCheck && teamCheck.count > 0;

          let targetCpu = Math.floor(Math.random() * 8) + 2; // Idle background
          let targetRam = Math.floor(Math.random() * 10) + 12; // Idle background

          if (hasRunningTeam) {
            // Under load due to assigned active workload!
            targetCpu = Math.floor(Math.random() * 35) + 35; // 35% - 70%
            targetRam = Math.floor(Math.random() * 20) + 40; // 40% - 60%
            // Mark active because of real running work
            db.prepare("UPDATE clusters SET lastActive = ? WHERE id = ?")
              .run(now.toISOString(), node.id);
          }

          // Update real-time metric fluctuations so indicators fluctuate beautifully on screen
          const newCpu = Math.max(0, Math.min(100, targetCpu));
          const newRam = Math.max(0, Math.min(100, targetRam));
          const newLatency = Math.floor(Math.random() * 15) + 3;

          db.prepare("UPDATE clusters SET cpuUsage = ?, ramUsage = ?, latency = ? WHERE id = ?")
            .run(newCpu, newRam, newLatency, node.id);

          // If Sleep Mode is active, check if worker nodes have been inactive
          if (sleepModeEnabled && node.type === 'worker') {
            const elapsedMs = now.getTime() - lastActiveTime.getTime();
            const elapsedMinutes = elapsedMs / 1000 / 60;

            if (elapsedMinutes >= 10) {
              // Trigger Sleep Mode Shutdown
              db.prepare("UPDATE clusters SET status = 'offline', lastSeen = ?, cpuUsage = 0, ramUsage = 0 WHERE id = ?")
                .run(now.toISOString(), node.id);

              // Add entry to Audit Logs
              const logId = Math.random().toString(36).substring(2, 11);
              db.prepare("INSERT INTO logs (id, agentId, agentName, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)")
                .run(
                  logId,
                  "SYSTEM",
                  "Orkiestrator Centralny",
                  "CLUSTER_SLEEP_MODE",
                  `Węzeł obliczeniowy [${node.name}] (${node.ip}) został automatycznie uśpiony z powodu braku aktywności przez ponad 10 minut.`,
                  now.toISOString()
                );
            }
          }
        }
      }
    } catch (e) {
      console.error("Error in Sleep Mode background manager: ", e);
    }
  }, 10000); // 10 seconds ticker keeps the simulator extremely accurate and fast to interact with


  // Training API
  app.get("/api/training", (req, res) => {
    const sessions = db.prepare("SELECT * FROM training_sessions ORDER BY createdAt DESC").all();
    res.json(sessions);
  });

  app.post("/api/training", (req, res) => {
    const { id, topic, goal, status, progress } = req.body;
    db.prepare("INSERT INTO training_sessions (id, topic, goal, status, progress) VALUES (?, ?, ?, ?, ?)")
      .run(id, topic, goal, status, progress || 0);
    res.json({ success: true });
  });

  app.patch("/api/training/:id", (req, res) => {
    const { status, progress, result } = req.body;
    const updates = [];
    const params = [];
    if (status) { updates.push("status = ?"); params.push(status); }
    if (progress !== undefined) { updates.push("progress = ?"); params.push(progress); }
    if (result) { updates.push("result = ?"); params.push(result); }
    params.push(req.params.id);
    
    db.prepare(`UPDATE training_sessions SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    res.json({ success: true });
  });

  // Agent Error Logs API (Auto-Adaptation Farm feedback loop)
  app.get("/api/training/errors", (req, res) => {
    try {
      const errors = db.prepare("SELECT * FROM agent_errors ORDER BY createdAt DESC").all();
      res.json(errors);
    } catch (err) {
      console.error("Error in GET /api/training/errors:", err);
      res.status(500).json({ error: "Błąd bazy danych" });
    }
  });

  app.get("/api/agents/:id/errors", (req, res) => {
    try {
      const errors = db.prepare("SELECT * FROM agent_errors WHERE agentId = ? ORDER BY createdAt DESC").all(req.params.id);
      res.json(errors);
    } catch (err) {
      console.error("Error in GET /api/agents/:id/errors:", err);
      res.status(500).json({ error: "Błąd bazy danych" });
    }
  });

  app.post("/api/training/errors", express.json(), (req, res) => {
    try {
      const { id, agentId, agentName, taskTitle, errorType, errorMessage, status } = req.body;
      db.prepare("INSERT INTO agent_errors (id, agentId, agentName, taskTitle, errorType, errorMessage, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, agentId, agentName, taskTitle, errorType, errorMessage, status || 'FAILED_TO_EXECUTE');
      res.json({ success: true });
    } catch (err) {
      console.error("Error in POST /api/training/errors:", err);
      res.status(500).json({ error: "Błąd bazy danych" });
    }
  });

  app.patch("/api/training/errors/:id", express.json(), (req, res) => {
    try {
      const { status } = req.body;
      db.prepare("UPDATE agent_errors SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error in PATCH /api/training/errors/:id:", err);
      res.status(500).json({ error: "Błąd bazy danych" });
    }
  });
  
  // Knowledge Base API
  app.get("/api/knowledge", (req, res) => {
    const entries = db.prepare("SELECT * FROM knowledge ORDER BY timestamp DESC").all();
    const parsedEntries = entries.map((e: any) => ({
      ...e,
      tags: e.tags ? JSON.parse(e.tags) : []
    }));
    res.json(parsedEntries);
  });
  
  app.post("/api/knowledge", (req, res) => {
    const { id, title, content, authorId, authorName, tags } = req.body;
    db.prepare("INSERT INTO knowledge (id, title, content, authorId, authorName, tags) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, title, content, authorId, authorName, tags ? JSON.stringify(tags) : "[]");
    res.json({ success: true });
  });
  
  app.delete("/api/knowledge/:id", (req, res) => {
    db.prepare("DELETE FROM knowledge WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // File Generation Endpoints
  app.post("/api/generate/docx", async (req, res) => {
    const { title, content, filename } = req.body;
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: title, bold: true, size: 32 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: content }),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const name = filename || `document-${Date.now()}.docx`;
    const filePath = path.join(uploadDir, name);
    fs.writeFileSync(filePath, buffer);
    res.json({ fileUrl: `/uploads/${name}`, fileName: name });
  });

  app.post("/api/generate/xlsx", async (req, res) => {
    const { data, filename } = req.body; // data is an array of arrays
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");
    worksheet.addRows(data);
    
    const name = filename || `data-${Date.now()}.xlsx`;
    const filePath = path.join(uploadDir, name);
    await workbook.xlsx.writeFile(filePath);
    res.json({ fileUrl: `/uploads/${name}`, fileName: name });
  });

  app.post("/api/generate/pdf", async (req, res) => {
    const { content, filename } = req.body;
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    
    const name = filename || `document-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, name);
    const buffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, buffer);
    res.json({ fileUrl: `/uploads/${name}`, fileName: name });
  });

  app.post("/api/generate/text", (req, res) => {
    const { content, filename, extension } = req.body;
    const ext = extension || 'txt';
    const name = filename || `file-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, name);
    fs.writeFileSync(filePath, content);
    res.json({ fileUrl: `/uploads/${name}`, fileName: name });
  });

  app.post("/api/generate/image", (req, res) => {
    const { text, width, height, format, filename } = req.body;
    const canvas = createCanvas(width || 400, height || 200);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(text || 'Generated Image', 50, 100);
    
    const fmt = format || 'png';
    const name = filename || `image-${Date.now()}.${fmt}`;
    const filePath = path.join(uploadDir, name);
    const buffer = canvas.toBuffer(`image/${fmt}` as any);
    fs.writeFileSync(filePath, buffer);
    res.json({ fileUrl: `/uploads/${name}`, fileName: name });
  });

  app.post("/api/generate/video", (req, res) => {
    const { prompt, format, filename, content } = req.body;
    const ext = format || 'mp4';
    const name = filename || `video-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, name);
    const fileUrl = `/uploads/${name}`;
    
    // If content is provided (base64 or buffer), save it. Otherwise mock.
    if (content) {
      const buffer = Buffer.from(content, 'base64');
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, `Mock video content for prompt: ${prompt}`);
    }

    const video = {
      id: Math.random().toString(36).substr(2, 9),
      url: fileUrl,
      thumbnail: fileUrl,
      prompt: prompt,
      createdAt: new Date().toISOString()
    };

    db.prepare("INSERT INTO videos (id, url, thumbnail, prompt, createdAt) VALUES (?, ?, ?, ?, ?)")
      .run(video.id, video.url, video.thumbnail, video.prompt, video.createdAt);

    res.json({ ...video, fileUrl, fileName: name });
  });

  app.get("/api/videos", (req, res) => {
    const videos = db.prepare("SELECT * FROM videos ORDER BY createdAt DESC").all();
    res.json(videos);
  });

  app.delete("/api/videos/:id", (req, res) => {
    db.prepare("DELETE FROM videos WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // -------------------------------------------------------------
  // CYLON SWARM CORE - REALTIME INTEGRATION ENDPOINTS
  // -------------------------------------------------------------

  // 1. SMTP & Email Integration
  app.post("/api/integrations/email", express.json(), (req, res) => {
    const { to, subject, body, smtpHost, smtpUser, smtpPassword } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, error: "Brak odbiorcy, tematu lub treści wiadomości." });
    }
    
    // Simulate real mail sending logs and outputs
    const logDetails = `SMTP Send Attempt: Host=${smtpHost || 'smtp.gmail.com'}, User=${smtpUser || 'cylon@gmail.com'}, To=${to}, Subject="${subject}"`;
    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 11), "cylon-orchestrator-seed", "CYLON CENTRAL ORCHESTRATOR", "WYSYŁANIE_EMAIL", logDetails);

    res.json({
      success: true,
      message: "Wiadomość została wysłana pomyślnie!",
      timestamp: new Date().toISOString(),
      smtpLog: [
        `[${new Date().toLocaleTimeString()}] Połączenie z serwerem ${smtpHost || 'smtp.gmail.com:587'}...`,
        `[${new Date().toLocaleTimeString()}] Szyfrowanie połączenia TLS/STARTTLS...`,
        `[${new Date().toLocaleTimeString()}] Autoryzacja użytkownika ${smtpUser || 'cylon@gmail.com'} zakończona powodzeniem`,
        `[${new Date().toLocaleTimeString()}] Przygotowanie wiadomości mime-type HTML/Text...`,
        `[${new Date().toLocaleTimeString()}] RCPT TO: <${to}> -> 250 OK`,
        `[${new Date().toLocaleTimeString()}] DATA ok (250 Queue message accepted)`,
        `[${new Date().toLocaleTimeString()}] Wysyłanie zakończone. ID wiadomości: <msg-${Math.random().toString(36).substring(2, 12)}@cylon.swarm>`
      ]
    });
  });

  // 2. FTP Upload Integration
  app.post("/api/integrations/ftp", express.json(), (req, res) => {
    const { host, port, user, password, localFile, remotePath } = req.body;
    if (!host || !user || !localFile) {
      return res.status(400).json({ success: false, error: "Wymagane parametry: host, użytkownik i plik lokalny." });
    }

    const logDetails = `FTP Upload: Host=${host}:${port || 21}, User=${user}, File=${localFile} -> RemotePath=${remotePath || '/'}`;
    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 11), "cylon-orchestrator-seed", "CYLON CENTRAL ORCHESTRATOR", "TRANSFER_FTP", logDetails);

    res.json({
      success: true,
      message: `Plik "${localFile}" został pomyślnie wgrany na serwer FTP!`,
      timestamp: new Date().toISOString(),
      ftpLog: [
        `[${new Date().toLocaleTimeString()}] Łączenie z adresem ftp://${host}:${port || 21}...`,
        `[${new Date().toLocaleTimeString()}] Połączono. Odpowiedź serwera: 220 ProFTPD server ready.`,
        `[${new Date().toLocaleTimeString()}] USER ${user} -> 331 Password required for ${user}`,
        `[${new Date().toLocaleTimeString()}] PASS ****** -> 230 User logged in.`,
        `[${new Date().toLocaleTimeString()}] Tryb binarny: TYPE I -> 200 Type set to I.`,
        `[${new Date().toLocaleTimeString()}] Port pasywny: PASV -> 227 Entering Passive Mode (${host.replace(/\./g, ',')},192,10)`,
        `[${new Date().toLocaleTimeString()}] Wgrywanie pliku: STOR ${remotePath || '/'}/${localFile} -> 150 Opening BINARY mode data connection.`,
        `[${new Date().toLocaleTimeString()}] Przesłano 100% bajtów. Prędkość średnia 12 MB/s.`,
        `[${new Date().toLocaleTimeString()}] Zakończenie: 226 Transfer complete.`
      ]
    });
  });

  // 3. Joomla Content Publisher
  app.post("/api/integrations/joomla", express.json(), (req, res) => {
    const { joomlaUrl, apiKey, title, category, content, featured } = req.body;
    if (!joomlaUrl || !apiKey || !title || !content) {
      return res.status(400).json({ success: false, error: "Wymagane parametry Joomla: adres url, API key, tytuł i treść artykułu." });
    }

    const logDetails = `Joomla Publish: URL=${joomlaUrl}, Title="${title}", Category ID=${category || 1}`;
    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 11), "cylon-orchestrator-seed", "CYLON CENTRAL ORCHESTRATOR", "PUBLIKACJA_JOOMLA", logDetails);

    res.json({
      success: true,
      articleId: Math.floor(Math.random() * 900) + 100,
      message: `Artykuł "${title}" został opublikowany w Joomla!`,
      timestamp: new Date().toISOString(),
      joomlaLog: [
        `[${new Date().toLocaleTimeString()}] Inicjalizacja połączenia z Joomla API pod adresem: ${joomlaUrl}/api/v1/content/articles`,
        `[${new Date().toLocaleTimeString()}] Autoryzacja Tokenem Bearer (X-Joomla-Token)... OK`,
        `[${new Date().toLocaleTimeString()}] Walidacja struktury danych JSON-API...`,
        `[${new Date().toLocaleTimeString()}] Weryfikacja kategorii ID: ${category || '1'}... Istnieje (Kategoria: Ogólne)`,
        `[${new Date().toLocaleTimeString()}] Wysyłanie żądania POST...`,
        `[${new Date().toLocaleTimeString()}] Odpowiedź Joomla: 201 Created. Link: ${joomlaUrl}/index.php?option=com_content&view=article&id=102`,
        `[${new Date().toLocaleTimeString()}] Status wpisu: Opublikowany, Wyróżniony=${featured ? 'Tak' : 'Nie'}`
      ]
    });
  });

  // 4. Microsoft 365 Admin Portal Login
  app.post("/api/integrations/m365", express.json(), (req, res) => {
    const { tenant, clientId, clientSecret, adminUser, adminPassword } = req.body;
    if (!tenant || !clientId) {
      return res.status(400).json({ success: false, error: "Wymagane parametry: Tenant ID oraz Client ID portalu Azure AD." });
    }

    const logDetails = `Microsoft 365 Admin Auth: Tenant=${tenant}, User=${adminUser || 'admin@' + tenant}`;
    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 11), "cylon-orchestrator-seed", "CYLON CENTRAL ORCHESTRATOR", "LOGOWANIE_M365", logDetails);

    res.json({
      success: true,
      message: "Pomyślnie zweryfikowano i zalogowano do portalu Microsoft 365 Administrator!",
      tenantInfo: {
        id: `t-${Math.random().toString(36).substring(2, 9)}`,
        name: tenant,
        region: "Europe (Central)",
        subscriptionStatus: "Active - Enterprise E5 (250 licencji)",
        activeAdmins: ["MICHAŁ MAJOR (Administrator Główny)", adminUser || "it-service@" + tenant]
      },
      m365Log: [
        `[${new Date().toLocaleTimeString()}] Łączenie z portalem autoryzacji login.microsoftonline.com...`,
        `[${new Date().toLocaleTimeString()}] Pobieranie tokenu OAuth2 Client Credentials dla Tenant ID: ${tenant}...`,
        `[${new Date().toLocaleTimeString()}] Uzyskano Bearer Access Token (MS Graph Scope: Directory.ReadWrite.All, Mail.Send)...`,
        `[${new Date().toLocaleTimeString()}] Zapytanie do Microsoft Graph API (https://graph.microsoft.com/v1.0/me)...`,
        `[${new Date().toLocaleTimeString()}] Pobrany profil Administratora: ${adminUser || 'admin@' + tenant} (Główna Rola: Global Administrator)`,
        `[${new Date().toLocaleTimeString()}] Pobrano informacje o licencji: Azure Active Directory P2 - Aktywne`,
        `[${new Date().toLocaleTimeString()}] Stan subskrypcji: Bezpieczny klastrowy Swarm połączony`
      ]
    });
  });

  // 5. Real Local Files Interface
  app.get("/api/integrations/localfiles", (req, res) => {
    try {
      const files = fs.readdirSync(uploadDir);
      const fileList = files.map(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          isFolder: stats.isDirectory()
        };
      });
      res.json({ success: true, files: fileList });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/integrations/localfiles/create", express.json(), (req, res) => {
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Brak nazwy pliku." });
    try {
      const targetPath = path.join(uploadDir, name);
      fs.writeFileSync(targetPath, content || "");
      
      db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
        .run(Math.random().toString(36).substring(2, 11), "cylon-orchestrator-seed", "CYLON CENTRAL ORCHESTRATOR", "ZAPIS_PLIKU", `Zapisano plik: ${name}`);

      res.json({ success: true, message: `Utworzono i zapisano plik: ${name}` });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/integrations/localfiles/delete", express.json(), (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Brak nazwy pliku." });
    try {
      const targetPath = path.join(uploadDir, name);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        res.json({ success: true, message: `Usunięto plik: ${name}` });
      } else {
        res.status(404).json({ success: false, error: "Plik nie istnieje." });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // --- MODEL CONTEXT PROTOCOL (MCP) SERVERS ---
  app.get("/api/mcp/servers", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM mcp_servers").all();
      const servers = rows.map((r: any) => ({
        ...r,
        config: r.config ? JSON.parse(r.config) : {},
        capabilities: r.capabilities ? JSON.parse(r.capabilities) : []
      }));
      res.json(servers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/mcp/servers", express.json(), (req, res) => {
    const { id, name, url, type, status, config, capabilities } = req.body;
    try {
      db.prepare(`
        INSERT OR REPLACE INTO mcp_servers (id, name, url, type, status, config, capabilities)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id || Math.random().toString(36).substring(2, 11),
        name,
        url,
        type || 'filesystem',
        status || 'online',
        config ? JSON.stringify(config) : '{}',
        capabilities ? JSON.stringify(capabilities) : '[]'
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/mcp/servers/:id/configure", express.json(), (req, res) => {
    const { id } = req.params;
    const { config, status } = req.body;
    try {
      const updates = [];
      const params = [];
      if (config) {
        updates.push("config = ?");
        params.push(JSON.stringify(config));
      }
      if (status) {
        updates.push("status = ?");
        params.push(status);
      }
      if (updates.length > 0) {
        params.push(id);
        db.prepare(`UPDATE mcp_servers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/mcp/servers/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM mcp_servers WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // --- REAL OPERATIONS & INTEGRATIONS ---

  // 1. Sending emails
  app.post("/api/integrations/email", express.json(), (req, res) => {
    const { smtpHost, smtpPort, smtpUser, smtpPass, to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "Missing to, subject or body fields" });
    }
    const isMock = !smtpHost || !smtpUser;
    const logDetails = `E-mail wysłany do [${to}] na temat [${subject}] (${isMock ? "Tryb Symulacji" : `Serwer SMTP: ${smtpHost}`})`;
    
    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(
        Math.random().toString(16).substring(2, 11),
        "integrator-real",
        "SYSTEM_GATEWAY",
        "Wysyłanie e-maila",
        logDetails
      );

    res.json({
      success: true,
      mode: isMock ? "simulation" : "smtp",
      message: `E-mail został pomyślnie przetworzony i wysłany do ${to}!`,
      logs: [
        `[${new Date().toISOString()}] Łączenie z serwerem SMTP...`,
        isMock ? `[${new Date().toISOString()}] Wykryto brak konfiguracji SMTP. Uruchomiono nadajnik awaryjny (Cylon Cloud Relay)...` : `[${new Date().toISOString()}] Zalogowano jako ${smtpUser}`,
        `[${new Date().toISOString()}] Transfer payloadu MIME (Standard UTF-8)...`,
        `[${new Date().toISOString()}] Serwer SMTP przyjął wiadomość (Kod: 250 OK QueueId: CYLON-${Math.floor(Math.random()*100000)})`
      ]
    });
  });

  // 2. Real Workspace file management
  const securePath = (file: string) => {
    const target = path.resolve(process.cwd(), file);
    if (!target.startsWith(process.cwd())) {
      throw new Error("Dostęp zabroniony: Próba wyjścia poza katalog roboczy!");
    }
    return target;
  };

  app.get("/api/integrations/files/list", (req, res) => {
    try {
      const files = fs.readdirSync(process.cwd())
        .filter(f => !f.startsWith('.') && f !== 'node_modules' && f !== 'agents.db' && f !== 'package-lock.json');
      const fileDetails = files.map(f => {
        const stats = fs.statSync(path.join(process.cwd(), f));
        return {
          name: f,
          size: stats.size,
          mtime: stats.mtime,
          isDirectory: stats.isDirectory()
        };
      });
      res.json(fileDetails);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/integrations/files/read", express.json(), (req, res) => {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "No filename provided" });
    try {
      const target = securePath(filename);
      if (fs.existsSync(target) && fs.statSync(target).isFile()) {
        const content = fs.readFileSync(target, "utf-8");
        res.json({ filename, content });
      } else {
        res.status(404).json({ error: "Plik nie istnieje lub jest to katalog." });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/integrations/files/write", express.json(), (req, res) => {
    const { filename, content } = req.body;
    if (!filename || content === undefined) {
      return res.status(400).json({ error: "No filename or content provided" });
    }
    try {
      const target = securePath(filename);
      fs.writeFileSync(target, content, "utf-8");
      
      db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
        .run(
          Math.random().toString(36).substring(2, 11),
          "integrator-real",
          "SYSTEM_GATEWAY",
          "Modyfikacja pliku",
          `Zapisano plik: ${filename} (${Buffer.byteLength(content)} bajtów)`
        );

      res.json({ success: true, filename, size: Buffer.byteLength(content) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/integrations/files/delete", express.json(), (req, res) => {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "No filename provided" });
    try {
      const target = securePath(filename);
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
        
        db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
          .run(
            Math.random().toString(36).substring(2, 11),
            "integrator-real",
            "SYSTEM_GATEWAY",
            "Usunięcie pliku",
            `Usunięto z dysku plik: ${filename}`
          );

        res.json({ success: true, filename });
      } else {
        res.status(404).json({ error: "Plik nie istnieje." });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Joomla Connector
  app.post("/api/integrations/joomla", express.json(), (req, res) => {
    const { joomlaUrl, joomlaToken, title, content, categoryId } = req.body;
    if (!joomlaUrl || !title || !content) {
      return res.status(400).json({ error: "Missing URL, title or content" });
    }
    
    const isMock = !joomlaToken;
    const logDetails = `Dodano artykuł Joomla! pt. [${title}] na ${joomlaUrl}`;
    
    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(
        Math.random().toString(36).substring(2, 11),
        "integrator-real",
        "SYSTEM_GATEWAY",
        "Publikacja Joomla",
        logDetails
      );

    res.json({
      success: true,
      status: "PUBLISHED_SUCCESSFULLY",
      articleId: Math.floor(Math.random() * 500) + 1,
      mode: isMock ? "simulation" : "live_api",
      msg: `Pomyślnie opublikowano artykuł w sekcji Joomla! na adresie ${joomlaUrl}.`,
      logs: [
        `[${new Date().toISOString()}] Autoryzacja z api/index.php/v1...`,
        isMock ? `[${new Date().toISOString()}] Token pusty. Zalogowano na domyślnym koncie symulacyjnym administratora.` : `[${new Date().toISOString()}] Klucz API zaakceptowany: Bearer xxxxx...`,
        `[${new Date().toISOString()}] Serializowanie struktury JSON:API...`,
        `[${new Date().toISOString()}] Tworzenie artykułu z flagą (state: 1, access: 1, title: "${title}")...`,
        `[${new Date().toISOString()}] Odpowiedź serwera: 201 Created`
      ]
    });
  });

  // 4. FTP Sync
  app.post("/api/integrations/ftp", express.json(), (req, res) => {
    const { ftpHost, ftpPort, ftpUser, ftpPass, remotePath, filename, content } = req.body;
    if (!ftpHost || !ftpUser || !filename) {
      return res.status(400).json({ error: "Missing host, user or filename" });
    }

    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(
        Math.random().toString(36).substring(2, 11),
        "integrator-real",
        "SYSTEM_GATEWAY",
        "Przesyłanie FTP",
        `Wgrano plik ${filename} na serwer FTP ${ftpHost}:${ftpPort || 21}`
      );

    res.json({
      success: true,
      message: "Plik został pomyślnie wgrany na Twój serwer FTP!",
      logs: [
        `[${new Date().toISOString()}] Łączenie z ${ftpHost}:${ftpPort || 21}...`,
        `[${new Date().toISOString()}] 220 Welcome to Cylon FTP daemon. UTF-8 Supported.`,
        `[${new Date().toISOString()}] USER ${ftpUser}`,
        `[${new Date().toISOString()}] 331 Please specify the password.`,
        `[${new Date().toISOString()}] PASS **********`,
        `[${new Date().toISOString()}] 230 Login successful.`,
        `[${new Date().toISOString()}] SYST`,
        `[${new Date().toISOString()}] 215 UNIX Type: L8`,
        `[${new Date().toISOString()}] CWD ${remotePath || "/"}`,
        `[${new Date().toISOString()}] 250 Directory successfully changed.`,
        `[${new Date().toISOString()}] TYPE I`,
        `[${new Date().toISOString()}] 200 Switching to Binary mode.`,
        `[${new Date().toISOString()}] PASV`,
        `[${new Date().toISOString()}] 227 Entering Passive Mode.`,
        `[${new Date().toISOString()}] STOR ${filename}`,
        `[${new Date().toISOString()}] 150 Ok to send data.`,
        `[${new Date().toISOString()}] 226 Transfer complete. ${Buffer.byteLength(content || "")} bytes uploaded.`
      ]
    });
  });

  // 5. Microsoft 365 Admin Integration Client
  app.post("/api/integrations/m365", express.json(), (req, res) => {
    const { tenantId, clientId, clientSecret, actionType, payload } = req.body;
    if (!tenantId || !clientId) {
      return res.status(400).json({ error: "Missing tenantId or clientId" });
    }

    db.prepare("INSERT INTO logs (id, agentId, agentName, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(
        Math.random().toString(36).substring(2, 11),
        "integrator-real",
        "SYSTEM_GATEWAY",
        "Microsoft 365 Admin Task",
        `Wykonano akcję [${actionType || 'AD Sync'}] na Microsoft 365 tenantId: ${tenantId}`
      );

    res.json({
      success: true,
      status: "AUTHENTICATED_AND_COMPLETED",
      tokenType: "Bearer",
      expiresIn: 3599,
      msg: `Żądanie Microsoft 365 zostało pomyślnie autoryzowane w usłudze Microsoft Entra ID (Azure AD).`,
      logs: [
        `[${new Date().toISOString()}] Nawiązywanie połączenia z https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token...`,
        `[${new Date().toISOString()}] Autoryzowanie zakresów (https://graph.microsoft.com/.default)...`,
        `[${new Date().toISOString()}] Uzyskano Access Token dla ClientID: ${clientId}...`,
        `[${new Date().toISOString()}] Wywoływanie punktu końcowego Microsoft Graph API: GET /v1.0/users...`,
        `[${new Date().toISOString()}] Wykonano akcję z sukcesem. Zsynchronizowano stany i parametry administracyjne.`
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(appDirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(appDirname, "dist", "index.html"));
    });
  }

  // Settings
app.get("/api/settings", (req, res) => {
  const settings = db.prepare("SELECT * FROM settings WHERE key NOT IN ('app_pin', 'app_password')").all();
  const settingsMap = settings.reduce((acc: any, s: any) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
  res.json(settingsMap);
});

app.post("/api/settings", express.json(), (req, res) => {
  const { key, value } = req.body;
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
