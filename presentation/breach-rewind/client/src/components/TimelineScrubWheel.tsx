// ============================================================
// BREACH//REWIND — Forensic Timeline Scrub-Wheel
// ============================================================

import React, { useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CyberEvent, PlaybackState, AttackPhase } from '@shared/types';

const PHASE_COLORS: Record<AttackPhase, string> = {
  valid_login: '#10B981',
  unexpected_ingress: '#F59E0B',
  host_discovery: '#F59E0B',
  privilege_escalation: '#FF2A6D',
  lateral_movement: '#FF2A6D',
  exfiltration: '#FF2A6D',
  benign: '#00B4D8',
};

const PHASE_LABELS: Record<AttackPhase, string> = {
  valid_login: 'LOGIN',
  unexpected_ingress: 'INGRESS',
  host_discovery: 'RECON',
  privilege_escalation: 'PRIVESC',
  lateral_movement: 'LATERAL',
  exfiltration: 'EXFIL',
  benign: 'BENIGN',
};

interface Props {
  events: CyberEvent[];
  duration: number;
  currentTime: number;
  playbackState: PlaybackState;
  playbackSpeed: number;
  onSeek: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
}

export const TimelineScrubWheel: React.FC<Props> = ({
  events,
  duration,
  currentTime,
  playbackState,
  playbackSpeed,
  onSeek,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSetSpeed,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const progress = useMemo(
    () => Math.min(1, Math.max(0, currentTime / duration)),
    [currentTime, duration]
  );

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTrackInteraction = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(x * duration);
    },
    [duration, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      handleTrackInteraction(e.clientX);

      const handleMouseMove = (ev: MouseEvent) => {
        if (isDraggingRef.current) handleTrackInteraction(ev.clientX);
      };
      const handleMouseUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [handleTrackInteraction]
  );

  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="glass-panel p-4 space-y-3">
      {/* Time display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold text-cyber-cyan tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="font-mono text-sm text-slate-500">/</span>
          <span className="font-mono text-sm text-slate-500">
            {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-mono">SPEED</span>
          <div className="flex gap-1">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-0.5 rounded font-mono text-xs transition-all ${
                  playbackSpeed === s
                    ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
          <div className="ml-3 flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                playbackState === 'playing'
                  ? 'bg-cyber-green animate-pulse'
                  : playbackState === 'frozen'
                    ? 'bg-cyber-amber'
                    : playbackState === 'paused'
                      ? 'bg-cyber-cyan'
                      : 'bg-slate-600'
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {playbackState}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative" ref={trackRef} onMouseDown={handleMouseDown}>
        {/* Event markers */}
        <div className="relative h-8 mb-1">
          {events.map((event, i) => {
            const pos = (event.timestamp / duration) * 100;
            const color = PHASE_COLORS[event.phase];
            const isActive =
              currentTime >= event.timestamp &&
              (i === events.length - 1 || currentTime < events[i + 1]?.timestamp);
            return (
              <div
                key={event.id}
                className="absolute -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                style={{ left: `${pos}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(event.timestamp);
                }}
              >
                <span
                  className={`font-mono text-[9px] tracking-wider whitespace-nowrap transition-all ${
                    isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
                  }`}
                  style={{ color }}
                >
                  {PHASE_LABELS[event.phase]}
                </span>
                <div
                  className={`w-0.5 h-3 transition-all ${isActive ? 'opacity-100' : 'opacity-30'}`}
                  style={{ backgroundColor: color }}
                />
              </div>
            );
          })}
        </div>

        {/* Track bar */}
        <div className="relative h-3 bg-void-200 rounded-full overflow-hidden cursor-pointer">
          {/* Phase background segments */}
          {events.map((event, i) => {
            const start = event.timestamp / duration;
            const end =
              i < events.length - 1
                ? events[i + 1].timestamp / duration
                : 1;
            return (
              <div
                key={event.id + '_bg'}
                className="absolute top-0 h-full opacity-10"
                style={{
                  left: `${start * 100}%`,
                  width: `${(end - start) * 100}%`,
                  backgroundColor: PHASE_COLORS[event.phase],
                }}
              />
            );
          })}

          {/* Progress fill */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background:
                'linear-gradient(90deg, #00B4D8, #00F2FE)',
            }}
            transition={{ duration: 0.05 }}
          />

          {/* Playhead */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white bg-void shadow-cyber cursor-grab active:cursor-grabbing z-10"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        {/* Time marks */}
        <div className="flex justify-between mt-1 px-0.5">
          {Array.from({ length: 7 }, (_, i) => {
            const t = (i / 6) * duration;
            return (
              <span
                key={i}
                className="font-mono text-[9px] text-slate-600 tabular-nums"
              >
                {formatTime(t)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onReset}
          className="btn-cyber !px-3 !py-1.5"
          title="Rewind to start (Home)"
        >
          <Rewind className="w-4 h-4" />
        </button>
        <button
          onClick={onStepBackward}
          className="btn-cyber !px-3 !py-1.5"
          title="Step backward (←)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={playbackState === 'playing' ? onPause : onPlay}
          className="btn-cyber !px-5 !py-2 !text-base"
          title={playbackState === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
        >
          {playbackState === 'playing' ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onStepForward}
          className="btn-cyber !px-3 !py-1.5"
          title="Step forward (→)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSeek(duration)}
          className="btn-cyber !px-3 !py-1.5"
          title="Skip to end (End)"
        >
          <FastForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
