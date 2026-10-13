"""
Neuromorphic Security Estimator
--------------------------------
Live-seminar backend: keystroke-dynamics profiling with IsolationForest,
then authenticates via a discretized Leaky Integrate-and-Fire (LIF) neuron.

LIF update:  V[t] = β · V[t-1] + I[t]
  • Matching rhythm  → I(t) ≈ 0 → V stays near V_rest = 0
  • Anomalous rhythm → I(t) spikes → V climbs toward V_th
"""

from __future__ import annotations

import os
import socket
import threading
import time
import uuid
from collections import deque
from typing import Any
from urllib.parse import urlparse

import numpy as np
from flask import Flask, jsonify, render_template, request
from sklearn.ensemble import IsolationForest

# Load environment variables from .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not available, read .env manually
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    except FileNotFoundError:
        pass

app = Flask(__name__)
STATE_LOCK = threading.Lock()
PORT = int(os.environ.get("PORT", "5055"))
HOST = os.environ.get("HOST", "0.0.0.0")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "admin123")  # Change this for production!

# ---------------------------------------------------------------------------
# LIF / policy constants
# ---------------------------------------------------------------------------
V_REST = 0.0
V_TH = 1.0
V_RESET = 0.0
BETA = 0.82  # leak / decay factor
I_GAIN = 0.10  # IsolationForest tail → synaptic current
I_TIMING_GAIN = 0.18  # dwell/flight z-deviation → current
I_MAX = 0.36  # per-step cap so V climbs over several anomalous keystrokes
Z_OFFSET = 2.8  # ignore IsolationForest inlier noise
TIMING_OFFSET = 2.2  # typical enrolled jitter stays subthreshold
DWELL_STD_FLOOR = 20.0  # ms — human typing is noisier than 3 short samples
FLIGHT_STD_FLOOR = 24.0
WARNING_FRACTION = 0.5  # amber policy at 50% of V_th
MIN_DWELLS = 8
MIN_FLIGHTS = 7
REQUIRED_TRAIN_SAMPLES = 3
TARGET_PHRASE = "the quick brown fox jumps over the lazy dog"
SKIP_KEYS = {
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "CapsLock",
    "Tab",
    "Escape",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
}

# In-memory enrolment state (single-demo process)
_profile: dict[str, Any] = {
    "samples": [],  # list of 2-D feature arrays
    "model": None,
    "score_mu": 0.0,
    "score_sigma": 1.0,
    "feat_mean": None,
    "feat_std": None,
    "admin_ip": None,  # IP address of admin during training
}
_attempts: deque[dict[str, Any]] = deque(maxlen=80)
_public_base = (os.environ.get("PUBLIC_BASE_URL") or "").rstrip("/")


def reset_profile() -> None:
    _profile["samples"] = []
    _profile["model"] = None
    _profile["score_mu"] = 0.0
    _profile["score_sigma"] = 1.0
    _profile["feat_mean"] = None
    _profile["feat_std"] = None
    _profile["admin_ip"] = None
    _attempts.clear()


def lan_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


def _normalize_base(url: str) -> str:
    raw = (url or "").strip().rstrip("/")
    if not raw:
        return ""
    if not raw.startswith(("http://", "https://")):
        raw = "https://" + raw
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}"


def public_origin() -> str:
    if _public_base:
        return _public_base
    return f"http://{lan_ip()}:{PORT}"


def join_url() -> str:
    return f"{public_origin()}/join"


