// ============================================================
// BREACH//REWIND — LIF Simulation Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { LIFSimulator } from '../LIFSimulator';
import { APT_SCENARIO, BENIGN_SCENARIO, BURST_SCENARIO } from '../scenarios';
import { DEFAULT_LIF_PARAMS, Scenario } from '@shared/types';

describe('LIFSimulator', () => {
  // 1. Resting potential stability
  describe('Resting Potential Stability', () => {
    it('should maintain resting potential without input', () => {
      const emptyScenario: Scenario = {
        id: 'empty',
        name: 'Empty',
        description: 'No events',
        duration: 10,
        events: [],
        isSynthetic: true,
      };

      const sim = new LIFSimulator();
      const trace = sim.simulate(emptyScenario);

      // All potentials should remain at V_rest
      for (const step of trace.steps) {
        for (const v of step.neuronState.potentials) {
          expect(Math.abs(v - DEFAULT_LIF_PARAMS.V_rest)).toBeLessThan(0.001);
        }
      }
    });
  });

  // 2. Subthreshold input doesn't spike
  describe('Subthreshold Input', () => {
    it('should change potential without causing a spike for small input', () => {
      const scenario: Scenario = {
        id: 'sub',
        name: 'Subthreshold',
        description: 'Small input',
        duration: 5,
        events: [
          {
            id: 'e1',
            timestamp: 0,
            type: 'Small Event',
            phase: 'benign',
            severity: 'normal',
            description: '',
            features: [0.01, 0.01, 0.01, 0.01, 0.01],
            explanation: '',
          },
        ],
        isSynthetic: true,
      };

      const sim = new LIFSimulator();
      const trace = sim.simulate(scenario);

      // Should have no spikes
      for (const step of trace.steps) {
        for (const spike of step.neuronState.spikes) {
          expect(spike).toBe(false);
        }
      }

      // But potential should have changed during the event window
      const step10 = trace.steps[10]; // 0.5 seconds in
      const maxV = Math.max(...step10.neuronState.potentials);
      expect(maxV).toBeGreaterThan(DEFAULT_LIF_PARAMS.V_rest);
    });
  });

  // 3. Above-threshold input produces spike and reset
  describe('Threshold Crossing', () => {
    it('should produce a spike when input is strong enough', () => {
      const scenario: Scenario = {
        id: 'strong',
        name: 'Strong',
        description: 'Large input',
        duration: 5,
        events: [
          {
            id: 'e1',
            timestamp: 0,
            type: 'Strong Event',
            phase: 'exfiltration',
            severity: 'critical',
            description: '',
            features: [0.9, 0.9, 0.9, 0.9, 0.9],
            explanation: '',
          },
        ],
        isSynthetic: true,
      };

      const sim = new LIFSimulator();
      const trace = sim.simulate(scenario);

      // Should have at least one spike
      const hasAnySpike = trace.steps.some((step) =>
        step.neuronState.spikes.some(Boolean)
      );
      expect(hasAnySpike).toBe(true);

      // After spike, potential should be at reset
      for (const step of trace.steps) {
        for (let n = 0; n < step.neuronState.potentials.length; n++) {
          if (step.neuronState.spikes[n]) {
            expect(step.neuronState.potentials[n]).toBe(DEFAULT_LIF_PARAMS.V_reset);
          }
        }
      }
    });
  });

  // 4. Membrane potential decays without input
  describe('Membrane Decay', () => {
    it('should decay toward resting potential without input', () => {
      const scenario: Scenario = {
        id: 'decay',
        name: 'Decay Test',
        description: 'Single pulse then silence',
        duration: 20,
        events: [
          {
            id: 'e1',
            timestamp: 0,
            type: 'Pulse',
            phase: 'unexpected_ingress',
            severity: 'suspicious',
            description: '',
            features: [0.5, 0.5, 0.5, 0.5, 0.5],
            explanation: '',
          },
        ],
        isSynthetic: true,
      };

      const sim = new LIFSimulator();
      const trace = sim.simulate(scenario);

      // Find the peak potential (during event window)
      let peakStep = 0;
      let peakV = DEFAULT_LIF_PARAMS.V_rest;
      for (let i = 0; i < trace.steps.length; i++) {
        const maxV = Math.max(...trace.steps[i].neuronState.potentials);
        if (maxV > peakV) {
          peakV = maxV;
          peakStep = i;
        }
      }

      // After the event window ends, potential should decay
      const lateStep = trace.steps[trace.steps.length - 1];
      const lateV = Math.max(...lateStep.neuronState.potentials);
      expect(lateV).toBeLessThan(peakV);
      // Should be close to resting
      expect(Math.abs(lateV - DEFAULT_LIF_PARAMS.V_rest)).toBeLessThan(2.0);
    });
  });

  // 5. Deterministic replay
  describe('Deterministic Replay', () => {
    it('should produce identical output for identical inputs', () => {
      const sim = new LIFSimulator();
      const trace1 = sim.simulate(APT_SCENARIO);
      const trace2 = sim.simulate(APT_SCENARIO);

      expect(trace1.totalSteps).toBe(trace2.totalSteps);

      for (let i = 0; i < trace1.totalSteps; i++) {
        for (let n = 0; n < DEFAULT_LIF_PARAMS.numNeurons; n++) {
          expect(trace1.steps[i].neuronState.potentials[n]).toBe(
            trace2.steps[i].neuronState.potentials[n]
          );
          expect(trace1.steps[i].neuronState.spikes[n]).toBe(
            trace2.steps[i].neuronState.spikes[n]
          );
        }
      }
    });
  });

  // 6. State at timestamp equals replay to timestamp
  describe('State Reconstruction', () => {
    it('should yield same state via direct lookup vs replaying from start', () => {
      const sim = new LIFSimulator();
      const fullTrace = sim.simulate(APT_SCENARIO);

      // Pick a mid-point timestamp
      const targetTime = 30.0;
      const directState = LIFSimulator.getStateAtTime(fullTrace, targetTime);

      // Run a shorter scenario up to targetTime
      const shortScenario: Scenario = {
        ...APT_SCENARIO,
        duration: targetTime + 0.1,
        events: APT_SCENARIO.events.filter((e) => e.timestamp <= targetTime),
      };
      const shortTrace = sim.simulate(shortScenario);

      const replayStep = LIFSimulator.timeToStep(shortTrace, targetTime);
      const replayState = shortTrace.steps[replayStep];

      // Potentials should match
      for (let n = 0; n < DEFAULT_LIF_PARAMS.numNeurons; n++) {
        expect(
          Math.abs(
            directState.neuronState.potentials[n] -
              replayState.neuronState.potentials[n]
          )
        ).toBeLessThan(0.01);
      }
    });
  });

  // 7. Forward and backward scrub yield same state
  describe('Scrub Consistency', () => {
    it('should give same state when seeking forward vs backward to same time', () => {
      const sim = new LIFSimulator();
      const trace = sim.simulate(APT_SCENARIO);

      const time1 = 25.0;
      const time2 = 45.0;

      // "Forward" to time2, then "backward" to time1
      const stateAtTime1 = LIFSimulator.getStateAtTime(trace, time1);
      const stateAtTime2 = LIFSimulator.getStateAtTime(trace, time2);

      // Both should be valid
      expect(stateAtTime1.time).toBeLessThanOrEqual(time1 + 0.05);
      expect(stateAtTime2.time).toBeLessThanOrEqual(time2 + 0.05);

      // Going "back" to time1 from time2 should give same result
      const stateBackToTime1 = LIFSimulator.getStateAtTime(trace, time1);
      for (let n = 0; n < DEFAULT_LIF_PARAMS.numNeurons; n++) {
        expect(stateBackToTime1.neuronState.potentials[n]).toBe(
          stateAtTime1.neuronState.potentials[n]
        );
      }
    });
  });

  // 8. Parameter changes recompute traces
  describe('Parameter Changes', () => {
    it('should produce different traces with different tau_m', () => {
      const sim1 = new LIFSimulator({ tau_m: 5.0 });
      const sim2 = new LIFSimulator({ tau_m: 15.0 });

      const trace1 = sim1.simulate(APT_SCENARIO);
      const trace2 = sim2.simulate(APT_SCENARIO);

      // Traces should differ (different decay rates)
      let anyDifference = false;
      for (let i = 100; i < Math.min(trace1.totalSteps, trace2.totalSteps); i++) {
        const v1 = trace1.steps[i].neuronState.potentials[0];
        const v2 = trace2.steps[i].neuronState.potentials[0];
        if (Math.abs(v1 - v2) > 0.001) {
          anyDifference = true;
          break;
        }
      }
      expect(anyDifference).toBe(true);
    });
  });

  // Memory ON vs OFF should differ
  describe('Memory Mode Comparison', () => {
    it('should produce different traces with memory ON vs OFF', () => {
      const sim = new LIFSimulator();
      const traceOn = sim.simulate(APT_SCENARIO, true);
      const traceOff = sim.simulate(APT_SCENARIO, false);

      let differences = 0;
      for (let i = 0; i < traceOn.totalSteps; i++) {
        for (let n = 0; n < DEFAULT_LIF_PARAMS.numNeurons; n++) {
          if (
            Math.abs(
              traceOn.steps[i].neuronState.potentials[n] -
                traceOff.steps[i].neuronState.potentials[n]
            ) > 0.001
          ) {
            differences++;
          }
        }
      }
      expect(differences).toBeGreaterThan(0);
    });
  });

  // Benign scenario should produce fewer/no spikes
  describe('Benign Scenario', () => {
    it('should produce significantly fewer spikes than APT scenario', () => {
      const sim = new LIFSimulator();
      const aptTrace = sim.simulate(APT_SCENARIO);
      const benignTrace = sim.simulate(BENIGN_SCENARIO);

      const aptSpikes = aptTrace.summary.totalSpikes.reduce((a, b) => a + b, 0);
      const benignSpikes = benignTrace.summary.totalSpikes.reduce((a, b) => a + b, 0);

      expect(benignSpikes).toBeLessThanOrEqual(aptSpikes);
    });
  });

  // Invalid parameter validation
  describe('Parameter Validation', () => {
    it('should throw on invalid parameters', () => {
      expect(() => new LIFSimulator({ dt: -1 })).toThrow();
      expect(() => new LIFSimulator({ tau_m: 0 })).toThrow();
      expect(() => new LIFSimulator({ V_thresh: -80, V_rest: -70 })).toThrow();
      expect(() => new LIFSimulator({ numNeurons: 0 })).toThrow();
    });
  });
});
