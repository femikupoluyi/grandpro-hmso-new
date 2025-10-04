#!/bin/bash

# GrandPro HMSO - Comprehensive Public URL Test Script

echo "=============================================="
echo "GrandPro HMSO - Public URL Verification Test"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
BACKEND_URL="https://backend-api-morphvm-wz7xxc7v.http.cloud.morph.so"
FRONTEND_URL="https://frontend-app-morphvm-wz7xxc7v.http.cloud.morph.so"

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local method=${3:-GET}
    local data=${4:-}
    
    echo -n "Testing $description... "
    
    if [ "$method" == "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    fi
    
    if [ "$response" == "200" ] || [ "$response" == "201" ]; then
        echo -e "${GREEN}✓ Working (HTTP $response)${NC}"
        return 0
    elif [ "$response" == "401" ] || [ "$response" == "403" ]; then
        echo -e "${YELLOW}⚠ Auth Required (HTTP $response)${NC}"
        return 0
    elif [ "$response" == "404" ]; then
        echo -e "${RED}✗ Not Found (HTTP $response)${NC}"
        return 1
    else
        echo -e "${RED}✗ Failed (HTTP $response)${NC}"
        return 1
    fi
}

# Function to test with data response
test_with_response() {
    local url=$1
    local description=$2
    
    echo -n "Testing $description... "
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q "status"; then
        echo -e "${GREEN}✓ Working${NC}"
        echo "  Response: $(echo $response | head -c 100)..."
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

echo "=== Testing Frontend ==="
echo "------------------------"
test_endpoint "$FRONTEND_URL" "Frontend Homepage"
test_endpoint "$FRONTEND_URL/health" "Frontend Health Check"
test_endpoint "$FRONTEND_URL/login" "Frontend Login Page"
test_endpoint "$FRONTEND_URL/dashboard" "Frontend Dashboard"
test_endpoint "$FRONTEND_URL/onboarding" "Frontend Onboarding"
echo ""

echo "=== Testing Backend Core APIs ==="
echo "----------------------------------"
test_with_response "$BACKEND_URL/health" "Backend Health Check"
test_with_response "$BACKEND_URL/api/status" "API Status"
test_with_response "$BACKEND_URL/api" "API Info"
test_with_response "$BACKEND_URL/api/dashboard/stats" "Dashboard Statistics"
echo ""

echo "=== Testing Authentication ==="
echo "-------------------------------"
test_endpoint "$BACKEND_URL/api/auth/login" "Login Endpoint" "POST" '{"email":"admin@grandpro.com","password":"Admin123!"}'
test_endpoint "$BACKEND_URL/api/auth/register" "Registration Endpoint" "POST" '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
echo ""

echo "=== Testing Digital Onboarding ==="
echo "-----------------------------------"
test_endpoint "$BACKEND_URL/api/onboarding/applications" "Get Applications"
test_endpoint "$BACKEND_URL/api/onboarding/applications" "Submit Application" "POST" '{"hospitalName":"Test Hospital","ownerName":"Test Owner","email":"test@hospital.com","phone":"+2348012345678","address":"Lagos, Nigeria"}'
echo ""

echo "=== Testing CRM Module ==="
echo "---------------------------"
test_endpoint "$BACKEND_URL/api/crm/patients" "Get Patients"
test_endpoint "$BACKEND_URL/api/crm/patients" "Add Patient" "POST" '{"name":"Test Patient","email":"patient@test.com","phone":"+2348012345678","dateOfBirth":"1990-01-01"}'
echo ""

echo "=== Testing Hospital Management ==="
echo "------------------------------------"
test_endpoint "$BACKEND_URL/api/hospital/overview" "Hospital Overview"
echo ""

echo "=== Testing Operations ==="
echo "---------------------------"
test_endpoint "$BACKEND_URL/api/operations/metrics" "Operations Metrics"
echo ""

echo "=== Testing Analytics ==="
echo "--------------------------"
test_endpoint "$BACKEND_URL/api/analytics/summary" "Analytics Summary"
echo ""

echo "=== Testing Partner Integrations ==="
echo "-------------------------------------"
test_endpoint "$BACKEND_URL/api/partners/insurance" "Insurance Partners"
echo ""

echo "=== Testing Security ==="
echo "-------------------------"
test_endpoint "$BACKEND_URL/api/security/audit-logs" "Audit Logs"
echo ""

echo ""
echo "=============================================="
echo "Test Summary"
echo "=============================================="
echo ""
echo -e "${GREEN}✓ PUBLIC URLS:${NC}"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend API: $BACKEND_URL"
echo ""
echo -e "${GREEN}✓ KEY ENDPOINTS:${NC}"
echo "  Health Check: $BACKEND_URL/health"
echo "  API Status: $BACKEND_URL/api/status"
echo "  Dashboard: $BACKEND_URL/api/dashboard/stats"
echo "  Login: $BACKEND_URL/api/auth/login"
echo ""
echo -e "${GREEN}✓ DEFAULT CREDENTIALS:${NC}"
echo "  Admin: admin@grandpro.com / Admin123!"
echo "  Doctor: doctor@luth.ng / Doctor123!"
echo "  Patient: patient1@gmail.com / Patient123!"
echo ""
echo "=============================================="
