// ============================================================
// BREACH//REWIND — Audience QR Overlay
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Copy, Check, TestTube2, Wifi, WifiOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { VoteTally, ScenarioVote, PredictionVote } from '@shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  joinUrl: string | null;
  votes: VoteTally;
  participantCount: number;
  isConnected: boolean;
  onCreateRoom: () => void;
  onCloseRoom: () => void;
  onSimulateVotes: () => void;
  onApplyWinningVote: () => void;
}

const SCENARIO_LABELS: Record<ScenarioVote, string> = {
  slow_apt: 'Slow & Stealthy APT',
  burst_attack: 'Sudden Burst Attack',
  benign_traffic: 'Normal Traffic (Control)',
};

const PREDICTION_LABELS: Record<PredictionVote, string> = {
  no_spike: 'No spike will occur',
  spike_soon: 'Spike will fire soon',
  insufficient_evidence: 'Insufficient evidence',
};

export const AudienceOverlay: React.FC<Props> = ({
  isOpen,
  onClose,
  roomId,
  joinUrl,
  votes,
  participantCount,
  isConnected,
  onCreateRoom,
  onCloseRoom,
  onSimulateVotes,
  onApplyWinningVote,
}) => {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    if (joinUrl) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMaxVote = (record: Record<string, number>) => {
    const entries = Object.entries(record);
    if (entries.length === 0) return null;
    return entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
  };

  const maxScenarioVote = getMaxVote(votes.scenario);
  const totalScenarioVotes = Object.values(votes.scenario).reduce(
    (a, b) => a + b,
    0
  );
  const totalPredictionVotes = Object.values(votes.prediction).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="glass-panel-strong max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cyber-cyan" />
                <h2 className="font-display text-lg font-bold tracking-wider text-white">
                  AUDIENCE PARTICIPATION
                </h2>
              </div>
              <button onClick={onClose} className="btn-cyber !px-2 !py-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!roomId ? (
              /* No room created yet */
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-cyber-green" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-cyber-red" />
                  )}
                  <span
                    className={`text-sm ${isConnected ? 'text-cyber-green' : 'text-cyber-red'}`}
                  >
                    {isConnected ? 'Server connected' : 'Server unavailable — Solo mode only'}
                  </span>
                </div>
                <button
                  onClick={onCreateRoom}
                  className="btn-cyber text-lg px-8 py-3"
                  disabled={!isConnected}
                >
                  CREATE ROOM
                </button>
                <p className="text-sm text-slate-500">
                  or{' '}
                  <button
                    onClick={onClose}
                    className="text-cyber-cyan hover:underline"
                  >
                    CONTINUE SOLO
                  </button>
                </p>
              </div>
            ) : (
              /* Room active */
              <div className="space-y-6">
                {/* QR Code & join info */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="p-4 bg-white rounded-xl">
                    <QRCodeSVG
                      value={joinUrl || ''}
                      size={180}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#060913"
                    />
                  </div>
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <span className="label-mono">Room Code</span>
                      <div className="font-mono text-3xl font-bold text-cyber-cyan tracking-widest">
                        {roomId}
                      </div>
                    </div>
                    <div>
                      <span className="label-mono">Join URL</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-slate-400 bg-void-200 px-2 py-1 rounded truncate max-w-[240px]">
                          {joinUrl}
                        </code>
                        <button onClick={copyUrl} className="btn-cyber !px-2 !py-1">
                          {copied ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyber-green" />
                      <span className="font-mono text-sm text-cyber-green">
                        {participantCount} participant(s) connected
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vote results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scenario votes */}
                  <div className="glass-panel p-3">
                    <h4 className="label-mono mb-2">
                      Scenario Vote ({totalScenarioVotes})
                    </h4>
                    <div className="space-y-2">
                      {(
                        Object.entries(SCENARIO_LABELS) as [
                          ScenarioVote,
                          string,
                        ][]
                      ).map(([key, label]) => {
                        const count = votes.scenario[key] || 0;
                        const pct =
                          totalScenarioVotes > 0
                            ? (count / totalScenarioVotes) * 100
                            : 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-slate-400">{label}</span>
                              <span className="font-mono text-cyber-cyan">
                                {count}
                              </span>
                            </div>
                            <div className="h-2 bg-void-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-cyber-cyan rounded-full"
                                initial={false}
                                animate={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prediction votes */}
                  <div className="glass-panel p-3">
                    <h4 className="label-mono mb-2">
                      Prediction ({totalPredictionVotes})
                    </h4>
                    <div className="space-y-2">
                      {(
                        Object.entries(PREDICTION_LABELS) as [
                          PredictionVote,
                          string,
                        ][]
                      ).map(([key, label]) => {
                        const count = votes.prediction[key] || 0;
                        const pct =
                          totalPredictionVotes > 0
                            ? (count / totalPredictionVotes) * 100
                            : 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-slate-400">{label}</span>
                              <span className="font-mono text-cyber-purple">
                                {count}
                              </span>
                            </div>
                            <div className="h-2 bg-void-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-cyber-purple rounded-full"
                                initial={false}
                                animate={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={onApplyWinningVote}
                    className="btn-cyber"
                    disabled={totalScenarioVotes === 0}
                  >
                    APPLY WINNING VOTE
                  </button>
                  <button onClick={onSimulateVotes} className="btn-amber flex items-center gap-2">
                    <TestTube2 className="w-4 h-4" />
                    SIMULATE VOTES
                  </button>
                  <button onClick={onCloseRoom} className="btn-alert">
                    CLOSE ROOM
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
