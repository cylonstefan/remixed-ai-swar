import React, { useEffect, useRef, useState } from 'react';
import * as Lucide from 'lucide-react';
import { api } from '../services/api';

export function NeuralHiveFlux() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getSwarmHealth().then(setStats).catch(() => {});
    
    const interval = setInterval(() => {
        api.getSwarmHealth().then(setStats).catch(() => {});
    }, 15000);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    const particleCount = 1500; // Visualizing thousands of agents

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      hue: number;
      size: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.hue = Math.random() < 0.2 ? 180 : 270; // Cyan or Purple
        this.size = Math.random() * 1.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.fillStyle = `hsla(${this.hue}, 100%, 50%, ${Math.random() * 0.5 + 0.2})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Occasional pulses representing "agent activations"
        if (Math.random() > 0.999) {
          ctx.strokeStyle = `hsla(${this.hue}, 100%, 50%, 0.3)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black/60 rounded-[2.5rem] border border-white/5 overflow-hidden group">
      <canvas ref={canvasRef} className="w-full h-full opacity-40" />
      
      <div className="absolute top-6 left-8 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-acid-cyan/20 text-acid-cyan rounded-lg border border-acid-cyan/30 animate-pulse">
            <Lucide.ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="text-white font-black uppercase text-xs tracking-tighter italic">Hive Supremacy Protocol</h3>
            <p className="text-[9px] text-acid-cyan font-bold uppercase tracking-widest opacity-70">
              {stats?.swarmScale.activeNodes.toLocaleString()} Synergistic Nodes • 100% Reliability
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {stats?.swarmScale?.domainMastery?.map((d: any, i: number) => (
            <div key={i} className="flex flex-col items-center animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>
              <div className="text-[9px] text-white/30 uppercase font-black tracking-widest leading-none mb-1">{d.domain}</div>
              <div className="text-lg font-black text-white italic drop-shadow-[0_0_8px_white]">{d.level}%</div>
              <div className="text-[7px] text-acid-cyan font-bold uppercase">{d.nodes} Agents Optimized</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end pointer-events-none">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-white/40 uppercase italic">Synergy Cohesion</div>
          <div className="flex gap-1">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="w-4 h-1 bg-acid-cyan shadow-[0_0_10px_cyan]" />
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[14px] font-black text-acid-cyan font-mono italic">
            { stats?.swarmScale.throughput || "..." } TF/s
          </div>
          <div className="text-[8px] text-white/30 uppercase font-bold tracking-widest leading-none">Universal Hive Output</div>
        </div>
      </div>
      
      {/* HUD Accents */}
      <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none group-hover:border-acid-cyan/20 transition-colors" />
      <div className="absolute top-0 right-0 p-4 flex gap-2">
         <Lucide.Trophy size={14} className="text-amber-500 opacity-30 animate-bounce" />
         <Lucide.Zap size={14} className="text-acid-cyan opacity-30 animate-pulse" />
      </div>
    </div>
  );
}
