#!/bin/bash

# Clean install script for Kubernetes Dashboard
# This script handles dependency conflicts and ensures clean installation

echo "Installing root dependencies..."
npm install

echo "Installing server dependencies..."
cd server
npm install
cd ..

echo "Installing client dependencies (with legacy peer deps to handle React 18 compatibility)..."
cd client
# Remove old package-lock.json if it exists to avoid conflicts
if [ -f "package-lock.json" ]; then
  echo "Removing old package-lock.json..."
  rm package-lock.json
fi
npm install --legacy-peer-deps
cd ..

echo "Installation complete!"
echo ""
echo "To start the application, run: npm run dev"

