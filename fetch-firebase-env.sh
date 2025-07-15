#!/bin/bash
set -e

echo "Fetching Firebase config from Google Secret Manager..."
gcloud secrets versions access latest --secret="firebase-config" > .env.json

echo "Converting JSON to .env format..."
jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' .env.json > .env

echo ".env file created:"
cat .env 