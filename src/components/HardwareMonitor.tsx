import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Network, Zap, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

export const HardwareMonitor = React.memo(() => {
  const [stats, setStats] = useState({
    cpu: { percent: 15, raw: '0.8 GHz' },
    ram: { percent: 45, raw: '7.2 GB' },
    disk: { percent: 62, raw: '124 MB/s' },
    net: { percent: 12, raw: '45 Mbps' },
    gpu: { percent: 20, raw: '1.2 GB' }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: { percent: Math.max(5, Math.min(100, prev.cpu.percent + (Math.random() * 20 - 10))), raw: `${(Math.random() * 2 + 0.5).toFixed(1)} GHz` },
        ram: { percent: Math.max(20, Math.min(100, prev.ram.percent + (Math.random() * 10 - 5))), raw: `${(Math.random() * 8 + 4).toFixed(1)} GB` },
        disk: { percent: Math.max(10, Math.min(100, prev.disk.percent + (Math.random() * 2 - 1))), raw: `${(Math.random() * 200 + 50).toFixed(0)} MB/s` },
        net: { percent: Math.max(0, Math.min(100, prev.net.percent + (Math.random() * 30 - 15))), raw: `${(Math.random() * 100 + 10).toFixed(0)} Mbps` },
        gpu: { percent: Math.max(0, Math.min(100, prev.gpu.percent + (Math.random() * 25 - 12))), raw: `${(Math.random() * 4 + 0.5).toFixed(1)} GB` }
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (val: number) => {
    if (val > 80) return 'text-red-500 bg-red-500 shadow-red-500/50';
    if (val > 60) return 'text-amber-500 bg-amber-500 shadow-amber-500/50';
    return 'text-[#8ab4f8] bg-[#8ab4f8] shadow-[#8ab4f8]/50'; 
  };

  const metrics = [
    { label: 'CPU', value: stats.cpu, icon: Cpu },
    { label: 'RAM', value: stats.ram, icon: Zap },
    { label: 'DSK', value: stats.disk, icon: HardDrive },
    { label: 'NET', value: stats.net, icon: Network },
    { label: 'GPU', value: stats.gpu, icon: Monitor }
  ];

  return (
    <div className="p-4 mx-4 mt-2 mb-4 rounded-xl bg-gradient-to-br from-[#2a2d32] to-[#1e2024] border border-[#4a4f55] shadow-[inset_0_1px_rgba(255,255,255,0.05),0_8px_16px_rgba(0,0,0,0.4)] relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
      <div className="text-[10px] uppercase font-black tracking-widest text-[#9ba1a8] mb-4 flex items-center justify-between">
        <span>Zasoby Systemu (Host)</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
      </div>

      <div className="space-y-4">
        {metrics.map((m, i) => {
          const colors = getMetricColor(m.value.percent);
          const textColor = colors.split(' ')[0];
          const bgColor = colors.split(' ')[1];
          const shadowColor = colors.split(' ')[2];
          
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                <div className="flex items-center gap-2 text-[#a0a5ab]">
                  <m.icon size={11} className={m.value.percent > 80 ? "text-red-500 animate-bounce" : ""} />
                  <span className="tracking-wider">{m.label}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500">{m.value.raw}</span>
                  <span className={textColor}>{Math.round(m.value.percent)}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#121416] rounded-full overflow-hidden border border-[#1f2125] shadow-inner relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InRyYW5zcGFyZW50Ii8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjQiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-50 z-10 pointer-events-none"></div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value.percent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full ${bgColor} ${shadowColor} rounded-full relative z-20`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
});
