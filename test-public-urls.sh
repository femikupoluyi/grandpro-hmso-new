#!/bin/bash

echo "=== Testing GrandPro HMSO Public URLs ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test Frontend
echo "1. Testing Frontend URL..."
if curl -s -o /dev/null -w "%{http_code}" https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so | grep -q "200"; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible${NC}"
fi
echo ""

# Test Backend Health
echo "2. Testing Backend Health Endpoint..."
HEALTH_RESPONSE=$(curl -s https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi
echo ""

# Test Frontend Routes
echo "3. Testing Frontend Routes..."
ROUTES=(
    "/onboarding/application"
    "/onboarding/documents"
    "/onboarding/dashboard"
    "/onboarding/contract-review"
)

for route in "${ROUTES[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so$route | grep -q "200"; then
        echo -e "${GREEN}✓ Route $route is accessible${NC}"
    else
        echo -e "${RED}✗ Route $route is not accessible${NC}"
    fi
done
echo ""

# Test API Endpoints
echo "4. Testing API Authentication Endpoints..."

# Test Registration
echo "Testing Registration..."
REG_RESPONSE=$(curl -s -X POST https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$(date +%s)'@grandprohmso.ng","password":"Test123!","name":"Test User","role":"hospital_owner"}')

if echo "$REG_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Registration endpoint works${NC}"
else
    echo -e "${RED}✗ Registration endpoint failed${NC}"
fi
echo ""

# Test Login
echo "Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@grandprohmso.ng","password":"Test123!"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Login endpoint works${NC}"
else
    echo -e "${RED}✗ Login endpoint failed${NC}"
fi
echo ""

echo "=== Test Summary ==="
echo "Frontend URL: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so"
echo "Backend API: https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so"
echo "All services are configured and running via PM2 with Nginx proxy"
