# Quick Deployment Guide for Seminar

## Option 1: Render (Easiest - Free Tier) ✅ RECOMMENDED

### Step 1: Create GitHub Repository
```bash
cd neuromorphic-estimator
git init
git add .
git commit -m "Initial commit of neuromorphic security estimator"
```

Then create a new repository on GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/neuromorphic-estimator.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign up (free tier, no credit card needed)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: neuromorphic-estimator (or any name you want)
   - **Region**: Choose closest to your seminar location
   - **Branch**: main
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
5. Click "Create Web Service"

### Step 3: Set Environment Variables
After deployment starts:
1. Go to your service dashboard on Render
2. Click "Environment" tab
3. Add these variables:
   - `PORT`: `5055`
   - `HOST`: `0.0.0.0`
   - `ADMIN_TOKEN`: `your-secret-token-here` (use a strong random string like `seminar2024secure!`)
4. Click "Save Changes" and "Deploy Changes"

### Step 4: Wait for Deployment
- Render will take 2-5 minutes to build and deploy
- Watch the logs to see when it's live
- You'll get a URL like: `https://neuromorphic-estimator.onrender.com`

### Step 5: Test Your App
- Admin panel: `https://neuromorphic-estimator.onrender.com/admin`
- Audience page: `https://neuromorphic-estimator.onrender.com/`

### Step 6: Generate QR Code
**Option A: Use online generator**
1. Go to [qr-code-generator.com](https://www.qr-code-generator.com/)
2. Enter your audience URL (e.g., `https://neuromorphic-estimator.onrender.com/`)
3. Download the QR code image
4. Add it to your presentation slides

**Option B: Use the provided script**
```bash
pip install qrcode
python generate_qr.py https://neuromorphic-estimator.onrender.com
```
This creates `qr_code.png` that you can add to slides.

## Option 2: Railway (Alternative - Free Trial)

### Step 1: Same as above - create GitHub repo

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign up (free trial)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python and configure most settings

### Step 3: Set Environment Variables
1. Click on your service → "Variables"
2. Add:
   - `PORT`: `5055`
   - `HOST`: `0.0.0.0`
   - `ADMIN_TOKEN`: `your-secret-token`

### Step 4: Deploy
Railway will deploy automatically and give you a URL like `https://your-app.up.railway.app`

## Option 3: PythonAnywhere (Free Tier)

### Step 1: Sign up
1. Go to [pythonanywhere.com](https://pythonanywhere.com)
2. Create a free account (beginner account)

### Step 2: Create Web App
1. Go to "Web" tab → "Add a new web app"
2. Choose "Flask" framework
3. Python version: 3.12+
4. Web app path: `/home/yourusername/neuromorphic-estimator`

### Step 3: Upload Files
1. Use the "Files" tab to upload your project files
2. Or use git: `git clone https://github.com/YOUR_USERNAME/neuromorphic-estimator.git`

### Step 4: Configure WSGI
1. Go to "Web" tab → "WSGI configuration file"
2. Edit to point to your `app.py`

### Step 5: Set Environment Variables
1. Go to "Web" tab → "Variables"
2. Add the same environment variables

### Step 6: Reload
Click "Reload" button to apply changes

## Mobile Optimization

The website is **fully optimized for mobile**:
- Responsive design that adapts to phone screens
- Touch-friendly buttons and inputs
- Optimized charts for small screens
- Works on both iOS and Android

Test it on your phone by accessing the URL from your mobile browser!

## Seminar Checklist

Before your seminar:

- [ ] Deploy the app to cloud (Render or Railway)
- [ ] Set a strong admin token
- [ ] Test the admin panel at `/admin`
- [ ] Train the profile by typing the phrase 3 times
- [ ] Test the audience page from a different device
- [ ] Generate QR code for the audience URL
- [ ] Add QR code to your presentation slides
- [ ] Test admin override by entering the token on audience page

During your seminar:

1. Show the audience the QR code on your slide
2. Explain the concept of neuromorphic authentication
3. Have them scan and try to authenticate
4. Show how the LIF neuron detects anomalies
5. Demonstrate admin override from your phone/laptop

After your seminar:

- You can reset the profile via the admin panel
- Keep the app running for future demos
- Change the admin token if needed

## Troubleshooting

**App won't start on Render:**
- Check the logs in Render dashboard
- Ensure gunicorn is in requirements.txt
- Verify the start command matches exactly

**Can't access /admin:**
- Make sure you're using the correct URL
- Check that ADMIN_TOKEN is set in environment variables

**Audience can't authenticate:**
- Ensure you've trained the profile first on /admin
- Check that the baseline is locked (shows "BASELINE LOCKED")
- Verify the audience is typing the exact target phrase

**Admin override not working:**
- Double-check the admin token matches exactly
- Ensure there are no extra spaces in the token field

## Security Reminder

For your seminar, the default token is fine, but for any real use:
- Change the admin token to a strong random string
- Use a password manager to generate it
- Don't share the token with the audience
