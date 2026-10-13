// ============================================================
// BREACH//REWIND — Core Simulation Hook
// ============================================================
// Central state management for the entire simulation experience.
// Manages playback, simulation traces, timeline scrubbing,
// and parameter changes.

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  LIFParams,
  DEFAULT_LIF_PARAMS,
  SimulationTrace,
  SimulationStep,
  PlaybackState,
  Scenario,
} from '@shared/types';
import { LIFSimulator } from '../simulation/LIFSimulator';
import { SCENARIOS, APT_SCENARIO } from '../simulation/scenarios';

export interface SimulationState {
  // Current scenario & params
  scenario: Scenario;
  params: LIFParams;
  
  // Precomputed traces
  statefulTrace: SimulationTrace | null;
  statelessTrace: SimulationTrace | null; // memory-off ablation
  
  // Playback
  playbackState: PlaybackState;
  currentTime: number;
  playbackSpeed: number;
  memoryEnabled: boolean;
  
  // Current step data (derived from currentTime)
  currentStep: SimulationStep | null;
  currentStepIndex: number;
  
  // Comparison mode
  compareMode: boolean;
}

export interface SimulationActions {
  // Playback controls
  play: () => void;
  pause: () => void;
  freeze: () => void;
  resume: () => void;
  reset: () => void;
  seekTo: (time: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (speed: number) => void;
  
  // Scenario & params
  setScenario: (scenarioId: string) => void;
  setParams: (params: Partial<LIFParams>) => void;
  toggleMemory: () => void;
  
  // Comparison
  toggleCompare: () => void;
  
  // Get all scenarios
  scenarios: Scenario[];
}

export function useSimulation(): [SimulationState, SimulationActions] {
  const [scenario, setScenarioState] = useState<Scenario>(APT_SCENARIO);
  const [params, setParamsState] = useState<LIFParams>(DEFAULT_LIF_PARAMS);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  
  const simulatorRef = useRef(new LIFSimulator(params));
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  
  // Compute traces whenever scenario or params change
  const statefulTrace = useMemo(() => {
    const sim = new LIFSimulator(params);
    return sim.simulate(scenario, true);
  }, [scenario, params]);
  
  const statelessTrace = useMemo(() => {
    const sim = new LIFSimulator(params);
    return sim.simulate(scenario, false);
  }, [scenario, params]);
  
  // Derive current step from time — O(1) lookup
  const currentStepIndex = useMemo(() => {
    if (!statefulTrace) return 0;
    return LIFSimulator.timeToStep(statefulTrace, currentTime);
  }, [statefulTrace, currentTime]);
  
  const currentStep = useMemo(() => {
    if (!statefulTrace) return null;
    const activeTrace = memoryEnabled ? statefulTrace : statelessTrace;
    if (!activeTrace) return null;
    return activeTrace.steps[currentStepIndex] || null;
  }, [statefulTrace, statelessTrace, memoryEnabled, currentStepIndex]);
  
  // Animation loop for playback
  const animate = useCallback((timestamp: number) => {
    if (lastFrameRef.current === 0) {
      lastFrameRef.current = timestamp;
    }
    
    const deltaMs = timestamp - lastFrameRef.current;
    lastFrameRef.current = timestamp;
    
    const deltaSec = (deltaMs / 1000) * playbackSpeed;
    
    setCurrentTime(prev => {
      const next = prev + deltaSec;
      if (next >= scenario.duration) {
        setPlaybackState('paused');
        return scenario.duration;
      }
      return next;
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, [playbackSpeed, scenario.duration]);
  
  // Start/stop animation based on playback state
  useEffect(() => {
    if (playbackState === 'playing') {
      lastFrameRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playbackState, animate]);
  
  // Actions
  const play = useCallback(() => {
    if (currentTime >= scenario.duration) {
      setCurrentTime(0);
    }
    setPlaybackState('playing');
  }, [currentTime, scenario.duration]);
  
  const pause = useCallback(() => {
    setPlaybackState('paused');
  }, []);
  
  const freeze = useCallback(() => {
    setPlaybackState('frozen');
  }, []);
  
  const resume = useCallback(() => {
    setPlaybackState('playing');
  }, []);
  
  const reset = useCallback(() => {
    setPlaybackState('idle');
    setCurrentTime(0);
    setCompareMode(false);
  }, []);
  
  const seekTo = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(time, scenario.duration));
    setCurrentTime(clamped);
    if (playbackState === 'idle') {
      setPlaybackState('paused');
    }
  }, [scenario.duration, playbackState]);
  
  const stepForward = useCallback(() => {
    if (!statefulTrace) return;
    const nextStep = Math.min(currentStepIndex + 1, statefulTrace.totalSteps - 1);
    setCurrentTime(nextStep * params.dt);
    if (playbackState === 'idle') setPlaybackState('paused');
  }, [statefulTrace, currentStepIndex, params.dt, playbackState]);
  
  const stepBackward = useCallback(() => {
    if (!statefulTrace) return;
    const prevStep = Math.max(currentStepIndex - 1, 0);
    setCurrentTime(prevStep * params.dt);
    if (playbackState === 'idle') setPlaybackState('paused');
  }, [statefulTrace, currentStepIndex, params.dt, playbackState]);
  
  const setSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(Math.max(0.25, Math.min(4, speed)));
  }, []);
  
  const setScenario = useCallback((scenarioId: string) => {
    const found = SCENARIOS.find(s => s.id === scenarioId);
    if (found) {
      setScenarioState(found);
      setCurrentTime(0);
      setPlaybackState('idle');
      setCompareMode(false);
    }
  }, []);
  
  const setParams = useCallback((newParams: Partial<LIFParams>) => {
    setParamsState(prev => {
      const merged = { ...prev, ...newParams };
      // Validate
      if (merged.V_thresh <= merged.V_rest) return prev;
      if (merged.dt <= 0 || merged.tau_m <= 0 || merged.R <= 0) return prev;
      return merged;
    });
  }, []);
  
  const toggleMemory = useCallback(() => {
    setMemoryEnabled(prev => !prev);
  }, []);
  
  const toggleCompare = useCallback(() => {
    setCompareMode(prev => !prev);
    if (playbackState === 'idle') {
      setPlaybackState('paused');
    }
  }, [playbackState]);
  
  const state: SimulationState = {
    scenario,
    params,
    statefulTrace,
    statelessTrace,
    playbackState,
    currentTime,
    playbackSpeed,
    memoryEnabled,
    currentStep,
    currentStepIndex,
    compareMode,
  };
  
  const actions: SimulationActions = {
    play,
    pause,
    freeze,
    resume,
    reset,
    seekTo,
    stepForward,
    stepBackward,
    setSpeed,
    setScenario,
    setParams,
    toggleMemory,
    toggleCompare,
    scenarios: SCENARIOS,
  };
  
  return [state, actions];
}
