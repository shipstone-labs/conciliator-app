#!/bin/bash

# Default to safeidea.net if no URL provided
BASE_URL=${1:-"https://safeidea.net"}

# Bold and colored text for better visibility
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display usage information
echo -e "${BOLD}==========================================${NC}"
echo -e "${BOLD}${GREEN}Reliable Add Idea Navigation${NC}"
echo -e "${BOLD}==========================================${NC}"
echo -e "Running test against: ${BLUE}${BASE_URL}${NC}"
echo ""
echo -e "${BOLD}IMPORTANT:${NC} This test requires manual login."
echo "When the browser opens:"
echo "  1. Please log in when prompted"
echo "  2. After login completes, the test will automatically:"
echo "     - Detect your login"
echo "     - Navigate to the Add Idea page"
echo "     - Verify the page loaded correctly"
echo ""
echo -e "${BOLD}Press any key to continue...${NC}"
read -n 1 -s

# Run the Cypress test in interactive mode to allow login
echo "Starting Cypress..."
npx cypress open --e2e --env BASE_URL=$BASE_URL

echo ""
echo -e "${BOLD}${GREEN}Test complete!${NC}"