#!/bin/bash

# Default to safeidea.net if no URL provided
BASE_URL=${1:-"https://safeidea.net"}

# Display usage information
echo "=========================================="
echo "Test ID Inspection Runner"
echo "=========================================="
echo "Running test against: $BASE_URL"
echo ""
echo "IMPORTANT: This test requires manual login."
echo "When the browser opens, please log in to continue the test."
echo "After login, the test will automatically list all testIDs found."
echo ""

# Run the Cypress test in interactive mode to allow login
npx cypress open --e2e --env BASE_URL=$BASE_URL

echo ""
echo "Test complete!"