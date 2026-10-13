// ============================================================
// BREACH//REWIND — Simulation Summary Panel
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Zap, Target, TrendingUp } from 'lucide-react';
import { SimulationTrace, NEURON_LABELS, NEURON_COLORS } from '@shared/types';

interface Props {
  trace: SimulationTrace | null;
  scenarioName: string;
}

export const SummaryPanel: React.FC<Props> = ({ trace, scenarioName }) => {
  if (!trace) return null;

  const { summary } = trace;
  const totalSpikes = summary.totalSpikes.reduce((a, b) => a + b, 0);

  const formatTime = (t: number | null) => {
    if (t === null) return '—';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-cyber-cyan" />
        <h3 className="font-display text-sm font-semibold tracking-wider text-slate-300 uppercase">
          Trace Summary — {scenarioName}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="text-center p-2 rounded-lg bg-void-50">
          <span className="label-mono">Events</span>
          <div className="font-mono text-xl font-bold text-cyber-cyan">
            {summary.totalEvents}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-void-50">
          <span className="label-mono">Total Spikes</span>
          <div className="font-mono text-xl font-bold text-cyber-red">
            {totalSpikes}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-void-50">
          <span className="label-mono">Duration</span>
          <div className="font-mono text-xl font-bold text-slate-300">
            {trace.duration}s
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-void-50">
          <span className="label-mono">Steps</span>
          <div className="font-mono text-xl font-bold text-slate-400">
            {trace.totalSteps}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {NEURON_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span
              className="font-mono w-28 text-right truncate"
              style={{ color: NEURON_COLORS[i] }}
            >
              {label}
            </span>
            <div className="flex items-center gap-2 flex-1">
              <Zap className="w-3 h-3 text-slate-500" />
              <span className="font-mono text-slate-400">
                {summary.totalSpikes[i]} spike(s)
              </span>
              <Clock className="w-3 h-3 text-slate-500 ml-2" />
              <span className="font-mono text-slate-400">
                First: {formatTime(summary.firstSpikeTime[i])}
              </span>
              <span className="font-mono text-slate-500 ml-2">
                V_final: {summary.finalPotentials[i]?.toFixed(1)} mV
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
