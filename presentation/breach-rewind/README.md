# BREACH//REWIND — Temporal Forensics Lab
### An Interactive Neuromorphic Cybersecurity Experience

> **Research Concept**: *Spiking Neural Networks for Real-Time Identity Verification and Threat Detection*
>
> **Core Thesis**: Cybersecurity threat detection must evaluate the **temporal evolution** of events rather than isolated observations. Traditional stateless security analytics (SIEMs, stateless threshold rules) evaluate each event in isolation, rendering them blind to slow-and-stealthy multi-stage attacks (APTs). Spiking Neural Networks (SNNs) model time natively via leaky integration and synaptic temporal summation, detecting attacks through membrane potential accumulation while remaining resilient to benign background noise.

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation & Launch

Run both the frontend and WebSocket backend concurrently with a single command:

```bash
# Clone or navigate to the repository
cd breach-rewind

# Install all dependencies (root, client, server)
npm run install:all

# Start both Vite dev server (port 5173) and Socket.IO server (port 3001)
npm run dev
```

Once running:
- **Presenter Lab**: [http://localhost:5173](http://localhost:5173)
- **Audience Voting (Mobile Join)**: [http://localhost:5173/join/<ROOM_ID>](http://localhost:5173/join)
- **Server Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Running Simulation Unit Tests

```bash
npm run test
```

Expected result: 11 passing tests covering resting potential stability, subthreshold decay, threshold firing, deterministic replay, state reconstruction, time scrubbing, and memory ablation comparisons.

---

## 🧠 Scientific & Mathematical Architecture

### Leaky Integrate-and-Fire (LIF) Neuron Model

Each neuromorphic monitoring neuron follows continuous-time leaky integration discretized via forward Euler integration ($\Delta t = 10\,\text{ms}$):

$$\tau_m \frac{dV_i(t)}{dt} = -(V_i(t) - V_{\text{rest}}) + R_m \cdot I_i(t)$$

Discretized update:
$$V_i[t+\Delta t] = V_i[t] + \frac{\Delta t}{\tau_m} \left( -(V_i[t] - V_{\text{rest}}) + R_m \cdot I_i[t] \right)$$

When $V_i(t) \ge V_{\text{thresh}}$:
1. **Spike Generation**: A discrete action potential $S_i(t) = 1$ is emitted.
2. **Instant Reset**: $V_i(t) \leftarrow V_{\text{reset}}$.
3. **Refractory Period**: The neuron cannot fire again for duration $t_{\text{ref}} = 50\,\text{ms}$.

#### Biological & Neuromorphic Parameters
| Parameter | Symbol | Value | Unit | Description |
|---|---|---|---|---|
| Resting Potential | $V_{\text{rest}}$ | -70.0 | mV | Baseline membrane voltage without synaptic input |
| Threshold Potential | $V_{\text{thresh}}$ | -50.0 | mV | Voltage required to emit an action potential / alert |
| Reset Potential | $V_{\text{reset}}$ | -75.0 | mV | Hyperpolarization voltage immediately following a spike |
| Membrane Time Constant | $\tau_m$ | 80.0 | ms | Rate of leaky decay (synaptic memory retention) |
| Membrane Resistance | $R_m$ | 10.0 | MΩ | Current-to-voltage conversion scale |
| Refractory Period | $t_{\text{ref}}$ | 50.0 | ms | Minimum post-spike dead time preventing seizure bursts |

---

## 🛡️ Comparison: Stateless SIEM vs. Stateful SNN

| Dimension | Stateless Threshold Rule (Traditional SIEM) | Neuromorphic SNN (LIF Model) |
|---|---|---|
| **Event Evaluation** | Evaluates each log line independently ($P(\text{threat} \mid e_t)$) | Evaluates continuous temporal trajectory ($\int e(\tau) e^{-(t-\tau)/\tau_m} d\tau$) |
| **Stealthy APT Attack** | **MISSED (False Negative)**. Sub-threshold micro-probes stay below isolated alert thresholds. | **DETECTED (True Positive)**. Subthreshold events summate over time until $V_m$ crosses threshold. |
| **Burst Attack** | Detected, but often floods analyst queues with hundreds of duplicate alarms. | Clean, singular action potential followed by refractory suppression. |
| **Memory Ablation ($M=0$)** | Same as stateless SIEM — no temporal accumulation. | Demonstrates causality directly: toggling memory OFF instantly drops $V_m$ to baseline. |
| **Explainability** | Opaque rule ID or black-box probability score. | Deterministic trace showing exact summation history and energy expenditure. |

---

## 🎭 Live Seminar Demonstration Track (5-Minute Guide)

Use this script during a presentation or seminar:

### Minute 0:00 — 1:00: The Problem Setup
1. Launch app at [http://localhost:5173](http://localhost:5173).
2. Click **"ENTER LAB"** on the title screen.
3. Keep default scenario: **"Scenario 1: Slow & Stealthy APT"**.
4. Point out the three-panel layout:
   - **Left**: Stateless Baseline (Traditional SIEM)
   - **Center**: Real-Time Neural Oscilloscope & Raster Plot
   - **Right**: Neuromorphic SNN Detector + Explanation Engine

### Minute 1:00 — 2:15: Run the Attack & Observe Temporal Summation
1. Click **"RUN ATTACK"** (or press Spacebar).
2. Watch the **Baseline Panel**: The security score stays in the green/yellow zone ("BENIGN / NORMAL") because each low-severity micro-probe is beneath the statutory threshold.
3. Watch the **Center Oscilloscope**: Notice the cyan voltage curve $V_m(t)$ climbing upward in steps:
   - Each event injects current $I_i(t)$.
   - Between events, the membrane voltage leaks downward according to $\tau_m = 80\,\text{ms}$, but *does not reset to zero*.
   - Subsequent events arrive before full decay occurs, causing **temporal summation**.
4. At $t \approx 1200\,\text{ms}$, observe the **ACTION POTENTIAL SPIKE** firing as $V_m$ crosses $-50\,\text{mV}$!
5. Audio fires an audible sonification chirp.

### Minute 2:15 — 3:30: The "Breach Rewind" (Temporal Scrubbing)
1. Pause playback.
2. Drag the **Timeline Scrub Wheel** or press Left Arrow to rewind time back to the instant before the spike ($t = 1100\,\text{ms}$).
3. Show the audience how every neuron voltage, event trail, and SIEM score is deterministically reconstructed in real-time.
4. Click **"EXPLAIN THIS MOMENT"** in the Inspector to show the mathematically transparent reason why the network was primed to fire.

### Minute 3:30 — 4:15: The Ablation Proof ("Toggle Memory")
1. Click the **"MEMORY: ON"** switch (or press `M`) to toggle it to **"MEMORY: OFF"**.
2. Notice how the membrane curve collapses to isolated spikes that instantaneously decay back to $-70\,\text{mV}$.
3. Click **"COMPARE TRACE"** in the toolbar to display the side-by-side modal showing the divergence between Stateful SNN, Stateless Baseline, and Memory-Off ablation.

### Minute 4:15 — 5:00: Audience Participation & Q&A
1. Click **"AUDIENCE PARTICIPATION"** in the top-right toolbar.
2. Invite participants to scan the displayed QR code with their mobile phones (or click "Simulate Audience Votes" for a fail-safe demo).
3. The audience votes on the next scenario:
   - Switch to **"Scenario 2: Sudden Burst Attack"** or **"Scenario 3: Normal Daily Traffic"**.
4. Show how the benign traffic scenario maintains subthreshold homeostasis without a single false positive spike!

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause simulation |
| `←` / `→` | Step backward / forward (Scrub time) |
| `Home` | Reset simulation to $t = 0$ |
| `M` | Toggle Synaptic Memory (ON / OFF) |
| `C` | Toggle Comparison Modal |
| `A` | Run Attack / Play |
| `S` | Mute / Unmute Sonification Audio |
| `F` | Toggle Fullscreen Mode |

---

## 🔬 Directory Structure

```
breach-rewind/
├── client/                     # Frontend Vite + React + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── components/         # High-impact seminar UI components
│   │   │   ├── TitleScreen.tsx        # Cinematic title with canvas neural lines
│   │   │   ├── PresenterToolbar.tsx   # All presentation controls & shortcuts
│   │   │   ├── TimelineScrubWheel.tsx # Scrub wheel, zoom, speed controls
│   │   │   ├── BaselinePanel.tsx      # Stateless SIEM counter-model
│   │   │   ├── SNNPanel.tsx           # Neuromorphic SNN real-time status
│   │   │   ├── StateInspector.tsx     # Deterministic event explanation engine
│   │   │   ├── CompareModal.tsx       # 3-way ablation comparison modal
│   │   │   ├── AudienceOverlay.tsx    # Live QR code & vote tallies
│   │   │   └── SummaryPanel.tsx       # Post-trace telemetry summary
│   │   ├── visualizations/     # Canvas & SVG hardware-accelerated graphics
│   │   │   ├── MembraneOscilloscope.tsx # High-res multi-neuron voltage wave
│   │   │   ├── SpikeRaster.tsx        # Multi-channel spike raster plot
│   │   │   └── EventFlowTunnel.tsx    # 3D perspective cyber event tunnel
│   │   ├── simulation/         # Scientific computing core
│   │   │   ├── LIFSimulator.ts        # Pure, deterministic LIF engine
│   │   │   ├── scenarios.ts           # Pre-configured threat & benign scenarios
│   │   │   └── __tests__/             # Comprehensive Vitest simulation test suite
│   │   ├── hooks/
│   │   │   ├── useSimulation.ts       # State manager for simulation & scrubbing
│   │   │   └── useAudio.ts            # Web Audio API procedural sonification
│   │   ├── App.tsx                    # Presenter root & /join mobile route
│   │   └── index.css                  # Custom cyber typography & glow effects
│   ├── vite.config.ts
│   └── package.json
├── server/                     # Backend Express + Socket.IO server
│   ├── src/
│   │   └── index.ts            # Rooms, audience voting, anti-abuse throttling
│   ├── tsconfig.json
│   └── package.json
├── shared/                     # Shared TypeScript interfaces & types
│   └── types/index.ts
├── .env.example
├── package.json                # Root scripts (concurrently dev & install)
└── README.md
```

---

## 🏆 Research Presentation Highlights

1. **Deterministic Reproducibility**: Because the LIF simulator is purely analytical and time-indexed, scrubbing back and forth produces bit-exact identical membrane potentials.
2. **Fail-Safe Offline Mode**: The system functions completely standalone without internet access or even the backend server running (built-in vote simulation and mock WebSocket fail-over).
3. **Multi-Sensory Feedback**: Web Audio API synthesizes acoustic pulses for incoming events and high-frequency auditory pings when threshold action potentials fire.
4. **Academic Transparency**: Clear disclaimers signify that all event telemetry and traces are synthetic demonstrations of neuromorphic computing applied to cybersecurity.
