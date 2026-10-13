// ============================================================
// BREACH//REWIND — Leaky Integrate-and-Fire Simulation Engine
// ============================================================
// Discrete-time LIF neuron population simulator with deterministic
// state reconstruction for temporal forensics scrubbing.

import {
  LIFParams,
  DEFAULT_LIF_PARAMS,
  NeuronSnapshot,
  SimulationStep,
  SimulationTrace,
  SimulationSummary,
  CyberEvent,
  Scenario,
} from '@shared/types';

/**
 * Core LIF Simulator — deterministic, stateless-functional design.
 * Computes a complete simulation trace for a given scenario and parameter set.
 * Returns an immutable array of SimulationStep snapshots that can be indexed
 * at O(1) for instant timeline scrubbing.
 */
export class LIFSimulator {
  private params: LIFParams;
  private alpha: number; // decay factor exp(-dt/tau_m)

  constructor(params: Partial<LIFParams> = {}) {
    this.params = { ...DEFAULT_LIF_PARAMS, ...params };
    this.validateParams();
    this.alpha = Math.exp(-this.params.dt / this.params.tau_m);
  }

  /** Update parameters and recompute alpha */
  updateParams(newParams: Partial<LIFParams>): void {
    this.params = { ...this.params, ...newParams };
    this.validateParams();
    this.alpha = Math.exp(-this.params.dt / this.params.tau_m);
  }

  getParams(): LIFParams {
    return { ...this.params };
  }

  /** Validate that all parameters are physically meaningful */
  private validateParams(): void {
    const p = this.params;
    if (p.dt <= 0) throw new Error('dt must be positive');
    if (p.tau_m <= 0) throw new Error('tau_m must be positive');
    if (p.R <= 0) throw new Error('R must be positive');
    if (p.numNeurons < 1) throw new Error('numNeurons must be >= 1');
    if (p.V_thresh <= p.V_rest)
      throw new Error('V_thresh must be greater than V_rest');
    if (p.V_reset > p.V_thresh)
      throw new Error('V_reset must be <= V_thresh');
    if (!isFinite(this.params.tau_m) || !isFinite(this.params.dt))
      throw new Error('Parameters must be finite');
  }

  /**
   * Run a complete deterministic simulation over the scenario timeline.
   * Returns a SimulationTrace with one SimulationStep per dt increment.
   */
  simulate(scenario: Scenario, memoryEnabled: boolean = true): SimulationTrace {
    const { V_rest, V_thresh, V_reset, R, numNeurons, dt } = this.params;
    const totalSteps = Math.ceil(scenario.duration / dt);
    const steps: SimulationStep[] = new Array(totalSteps);

    // Initialize membrane potentials at resting
    let potentials = new Float64Array(numNeurons).fill(V_rest);
    const spikeCounts = new Int32Array(numNeurons).fill(0);
    const firstSpikeTimes: (number | null)[] = new Array(numNeurons).fill(null);
    const peakPotentials = new Float64Array(numNeurons).fill(V_rest);

    // Pre-sort events by timestamp for efficient lookup
    const sortedEvents = [...scenario.events].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    for (let step = 0; step < totalSteps; step++) {
      const time = step * dt;

      // Find active event at this time
      const activeEventIndex = this.findActiveEvent(sortedEvents, time, dt);
      const activeEvent =
        activeEventIndex >= 0 ? sortedEvents[activeEventIndex] : null;

      // Compute input currents from event features
      const currents = new Float64Array(numNeurons).fill(0);
      if (activeEvent) {
        for (let n = 0; n < numNeurons; n++) {
          if (n < activeEvent.features.length) {
            currents[n] = activeEvent.features[n];
          }
        }
      }

      // If memory disabled, reset to resting before each event transition
      if (!memoryEnabled && activeEvent) {
        // Check if this is the first step of a new event
        const prevTime = (step - 1) * dt;
        const prevEventIndex =
          step > 0 ? this.findActiveEvent(sortedEvents, prevTime, dt) : -1;
        if (activeEventIndex !== prevEventIndex) {
          potentials.fill(V_rest);
        }
      }

      // LIF membrane dynamics: V[t+1] = V_rest + alpha * (V[t] - V_rest) + R * I[t]
      const newPotentials = new Float64Array(numNeurons);
      const spikes: boolean[] = new Array(numNeurons).fill(false);

      for (let n = 0; n < numNeurons; n++) {
        newPotentials[n] =
          V_rest + this.alpha * (potentials[n] - V_rest) + R * currents[n];

        // Spike check
        if (newPotentials[n] >= V_thresh) {
          spikes[n] = true;
          spikeCounts[n]++;
          if (firstSpikeTimes[n] === null) {
            firstSpikeTimes[n] = time;
          }
          newPotentials[n] = V_reset; // Hard reset
        }

        // Track peak
        if (newPotentials[n] > peakPotentials[n]) {
          peakPotentials[n] = newPotentials[n];
        }

        // Clamp to prevent numerical drift below rest (shouldn't happen but safety)
        if (newPotentials[n] < V_rest - 5) {
          newPotentials[n] = V_rest;
        }
      }

      // Compute baseline score (stateless per-event heuristic)
      const baselineScore = this.computeBaselineScore(activeEvent);

      // Compute ablated score (memory-off single-event LIF response)
      const ablatedScore = this.computeAblatedScore(activeEvent);

      // Compute SNN threat score from membrane state
      const snnThreatScore = this.computeSNNThreatScore(
        newPotentials,
        spikes,
        spikeCounts
      );

      // Find original event index in scenario.events array
      const originalEventIndex = activeEvent
        ? scenario.events.findIndex((e) => e.id === activeEvent.id)
        : -1;

      steps[step] = {
        stepIndex: step,
        time: Math.round(time * 1000) / 1000, // Round to ms precision
        neuronState: {
          potentials: Array.from(newPotentials),
          spikes: [...spikes],
          spikeCounts: Array.from(spikeCounts),
          currents: Array.from(currents),
        },
        activeEventIndex: originalEventIndex,
        baselineScore,
        ablatedScore,
        snnThreatScore,
      };

      // Update potentials for next step
      potentials = newPotentials;
    }

    // Build summary
    const summary: SimulationSummary = {
      totalEvents: scenario.events.length,
      totalSpikes: Array.from(spikeCounts),
      thresholdCrossed: Array.from(spikeCounts).map((c) => c > 0),
      firstSpikeTime: [...firstSpikeTimes],
      finalPotentials: Array.from(potentials),
      peakPotential: Array.from(peakPotentials),
    };

    return {
      steps,
      params: { ...this.params },
      scenarioId: scenario.id,
      duration: scenario.duration,
      totalSteps,
      summary,
    };
  }

