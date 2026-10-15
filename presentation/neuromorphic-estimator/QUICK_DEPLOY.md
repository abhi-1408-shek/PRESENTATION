# 🚀 Quick Deployment Steps

## Method 1: Render (Easiest - Free, 5 minutes)

### 1. Push to GitHub
```bash
cd neuromorphic-estimator
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

Then create a repo on GitHub and:
```bash
git remote add origin https://github.com/YOUR_USERNAME/neuromorphic-estimator.git
git push -u origin main
```

### 2. Deploy to Render
1. Go to **https://render.com** and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** and select your repo
4. Fill in:
   - **Name**: `neuromorphic-demo`
   - **Region**: Choose your region
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
5. Click **"Create Web Service"**

### 3. Set Environment Variables
After it starts deploying:
1. Click on your service → **"Environment"** tab
2. Add these:
   - `PORT` = `5055`
   - `HOST` = `0.0.0.0`
   - `ADMIN_TOKEN` = `your-secret-password` (make it something memorable but secure!)
3. Click **"Save Changes"**

### 4. Wait & Test
- Wait 2-5 minutes for deployment
- Render will give you a URL like: `https://neuromorphic-demo.onrender.com`
- Test it: `https://neuromorphic-demo.onrender.com/admin`

### 5. Generate QR Code
1. Go to **https://www.qr-code-generator.com/**
2. Enter your URL (the audience page, not /admin)
3. Download the QR code
4. Add to your slides

---

## Method 2: Railway (Alternative - Free Trial)

Same steps as above, but:
1. Go to **https://railway.app**
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repo (Railway auto-detects Python)
4. Add environment variables in the "Variables" tab
5. Get your URL like: `https://your-app.up.railway.app`

---

## 📱 Mobile Testing

After deployment, test on your phone:
1. Open the URL on your phone's browser
2. Check that the layout looks good
3. Try typing in the input field
4. Verify charts render correctly

The site is fully responsive and optimized for mobile!

---

## 🔐 Security Tips

- **Change the admin token** to something unique before deployment
- Don't share the admin token with the audience
- The admin token protects training and reset; it does not bypass audience verification
- For seminars, a simple token like `seminar2024` is fine
- For production, use a password manager to generate a strong token

---

## 🎯 Seminar Checklist

Before your seminar:
- [ ] Deploy the app to Render/Railway
- [ ] Set the admin token
- [ ] Test the admin panel (/admin)
- [ ] Train the profile (type phrase 3 times)
- [ ] Test the audience page from your phone
- [ ] Generate QR code
- [ ] Add QR code to slides
- [ ] Create PostgreSQL and configure `DATABASE_URL` and `IP_HMAC_KEY`

During seminar:
- [ ] Show QR code on slide
- [ ] Have audience scan and try
- [ ] Demonstrate LIF neuron visualization
- [ ] Show different-network denial and same-network behavioral verification

---

## 💡 Pro Tips

1. **Test everything before the seminar** - don't rely on it working during the actual presentation
2. **Keep the admin panel open** on your laptop during the seminar
3. **Have a backup plan** - screenshot the audience page in case the site goes down
4. **Explain the IP tracking** - it's a great teaching moment about multi-factor auth
5. **Show the LIF visualization** - the membrane potential graph is very visual and engaging

---

## ❓ Troubleshooting

**Deployment fails:**
- Check the logs in Render/Railway dashboard
- Make sure all files are committed to GitHub
- Verify the start command is exactly: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`

**Can't access /admin:**
- Verify ADMIN_TOKEN is set in environment variables
- Make sure you're using the correct URL (add /admin at the end)

**QR code doesn't work:**
- Make sure you're using the correct URL (not /admin)
- Test the URL in your browser first
- Use a different QR code generator if needed

**Mobile looks bad:**
- Clear your browser cache
- Try a different browser (Chrome, Safari)
- The site is fully responsive - if it looks wrong, check the URL is correct

---

## 📞 Need Help?

If you run into issues:
1. Check the logs in your deployment platform
2. Review the DEPLOYMENT_GUIDE.md for detailed steps
3. Make sure all dependencies are in requirements.txt
4. Verify environment variables are set correctly
