// ============================================================
// BREACH//REWIND — Shared Type Definitions
// ============================================================
export const DEFAULT_LIF_PARAMS = {
    V_rest: -70.0,
    V_thresh: -50.0,
    V_reset: -70.0,
    tau_m: 8.0,
    dt: 0.05,
    R: 10.0,
    numNeurons: 5,
};
// --- Socket Events ---
export var SocketEvents;
(function (SocketEvents) {
    // Client -> Server
    SocketEvents["CREATE_ROOM"] = "room:create";
    SocketEvents["JOIN_ROOM"] = "room:join";
    SocketEvents["CAST_VOTE"] = "room:vote";
    SocketEvents["CLOSE_ROOM"] = "room:close";
    SocketEvents["SIMULATE_VOTES"] = "room:simulate";
    // Server -> Client
    SocketEvents["ROOM_CREATED"] = "room:created";
    SocketEvents["ROOM_JOINED"] = "room:joined";
    SocketEvents["ROOM_CLOSED"] = "room:closed";
    SocketEvents["VOTE_UPDATE"] = "room:vote_update";
    SocketEvents["PARTICIPANT_COUNT"] = "room:participants";
    SocketEvents["ERROR"] = "room:error";
})(SocketEvents || (SocketEvents = {}));
// --- Neuron Channel Names ---
export const NEURON_LABELS = [
    'Auth Anomaly',
    'Recon Activity',
    'Lateral Movement',
    'Data Exfiltration',
    'Threat Integrator',
];
export const NEURON_COLORS = [
    '#00F2FE', // cyan
    '#F59E0B', // amber
    '#9D4EDD', // purple
    '#FF2A6D', // crimson
    '#10B981', // emerald
];