  /**
   * Find the event active at the given time.
   * An event is active during a window around its timestamp.
   */
  private findActiveEvent(
    events: CyberEvent[],
    time: number,
    dt: number
  ): number {
    // Each event has an influence window: [timestamp, timestamp + eventDuration]
    // Event duration is calculated as the gap to the next event, capped
    for (let i = events.length - 1; i >= 0; i--) {
      const eventStart = events[i].timestamp;
      const nextEventStart =
        i < events.length - 1 ? events[i + 1].timestamp : eventStart + 5;
      const eventEnd = Math.min(eventStart + 3.0, nextEventStart); // Max 3s influence window

      if (time >= eventStart && time < eventEnd) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Stateless baseline: weighted feature sum normalized to [0, 1].
   * This is an illustrative event-level heuristic, not a trained model.
   */
  private computeBaselineScore(event: CyberEvent | null): number {
    if (!event) return 0;
    const weights = [0.25, 0.2, 0.25, 0.3, 0.0]; // per-channel weights
    let score = 0;
    for (let i = 0; i < Math.min(event.features.length, weights.length); i++) {
      score += event.features[i] * weights[i];
    }
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Ablated (memory-off) LIF: single-event potential from resting.
   * Shows what V would be if each event were evaluated independently.
   */
  private computeAblatedScore(event: CyberEvent | null): number {
    if (!event) return 0;
    const { V_rest, V_thresh, R } = this.params;
    // Single-step response from resting
    let maxResponse = 0;
    for (const f of event.features) {
      const response = V_rest + R * f;
      const normalized = (response - V_rest) / (V_thresh - V_rest);
      if (normalized > maxResponse) maxResponse = normalized;
    }
    return Math.min(1, Math.max(0, maxResponse));
  }

  /**
   * SNN threat score: derived from the neuron population's membrane state.
   * Uses max normalized potential + spike activity bonus.
   */
  private computeSNNThreatScore(
    potentials: Float64Array,
    spikes: boolean[],
    spikeCounts: Int32Array
  ): number {
    const { V_rest, V_thresh } = this.params;
    let maxNorm = 0;
    for (let n = 0; n < potentials.length; n++) {
      const norm = (potentials[n] - V_rest) / (V_thresh - V_rest);
      if (norm > maxNorm) maxNorm = norm;
    }

    // Spike bonus: each active spike adds urgency
    const spikeBonus = spikes.filter(Boolean).length * 0.15;
    // Historical spike bonus
    const totalSpikes = Array.from(spikeCounts).reduce((a, b) => a + b, 0);
    const historyBonus = Math.min(0.2, totalSpikes * 0.03);

    return Math.min(1, Math.max(0, maxNorm + spikeBonus + historyBonus));
  }

  /**
   * Get state at a specific time by direct index lookup.
   * O(1) access into the precomputed trace.
   */
  static getStateAtTime(trace: SimulationTrace, time: number): SimulationStep {
    const stepIndex = Math.min(
      Math.max(0, Math.floor(time / trace.params.dt)),
      trace.totalSteps - 1
    );
    return trace.steps[stepIndex];
  }

  /**
   * Get the step index for a given time.
   */
  static timeToStep(trace: SimulationTrace, time: number): number {
    return Math.min(
      Math.max(0, Math.floor(time / trace.params.dt)),
      trace.totalSteps - 1
    );
  }
}

export default LIFSimulator;
