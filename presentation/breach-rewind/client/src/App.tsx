// ============================================================
// BREACH//REWIND — Main Application
// ============================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSimulation } from './hooks/useSimulation';
import { useAudio } from './hooks/useAudio';
import { TitleScreen } from './components/TitleScreen';
import { PresenterToolbar } from './components/PresenterToolbar';
import { TimelineScrubWheel } from './components/TimelineScrubWheel';
import { BaselinePanel } from './components/BaselinePanel';
import { SNNPanel } from './components/SNNPanel';
import { StateInspector } from './components/StateInspector';
import { CompareModal } from './components/CompareModal';
import { AudienceOverlay } from './components/AudienceOverlay';
import { SummaryPanel } from './components/SummaryPanel';
import { MembraneOscilloscope } from './visualizations/MembraneOscilloscope';
import { SpikeRaster } from './visualizations/SpikeRaster';
import { EventFlowTunnel } from './visualizations/EventFlowTunnel';
import { CyberEvent, VoteTally, EventSeverity } from '@shared/types';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;

// Check if we're on the join page
const isJoinPage = window.location.pathname.startsWith('/join');

function App() {
  const [simState, simActions] = useSimulation();
  const audio = useAudio();
  const [showTitle, setShowTitle] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAudience, setShowAudience] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Audience state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteTally>({
    scenario: { slow_apt: 0, burst_attack: 0, benign_traffic: 0 },
    prediction: { no_spike: 0, spike_soon: 0, insufficient_evidence: 0 },
    totalParticipants: 0,
  });

  // Derive active event from current step
  const activeEvent: CyberEvent | null = useMemo(() => {
    if (!simState.currentStep || simState.currentStep.activeEventIndex < 0) return null;
    return simState.scenario.events[simState.currentStep.activeEventIndex] || null;
  }, [simState.currentStep, simState.scenario.events]);

  // Current severity
  const currentSeverity: EventSeverity | 'idle' = activeEvent?.severity || 'idle';

  // Whether any neuron spiked at current step
  const hasSpikedNow = simState.currentStep?.neuronState.spikes.some(Boolean) ?? false;

  // Active trace based on memory mode
  const activeTrace = simState.memoryEnabled
    ? simState.statefulTrace
    : simState.statelessTrace;

  // Audio feedback
  useEffect(() => {
    if (!simState.currentStep) return;
    if (hasSpikedNow) {
      audio.playSpike();
    } else if (activeEvent && currentSeverity === 'critical') {
      audio.playAlert();
    } else if (activeEvent) {
      audio.playEventPulse();
    }
  }, [simState.currentStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showTitle) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          simState.playbackState === 'playing' ? simActions.pause() : simActions.play();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          simActions.stepBackward();
          audio.playScrub();
          break;
        case 'ArrowRight':
          e.preventDefault();
          simActions.stepForward();
          audio.playScrub();
          break;
        case 'Home':
          e.preventDefault();
          simActions.reset();
          break;
        case 'm':
        case 'M':
          simActions.toggleMemory();
          break;
        case 'c':
        case 'C':
          setShowCompare(p => !p);
          break;
        case 'e':
        case 'E':
          setShowExplainModal(p => !p);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 's':
        case 'S':
          audio.toggleMute();
          break;
        case 'r':
        case 'R':
          simActions.reset();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showTitle, simState.playbackState]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Socket.IO connection for live presenter audience interaction
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setIsSocketConnected(false);
      });

      socket.on('room:created', (data: { roomId: string }) => {
        if (data?.roomId) setRoomId(data.roomId);
      });

      socket.on('room:participants', (data: { count: number }) => {
        if (typeof data?.count === 'number') {
          setVotes(prev => ({ ...prev, totalParticipants: data.count }));
        }
      });

      socket.on('room:vote_update', (data: { votes: any; totalParticipants?: number }) => {
        if (data?.votes) {
          setVotes(prev => ({
            scenario: data.votes.scenario || prev.scenario,
            prediction: data.votes.prediction || prev.prediction,
            totalParticipants: typeof data.totalParticipants === 'number'
              ? data.totalParticipants
              : prev.totalParticipants,
          }));
        }
      });
    } catch (e) {
      console.warn('Socket connection failed, operating in standalone mode:', e);
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

  // Room management
  const createRoom = useCallback(() => {
    const fallbackId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(fallbackId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:create', (res: any) => {
        if (res?.roomId) setRoomId(res.roomId);
      });
    }
  }, []);

  const closeRoom = useCallback(() => {
    if (roomId && socketRef.current?.connected) {
      socketRef.current.emit('room:close', { roomId });
    }
    setRoomId(null);
    setVotes({
      scenario: { slow_apt: 0, burst_attack: 0, benign_traffic: 0 },
      prediction: { no_spike: 0, spike_soon: 0, insufficient_evidence: 0 },
      totalParticipants: 0,
    });
  }, [roomId]);

  const simulateVotes = useCallback(() => {
    setVotes(prev => ({
      scenario: {
        slow_apt: prev.scenario.slow_apt + Math.floor(Math.random() * 5),
        burst_attack: prev.scenario.burst_attack + Math.floor(Math.random() * 3),
        benign_traffic: prev.scenario.benign_traffic + Math.floor(Math.random() * 2),
      },
      prediction: {
        no_spike: prev.prediction.no_spike + Math.floor(Math.random() * 3),
        spike_soon: prev.prediction.spike_soon + Math.floor(Math.random() * 4),
        insufficient_evidence: prev.prediction.insufficient_evidence + Math.floor(Math.random() * 2),
      },
      totalParticipants: prev.totalParticipants + Math.floor(Math.random() * 3) + 1,
    }));
  }, []);

  const applyWinningVote = useCallback(() => {
    const scenarioVotes = votes.scenario;
    const maxEntry = Object.entries(scenarioVotes).reduce((max, entry) =>
      entry[1] > max[1] ? entry : max
    );
    const scenarioMap: Record<string, string> = {
      slow_apt: 'apt_60s',
      burst_attack: 'burst_ransomware',
      benign_traffic: 'benign_traffic',
    };
    const scenarioId = scenarioMap[maxEntry[0]];
    if (scenarioId) {
      simActions.setScenario(scenarioId);
    }
    setShowAudience(false);
  }, [votes, simActions]);

  const joinUrl = roomId
    ? `${window.location.origin}/join/${roomId}`
    : null;

  // If on join page, render join UI
  if (isJoinPage) {
    return <JoinPage />;
  }

  return (
    <div className="min-h-screen bg-void text-white grid-bg">
      {/* Title screen */}
      <AnimatePresence>
        {showTitle && (
          <TitleScreen
            onStart={() => {
              setShowTitle(false);
              simActions.play();
            }}
          />
        )}
      </AnimatePresence>

      {/* Main presenter layout */}
      {!showTitle && (
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 px-4 py-2 flex items-center justify-between border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg font-bold tracking-wider">
                <span className="text-cyber-cyan">BREACH</span>
                <span className="text-cyber-red">//</span>
                <span className="text-cyber-cyan">REWIND</span>
              </h1>
              <span className="text-[10px] font-mono text-slate-600 tracking-wider hidden md:inline">
                TEMPORAL FORENSICS LAB
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="font-mono text-slate-500">
                {simState.scenario.name}
              </span>
              {simState.scenario.isSynthetic && (
                <span className="px-2 py-0.5 rounded bg-cyber-amber/10 text-cyber-amber font-mono text-[9px] border border-cyber-amber/20">
                  SYNTHETIC
                </span>
              )}
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 min-h-0 grid grid-cols-12 gap-2 p-2">
            {/* Left column — Baseline + Inspector */}
            <div className="col-span-3 flex flex-col gap-2 min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden">
                <BaselinePanel
                  currentStep={simState.currentStep}
                  activeEvent={activeEvent}
                  trace={activeTrace}
                  currentTime={simState.currentTime}
                />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <StateInspector
                  currentStep={simState.currentStep}
                  statefulTrace={simState.statefulTrace}
                  statelessTrace={simState.statelessTrace}
                  activeEvent={activeEvent}
                  events={simState.scenario.events}
                  params={simState.params}
                  currentTime={simState.currentTime}
                  memoryEnabled={simState.memoryEnabled}
                  isExplainOpen={showExplainModal}
                  onToggleExplain={() => setShowExplainModal(p => !p)}
                />
              </div>
            </div>

            {/* Center column — Visualizations */}
            <div className="col-span-6 flex flex-col gap-2 min-h-0">
              {/* Event tunnel */}
              <div className="h-[160px] flex-shrink-0 glass-panel overflow-hidden">
                <EventFlowTunnel
                  currentStep={simState.currentStep}
                  severity={currentSeverity}
                  isPlaying={simState.playbackState === 'playing'}
                  hasSpiked={hasSpikedNow}
                />
              </div>

              {/* Membrane oscilloscope */}
              <div className="flex-1 min-h-[160px] glass-panel overflow-hidden">
                <MembraneOscilloscope
                  statefulTrace={simState.statefulTrace}
                  statelessTrace={simState.statelessTrace}
                  currentTime={simState.currentTime}
                  compareMode={simState.compareMode}
                  memoryEnabled={simState.memoryEnabled}
                  onSeek={simActions.seekTo}
                />
              </div>

              {/* Spike raster */}
              <div className="h-[150px] flex-shrink-0 glass-panel overflow-hidden">
                <SpikeRaster
                  trace={activeTrace}
                  currentTime={simState.currentTime}
                  onSeek={simActions.seekTo}
                />
              </div>
            </div>

            {/* Right column — SNN Panel + Summary */}
            <div className="col-span-3 flex flex-col gap-2 min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden">
                <SNNPanel
                  currentStep={simState.currentStep}
                  activeEvent={activeEvent}
                  trace={activeTrace}
                  params={simState.params}
                  memoryEnabled={simState.memoryEnabled}
                  currentTime={simState.currentTime}
                />
              </div>
              <div className="flex-shrink-0">
                <SummaryPanel
                  trace={activeTrace}
                  scenarioName={simState.scenario.name}
                />
              </div>
            </div>
          </main>

          {/* Timeline scrub wheel */}
          <div className="flex-shrink-0 px-2 pb-1">
            <TimelineScrubWheel
              events={simState.scenario.events}
              duration={simState.scenario.duration}
              currentTime={simState.currentTime}
              playbackState={simState.playbackState}
              playbackSpeed={simState.playbackSpeed}
              onSeek={simActions.seekTo}
              onPlay={simActions.play}
              onPause={simActions.pause}
              onStepForward={simActions.stepForward}
              onStepBackward={simActions.stepBackward}
              onReset={simActions.reset}
              onSetSpeed={simActions.setSpeed}
            />
          </div>

          {/* Presenter toolbar */}
          <div className="flex-shrink-0 px-2 pb-2">
            <PresenterToolbar
              playbackState={simState.playbackState}
              memoryEnabled={simState.memoryEnabled}
              compareMode={simState.compareMode}
              isFullscreen={isFullscreen}
              isMuted={audio.isMuted}
              scenarios={simActions.scenarios}
              activeScenarioId={simState.scenario.id}
              onPlay={simActions.play}
              onPause={simActions.pause}
              onReset={simActions.reset}
              onFreeze={simActions.freeze}
              onResume={simActions.resume}
              onToggleMemory={simActions.toggleMemory}
              onToggleCompare={() => setShowCompare(p => !p)}
              onExplainMoment={() => setShowExplainModal(true)}
              onToggleFullscreen={toggleFullscreen}
              onToggleMute={audio.toggleMute}
              onSelectScenario={simActions.setScenario}
              onInviteAudience={() => setShowAudience(true)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CompareModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        statefulTrace={simState.statefulTrace}
        statelessTrace={simState.statelessTrace}
      />

      <AudienceOverlay
        isOpen={showAudience}
        onClose={() => setShowAudience(false)}
        roomId={roomId}
        joinUrl={joinUrl}
        votes={votes}
        participantCount={votes.totalParticipants}
        isConnected={isSocketConnected}
        onCreateRoom={createRoom}
        onCloseRoom={closeRoom}
        onSimulateVotes={simulateVotes}
        onApplyWinningVote={applyWinningVote}
      />
    </div>
  );
}

// ============================================================
// Audience Join Page (mobile-first)
// ============================================================

function JoinPage() {
  const roomId = window.location.pathname.split('/join/')[1] || '';
  const [joined, setJoined] = useState(false);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 4000,
        reconnectionAttempts: 4,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        if (roomId) {
          socket?.emit('room:join', { roomId });
        }
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });
    } catch {
      // Fallback to standalone mode
    }

    return () => {
      socket?.disconnect();
    };
  }, [roomId]);

  const handleJoin = () => {
    setJoined(true);
    if (socketRef.current?.connected && roomId) {
      socketRef.current.emit('room:join', { roomId });
    }
  };

  const castVote = (type: string, value: string) => {
    setVoted(prev => ({ ...prev, [type]: true }));
    if (socketRef.current?.connected && roomId) {
      socketRef.current.emit('room:vote', { roomId, type, value });
    }
  };

  return (
    <div className="min-h-screen bg-void grid-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-wider mb-1">
            <span className="text-cyber-cyan">BREACH</span>
            <span className="text-cyber-red">//</span>
            <span className="text-cyber-cyan">REWIND</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono">AUDIENCE PARTICIPATION</p>
          <div className="mt-2 px-3 py-1 rounded bg-void-100 inline-block">
            <span className="font-mono text-sm text-cyber-cyan">
              Room: {roomId || 'Unknown'}
            </span>
          </div>
          <div className="mt-1">
            <span className={`text-[10px] font-mono flex items-center justify-center gap-1.5 ${connected ? 'text-cyber-green' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-cyber-green animate-pulse' : 'bg-slate-500'}`} />
              {connected ? 'LIVE SERVER CONNECTED' : 'LOCAL MODE'}
            </span>
          </div>
        </div>

        {!joined ? (
          <div className="text-center">
            <button
              onClick={handleJoin}
              className="btn-cyber text-lg px-8 py-4 w-full"
            >
              JOIN SESSION
            </button>
            <p className="text-xs text-slate-600 mt-2">No account required</p>
          </div>
        ) : (
          <>
            {/* Scenario vote */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold tracking-wider text-slate-300 uppercase">
                Choose Next Scenario
              </h3>
              {voted.scenario ? (
                <p className="text-center text-cyber-green font-mono text-sm py-4">
                  ✓ Vote recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {[
                    { id: 'slow_apt', label: 'Slow & Stealthy APT', icon: '🕵️' },
                    { id: 'burst_attack', label: 'Sudden Burst Attack', icon: '💥' },
                    { id: 'benign_traffic', label: 'Normal Traffic', icon: '📊' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => castVote('scenario', opt.id)}
                      className="w-full px-4 py-3 rounded-lg bg-void-100 border border-white/[0.06] text-left hover:bg-void-200 hover:border-cyber-cyan/30 transition-all active:scale-[0.98]"
                    >
                      <span className="mr-2">{opt.icon}</span>
                      <span className="text-sm text-slate-300">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prediction vote */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold tracking-wider text-slate-300 uppercase">
                Predict the Outcome
              </h3>
              {voted.prediction ? (
                <p className="text-center text-cyber-green font-mono text-sm py-4">
                  ✓ Prediction recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {[
                    { id: 'no_spike', label: 'No spike will occur', icon: '🟢' },
                    { id: 'spike_soon', label: 'Spike will fire soon', icon: '⚡' },
                    { id: 'insufficient_evidence', label: 'Insufficient evidence', icon: '🤔' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => castVote('prediction', opt.id)}
                      className="w-full px-4 py-3 rounded-lg bg-void-100 border border-white/[0.06] text-left hover:bg-void-200 hover:border-cyber-purple/30 transition-all active:scale-[0.98]"
                    >
                      <span className="mr-2">{opt.icon}</span>
                      <span className="text-sm text-slate-300">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-600 font-mono">
              ANONYMOUS — NO DATA COLLECTED
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
