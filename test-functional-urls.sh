#!/bin/bash

# Test only the functional public URLs
BASE_URL="https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so"
GREEN='\033[0;32m'
NC='\033[0m'

echo "========================================"
echo "Testing FUNCTIONAL GrandPro HMSO URLs"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

# Array of functional endpoints
endpoints=(
    "/ Frontend"
    "/health Health_Check"
    "/api/hospitals Hospitals_List"
    "/api/crm/owners Hospital_Owners"
    "/api/crm/patients Patient_List"
    "/api/operations/alerts System_Alerts"
    "/api/operations/projects Project_Management"
    "/api/insurance/providers Insurance_Providers"
)

echo "Testing all functional endpoints..."
echo ""

for endpoint in "${endpoints[@]}"; do
    url=$(echo $endpoint | cut -d' ' -f1)
    name=$(echo $endpoint | cut -d' ' -f2)
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$url")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} $name: $BASE_URL$url"
    fi
done

echo ""
echo "========================================"
echo "Sample API Calls:"
echo ""

echo "1. Get Hospitals:"
echo "   curl $BASE_URL/api/hospitals | jq '.hospitals[0]'"
echo ""

echo "2. Get Health Status:"
echo "   curl $BASE_URL/health | jq"
echo ""

echo "3. Get Hospital Owners:"
echo "   curl $BASE_URL/api/crm/owners | jq '.data[0]'"
echo ""

echo "4. Get Patients:"
echo "   curl $BASE_URL/api/crm/patients | jq '.data[0]'"
echo ""

echo "========================================"
