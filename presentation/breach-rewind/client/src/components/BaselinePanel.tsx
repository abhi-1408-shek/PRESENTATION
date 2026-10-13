// ============================================================
// BREACH//REWIND — Stateless Baseline Panel
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Eye } from 'lucide-react';
import { SimulationStep, CyberEvent, SimulationTrace } from '@shared/types';

interface Props {
  currentStep: SimulationStep | null;
  activeEvent: CyberEvent | null;
  trace: SimulationTrace | null;
  currentTime: number;
}

export const BaselinePanel: React.FC<Props> = ({
  currentStep,
  activeEvent,
  trace,
  currentTime,
}) => {
  const score = currentStep?.baselineScore ?? 0;
  const scorePercent = Math.round(score * 100);

  const getScoreColor = (s: number) => {
    if (s < 0.3) return '#10B981';
    if (s < 0.6) return '#F59E0B';
    return '#FF2A6D';
  };

  const getScoreLabel = (s: number) => {
    if (s < 0.2) return 'NORMAL';
    if (s < 0.4) return 'LOW RISK';
    if (s < 0.6) return 'ELEVATED';
    if (s < 0.8) return 'HIGH RISK';
    return 'CRITICAL';
  };

  const color = getScoreColor(score);

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-slate-400" />
        <h3 className="font-display text-sm font-semibold tracking-wider text-slate-300 uppercase">
          Event-Level Baseline
        </h3>
        <div className="ml-auto px-2 py-0.5 rounded text-[9px] font-mono bg-void-200 text-slate-500 tracking-wider">
          STATELESS
        </div>
      </div>

      {/* Threat gauge */}
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
        <div className="flex-1 min-w-0">
          <div
            className="font-display text-sm font-semibold tracking-wider mb-1"
            style={{ color }}
          >
            {getScoreLabel(score)}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instantaneous event-level threat heuristic. No temporal memory — each event evaluated independently.
          </p>
        </div>
      </div>

      {/* Active event */}
      {activeEvent ? (
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  activeEvent.severity === 'critical'
                    ? '#FF2A6D'
                    : activeEvent.severity === 'suspicious'
                      ? '#F59E0B'
                      : '#10B981',
              }}
            />
            <span className="font-mono text-xs text-slate-300">
              {activeEvent.type}
            </span>
          </div>

          {/* Feature bars */}
          <div className="space-y-1">
            {['Auth', 'Recon', 'Lateral', 'Exfil'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-slate-600 w-12 text-right">
                  {label}
                </span>
                <div className="flex-1 h-1.5 bg-void-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={false}
                    animate={{
                      width: `${(activeEvent.features[i] || 0) * 100}%`,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span className="font-mono text-[9px] text-slate-600 w-8">
                  {((activeEvent.features[i] || 0) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 p-2 rounded-lg bg-void-50 border border-white/[0.04]">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <span className="text-slate-500 font-mono text-[9px]">BASELINE DECISION: </span>
              {score < 0.3
                ? 'This individual event does not exceed the alert threshold.'
                : score < 0.6
                  ? 'Moderate features detected, but no prior context is retained to escalate.'
                  : 'High severity features present in this single event.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-600">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No active event at this timestamp</p>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="mt-auto pt-2 border-t border-white/[0.04]">
        <p className="text-[9px] text-slate-600 font-mono leading-relaxed">
          ⓘ Illustrative event-level heuristic (weighted feature sum). Not a trained classifier.
        </p>
      </div>
    </div>
  );
};
