# Presentation Projects

This repository contains two neuromorphic cybersecurity demonstration projects for seminars and presentations.

## 📁 Projects

### 1. Neuromorphic Security Estimator
**Location:** `neuromorphic-estimator/`

A live seminar demonstration of behavioral authentication using keystroke dynamics and a Leaky Integrate-and-Fire (LIF) neuron.

**Features:**
- Admin training panel with IP tracking
- Audience verification via QR code
- Multi-factor authentication (IP + typing behavior + admin token)
- Real-time LIF neuron visualization
- Mobile-optimized responsive design

**Deployment:**
- See `neuromorphic-estimator/QUICK_DEPLOY.md` for quick deployment guide
- See `neuromorphic-estimator/DEPLOYMENT_GUIDE.md` for detailed options

**Quick Start:**
```bash
cd neuromorphic-estimator
python3.12 app.py
```

### 2. BREACH//REWIND — Temporal Forensics Lab
**Location:** `breach-rewind/`

An interactive neuromorphic cybersecurity experience demonstrating Spiking Neural Networks for real-time threat detection.

**Features:**
- Real-time LIF neuron simulation
- Stateless SIEM vs Stateful SNN comparison
- Temporal scrubbing and replay
- Audience participation via QR code
- Audio sonification of neural events

**Quick Start:**
```bash
cd breach-rewind
npm run install:all
npm run dev
```

**Deployment:**
- Deploy frontend to Vercel, Netlify, or similar
- Deploy backend to Render, Railway, or similar
- See `breach-rewind/README.md` for details

## 🚀 Deployment Overview

### Project 1: Neuromorphic Security Estimator
- **Platform:** Render (free tier recommended)
- **URL:** Will be provided after deployment
- **Purpose:** Keystroke dynamics authentication demo
- **QR Code:** Points to audience verification page

### Project 2: BREACH//REWIND
- **Frontend:** Vercel or Netlify (free tier)
- **Backend:** Render or Railway (free tier)
- **Purpose:** Temporal forensics and SNN threat detection demo
- **QR Code:** Points to audience voting page

## 📱 Mobile Optimization

Both projects are fully optimized for mobile devices:
- Responsive design
- Touch-friendly interfaces
- Optimized for iOS and Android
- QR code access for audience participation

## 🔐 Security Notes

- Both projects use admin tokens for authentication
- IP tracking is implemented in the Security Estimator
- Environment variables should be set securely in production
- Never commit `.env` files to the repository

## 📞 Support

For deployment issues, see the individual project READMEs:
- `neuromorphic-estimator/DEPLOYMENT_GUIDE.md`
- `breach-rewind/README.md`
