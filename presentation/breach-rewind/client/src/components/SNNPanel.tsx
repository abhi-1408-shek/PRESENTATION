// ============================================================
// BREACH//REWIND — Stateful LIF SNN Panel
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Activity } from 'lucide-react';
import {
  SimulationStep,
  CyberEvent,
  SimulationTrace,
  LIFParams,
  NEURON_LABELS,
  NEURON_COLORS,
} from '@shared/types';

interface Props {
  currentStep: SimulationStep | null;
  activeEvent: CyberEvent | null;
  trace: SimulationTrace | null;
  params: LIFParams;
  memoryEnabled: boolean;
  currentTime: number;
}

export const SNNPanel: React.FC<Props> = ({
  currentStep,
  activeEvent,
  trace,
  params,
  memoryEnabled,
  currentTime,
}) => {
  const score = currentStep?.snnThreatScore ?? 0;
  const scorePercent = Math.round(score * 100);
  const hasSpikedNow = currentStep?.neuronState.spikes.some(Boolean) ?? false;
  const totalSpikes =
    currentStep?.neuronState.spikeCounts.reduce((a, b) => a + b, 0) ?? 0;

  const getScoreColor = (s: number) => {
    if (s < 0.3) return '#10B981';
    if (s < 0.6) return '#F59E0B';
    return '#FF2A6D';
  };

  const color = getScoreColor(score);

  return (
    <div
      className={`glass-panel p-4 h-full flex flex-col transition-all duration-300 ${
        hasSpikedNow ? 'alert-glow' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-cyber-cyan" />
        <h3 className="font-display text-sm font-semibold tracking-wider text-slate-300 uppercase">
          Stateful Spiking Network
        </h3>
        <div
          className={`ml-auto px-2 py-0.5 rounded text-[9px] font-mono tracking-wider ${
            memoryEnabled
              ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30'
              : 'bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/30'
          }`}
        >
          {memoryEnabled ? 'MEMORY ON' : 'MEMORY OFF'}
        </div>
      </div>

      {/* Threat score + spike indicator */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 264} 264`}
              initial={false}
              animate={{ strokeDasharray: `${score * 264} 264` }}
              transition={{ duration: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-bold" style={{ color }}>
              {scorePercent}%
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {hasSpikedNow && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyber-red/15 border border-cyber-red/30"
            >
              <Zap className="w-3.5 h-3.5 text-cyber-red" />
              <span className="font-mono text-[10px] text-cyber-red tracking-wider font-bold">
                SPIKE DETECTED
              </span>
            </motion.div>
          )}
          <div className="flex items-center gap-3">
            <div>
              <span className="label-mono">Total Spikes</span>
              <div className="font-mono text-lg font-bold text-cyber-cyan">
                {totalSpikes}
              </div>
            </div>
            <div>
              <span className="label-mono">Neurons</span>
              <div className="font-mono text-lg font-bold text-slate-300">
                {params.numNeurons}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-neuron membrane potentials */}
      <div className="space-y-1.5 mb-3">
        <span className="label-mono">Membrane Potentials</span>
        {currentStep &&
          NEURON_LABELS.slice(0, params.numNeurons).map((label, i) => {
            const v = currentStep.neuronState.potentials[i];
            const normalizedV =
              ((v - params.V_rest) / (params.V_thresh - params.V_rest)) * 100;
            const spiked = currentStep.neuronState.spikes[i];
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="font-mono text-[9px] w-20 text-right truncate"
                  style={{ color: NEURON_COLORS[i] }}
                >
                  {label}
                </span>
                <div className="flex-1 h-2 bg-void-200 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: NEURON_COLORS[i] }}
                    initial={false}
                    animate={{
                      width: `${Math.max(0, Math.min(100, normalizedV))}%`,
                    }}
                    transition={{ duration: 0.1 }}
                  />
                  {/* Threshold marker */}
                  <div
                    className="absolute top-0 h-full w-px bg-cyber-red/40"
                    style={{ left: '100%' }}
                  />
                </div>
                <span
                  className={`font-mono text-[10px] w-16 text-right tabular-nums ${
                    spiked ? 'text-cyber-red font-bold' : 'text-slate-500'
                  }`}
                >
                  {v.toFixed(1)} mV
                </span>
                {spiked && <Zap className="w-3 h-3 text-cyber-red" />}
              </div>
            );
          })}
      </div>

      {/* State explanation */}
      {activeEvent && currentStep && (
        <div className="flex-1 p-2 rounded-lg bg-void-50 border border-white/[0.04]">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-500 font-mono text-[9px]">
              SNN STATE:{' '}
            </span>
            {memoryEnabled
              ? totalSpikes > 0
                ? `Temporal integration active. ${totalSpikes} spike(s) emitted so far. Previous events left residual membrane potential influencing current state.`
                : `Membrane potential accumulating from event sequence. Residual charge from prior events contributes to current evaluation. Potential decays with τ_m = ${params.tau_m}s.`
              : 'Memory disabled — each event evaluated from resting potential. Temporal context from previous events is discarded.'}
          </p>
        </div>
      )}

      {/* Note */}
      <div className="mt-auto pt-2 border-t border-white/[0.04]">
        <p className="text-[9px] text-slate-600 font-mono leading-relaxed">
          ⓘ Simulated LIF neuron population. Threat score derived from membrane
          state (not a calibrated probability).
        </p>
      </div>
    </div>
  );
};
