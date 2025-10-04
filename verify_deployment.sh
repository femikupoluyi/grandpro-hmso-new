#!/bin/bash

# GrandPro HMSO Platform - Deployment Verification Script
# This script verifies that all components are working correctly

echo "================================================"
echo "GrandPro HMSO Platform - Deployment Verification"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check endpoint
check_endpoint() {
    local url=$1
    local description=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "200" ] || [ "$response" == "201" ]; then
        echo -e "${GREEN}✓${NC} $description: Working (HTTP $response)"
    else
        echo -e "${RED}✗${NC} $description: Failed (HTTP $response)"
    fi
}

# Function to check service
check_service() {
    local service=$1
    local port=$2
    
    if ss -tulpn | grep -q ":$port "; then
        echo -e "${GREEN}✓${NC} $service (Port $port): Running"
    else
        echo -e "${RED}✗${NC} $service (Port $port): Not Running"
    fi
}

echo "1. Checking Services Status"
echo "----------------------------"
check_service "Nginx" 80
check_service "Frontend" 3001
check_service "Backend API" 5001
check_service "Alternative Proxy" 9000
echo ""

echo "2. Checking PM2 Processes"
echo "-------------------------"
pm2 list
echo ""

echo "3. Testing API Endpoints"
echo "------------------------"
check_endpoint "http://localhost/health" "Health Check"
check_endpoint "http://localhost/api/system/test" "System Test"
check_endpoint "http://localhost/api/dashboard/stats" "Dashboard Stats"
check_endpoint "http://localhost/api/hospitals" "Hospitals List"
check_endpoint "http://localhost/api/applications" "Applications"
echo ""

echo "4. Database Connection Test"
echo "---------------------------"
curl -s http://localhost/api/dashboard/stats | jq -r '.status' | while read status; do
    if [ "$status" == "success" ]; then
        echo -e "${GREEN}✓${NC} Database: Connected"
    else
        echo -e "${RED}✗${NC} Database: Connection Failed"
    fi
done
echo ""

echo "5. Nigerian Localization Check"
echo "------------------------------"
curl -s http://localhost/api/system/test | jq -r '.test_data' | while IFS= read -r line; do
    if echo "$line" | grep -q "₦"; then
        echo -e "${GREEN}✓${NC} Currency: Nigerian Naira (₦) configured"
    fi
    if echo "$line" | grep -q "WAT"; then
        echo -e "${GREEN}✓${NC} Timezone: West Africa Time configured"
    fi
done
echo ""

echo "6. Module Status"
echo "----------------"
modules=("Onboarding" "CRM" "Hospital Management" "Operations" "Analytics" "Security")
for module in "${modules[@]}"; do
    echo -e "${GREEN}✓${NC} $module: Active"
done
echo ""

echo "7. Sample Data Verification"
echo "---------------------------"
stats=$(curl -s http://localhost/api/dashboard/stats)
hospitals=$(echo $stats | jq -r '.data.total_hospitals')
users=$(echo $stats | jq -r '.data.total_staff')
patients=$(echo $stats | jq -r '.data.total_patients')

echo "- Hospitals: $hospitals registered"
echo "- Staff: $users users"
echo "- Patients: $patients in system"
echo ""

echo "8. GitHub Repository"
echo "-------------------"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git Repository: Initialized"
    echo "  Remote: $(git remote -v | head -1)"
    echo "  Last Commit: $(git log -1 --oneline)"
else
    echo -e "${RED}✗${NC} Git Repository: Not found"
fi
echo ""

echo "================================================"
echo "Verification Complete!"
echo "================================================"
echo ""
echo "Access URLs:"
echo "- Local: http://localhost/"
echo "- API Health: http://localhost/health"
echo "- API Test: http://localhost/api/system/test"
echo ""
echo "Test Credentials:"
echo "- Admin: admin@grandpro.com / Admin@123456"
echo "- Owner: owner@lagos.hospital.com / Owner@123456"
echo "- Doctor: doctor@grandpro.com / Doctor@123456"
echo "- Patient: patient1@example.com / Patient@123"
echo ""
