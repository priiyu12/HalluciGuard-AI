#!/bin/bash

# Terminate on error
set -e

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

echo "=== Setting up HalluciGuard Frontend ==="

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Installing frontend dependencies..."
    npm install
fi

# Copy .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "=== Starting Vite Frontend Dev Server ==="
# Run frontend
npm run dev
