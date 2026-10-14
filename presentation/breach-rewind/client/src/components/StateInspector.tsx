// ============================================================
// BREACH//REWIND — Historical State Inspector
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Zap, Info, ChevronDown, Maximize2, X, Sparkles, AlertTriangle } from 'lucide-react';
import {
  SimulationStep,
  SimulationTrace,
  CyberEvent,
  LIFParams,
  NEURON_LABELS,
  NEURON_COLORS,
} from '@shared/types';

interface Props {
  currentStep: SimulationStep | null;
  statefulTrace: SimulationTrace | null;
  statelessTrace: SimulationTrace | null;
  activeEvent: CyberEvent | null;
  events: CyberEvent[];
  params: LIFParams;
  currentTime: number;
  memoryEnabled: boolean;
  isExplainOpen?: boolean;
  onToggleExplain?: () => void;
}

export const StateInspector: React.FC<Props> = ({
  currentStep,
  statefulTrace,
  statelessTrace,
  activeEvent,
  events,
  params,
  currentTime,
  memoryEnabled,
  isExplainOpen,
  onToggleExplain,
}) => {
  const [activeTab, setActiveTab] = useState<'explain' | 'trail'>('explain');
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = isExplainOpen !== undefined ? isExplainOpen : internalModalOpen;

  const handleOpenModal = () => {
    if (onToggleExplain) {
      onToggleExplain();
    } else {
      setInternalModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (isExplainOpen && onToggleExplain) {
      onToggleExplain();
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Recent events up to current time
  const recentEvents = events
    .filter((e) => e.timestamp <= currentTime)
    .slice(-4);

  // Generate deterministic explanation
  const generateExplanation = (): string[] => {
    if (!currentStep) return ['No simulation data available at this timestamp.'];

    const lines: string[] = [];
    const potentials = currentStep.neuronState.potentials;
    const spikes = currentStep.neuronState.spikes;
    const spikeCounts = currentStep.neuronState.spikeCounts;
    const totalSpikes = spikeCounts.reduce((a, b) => a + b, 0);

    if (!activeEvent) {
      lines.push('No event is active at this timestamp.');
      const maxV = Math.max(...potentials);
      if (maxV > params.V_rest + 1) {
        lines.push(
          `Residual membrane potential detected: peak ${maxV.toFixed(1)} mV. The preceding events left a decaying charge.`
        );
        lines.push(
          `The membrane potential decays toward ${params.V_rest} mV with time constant τ_m = ${params.tau_m}s.`
        );
      } else {
        lines.push('All neurons are near resting potential.');
      }
      return lines;
    }

    lines.push(`Active event: "${activeEvent.type}" at t = ${formatTime(activeEvent.timestamp)}.`);

    // Check for spikes
    const spikedNeurons = spikes
      .map((s, i) => (s ? NEURON_LABELS[i] : null))
      .filter(Boolean);

    if (spikedNeurons.length > 0) {
      lines.push(
        `⚡ Neurons fired: ${spikedNeurons.join(', ')}. The membrane potential crossed the firing threshold (${params.V_thresh} mV) and was reset to ${params.V_reset} mV.`
      );
    }

    // Membrane state analysis
    const maxNeuronIdx = potentials.indexOf(Math.max(...potentials));
    const maxV = potentials[maxNeuronIdx];
    const normalizedV =
      ((maxV - params.V_rest) / (params.V_thresh - params.V_rest)) * 100;

    if (normalizedV > 80 && !spikes[maxNeuronIdx]) {
      lines.push(
        `${NEURON_LABELS[maxNeuronIdx]} is at ${maxV.toFixed(1)} mV (${normalizedV.toFixed(0)}% to threshold). Close to firing.`
      );
    } else if (normalizedV > 40) {
      lines.push(
        `${NEURON_LABELS[maxNeuronIdx]} has elevated potential at ${maxV.toFixed(1)} mV (${normalizedV.toFixed(0)}% to threshold).`
      );
    }

    // Memory context
    if (memoryEnabled && recentEvents.length > 1) {
      lines.push(
        `The preceding ${recentEvents.length - 1} event(s) left residual membrane potential. The current input is integrated on top of this accumulated state.`
      );
    } else if (!memoryEnabled) {
      lines.push(
        'Memory is disabled — the neuron started from resting potential for this event, discarding all temporal context.'
      );
    }

    // Baseline comparison
    if (currentStep.baselineScore < 0.3 && currentStep.snnThreatScore > 0.5) {
      lines.push(
        '⚠ The baseline considers this event low-risk individually, but the SNN\'s accumulated state indicates elevated threat due to temporal context.'
      );
    }

    if (totalSpikes > 0) {
      lines.push(`Total spikes emitted so far: ${totalSpikes}.`);
    }

    return lines;
  };

  const explanations = generateExplanation();

  return (
    <>
      <div className="glass-panel p-3.5 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-cyber-purple" />
            <h3 className="font-display text-xs font-semibold tracking-wider text-slate-300 uppercase">
              State Inspector
            </h3>
          </div>
          <div className="font-mono text-[11px] text-cyber-cyan tabular-nums bg-void-100 px-2 py-0.5 rounded border border-white/[0.04]">
            t = {formatTime(currentTime)}
          </div>
        </div>

        {/* Tab Controls: Explain This Moment vs Event Trail */}
        <div className="grid grid-cols-2 gap-1.5 p-1 mb-2.5 rounded-lg bg-void-200 border border-white/[0.06]">
          <button
            onClick={() => setActiveTab('explain')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded font-display text-[11px] font-semibold tracking-wider uppercase transition-all ${
              activeTab === 'explain'
                ? 'bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyber-amber" />
            Explain Moment
          </button>
          <button
            onClick={() => setActiveTab('trail')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded font-display text-[11px] font-semibold tracking-wider uppercase transition-all ${
              activeTab === 'trail'
                ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            Recent Trail ({recentEvents.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {activeTab === 'explain' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyber-amber" />
                  <span className="font-display text-[11px] font-semibold tracking-wider text-cyber-amber uppercase">
                    Forensic Explanation
                  </span>
                </div>
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyber-amber transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                  title="Expand to Full Deep-Dive Modal"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>EXPAND</span>
                </button>
              </div>

              <div className="space-y-2 p-2.5 rounded-lg bg-void-100 border border-cyber-amber/20">
                <AnimatePresence mode="wait">
                  {explanations.map((line, i) => (
                    <motion.p
                      key={`${currentTime}-${i}`}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ delay: i * 0.04 }}
                      className="text-[11px] text-slate-300 leading-relaxed font-sans"
                    >
                      {line}
                    </motion.p>
                  ))}
                </AnimatePresence>
              </div>

              <button
                onClick={handleOpenModal}
                className="w-full py-1.5 px-3 rounded bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber hover:bg-cyber-amber/20 font-display text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                DEEP-DIVE THIS MOMENT
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Active event banner if present */}
              {activeEvent && (
                <div className="p-2 rounded bg-void-50 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          activeEvent.severity === 'critical'
                            ? '#FF2A6D'
                            : activeEvent.severity === 'suspicious'
                              ? '#F59E0B'
                              : '#10B981',
                      }}
                    />
                    <span className="font-mono text-xs text-white font-medium">
                      {activeEvent.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {activeEvent.description}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {recentEvents.map((evt) => {
                  const isActive = evt.id === activeEvent?.id;
                  return (
                    <div
                      key={evt.id}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-all ${
                        isActive
                          ? 'bg-cyber-cyan/15 border border-cyber-cyan/30 text-white'
                          : 'bg-void-100 text-slate-400'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="font-mono tabular-nums text-slate-300">
                        {formatTime(evt.timestamp)}
                      </span>
                      <span className="truncate flex-1 font-mono text-[10px]">
                        {evt.type}
                      </span>
                    </div>
                  );
                })}
                {recentEvents.length === 0 && (
                  <p className="text-[10px] text-slate-600 italic py-2 text-center">
                    No events have occurred yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary stats bar at bottom */}
        {currentStep && (
          <div className="mt-2 pt-2 border-t border-white/[0.04] grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="text-center">
              <span className="label-mono block text-[9px]">Baseline</span>
              <span className="font-mono text-xs font-bold text-slate-300">
                {Math.round(currentStep.baselineScore * 100)}%
              </span>
            </div>
            <div className="text-center">
              <span className="label-mono block text-[9px]">SNN Threat</span>
              <span className="font-mono text-xs font-bold text-cyber-cyan">
                {Math.round(currentStep.snnThreatScore * 100)}%
              </span>
            </div>
            <div className="text-center">
              <span className="label-mono block text-[9px]">Ablated</span>
              <span className="font-mono text-xs font-bold text-cyber-purple">
                {Math.round(currentStep.ablatedScore * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Deep-Dive Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 max-w-xl w-full border border-cyber-amber/40 shadow-[0_0_30px_rgba(245,158,11,0.2)] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyber-amber animate-pulse" />
                  <h2 className="font-display text-lg font-bold tracking-wider text-white uppercase">
                    Forensic Deep-Dive — Explain This Moment
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between bg-void-100 p-3 rounded-lg border border-white/[0.06] text-xs font-mono">
                <span className="text-slate-400">Timestamp: <strong className="text-cyber-cyan">{formatTime(currentTime)}</strong></span>
                <span className="text-slate-400">Memory Accumulation: <strong className={memoryEnabled ? 'text-cyber-green' : 'text-cyber-amber'}>{memoryEnabled ? `ACTIVE (τ_m = ${params.tau_m}s)` : 'ABLATED (M=0)'}</strong></span>
              </div>

              {activeEvent && (
                <div className="p-3.5 rounded-lg bg-void-50 border border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-cyber-cyan uppercase">
                      Phase: {activeEvent.phase.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-semibold">{activeEvent.type}</span>
                  </div>
                  <p className="text-xs text-slate-400">{activeEvent.description}</p>
                </div>
              )}

              <div className="space-y-2 p-4 rounded-lg bg-void-200 border border-cyber-amber/20">
                <h4 className="text-xs font-display font-semibold tracking-wider text-cyber-amber uppercase">
                  Mathematical State Analysis
                </h4>
                {explanations.map((exp, i) => (
                  <p key={i} className="text-xs text-slate-300 leading-relaxed">
                    • {exp}
                  </p>
                ))}
              </div>

              {currentStep && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-void-100 border border-white/[0.06] text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-mono">Stateless SIEM</span>
                    <span className="text-base font-bold font-mono text-slate-300">{Math.round(currentStep.baselineScore * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-cyber-cyan uppercase block font-mono">Stateful SNN</span>
                    <span className="text-base font-bold font-mono text-cyber-cyan">{Math.round(currentStep.snnThreatScore * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-cyber-purple uppercase block font-mono">Memory-Off (Ablated)</span>
                    <span className="text-base font-bold font-mono text-cyber-purple">{Math.round(currentStep.ablatedScore * 100)}%</span>
                  </div>
                </div>
              )}

              <div className="text-right pt-2">
                <button
                  onClick={handleCloseModal}
                  className="btn-cyber px-5 py-2 text-xs"
                >
                  CLOSE FORENSIC EXPLANATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

