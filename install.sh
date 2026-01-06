#!/bin/bash

# Comprehensive installation script for Kubernetes Dashboard
# This script handles all dependency conflicts and ensures clean installation

set -e  # Exit on error

echo "=========================================="
echo "Kubernetes Dashboard - Complete Installation"
echo "=========================================="
echo ""

# Function to check if command succeeded
check_success() {
  if [ $? -ne 0 ]; then
    echo "ERROR: $1 failed"
    exit 1
  fi
}

# Step 1: Install root dependencies (for concurrently)
echo "Step 1/4: Installing root dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/concurrently" ]; then
  npm install
  check_success "Root dependencies installation"
  echo "✓ Root dependencies installed (including concurrently)"
else
  echo "✓ Root dependencies already installed"
fi
echo ""

# Step 2: Install server dependencies
echo "Step 2/4: Installing server dependencies..."
cd server
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  npm install
  check_success "Server dependencies installation"
  echo "✓ Server dependencies installed"
else
  echo "✓ Server dependencies already installed"
fi
cd ..
echo ""

# Step 3: Install client dependencies (most complex)
echo "Step 3/4: Installing client dependencies..."
echo "This step handles React 18 compatibility and dependency conflicts..."
cd client

# Clean up old installations if needed
if [ "$1" == "--clean" ] || [ "$1" == "-c" ]; then
  echo "Cleaning old client dependencies..."
  rm -rf node_modules package-lock.json node_modules/.cache
fi

# Remove old files if they exist
if [ -f "package-lock.json" ]; then
  echo "Removing old package-lock.json..."
  rm package-lock.json
fi

# Install compatible AJV versions FIRST (critical for react-scripts)
echo "Installing compatible AJV versions (required for react-scripts)..."
npm install --legacy-peer-deps ajv@6.12.6 ajv-keywords@3.5.2 --save-dev
check_success "AJV installation"

# Install all other dependencies with legacy peer deps
echo "Installing client dependencies (this may take a few minutes)..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
  echo "WARNING: Initial install had issues, trying with force..."
  npm install --legacy-peer-deps --force
  check_success "Client dependencies installation"
fi

# Verify and install critical packages
echo "Verifying critical packages..."

# Verify react-scripts
if [ ! -d "node_modules/react-scripts" ]; then
  echo "Installing react-scripts..."
  npm install react-scripts@5.0.1 --legacy-peer-deps --save
  check_success "react-scripts installation"
else
  echo "✓ react-scripts is installed"
fi

# Verify @uiw/react-json-view (fix for react-json-view module resolution error)
echo "Verifying @uiw/react-json-view installation..."
if [ ! -d "node_modules/@uiw" ] || [ ! -d "node_modules/@uiw/react-json-view" ]; then
  echo "Installing @uiw/react-json-view..."
  npm install @uiw/react-json-view@^1.6.9 --legacy-peer-deps --save
  if [ $? -ne 0 ]; then
    echo "Trying latest version of @uiw/react-json-view..."
    npm install @uiw/react-json-view@latest --legacy-peer-deps --save
    check_success "@uiw/react-json-view installation"
  fi
else
  echo "✓ @uiw/react-json-view is installed"
fi

# Ensure the package is properly linked (fix for module resolution)
if [ -d "node_modules/@uiw/react-json-view" ]; then
  echo "Verifying @uiw/react-json-view package integrity..."
  # Check if package.json exists in the module
  if [ ! -f "node_modules/@uiw/react-json-view/package.json" ]; then
    echo "WARNING: Package structure incomplete, reinstalling..."
    npm uninstall @uiw/react-json-view
    npm install @uiw/react-json-view@^1.6.9 --legacy-peer-deps --save
  fi
  echo "✓ @uiw/react-json-view package verified"
fi

# Remove any conflicting react-json-view package (old/deprecated package)
if [ -d "node_modules/react-json-view" ]; then
  echo "WARNING: Found old 'react-json-view' package, removing to avoid conflicts..."
  npm uninstall react-json-view 2>/dev/null || rm -rf node_modules/react-json-view
  echo "✓ Removed conflicting react-json-view package"
