// ============================================================
// BREACH//REWIND — Express + Socket.IO Server
// ============================================================

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001', 10);
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || `http://localhost:5173`;

const app = express();
const server = createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// ---- In-memory room storage ----

interface RoomData {
  id: string;
  isOpen: boolean;
  createdAt: number;
  participants: Set<string>;
  votes: {
    scenario: Record<string, number>;
    prediction: Record<string, number>;
  };
  voterLog: Map<string, Set<string>>; // socketId -> Set of vote types cast
}

const rooms = new Map<string, RoomData>();

// ---- REST API ----

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, uptime: process.uptime() });
});

app.get('/api/room/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    roomId: room.id,
    isOpen: room.isOpen,
    participants: room.participants.size,
    votes: room.votes,
  });
});

// ---- Socket.IO ----

const VALID_SCENARIO_VOTES = ['slow_apt', 'burst_attack', 'benign_traffic'];
const VALID_PREDICTION_VOTES = ['no_spike', 'spike_soon', 'insufficient_evidence'];

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Create room
  socket.on('room:create', (callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: RoomData = {
      id: roomId,
      isOpen: true,
      createdAt: Date.now(),
      participants: new Set(),
      votes: {
        scenario: { slow_apt: 0, burst_attack: 0, benign_traffic: 0 },
        prediction: { no_spike: 0, spike_soon: 0, insufficient_evidence: 0 },
      },
      voterLog: new Map(),
    };
    rooms.set(roomId, room);
    socket.join(`room:${roomId}`);
    console.log(`[Room] Created: ${roomId}`);

    const joinUrl = `${PUBLIC_APP_URL}/join/${roomId}`;
    if (typeof callback === 'function') {
      callback({ roomId, joinUrl });
    }
    socket.emit('room:created', { roomId, joinUrl });
  });

  // Join room
  socket.on('room:join', (data, callback) => {
    const { roomId } = data || {};
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('room:error', { message: 'Room not found' });
      if (typeof callback === 'function') callback({ error: 'Room not found' });
      return;
    }
    if (!room.isOpen) {
      socket.emit('room:error', { message: 'Room is closed' });
      if (typeof callback === 'function') callback({ error: 'Room is closed' });
      return;
    }

    room.participants.add(socket.id);
    room.voterLog.set(socket.id, new Set());
    socket.join(`room:${roomId}`);

    console.log(`[Room] ${socket.id} joined ${roomId} (${room.participants.size} participants)`);

    io.to(`room:${roomId}`).emit('room:participants', {
      count: room.participants.size,
    });

    if (typeof callback === 'function') {
      callback({ joined: true, roomId });
    }
    socket.emit('room:joined', { roomId });
  });

  // Cast vote
  socket.on('room:vote', (data) => {
    const { roomId, type, value } = data || {};
    const room = rooms.get(roomId);

    if (!room || !room.isOpen) {
      socket.emit('room:error', { message: 'Room not found or closed' });
      return;
    }

    // Validate vote type and value
    if (type === 'scenario' && !VALID_SCENARIO_VOTES.includes(value)) {
      socket.emit('room:error', { message: 'Invalid scenario vote' });
      return;
    }
    if (type === 'prediction' && !VALID_PREDICTION_VOTES.includes(value)) {
      socket.emit('room:error', { message: 'Invalid prediction vote' });
      return;
    }
    if (type !== 'scenario' && type !== 'prediction') {
      socket.emit('room:error', { message: 'Invalid vote type' });
      return;
    }

    // Rate limit: one vote per type per socket
    const voterHistory = room.voterLog.get(socket.id);
    if (voterHistory && voterHistory.has(type)) {
      socket.emit('room:error', { message: 'Already voted for this category' });
      return;
    }
    if (voterHistory) {
      voterHistory.add(type);
    }

    // Record vote
    if (room.votes[type as 'scenario' | 'prediction'][value] !== undefined) {
      room.votes[type as 'scenario' | 'prediction'][value]++;
    }

    console.log(`[Vote] ${socket.id} in ${roomId}: ${type}=${value}`);

    // Broadcast updated votes
    io.to(`room:${roomId}`).emit('room:vote_update', {
      votes: room.votes,
      totalParticipants: room.participants.size,
    });
  });

  // Close room
  socket.on('room:close', (data) => {
    const { roomId } = data || {};
    const room = rooms.get(roomId);
    if (room) {
      room.isOpen = false;
      io.to(`room:${roomId}`).emit('room:closed', { roomId });
      console.log(`[Room] Closed: ${roomId}`);
    }
  });

  // Simulate votes (presenter-only testing)
  socket.on('room:simulate', (data) => {
    const { roomId } = data || {};
    const room = rooms.get(roomId);
    if (!room || !room.isOpen) return;

    // Add random simulated votes
    const scenarioKeys = VALID_SCENARIO_VOTES;
    const predictionKeys = VALID_PREDICTION_VOTES;

    for (const key of scenarioKeys) {
      room.votes.scenario[key] += Math.floor(Math.random() * 4);
    }
    for (const key of predictionKeys) {
      room.votes.prediction[key] += Math.floor(Math.random() * 3);
    }

    room.participants.add(`sim_${Date.now()}`);

    io.to(`room:${roomId}`).emit('room:vote_update', {
      votes: room.votes,
      totalParticipants: room.participants.size,
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    // Remove from all rooms
    for (const [, room] of rooms) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        room.voterLog.delete(socket.id);
        io.to(`room:${room.id}`).emit('room:participants', {
          count: room.participants.size,
        });
      }
    }
  });
});

// Cleanup stale rooms every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > 60 * 60 * 1000) {
      rooms.delete(id);
      console.log(`[Room] Cleaned up stale room: ${id}`);
    }
  }
}, 30 * 60 * 1000);

// ---- Start server ----

server.listen(PORT, () => {
  console.log(`\n  ⚡ BREACH//REWIND Server`);
  console.log(`  ├─ HTTP:      http://localhost:${PORT}`);
  console.log(`  ├─ Socket.IO: ws://localhost:${PORT}`);
  console.log(`  ├─ Health:    http://localhost:${PORT}/api/health`);
  console.log(`  └─ Public URL: ${PUBLIC_APP_URL}\n`);
});
