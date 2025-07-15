# GitHub Deployment Setup Guide

## Overview

Your MythSeeker app is now set up for deployment to both **Firebase Hosting** and **GitHub Pages** with automated CI/CD.

## Deployment Options

### 1. **Manual Deployment (Recommended for now)**
```bash
./deploy-all.sh
```
This script will:
- Fetch secrets from Google Secret Manager
- Build the app
- Deploy to Firebase
- Commit and push to GitHub (which triggers GitHub Pages)

### 2. **Firebase Only**
```bash
./deploy-with-secrets.sh
```

### 3. **GitHub Pages Only**
```bash
npm run build
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## GitHub Pages Setup

### 1. Enable GitHub Pages
1. Go to your repository: https://github.com/repairman29/MythSeeker
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. Your GitHub Pages URL
Once enabled, your app will be available at:
**https://repairman29.github.io/MythSeeker/**

## Automated Deployment (Future Enhancement)

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is set up to automatically deploy to GitHub Pages when you push to the `main` branch.

### Required GitHub Secrets (for full automation)
If you want to add Firebase deployment to GitHub Actions later, you'll need these secrets:

1. **GCP_PROJECT_ID**: Your Google Cloud project ID
2. **GCP_SA_KEY**: Your Google Cloud service account key (JSON)
3. **FIREBASE_SERVICE_ACCOUNT**: Your Firebase service account key (JSON)

## Current Deployment URLs

- **Firebase Hosting**: https://mythseekers-rpg.web.app
- **GitHub Pages**: https://repairman29.github.io/MythSeeker/ (after first deployment)

## Recommended Workflow

1. **For development**: Use `npm run dev` for local development
2. **For deployment**: Use `./deploy-all.sh` to deploy to both platforms
3. **For quick updates**: Use `./deploy-with-secrets.sh` for Firebase only

## Benefits of Dual Deployment

- **Firebase**: Full backend integration, real-time features
- **GitHub Pages**: Free hosting, good for static content
- **Redundancy**: If one platform is down, the other is available
- **Performance**: Users can choose the faster option for their location 