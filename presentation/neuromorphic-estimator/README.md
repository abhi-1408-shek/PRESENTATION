# Neuromorphic Security Estimator

A live seminar demonstration of behavioral authentication using keystroke dynamics and a Leaky Integrate-and-Fire (LIF) neuron.

## Features

- **Admin Training Panel** (`/admin`): Only the admin can train the admin profile
- **Audience Verification** (`/`): Audience attempts to authenticate against the trained profile
- **Protected Admin Training**: Admin token is required only to train or reset the profile
- **Network + Behavior Verification**: Audience access requires the enrolled network and typing behavior
- **Persistent Profile**: PostgreSQL stores the enrolled profile for immediate shared access
- **Neuromorphic LIF Neuron**: Real-time visualization of membrane potential and spike events
- **IsolationForest**: Anomaly detection for keystroke dynamics
- **Mobile Optimized**: Fully responsive design for phones and tablets

## Quick Start for Seminar

**Recommended: Deploy directly to cloud (no local setup needed)**

1. Push this code to GitHub
2. Deploy to Render or Railway (see DEPLOYMENT_GUIDE.md)
3. Set your admin token in environment variables
4. Access the admin panel to train the profile
5. Generate a QR code for the audience URL
6. Present! - audience scans QR with their phones to participate

## How It Works

1. **Admin Training**: The presenter accesses `/admin` and types the target phrase 3 times to build a behavioral profile. The admin's IP address is locked during this phase.
2. **Audience Challenge**: Audience scans a QR code to access the main page and tries to match the typing pattern
3. **Multi-factor Authentication**:
   - **IP Check**: Requires the enrolled network address
   - **Behavioral Check**: The LIF neuron analyzes typing rhythm
   - **Admin Token**: Protects training and profile reset only
4. **Security Logic**:
   - If IP matches AND typing is good → Authenticate
   - If IP matches but typing is bad → Block
   - If IP does not match → Block
5. **Admin Test**: The presenter may use the audience page, but must pass the same IP and behavior checks.

## Quick Start for Seminar

**Recommended: Deploy directly to cloud (no local setup needed)**

1. Push this code to GitHub
2. Deploy to Render or Railway (see Deployment section below)
3. Set your admin token in environment variables
4. Access the admin panel to train the profile
5. Generate a QR code for the audience URL
6. Present!

## Local Development

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and set your ADMIN_TOKEN
```

4. Run the application:
```bash
python app.py
```

5. Access the application:
- Admin panel: http://127.0.0.1:5055/admin
- Audience page: http://127.0.0.1:5055/

### Optional: Generate QR Code

**Easiest method - use online generator:**
1. Go to [qr-code-generator.com](https://www.qr-code-generator.com/)
2. Enter your deployed URL (e.g., `https://your-app.onrender.com/`)
3. Download the QR code image
4. Add it to your presentation slides

**Or use the provided script:**
```bash
pip install qrcode
python generate_qr.py https://your-deployed-url.com
```
This creates `qr_code.png` that you can add to slides.

## Deployment on Free Cloud Platforms

### Option 1: Render (Recommended)

1. **Create a GitHub repository** and push your code

2. **Sign up at [render.com](https://render.com)** (free tier available)

3. **Create a new Web Service**:
   - Connect your GitHub repository
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
   - Python version: 3.12+

4. **Add Environment Variables** in Render dashboard:
   - `PORT`: 5055 (or let Render auto-assign)
   - `HOST`: 0.0.0.0
   - `ADMIN_TOKEN`: Your secret token (use a strong random string!)
   - `DATABASE_URL`: Internal URL of your Render PostgreSQL database
   - `IP_HMAC_KEY`: A separate long random secret

5. **Deploy**: Render will automatically deploy on push

6. **Get your URL**: Render will provide a URL like `https://your-app.onrender.com`

### Option 2: Railway

1. **Create a GitHub repository** and push your code

2. **Sign up at [railway.app](https://railway.app)** (free trial available)

3. **Deploy from GitHub**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Python

4. **Add Environment Variables**:
   - `PORT`: 5055
   - `HOST`: 0.0.0.0
   - `ADMIN_TOKEN`: Your secret token

5. **Deploy**: Railway will provide a URL like `https://your-app.up.railway.app`

### Option 3: PythonAnywhere

1. **Sign up at [pythonanywhere.com](https://pythonanywhere.com)** (free tier available)

2. **Create a Web App**:
   - Choose "Flask" as the framework
   - Python version: 3.12+

3. **Upload your code**:
   - Use the web console or git to upload files

4. **Configure WSGI**:
   - Edit the WSGI configuration file to point to `app.py`

5. **Set environment variables** in the "Web" tab

## Seminar Presentation Flow

1. **Before the seminar**:
   - Deploy the app to a cloud platform
   - Set a strong admin token
   - Test the admin training panel

2. **During the seminar**:
   - Show the audience the main page (QR code)
   - Explain the neuromorphic authentication concept
   - Train the profile on the admin panel (do this privately or on screen)
   - Ask audience to try to authenticate
   - Demonstrate how the LIF neuron detects anomalies
   - Test the audience page from the enrolled network and a different network

3. **After the seminar**:
   - You can reset the profile via the admin panel
   - Keep the app running for further demos

## Security Notes

- **Change the admin token** before production deployment
- Create the Render PostgreSQL database described in `PERSISTENCE_SETUP.md`
- For production, consider:
  - Persistent database for profiles
  - Rate limiting
  - HTTPS only
  - Multiple user support

## Target Phrase

The default target phrase is:
```
the quick brown fox jumps over the lazy dog
```

You can modify this in `app.py` by changing the `TARGET_PHRASE` constant.

## LIF Neuron Parameters

- **V_rest**: 0.0 (resting potential)
- **V_th**: 1.0 (threshold potential)
- **V_reset**: 0.0 (reset after spike)
- **β (beta)**: 0.82 (leak/decay factor)
- **I_gain**: 0.10 (synaptic current gain)

These can be adjusted in `app.py` to change sensitivity.

## License

MIT License - Free for educational and seminar use.
