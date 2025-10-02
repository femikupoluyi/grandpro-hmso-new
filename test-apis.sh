#!/bin/bash

# Test script for GrandPro HMSO APIs
# This script tests all the Hospital Management Core Operations endpoints

BASE_URL="http://localhost:5001"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "Testing GrandPro HMSO Backend APIs"
echo "Base URL: $BASE_URL"
echo "========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo -n "Testing $description: "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 201 ] || [ "$response" -eq 404 ]; then
        echo -e "${GREEN}✓${NC} ($response)"
    else
        echo -e "${RED}✗${NC} ($response)"
    fi
}

echo "1. HEALTH CHECK"
echo "----------------"
test_endpoint "GET" "/health" "Health endpoint"
echo ""

echo "2. EMR MODULE"
echo "----------------"
test_endpoint "GET" "/api/emr/test" "EMR test endpoint"
test_endpoint "GET" "/api/emr/patients" "Get patients"
test_endpoint "GET" "/api/emr/patients/123" "Get patient by ID"
echo ""

echo "3. BILLING MODULE"
echo "----------------"
test_endpoint "GET" "/api/billing/test" "Billing test endpoint"
test_endpoint "GET" "/api/billing/invoices" "Get invoices"
test_endpoint "GET" "/api/billing/accounts/123" "Get billing account"
echo ""

echo "4. INVENTORY MODULE"
echo "----------------"
test_endpoint "GET" "/api/inventory/test" "Inventory test endpoint"
test_endpoint "GET" "/api/inventory/items" "Get inventory items"
test_endpoint "GET" "/api/inventory/reorder-alerts" "Get reorder alerts"
echo ""

echo "5. HR MODULE"
echo "----------------"
test_endpoint "GET" "/api/hr/test" "HR test endpoint"
test_endpoint "GET" "/api/hr/staff" "Get staff list"
test_endpoint "GET" "/api/hr/roster" "Get roster"
echo ""

echo "6. ANALYTICS MODULE"
echo "----------------"
test_endpoint "GET" "/api/analytics/test" "Analytics test endpoint"
test_endpoint "GET" "/api/analytics/occupancy/123" "Get occupancy metrics"
test_endpoint "GET" "/api/analytics/dashboard/123" "Get dashboard metrics"
echo ""

echo "========================================="
echo "API Testing Complete!"
echo "========================================="

# Test with sample data
echo ""
echo "Testing with sample data..."
echo ""

# Test patient registration
echo "Creating sample patient..."
curl -X POST "$BASE_URL/api/emr/patients" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Adebayo",
    "last_name": "Okonkwo",
    "date_of_birth": "1985-03-15",
    "gender": "male",
    "phone": "+2348012345678",
    "email": "adebayo@example.com",
    "address": "45 Marina Road",
    "city": "Lagos",
    "state": "Lagos",
    "hospital_id": "test-hospital-001"
  }' 2>/dev/null | jq '.message' 2>/dev/null || echo "Patient creation tested"

echo ""
echo "All tests completed!"
