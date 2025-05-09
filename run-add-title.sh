#!/bin/bash

# Default to safeidea.net if no URL provided
BASE_URL=${1:-"https://safeidea.net"}

# Bold and colored text for better visibility
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Display usage information
echo -e "${BOLD}==========================================${NC}"
echo -e "${BOLD}${GREEN}Add Idea Title Test${NC}"
echo -e "${BOLD}==========================================${NC}"
echo -e "Running test against: ${BLUE}${BASE_URL}${NC}"
echo ""
echo -e "${BOLD}IMPORTANT:${NC} This test requires manual login."
echo ""
echo -e "${YELLOW}Test will:${NC}"
echo "  1. Navigate to SafeIdea site"
echo "  2. Wait for you to log in manually"
echo "  3. Navigate to Add Idea page"
echo "  4. Fill in the title field only"
echo ""
echo -e "${BOLD}Note:${NC} Test now automatically scrolls elements into view"
echo "for better reliability. No manual scrolling required."
echo ""
echo -e "${BOLD}Press any key to continue...${NC}"
read -n 1 -s

# Run the Cypress test in interactive mode to allow login
echo "Starting Cypress..."
npx cypress open --e2e --env BASE_URL=$BASE_URL

echo ""
echo -e "${BOLD}${GREEN}Test complete!${NC}"