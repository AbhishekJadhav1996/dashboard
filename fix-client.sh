#!/bin/bash

# Fix client dependencies - specifically ajv issue
echo "Fixing client dependencies..."

cd client

# Remove node_modules and package-lock.json for clean install
echo "Cleaning old dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with legacy peer deps
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Ensure ajv is properly installed
echo "Installing ajv..."
npm install ajv@^8.12.0 --legacy-peer-deps --save

# Verify react-scripts is installed
if [ ! -d "node_modules/react-scripts" ]; then
  echo "Installing react-scripts..."
  npm install react-scripts@5.0.1 --legacy-peer-deps --save
fi

echo ""
echo "Client dependencies fixed!"
echo ""
echo "To test the client, run: cd client && npm start"
echo "Or start both server and client: npm run dev (from root directory)"

