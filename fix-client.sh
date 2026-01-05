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

echo "Client dependencies fixed!"
echo ""
echo "You can now start the application with: npm run dev"

