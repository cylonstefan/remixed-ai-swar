import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Network, Zap, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

export const HardwareMonitor = React.memo(() => {
  const [stats, setStats] = useState({
    cpu: 0,
    ram: 0,
    disk: 0,
    net: 0,
    gpu: 0
  });

  useEffect(() => {
    // Initial random state
    setStats({
      cpu: Math.floor(Math.random() * 30) + 10,
      ram: Math.floor(Math.random() * 20) + 40,
      disk: Math.floor(Math.random() * 5) + 60,
      net: Math.floor(Math.random() * 40) + 5,
      gpu: Math.floor(Math.random() * 25) + 15
    });

    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: Math.max(5, Math.min(100, prev.cpu + (Math.random() * 20 - 10))),
        ram: Math.max(20, Math.min(100, prev.ram + (Math.random() * 10 - 5))),
        disk: Math.max(10, Math.min(100, prev.disk + (Math.random() * 2 - 1))),
        net: Math.max(0, Math.min(100, prev.net + (Math.random() * 30 - 15))),
        gpu: Math.max(0, Math.min(100, prev.gpu + (Math.random() * 25 - 12)))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (val: number) => {
    if (val > 80) return 'text-red-500 bg-red-500 shadow-red-500/50';
    if (val > 60) return 'text-amber-500 bg-amber-500 shadow-amber-500/50';
    return 'text-[#8ab4f8] bg-[#8ab4f8] shadow-[#8ab4f8]/50'; // Metallic light blue
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
      {/* Metallic specular reflection */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
      <div className="text-[10px] uppercase font-black tracking-widest text-[#9ba1a8] mb-4 flex items-center justify-between">
        <span>Zasoby Sprzętowe</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
      </div>

      <div className="space-y-4">
        {metrics.map((m, i) => {
          const colors = getMetricColor(m.value);
          const textColor = colors.split(' ')[0];
          const bgColor = colors.split(' ')[1];
          const shadowColor = colors.split(' ')[2];
          
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                <div className="flex items-center gap-2 text-[#a0a5ab]">
                  <m.icon size={11} className={m.value > 80 ? "text-red-500 animate-bounce" : ""} />
                  <span className="tracking-wider">{m.label}</span>
                </div>
                <span className={textColor}>{Math.round(m.value)}%</span>
              </div>
              <div className="w-full h-2 bg-[#121416] rounded-full overflow-hidden border border-[#1f2125] shadow-inner relative">
                {/* Background grid lines for tech look */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InRyYW5zcGFyZW50Ii8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjQiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-50 z-10 pointer-events-none"></div>
                
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
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
