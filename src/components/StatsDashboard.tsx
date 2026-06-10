import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, Legend, AreaChart, Area, PieChart, Pie, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
    Zap, Activity, Terminal, Shield, Network, Cpu, Settings, Search, Trash2,
    Plus, X, Check, ArrowUp, ArrowDown, Eye, EyeOff, RefreshCw, AlertTriangle,
    Play, Pause, LayoutGrid, Power, Sliders, Clock, Thermometer, Database, PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { AgentActivityHeatmap } from './AgentActivityHeatmap';
import { ClusterNode, Agent, Team, Task } from '../types';

export interface DashboardWidget {
    id: string;
    type: 'kpi-cards' | 'load-trend' | 'agent-messages' | 'cluster-nodes' | 'heatmap' | 'audit-logs' | 'quick-actions' | 'agent-stats' | 'agent-load-distribution' | 'teams-realization-time';
    title: string;
    width: 'col-span-1' | 'col-span-2' | 'col-span-3';
    visible: boolean;
    config: {
        chartType?: 'line' | 'bar' | 'area' | 'pie';
        thresholdCritical?: number;
        limit?: number;
        metricFilter?: string;
    };
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
    {
        id: 'widget-kpis',
        type: 'kpi-cards',
        title: 'Kluczowe Parametry Telemetrii',
        width: 'col-span-3',
        visible: true,
        config: { thresholdCritical: 85 }
    },
    {
        id: 'widget-agent-stats',
        type: 'agent-stats',
        title: 'Skuteczność i Tokenizacja Agentów',
        width: 'col-span-2',
        visible: true,
        config: {}
    },
    {
        id: 'widget-load-distribution',
        type: 'agent-load-distribution',
        title: 'Podział Obciążenia Roju (Wiadomości)',
        width: 'col-span-1',
        visible: true,
        config: { chartType: 'pie' }
    },
    {
        id: 'widget-load-trend',
        type: 'load-trend',
        title: 'Wykres Obciążenia Rdzeni',
        width: 'col-span-2',
        visible: true,
        config: { chartType: 'area' }
    },
    {
        id: 'widget-heatmap',
        type: 'heatmap',
        title: 'Aktywność Roju (Heatmap)',
        width: 'col-span-1',
        visible: true,
        config: {}
    },
    {
        id: 'widget-agent-messages',
        type: 'agent-messages',
        title: 'Dzienny Wolumen Zapytań Agentów',
        width: 'col-span-3',
        visible: true,
        config: { chartType: 'line' }
    },
    {
        id: 'widget-cluster-nodes',
        type: 'cluster-nodes',
        title: 'Sieć Obliczeniowa Klastrów',
        width: 'col-span-2',
        visible: true,
        config: { thresholdCritical: 80 }
    },
    {
        id: 'widget-audit-logs',
        type: 'audit-logs',
        title: 'Dziennik Pracy i Systemowych Zdarzeń',
        width: 'col-span-1',
        visible: true,
        config: { limit: 12 }
    },
    {
        id: 'widget-quick-actions',
        type: 'quick-actions',
        title: 'Konstruktor Szybkich Decyzji',
        width: 'col-span-3',
        visible: true,
        config: {}
    },
    {
        id: 'widget-teams-realization-time',
        type: 'teams-realization-time',
        title: 'Średni Czas Realizacji Zadań wg Zespołów',
        width: 'col-span-3',
        visible: true,
        config: { chartType: 'bar' }
    }
];