fi

# Verify AJV version (must be 6.x, not 8.x)
echo "Verifying AJV version..."
AJV_VERSION=$(npm list ajv 2>/dev/null | grep ajv@ | head -1 | awk '{print $2}' | sed 's/@//')
if [[ "$AJV_VERSION" == *"6."* ]]; then
  echo "✓ AJV version is correct: $AJV_VERSION"
else
  echo "WARNING: AJV version might be incorrect: $AJV_VERSION"
  echo "Expected 6.x.x, reinstalling..."
  npm install ajv@6.12.6 ajv-keywords@3.5.2 --legacy-peer-deps --save-dev
fi

# Clear all caches to avoid build issues (fixes module resolution errors)
echo "Clearing build caches..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .cache 2>/dev/null || true
rm -rf build 2>/dev/null || true
# Clear webpack cache specifically
find node_modules -type d -name ".cache" -exec rm -rf {} + 2>/dev/null || true
echo "✓ Build caches cleared"

cd ..
echo "✓ Client dependencies installed"
echo ""

# Step 4: Final verification
echo "Step 4/4: Verifying installations..."
echo ""

# Check root
if [ -d "node_modules/concurrently" ]; then
  echo "✓ Root: concurrently installed"
else
  echo "✗ Root: concurrently missing"
fi

# Check server
if [ -d "server/node_modules/express" ]; then
  echo "✓ Server: express installed"
else
  echo "✗ Server: express missing"
fi

# Check client
if [ -d "client/node_modules/react-scripts" ]; then
  echo "✓ Client: react-scripts installed"
else
  echo "✗ Client: react-scripts missing"
fi

if [ -d "client/node_modules/@uiw/react-json-view" ]; then
  # Verify the package has the necessary files
  if [ -f "client/node_modules/@uiw/react-json-view/package.json" ] && [ -f "client/node_modules/@uiw/react-json-view/dist/index.js" ] || [ -f "client/node_modules/@uiw/react-json-view/dist/index.esm.js" ]; then
    echo "✓ Client: @uiw/react-json-view installed and verified"
  else
    echo "⚠ Client: @uiw/react-json-view installed but files incomplete"
    echo "  Reinstalling @uiw/react-json-view..."
    cd client
    npm uninstall @uiw/react-json-view
    npm install @uiw/react-json-view@^1.6.9 --legacy-peer-deps --save
    cd ..
  fi
else
  echo "✗ Client: @uiw/react-json-view missing"
  echo "  Installing @uiw/react-json-view..."
  cd client
  npm install @uiw/react-json-view@^1.6.9 --legacy-peer-deps --save
  cd ..
fi

if [ -d "client/node_modules/ajv" ]; then
  AJV_VER=$(cd client && npm list ajv 2>/dev/null | grep ajv@ | head -1 | awk '{print $2}' | sed 's/@//' || echo "unknown")
  echo "✓ Client: ajv installed (version: $AJV_VER)"
else
  echo "✗ Client: ajv missing"
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "📋 Quick Start Guide:"
echo ""
echo "1. Start both server and client together:"
echo "   npm run dev"
echo ""
echo "2. Or start them separately:"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: cd client && HOST=0.0.0.0 npm start"
echo ""
echo "3. Access the dashboard:"
echo "   Frontend: http://your-server-ip:3000"
echo "   Backend API: http://your-server-ip:3001"
echo ""
echo "📝 Notes:"
echo "   - Server runs on port 3001"
echo "   - Client runs on port 3000"
echo "   - Use HOST=0.0.0.0 to bind to all interfaces (for EC2)"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If client fails, run: cd client && rm -rf node_modules/.cache && npm start"
echo "   - For clean reinstall: ./install.sh --clean"
echo "   - If you see 'Can't resolve react-json-view' error:"
echo "     1. cd client"
echo "     2. rm -rf node_modules/@uiw node_modules/.cache"
echo "     3. npm install @uiw/react-json-view@^1.6.9 --legacy-peer-deps --save"
echo "     4. npm start"
echo ""
