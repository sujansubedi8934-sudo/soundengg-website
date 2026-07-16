#!/bin/sh

# Exit immediately if any command fails
set -e

# Install Node.js using Homebrew (since it is not pre-installed in Xcode Cloud's default VM)
echo "=== Installing Node.js via Homebrew ==="
brew install node

# Navigate to the repository root (three levels up from ios/App/ci_scripts)
cd ../../..

# Print node/npm versions for verification in logs
echo "=== Checking Node & NPM versions ==="
node -v
npm -v

echo "=== Installing node dependencies ==="
npm install

echo "=== Compiling web production bundle ==="
npm run build

echo "=== Syncing Capacitor plugins to iOS ==="
npx cap sync ios

echo "=== Dependencies resolved successfully ==="