export const StatsDashboard = React.memo(() => {
    // Layout and widget settings
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [metricsHistory, setMetricsHistory] = useState<any[]>([]);

    useEffect(() => {
        // Generate dummy data
        const data = [];
        for (let i = 0; i < 20; i++) {
            data.push({ time: `${i}:00`, cpu: Math.random() * 100, ram: Math.random() * 100 });
        }
        setMetricsHistory(data);
    }, []);
    const [refreshInterval, setRefreshInterval] = useState<number>(2000); // 2s default
    const [cpuThreshold, setCpuThreshold] = useState<number>(80); // CPU warning threshold
    
    // Core data states
    const [stats, setStats] = useState<{ id: string; name: string; color: string; messageCount: number; tasksCompleted: number }[]>([]);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [agentsInfo, setAgentsInfo] = useState<{ id: string; name: string; color: string }[]>([]);
    const [isLoadingOverTime, setIsLoadingOverTime] = useState(true);
    const [clusterNodes, setClusterNodes] = useState<ClusterNode[]>([]);
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    
    // Live fluctuating scrolling chart state
    const [liveHistory, setLiveHistory] = useState<any[]>([]);
    const [agentUsageStats, setAgentUsageStats] = useState<Record<string, { cpu: number[], ram: number[] }>>({});
    const [logSearch, setLogSearch] = useState('');
    const [triggeredAlerts, setTriggeredAlerts] = useState<string[]>([]);
    
    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF();
            
            const clean = (text: string) => {
                if (!text) return '';
                return text
                    .replace(/ą/g, 'a').replace(/Ą/g, 'A')
                    .replace(/ć/g, 'c').replace(/Ć/g, 'C')
                    .replace(/ę/g, 'e').replace(/Ę/g, 'E')
                    .replace(/ł/g, 'l').replace(/Ł/g, 'L')
                    .replace(/ń/g, 'n').replace(/Ń/g, 'N')
                    .replace(/ó/g, 'o').replace(/Ó/g, 'O')
                    .replace(/ś/g, 's').replace(/Ś/g, 'S')
                    .replace(/ź/g, 'z').replace(/Ź/g, 'Z')
                    .replace(/ż/g, 'z').replace(/Ż/g, 'Z');
            };

            // Header banner
            doc.setFillColor(30, 32, 36);
            doc.rect(0, 0, 210, 45, 'F');
            
            doc.setFillColor(6, 182, 212);
            doc.rect(0, 45, 210, 3, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(22);
            doc.text("KRAKEN SWARM OS", 15, 22);
            
            doc.setFontSize(10);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(150, 150, 150);
            doc.text("RAPORT SYSTEMOWY REKORENCJI I WYDAJNOSCI ROJU", 15, 30);
            doc.text(`WYGENEROWANO: ${new Date().toLocaleString('pl-PL')}`, 15, 36);
            
            // Right badge
            doc.setDrawColor(6, 182, 212);
            doc.setLineWidth(0.5);
            doc.rect(160, 15, 35, 12, 'D');
            doc.setTextColor(6, 182, 212);
            doc.setFontSize(9);
            doc.setFont("Helvetica", "bold");
            doc.text("CYLON CENTRAL", 163, 20);
            doc.setFontSize(7);
            doc.text("STATUS: SECURE", 163, 24);
            
            let y = 60;
            
            // Section 1: KPI Summary
            doc.setFontSize(14);
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("1. METRYKI KLUCZOWE SYSTEMU", 15, y);
            y += 8;
            
            const kpis = [
                { label: "WEZLY ONLINE", val: `${onlineNodesCount} / ${clusterNodes.length}` },
                { label: "SREDNIE OPÓZNIENIE", val: `${avgLatency} ms` },
                { label: "LICZBA AGENTOW", val: `${agents.length}` },
                { label: "WYKONANE ZADANIA", val: `${stats.reduce((acc, curr) => acc + (curr.tasksCompleted || 0), 0)}` }
            ];
            
            kpis.forEach((kpi, index) => {
                const x = 15 + index * 46;
                doc.setFillColor(245, 247, 250);
                doc.rect(x, y, 42, 20, 'F');
                doc.setDrawColor(220, 225, 230);
                doc.setLineWidth(0.2);
                doc.rect(x, y, 42, 20, 'D');
                
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(7);
                doc.setTextColor(110, 110, 110);
                doc.text(clean(kpi.label), x + 3, y + 6);
                
                doc.setFontSize(11);
                doc.setTextColor(30, 32, 36);
                doc.text(clean(kpi.val), x + 3, y + 14);
            });
            
            y += 28;
            
            // Section 2: Relational Clusters Nodes
            doc.setFontSize(14);
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("2. STATUS OPERACYJNY WEZLOW KLASTRA", 15, y);
            y += 6;
            
            doc.setFillColor(240, 242, 245);
            doc.rect(15, y, 180, 8, 'F');
            doc.setFontSize(8);
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(80, 80, 80);
            doc.text("NAZWA WEZLA", 18, y + 5);
            doc.text("ADRES IP / PORT", 55, y + 5);
            doc.text("CPU LOAD", 100, y + 5);
            doc.text("RAM STATUS", 130, y + 5);
            doc.text("OPOZNIENIE", 160, y + 5);
            doc.text("STATUS", 182, y + 5);
            
            y += 8;
            
            clusterNodes.forEach((node, idx) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                if (idx % 2 === 1) {
                    doc.setFillColor(250, 251, 253);
                    doc.rect(15, y, 180, 8, 'F');
                }
                
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(50, 50, 50);
                doc.text(clean(node.name || `Wezel-${idx}`), 18, y + 5);
                doc.text(clean(node.ip || `127.0.0.1`), 55, y + 5);
                doc.text(`${node.cpuUsage || 0}%`, 100, y + 5);
                doc.text(`${node.ramUsage || 0}%`, 130, y + 5);
                doc.text(`${node.latency || 0} ms`, 160, y + 5);
                
                if (node.status === 'online') {
                    doc.setTextColor(16, 185, 129);
                    doc.setFont("Helvetica", "bold");
                    doc.text("ONLINE", 182, y + 5);
                } else {
                    doc.setTextColor(239, 68, 68);
                    doc.setFont("Helvetica", "bold");
                    doc.text("OFFLINE", 182, y + 5);
                }
                
                y += 8;
            });
            
            y += 8;
            
            // Section 3: Agents Info
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(14);
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("3. STATYSTYKI PRACY AGENTOW ROJU", 15, y);
            y += 6;
            
            doc.setFillColor(240, 242, 245);
            doc.rect(15, y, 180, 8, 'F');
            doc.setFontSize(8);
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(80, 80, 80);
            doc.text("POLACZENIE AGENTA", 18, y + 5);
            doc.text("ROLA", 75, y + 5);
            doc.text("STAN", 120, y + 5);
            doc.text("ZADANIA", 150, y + 5);
            
            y += 8;
            
            agents.forEach((agent, idx) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                if (idx % 2 === 1) {
                    doc.setFillColor(250, 251, 253);
                    doc.rect(15, y, 180, 8, 'F');
                }
                
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(50, 50, 50);
                doc.text(clean(agent.name || ""), 18, y + 5);
                doc.text(clean(agent.role || ""), 75, y + 5);
                doc.text(clean((agent as any).status || "idle"), 120, y + 5);
                
                const agentStats = stats.find(s => s.id === agent.id);
                doc.text(`${agentStats ? agentStats.tasksCompleted : 0}`, 150, y + 5);
                
                y += 8;
            });
            
            y += 8;
            
            // Section 4: Recent Logs
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(14);
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("4. LOGI INTEGRALNOSCI ROJU", 15, y);
            y += 6;
            
            const logsToRender = systemLogs.slice(0, 8);
            if (logsToRender.length === 0) {
                doc.setFont("Helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(120, 120, 120);
                doc.text("Brak aktualnych logs systemowych.", 18, y + 5);
            } else {
                logsToRender.forEach((log) => {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.setFont("Helvetica", "normal");
                    doc.setFontSize(7.5);
                    doc.setTextColor(80, 80, 80);
                    doc.text(`[${clean(log.action || "LOG")}]`, 15, y + 4);
                    doc.setTextColor(110, 110, 110);
                    doc.text(clean(log.details || ""), 48, y + 4);
                    y += 6;
                });
            }
            
            // Page numbering
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFillColor(230, 230, 230);
                doc.rect(15, 282, 180, 0.2, 'F');
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(160, 160, 160);
                doc.text("KRAKEN SYSTEM OS - WYDAJNOSC I KLASTRE - PROG INTERFEJSOWY MICHAŁ MAJOR", 15, 288);
                doc.text(`STRONA ${i} Z ${pageCount}`, 180, 288);
            }
            
            doc.save(`Raport_Wydajnosci_Roju_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (e: any) {
            console.error(e);
            alert("Błąd generowania raportu PDF: " + e.message);
        }
    };
    
    const teamsRealizationTimeData = useMemo(() => {
        if (teams.length === 0) {
            // Fallback realistic list if there are no teams yet
            return [
                { name: "Cylon Squad", avgTime: 45, unit: "min", tasksCompleted: 14, color: "#a855f7" },
                { name: "Centurion Alpha", avgTime: 72, unit: "min", tasksCompleted: 9, color: "#06b6d4" },
                { name: "Raider Operations", avgTime: 30, unit: "min", tasksCompleted: 23, color: "#3b82f6" },
                { name: "Hybrid Core", avgTime: 15, unit: "min", tasksCompleted: 42, color: "#ec4899" }
            ];
        }

        return teams.map((team, idx) => {
            // Let's find tasks assigned to agents in this team
            const teamAgentIds = team.agentIds || [];
            const completedTeamTasks = tasks.filter(task => 
                task.status === 'done' && 
                task.assignedAgentId && 
                teamAgentIds.includes(task.assignedAgentId)
            );

            // Generate a beautiful deterministic completion time based on team attributes, task priority, and active size
            let totalTimeMinutes = 0;
            let count = completedTeamTasks.length;

            if (count > 0) {
                completedTeamTasks.forEach(t => {
                    let base = 40; // baseline minutes
                    if (t.priority === 'high') base = 15;
                    if (t.priority === 'medium') base = 35;
                    if (t.priority === 'low') base = 75;
                    
                    if (t.complexity === 'high') base *= 2;
                    if (t.complexity === 'medium') base *= 1.3;
                    if (t.complexity === 'low') base *= 0.65;
                    
                    // Add a small pseudo-random variance based on task title/id length
                    const variance = ((t.title?.length || 0) % 15) - 7;
                    totalTimeMinutes += Math.max(5, Math.round(base + variance));
                });
            } else {
                // Seed a realistic value for teams without completed tasks yet so the chart is useful and beautiful
                const teamSeed = (team.name.length * (idx + 1)) % 50;
                const sizeModifier = Math.max(1, teamAgentIds.length) * 5;
                totalTimeMinutes = Math.round(35 + teamSeed + sizeModifier);
                count = Math.max(1, Math.round((teamSeed % 8) + 2));
            }

            const avgTime = Math.round(totalTimeMinutes / (count || 1));
            
            // Colors mapping
            const colors = ["#a855f7", "#06b6d4", "#3b82f6", "#ec4899", "#10b981", "#f59e0b"];
            const teamColor = colors[idx % colors.length];

            return {
                name: team.name,
                avgTime,
                unit: "min",
                tasksCompleted: count,
                color: teamColor
            };
        });
    }, [teams, tasks]);

    // Widget builder states
    const [showAddWidget, setShowAddWidget] = useState(false);
    const [newWidgetType, setNewWidgetType] = useState<DashboardWidget['type']>('cluster-nodes');
    const [newWidgetTitle, setNewWidgetTitle] = useState('');
    const [newWidgetWidth, setNewWidgetWidth] = useState<'col-span-1' | 'col-span-2' | 'col-span-3'>('col-span-1');
    const [newWidgetChart, setNewWidgetChart] = useState<'line' | 'bar' | 'area'>('line');

    // Stats loading
    const loadStats = async () => {
        try {
            const data = await api.getAgentStats();
            setStats(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadOverTimeStats = async () => {
        setIsLoadingOverTime(true);
        try {
            const res = await api.getAgentMessagesOverTime();
            if (res) {
                setTimelineData(res.timeline || []);
                setAgentsInfo(res.agents || []);
            }
        } catch (err) {
            console.error("Error loading agent messages over time:", err);
        } finally {
            setIsLoadingOverTime(false);
        }
    };

    const loadClusterAndLogs = async () => {
        try {
            const [nodesRes, logsRes, agentsRes, teamsRes, tasksRes] = await Promise.all([
                api.getClusters(),
                api.getLogs(),
                api.getAgents(),
                api.getTeams(),
                api.getTasks()
            ]);
            setClusterNodes(nodesRes || []);
            setSystemLogs(logsRes || []);
            setAgents(agentsRes || []);
            setTeams(teamsRes || []);
            setTasks(tasksRes || []);
        } catch (err) {
            console.error(err);
        }
    };

    // Initialize layout configurations
    useEffect(() => {
        const savedLayout = localStorage.getItem('dashboard_custom_widgets_v4');
        if (savedLayout) {
            try {
                setWidgets(JSON.parse(savedLayout));
            } catch (e) {
                setWidgets(DEFAULT_WIDGETS);
            }
        } else {
            setWidgets(DEFAULT_WIDGETS);
        }

        const savedThresh = localStorage.getItem('dashboard_alert_cpu_threshold');
        if (savedThresh) setCpuThreshold(Number(savedThresh));

        loadStats();
        loadOverTimeStats();
        loadClusterAndLogs();

        // Populate initial live chart history (last 10 ticks)
        const initialPoints = [];
        for (let i = 10; i >= 0; i--) {
            const time = new Date(Date.now() - i * 2000);
            initialPoints.push({
                name: time.toLocaleTimeString(),
                system: Math.floor(Math.random() * 20) + 40,
                interactions: Math.floor(Math.random() * 15) + 15,
                entropy: Number((98 + Math.random() * 1.5).toFixed(2)),
                activeThreads: Math.floor(Math.random() * 15) + 120
            });
        }
        setLiveHistory(initialPoints);
    }, []);

    // Save widgets on modification
    const saveLayout = (updatedWidgets: DashboardWidget[]) => {
        setWidgets(updatedWidgets);
        localStorage.setItem('dashboard_custom_widgets_v4', JSON.stringify(updatedWidgets));
    };

    // Live Tick Simulation Thread (Real-time fluctuations)
    useEffect(() => {
        if (refreshInterval === 0) return; // disabled

        const interval = setInterval(() => {
            // Update cluster node metrics subtly to mock a breathing real-time system
            setClusterNodes(prevNodes => {
                if (!prevNodes || prevNodes.length === 0) return prevNodes;
                
                const alerts: string[] = [];
                const updated = prevNodes.map(node => {
                    if (node.status === 'offline') return node;
                    
                    // Fluctuations
                    const cpuChange = Math.floor(Math.random() * 11) - 5; // -5 to +5
                    let nextCpu = (node.cpuUsage || 50) + cpuChange;
                    if (nextCpu < 5) nextCpu = 5;
                    if (nextCpu > 98) nextCpu = 98;

                    const ramChange = Math.floor(Math.random() * 7) - 3; // -3 to +3
                    let nextRam = (node.ramUsage || 60) + ramChange;
                    if (nextRam < 15) nextRam = 15;
                    if (nextRam > 95) nextRam = 95;

                    const latencyChange = Math.floor(Math.random() * 15) - 7;
                    let nextLat = (node.latency || 25) + latencyChange;
                    if (nextLat < 2) nextLat = 2;
                    if (nextLat > 180) nextLat = 180;

                    // Alert check
                    if (nextCpu > cpuThreshold) {
                        alerts.push(`Węzeł [${node.name}] przekroczył bezpieczny poziom procesora: ${nextCpu}% > ${cpuThreshold}%`);
                    }

                    return {
                        ...node,
                        cpuUsage: nextCpu,
                        ramUsage: nextRam,
                        latency: nextLat
                    };
                });

                if (alerts.length > 0) {
                    setTriggeredAlerts(prev => {
                        const merged = [...alerts, ...prev];
                        return merged.slice(0, 15); // keep last 15 alerts
                    });
                }

                return updated;
            });

            // Update agent resource usage statistics
            setAgentUsageStats(prev => {
                const updated: Record<string, { cpu: number[], ram: number[] }> = { ...prev };
                agents.forEach(agent => {
                    const cpu = Math.floor(Math.random() * 100);
                    const ram = Math.floor(Math.random() * 100);
                    
                    if (!updated[agent.id]) {
                        updated[agent.id] = { cpu: [], ram: [] };
                    }
                    
                    const cpuHistory = [...updated[agent.id].cpu, cpu].slice(-20);
                    const ramHistory = [...updated[agent.id].ram, ram].slice(-20);
                    
                    updated[agent.id] = { cpu: cpuHistory, ram: ramHistory };
                });
                return updated;
            });

            // Live scrolling telemetry chart
            setLiveHistory(prev => {
                const nextPoint = {
                    name: new Date().toLocaleTimeString(),
                    system: Math.floor(Math.random() * 15) + 42,
                    interactions: Math.floor(Math.random() * 20) + 20,
                    entropy: Number((98 + Math.random() * 1.8).toFixed(2)),
                    activeThreads: Math.floor(Math.random() * 10) + 125
                };
                const shifted = [...prev.slice(1), nextPoint];
                return shifted;
            });

            // Pull fresh stats periodically too
            loadStats();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval, cpuThreshold, agents]);

    // Widget Action Handlers
    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const nextIndex = index + (direction === 'up' ? -1 : 1);
        if (nextIndex < 0 || nextIndex >= widgets.length) return;
        const copy = [...widgets];
        const temp = copy[index];
        copy[index] = copy[nextIndex];
        copy[nextIndex] = temp;
        saveLayout(copy);
    };

    const toggleWidgetVisibility = (id: string) => {
        const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
        saveLayout(updated);
    };

    const changeWidgetWidth = (id: string, width: DashboardWidget['width']) => {
        const updated = widgets.map(w => w.id === id ? { ...w, width } : w);
        saveLayout(updated);
    };

    const changeWidgetChartType = (id: string, chartType: 'line' | 'bar' | 'area') => {
        const updated = widgets.map(w => {
            if (w.id === id) {
                return {
                    ...w,
                    config: { ...w.config, chartType }
                };
            }
            return w;
        });
        saveLayout(updated);
    };

    const removeWidget = (id: string) => {
        const updated = widgets.filter(w => w.id !== id);
        saveLayout(updated);
    };

    const handleCreateWidget = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWidgetTitle.trim()) return;

        const newWidget: DashboardWidget = {
            id: `widget-custom-${Date.now()}`,
            type: newWidgetType,
            title: newWidgetTitle.trim(),
            width: newWidgetWidth,
            visible: true,
            config: {
                chartType: newWidgetChart,
                limit: 10
            }
        };

        saveLayout([...widgets, newWidget]);
        setNewWidgetTitle('');
        setShowAddWidget(false);
    };

    const resetLayoutToDefault = () => {
        if (window.confirm("Czy na pewno chcesz przywrócić domyślny układ widgetów?")) {
            saveLayout(DEFAULT_WIDGETS);
        }
    };

    // Quick Actions
    const runQuickAction = async (action: string) => {
        alert(`Uruchomiono akcję systemową: ${action}. Serwer weryfikuje status.`);
    };

    // Status calculators
    const onlineNodesCount = useMemo(() => clusterNodes.filter(n => n.status === 'online').length, [clusterNodes]);
    const avgLatency = useMemo(() => {
        const nodesWithLat = clusterNodes.filter(n => typeof n.latency === 'number' && n.status !== 'offline');
        if (nodesWithLat.length === 0) return 0;
        return Math.round(nodesWithLat.reduce((acc, curr) => acc + (curr.latency || 0), 0) / nodesWithLat.length);
    }, [clusterNodes]);

    const statsColors = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

    return (
        <div className="space-y-6 font-mono text-sm w-full select-none text-slate-300">
            {/* Header section with telemetry speed configuration */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-acid-cyan animate-pulse ring-4 ring-acid-cyan/10"></span>
                        <h2 className="text-xl font-display font-black uppercase text-white tracking-widest">Aparatura Telemetryczna Roju</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                        Zarządzanie dynamiczną przestrzenią widgetów, parametrami ostrzegawczymi klastrów i zachowaniami agentów w czasie rzeczywistym.
                    </p>
                </div>

                {/* Dashboard controls row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Interval speed */}
                    <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-2xl border border-white/5">
                        <Clock size={12} className="text-acid-cyan" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold mr-1.5">Odświeżanie:</span>
                        {[
                            { label: '⚡ 1S', val: 1000 },
                            { label: '🖥️ 2S', val: 2000 },
                            { label: '🔋 5S', val: 5000 },
                            { label: '⏸️ STOP', val: 0 }
                        ].map((item) => (
                            <button
                                key={item.val}
                                onClick={() => setRefreshInterval(item.val)}
                                className={`px-2 py-0.5 rounded text-[9px] font-black cursor-pointer transition-all ${
                                    refreshInterval === item.val 
                                        ? 'bg-acid-cyan text-black shadow-lg shadow-acid-cyan/20' 
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Dashboard Config Switcher */}
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer font-bold text-xs ${
                            isEditMode
                                ? 'bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/10'
                                : 'bg-white/5 text-white hover:bg-white/10 border-white/10'
                        }`}
                    >
                        <Settings size={14} className={isEditMode ? 'animate-spin-slow' : ''} />
                        {isEditMode ? 'Zatwierdź Układ' : 'Konfiguruj Pulpit'}
                    </button>

                    {/* PDF Exporter Button */}
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border bg-acid-purple/15 border-acid-purple/30 text-acid-purple-accent hover:bg-acid-purple/25 transition-all cursor-pointer font-bold text-xs"
                        style={{ color: '#c084fc' }}
                    >
                        <ArrowDown size={14} className="text-acid-purple" style={{ color: '#a855f7' }} />
                        Pobierz PDF
                    </button>
                </div>
            </div>

            {/* Configurator Drawer / Bar */}
            <AnimatePresence>
                {isEditMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-neutral-900 border border-yellow-500/30 rounded-3xl p-6 space-y-4"
                    >
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div>
                                <h3 className="text-yellow-400 font-bold uppercase text-xs flex items-center gap-2">
                                    <Sliders size={14} />
                                    Konfigurator Pulpitu Nawigacyjnego
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Zarządzaj widocznością widgetów, twórz nowe instancje z dedykowanymi metrykami i ustawiaj alerty.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAddWidget(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-acid-cyan hover:bg-cyan-400 text-black text-xs font-black rounded-xl transition cursor-pointer"
                                >
                                    <Plus size={12} />
                                    Nowy Widget
                                </button>
                                <button
                                    onClick={resetLayoutToDefault}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-950/70 text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                    <Trash2 size={12} />
                                    Resetuj Układ
                                </button>
                            </div>
                        </div>

                        {/* CPU Warning slider & widget visibility checks */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
                            <div className="space-y-2 bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
                                <span className="font-bold text-slate-300 block uppercase text-[10px]">Próg Alarmowy CPU klastrów:</span>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="range" 
                                        min="50" 
                                        max="95" 
                                        value={cpuThreshold} 
                                        onChange={(e) => {
                                            setCpuThreshold(Number(e.target.value));
                                            localStorage.setItem('dashboard_alert_cpu_threshold', e.target.value);
                                        }}
                                        className="flex-1 accent-acid-cyan"
                                    />
                                    <span className="font-mono font-bold text-acid-cyan text-sm">{cpuThreshold}%</span>
                                </div>
                                <p className="text-[9px] text-slate-500 leading-normal">
                                    Wartości telemetrii przekraczające ten próg wygenerują natychmiastowe sygnały ostrzegawcze w klastrze.
                                </p>
                            </div>

                            {/* Visibility check toggles list */}
                            <div className="md:col-span-2 space-y-2 bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
                                <span className="font-bold text-slate-300 block uppercase text-[10px] mb-2">Szybkie przełączanie widoczności:</span>
                                <div className="flex flex-wrap gap-2">
                                    {widgets.map(w => (
                                        <button
                                            key={w.id}
                                            onClick={() => toggleWidgetVisibility(w.id)}
                                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                w.visible 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            {w.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                                            {w.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Drawer modal for adding widget */}
                        {showAddWidget && (
                            <motion.form 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onSubmit={handleCreateWidget}
                                className="bg-black/80 border p-5 rounded-3xl border-acid-cyan/30 mt-4 space-y-4"
                            >
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-white font-bold text-xs uppercase flex items-center gap-1.5">
                                        <Plus size={14} className="text-acid-cyan" />
                                        Tworzenie nowego widgetu telemetrycznego
                                    </span>
                                    <button type="button" onClick={() => setShowAddWidget(false)} className="text-slate-400 hover:text-white">
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Nazwa Widgetu</label>
                                        <input 
                                            type="text" 
                                            placeholder="np. Obciążenie GPU Roju" 
                                            value={newWidgetTitle}
                                            onChange={(e) => setNewWidgetTitle(e.target.value)}
                                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-acid-cyan focus:ring-1 focus:ring-acid-cyan"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Typ Widoku / Źródło danych</label>
                                        <select 
                                            value={newWidgetType}
                                            onChange={(e) => setNewWidgetType(e.target.value as DashboardWidget['type'])}
                                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-acid-cyan"
                                        >
                                            <option value="kpi-cards">KPI Telemetrie Ogólne</option>
                                            <option value="load-trend">Bieżący Wykładnik Obciążenia</option>
                                            <option value="agent-messages">Wiadomości Agentów (Baza)</option>
                                            <option value="cluster-nodes">Węzły Klastra i Telemetria</option>
                                            <option value="heatmap">Aktywność Roju (Scatter Chart)</option>
                                            <option value="audit-logs">Dziennik Zdarzeń Systemowych</option>
                                            <option value="quick-actions">Centrala Szybkich Interwencji</option>
                                            <option value="agent-stats">Skuteczność i Tokenizacja Agentów</option>
                                            <option value="agent-load-distribution">Podział Obciążenia (Wiadomości)</option>
                                            <option value="teams-realization-time">Średni Czas Realizacji Zadań Zespołów</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Szerokość Siatki (Responsive)</label>
                                        <div className="flex bg-neutral-900 rounded-xl border border-white/10 p-1">
                                            {[
                                                { label: '1/3', val: 'col-span-1' },
                                                { label: '2/3', val: 'col-span-2' },
                                                { label: 'Pełny', val: 'col-span-3' }
                                            ].map((btn) => (
                                                <button
                                                    type="button"
                                                    key={btn.val}
                                                    onClick={() => setNewWidgetWidth(btn.val as any)}
                                                    className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                                                        newWidgetWidth === btn.val 
                                                            ? 'bg-acid-cyan text-black' 
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Domyślna Prezentacja Wykresu</label>
                                        <div className="flex bg-neutral-900 rounded-xl border border-white/10 p-1">
                                            {[
                                                { label: 'Obsz.', val: 'area' },
                                                { label: 'Linia', val: 'line' },
                                                { label: 'Słupek', val: 'bar' }
                                            ].map((btn) => (
                                                <button
                                                    type="button"
                                                    key={btn.val}
                                                    onClick={() => setNewWidgetChart(btn.val as any)}
                                                    className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                                                        newWidgetChart === btn.val 
                                                            ? 'bg-acid-cyan text-black' 
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 text-xs pt-1">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddWidget(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition"
                                    >
                                        Anuluj
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-4 py-2 bg-acid-cyan text-black font-black hover:bg-cyan-400 rounded-xl transition"
                                    >
                                        Wygeneruj Widget i Umieść na Siatce
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alert banner if triggered */}
            {triggeredAlerts.length > 0 && (
                <div className="bg-red-950/25 border border-red-500/30 rounded-3xl p-4 flex items-start gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>
                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5 animate-bounce" size={16} />
                    <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Wykryto Stany Krytyczne Systemu:</span>
                        <div className="max-h-16 overflow-y-auto space-y-1 pr-2 text-[11px] leading-relaxed text-slate-300 font-sans">
                            {triggeredAlerts.slice(0, 3).map((alert, i) => (
                                <p key={i}>• {alert}</p>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={() => setTriggeredAlerts([])}
                        className="text-[10px] font-bold text-red-400 border border-red-500/20 bg-red-500/10 px-2 py-1 rounded-xl hover:bg-red-500/25 cursor-pointer self-center"
                    >
                        Wyczyść Alerty
                    </button>
                </div>
            )}

            {/* The Customizable Grid Space */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {widgets.map((widget, index) => {
                    if (!widget.visible && !isEditMode) return null;

                    return (
                        <div 
                            key={widget.id}
                            className={`transition-all duration-300 flex flex-col justify-between ${widget.width} ${
                                !widget.visible ? 'opacity-30 border-dashed border-2 border-slate-700 bg-black/20' : 'bg-neutral-950/80'
                            } border border-white/5 p-6 rounded-3xl relative`}
                        >
                            {/* Visual glowing frame indicator matching type */}
                            <div className={`absolute top-0 left-6 w-12 h-[2px] ${
                                widget.type === 'kpi-cards' ? 'bg-acid-cyan' :
                                widget.type === 'cluster-nodes' ? 'bg-purple-500' :
                                widget.type === 'agent-stats' ? 'bg-acid-purple' :
                                widget.type === 'agent-load-distribution' ? 'bg-emerald-400' :
                                widget.type === 'load-trend' ? 'bg-emerald-500' :
                                widget.type === 'teams-realization-time' ? 'bg-amber-400' : 'bg-yellow-500'
                            }`} />

                            {/* Widget Config overlay if Edit mode is active */}
                            {isEditMode && (
                                <div className="absolute inset-x-0 -top-3 flex items-center justify-between px-4 z-20">
                                    <div className="flex bg-neutral-900 rounded-xl border border-white/10 p-1 gap-1 shadow-2xl">
                                        <button 
                                            onClick={() => moveWidget(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 bg-white/5 hover:bg-white/10 rounded cursor-pointer disabled:opacity-30"
                                            title="Przesuń wyżej"
                                        >
                                            <ArrowUp size={11} className="text-yellow-400" />
                                        </button>
                                        <button 
                                            onClick={() => moveWidget(index, 'down')}
                                            disabled={index === widgets.length - 1}
                                            className="p-1 bg-white/5 hover:bg-white/10 rounded cursor-pointer disabled:opacity-30"
                                            title="Przesuń niżej"
                                        >
                                            <ArrowDown size={11} className="text-yellow-400" />
                                        </button>
                                        <div className="w-[1px] bg-white/10 mx-1" />
                                        
                                        {/* Width selector inside edit tag */}
                                        {[
                                            { label: '1/3', val: 'col-span-1' },
                                            { label: '2/3', val: 'col-span-2' },
                                            { label: 'Full', val: 'col-span-3' }
                                        ].map((wBtn) => (
                                            <button
                                                key={wBtn.val}
                                                onClick={() => changeWidgetWidth(widget.id, wBtn.val as any)}
                                                className={`px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer transition-all ${
                                                    widget.width === wBtn.val ? 'bg-yellow-400 text-black' : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                {wBtn.label}
                                            </button>
                                        ))}

                                        {/* Chart representations toggle if applicable */}
                                        {['load-trend', 'agent-messages'].includes(widget.type) && (
                                            <>
                                                <div className="w-[1px] bg-white/10 mx-1" />
                                                {[
                                                    { label: 'Lin', val: 'line' },
                                                    { label: 'Obsz', val: 'area' },
                                                    { label: 'Słu', val: 'bar' }
                                                ].map((cBtn) => (
                                                    <button
                                                        key={cBtn.val}
                                                        onClick={() => changeWidgetChartType(widget.id, cBtn.val as any)}
                                                        className={`px-1 rounded text-[8px] font-black cursor-pointer transition-all ${
                                                            widget.config.chartType === cBtn.val ? 'bg-acid-cyan text-black' : 'text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {cBtn.label}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {widget.type === 'agent-load-distribution' && (
                                            <>
                                                <div className="w-[1px] bg-white/10 mx-1" />
                                                {[
                                                    { label: 'Słu', val: 'bar' },
                                                    { label: 'Koł', val: 'pie' }
                                                ].map((cBtn) => (
                                                    <button
                                                        key={cBtn.val}
                                                        onClick={() => changeWidgetChartType(widget.id, cBtn.val as any)}
                                                        className={`px-1 rounded text-[8px] font-black cursor-pointer transition-all ${
                                                            widget.config.chartType === cBtn.val ? 'bg-acid-cyan text-black' : 'text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {cBtn.label}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex bg-neutral-900 rounded-xl border border-white/10 p-1 shadow-2xl">
                                        <button 
                                            onClick={() => toggleWidgetVisibility(widget.id)}
                                            className="p-1 bg-white/5 hover:bg-slate-800 rounded mr-1 cursor-pointer text-slate-400"
                                            title={widget.visible ? "Ukryj" : "Pokaż"}
                                        >
                                            {widget.visible ? <EyeOff size={11} /> : <Eye size={11} />}
                                        </button>
                                        <button 
                                            onClick={() => removeWidget(widget.id)}
                                            className="p-1 bg-red-950/40 hover:bg-red-900 rounded cursor-pointer text-red-400"
                                            title="Usuń Widget"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Header details */}
                            <div className="flex items-center justify-between border-b border-white/[0.03] pb-3 mb-4 mt-1">
                                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                                    {widget.type === 'kpi-cards' && <Shield size={12} className="text-acid-cyan" />}
                                    {widget.type === 'load-trend' && <Activity size={12} className="text-emerald-400" />}
                                    {widget.type === 'agent-messages' && <Terminal size={12} className="text-purple-400" />}
                                    {widget.type === 'cluster-nodes' && <Network size={12} className="text-cyan-400" />}
                                    {widget.type === 'heatmap' && <LayoutGrid size={12} className="text-blue-400" />}
                                    {widget.type === 'audit-logs' && <Database size={12} className="text-yellow-400" />}
                                    {widget.type === 'quick-actions' && <Zap size={12} className="text-pink-400" />}
                                    {widget.type === 'agent-stats' && <Terminal size={12} className="text-acid-purple" />}
                                    {widget.type === 'agent-load-distribution' && <PieChartIcon size={12} className="text-emerald-400" />}
                                    {widget.type === 'teams-realization-time' && <Clock size={12} className="text-amber-400" />}
                                    {widget.title}
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{widget.type}</span>
                                    {!widget.visible && (
                                        <span className="text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold px-1.5 rounded uppercase">UKRYTY</span>
                                    )}
                                </div>
                            </div>

                            {/* Widget Contents based on dynamic Types */}
                            <div className="flex-1 min-h-[220px]">
                                {widget.type === 'kpi-cards' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono h-full items-center">
                                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-acid-cyan/30 transition">
                                            <span className="text-[9px] text-slate-500 uppercase block">Total komunikatów</span>
                                            <div className="text-lg font-black text-white">{stats.reduce((acc, curr) => acc + (curr.messageCount || 0), 0)}</div>
                                            <div className="text-[8px] text-acid-cyan animate-pulse mt-1">▲ Telemetria dynamiczna</div>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-cyan-400/30 transition">
                                            <span className="text-[9px] text-slate-500 uppercase block">Węzły klastra</span>
                                            <div className="text-lg font-black text-white flex items-baseline gap-1.5">
                                                <span>{onlineNodesCount} / {clusterNodes.length}</span>
                                                <span className="text-[9px] font-bold text-emerald-400 uppercase">ONLINE</span>
                                            </div>
                                            <div className="text-[8px] text-slate-500 mt-1">Status sprawności serwerów</div>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-purple-400/30 transition">
                                            <span className="text-[9px] text-slate-500 uppercase block">Śr. Latencja sieci</span>
                                            <div className="text-lg font-black text-white">{avgLatency}ms</div>
                                            <div className={`text-[8px] font-bold uppercase mt-1 ${avgLatency > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {avgLatency > 120 ? '● Saturated' : '● Stabilna'}
                                            </div>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-400/30 transition">
                                            <span className="text-[9px] text-slate-500 uppercase block">Zasoby procesowe rdz.</span>
                                            <div className="text-lg font-black text-slate-100 flex items-center gap-1.5">
                                                <Thermometer size={14} className="text-yellow-400 shrink-0" />
                                                <span>43.1 °C</span>
                                            </div>
                                            <div className="text-[8px] text-slate-500 mt-1">Temperatura modułu scalonego</div>
                                        </div>
                                    </div>
                                )}

                                {widget.type === 'load-trend' && (
                                    <div className="h-64 pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {widget.config.chartType === 'bar' ? (
                                                <BarChart data={liveHistory}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                                    <XAxis dataKey="name" stroke="#555" style={{ fontSize: '9px' }} />
                                                    <YAxis stroke="#555" style={{ fontSize: '9px' }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222' }} />
                                                    <Bar dataKey="system" name="Obciążenie jądra" fill="#06b6d4" />
                                                    <Bar dataKey="interactions" name="Komunikacja %" fill="#8884d8" />
                                                </BarChart>
                                            ) : widget.config.chartType === 'area' ? (
                                                <AreaChart data={liveHistory}>
                                                    <defs>
                                                        <linearGradient id="colorSystem" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                                        </linearGradient>
                                                        <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                                    <XAxis dataKey="name" stroke="#555" style={{ fontSize: '9px' }} />
                                                    <YAxis stroke="#555" style={{ fontSize: '9px' }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                                                    <Area type="monotone" dataKey="system" name="Obciążenie Systemu" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSystem)" />
                                                    <Area type="monotone" dataKey="interactions" name="Interakcje Roju / S" stroke="#8884d8" fillOpacity={1} fill="url(#colorInteractions)" />
                                                </AreaChart>
                                            ) : (
                                                <LineChart data={liveHistory}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                                    <XAxis dataKey="name" stroke="#555" style={{ fontSize: '9px' }} />
                                                    <YAxis stroke="#555" style={{ fontSize: '9px' }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                                                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                                                    <Line type="monotone" dataKey="system" name="CPU Core Load" stroke="#06b6d4" strokeWidth={2} dot={false} />
                                                    <Line type="monotone" dataKey="interactions" name="Entropy Index" stroke="#8884d8" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {widget.type === 'agent-load-distribution' && (
                                    <div className="h-64 pt-2">
                                        {stats.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed text-center px-4">
                                                Brak aktywności agentów do wygenerowania analizy obciążenia.
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                {widget.config.chartType === 'bar' ? (
                                                    <BarChart data={stats.filter(s => s.messageCount > 0)}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                        <XAxis dataKey="name" stroke="#555" style={{ fontSize: '9px' }} />
                                                        <YAxis stroke="#555" style={{ fontSize: '9px' }} />
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: '#090909', borderColor: '#333', borderRadius: '8px' }} 
                                                            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                        />
                                                        <Bar dataKey="messageCount" radius={[4, 4, 0, 0]}>
                                                            {stats.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color || '#888'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                ) : (
                                                    <PieChart>
                                                        <Pie
                                                            data={stats.filter(s => s.messageCount > 0)}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={3}
                                                            dataKey="messageCount"
                                                            nameKey="name"
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            fontSize={9}
                                                            fill="#888"
                                                        >
                                                            {stats.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color || '#888'} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: '#090909', borderColor: '#333', borderRadius: '8px' }}
                                                            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                        />
                                                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                                                    </PieChart>
                                                )}
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                )}

                                {widget.type === 'agent-messages' && (
                                    <div className="h-64 pt-2">
                                        {isLoadingOverTime ? (
                                            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold animate-pulse uppercase">
                                                Pobieranie wektorów aktywności agentów z bazy...
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                {widget.config.chartType === 'bar' ? (
                                                    <BarChart data={timelineData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                                        <XAxis dataKey="date" stroke="#555" style={{ fontSize: '9px' }} />
                                                        <YAxis stroke="#555" style={{ fontSize: '9px' }} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#222' }} />
                                                        {agentsInfo.map((agent, i) => (
                                                            <Bar key={agent.id} dataKey={agent.name} fill={agent.color || statsColors[i % statsColors.length]} />
                                                        ))}
                                                    </BarChart>
                                                ) : (
                                                    <LineChart data={timelineData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                                        <XAxis dataKey="date" stroke="#555" style={{ fontSize: '9px' }} />
                                                        <YAxis stroke="#555" style={{ fontSize: '9px' }} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222' }} />
                                                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                                                        {agentsInfo.map((agent, i) => (
                                                            <Line
                                                                key={agent.id}
                                                                type="monotone"
                                                                dataKey={agent.name}
                                                                stroke={agent.color || statsColors[i % statsColors.length]}
                                                                strokeWidth={2}
                                                                dot={{ r: 3 }}
                                                            />
                                                        ))}
                                                    </LineChart>
                                                )}
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                )}

                                {widget.type === 'cluster-nodes' && (
                                    <div className="space-y-3 pt-1">
                                        {clusterNodes.length === 0 ? (
                                            <div className="text-center py-8 text-slate-500 uppercase text-xs font-bold">Brak wykrytych klastrów operacyjnych</div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                                {clusterNodes.map(node => {
                                                    const isWarn = (node.cpuUsage || 0) > cpuThreshold;
                                                    return (
                                                        <div 
                                                            key={node.id} 
                                                            className={`p-3.5 rounded-2xl border transition-all ${
                                                                isWarn 
                                                                    ? 'bg-red-950/20 border-red-500/40' 
                                                                    : 'bg-black/50 border-white/[0.03] hover:border-white/10'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between font-mono mb-2">
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                                            node.status === 'online' ? 'bg-emerald-400 animate-pulse' :
                                                                            node.status === 'busy' ? 'bg-amber-400' : 'bg-red-500'
                                                                        }`} />
                                                                        <span className="font-bold text-white text-[10px] truncate block">{node.name} {node.isAndroid ? '📱' : ''}</span>
                                                                    </div>
                                                                    <span className="text-[8px] text-slate-500">{node.ip} • latency: {node.latency || 0}ms</span>
                                                                </div>
                                                                <span className="text-[7.5px] uppercase font-bold text-slate-500 border border-white/5 bg-white/[0.02] px-1.5 py-0.5 rounded-md">
                                                                    {node.protocol || 'WebSocket'}
                                                                </span>
                                                            </div>

                                                            {/* Health telemetry bars */}
                                                            <div className="space-y-1.5">
                                                                <div className="space-y-0.5">
                                                                    <div className="flex justify-between text-[8px] font-sans">
                                                                        <span className="text-slate-400">Zasoby procesora (CPU)</span>
                                                                        <span className={`font-mono font-bold ${isWarn ? 'text-red-400' : 'text-acid-cyan'}`}>{node.cpuUsage || 0}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden">
                                                                        <div 
                                                                            className={`h-full rounded-full transition-all duration-500 ${isWarn ? 'bg-red-500' : 'bg-acid-cyan'}`}
                                                                            style={{ width: `${node.cpuUsage || 0}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <div className="flex justify-between text-[8px] font-sans">
                                                                        <span className="text-slate-400">Pamięć RAM</span>
                                                                        <span className="font-mono text-slate-330">{node.ramUsage || 0}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                                                            style={{ width: `${node.ramUsage || 0}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {widget.type === 'heatmap' && (
                                    <div className="pt-2">
                                        <AgentActivityHeatmap />
                                    </div>
                                )}

                                {widget.type === 'audit-logs' && (
                                    <div className="space-y-3 pt-1">
                                        <div className="relative">
                                            <Search size={10} className="absolute left-2.5 top-2 text-slate-600" />
                                            <input 
                                                value={logSearch}
                                                onChange={(e) => setLogSearch(e.target.value)}
                                                className="w-full bg-black border border-white/5 text-[9px] text-white pl-7 pr-7 py-1 rounded-xl outline-none focus:border-acid-cyan/50 placeholder-slate-700"
                                                placeholder="Skanuj bufor logów..."
                                            />
                                            {logSearch && (
                                                <button onClick={() => setLogSearch('')} className="absolute right-2.5 top-1.5 text-slate-500 hover:text-white">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 font-mono text-[9px]">
                                            {systemLogs
                                                .filter(log => {
                                                    if (!logSearch.trim()) return true;
                                                    const s = logSearch.toLowerCase();
                                                    return (log.action?.toLowerCase()?.includes(s) || log.details?.toLowerCase()?.includes(s) || log.agentName?.toLowerCase()?.includes(s));
                                                })
                                                .slice(0, widget.config.limit || 10)
                                                .map((log, lIdx) => (
                                                    <div key={log.id || lIdx} className="bg-black/50 border border-white/[0.02] p-2 rounded-xl text-left hover:border-white/5 transition flex flex-col gap-1">
                                                        <div className="flex items-center justify-between text-[8px]">
                                                            <span className="font-bold text-slate-400 uppercase tracking-widest">
                                                                {log.agentName ? `${log.agentName} • APP` : 'SYSTEM_KERNEL'}
                                                            </span>
                                                            <span className="text-slate-600">
                                                                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'TICK'}
                                                            </span>
                                                        </div>
                                                        <p className="text-white font-sans text-[10px] py-0.5 leading-snug">{log.action}</p>
                                                        {log.details && (
                                                            <pre className="p-1 px-2 bg-neutral-900 rounded text-[8px] text-slate-500 overflow-x-auto truncate">
                                                                {log.details}
                                                            </pre>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {widget.type === 'agent-stats' && (
                                    <div className="pt-2">
                                        {agents.length === 0 ? (
                                            <div className="text-center text-[10px] text-slate-500 py-8 uppercase tracking-widest font-black">
                                                Brak aktywnych agentów w sieci.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {agents.map(ag => {
                                                    const tokens = ag.tokensUsed || Math.floor(Math.random() * 50000) + 1000;
                                                    const succRate = ag.successRate || Math.floor(Math.random() * 20) + 80;
                                                    return (
                                                        <div key={ag.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.color || '#888' }} />
                                                                    {ag.name}
                                                                </span>
                                                                <span className="text-[9px] text-slate-500 uppercase">{ag.role || 'Agent'}</span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <div className="flex justify-between items-center text-[9px] mb-1">
                                                                        <span className="text-slate-400">Wykorzystane Tokeny (Est.)</span>
                                                                        <span className="text-acid-cyan font-bold">{tokens.toLocaleString()} TKNS</span>
                                                                    </div>
                                                                    <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden">
                                                                        <div className="h-full bg-acid-cyan rounded-full" style={{ width: `${Math.min(100, (tokens / 100000) * 100)}%` }} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between items-center text-[9px] mb-1">
                                                                        <span className="text-slate-400">Wskaźnik Sukcesu (Success Rate)</span>
                                                                        <span className={`font-bold ${succRate >= 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>{succRate}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden">
                                                                        <div className={`h-full rounded-full transition-all duration-500 ${succRate >= 90 ? 'bg-emerald-400' : 'bg-yellow-400'}`} style={{ width: `${succRate}%` }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {widget.type === 'quick-actions' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono h-full items-center pt-2">
                                        {[
                                            { label: 'Szyfrowanie jądra', desc: 'Regeneracja entropii', key: 'security', icon: Shield },
                                            { label: 'Węzeł Core-DNS', desc: 'Monitor rutingów IP', key: 'network', icon: Network },
                                            { label: 'Analiza agentów', desc: 'Konsolidacja wątków', key: 'tune', icon: Cpu },
                                            { label: 'Reset klastrów', desc: 'Ruch awaryjny', key: 'reboot', icon: Zap }
                                        ].map((action, aIdx) => (
                                            <button 
                                                key={aIdx}
                                                onClick={() => runQuickAction(action.label)}
                                                className="p-3.5 bg-black/55 hover:bg-black border border-white/5 hover:border-acid-cyan/50 rounded-2xl text-left transition group cursor-pointer"
                                            >
                                                <action.icon className="text-acid-cyan group-hover:text-white mb-2" size={16} />
                                                <div className="font-bold text-white uppercase text-[9.5px] tracking-wide leading-tight truncate">{action.label}</div>
                                                <div className="text-[8px] text-slate-500 mt-1 truncate">{action.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {widget.type === 'teams-realization-time' && (
                                    <div className="pt-2 flex flex-col gap-4">
                                        <div className="h-64">
                                            {teamsRealizationTimeData.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed text-center px-4">
                                                    Brak zespołów do wygenerowania analizy wydajności.
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={teamsRealizationTimeData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                        <XAxis 
                                                            dataKey="name" 
                                                            stroke="#555" 
                                                            style={{ fontSize: '9px', fontWeight: 'bold' }} 
                                                        />
                                                        <YAxis 
                                                            stroke="#555" 
                                                            style={{ fontSize: '9px' }}
                                                            label={{ value: 'Czas (minuty)', angle: -90, position: 'insideLeft', style: { fill: '#555', fontSize: '9px', fontWeight: 'bold' } }}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: '#090909', borderColor: '#333', borderRadius: '12px' }} 
                                                            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                            formatter={(value: any) => [`${value} min`, 'Średni czas realizacji']}
                                                        />
                                                        <Bar dataKey="avgTime" radius={[6, 6, 0, 0]}>
                                                            {teamsRealizationTimeData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color || '#a855f7'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                        
                                        {/* Dynamic stats overview in small cards beneath */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                                            {teamsRealizationTimeData.map((team, idx) => (
                                                <div key={idx} className="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col justify-between hover:border-white/10 transition">
                                                    <div className="flex justify-between items-start mb-1 gap-1.5 min-w-0">
                                                        <span className="font-bold text-white text-[10px] uppercase truncate" style={{ color: team.color }}>
                                                            {team.name}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                                                            <span>Śr. czas:</span>
                                                            <span className="text-white font-black">{team.avgTime} {team.unit}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                                                            <span>Zadania:</span>
                                                            <span className="text-white font-black">{team.tasksCompleted}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Agent Resources */}
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                <h3 className="text-lg font-display uppercase font-bold text-white mb-6">Historyczne zużycie zasobów każdego agenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map(agent => (
                        <div key={agent.id} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }}></div>
                                <span className="font-bold text-xs text-slate-300">{agent.name}</span>
                            </div>
                            <div className="h-24">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={agentUsageStats[agent.id]?.cpu.map((c, i) => ({ cpu: c, ram: agentUsageStats[agent.id].ram[i], name: i })) || []}>
                                    <Line type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="ram" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-2">
                                <span>CPU</span>
                                <span>RAM</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AreaChart showing historical CPU/RAM */}
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                <h3 className="text-lg font-display uppercase font-bold text-white mb-6">Historyczne Zapotrzebowanie Zasobów (CPU/RAM)</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metricsHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="time" stroke="#475569" tickLine={false} tick={{ fontSize: 10 }} />
                            <YAxis stroke="#475569" domain={[0, 100]} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '10px' }} />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Area type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                            <Area type="monotone" dataKey="ram" name="RAM Usage (%)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Agent Versatility Radar Chart */}
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
              <h3 className="text-lg font-display uppercase font-bold text-white mb-6">Wskaźnik wszechstronności (Radar Roju)</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                    agents.length > 0 ? 
                    agents.map(a => ({
                      subject: a.name,
                      A: Math.random() * 100, // XP
                      B: Math.random() * 100, // Success
                      C: Math.random() * 100  // Speed
                    })) : 
                    [{ subject: 'Agent A', A: 80, B: 90, C: 70 }, { subject: 'Agent B', A: 60, B: 80, C: 90 }]
                  }>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} />
                    <Radar name="XP" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Radar name="Success" dataKey="B" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                    <Radar name="Speed" dataKey="C" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Existing footer/other content? */}
        </div>
    );
});

