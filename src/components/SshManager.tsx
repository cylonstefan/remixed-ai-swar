import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Plus, Trash2, Key, Server, Hash, User, Network, Wifi, Play, Search, Copy, Download, ShieldAlert, Cpu, Layers, HelpCircle, CheckCircle2, ChevronRight, RefreshCw, X, Github } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { ClusterNode } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const ASSIGNED_COLORS = [
    '#06B6D4', // Acid Cyan
    '#A855F7', // Acid Purple
    '#10B981', // Acid Green
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#F97316', // Orange
];

type SshProfile = {
    id: string;
    name: string;
    host: string;
    port: string;
    user: string;
    key: string;
};

type SshLogEntry = {
    id: string;
    timestamp: string;
    profileName: string;
    connectionInfo: string;
    command: string;
    output: string;
    status: 'success' | 'error' | 'running' | 'connecting';
};

export const SshManager = () => {
    const [profiles, setProfiles] = useState<SshProfile[]>([]);
    const [newProfile, setNewProfile] = useState<Omit<SshProfile, 'id'>>({ name: '', host: '', port: '22', user: '', key: '' });
    const [nodes, setNodes] = useState<ClusterNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<string>('');
    const [selectedProfile, setSelectedProfile] = useState<string>('');
    const [tunnelLog, setTunnelLog] = useState<string[]>([]);

    // Terminal & Command Live State
    const [activeConsoleProfile, setActiveConsoleProfile] = useState<string>('');
    const [commandInput, setCommandInput] = useState<string>('');
    const [isExecuting, setIsExecuting] = useState<boolean>(false);
    const [logs, setLogs] = useState<SshLogEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // GitHub SSH Key integration state
    const [githubUser, setGithubUser] = useState<string>('');
    const [isAddingKey, setIsAddingKey] = useState<boolean>(false);
    const [githubKeyLog, setGithubKeyLog] = useState<string[]>([]);

    // Initial seed mock entries for a lively experience
    const initialLogs: SshLogEntry[] = [
        {
            id: 'log-1',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            profileName: 'HQ-GW-Router',
            connectionInfo: 'admin@192.168.10.1:22',
            command: 'show interfaces Ethernet1/1 brief',
            output: `Codes: u - up, d - down, r - reset, h - hw-err\nInterface     Status    Speed    Duplex   Type\n---------     ------    -----    ------   ----\nEth1/1        u         10G      full     10G-SFP-SR\nEth1/2        u         1G       full     1000Base-T\nEth1/3        d         auto     auto     1000Base-T`,
            status: 'success'
        },
        {
            id: 'log-2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            profileName: 'Edge-Centos-Server',
            connectionInfo: 'root@10.0.52.12:22',
            command: 'systemctl status vpn-client.service',
            output: `● vpn-client.service - WireGuard Tunnel Client\n   Loaded: loaded (/usr/lib/systemd/system/vpn-client.service; enabled; vendor preset: disabled)\n   Active: active (running) since Wed 2026-06-03 10:14:22 CET; 1 day 5h ago\n Main PID: 21204 (wg-quick)\n    Tasks: 2 (limit: 4915)\n   Memory: 8.4M\n   CGroup: /system.slice/vpn-client.service\n           └─21204 /usr/bin/wg-quick up wg0`,
            status: 'success'
        },
        {
            id: 'log-3',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            profileName: 'VLAN-UbiquitiSwitch',
            connectionInfo: 'ubnt@192.168.1.15:22',
            command: 'show vlan 99',
            output: `VLAN ID: 99\nVLAN Name: Management\nStatus: Active\nSTP: RSTP Enabled\nTagged Ports: Eth1, Eth2, Eth24\nUntagged Ports: None\nIP Overrides: Interface vlan99 - Static 192.168.1.15/24`,
            status: 'success'
        },
        {
            id: 'log-4',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            profileName: 'Backup-Server',
            connectionInfo: 'operator@192.168.5.40:22',
            command: 'ping -c 3 backup-cloud.int',
            output: `ping: backup-cloud.int: Name or service not known\n--- ping statistics ---\nDNS resolution failure. Emergency local mirror chosen.`,
            status: 'error'
        }
    ];

    // CPU State for each profile ID in real-time
    const [cpuState, setCpuState] = useState<Record<string, number>>({
        'prof-1': 32,
        'prof-2': 45,
        'prof-3': 15,
        'prof-4': 8
    });

    useEffect(() => {
        const saved = localStorage.getItem('ssh_profiles');
        if (saved && JSON.parse(saved).length > 0) {
            setProfiles(JSON.parse(saved));
        } else {
            // Seed a default battery of gorgeous profiles if none exist,
            // matching the preset records in initialLogs!
            const defaultProfs: SshProfile[] = [
                { id: 'prof-1', name: 'HQ-GW-Router', host: '192.168.10.1', port: '22', user: 'admin', key: '' },
                { id: 'prof-2', name: 'Edge-Centos-Server', host: '10.0.52.12', port: '22', user: 'root', key: '' },
                { id: 'prof-3', name: 'VLAN-UbiquitiSwitch', host: '192.168.1.15', port: '22', user: 'ubnt', key: '' },
                { id: 'prof-4', name: 'Backup-Server', host: '192.168.5.40', port: '22', user: 'operator', key: '' }
            ];
            setProfiles(defaultProfs);
            localStorage.setItem('ssh_profiles', JSON.stringify(defaultProfs));
        }
        api.getClusters().then(setNodes);

        // Load SSH execution history
        const savedLogs = localStorage.getItem('ssh_execution_logs');
        if (savedLogs) {
            setLogs(JSON.parse(savedLogs));
        } else {
            setLogs(initialLogs);
            localStorage.setItem('ssh_execution_logs', JSON.stringify(initialLogs));
        }
    }, []);

    // Live fluctuate interval
    useEffect(() => {
        const interval = setInterval(() => {
            setCpuState(prev => {
                const next = { ...prev };
                profiles.forEach(p => {
                    const currentVal = next[p.id] !== undefined ? next[p.id] : Math.floor(Math.random() * 25) + 5;
                    const change = Math.floor(Math.random() * 11) - 5; // -5% to +5% fluctuation
                    let newVal = currentVal + change;
                    if (newVal < 2) newVal = 2;
                    if (newVal > 95) newVal = 95;
                    next[p.id] = newVal;
                });
                return next;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [profiles]);

    // Format data and calculate distribution percentages
    const chartData = profiles.map((p, index) => {
        const load = cpuState[p.id] !== undefined ? cpuState[p.id] : (Math.floor(Math.random() * 25) + 5);
        return {
            id: p.id,
            name: p.name,
            value: load,
            host: p.host,
            user: p.user,
            color: ASSIGNED_COLORS[index % ASSIGNED_COLORS.length]
        };
    });

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-neutral-950 border border-white/10 p-3 rounded-2xl shadow-2xl text-[10px] font-sans">
                    <p className="font-bold text-white uppercase tracking-wider mb-1">{data.name}</p>
                    <p className="text-slate-400 font-mono text-[9px]">Użytkownik: {data.user}@{data.host}</p>
                    <p className="text-acid-cyan font-mono font-bold mt-1.5 flex items-center gap-1">
                        <Cpu size={10} className="animate-pulse" />
                        Obciążenie: {data.value}%
                    </p>
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isExecuting]);

    const saveProfiles = (newProfiles: SshProfile[]) => {
        setProfiles(newProfiles);
        localStorage.setItem('ssh_profiles', JSON.stringify(newProfiles));
    };

    const addProfile = () => {
        if (!newProfile.name || !newProfile.host) return;
        const freshProfile = { ...newProfile, id: 'profile-' + Date.now().toString() };
        saveProfiles([...profiles, freshProfile]);
        // Set as active console profile if none active
        if (!activeConsoleProfile) setActiveConsoleProfile(freshProfile.id);
        setNewProfile({ name: '', host: '', port: '22', user: '', key: '' });
    };

    const deleteProfile = (id: string) => {
        saveProfiles(profiles.filter(p => p.id !== id));
        if (activeConsoleProfile === id) {
            setActiveConsoleProfile('');
        }
    };

    const createTunnel = () => {
        const node = nodes.find(n => n.id === selectedNode);
        const profile = profiles.find(p => p.id === selectedProfile);
        if (!node || !profile) return;
        setTunnelLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Tunel: ${profile.user}@${profile.host} -> ${node.name} (${node.ip}) ustawiony.`]);
    };

    const addGithubKeys = async () => {
        if (!githubUser.trim()) return;
        setIsAddingKey(true);
        setGithubKeyLog([`[${new Date().toLocaleTimeString()}] Pobieranie kluczy: github.com/${githubUser}.keys...`]);

        try {
            const res = await fetch(`https://github.com/${githubUser}.keys`);
            if (!res.ok) throw new Error("Nie znaleziono użytkownika lub kluczy.");
            const keys = await res.text();
            
            if (!keys.trim()) {
                 setGithubKeyLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Brak kluczy dla użytkownika ${githubUser}.`]);
                 setIsAddingKey(false);
                 return;
            }
            
            const keyList = keys.split('\n').filter(k => k.trim());
            setGithubKeyLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Znaleziono ${keyList.length} publicznych kluczy.`]);

            await new Promise(resolve => setTimeout(resolve, 800));

            for (const key of keyList) {
                setGithubKeyLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Push klucza ${key.substring(0, 15)}... do autoryzacji roju.`]);
                await new Promise(resolve => setTimeout(resolve, 400));
            }
            
            setGithubKeyLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] SUKCES: Węzły zaktualizowały pliki authorized_keys.`]);
        } catch (e: any) {
            setGithubKeyLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] BŁĄD: ${e.message}`]);
        }
        setIsAddingKey(false);
    };

    // Simulated Executer of Commands on remote hosts
    const executeCommandOnRemote = async (cmd: string) => {
        if (!cmd.trim() || isExecuting) return;

        const currentProfile = profiles.find(p => p.id === activeConsoleProfile);
        if (!currentProfile) {
            alert("Najpierw powiąż terminal z profilem SSH!");
            return;
        }

        setIsExecuting(true);
        const targetCommand = cmd.trim();
        setCommandInput('');

        // Prepare temporary log item
        const tempId = 'exec-' + Date.now();
        const connectionInfo = `${currentProfile.user}@${currentProfile.host}:${currentProfile.port}`;
        
        const initialLog: SshLogEntry = {
            id: tempId,
            timestamp: new Date().toISOString(),
            profileName: currentProfile.name,
            connectionInfo,
            command: targetCommand,
            output: `Connecting to ${connectionInfo}...`,
            status: 'connecting'
        };

        const updatedLogs = [...logs, initialLog];
        setLogs(updatedLogs);
        localStorage.setItem('ssh_execution_logs', JSON.stringify(updatedLogs));

        // Sleep to simulate connecting...
        await new Promise(resolve => setTimeout(resolve, 800));

        setLogs(prev => prev.map(item => {
            if (item.id === tempId) {
                return { ...item, status: 'running', output: item.output + '\nEstablishing secure SSH session... Authenticating key...' };
            }
            return item;
        }));

        await new Promise(resolve => setTimeout(resolve, 905));

        // Generate mock outputs based on standard command inputs
        let finalOutput = '';
        let status: 'success' | 'error' = 'success';

        const rawLower = targetCommand.toLowerCase();
        if (rawLower.includes('ping')) {
            finalOutput = `PING ${targetCommand.split(' ').slice(-1)[0]} (10.15.2.40) 56(84) bytes of data.\n64 bytes from 10.15.2.40: icmp_seq=1 ttl=64 time=0.203 ms\n64 bytes from 10.15.2.40: icmp_seq=2 ttl=64 time=0.187 ms\n64 bytes from 10.15.2.40: icmp_seq=3 ttl=64 time=0.199 ms\n\n--- statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2012ms\nrtt min/avg/max/mdev = 0.187/0.196/0.203/0.015 ms`;
        } else if (rawLower.includes('vlan')) {
            finalOutput = `[CYLON-GW-NET] vlan status\n--------------------------------------------\nVLAN 10   PROD-NET    192.168.10.0/24   ACTIVE\nVLAN 20   DEV-BUILD   192.168.20.0/24   ACTIVE\nVLAN 30   RESERVED    10.8.0.0/16       DISABLED\nVLAN 99   ADMIN-MGMT  10.0.99.0/24      SECURED (802.1Q)`;
        } else if (rawLower.includes('cisco') || rawLower.includes('show run') || rawLower.includes('show ip')) {
            finalOutput = `HQ-AGG-SWITCH# show ip interface brief\nInterface            IP-Address      OK? Method Status                Protocol\nEthernet1/1          10.10.1.1       YES manual up                    up\nEthernet1/2          10.10.1.2       YES manual up                    up\nEthernet1/10         unassigned      YES manual down                  down\nVlan10               192.168.10.1    YES NVRAM  up                    up\nVlan99               10.0.99.3       YES local  up                    up`;
        } else if (rawLower.includes('ubiquiti') || rawLower.includes('ubnt')) {
            finalOutput = `Device Discovery (mDNS & CDP packets parsed):\n- EdgeRouter 6P (ER-6) [192.168.0.1] - Firmware v2.1.0\n- UniFi Switch 16-150W [192.168.0.2] - Firmware 5.43.36\n- CloudKey Gen3 Pro [192.168.0.10] - Online\n- AirMAX NanoStation 5AC [10.20.44.15] - Wireless client uplink`;
        } else if (rawLower.includes('netgear') || rawLower.includes('tp-link') || rawLower.includes('tplink')) {
            finalOutput = `TP-Link Layer 2 Managed Switch (EasySmart Pro):\nFirmware Build: 20251120-Rel.45890\n- SSH Port: 22 (Secure Only)\n- Loop Prev: Enabled\n- IGMP Snooping: Enabled (VLAN 1,10)\n- Port Trunking (Trunk-1 -> LACP): Active`;
        } else if (rawLower.includes('docker')) {
            finalOutput = `CONTAINER ID   IMAGE                                 COMMAND                  CREATED       STATUS         PORTS\n18dfa0134ef0   cylon-orchestration-agent:v2.5        "npm run start"         2 hours ago   Up 2 hours     0.0.0.0:3000->3000/tcp\n218fca99bbcc   cylon-mcp-fileserver:latest           "python -m mcp"          4 hours ago   Up 4 hours     0.0.0.0:4002->4002/tcp\nae21d8ffcda3   redis:6.2-alpine                      "docker-entrypoint.s…"   5 hours ago   Up 5 hours     6379/tcp`;
        } else if (rawLower === 'top' || rawLower.includes('cpu') || rawLower.includes('ram')) {
            finalOutput = `Tasks:  82 total,   2 running,  80 sleeping,   0 stopped,   0 zombie\n%Cpu(s): 12.8 us,  4.2 sy,  0.0 ni, 82.5 id,  0.5 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :  16384.0 total,   4210.4 free,   9145.2 used,   3028.4 buff/cache\nMiB Swap:   4096.0 total,   3820.0 free,    276.0 used.\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 2102 root      20   0  1.2g   240m    18m R  14.2   1.4   2:12.44 cy-node-runner\n 5044 postgres  20   0  350m   112m    12m S   1.8   0.7   0:45.12 postgres\n 9051 cy-user   20   0  5.4M   2104    800 S   0.2   0.0   0:01.20 bash`;
        } else if (rawLower.includes('vpn') || rawLower.includes('wireguard')) {
            finalOutput = `interface: wg0\n  public key: h9g0R897Fp89s7DfHpq8vK9b823Fhka9hSsaL9=\n  private key: (hidden)\n  listening port: 51820\n\npeer: CYLON_HQ_MGMT_GATEWAY=\n  endpoint: 84.112.55.109:51820\n  allowed ips: 10.0.0.0/8, 172.16.0.0/12\n  latest handshake: 14 seconds ago\n  transfer: 4.8 GiB received, 11.2 GiB sent\n  persistent keepalive: every 25 seconds`;
        } else if (rawLower.includes('cat') || rawLower.includes('nano') || rawLower.includes('vim') || rawLower.includes('rm')) {
            finalOutput = `bash: operation not permitted within visual shell simulation sandbox.\nUse 'sudo' commands or system queries.`;
            status = 'error';
        } else if (rawLower.includes('uname') || rawLower.includes('hardware')) {
            finalOutput = `Linux cy-host-endpoint-6 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.76-1 x86_64\nCPU: AMD Ryzen 9 7950X3D 16-Core Processor\nVirtualization: KVM hypervisor active.`;
        } else if (rawLower.includes('sudo') || rawLower.includes('hack')) {
            finalOutput = `[ALERT] EXECUTION REQUIREMENT INITIATED\n[OK] Sudo credentials matched for user: ${currentProfile.user}.\n[SEC] Logged security payload execution. Executing buffer overflow trace against loopback. IP spoof success. Port shell opened.`;
        } else if (rawLower.includes('help') || rawLower === '?') {
            finalOutput = `Dostępne terminalowe polecenia demonstracyjne:\n- ping <skrzynka_robocza>     : Diagnostyka opóźnień\n- show vlan status          : Wykaz VLANów i portów sieciowych\n- show ip interface brief   : Status routerów CISCO, NETGEAR, TP-LINK\n- docker ps                 : Lista kontenerów systemu CYLON\n- vpn / wireguard status    : Stan łączności tunelowej i szyfrowanej\n- cpu / ram / top            : Zużycie zasobów fizycznych węzła\n- uname -a                  : Parametry jądra Linux hosta\n- sudo <polecenie>          : Testowy uprzywilejowany bypass`;
        } else {
            finalOutput = `CY-TERM-SSH: ${targetCommand}: Polecenie wykonane pomyślnie na hoście zdalnym.\nstdout:\n[SUCCESS] Echo: ${targetCommand}\nstatus_code: 0 (OK)\nZdalny proces zamknął deskryptor połączenia.`;
        }

        const enrichedOutput = `Połączenie autoryzowane.\nZalogowano do hosta zdalnego jako ${currentProfile.user}.\n$ ${targetCommand}\n\n${finalOutput}`;

        setLogs(prev => {
            const next = prev.map(item => {
                if (item.id === tempId) {
                    return { ...item, status, output: enrichedOutput };
                }
                return item;
            });
            localStorage.setItem('ssh_execution_logs', JSON.stringify(next));
            return next;
        });

        setIsExecuting(false);
    };

    const clearLogs = () => {
        if (window.confirm("Czy na pewno chcesz wyczyścić historię logów wykonania poleceń SSH?")) {
            setLogs([]);
            localStorage.removeItem('ssh_execution_logs');
        }
    };

    const copyLogToClipboard = (entry: SshLogEntry) => {
        const text = `--- SSH EVENT METADATA ---\nCzas: ${entry.timestamp}\nProfil: ${entry.profileName} (${entry.connectionInfo})\nPolecenie: ${entry.command}\nStatus: ${entry.status.toUpperCase()}\n\n--- OUTPUT ---\n${entry.output}`;
        navigator.clipboard.writeText(text);
        alert("Skopiowano log polecenia do schowka.");
    };

    const downloadLogsAsTxt = () => {
        const text = logs.map(e => `[${e.timestamp}] [${e.profileName} - ${e.status.toUpperCase()}] CMD: ${e.command}\n${e.output}\n========================================\n`).join('\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ssh-session-history-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Filtered logs
    const filteredLogs = logs.filter(entry => {
        const commandMatch = entry.command.toLowerCase().includes(searchQuery.toLowerCase());
        const profileMatch = entry.profileName.toLowerCase().includes(searchQuery.toLowerCase());
        const outputMatch = entry.output.toLowerCase().includes(searchQuery.toLowerCase());
        
        const statusMatch = filterStatus === 'all' || entry.status === filterStatus;
        
        return (commandMatch || profileMatch || outputMatch) && statusMatch;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Zarządzanie Profilami & Tunelowaniem (Left Side) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Nowy profil */}
                    <div className="bg-neutral-900 border border-white/5 p-5 rounded-3xl space-y-4">
                        <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Key size={14} className="text-acid-cyan animate-pulse" /> 
                            Nowy Profil SSH
                        </h3>
                        
                        <div className="space-y-2.5 font-sans">
                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-[9px] text-slate-500 font-bold uppercase">Projektowa nazwa hosta</label>
                                <input 
                                    className="w-full bg-black border border-white/5 text-[11px] text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-acid-cyan placeholder-slate-700"
                                    placeholder="np. HQ-Gateway-Router" 
                                    value={newProfile.name} 
                                    onChange={e => setNewProfile({...newProfile, name: e.target.value})} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase">Adres IP / Host</label>
                                    <input 
                                        className="w-full bg-black border border-white/5 text-[11px] text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-acid-cyan placeholder-slate-700"
                                        placeholder="192.168.1.1" 
                                        value={newProfile.host} 
                                        onChange={e => setNewProfile({...newProfile, host: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase">Port</label>
                                    <input 
                                        className="w-full bg-black border border-white/5 text-[11px] text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-acid-cyan placeholder-slate-700"
                                        placeholder="22" 
                                        value={newProfile.port} 
                                        onChange={e => setNewProfile({...newProfile, port: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-[9px] text-slate-500 font-bold uppercase">Login SSH User</label>
                                <input 
                                    className="w-full bg-black border border-white/5 text-[11px] text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-acid-cyan placeholder-slate-700"
                                    placeholder="admin / root" 
                                    value={newProfile.user} 
                                    onChange={e => setNewProfile({...newProfile, user: e.target.value})} 
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-[9px] text-slate-500 font-bold uppercase">Klucz RSA / PEM (Opcjonalnie)</label>
                                <textarea 
                                    className="w-full bg-black border border-white/5 text-[10px] text-emerald-400 font-mono px-3 py-1.5 rounded-xl focus:outline-none focus:border-acid-cyan placeholder-slate-700 resize-none"
                                    rows={2}
                                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" 
                                    value={newProfile.key} 
                                    onChange={e => setNewProfile({...newProfile, key: e.target.value})} 
                                />
                            </div>
                        </div>

                        <button 
                            onClick={addProfile} 
                            disabled={!newProfile.name || !newProfile.host}
                            className="w-full bg-acid-cyan/10 hover:bg-acid-cyan/20 border border-acid-cyan/30 text-acid-cyan py-2 rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={12} /> Dodaj profil SSH
                        </button>
                    </div>

                    {/* Automatyzacja Tuneli */}
                    <div className="bg-neutral-900 border border-white/5 p-5 rounded-3xl space-y-4">
                        <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Network size={14} className="text-acid-purple" /> 
                            Automat Tunelujący
                        </h3>
                        <div className="space-y-3 font-sans">
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 font-bold uppercase">Węzeł Docelowy</label>
                                <select 
                                    className="w-full bg-black border border-white/5 text-[11px] text-slate-300 px-3 py-1.5 rounded-xl focus:outline-none" 
                                    value={selectedNode} 
                                    onChange={e => setSelectedNode(e.target.value)}
                                >
                                    <option value="">Wybierz węzeł roju...</option>
                                    {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 font-bold uppercase">Podstawa SSH (Gateway)</label>
                                <select 
                                    className="w-full bg-black border border-white/5 text-[11px] text-slate-300 px-3 py-1.5 rounded-xl focus:outline-none" 
                                    value={selectedProfile} 
                                    onChange={e => setSelectedProfile(e.target.value)}
                                >
                                    <option value="">Wybierz profil SSH...</option>
                                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name} [{p.user}@{p.host}]</option>)}
                                </select>
                            </div>

                            <button 
                                onClick={createTunnel} 
                                disabled={!selectedNode || !selectedProfile}
                                className="w-full bg-acid-purple/10 hover:bg-acid-purple/20 border border-acid-purple/30 text-acid-purple py-2 rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 hover:opacity-90 transition-all cursor-pointer disabled:opacity-40"
                            >
                                <Wifi size={12} /> Uruchom tunel SSH
                            </button>
                        </div>

                        {tunnelLog.length > 0 && (
                            <div className="bg-black/60 border border-white/5 p-3 rounded-2xl font-mono text-[9px] text-emerald-400 h-24 overflow-y-auto space-y-1">
                                {tunnelLog.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                        )}
                    </div>

                    {/* GitHub SSH Key Auth */}
                    <div className="bg-neutral-900 border border-white/5 p-5 rounded-3xl space-y-4">
                        <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Github size={14} className="text-emerald-400" /> 
                            Autoryzacja GitHub
                        </h3>
                        <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                            Pobierz listę publicznych kluczy SSH przypisanych do konta GitHub (np. github.com/user.keys) i przekaż do demona authorized_keys na wybranych serwerach roju (Symulacja).
                        </p>
                        
                        <div className="space-y-3 font-sans">
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 font-bold uppercase">Użytkownik GitHub</label>
                                <input 
                                    className="w-full bg-black border border-white/5 text-[11px] text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-400 placeholder-slate-700"
                                    placeholder="np. microsoft" 
                                    value={githubUser} 
                                    onChange={e => setGithubUser(e.target.value)} 
                                />
                            </div>

                            <button 
                                onClick={addGithubKeys} 
                                disabled={!githubUser.trim() || isAddingKey}
                                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                            >
                                {isAddingKey ? <RefreshCw size={12} className="animate-spin" /> : <Key size={12} />}
                                Pobierz z GitHub.com
                            </button>
                        </div>

                        {githubKeyLog.length > 0 && (
                            <div className="bg-black/60 border border-white/5 p-3 rounded-2xl font-mono text-[9px] h-24 overflow-y-auto space-y-1">
                                {githubKeyLog.map((log, i) => (
                                    <div key={i} className={log.includes('BŁĄD') ? 'text-red-400' : 'text-emerald-400'}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Konsola SSH i Interaktywne Wykonywanie (Right Side - Top) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Live SSH Console Terminal */}
                    <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[320px]">
                        {/* Terminal Header */}
                        <div className="bg-black/40 px-5 py-3 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <span className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                                    <Terminal size={12} className="text-acid-cyan" />
                                    Zdalne SSH: {activeConsoleProfile ? (profiles.find(p => p.id === activeConsoleProfile)?.name || 'Nieznany') : 'Brak Aktywnej Sesji'}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <select 
                                    className="bg-black border border-white/5 text-[9px] rounded-lg px-2 py-0.5 text-slate-400 font-bold"
                                    value={activeConsoleProfile}
                                    onChange={e => setActiveConsoleProfile(e.target.value)}
                                >
                                    <option value="">Wymuś sesję...</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} [{p.user}]</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Interactive Console Screen */}
                        <div className="flex-1 bg-black/90 p-4 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-3 flex flex-col leading-relaxed">
                            {!activeConsoleProfile ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                    <Terminal size={26} className="text-slate-800 mb-2 animate-pulse" />
                                    <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Konfigurator Terminala Zdalnego</span>
                                    <p className="text-slate-600 font-sans text-[10px] max-w-[280px] mt-1.5">
                                        Wybierz profil SSH z listy lub utwórz nowy, aby rozpocząć bezpieczną symulowaną sesję sterowania.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-emerald-500/75">
                                        * Połączenie przygotowane: {profiles.find(p => p.id === activeConsoleProfile)?.user}@{profiles.find(p => p.id === activeConsoleProfile)?.host}
                                        <br />
                                        * Wpisz "help" lub kliknij gotowy zestaw komend, aby przetestować diagnostykę sieci Cisco/Switche/Linux.
                                    </div>

                                    {/* Scrolling terminal stream lines */}
                                    <div className="space-y-3 flex-1">
                                        {logs.filter(l => l.profileName === profiles.find(p => p.id === activeConsoleProfile)?.name).slice(-2).map((item, idx) => (
                                            <div key={idx} className="border-l border-white/5 pl-3 py-1 space-y-1 bg-white/[0.01] rounded">
                                                <div className="flex items-center justify-between text-[9px] text-slate-500">
                                                    <span>CMD: {item.command}</span>
                                                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-tight break-all">
                                                    {item.output}
                                                </pre>
                                            </div>
                                        ))}

                                        {isExecuting && (
                                            <div className="flex items-center gap-2 text-acid-cyan animate-pulse">
                                                <RefreshCw size={11} className="animate-spin" />
                                                <span>Wykonywanie komendy na zdalnym serwerze (SSH pipe)...</span>
                                            </div>
                                        )}
                                        <div ref={logsEndRef} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Quick Action Suggestion Bar */}
                        {activeConsoleProfile && (
                            <div className="bg-black/30 px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
                                <span className="text-[9px] font-sans font-bold text-slate-500 self-center uppercase pr-1.5">Szybkie:</span>
                                <button onClick={() => executeCommandOnRemote('ping google.com')} className="px-2 py-0.5 bg-white/5 hover:bg-acid-cyan/10 hover:text-acid-cyan transition-all rounded text-[9px] font-mono text-slate-400 border border-white/5 hover:border-acid-cyan/25">ping</button>
                                <button onClick={() => executeCommandOnRemote('show ip interface brief')} className="px-2 py-0.5 bg-white/5 hover:bg-acid-cyan/10 hover:text-acid-cyan transition-all rounded text-[9px] font-mono text-slate-400 border border-white/5 hover:border-acid-cyan/25">cisco ip</button>
                                <button onClick={() => executeCommandOnRemote('show vlan status')} className="px-2 py-0.5 bg-white/5 hover:bg-neutral-800 rounded text-[9px] font-mono text-slate-400 border border-white/5">vlan list</button>
                                <button onClick={() => executeCommandOnRemote('top')} className="px-2 py-0.5 bg-white/5 hover:bg-neutral-800 rounded text-[9px] font-mono text-slate-400 border border-white/5">CPU/Memory</button>
                                <button onClick={() => executeCommandOnRemote('docker ps')} className="px-2 py-0.5 bg-white/5 hover:bg-neutral-800 rounded text-[9px] font-mono text-slate-400 border border-white/5">docker containers</button>
                                <button onClick={() => executeCommandOnRemote('wireguard status')} className="px-2 py-0.5 bg-white/5 hover:bg-neutral-800 rounded text-[9px] font-mono text-slate-400 border border-white/5">vpn wg0</button>
                                <button onClick={() => executeCommandOnRemote('help')} className="px-2 py-0.5 bg-white/5 hover:bg-neutral-800 rounded text-[9px] font-mono text-slate-400 border border-white/5">Lista help</button>
                            </div>
                        )}

                        {/* Interactive Input Form */}
                        <form 
                            onSubmit={e => {
                                e.preventDefault();
                                executeCommandOnRemote(commandInput);
                            }}
                            className="bg-black px-4 py-2 flex items-center gap-1.5 border-t border-white/5"
                        >
                            <ChevronRight size={14} className="text-slate-500" />
                            <input 
                                disabled={!activeConsoleProfile || isExecuting}
                                className="flex-1 bg-transparent font-mono text-[11px] text-white focus:outline-none placeholder-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                placeholder={activeConsoleProfile ? "Wpisz polecenie i kliknij Enter (np: ping 8.8.8.8)..." : "Wybierz zalogowaną sesję aby operować konsolą"}
                                value={commandInput}
                                onChange={e => setCommandInput(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                disabled={!activeConsoleProfile || isExecuting || !commandInput.trim()}
                                className="px-3 py-1 bg-acid-cyan text-black font-sans font-bold text-[9px] uppercase tracking-wider rounded-lg flex items-center gap-1 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Play size={8} /> Wyślij cmd
                            </button>
                        </form>
                    </div>

                    {/* DEDIKOWANY LOG VIEWER (Sesje, Statusy, Filtracja, Pobieranie) */}
                    <div className="bg-neutral-900 border border-white/5 p-5 rounded-3xl space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3 font-sans">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                    <Layers size={14} className="text-acid-cyan" />
                                    Rejestr Wykonywania Poleceń (Logs Audit)
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Lista wykonanych operacji merytorycznych chroniona kryptograficznie w lokalnej historycznej bazie.</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={downloadLogsAsTxt}
                                    disabled={logs.length === 0}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 border border-white/5 hover:border-white/10 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                                    title="Eksportuj jako .TXT"
                                >
                                    <Download size={11} /> 
                                    Export (.txt)
                                </button>
                                <button 
                                    onClick={clearLogs}
                                    disabled={logs.length === 0}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 border border-red-500/20 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                                >
                                    Wyczyść logi
                                </button>
                            </div>
                        </div>

                        {/* Dwukolumnowy układ: logi po lewej, wykres Pie i dane telemetryczne po prawej */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                            
                            {/* Lewa kolumna: Filtracja oraz Spis Logów */}
                            <div className="lg:col-span-7 space-y-4">
                                {/* Search and Filter Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-8 relative">
                                        <Search size={12} className="absolute left-3 top-2.5 text-slate-500" />
                                        <input 
                                            className="w-full bg-black border border-white/5 text-[11px] text-white pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-acid-cyan placeholder-slate-700"
                                            placeholder="Filtruj logi według: hosta, komendy, statusu jądra, systemctl..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-2 text-slate-400 p-0.5 hover:text-white"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="sm:col-span-4 flex items-center gap-1 bg-black rounded-xl border border-white/5 p-1">
                                        {['all', 'success', 'error'].map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => setFilterStatus(st)}
                                                className={cn(
                                                    "flex-1 text-[9px] font-black uppercase py-1 rounded-lg transition-all cursor-pointer",
                                                    filterStatus === st 
                                                        ? "bg-acid-cyan text-black" 
                                                        : "text-slate-500 hover:text-slate-300"
                                                )}
                                            >
                                                {st === 'all' ? 'Wszystko' : st === 'success' ? 'OK' : 'Błąd'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* List of historical and real-time logs */}
                                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                    {filteredLogs.length === 0 ? (
                                        <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl">
                                            <HelpCircle size={20} className="mx-auto text-slate-700 mb-1.5" />
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Czysty Bufor Zapytań</div>
                                            <p className="text-[9px] text-slate-600 font-sans max-w-[250px] mx-auto mt-1">Brak logów pasujących do kryteriów wyszukiwania lub terminal nie zarejestrował jeszcze aktywności.</p>
                                        </div>
                                    ) : (
                                        filteredLogs.map((entry) => (
                                            <div 
                                                key={entry.id} 
                                                className={cn(
                                                    "bg-black/40 border p-3 rounded-2xl flex flex-col gap-2.5 transition-all hover:bg-black/60",
                                                    entry.status === 'success' ? 'border-emerald-500/15' : 'border-red-500/15'
                                                )}
                                            >
                                                {/* Row Meta */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.02] pb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            entry.status === 'success' && "bg-emerald-500 animate-pulse",
                                                            entry.status === 'error' && "bg-red-500 animate-pulse",
                                                            entry.status === 'connecting' && "bg-yellow-400 animate-spin",
                                                            entry.status === 'running' && "bg-acid-cyan animate-pulse"
                                                        )}></span>
                                                        <span className="text-[10px] font-black text-white">{entry.profileName}</span>
                                                        <span className="text-[9px] font-mono text-slate-500">{entry.connectionInfo}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-mono text-slate-500">
                                                            {new Date(entry.timestamp).toLocaleTimeString() || entry.timestamp}
                                                        </span>
                                                        <button 
                                                            onClick={() => copyLogToClipboard(entry)}
                                                            className="p-1 bg-white/5 hover:bg-white/10 rounded text-slate-400 hover:text-white border border-white/5 cursor-pointer"
                                                            title="Skopiuj cały wpis"
                                                        >
                                                            <Copy size={9} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Row Command & Content Output */}
                                                <div className="space-y-1.5 text-left">
                                                    <div className="flex items-center gap-1 font-mono text-[10px] text-yellow-400 font-bold">
                                                        <span className="text-slate-500">$</span>
                                                        <span>{entry.command}</span>
                                                    </div>
                                                    <pre className="p-3 bg-black/85 border border-white/5 rounded-xl font-mono text-[9px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto break-words">
                                                        {entry.output}
                                                    </pre>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Prawa kolumna: Recharts Pie Chart (Rozkład obciążenia CPU) */}
                            <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Cpu size={12} className="text-acid-cyan animate-pulse" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Rozkład Obciążenia CPU</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                                            LIVE
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-sans leading-relaxed">
                                        Bieżący podział mocy procesora pomiędzy aktywnymi sesjami konsolowymi i sprzętowymi węzłami sterującymi.
                                    </p>
                                </div>

                                {/* Wykres Pie Donut */}
                                <div className="h-[150px] w-full flex items-center justify-center relative my-1">
                                    {chartData.length === 0 ? (
                                        <div className="text-center py-4">
                                            <HelpCircle size={18} className="mx-auto text-slate-705 mb-1" />
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Brak profili</div>
                                            <p className="text-[8px] text-slate-650 mt-0.5 max-w-[120px] mx-auto font-sans">Dodaj profil SSH poniżej.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                                                <PieChart>
                                                    <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={65}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                    >
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#171717" strokeWidth={2} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            
                                            {/* Środek wykresu pączka */}
                                            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-[7px] font-sans font-bold text-slate-500 uppercase tracking-widest leading-none">Total</span>
                                                <span className="text-xs font-mono font-black text-white mt-0.5">
                                                    {chartData.reduce((acc, curr) => acc + curr.value, 0)}%
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Swarm Nodes Telemetry Legend */}
                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                                    {chartData.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-[10px] font-sans bg-black/50 border border-white/[0.03] hover:border-white/5 rounded-xl px-2.5 py-1.5 transition-all">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full ring-1 ring-black shrink-0" style={{ backgroundColor: item.color }} />
                                                <div className="flex flex-col text-left min-w-0">
                                                    <span className="text-white font-bold leading-none truncate">{item.name}</span>
                                                    <span className="text-slate-600 font-mono text-[8px] mt-0.5 truncate">{item.user}@{item.host}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 pl-1">
                                                <span className="text-acid-cyan font-mono font-bold">{item.value}%</span>
                                                <span className="text-[8px] font-mono text-slate-600 uppercase">cpu</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* List of Configured profiles at the bottom */}
            <div className="border-t border-white/5 pt-6 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Zarejestrowane Węzły Sterowania SSH ({profiles.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map(p => (
                        <div key={p.id} className="bg-neutral-900 p-4 rounded-3xl border border-white/5 flex justify-between items-center transition-all hover:border-white/10">
                            <div className="space-y-0.5">
                                <div className="text-white text-[11px] font-bold flex items-center gap-1.5">
                                    <Server size={11} className="text-acid-cyan" />
                                    {p.name}
                                </div>
                                <div className="text-[9px] font-mono text-slate-400">{p.user}@{p.host}:{p.port}</div>
                            </div>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => {
                                        setActiveConsoleProfile(p.id);
                                        const connectionInfo = `${p.user}@${p.host}:${p.port}`;
                                        setTunnelLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] terminal podpięty pod ${connectionInfo}`]);
                                    }}
                                    className="p-1.5 bg-white/5 rounded-xl text-acid-cyan hover:bg-white/10 hover:scale-105 border border-white/5 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                                    title="Otwórz konsole zdalną dla tej stacji"
                                >
                                    <Terminal size={11} /> 
                                    Connect
                                </button>
                                <button 
                                    onClick={() => deleteProfile(p.id)} 
                                    className="p-1.5 bg-white/5 rounded-xl text-red-500 hover:bg-white/10 hover:scale-105 border border-white/5 transition-all cursor-pointer"
                                    title="Usuń profil"
                                >
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
