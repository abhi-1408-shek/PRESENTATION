// ============================================================
// BREACH//REWIND — Cinematic Event Flow Tunnel (Canvas)
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationStep, EventSeverity } from '@shared/types';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

const SEVERITY_COLORS: Record<EventSeverity | 'idle', string> = {
  idle: '#00B4D8',
  normal: '#00F2FE',
  suspicious: '#F59E0B',
  critical: '#FF2A6D',
};

interface Props {
  currentStep: SimulationStep | null;
  severity: EventSeverity | 'idle';
  isPlaying: boolean;
  hasSpiked: boolean;
}

export const EventFlowTunnel: React.FC<Props> = ({
  currentStep,
  severity,
  isPlaying,
  hasSpiked,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const spawnParticle = useCallback(
    (W: number, H: number): Particle => {
      const color = SEVERITY_COLORS[severity];
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 80;
      return {
        x: W / 2 + Math.cos(angle) * radius,
        y: H / 2 + Math.sin(angle) * radius,
        z: Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: -(1 + Math.random() * 2),
        size: 1 + Math.random() * 2.5,
        life: 0,
        maxLife: 60 + Math.random() * 120,
        color,
      };
    },
    [severity]
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    // Background with radial gradient
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    bg.addColorStop(0, '#0a0f1e');
    bg.addColorStop(1, '#060913');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Concentric tunnel rings
    const color = SEVERITY_COLORS[severity];
    for (let r = 0; r < 5; r++) {
      const radius = 30 + r * 35;
      const alpha = 0.03 + (hasSpiked ? 0.05 : 0);
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Spawn particles
    const spawnRate = severity === 'critical' ? 4 : severity === 'suspicious' ? 2 : 1;
    if (isPlaying || particlesRef.current.length < 30) {
      for (let s = 0; s < spawnRate; s++) {
        if (particlesRef.current.length < 200) {
          particlesRef.current.push(spawnParticle(W, H));
        }
      }
    }

    // Update and draw particles
    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.life++;

      if (p.life >= p.maxLife || p.z < -50) continue;

      const perspective = 1 + p.z / 300;
      const screenX = W / 2 + (p.x - W / 2) * perspective;
      const screenY = H / 2 + (p.y - H / 2) * perspective;
      const size = p.size * Math.max(0.2, perspective);
      const alpha = Math.max(0, 1 - p.life / p.maxLife) * 0.7;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      if (size > 1.5) {
        const glow = ctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, size * 3
        );
        glow.addColorStop(0, p.color + '30');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(screenX - size * 3, screenY - size * 3, size * 6, size * 6);
      }

      alive.push(p);
    }
    ctx.globalAlpha = 1;
    particlesRef.current = alive;

    // Spike flash effect
    if (hasSpiked) {
      const flash = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 3);
      flash.addColorStop(0, 'rgba(255, 42, 109, 0.15)');
      flash.addColorStop(1, 'transparent');
      ctx.fillStyle = flash;
      ctx.fillRect(0, 0, W, H);
    }

    // Center focal point
    const focal = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 5);
    focal.addColorStop(0, color);
    focal.addColorStop(1, 'transparent');
    ctx.fillStyle = focal;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    animRef.current = requestAnimationFrame(animate);
  }, [severity, isPlaying, hasSpiked, spawnParticle]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animate]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden rounded-xl">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: SEVERITY_COLORS[severity] }}
        />
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          SIGNAL FLOW
        </span>
      </div>
    </div>
  );
};
