#!/bin/bash

# Setup script for Git hooks

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Git pre-commit hook...${NC}"

# Make sure the hook scripts are executable
chmod +x pre-commit check-secrets.sh

# Create Git hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install the pre-commit hook
cp pre-commit .git/hooks/pre-commit

echo -e "${GREEN}✓ Pre-commit hook installed successfully!${NC}"
echo -e "${YELLOW}The hook will run automatically before each commit to check for sensitive information.${NC}"
echo
echo -e "${YELLOW}You can also manually check for secrets at any time by running:${NC}"
echo -e "./check-secrets.sh"
