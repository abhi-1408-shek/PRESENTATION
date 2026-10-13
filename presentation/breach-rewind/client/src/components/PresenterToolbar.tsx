// ============================================================
// BREACH//REWIND — Presenter Toolbar
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Brain,
  GitCompare,
  Users,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  Keyboard,
  Layers,
  Snowflake,
  PlayCircle,
  Zap,
  Sparkles,
} from 'lucide-react';
import { PlaybackState, Scenario } from '@shared/types';

interface Props {
  playbackState: PlaybackState;
  memoryEnabled: boolean;
  compareMode: boolean;
  isFullscreen: boolean;
  isMuted: boolean;
  scenarios: Scenario[];
  activeScenarioId: string;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onFreeze: () => void;
  onResume: () => void;
  onToggleMemory: () => void;
  onToggleCompare: () => void;
  onExplainMoment?: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onSelectScenario: (id: string) => void;
  onInviteAudience: () => void;
}

export const PresenterToolbar: React.FC<Props> = ({
  playbackState,
  memoryEnabled,
  compareMode,
  isFullscreen,
  isMuted,
  scenarios,
  activeScenarioId,
  onPlay,
  onPause,
  onReset,
  onFreeze,
  onResume,
  onToggleMemory,
  onToggleCompare,
  onExplainMoment,
  onToggleFullscreen,
  onToggleMute,
  onSelectScenario,
  onInviteAudience,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);

  const shortcuts = [
    { key: 'Space', action: 'Play / Pause' },
    { key: '←', action: 'Step backward' },
    { key: '→', action: 'Step forward' },
    { key: 'Home', action: 'Rewind to start' },
    { key: 'M', action: 'Toggle memory' },
    { key: 'C', action: 'Compare memory' },
    { key: 'E', action: 'Explain moment deep-dive' },
    { key: 'F', action: 'Fullscreen' },
    { key: 'S', action: 'Toggle sound' },
    { key: 'R', action: 'Reset experiment' },
    { key: '?', action: 'Shortcuts' },
  ];

  return (
    <>
      <div className="glass-panel-strong px-4 py-2 flex items-center gap-2 flex-wrap">
        {/* Run Attack / Play / Pause */}
        {playbackState === 'idle' ? (
          <button onClick={onPlay} className="btn-alert flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">RUN ATTACK</span>
          </button>
        ) : (
          <button
            onClick={playbackState === 'playing' ? onPause : onPlay}
            className="btn-cyber flex items-center gap-2"
          >
            {playbackState === 'playing' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {playbackState === 'playing' ? 'PAUSE' : 'PLAY'}
            </span>
          </button>
        )}

        {/* Freeze / Resume */}
        {playbackState === 'frozen' ? (
          <button onClick={onResume} className="btn-amber flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">RESUME</span>
          </button>
        ) : (
          playbackState !== 'idle' && (
            <button
              onClick={onFreeze}
              className="btn-cyber flex items-center gap-2"
            >
              <Snowflake className="w-4 h-4" />
              <span className="hidden lg:inline">FREEZE</span>
            </button>
          )
        )}

        {/* Reset */}
        <button onClick={onReset} className="btn-cyber flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <span className="hidden lg:inline">RESET</span>
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Memory Toggle */}
        <button
          onClick={onToggleMemory}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-display text-sm font-medium tracking-wider border transition-all ${
            memoryEnabled
              ? 'border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan'
              : 'border-cyber-amber/30 bg-cyber-amber/10 text-cyber-amber'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline">
            MEMORY {memoryEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Compare */}
        <button
          onClick={onToggleCompare}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-display text-sm font-medium tracking-wider border transition-all ${
            compareMode
              ? 'border-cyber-purple/50 bg-cyber-purple/15 text-cyber-purple'
              : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span className="hidden lg:inline">COMPARE</span>
        </button>

        {/* Explain Moment Button */}
        {onExplainMoment && (
          <button
            onClick={onExplainMoment}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-display text-sm font-medium tracking-wider border border-cyber-amber/40 bg-cyber-amber/15 text-cyber-amber hover:bg-cyber-amber/25 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Forensic Deep-Dive Explanation (Shortcut: E)"
          >
            <Sparkles className="w-4 h-4 text-cyber-amber animate-pulse" />
            <span className="hidden lg:inline">EXPLAIN MOMENT</span>
          </button>
        )}

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Scenario selector */}
        <div className="relative">
          <button
            onClick={() => setShowScenarios((p) => !p)}
            className="btn-cyber flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden lg:inline">SCENARIO</span>
          </button>
          <AnimatePresence>
            {showScenarios && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full left-0 mb-2 w-64 glass-panel-strong p-2 z-50"
              >
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectScenario(s.id);
                      setShowScenarios(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      s.id === activeScenarioId
                        ? 'bg-cyber-cyan/10 text-cyber-cyan'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-display text-xs font-semibold tracking-wider">
                      {s.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {s.description.slice(0, 80)}…
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Audience */}
        <button
          onClick={onInviteAudience}
          className="btn-cyber flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span className="hidden xl:inline">AUDIENCE</span>
        </button>

        <div className="flex-1" />

        {/* Utility controls */}
        <button onClick={onToggleMute} className="btn-cyber !px-2.5">
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        <button onClick={onToggleFullscreen} className="btn-cyber !px-2.5">
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => setShowShortcuts((p) => !p)}
          className="btn-cyber !px-2.5"
          title="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>

      {/* Shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 right-4 glass-panel-strong p-4 z-50 w-72"
          >
            <h4 className="font-display text-sm font-semibold text-slate-300 mb-3 tracking-wider">
              KEYBOARD SHORTCUTS
            </h4>
            <div className="space-y-1.5">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.action}</span>
                  <kbd className="px-2 py-0.5 rounded bg-void-200 font-mono text-[10px] text-cyber-cyan border border-white/10">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
