#!/bin/bash

# Terminate on error
set -e

# Navigate to backend directory
cd "$(dirname "$0")/backend"

echo "=== Setting up HalluciGuard Backend ==="

# Check if python3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed or not in PATH."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv'..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "=== Starting FastAPI Backend ==="
# Run backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
