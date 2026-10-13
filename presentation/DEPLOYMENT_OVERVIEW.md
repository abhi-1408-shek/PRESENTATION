# 🚀 Complete Deployment Guide

This repository contains two neuromorphic cybersecurity projects. Deploy both for your seminar!

---

## 📦 Project 1: Neuromorphic Security Estimator

**Purpose:** Keystroke dynamics authentication demo with IP tracking
**Tech Stack:** Python, Flask, Scikit-learn
**Deployment:** Render (recommended - free tier)

### Deployment Steps

#### 1. Deploy to Render
1. Go to **https://render.com** and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo: `abhi-1408-shek/PRESENTATION`
4. Configure:
   - **Root Directory**: `neuromorphic-estimator`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
5. Click **"Create Web Service"**

#### 2. Set Environment Variables
In Render dashboard → Environment tab:
- `PORT` = `5055`
- `HOST` = `0.0.0.0`
- `ADMIN_TOKEN` = `seminar2024` (or your own secret)

#### 3. Get URL
Render will provide: `https://neuromorphic-estimator.onrender.com`
- Admin: `https://neuromorphic-estimator.onrender.com/admin`
- Audience: `https://neuromorphic-estimator.onrender.com/` ← QR code this

#### 4. Generate QR Code
Go to **https://www.qr-code-generator.com/** and enter the audience URL

---

## 📦 Project 2: BREACH//REWIND

**Purpose:** Temporal forensics and SNN threat detection demo
**Tech Stack:** React, TypeScript, Node.js, Socket.IO
**Deployment:** Vercel (frontend) + Render (backend)

### Deployment Steps

#### Part A: Deploy Backend to Render

1. Go to Render → **"New +"** → **"Web Service"**
2. Connect GitHub repo: `abhi-1408-shek/PRESENTATION`
3. Configure:
   - **Root Directory**: `breach-rewind/server`
   - **Build Command**: `npm install`
   - **Start Command**: `node dist/index.js` (or adjust based on your build)
4. Set environment variables if needed
5. Get backend URL: `https://breach-rewind-backend.onrender.com`

#### Part B: Deploy Frontend to Vercel

1. Go to **https://vercel.com** and sign up (free)
2. Click **"Add New Project"**
3. Import from GitHub: `abhi-1408-shek/PRESENTATION`
4. Configure:
   - **Root Directory**: `breach-rewind/client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable for backend URL:
   - `VITE_BACKEND_URL` = `https://breach-rewind-backend.onrender.com`
6. Click **"Deploy"**
7. Get frontend URL: `https://breach-rewind.vercel.app` ← QR code this

#### Alternative: Deploy Both on Netlify

Netlify can handle both frontend and backend in one go:
1. Go to **https://netlify.com** and sign up
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub repo
4. Configure build settings
5. Add environment variables

---

## 📱 QR Code Setup

You'll need **two QR codes** for your seminar:

### QR Code 1: Security Estimator
- **URL**: `https://neuromorphic-estimator.onrender.com/`
- **Purpose**: Audience tries to authenticate via typing
- **Label**: "Try to Crack the Password!"

### QR Code 2: BREACH//REWIND
- **URL**: `https://breach-rewind.vercel.app/join` (or your deployed URL)
- **Purpose**: Audience votes on threat scenarios
- **Label**: "Vote on the Attack!"

---

## ✅ Deployment Checklist

### Project 1: Security Estimator
- [ ] Deploy to Render
- [ ] Set ADMIN_TOKEN environment variable
- [ ] Test admin panel at `/admin`
- [ ] Train the profile (type phrase 3 times)
- [ ] Test audience page from phone
- [ ] Generate QR code
- [ ] Add QR code to slides

### Project 2: BREACH//REWIND
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Set backend URL environment variable
- [ ] Test presenter dashboard
- [ ] Test audience join page from phone
- [ ] Generate QR code
- [ ] Add QR code to slides

---

## 🎯 Seminar Flow

### Segment 1: Security Estimator (5-10 minutes)
1. Show QR code 1 on slide
2. Explain keystroke dynamics and LIF neuron
3. Train profile on admin panel (private or on screen)
4. Have audience scan and try to authenticate
5. Show how LIF detects anomalies
6. Demonstrate admin override from phone

### Segment 2: BREACH//REWIND (10-15 minutes)
1. Show QR code 2 on slide
2. Explain temporal forensics concept
3. Run the stealthy APT scenario
4. Show how SNN detects what SIEM misses
5. Enable audience voting
6. Have audience vote on next scenario
7. Show comparison between stateless vs stateful detection

---

## 🔧 Troubleshooting

### Security Estimator Issues
- **Can't access /admin**: Check ADMIN_TOKEN is set
- **Deployment fails**: Verify build command and root directory
- **QR code doesn't work**: Test URL in browser first

### BREACH//REWIND Issues
- **Frontend can't connect to backend**: Check VITE_BACKEND_URL
- **Build fails**: Ensure all dependencies are in package.json
- **Audience can't join**: Check Socket.IO configuration

---

## 💡 Pro Tips

1. **Deploy both projects the day before** your seminar
2. **Test everything from your phone** before the presentation
3. **Keep admin panels open** on your laptop during the seminar
4. **Have screenshots ready** as backup in case of connectivity issues
5. **Explain the IP tracking** - it's a great teaching moment
6. **Use the same admin token** for both projects for simplicity

---

## 📞 Need Help?

- **Security Estimator**: See `neuromorphic-estimator/DEPLOYMENT_GUIDE.md`
- **BREACH//REWIND**: See `breach-rewind/README.md`
- **General Issues**: Check logs in Render/Vercel dashboards

---

## 🎉 After Deployment

1. Save both URLs in a safe place
2. Save both QR codes to your presentation folder
3. Test from multiple devices
4. Document your admin tokens
5. Bookmark the admin panels for quick access

Good luck with your seminar! 🚀
