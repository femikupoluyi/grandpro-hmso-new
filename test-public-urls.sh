#!/bin/bash

# Test Public URLs for GrandPro HMSO

echo "======================================"
echo "Testing GrandPro HMSO Public URLs"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 5

# Test localhost
echo -e "\n${BLUE}=== Testing Localhost URLs ===${NC}"

echo -e "\n${YELLOW}1. Frontend (Port 80)${NC}"
if curl -s -I http://localhost/ | head -n 1 | grep "200 OK" > /dev/null; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible${NC}"
fi

echo -e "\n${YELLOW}2. API Health Check${NC}"
health_response=$(curl -s http://localhost/api/health)
if echo "$health_response" | grep -q "healthy"; then
    echo -e "${GREEN}✓ API Health check passed${NC}"
    echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
else
    echo -e "${RED}✗ API Health check failed${NC}"
fi

echo -e "\n${YELLOW}3. Authentication Test${NC}"
auth_response=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@grandpro.com","password":"Admin123!"}')

if echo "$auth_response" | grep -q "token"; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    TOKEN=$(echo "$auth_response" | jq -r '.token')
else
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi

echo -e "\n${BLUE}=== Testing Key API Endpoints ===${NC}"

# Test critical endpoints
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost/api/$endpoint")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ $description works (HTTP $http_code)${NC}"
        # Show first 3 lines of response
        echo "$body" | jq '.' 2>/dev/null | head -3
    else
        echo -e "${RED}✗ $description failed (HTTP $http_code)${NC}"
    fi
}

test_endpoint "hospitals" "Hospital List"
test_endpoint "patients" "Patient Management"
test_endpoint "appointments" "Appointment Scheduling"
test_endpoint "billing/invoices" "Billing System"
test_endpoint "inventory/items" "Inventory Management"
test_endpoint "hr/staff" "HR Management"
test_endpoint "operations/dashboard" "Operations Dashboard"
test_endpoint "insurance/providers" "Insurance Integration"
test_endpoint "pharmacy/suppliers" "Pharmacy Integration"
test_endpoint "telemedicine/status" "Telemedicine Module"
test_endpoint "data-analytics/hospital-performance" "Analytics"
test_endpoint "audit/logs" "Audit Logs"

echo -e "\n${BLUE}=== Testing Frontend Pages ===${NC}"

# Test main pages
test_page() {
    local path=$1
    local description=$2
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    if curl -s "http://localhost$path" | grep -q "GrandPro"; then
        echo -e "${GREEN}✓ $description page loads${NC}"
    else
        echo -e "${RED}✗ $description page failed${NC}"
    fi
}

test_page "/" "Homepage"
test_page "/login" "Login Page"
test_page "/dashboard" "Dashboard"
test_page "/hospitals" "Hospital Management"
test_page "/onboarding" "Partner Onboarding"
test_page "/crm" "CRM Module"
test_page "/operations" "Operations Centre"

echo -e "\n${BLUE}=== External Access Test ===${NC}"

# Check if ports are exposed
echo -e "\n${YELLOW}Port Exposure Status:${NC}"
netstat -tuln | grep -E ":(80|3001|5001|9000)" | while read line; do
    port=$(echo $line | grep -oE ":[0-9]+" | tail -1 | tr -d ":")
    echo -e "${GREEN}✓ Port $port is listening${NC}"
done

echo -e "\n${BLUE}=== Summary ===${NC}"

# Count running services
backend_running=$(ps aux | grep -c "[n]ode.*server.js")
frontend_running=$(ps aux | grep -c "[s]erve.*3001")
nginx_running=$(ps aux | grep -c "[n]ginx.*worker")

echo -e "\n${YELLOW}Service Status:${NC}"
[ $backend_running -gt 0 ] && echo -e "${GREEN}✓ Backend is running${NC}" || echo -e "${RED}✗ Backend is not running${NC}"
[ $frontend_running -gt 0 ] && echo -e "${GREEN}✓ Frontend is running${NC}" || echo -e "${RED}✗ Frontend is not running${NC}"
[ $nginx_running -gt 0 ] && echo -e "${GREEN}✓ Nginx is running${NC}" || echo -e "${RED}✗ Nginx is not running${NC}"

echo -e "\n${BLUE}=== Public Access URLs ===${NC}"
echo -e "${YELLOW}The application should be accessible at:${NC}"
echo -e "${GREEN}Main Application: http://localhost/${NC}"
echo -e "${GREEN}API Health: http://localhost/api/health${NC}"
echo -e "${GREEN}Login Credentials:${NC}"
echo "  Email: admin@grandpro.com"
echo "  Password: Admin123!"

echo -e "\n======================================"
echo -e "${GREEN}Testing complete!${NC}"
echo "======================================"
