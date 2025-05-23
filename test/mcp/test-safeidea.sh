#!/bin/bash
# Simple script to test SafeIdea site with Playwright

# Ensure we're in the right directory
cd "$(dirname "$0")"

# URL to test - default to safeidea.net
URL=${1:-"https://safeidea.net"}

# Run the test
echo "🌎 Testing website: $URL"
echo "📸 This will open a browser window and take screenshots"

node simple-site-test.js "$URL"

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ Test completed successfully!"
    echo "📊 Check the 'screenshots' directory for output"
else
    echo "❌ Test failed"
    exit 1
fi