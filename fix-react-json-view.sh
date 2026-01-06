#!/bin/bash

# Dedicated script to fix react-json-view module resolution error
# This script aggressively clears caches and reinstalls the package

set -e

echo "=========================================="
echo "Fixing react-json-view Module Resolution Error"
echo "=========================================="
echo ""

cd client || exit 1

echo "Step 1: Removing @uiw/react-json-view package..."
npm uninstall @uiw/react-json-view 2>/dev/null || true
echo "✓ Removed"

echo ""
echo "Step 2: Clearing all caches..."
# Remove React cache
rm -rf node_modules/.cache 2>/dev/null || true
# Remove webpack cache
rm -rf node_modules/.cache/webpack 2>/dev/null || true
# Remove .cache directory
rm -rf .cache 2>/dev/null || true
# Remove build directory
rm -rf build 2>/dev/null || true
# Remove any react-json-view remnants
rm -rf node_modules/react-json-view 2>/dev/null || true
rm -rf node_modules/@uiw/react-json-view 2>/dev/null || true
# Clear npm cache for this package
npm cache clean --force 2>/dev/null || true
echo "✓ Caches cleared"

echo ""
echo "Step 3: Removing package-lock.json to force fresh install..."
if [ -f "package-lock.json" ]; then
  rm package-lock.json
  echo "✓ Removed package-lock.json"
else
  echo "✓ No package-lock.json found"
fi

echo ""
echo "Step 4: Installing @uiw/react-json-view..."
npm install @uiw/react-json-view@^1.6.9 --legacy-peer-deps --save
if [ $? -ne 0 ]; then
  echo "Trying with latest version..."
  npm install @uiw/react-json-view@latest --legacy-peer-deps --save
fi

echo ""
echo "Step 5: Verifying installation..."
if [ -d "node_modules/@uiw/react-json-view" ]; then
  if [ -f "node_modules/@uiw/react-json-view/package.json" ]; then
    echo "✓ @uiw/react-json-view installed successfully"
    echo "  Location: node_modules/@uiw/react-json-view"
    
    # Check for dist files
    if [ -d "node_modules/@uiw/react-json-view/dist" ]; then
      echo "✓ Distribution files found"
    else
      echo "⚠ Warning: Distribution files not found, but package.json exists"
    fi
  else
    echo "✗ ERROR: Package installed but package.json missing!"
    exit 1
  fi
else
  echo "✗ ERROR: Package not installed!"
  exit 1
fi

echo ""
echo "Step 6: Reinstalling all dependencies to ensure proper linking..."
npm install --legacy-peer-deps

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clear your browser cache"
echo "2. Try running: npm start"
echo ""
echo "If the error persists, try:"
echo "  rm -rf node_modules package-lock.json"
echo "  npm install --legacy-peer-deps"
echo ""

