#!/bin/bash

# Run MCP Server for Assessment Testing
# This script starts the MCP server for assessment form testing
# Usage: ./run-mcp-server.sh [port]

PORT=${1:-3333}

echo "Starting MCP Assessment Test Server on port $PORT..."
echo "Press Ctrl+C to stop the server"

# Set environment variable for port
export PORT=$PORT

# Run the server
node mcp-assessment-test-server.js