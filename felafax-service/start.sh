#!/bin/bash

# Felafax Service Startup Script

echo "Starting Felafax Service..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    redis-server --daemonize yes
    sleep 2
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start the FastAPI service
echo "Starting FastAPI service on port 8000..."
python main.py