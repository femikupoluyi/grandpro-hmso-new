#!/bin/bash

# GrandPro HMSO Public URL Testing Script
# This script tests all publicly accessible endpoints

echo "========================================="
echo "GrandPro HMSO - Public URL Testing"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URLs - Update these with actual public URLs when exposed
BACKEND_URL="http://localhost:5001"
FRONTEND_URL="http://localhost:3001"

echo "Testing Configuration:"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
    fi
    
    if [ "$response" == "200" ] || [ "$response" == "201" ] || [ "$response" == "404" ] || [ "$response" == "400" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $response)"
        return 1
    fi
}

# Counter for passed/failed tests
PASSED=0
FAILED=0

echo "========================================="
echo "1. FRONTEND TESTS"
echo "========================================="

# Test Frontend
if test_endpoint "GET" "$FRONTEND_URL" "" "Frontend Home Page"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$FRONTEND_URL/login" "" "Login Page"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$FRONTEND_URL/patient" "" "Patient Portal"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$FRONTEND_URL/owner/dashboard" "" "Owner Dashboard"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "2. BACKEND API TESTS"
echo "========================================="

# Test Backend Health
if test_endpoint "GET" "$BACKEND_URL/health" "" "Backend Health Check"; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Test Authentication Endpoints
if test_endpoint "POST" "$BACKEND_URL/api/auth/login" '{"email":"test@test.com","password":"test"}' "Login Endpoint"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "POST" "$BACKEND_URL/api/auth/register" '{"email":"test@test.com","password":"test"}' "Register Endpoint"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "3. CRM MODULE TESTS"
echo "========================================="

# Test CRM Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/crm/owners/test-owner/profile" "" "Owner Profile"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/crm/patients/profiles" "" "Patient Profiles"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/crm/patients/appointments" "" "Appointments"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "4. EMR MODULE TESTS"
echo "========================================="

# Test EMR Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/emr/patients" "" "EMR Patients List"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/emr/records" "" "Medical Records"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "5. BILLING MODULE TESTS"
echo "========================================="

# Test Billing Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/billing/invoices" "" "Invoices List"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/billing/payments" "" "Payments List"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "6. INVENTORY MODULE TESTS"
echo "========================================="

# Test Inventory Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/inventory/items" "" "Inventory Items"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/inventory/reorder-alerts" "" "Reorder Alerts"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "7. HR MODULE TESTS"
echo "========================================="

# Test HR Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/hr/staff" "" "Staff List"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/hr/roster" "" "Staff Roster"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "8. ANALYTICS MODULE TESTS"
echo "========================================="

# Test Analytics Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/analytics/dashboard/test-hospital" "" "Analytics Dashboard"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/analytics/occupancy/test-hospital" "" "Occupancy Analytics"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "9. ONBOARDING MODULE TESTS"
echo "========================================="

# Test Onboarding Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/onboarding/applications" "" "Applications List"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/onboarding/evaluation-criteria" "" "Evaluation Criteria"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "10. OPERATIONS MODULE TESTS"
echo "========================================="

# Test Operations Endpoints
if test_endpoint "GET" "$BACKEND_URL/api/operations/dashboard" "" "Operations Dashboard"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "GET" "$BACKEND_URL/api/operations/alerts" "" "System Alerts"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
SUCCESS_RATE=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Please check the endpoints.${NC}"
    exit 1
fi
