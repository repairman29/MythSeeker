#!/bin/bash
set -e

# 1. Fetch secrets and create .env
./fetch-firebase-env.sh

# 2. Validate Firestore rules
echo "Validating Firestore rules..."
firebase deploy --only firestore:rules --dry-run

# 3. Deploy Firestore rules
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules

# 4. Deploy the rest of your app (hosting, functions, etc.)
echo "Deploying app (hosting, functions, etc.)..."
firebase deploy 