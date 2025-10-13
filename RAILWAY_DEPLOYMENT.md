# 🚀 Railway Deployment Guide for Sora Video Generator

## Step 1: Prepare Your Project
✅ **Already done!** Your project is ready for deployment.

## Step 2: Push to GitHub (if not already done)
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: Sora Video Generator"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/sora-video-generator.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

### 3.1 Go to Railway
1. **Open**: https://railway.app
2. **Click**: "Start a New Project"
3. **Sign up** with GitHub (recommended)

### 3.2 Connect Your Repository
1. **Click**: "Deploy from GitHub repo"
2. **Select**: Your `sora-video-generator` repository
3. **Click**: "Deploy Now"

### 3.3 Configure Environment Variables
1. **Click** on your deployed project
2. **Go to**: "Variables" tab
3. **Add these variables**:

```
KIE_API_KEY = 4fef225dcccec37484599005ab420345
KIE_API_BASE_URL = https://api.kie.ai
NODE_ENV = production
MAX_CONCURRENT_TASKS = 5
TASK_TIMEOUT_MINUTES = 30
```

### 3.4 Set Callback URL
1. **Wait** for deployment to complete (2-3 minutes)
2. **Copy** your Railway URL (like: `https://sora-generator-production.railway.app`)
3. **Add** this variable:
```
CALLBACK_BASE_URL = https://your-actual-railway-url.railway.app
```

## Step 4: Test Your Deployment
1. **Open** your Railway URL
2. **Create** a test video
3. **Watch** real-time updates
4. **Check** that videos complete successfully

## 🎉 You're Done!
Your Sora Video Generator is now live and generating real videos!

## 🔧 Troubleshooting
- **Deployment fails**: Check that all dependencies are in package.json
- **Environment variables**: Make sure CALLBACK_BASE_URL matches your Railway URL
- **Videos not completing**: Verify Kie.ai API key is correct

## 📊 Monitoring
- **Logs**: View in Railway dashboard
- **Metrics**: Monitor usage and performance
- **Scaling**: Railway auto-scales based on traffic
