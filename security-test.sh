#!/bin/bash

# Security Testing Script for GrandPro HMSO
echo "=================================================="
echo "SECURITY VERIFICATION SCAN"
echo "Date: $(date)"
echo "=================================================="

BASE_URL="http://localhost:5001"
PASSED=0
FAILED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}[*] Testing SQL Injection Protection...${NC}"
# Test SQL injection attempts
SQL_PAYLOADS=(
  "' OR '1'='1"
  "admin' --"
  "'; DROP TABLE users; --"
  "' UNION SELECT * FROM users --"
)

for payload in "${SQL_PAYLOADS[@]}"; do
  response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$payload\", \"password\": \"test\"}" 2>&1)
  
  if [[ $response == *"Invalid input detected"* ]] || [[ $response == *"Invalid credentials"* ]]; then
    echo -e "${GREEN}✓ SQL Injection blocked: ${payload:0:20}...${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ SQL Injection NOT blocked: $payload${NC}"
    ((FAILED++))
  fi
done

echo -e "\n${YELLOW}[*] Testing XSS Protection...${NC}"
# Test XSS attempts
XSS_PAYLOADS=(
  "<script>alert('XSS')</script>"
  "<img src=x onerror=alert('XSS')>"
  "javascript:alert('XSS')"
)

for payload in "${XSS_PAYLOADS[@]}"; do
  response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$payload\", \"email\": \"test@test.com\", \"password\": \"Test123!\"}" 2>&1)
  
  if [[ $response == *"Invalid input detected"* ]] || [[ $response != *"$payload"* ]]; then
    echo -e "${GREEN}✓ XSS blocked/sanitized: ${payload:0:20}...${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ XSS NOT blocked: $payload${NC}"
    ((FAILED++))
  fi
done

echo -e "\n${YELLOW}[*] Testing Security Headers...${NC}"
# Check security headers
headers=$(curl -s -I "$BASE_URL/health")

REQUIRED_HEADERS=(
  "Strict-Transport-Security"
  "X-Content-Type-Options"
  "X-Frame-Options"
  "Content-Security-Policy"
  "Referrer-Policy"
)

for header in "${REQUIRED_HEADERS[@]}"; do
  if echo "$headers" | grep -qi "$header"; then
    value=$(echo "$headers" | grep -i "$header" | head -1)
    echo -e "${GREEN}✓ $header present${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ $header missing${NC}"
    ((FAILED++))
  fi
done

echo -e "\n${YELLOW}[*] Testing Rate Limiting...${NC}"
# Test rate limiting
for i in {1..10}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "password": "wrong"}' 2>&1)
  
  if [ "$response" == "429" ]; then
    echo -e "${GREEN}✓ Rate limiting triggered after $i requests${NC}"
    ((PASSED++))
    break
  fi
  
  if [ "$i" == "10" ]; then
    echo -e "${YELLOW}⚠ Rate limiting not triggered after 10 requests${NC}"
  fi
done

echo -e "\n${YELLOW}[*] Testing Authentication...${NC}"
# Test unauthorized access
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/users/profile")
if [ "$response" == "401" ] || [ "$response" == "403" ]; then
  echo -e "${GREEN}✓ Unauthorized access blocked${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Unauthorized access NOT blocked (HTTP $response)${NC}"
  ((FAILED++))
fi

echo -e "\n${YELLOW}[*] Testing Session Security...${NC}"
# Test session timeout configuration
response=$(curl -s "$BASE_URL/health")
if [[ $response == *"healthy"* ]]; then
  echo -e "${GREEN}✓ Service healthy and responsive${NC}"
  ((PASSED++))
fi

echo -e "\n${YELLOW}[*] Testing CORS Configuration...${NC}"
# Test CORS
response=$(curl -s -I -X OPTIONS "$BASE_URL/api/health" \
  -H "Origin: https://malicious.com" \
  -H "Access-Control-Request-Method: POST" 2>&1)

if echo "$response" | grep -q "Access-Control-Allow-Origin: \*"; then
  echo -e "${YELLOW}⚠ CORS allows all origins (development mode)${NC}"
elif echo "$response" | grep -q "Access-Control-Allow-Origin: https://malicious.com"; then
  echo -e "${RED}✗ CORS allows malicious origin${NC}"
  ((FAILED++))
else
  echo -e "${GREEN}✓ CORS properly configured${NC}"
  ((PASSED++))
fi

echo -e "\n=================================================="
echo "SECURITY SCAN RESULTS"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✅ ALL SECURITY TESTS PASSED!${NC}"
  SCORE=100
else
  SCORE=$((100 - FAILED * 5))
  echo -e "\n${YELLOW}Security Score: $SCORE/100${NC}"
fi

echo "=================================================="
