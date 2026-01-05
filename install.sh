#!/bin/bash

# Clean install script for Kubernetes Dashboard
# This script handles dependency conflicts and ensures clean installation

echo "Installing root dependencies..."
npm install

# Ensure concurrently is installed globally or locally
if ! command -v concurrently &> /dev/null; then
  echo "Installing concurrently..."
  npm install concurrently --save-dev
fi

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
# Install dependencies with legacy peer deps and ensure ajv is properly resolved
npm install --legacy-peer-deps
# Ensure ajv is properly installed to fix the codegen module issue
npm install ajv@^8.12.0 --legacy-peer-deps --save
cd ..

echo "Installation complete!"
echo ""
echo "To start the application, run: npm run dev"

