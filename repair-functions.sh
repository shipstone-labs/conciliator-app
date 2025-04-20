#!/bin/bash
# repair-functions.sh - Repair audience configuration for all Firebase v2 functions
# Usage: ./repair-functions.sh

set -e  # Exit on any error

# Check if deploy-firebase-function.sh exists
if [ ! -f "./deploy-firebase-function.sh" ]; then
  echo "Error: deploy-firebase-function.sh not found!"
  echo "Please make sure it exists in the current directory."
  exit 1
fi

# Make sure deploy-firebase-function.sh is executable
chmod +x ./deploy-firebase-function.sh

# Get list of all Firebase v2 functions
echo "Fetching list of all Firebase v2 functions..."
FUNCTIONS=$(gcloud functions list --format="value(name)" --filter="environment=GEN_2" | grep -o "[^/]*$")

if [ -z "$FUNCTIONS" ]; then
  echo "No Firebase v2 functions found."
  exit 0
fi

echo "Found the following functions to repair:"
echo "$FUNCTIONS"
echo ""

# Process each function
for FUNCTION in $FUNCTIONS; do
  echo "======================================================="
  echo "Repairing function: $FUNCTION"
  echo "======================================================="
  
  # Call the deploy script with --skip-deploy flag
  ./deploy-firebase-function.sh --skip-deploy "$FUNCTION"
  
  echo "Repair complete for $FUNCTION"
  echo ""
done

echo "All functions have been repaired!"