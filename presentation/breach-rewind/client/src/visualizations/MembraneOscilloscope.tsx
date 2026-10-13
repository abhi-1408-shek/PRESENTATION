// ============================================================
// BREACH//REWIND — Membrane Potential Oscilloscope (Canvas)
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationTrace, NEURON_COLORS, NEURON_LABELS } from '@shared/types';

interface Props {
  statefulTrace: SimulationTrace | null;
  statelessTrace: SimulationTrace | null;
  currentTime: number;
  compareMode: boolean;
  memoryEnabled: boolean;
  selectedNeuron?: number;
  onSeek?: (time: number) => void;
}

export const MembraneOscilloscope: React.FC<Props> = ({
  statefulTrace,
  statelessTrace,
  currentTime,
  compareMode,
  memoryEnabled,
  selectedNeuron = 4,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !statefulTrace) return;

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

    // Clear
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    const params = statefulTrace.params;
    const vMin = params.V_rest - 5;
    const vMax = params.V_thresh + 10;
    const duration = statefulTrace.duration;

    const padLeft = 55;
    const padRight = 15;
    const padTop = 20;
    const padBottom = 30;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    const timeToX = (t: number) => padLeft + (t / duration) * plotW;
    const vToY = (v: number) => padTop + plotH - ((v - vMin) / (vMax - vMin)) * plotH;

    // Grid
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.06)';
    ctx.lineWidth = 0.5;
    for (let v = Math.ceil(vMin / 5) * 5; v <= vMax; v += 5) {
      const y = vToY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();
    }
    for (let t = 0; t <= duration; t += 10) {
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, H - padBottom);
      ctx.stroke();
    }

    // Resting potential line
    const restY = vToY(params.V_rest);
    ctx.strokeStyle = 'rgba(0, 180, 216, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, restY);
    ctx.lineTo(W - padRight, restY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Threshold line
    const threshY = vToY(params.V_thresh);
    ctx.strokeStyle = 'rgba(255, 42, 109, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(padLeft, threshY);
    ctx.lineTo(W - padRight, threshY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 42, 109, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('V_thresh', padLeft + 4, threshY - 4);
    ctx.fillStyle = 'rgba(0, 180, 216, 0.5)';
    ctx.fillText('V_rest', padLeft + 4, restY - 4);

    // Y-axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'right';
    ctx.font = '9px "JetBrains Mono", monospace';
    for (let v = Math.ceil(vMin / 10) * 10; v <= vMax; v += 10) {
      ctx.fillText(`${v}`, padLeft - 4, vToY(v) + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    for (let t = 0; t <= duration; t += 10) {
      ctx.fillText(`${t}s`, timeToX(t), H - padBottom + 15);
    }

    // Draw membrane trace
    const drawTrace = (trace: SimulationTrace, neuronIdx: number, color: string, alpha: number = 1) => {
      const steps = trace.steps;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha;
      ctx.beginPath();

      const step = Math.max(1, Math.floor(steps.length / plotW));
      for (let i = 0; i < steps.length; i += step) {
        const x = timeToX(steps[i].time);
        const y = vToY(steps[i].neuronState.potentials[neuronIdx]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw spike markers
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].neuronState.spikes[neuronIdx]) {
          const x = timeToX(steps[i].time);
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(x, vToY(params.V_thresh), 4, 0, Math.PI * 2);
          ctx.fill();

          // Spike line upward
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, vToY(params.V_thresh));
          ctx.lineTo(x, padTop + 5);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    };

    // Primary trace
    const activeTrace = memoryEnabled ? statefulTrace : statelessTrace;
    if (activeTrace) {
      drawTrace(activeTrace, selectedNeuron, NEURON_COLORS[selectedNeuron] || '#00F2FE', 1);
    }

    // Comparison overlay
    if (compareMode && statelessTrace && statefulTrace) {
      const altTrace = memoryEnabled ? statelessTrace : statefulTrace;
      drawTrace(altTrace, selectedNeuron, 'rgba(157, 78, 221, 0.6)', 0.5);
    }

    // Current time indicator
    const curX = timeToX(currentTime);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, H - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current time dot
    if (activeTrace) {
      const stepIdx = Math.min(
        Math.floor(currentTime / params.dt),
        activeTrace.totalSteps - 1
      );
      const step = activeTrace.steps[Math.max(0, stepIdx)];
      if (step) {
        const cy = vToY(step.neuronState.potentials[selectedNeuron]);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(curX, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = NEURON_COLORS[selectedNeuron] || '#00F2FE';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value tooltip
        const val = step.neuronState.potentials[selectedNeuron].toFixed(1);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(curX + 8, cy - 12, 60, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${val} mV`, curX + 12, cy + 2);
      }
    }

    // Title
    ctx.font = 'bold 11px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(`MEMBRANE POTENTIAL — ${NEURON_LABELS[selectedNeuron] || `Neuron ${selectedNeuron}`}`, padLeft, 14);

  }, [statefulTrace, statelessTrace, currentTime, compareMode, memoryEnabled, selectedNeuron]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    if (!onSeek || !statefulTrace || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padLeft = 55;
    const padRight = 15;
    const plotW = rect.width - padLeft - padRight;
    const x = e.clientX - rect.left - padLeft;
    const t = Math.max(0, Math.min(statefulTrace.duration, (x / plotW) * statefulTrace.duration));
    onSeek(t);
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[180px] cursor-crosshair" onClick={handleClick}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
