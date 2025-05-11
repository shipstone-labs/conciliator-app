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
echo -e "${BOLD}${GREEN}Complete Idea Creation Test${NC}"
echo -e "${BOLD}==========================================${NC}"
echo -e "Running test against: ${BLUE}${BASE_URL}${NC}"
echo ""
echo -e "${BOLD}IMPORTANT:${NC} This test requires manual login."
echo ""
echo -e "${YELLOW}Test will:${NC}"
echo "  1. Navigate to SafeIdea site"
echo "  2. Wait for you to log in manually"
echo "  3. Navigate to Add Idea page"
echo "  4. Fill in title and description"
echo "  5. Upload the Xanthanide invention file"
echo "  6. Submit and encrypt the idea"
echo "  7. Create the idea entry"
echo ""
echo -e "${BOLD}NOTE:${NC} This test will use the file at: /Users/creed/Downloads/xanthanide-invention.md"
echo "      Please ensure this file exists before continuing."
echo ""
echo -e "${BOLD}Press any key to continue...${NC}"
read -n 1 -s

# Check if the file exists
if [ ! -f "/Users/creed/Downloads/xanthanide-invention.md" ]; then
  echo -e "${BOLD}${YELLOW}WARNING:${NC} File not found at /Users/creed/Downloads/xanthanide-invention.md"
  echo "Do you want to continue anyway? (y/n)"
  read -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Test aborted."
    exit 1
  fi
fi

# Run the Cypress test in interactive mode to allow login
echo "Starting Cypress..."
npx cypress open --e2e --env BASE_URL=$BASE_URL

echo ""
echo -e "${BOLD}${GREEN}Test complete!${NC}"