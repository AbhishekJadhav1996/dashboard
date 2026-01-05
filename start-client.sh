#!/bin/bash

# Start the client separately to see any errors
echo "Starting React client on port 3000..."
echo "Make sure the server is running on port 3001 first!"
echo ""

cd client

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "ERROR: node_modules not found. Run ./fix-client.sh first"
  exit 1
fi

# Check if react-scripts exists
if [ ! -d "node_modules/react-scripts" ]; then
  echo "ERROR: react-scripts not found. Installing..."
  npm install react-scripts@5.0.1 --legacy-peer-deps --save
fi

# Start the client
echo "Starting React development server..."
npm start

