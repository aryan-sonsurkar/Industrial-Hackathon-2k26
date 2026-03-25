# AccuHelp Deployment Guide

## Quick Deployment Steps

### 1. Heroku Deployment (Recommended)

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set FLASK_DEBUG=False
heroku config:set FLASK_HOST=0.0.0.0

# Deploy
git add .
git commit -m "Ready for deployment"
git push heroku main

# Open app
heroku open
```

### 2. Render Deployment

1. Connect your GitHub repo to Render
2. Select "Web Service"
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn app:app`
5. Set Environment Variables:
   - `FLASK_DEBUG`: False
   - `FLASK_HOST`: 0.0.0.0
   - `PORT`: 10000

### 3. Local Production Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run with production settings
set FLASK_DEBUG=False
set FLASK_HOST=0.0.0.0
set PORT=5000
python app.py
```

## Files Created for Deployment

✅ `Procfile` - Tells Heroku how to run the app
✅ `runtime.txt` - Specifies Python version
✅ `requirements.txt` - Updated with all dependencies
✅ `.gitignore` - Excludes unnecessary files
✅ `app.py` - CORS enabled & production-ready

## Admin Access

- **Login URL**: `/admin/login`
- **Password**: `accunity123`
- **Dashboard**: `/admin`

## API Endpoints

- `GET /health` - Health check
- `GET /` - Main chat interface
- `GET /landing` - New landing page
- `GET /admin/login` - Admin login
- `GET /admin` - Admin dashboard (protected)
- `GET /admin/chats?range=all` - Chat data with time filtering

## Troubleshooting

**CORS Errors**: Already fixed with flask-cors
**Port Issues**: App automatically uses PORT environment variable
**Static Files**: Served automatically by Flask
**Database**: Uses JSON files (no external DB needed)
