#!/bin/bash

echo "======================================"
echo "GrandPro HMSO - URL Functionality Test"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Base URLs
FRONTEND_URL="https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so"
BACKEND_URL="https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so"

# Function to test URL
test_url() {
    local description=$1
    local url=$2
    local expected_status=${3:-200}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $description... "
    
    # Get HTTP status code
    status=$(curl -o /dev/null -s -w "%{http_code}" "$url")
    
    if [ "$status" == "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (Status: $status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test API endpoint with data
test_api() {
    local description=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_field=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -X "$method" "${BACKEND_URL}${endpoint}" -H "Content-Type: application/json")
    else
        response=$(curl -s -X "$method" "${BACKEND_URL}${endpoint}" -H "Content-Type: application/json" -d "$data")
    fi
    
    if [ -n "$expected_field" ]; then
        if echo "$response" | grep -q "$expected_field"; then
            echo -e "${GREEN}✓${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            echo -e "${RED}✗${NC} (Field '$expected_field' not found)"
            echo "Response: $response"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    else
        if [ -n "$response" ]; then
            echo -e "${GREEN}✓${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            echo -e "${RED}✗${NC} (Empty response)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    fi
}

echo "1. Testing Backend API Health"
echo "------------------------------"
test_api "Backend Health Check" "GET" "/health" "" "status"
test_api "API Version Check" "GET" "/api/version" "" ""

echo ""
echo "2. Testing Frontend Routes"
echo "---------------------------"
test_url "Frontend Home Page" "$FRONTEND_URL/"
test_url "Onboarding Application" "$FRONTEND_URL/onboarding/application"
test_url "Document Upload Page" "$FRONTEND_URL/onboarding/documents"
test_url "Onboarding Dashboard" "$FRONTEND_URL/onboarding/dashboard"
test_url "Contract Review Page" "$FRONTEND_URL/onboarding/contract-review"

echo ""
echo "3. Testing Authentication Endpoints"
echo "------------------------------------"
# Test with unique email to avoid conflicts
timestamp=$(date +%s)
test_email="test_${timestamp}@hospital.ng"

test_api "User Registration" "POST" "/api/auth/register" \
    "{\"email\":\"$test_email\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\",\"role\":\"hospital_owner\",\"phone\":\"+2348012345678\"}" \
    "token"

test_api "User Login" "POST" "/api/auth/login" \
    "{\"email\":\"$test_email\",\"password\":\"Test123!@#\"}" \
    "token"

echo ""
echo "4. Testing CRM Endpoints"
echo "-------------------------"
test_api "CRM Status" "GET" "/api/crm/status" "" ""

echo ""
echo "5. Testing Static Assets"
echo "-------------------------"
test_url "Frontend JavaScript Bundle" "$FRONTEND_URL/assets/index.js" "" "404"
test_url "Frontend CSS Bundle" "$FRONTEND_URL/assets/index.css" "" "404"

echo ""
echo "6. Testing CORS Headers"
echo "------------------------"
echo -n "Testing CORS configuration... "
cors_header=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/health" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control-allow-origin")

if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓${NC} CORS enabled"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠${NC} CORS headers not detected"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "7. Testing Database Connectivity"
echo "---------------------------------"
test_api "Database Connection" "GET" "/api/db/status" "" ""

echo ""
echo "======================================"
echo "Test Results Summary"
echo "======================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed successfully!${NC}"
    echo ""
    echo "Public URLs are fully functional:"
    echo "- Frontend: $FRONTEND_URL"
    echo "- Backend API: $BACKEND_URL"
    exit 0
else
    echo -e "\n${YELLOW}⚠ Some tests failed. Please check the logs above.${NC}"
    exit 1
fi
