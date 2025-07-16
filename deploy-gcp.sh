#!/bin/bash
set -e

echo "🚀 MythSeeker GCP Deployment Script"
echo "===================================="

# Configuration
PROJECT_ID="mythseekers-rpg"
SERVICE_NAME="mythseeker"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI not found. Please install it first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install it first."
    exit 1
fi

# Authenticate and set project
print_status "Setting up GCP project..."
gcloud config set project $PROJECT_ID

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "Not authenticated. Please run: gcloud auth login"
    exit 1
fi

# Enable required services
print_status "Enabling required GCP services..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Build and push using Cloud Build
print_status "Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

# Get the service URL
print_status "Getting service information..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

print_success "Deployment complete!"
echo ""
echo "🌐 Your MythSeeker app is now live at:"
echo "   $SERVICE_URL"
echo ""
echo "📊 Monitoring and logs:"
echo "   Cloud Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
echo "   Logs: gcloud logs read --service=$SERVICE_NAME --region=$REGION"
echo ""
echo "🔧 Useful commands:"
echo "   Update: gcloud run deploy $SERVICE_NAME --source . --region=$REGION"
echo "   Logs: gcloud logs tail projects/$PROJECT_ID/logs/run.googleapis.com%2Fstdout"
echo "   Delete: gcloud run services delete $SERVICE_NAME --region=$REGION" 