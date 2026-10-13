(() => {
  const cfg = window.NSE_CONFIG || {};
  const TARGET = cfg.targetPhrase || "the quick brown fox jumps over the lazy dog";
  const REQUIRED = cfg.requiredSamples || 3;
  const V_TH = Number(cfg.vTh || 1);
  const IS_ADMIN = Boolean(cfg.isAdmin);
  const FIXED_MODE = cfg.mode || (IS_ADMIN ? "train" : "verify");

  const input = document.getElementById("typing-input");
  const btnSubmit = document.getElementById("btn-submit");
  const btnClear = document.getElementById("btn-clear");
  const btnReset = document.getElementById("btn-reset");
  const hint = document.getElementById("status-hint");
  const meter = document.getElementById("phrase-meter");
  const matchReadout = document.getElementById("match-readout");
  const enrolChip = document.getElementById("enrol-chip");
  const modePill = document.getElementById("mode-pill");
  const policyPanel = document.getElementById("policy-panel");
  const policyCode = document.getElementById("policy-code");
  const policyMsg = document.getElementById("policy-msg");
  const vFill = document.getElementById("v-fill");
  const spikeCountEl = document.getElementById("spike-count");
  const adminTokenInput = document.getElementById("admin-token");

  let events = [];
  let trained = 0;
  let ready = false;
  let frozen = false;
  let animToken = 0;

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 180, easing: "easeOutCubic" },
    plugins: {
      legend: {
        labels: { color: "#8b949e", font: { family: "IBM Plex Mono", size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: "#8b949e", font: { family: "IBM Plex Mono", size: 10 } },
        grid: { color: "rgba(48,54,61,0.6)" },
      },
      y: {
        ticks: { color: "#8b949e", font: { family: "IBM Plex Mono", size: 10 } },
        grid: { color: "rgba(48,54,61,0.6)" },
      },
    },
  };

  const spikeChart = new Chart(document.getElementById("spike-chart"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Transition energy",
          data: [],
          backgroundColor: "rgba(88, 166, 255, 0.55)",
          borderColor: "#58a6ff",
          borderWidth: 1,
          barPercentage: 0.7,
        },
      ],
    },
    options: {
      ...chartDefaults,
      scales: {
        ...chartDefaults.scales,
        y: { ...chartDefaults.scales.y, beginAtZero: true, suggestedMax: 2.2 },
      },
    },
  });

  const membraneChart = new Chart(document.getElementById("membrane-chart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "V(t)",
          data: [],
          borderColor: "#3fb950",
          backgroundColor: "rgba(63, 185, 80, 0.12)",
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: "V_th",
          data: [],
          borderColor: "#ff7b72",
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 1.5,
          fill: false,
        },
        {
          label: "Warning 0.5 V_th",
          data: [],
          borderColor: "#d29922",
          borderDash: [3, 4],
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      ...chartDefaults,
      scales: {
        ...chartDefaults.scales,
        y: { ...chartDefaults.scales.y, min: -0.05, max: V_TH * 1.15 },
      },
    },
  });

  function setHint(text) {
    hint.textContent = text;
  }

  function phraseScore(value) {
    const typed = value;
    let n = 0;
    const limit = Math.min(typed.length, TARGET.length);
    for (let i = 0; i < limit; i += 1) {
      if (typed[i] === TARGET[i]) n += 1;
    }
    return TARGET.length === 0 ? 1 : n / TARGET.length;
  }

  function updatePhraseMeter() {
    const score = phraseScore(input.value);
    const pct = Math.round(score * 100);
    meter.style.width = `${Math.min(100, (input.value.length / TARGET.length) * 100)}%`;
    matchReadout.textContent = `${pct}%`;
  }

  function setModeUI() {
    if (IS_ADMIN) {
      enrolChip.textContent = ready
        ? "BASELINE LOCKED"
        : `ENROL ${trained}/${REQUIRED}`;
      modePill.textContent = "TRAIN";
      btnSubmit.textContent = "Capture Sample";
    } else {
      enrolChip.textContent = ready ? "VERIFY MODE" : "WAITING";
      modePill.textContent = "VERIFY";
      btnSubmit.textContent = "Authenticate";
    }
  }

  function setPolicy(state, message, peak = 0, spikes = 0) {
    policyPanel.dataset.state = state;
    const labels = {
      idle: "IDLE",
      success: "ACCESS GRANTED",
      warning: "DESYNC",
      blocked: "INTRUDER",
    };
    policyCode.textContent = labels[state] || state.toUpperCase();
    policyMsg.textContent = message;
    const pct = Math.max(0, Math.min(100, (peak / V_TH) * 100));
    vFill.style.height = `${pct}%`;
    document.getElementById("peak-v").textContent = peak.toFixed(3);
    document.getElementById("lif-spikes").textContent = String(spikes);
  }

  function liveSpikeFromEvents() {
    const downs = new Map();
    const dwells = [];
    const flights = [];
    let lastUp = null;
    const skip = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"]);

    for (const ev of events) {
      if (skip.has(ev.key)) continue;
      if (ev.type === "down") {
        downs.set(ev.key, ev.time);
        if (lastUp !== null) {
          const gap = ev.time - lastUp;
          if (gap > 0 && gap < 5000) flights.push(gap);
        }
      } else if (ev.type === "up") {
        const downT = downs.get(ev.key);
        if (downT === undefined) continue;
        const dwell = ev.time - downT;
        downs.delete(ev.key);
        if (dwell > 0 && dwell < 2000) {
          dwells.push(dwell);
          lastUp = ev.time;
        }
      }
    }

    const n = Math.min(dwells.length, flights.length);
    const labels = [];
    const data = [];
    for (let i = 0; i < n; i += 1) {
      labels.push(String(i + 1));
      data.push(Math.min(2.5, (dwells[i] + flights[i]) / 180));
    }
    spikeChart.data.labels = labels;
    spikeChart.data.datasets[0].data = data;
    spikeChart.update("none");
    spikeCountEl.textContent = `${n} transitions`;
  }

  function renderSpikes(series) {
    const labels = series.map((s) => String(s.index + 1));
    const data = series.map((s) => s.amplitude);
    spikeChart.data.labels = labels;
    spikeChart.data.datasets[0].data = data;
    spikeChart.update();
    spikeCountEl.textContent = `${series.length} transitions`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function animateMembrane(payload) {
    const token = ++animToken;
    const voltages = payload.voltages || [];
    const spikes = payload.spike_events || [];
    const warn = payload.warning_threshold ?? V_TH * 0.5;
    const labels = voltages.map((_, i) => String(i + 1));

    membraneChart.data.labels = [];
    membraneChart.data.datasets[0].data = [];
    membraneChart.data.datasets[1].data = [];
    membraneChart.data.datasets[2].data = [];
    membraneChart.data.datasets[0].borderColor = "#58a6ff";
    membraneChart.update("none");

    let peak = 0;
    let spikeCount = 0;
    let status = "success";

    for (let i = 0; i < voltages.length; i += 1) {
      if (token !== animToken) return;
      const v = voltages[i];
      peak = Math.max(peak, v);
      if (spikes[i]) spikeCount += 1;

      membraneChart.data.labels.push(labels[i]);
      membraneChart.data.datasets[0].data.push(v);
      membraneChart.data.datasets[1].data.push(V_TH);
      membraneChart.data.datasets[2].data.push(warn);
      membraneChart.update("none");

      if (spikeCount > 0 || v >= V_TH) {
        status = "blocked";
        membraneChart.data.datasets[0].borderColor = "#ff7b72";
        setPolicy(
          "blocked",
          "INTRUDER INTERCEPTED",
          peak,
          spikeCount
        );
        freezeInput(true);
      } else if (v >= warn) {
        status = "warning";
        membraneChart.data.datasets[0].borderColor = "#d29922";
        setPolicy(
          "warning",
          "Rhythm Desynchronization Detected",
          peak,
          spikeCount
        );
      } else {
        membraneChart.data.datasets[0].borderColor = "#3fb950";
        setPolicy("success", "Access Granted — membrane near rest.", peak, spikeCount);
      }

      await sleep(28);
    }

    if (token !== animToken) return;
    const finalStatus = payload.status || status;
    const authReason = payload.auth_reason || "typing_pattern";

    if (finalStatus === "blocked") {
      let msg = "INTRUDER INTERCEPTED";
      if (authReason === "ip_match_bad_typing") {
        msg = "Same device but different typing pattern detected";
      }
      setPolicy("blocked", msg, payload.peak || peak, payload.spike_count || spikeCount);
      freezeInput(true);
    } else if (finalStatus === "warning") {
      setPolicy(
        "warning",
        "Rhythm Desynchronization Detected",
        payload.peak || peak,
        payload.spike_count || spikeCount
      );
    } else {
      let msg = "Access Granted — typing rhythm matches enrolled identity.";
      if (authReason === "admin_token") {
        msg = "Access Granted — authenticated via admin token (typing still analyzed).";
      } else if (authReason === "ip_and_typing") {
        msg = "Access Granted — IP and typing pattern match.";
      }
      setPolicy(
        "success",
        msg,
        payload.peak || peak,
        payload.spike_count || spikeCount
      );
    }

    // Show IP information for admin/demo purposes
    if (payload.client_ip && payload.admin_ip) {
      const clientIpEl = document.getElementById("client-ip");
      const adminIpEl = document.getElementById("admin-ip");
      const ipMatchEl = document.getElementById("ip-match");

      if (clientIpEl) clientIpEl.textContent = payload.client_ip;
      if (adminIpEl) adminIpEl.textContent = payload.admin_ip;
      if (ipMatchEl) {
        ipMatchEl.textContent = payload.ip_matches ? "YES" : "NO";
        ipMatchEl.style.color = payload.ip_matches ? "#3fb950" : "#ff7b72";
      }
    }
  }

  function freezeInput(on) {
    frozen = on;
    input.disabled = on;
  }

  function resetBuffer() {
    events = [];
    input.value = "";
    updatePhraseMeter();
    liveSpikeFromEvents();
  }

  function blockClipboard(e) {
    e.preventDefault();
    setHint("Clipboard injection blocked. Type the phrase by hand.");
  }

  input.addEventListener("paste", blockClipboard);
  input.addEventListener("drop", blockClipboard);
  input.addEventListener("copy", blockClipboard);
  input.addEventListener("cut", blockClipboard);
  input.addEventListener("contextmenu", (e) => e.preventDefault());

  input.addEventListener("keydown", (e) => {
    if (frozen) {
      e.preventDefault();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && ["v", "V", "c", "C", "x", "X"].includes(e.key)) {
      e.preventDefault();
      return;
    }
    events.push({ key: e.key, type: "down", time: performance.now() });
  });

  input.addEventListener("keyup", (e) => {
    if (frozen) return;
    events.push({ key: e.key, type: "up", time: performance.now() });
    liveSpikeFromEvents();
  });

  input.addEventListener("input", updatePhraseMeter);

  btnClear.addEventListener("click", () => {
    if (frozen) {
      setHint("Input is frozen after an intercept. Reset the profile to continue.");
      return;
    }
    resetBuffer();
  });

  if (btnReset) {
    btnReset.addEventListener("click", async () => {
      animToken += 1;
      await fetch("/reset", { method: "POST" });
      trained = 0;
      ready = false;
      freezeInput(false);
      resetBuffer();
      setModeUI();
      setPolicy("idle", "Profile wiped. Enrol three genuine samples.", 0, 0);
      document.getElementById("sparsity").textContent = "92.4%";
      document.getElementById("active-spikes").textContent = "0";
      document.getElementById("event-ops").textContent = "idle";
      membraneChart.data.labels = [];
      membraneChart.data.datasets.forEach((d) => {
        d.data = [];
      });
      membraneChart.update();
      setHint("Estimator reset. Capture three training samples of the target phrase.");
    });
  }

  async function submit() {
    if (frozen) {
      setHint("INTRUDER INTERCEPTED — reset the estimator to resume.");
      return;
    }
    if (events.length < 16) {
      setHint("Too few keystrokes. Type the full target phrase before capturing.");
      return;
    }

    btnSubmit.disabled = true;
    const mode = FIXED_MODE;
    const adminToken = adminTokenInput ? adminTokenInput.value.trim() : "";
    try {
      const res = await fetch("/process_typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          keystrokes: events,
          text: input.value,
          admin_token: adminToken,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setHint(data.error || "Request failed.");
        return;
      }

      if (data.features) {
        document.getElementById("mean-dwell").textContent =
          `${data.features.mean_dwell.toFixed(1)} ms`;
        document.getElementById("mean-flight").textContent =
          `${data.features.mean_flight.toFixed(1)} ms`;
      }
      if (data.input_spikes) renderSpikes(data.input_spikes);

      if (mode === "train") {
        trained = data.trained;
        ready = Boolean(data.ready);
        setModeUI();
        resetBuffer();
        if (ready) {
          setHint("Baseline locked. Audience can now try to authenticate at the main page.");
          setPolicy("idle", "IsolationForest profile ready. Training complete.", 0, 0);

          // Display admin IP if available
          if (data.fit && data.fit.admin_ip) {
            const adminIpEl = document.getElementById("admin-ip");
            if (adminIpEl) {
              adminIpEl.textContent = data.fit.admin_ip;
            }
          }
        } else {
          setHint(`Sample ${trained}/${REQUIRED} stored. Type the phrase again with the same genuine rhythm.`);
        }
      } else {
        const sparsity = data.sparsity ?? 92.4;
        document.getElementById("sparsity").textContent = `${sparsity.toFixed(1)}%`;
        document.getElementById("active-spikes").textContent = String(data.active_spikes ?? 0);
        document.getElementById("event-ops").textContent = `${(data.voltages || []).length} LIF steps`;

        // If admin token was used, show different message
        if (data.is_admin) {
          setHint("Admin override: authenticated via token (typing pattern still analyzed).");
        }

        await animateMembrane(data);
        if (data.status !== "blocked") {
          resetBuffer();
        }
      }
    } catch (err) {
      setHint(`Network error: ${err.message}`);
    } finally {
      btnSubmit.disabled = false;
    }
  }

  btnSubmit.addEventListener("click", submit);

  fetch("/status")
    .then((r) => r.json())
    .then((s) => {
      trained = s.trained || 0;
      ready = Boolean(s.ready);
      setModeUI();

      // Display admin IP
      const adminIpEl = document.getElementById("admin-ip");
      if (adminIpEl) {
        adminIpEl.textContent = s.admin_ip || "Not set";
      }
    })
    .catch(() => setModeUI());

  updatePhraseMeter();
  setPolicy("idle", "Awaiting synaptic current.", 0, 0);
  setModeUI();
})();
