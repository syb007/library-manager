#!/bin/sh

# Run database migrations
echo "Running database migrations..."
python migrate.py

# Start the gRPC server
echo "Starting gRPC server..."
python server.py
