#!/bin/bash
set -e

echo "🚀 MythSeeker Full Deployment Script"
echo "====================================="

# 1. Fetch secrets and create .env
echo "📥 Fetching Firebase config from Google Secret Manager..."
./fetch-firebase-env.sh

# 2. Build the app
echo "🔨 Building the app..."
npm run build

# 3. Validate and deploy Firebase rules
echo "🔒 Validating Firestore rules..."
firebase deploy --only firestore:rules --dry-run

echo "🔒 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# 4. Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy

# 5. Deploy to GitHub Pages
echo "📚 Deploying to GitHub Pages..."
git add .
git commit -m "Deploy: $(date +%Y-%m-%d_%H-%M-%S)" || echo "No changes to commit"
git push origin main

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is available at:"
echo "   Firebase: https://mythseekers-rpg.web.app"
echo "   GitHub Pages: https://repairman29.github.io/MythSeeker/"
echo ""
echo "📊 Firebase Console: https://console.firebase.google.com/project/mythseekers-rpg/overview" 