// ============================================================
// BREACH//REWIND — Main Application
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { SummaryPanel } from './components/SummaryPanel';
import { MembraneOscilloscope } from './visualizations/MembraneOscilloscope';
import { SpikeRaster } from './visualizations/SpikeRaster';
import { EventFlowTunnel } from './visualizations/EventFlowTunnel';
import { CyberEvent, EventSeverity } from '@shared/types';

function App() {
  const [simState, simActions] = useSimulation();
  const audio = useAudio();
  const [showTitle, setShowTitle] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);

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
          simActions.toggleCompare();
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
        <div className="min-h-screen flex flex-col">
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
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 p-2">
            {/* Left column — Baseline + Inspector */}
            <div className="lg:col-span-3 flex flex-col gap-2 min-h-[300px]">
              <div className="flex-1 min-h-[220px] overflow-hidden">
                <BaselinePanel
                  currentStep={simState.currentStep}
                  activeEvent={activeEvent}
                  trace={activeTrace}
                  currentTime={simState.currentTime}
                />
              </div>
              <div className="flex-1 min-h-[280px] overflow-hidden">
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
            <div className="lg:col-span-6 flex flex-col gap-2 min-h-[520px]">
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
            <div className="lg:col-span-3 flex flex-col gap-2 min-h-[350px]">
              <div className="flex-1 min-h-[260px] overflow-hidden">
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
              onToggleCompare={() => {
                simActions.toggleCompare();
                setShowCompare(p => !p);
              }}
              onExplainMoment={() => setShowExplainModal(true)}
              onToggleFullscreen={toggleFullscreen}
              onToggleMute={audio.toggleMute}
              onSelectScenario={simActions.setScenario}
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

    </div>
  );
}

export default App;
