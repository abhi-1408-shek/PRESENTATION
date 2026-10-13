// ============================================================
// BREACH//REWIND — Compare Memory Modal
// ============================================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare, Zap, Brain, Eye } from 'lucide-react';
import { SimulationTrace, NEURON_LABELS } from '@shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  statefulTrace: SimulationTrace | null;
  statelessTrace: SimulationTrace | null;
}

export const CompareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  statefulTrace,
  statelessTrace,
}) => {
  const comparison = useMemo(() => {
    if (!statefulTrace || !statelessTrace) return null;

    // Find first spike timestamps for each mode
    const statefulFirstSpike = statefulTrace.summary.firstSpikeTime;
    const statelessFirstSpike = statelessTrace.summary.firstSpikeTime;

    // Find divergence points — where the scores differ significantly
    const divergences: { time: number; stateful: number; stateless: number; baseline: number }[] = [];
    const sampleInterval = Math.max(1, Math.floor(statefulTrace.steps.length / 100));

    for (let i = 0; i < statefulTrace.steps.length; i += sampleInterval) {
      const sf = statefulTrace.steps[i];
      const sl = statelessTrace.steps[i];
      if (Math.abs(sf.snnThreatScore - sl.snnThreatScore) > 0.1) {
        divergences.push({
          time: sf.time,
          stateful: sf.snnThreatScore,
          stateless: sl.snnThreatScore,
          baseline: sf.baselineScore,
        });
      }
    }

    return {
      statefulSpikes: statefulTrace.summary.totalSpikes,
      statelessSpikes: statelessTrace.summary.totalSpikes,
      statefulFirstSpike,
      statelessFirstSpike,
      statefulFinal: statefulTrace.summary.finalPotentials,
      statelessFinal: statelessTrace.summary.finalPotentials,
      divergences,
    };
  }, [statefulTrace, statelessTrace]);

  const formatTime = (t: number | null) => {
    if (t === null) return 'Never';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && comparison && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel-strong max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <GitCompare className="w-5 h-5 text-cyber-purple" />
                <h2 className="font-display text-lg font-bold tracking-wider text-white">
                  MEMORY COMPARISON EXPERIMENT
                </h2>
              </div>
              <button onClick={onClose} className="btn-cyber !px-2 !py-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Same event sequence processed under three configurations. The educational
              question: <em className="text-cyber-cyan">"What changes when the system retains internal state across events?"</em>
            </p>

            {/* Three-way comparison table */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Baseline */}
              <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <h4 className="font-display text-xs tracking-wider text-slate-400 uppercase">
                    Event-Level Baseline
                  </h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="label-mono">Approach</span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Weighted feature sum. Zero temporal memory.
                    </p>
                  </div>
                  <div>
                    <span className="label-mono">Final Score</span>
                    <p className="text-lg font-mono font-bold text-slate-300">
                      {statefulTrace
                        ? Math.round(
                            statefulTrace.steps[statefulTrace.steps.length - 1]
                              .baselineScore * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* Stateful SNN */}
              <div className="glass-panel p-4 border-cyber-cyan/20">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-cyber-cyan" />
                  <h4 className="font-display text-xs tracking-wider text-cyber-cyan uppercase">
                    Stateful LIF SNN
                  </h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="label-mono">Approach</span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Full temporal membrane integration with exponential leak.
                    </p>
                  </div>
                  <div>
                    <span className="label-mono">Total Spikes</span>
                    <p className="text-lg font-mono font-bold text-cyber-cyan">
                      {comparison.statefulSpikes.reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  {NEURON_LABELS.map((label, i) => {
                    const firstSpike = comparison.statefulFirstSpike[i];
                    return (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-mono text-cyber-cyan">
                          {comparison.statefulSpikes[i]} spike(s)
                          {firstSpike !== null && ` @ ${formatTime(firstSpike)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Memory OFF */}
              <div className="glass-panel p-4 border-cyber-amber/20">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-cyber-amber" />
                  <h4 className="font-display text-xs tracking-wider text-cyber-amber uppercase">
                    Reset-State (Memory OFF)
                  </h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="label-mono">Approach</span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Same LIF equation, but V resets to V_rest before each new event.
                    </p>
                  </div>
                  <div>
                    <span className="label-mono">Total Spikes</span>
                    <p className="text-lg font-mono font-bold text-cyber-amber">
                      {comparison.statelessSpikes.reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  {NEURON_LABELS.map((label, i) => {
                    const firstSpike = comparison.statelessFirstSpike[i];
                    return (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-mono text-cyber-amber">
                          {comparison.statelessSpikes[i]} spike(s)
                          {firstSpike !== null && ` @ ${formatTime(firstSpike)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Divergence points */}
            {comparison.divergences.length > 0 && (
              <div className="glass-panel p-4 mb-4">
                <h4 className="label-mono mb-2">
                  Significant Divergence Points ({comparison.divergences.length})
                </h4>
                <div className="max-h-32 overflow-auto space-y-1">
                  {comparison.divergences.slice(0, 20).map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 text-[10px] font-mono"
                    >
                      <span className="text-slate-500 w-12">
                        {formatTime(d.time)}
                      </span>
                      <span className="text-cyber-cyan">
                        Stateful: {Math.round(d.stateful * 100)}%
                      </span>
                      <span className="text-cyber-amber">
                        Memory-OFF: {Math.round(d.stateless * 100)}%
                      </span>
                      <span className="text-slate-500">
                        Baseline: {Math.round(d.baseline * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scientific explanation */}
            <div className="glass-panel p-4">
              <h4 className="font-display text-xs font-semibold tracking-wider text-cyber-amber mb-2 uppercase">
                Scientific Explanation
              </h4>
              <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                <p>
                  <strong className="text-slate-300">The baseline</strong> evaluates each event's
                  feature vector in isolation. It has no mechanism to remember that a reconnaissance
                  event occurred 12 seconds ago.
                </p>
                <p>
                  <strong className="text-slate-300">The stateful LIF SNN</strong> carries forward
                  residual membrane charge. Each subthreshold event leaves a decaying trace (τ_m = {statefulTrace?.params.tau_m}s).
                  When temporally dense suspicious events arrive, their contributions sum, potentially
                  crossing the firing threshold even when individual events are subthreshold.
                </p>
                <p>
                  <strong className="text-slate-300">The memory-OFF ablation</strong> uses identical
                  LIF dynamics but resets membrane potential to V_rest before each new event, destroying
                  temporal context. This is a pedagogical comparison to isolate the effect of temporal state.
                </p>
                <p className="text-[10px] text-slate-500 italic mt-2">
                  ⓘ This comparison demonstrates temporal state retention, not a definitive claim that
                  all stateless classifiers behave identically to the event-level baseline shown here.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
