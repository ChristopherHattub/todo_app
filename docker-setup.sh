#!/bin/bash

# Simple setup script for Todo Tracker

echo "Setting up Todo Tracker for development..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start the application
echo "Starting development environment..."
docker-compose up --build

echo "Todo Tracker is running at http://localhost:3000"