def template_ctx(role: str) -> dict[str, Any]:
    return {
        "target_phrase": TARGET_PHRASE,
        "required_samples": REQUIRED_TRAIN_SAMPLES,
        "v_th": V_TH,
        "beta": BETA,
        "role": role,
        "join_url": join_url(),
        "lan_ip": lan_ip(),
        "port": PORT,
        "public_base": _public_base,
    }


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------
def _sanitize_events(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    events: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        key = item.get("key")
        typ = item.get("type")
        time = item.get("time")
        if key is None or typ not in ("down", "up"):
            continue
        try:
            t = float(time)
        except (TypeError, ValueError):
            continue
        if not np.isfinite(t):
            continue
        events.append({"key": str(key), "type": typ, "time": t})
    events.sort(key=lambda e: e["time"])
    return events


def extract_dwell_flight(events: list[dict[str, Any]]) -> tuple[np.ndarray, np.ndarray]:
    """Pair keydown→keyup (dwell) and keyup→next keydown (flight)."""
    pending: dict[str, float] = {}
    dwells: list[float] = []
    flights: list[float] = []
    last_up: float | None = None

    for ev in events:
        key = ev["key"]
        if key in SKIP_KEYS:
            continue
        t = ev["time"]
        if ev["type"] == "down":
            pending[key] = t
            if last_up is not None:
                gap = t - last_up
                if 0.0 < gap < 5000.0:
                    flights.append(gap)
        elif ev["type"] == "up":
            down_t = pending.pop(key, None)
            if down_t is None:
                continue
            dwell = t - down_t
            if 0.0 < dwell < 2000.0:
                dwells.append(dwell)
                last_up = t

    return np.asarray(dwells, dtype=float), np.asarray(flights, dtype=float)


def build_transition_matrix(dwells: np.ndarray, flights: np.ndarray) -> np.ndarray:
    """One [dwell_ms, flight_ms] row per keystroke transition."""
    n = min(len(dwells), len(flights))
    if n == 0:
        extra = max(0, len(dwells) - 1)
        if extra <= 0:
            return np.empty((0, 2), dtype=float)
        n = extra
        paired_flight = np.full(n, float(np.median(dwells)))
        return np.column_stack((dwells[:n], paired_flight))
    return np.column_stack((dwells[:n], flights[:n]))


def aggregate_vector(dwells: np.ndarray, flights: np.ndarray) -> np.ndarray:
    def stats(arr: np.ndarray) -> list[float]:
        if arr.size == 0:
            return [0.0, 0.0, 0.0]
        return [float(np.mean(arr)), float(np.std(arr)), float(np.median(arr))]

    return np.asarray(stats(dwells) + stats(flights), dtype=float)


def validate_sample(dwells: np.ndarray, flights: np.ndarray) -> str | None:
    if dwells.size < MIN_DWELLS:
        return (
            f"Insufficient dwell samples ({dwells.size}). "
            f"Type the full phrase without pausing too long."
        )
    if flights.size < MIN_FLIGHTS:
        return (
            f"Insufficient flight samples ({flights.size}). "
            f"Type the full phrase in a single continuous rhythm."
        )
    return None


# ---------------------------------------------------------------------------
# IsolationForest enrolment
# ---------------------------------------------------------------------------
def fit_profile(admin_ip: str | None = None) -> dict[str, Any]:
    if len(_profile["samples"]) < REQUIRED_TRAIN_SAMPLES:
        raise RuntimeError("Not enough training samples")

    stacked = np.vstack(_profile["samples"])
    n_samples = stacked.shape[0]
    n_estimators = int(min(200, max(40, n_samples)))
    model = IsolationForest(
        n_estimators=n_estimators,
        contamination="auto",
        random_state=7,
        max_samples=min(256, n_samples),
        bootstrap=False,
        n_jobs=1,
    )
    model.fit(stacked)
    raw = -model.score_samples(stacked)
    mu = float(np.mean(raw))
    sigma = float(np.std(raw))
    if sigma < 1e-6:
        sigma = 1e-3

    feat_mean = stacked.mean(axis=0)
    feat_std = stacked.std(axis=0)
    feat_std = np.maximum(feat_std, np.array([DWELL_STD_FLOOR, FLIGHT_STD_FLOOR]))

    _profile["model"] = model
    _profile["score_mu"] = mu
    _profile["score_sigma"] = sigma
    _profile["feat_mean"] = feat_mean
    _profile["feat_std"] = feat_std
    _profile["admin_ip"] = admin_ip

    return {
        "n_feature_rows": int(n_samples),
        "score_mu": mu,
        "score_sigma": sigma,
        "admin_ip": admin_ip,
    }
    return {
        "n_feature_rows": int(n_samples),
        "score_mu": mu,
        "score_sigma": sigma,
    }


def anomaly_currents(features: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Map IsolationForest + timing z-scores → non-negative synaptic currents I(t)."""
    model = _profile["model"]
    if model is None or features.size == 0:
        return np.zeros(0), np.zeros(0)

    raw = -model.score_samples(features)
    z_if = (raw - _profile["score_mu"]) / _profile["score_sigma"]
    i_if = np.clip(z_if - Z_OFFSET, 0.0, None) * I_GAIN

    feat_mean = _profile["feat_mean"]
    feat_std = _profile["feat_std"]
    if feat_mean is None or feat_std is None:
        i_time = np.zeros(len(features))
        z_time = np.zeros(len(features))
    else:
        z_feat = np.abs((features - feat_mean) / feat_std)
        z_time = np.sqrt(np.mean(np.square(z_feat), axis=1))
        i_time = np.clip(z_time - TIMING_OFFSET, 0.0, None) * I_TIMING_GAIN

    currents = np.clip(i_if + i_time, 0.0, I_MAX)
    z = np.maximum(z_if - Z_OFFSET, z_time - TIMING_OFFSET)
    return currents.astype(float), z.astype(float)


# ---------------------------------------------------------------------------
# LIF neuron
# ---------------------------------------------------------------------------
def simulate_lif(currents: np.ndarray) -> dict[str, Any]:
    """
    Discretized LIF: V[t] = β · V[t-1] + I[t], V_rest = 0.
    Spike + hard reset when V crosses V_th.
    """
    v = V_REST
    voltages: list[float] = []
    spikes: list[bool] = []
    injected: list[float] = []

    for i_t in currents:
        i_t = float(max(0.0, i_t))
        v = BETA * v + i_t
        spiked = v >= V_TH
        voltages.append(float(v))
        spikes.append(bool(spiked))
        injected.append(i_t)
        if spiked:
            v = V_RESET

    peak = float(max(voltages)) if voltages else 0.0
    spike_count = int(sum(spikes))
    if spike_count > 0 or peak >= V_TH:
        status = "blocked"
    elif peak >= WARNING_FRACTION * V_TH:
        status = "warning"
    else:
        status = "success"

    active = int(np.sum(np.asarray(injected) > 1e-6))
    total = max(1, len(injected))
    sparsity = max(0.0, min(99.9, 100.0 * (1.0 - active / total)))

    return {
        "voltages": voltages,
        "spikes": spikes,
        "currents": injected,
        "peak": peak,
        "spike_count": spike_count,
        "status": status,
        "v_th": V_TH,
        "v_rest": V_REST,
        "beta": BETA,
        "warning_threshold": WARNING_FRACTION * V_TH,
        "sparsity": round(sparsity, 1),
        "active_spikes": active,
    }


def input_spike_series(dwells: np.ndarray, flights: np.ndarray) -> list[dict[str, float]]:
    n = min(len(dwells), len(flights))
    series = []
    for i in range(n):
        # Amplitude is a compact encoding of the transition energy
        amp = float(np.clip((dwells[i] + flights[i]) / 180.0, 0.05, 2.5))
        series.append(
            {
                "index": i,
                "amplitude": amp,
                "dwell": float(dwells[i]),
                "flight": float(flights[i]),
            }
        )
    return series


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template(
        "index.html",
        target_phrase=TARGET_PHRASE,
        required_samples=REQUIRED_TRAIN_SAMPLES,
        v_th=V_TH,
        beta=BETA,
    )


@app.route("/admin")
def admin():
    return render_template(
        "admin.html",
        target_phrase=TARGET_PHRASE,
        required_samples=REQUIRED_TRAIN_SAMPLES,
        v_th=V_TH,
        beta=BETA,
        admin_token=ADMIN_TOKEN,
    )


@app.route("/reset", methods=["POST"])
def reset():
    reset_profile()
    return jsonify({"ok": True, "trained": 0, "required": REQUIRED_TRAIN_SAMPLES})


@app.route("/status", methods=["GET"])
def status():
    return jsonify(
        {
            "trained": len(_profile["samples"]),
            "required": REQUIRED_TRAIN_SAMPLES,
            "ready": _profile["model"] is not None,
            "target_phrase": TARGET_PHRASE,
            "admin_ip": _profile["admin_ip"],
        }
    )


@app.route("/process_typing", methods=["POST"])
def process_typing():
    payload = request.get_json(silent=True) or {}
    mode = str(payload.get("mode", "")).strip().lower()
    events = _sanitize_events(payload.get("keystrokes") or payload.get("events"))
    typed = str(payload.get("text", "")).rstrip("\n")
    admin_token = str(payload.get("admin_token", "")).strip()

    # Get client IP (handle proxies)
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    if mode not in ("train", "verify"):
        return jsonify({"ok": False, "error": "mode must be 'train' or 'verify'."}), 400
    if not events:
        return jsonify({"ok": False, "error": "No keystroke events received."}), 400

    # Training requires admin token
    if mode == "train" and admin_token != ADMIN_TOKEN:
        return jsonify({"ok": False, "error": "Invalid admin token. Training requires admin authorization."}), 403

    dwells, flights = extract_dwell_flight(events)
    err = validate_sample(dwells, flights)
    if err:
        return jsonify({"ok": False, "error": err}), 400

    features = build_transition_matrix(dwells, flights)
    if features.shape[0] < MIN_FLIGHTS:
        return jsonify(
            {
                "ok": False,
                "error": "Could not pair enough keystroke transitions. Type the full phrase.",
            }
        ), 400

    phrase_ok = typed.strip().lower() == TARGET_PHRASE
    aggregates = aggregate_vector(dwells, flights)
    spikes_in = input_spike_series(dwells, flights)

    if mode == "train":
        if _profile["model"] is not None:
            return jsonify(
                {
                    "ok": False,
                    "error": "Baseline already locked. Reset the estimator to re-enrol.",
                }
            ), 409
        if not phrase_ok:
            return jsonify(
                {
                    "ok": False,
                    "error": "Training requires the exact target phrase.",
                    "target": TARGET_PHRASE,
                }
            ), 400

        _profile["samples"].append(features)
        trained = len(_profile["samples"])
        ready = False
        fit_info: dict[str, Any] = {}
        if trained >= REQUIRED_TRAIN_SAMPLES:
            fit_info = fit_profile(admin_ip=client_ip)
            ready = True

        return jsonify(
            {
                "ok": True,
                "mode": "train",
                "trained": trained,
                "required": REQUIRED_TRAIN_SAMPLES,
                "ready": ready,
                "phrase_ok": phrase_ok,
                "fit": fit_info,
                "features": {
                    "mean_dwell": float(np.mean(dwells)),
                    "mean_flight": float(np.mean(flights)),
                    "n_dwells": int(dwells.size),
                    "n_flights": int(flights.size),
                    "aggregate": aggregates.tolist(),
                },
                "input_spikes": spikes_in,
            }
        )

    # ----- verify -----
    if _profile["model"] is None:
        remaining = REQUIRED_TRAIN_SAMPLES - len(_profile["samples"])
        return jsonify(
            {
                "ok": False,
                "error": (
                    f"Baseline incomplete. Enrol {REQUIRED_TRAIN_SAMPLES} samples first "
                    f"({max(0, remaining)} remaining)."
                ),
                "trained": len(_profile["samples"]),
                "required": REQUIRED_TRAIN_SAMPLES,
            }
        ), 409

    currents, zscores = anomaly_currents(features)
    lif = simulate_lif(currents)

    # IP and token checking
    is_admin = admin_token == ADMIN_TOKEN
    ip_matches = client_ip == _profile["admin_ip"]
    admin_ip_display = _profile["admin_ip"] or "unknown"

    # Final authentication decision:
    # - If admin token is correct: authenticate (but still show LIF analysis)
    # - If IP matches admin AND typing is good: authenticate
    # - Otherwise: rely on LIF status
    final_status = lif["status"]
    auth_reason = "typing_pattern"

    if is_admin:
        final_status = "success"
        auth_reason = "admin_token"
    elif ip_matches and lif["status"] == "success":
        final_status = "success"
        auth_reason = "ip_and_typing"
    elif ip_matches and lif["status"] != "success":
        # Same IP but bad typing - still block, but note it's admin's device
        auth_reason = "ip_match_bad_typing"
        final_status = lif["status"]

    return jsonify(
        {
            "ok": True,
            "mode": "verify",
            "phrase_ok": phrase_ok,
            "status": final_status,
            "is_admin": is_admin,
            "ip_matches": ip_matches,
            "client_ip": client_ip,
            "admin_ip": admin_ip_display,
            "auth_reason": auth_reason,
            "lif_status": lif["status"],  # Original LIF status for display
            "voltages": lif["voltages"],
            "spike_events": lif["spikes"],
            "currents": lif["currents"],
            "zscores": zscores.tolist(),
            "peak": lif["peak"],
            "spike_count": lif["spike_count"],
            "v_th": lif["v_th"],
            "v_rest": lif["v_rest"],
            "beta": lif["beta"],
            "warning_threshold": lif["warning_threshold"],
            "sparsity": lif["sparsity"],
            "active_spikes": lif["active_spikes"],
            "input_spikes": spikes_in,
            "features": {
                "mean_dwell": float(np.mean(dwells)),
                "mean_flight": float(np.mean(flights)),
                "n_dwells": int(dwells.size),
                "n_flights": int(flights.size),
            },
        }
    )


if __name__ == "__main__":
    # 5050 is often taken by other local Flask demos; this app uses 5055.
    app.run(host="127.0.0.1", port=5055, debug=False)
