#!/bin/bash
set -e

# Define color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running comprehensive pre-commit checks...${NC}"

echo -e "\n${YELLOW}1. Running format check...${NC}"
pnpm format || { echo -e "${RED}❌ Formatting failed${NC}"; exit 1; }
echo -e "${GREEN}✅ Formatting passed${NC}"

echo -e "\n${YELLOW}2. Running type check...${NC}"
pnpm check || { echo -e "${RED}❌ Type checking failed${NC}"; exit 1; }
echo -e "${GREEN}✅ Type checking passed${NC}"

echo -e "\n${YELLOW}3. Running linting...${NC}"
pnpm lint || { echo -e "${RED}❌ Linting failed${NC}"; exit 1; }
echo -e "${GREEN}✅ Linting passed${NC}"

echo -e "\n${YELLOW}4. Building project...${NC}"
pnpm build || { echo -e "${RED}❌ Build failed${NC}"; exit 1; }
echo -e "${GREEN}✅ Build passed${NC}"

# Optional: Check for untracked files that might be needed
echo -e "\n${YELLOW}5. Checking for potentially missing files...${NC}"
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
  echo -e "${YELLOW}⚠️  Warning: You have untracked files that won't be committed:${NC}"
  echo "$UNTRACKED"
  echo -e "${YELLOW}Make sure these aren't required for your changes.${NC}"
else
  echo -e "${GREEN}✅ No untracked files detected${NC}"
fi

# Optional: Check if you have any uncommitted changes in package.json or pnpm-lock.yaml
echo -e "\n${YELLOW}6. Checking dependency files...${NC}"
if git diff --name-only --cached | grep -q "package.json\|pnpm-lock.yaml"; then
  echo -e "${YELLOW}⚠️  Warning: You're committing changes to package.json or pnpm-lock.yaml${NC}"
  echo -e "${YELLOW}Make sure these changes are intentional and documented.${NC}"
else
  echo -e "${GREEN}✅ No dependency file changes detected${NC}"
fi

echo -e "\n${GREEN}✅ All checks passed! Ready to commit.${NC}"
echo -e "${YELLOW}Note: This doesn't guarantee the build server will pass, but it significantly improves the chances.${NC}"