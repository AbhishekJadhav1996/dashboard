#!/bin/bash

# Clean install script for Kubernetes Dashboard
# This script handles dependency conflicts and ensures clean installation

echo "=========================================="
echo "Installing Kubernetes Dashboard Dependencies"
echo "=========================================="
echo ""

# Step 1: Install root dependencies
echo "Step 1/3: Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to install root dependencies"
  exit 1
fi
echo "✓ Root dependencies installed"
echo ""

# Step 2: Install server dependencies
echo "Step 2/3: Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to install server dependencies"
  exit 1
fi
cd ..
echo "✓ Server dependencies installed"
echo ""

# Step 3: Install client dependencies
echo "Step 3/3: Installing client dependencies..."
cd client

# Remove old files if they exist
if [ -f "package-lock.json" ]; then
  echo "Removing old package-lock.json..."
  rm package-lock.json
fi
if [ -d "node_modules" ]; then
  echo "Removing old node_modules..."
  rm -rf node_modules
fi

# Install dependencies with legacy peer deps
echo "Installing client dependencies (this may take a few minutes)..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
  echo "WARNING: Initial install failed, trying with force..."
  npm install --legacy-peer-deps --force
  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install client dependencies"
    exit 1
  fi
fi

# Note: We don't install ajv separately - react-scripts manages its own version

# Verify react-scripts is installed
if [ ! -d "node_modules/react-scripts" ]; then
  echo "Installing react-scripts..."
  npm install react-scripts@5.0.1 --legacy-peer-deps --save
fi

# Verify @uiw/react-json-view is installed
if [ ! -d "node_modules/@uiw/react-json-view" ]; then
  echo "Installing @uiw/react-json-view..."
  npm install @uiw/react-json-view@^1.6.9 --legacy-peer-deps --save
fi

cd ..
echo "✓ Client dependencies installed"
echo ""

echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo "  npm run dev          # Start both server and client"
echo ""
echo "Or start them separately:"
echo "  Terminal 1: cd server && npm run dev"
echo "  Terminal 2: cd client && npm start"
echo ""

