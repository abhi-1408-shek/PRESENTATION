// ============================================================
// BREACH//REWIND — Spike Raster Plot (Canvas)
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationTrace, NEURON_COLORS, NEURON_LABELS } from '@shared/types';

interface Props {
  trace: SimulationTrace | null;
  currentTime: number;
  onSeek?: (time: number) => void;
}

export const SpikeRaster: React.FC<Props> = ({ trace, currentTime, onSeek }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !trace) return;

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
    const numNeurons = trace.params.numNeurons;
    const duration = trace.duration;

    const padLeft = 110;
    const padRight = 15;
    const padTop = 25;
    const padBottom = 25;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;
    const rowH = plotH / numNeurons;

    const timeToX = (t: number) => padLeft + (t / duration) * plotW;

    // Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.font = 'bold 11px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('SPIKE RASTER — NEURON POPULATION', padLeft, 14);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
    ctx.lineWidth = 0.5;
    for (let t = 0; t <= duration; t += 10) {
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, H - padBottom);
      ctx.stroke();
    }

    // Row separators and neuron labels
    for (let n = 0; n < numNeurons; n++) {
      const y = padTop + n * rowH;
      const centerY = y + rowH / 2;

      // Row background
      if (n % 2 === 0) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.015)';
        ctx.fillRect(padLeft, y, plotW, rowH);
      }

      // Separator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();

      // Label
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = NEURON_COLORS[n] || '#00F2FE';
      ctx.textAlign = 'right';
      ctx.fillText(NEURON_LABELS[n] || `Neuron ${n}`, padLeft - 8, centerY + 3);

      // Spike count badge
      const count = trace.summary.totalSpikes[n];
      if (count > 0) {
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 42, 109, 0.7)';
        ctx.fillText(`×${count}`, padLeft - 8, centerY + 14);
      }
    }

    // Draw spikes
    for (let i = 0; i < trace.steps.length; i++) {
      const step = trace.steps[i];
      for (let n = 0; n < numNeurons; n++) {
        if (step.neuronState.spikes[n]) {
          const x = timeToX(step.time);
          const y = padTop + n * rowH;
          const color = NEURON_COLORS[n] || '#00F2FE';

          // Spike tick mark
          ctx.fillStyle = color;
          ctx.fillRect(x - 1.5, y + 3, 3, rowH - 6);

          // Glow effect
          const gradient = ctx.createRadialGradient(x, y + rowH / 2, 0, x, y + rowH / 2, 8);
          gradient.addColorStop(0, color + '40');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(x - 8, y, 16, rowH);
        }
      }
    }

    // Current time marker
    const curX = timeToX(currentTime);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, H - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // X-axis time labels
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.textAlign = 'center';
    for (let t = 0; t <= duration; t += 10) {
      ctx.fillText(`${t}s`, timeToX(t), H - padBottom + 14);
    }
  }, [trace, currentTime]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    if (!onSeek || !trace || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padLeft = 110;
    const padRight = 15;
    const plotW = rect.width - padLeft - padRight;
    const x = e.clientX - rect.left - padLeft;
    const t = Math.max(0, Math.min(trace.duration, (x / plotW) * trace.duration));
    onSeek(t);
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[140px] cursor-crosshair" onClick={handleClick}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
