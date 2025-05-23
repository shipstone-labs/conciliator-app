#!/bin/bash
# Simple script to run the Playwright test that uses Claude Code SDK

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Default URL to test
URL=${1:-"http://localhost:3000"}

# Check if Claude Code CLI is available
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code CLI is not installed or not in PATH"
    echo "Please install it using the instructions at: https://docs.anthropic.com/en/docs/claude-code/cli-usage"
    exit 1
fi

# Start the local server if needed (with URL check)
if [[ "$URL" == *"localhost"* ]] || [[ "$URL" == *"127.0.0.1"* ]]; then
    echo "🚀 Testing local server at $URL"
    echo "Make sure your local server is running before continuing"
    read -p "Press Enter to continue, or Ctrl+C to cancel..."
else
    echo "🌎 Testing external URL: $URL"
fi

# Run the test
echo "📋 Running the simple test with Claude Code SDK..."
node simple-sdk-test.js "$URL"

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ Test completed successfully!"
else
    echo "❌ Test failed"
    exit 1
fi