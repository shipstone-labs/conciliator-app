#!/bin/bash

# Default to safeidea.net if no URL provided
BASE_URL=${1:-"https://safeidea.net"}

# Display usage information
echo "=========================================="
echo "Ideas Count Test Runner"
echo "=========================================="
echo "Running test against: $BASE_URL"
echo ""

# Run the Cypress test with the provided URL
npx cypress run --spec cypress/e2e/count-ideas.cy.js --env BASE_URL=$BASE_URL

# Check if the results file exists
if [ -f "cypress/downloads/ideas-count.json" ]; then
  echo ""
  echo "Results:"
  cat cypress/downloads/ideas-count.json
  echo ""
  
  # Extract just the count for easy processing using jq if available
  if command -v jq &> /dev/null; then
    COUNT=$(jq -r '.count' cypress/downloads/ideas-count.json)
  else
    # Fallback to grep if jq is not available
    COUNT=$(cat cypress/downloads/ideas-count.json | grep -o '"count":[0-9]*' | cut -d ":" -f2)
  fi
  echo "Ideas found: $COUNT"
else
  echo "No results file found. Test may have failed."
fi

echo ""
echo "Test complete!"