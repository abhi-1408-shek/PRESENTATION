// ============================================================
// BREACH//REWIND — Shared Type Definitions
// ============================================================

// --- Neuron & Simulation Parameters ---

export interface LIFParams {
  /** Resting potential in mV */
  V_rest: number;
  /** Firing threshold in mV */
  V_thresh: number;
  /** Post-spike reset potential in mV */
  V_reset: number;
  /** Membrane time constant in seconds */
  tau_m: number;
  /** Integration time step in seconds */
  dt: number;
  /** Membrane resistance / input scaling (MΩ) */
  R: number;
  /** Number of neurons in population */
  numNeurons: number;
}

export const DEFAULT_LIF_PARAMS: LIFParams = {
  V_rest: -70.0,
  V_thresh: -50.0,
  V_reset: -70.0,
  tau_m: 8.0,
  dt: 0.05,
  R: 10.0,
  numNeurons: 5,
};

// --- Neuron State Snapshot ---

export interface NeuronSnapshot {
  /** Membrane potentials for each neuron at this timestep */
  potentials: number[];
  /** Whether each neuron spiked at this timestep */
  spikes: boolean[];
  /** Cumulative spike counts up to this timestep */
  spikeCounts: number[];
  /** Input currents at this timestep */
  currents: number[];
}

// --- Full Simulation Timestep ---

export interface SimulationStep {
  /** Discrete timestep index */
  stepIndex: number;
  /** Time in seconds */
  time: number;
  /** Neuron state snapshot */
  neuronState: NeuronSnapshot;
  /** Index of the active event at this time, or -1 */
  activeEventIndex: number;
  /** Stateless baseline threat score at this time (0-1) */
  baselineScore: number;
  /** Ablated (memory-off) LIF response — max normalized potential */
  ablatedScore: number;
  /** Stateful SNN threat score — derived from membrane state */
  snnThreatScore: number;
}

// --- Complete Simulation Trace ---

export interface SimulationTrace {
  /** All timestep snapshots */
  steps: SimulationStep[];
  /** Parameters used for this run */
  params: LIFParams;
  /** Scenario ID */
  scenarioId: string;
  /** Total simulation duration in seconds */
  duration: number;
  /** Total number of steps */
  totalSteps: number;
  /** Summary statistics */
  summary: SimulationSummary;
}

export interface SimulationSummary {
  totalEvents: number;
  totalSpikes: number[];
  thresholdCrossed: boolean[];
  firstSpikeTime: (number | null)[];
  finalPotentials: number[];
  peakPotential: number[];
}

// --- Cyber Event Definitions ---

export type EventSeverity = 'normal' | 'suspicious' | 'critical';

export type AttackPhase =
  | 'valid_login'
  | 'unexpected_ingress'
  | 'host_discovery'
  | 'privilege_escalation'
  | 'lateral_movement'
  | 'exfiltration'
  | 'benign';

export interface CyberEvent {
  /** Unique event ID */
  id: string;
  /** Time in seconds when this event occurs */
  timestamp: number;
  /** Human-readable event type */
  type: string;
  /** Attack phase classification */
  phase: AttackPhase;
  /** Severity level */
  severity: EventSeverity;
  /** Short human-readable description */
  description: string;
  /** Normalized feature vector (one per neuron channel) */
  features: number[];
  /** Detailed explanation for state inspector */
  explanation: string;
}

// --- Scenario Definition ---

export interface Scenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  events: CyberEvent[];
  /** Whether this scenario is synthetic/illustrative */
  isSynthetic: boolean;
}

// --- Playback State ---

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'frozen';

export interface PlaybackConfig {
  state: PlaybackState;
  currentTime: number;
  speed: number;
  memoryEnabled: boolean;
}

// --- Audience / Voting ---

export type ScenarioVote = 'slow_apt' | 'burst_attack' | 'benign_traffic';
export type PredictionVote = 'no_spike' | 'spike_soon' | 'insufficient_evidence';

export interface VotePayload {
  roomId: string;
  type: 'scenario' | 'prediction';
  value: ScenarioVote | PredictionVote;
}

export interface VoteTally {
  scenario: Record<ScenarioVote, number>;
  prediction: Record<PredictionVote, number>;
  totalParticipants: number;
}

export interface RoomState {
  roomId: string;
  isOpen: boolean;
  votes: VoteTally;
  createdAt: number;
}

// --- Socket Events ---

export enum SocketEvents {
  // Client -> Server
  CREATE_ROOM = 'room:create',
  JOIN_ROOM = 'room:join',
  CAST_VOTE = 'room:vote',
  CLOSE_ROOM = 'room:close',
  SIMULATE_VOTES = 'room:simulate',

  // Server -> Client
  ROOM_CREATED = 'room:created',
  ROOM_JOINED = 'room:joined',
  ROOM_CLOSED = 'room:closed',
  VOTE_UPDATE = 'room:vote_update',
  PARTICIPANT_COUNT = 'room:participants',
  ERROR = 'room:error',
}

// --- Neuron Channel Names ---

export const NEURON_LABELS = [
  'Auth Anomaly',
  'Recon Activity',
  'Lateral Movement',
  'Data Exfiltration',
  'Threat Integrator',
] as const;

export const NEURON_COLORS = [
  '#00F2FE', // cyan
  '#F59E0B', // amber
  '#9D4EDD', // purple
  '#FF2A6D', // crimson
  '#10B981', // emerald
] as const;
