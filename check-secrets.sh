#!/bin/bash

# Script to check for sensitive information before committing

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}          SECURITY CHECK FOR SENSITIVE INFORMATION               ${NC}"
echo -e "${CYAN}==================================================================${NC}"
echo ""

# Get all tracked files (excluding ignored files)
echo -e "${YELLOW}Checking all tracked files for sensitive information...${NC}"
ALL_FILES=$(git ls-files)

# Define patterns to search for
PATTERNS=(
  'SUPABASE_URL=[^$]'
  'SUPABASE_ANON_KEY=[^$]'
  'JWT_SECRET=[^$]'
  'EMAIL_PASS=[^$]'
  'SESSION_SECRET=[^$]'
  'password'
  'api[-_]?key'
  'secret[-_]?key'
  'auth[-_]?token'
  'password[-_]?hash'
  'private[-_]?key'
)

# Initialize flag for found issues
ISSUES_FOUND=0

# Check each file
for FILE in $ALL_FILES; do
  # Skip binary files and files that don't exist
  if [[ ! -f "$FILE" ]] || [[ "$(file -b --mime "$FILE" | grep -c '^text/')" -eq 0 ]]; then
    continue
  fi
  
  # Skip .env.example as it's supposed to have placeholders
  if [[ "$FILE" == ".env.example" ]]; then
    continue
  fi
  
  # Skip the check scripts themselves
  if [[ "$FILE" == "pre-commit" ]] || [[ "$FILE" == "check-secrets.sh" ]]; then
    continue
  fi

  # Check each pattern
  for PATTERN in "${PATTERNS[@]}"; do
    if grep -q "$PATTERN" "$FILE"; then
      echo -e "${RED}WARNING: Potential sensitive data found in $FILE${NC}"
      echo -e "${YELLOW}Pattern: $PATTERN${NC}"
      grep --color=always -n "$PATTERN" "$FILE"
      ISSUES_FOUND=1
      echo ""
    fi
  done
done

# Check .env is properly ignored
if git check-ignore -q .env; then
  echo -e "${GREEN}✓ .env file is properly ignored by Git${NC}"
else
  echo -e "${RED}WARNING: .env file is NOT ignored by Git! Add it to .gitignore immediately.${NC}"
  ISSUES_FOUND=1
fi
echo ""

# Check .gitignore includes .env
if grep -q "^\.env$" .gitignore; then
  echo -e "${GREEN}✓ .env is listed in .gitignore${NC}"
else
  echo -e "${RED}WARNING: .env is NOT listed in .gitignore! Add it immediately.${NC}"
  ISSUES_FOUND=1
fi
echo ""

# Final summary
if [ $ISSUES_FOUND -eq 1 ]; then
  echo -e "${RED}==============================================================${NC}"
  echo -e "${RED}  WARNING: Potential sensitive data found in tracked files!   ${NC}"
  echo -e "${RED}==============================================================${NC}"
  echo -e "${YELLOW}Please address the issues above before committing to GitHub.${NC}"
  echo -e "${YELLOW}Remember: Never commit sensitive information to a public repository!${NC}"
else
  echo -e "${GREEN}==============================================================${NC}"
  echo -e "${GREEN}  SUCCESS: No sensitive data found in tracked files.         ${NC}"
  echo -e "${GREEN}==============================================================${NC}"
  echo -e "${YELLOW}You're good to go! Just make sure to keep using environment variables${NC}"
  echo -e "${YELLOW}for all sensitive information and never commit your .env file.${NC}"
fi
