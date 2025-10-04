#!/bin/bash

# Test All GrandPro HMSO API Endpoints

echo "======================================"
echo "Testing GrandPro HMSO API Endpoints"
echo "======================================"

# Base URL
BASE_URL="http://localhost"
API_URL="${BASE_URL}/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4
    local description=$5
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ -z "$data" ]; then
        if [ -z "$auth" ]; then
            response=$(curl -s -X $method "$API_URL$endpoint" -w "\n%{http_code}")
        else
            response=$(curl -s -X $method "$API_URL$endpoint" -H "Authorization: Bearer $auth" -w "\n%{http_code}")
        fi
    else
        if [ -z "$auth" ]; then
            response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}")
        else
            response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$data" -w "\n%{http_code}")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Success (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}⚠ Authentication/Authorization required (HTTP $http_code)${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
}

echo -e "\n${YELLOW}1. AUTHENTICATION ENDPOINTS${NC}"
echo "================================"

# Get auth token
echo "Getting authentication token..."
auth_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@grandpro.com","password":"Admin123!"}')

TOKEN=$(echo "$auth_response" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
else
    echo -e "${RED}✗ Authentication failed${NC}"
    echo "$auth_response"
    exit 1
fi

test_endpoint "GET" "/auth/profile" "" "$TOKEN" "Get user profile"

echo -e "\n${YELLOW}2. HOSPITAL MANAGEMENT ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/hospitals" "" "$TOKEN" "List all hospitals"
test_endpoint "GET" "/hospitals/1" "" "$TOKEN" "Get specific hospital"
test_endpoint "GET" "/hospitals/1/metrics" "" "$TOKEN" "Get hospital metrics"

echo -e "\n${YELLOW}3. PATIENT MANAGEMENT ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/patients" "" "$TOKEN" "List all patients"
test_endpoint "GET" "/medical-records" "" "$TOKEN" "List medical records"

echo -e "\n${YELLOW}4. ONBOARDING ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/onboarding/applications" "" "$TOKEN" "List applications"
test_endpoint "GET" "/onboarding/contracts" "" "$TOKEN" "List contracts"

echo -e "\n${YELLOW}5. CRM ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/crm/owners" "" "$TOKEN" "List hospital owners"
test_endpoint "GET" "/crm/communications" "" "$TOKEN" "List communications"
test_endpoint "GET" "/appointments" "" "$TOKEN" "List appointments"

echo -e "\n${YELLOW}6. BILLING ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/billing/invoices" "" "$TOKEN" "List invoices"
test_endpoint "GET" "/billing/payments" "" "$TOKEN" "List payments"

echo -e "\n${YELLOW}7. INVENTORY ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/inventory/items" "" "$TOKEN" "List inventory items"
test_endpoint "GET" "/inventory/categories" "" "$TOKEN" "List categories"

echo -e "\n${YELLOW}8. HR ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/hr/staff" "" "$TOKEN" "List staff members"
test_endpoint "GET" "/hr/schedules" "" "$TOKEN" "List schedules"

echo -e "\n${YELLOW}9. OPERATIONS ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/operations/dashboard" "" "$TOKEN" "Operations dashboard"
test_endpoint "GET" "/operations/alerts" "" "$TOKEN" "List alerts"
test_endpoint "GET" "/operations/analytics" "" "$TOKEN" "Analytics data"

echo -e "\n${YELLOW}10. PROJECT MANAGEMENT ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/projects" "" "$TOKEN" "List projects"

echo -e "\n${YELLOW}11. PARTNER INTEGRATION ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/insurance/providers" "" "$TOKEN" "List insurance providers"
test_endpoint "GET" "/insurance/claims" "" "$TOKEN" "List insurance claims"
test_endpoint "GET" "/pharmacy/suppliers" "" "$TOKEN" "List pharmacy suppliers"
test_endpoint "GET" "/pharmacy/orders" "" "$TOKEN" "List pharmacy orders"
test_endpoint "GET" "/telemedicine/status" "" "$TOKEN" "Telemedicine status"
test_endpoint "GET" "/telemedicine/sessions" "" "$TOKEN" "List telemedicine sessions"

echo -e "\n${YELLOW}12. ANALYTICS ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/analytics/hospital-performance" "" "$TOKEN" "Hospital performance"
test_endpoint "GET" "/analytics/predictive" "" "$TOKEN" "Predictive analytics"

echo -e "\n${YELLOW}13. SECURITY/AUDIT ENDPOINTS${NC}"
echo "================================"
test_endpoint "GET" "/audit/logs" "" "$TOKEN" "Audit logs"

echo -e "\n${YELLOW}14. PUBLIC ENDPOINTS (No Auth)${NC}"
echo "================================"
test_endpoint "GET" "/health" "" "" "Health check"

echo -e "\n======================================"
echo -e "${GREEN}Endpoint testing complete!${NC}"
echo "======================================"
