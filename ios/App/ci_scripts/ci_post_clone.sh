#!/bin/sh

# Exit immediately if any command fails
set -e

# Navigate to the repository root (three levels up from ios/App/ci_scripts)
cd ../../..

echo "=== Installing node dependencies ==="
npm install

echo "=== Compiling web production bundle ==="
npm run build

echo "=== Syncing Capacitor plugins to iOS ==="
npx cap sync ios

echo "=== Dependencies resolved successfully ==="
