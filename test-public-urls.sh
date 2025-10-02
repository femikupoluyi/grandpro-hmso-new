#!/bin/bash

echo "======================================"
echo "Testing GrandPro HMSO Public URLs"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Frontend URL
FRONTEND_URL="https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so"
# Backend URL
BACKEND_URL="https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so"

echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""

# Test Frontend
echo "Testing Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Frontend is accessible (HTTP $FRONTEND_STATUS)${NC}"
    
    # Check if HTML is returned
    FRONTEND_CONTENT=$(curl -s $FRONTEND_URL | head -c 100)
    if [[ "$FRONTEND_CONTENT" == *"<!DOCTYPE html>"* ]]; then
        echo -e "${GREEN}✓ Frontend returns valid HTML${NC}"
    else
        echo -e "${RED}✗ Frontend does not return valid HTML${NC}"
    fi
else
    echo -e "${RED}✗ Frontend is not accessible (HTTP $FRONTEND_STATUS)${NC}"
fi

echo ""

# Test Backend API endpoints
echo "Testing Backend API..."

# Test hospitals endpoint
echo "  Testing /api/hospitals..."
HOSPITALS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/hospitals)
if [ "$HOSPITALS_STATUS" -eq 200 ]; then
    echo -e "  ${GREEN}✓ /api/hospitals endpoint is accessible (HTTP $HOSPITALS_STATUS)${NC}"
    
    # Check if JSON is returned
    HOSPITALS_JSON=$(curl -s $BACKEND_URL/api/hospitals)
    if echo "$HOSPITALS_JSON" | python3 -m json.tool > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ /api/hospitals returns valid JSON${NC}"
        
        # Show hospital count
        HOSPITAL_COUNT=$(echo "$HOSPITALS_JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('hospitals', [])))" 2>/dev/null)
        echo -e "  ${GREEN}  → Found $HOSPITAL_COUNT hospitals${NC}"
    else
        echo -e "  ${RED}✗ /api/hospitals does not return valid JSON${NC}"
    fi
else
    echo -e "  ${RED}✗ /api/hospitals endpoint is not accessible (HTTP $HOSPITALS_STATUS)${NC}"
fi

echo ""

# Test users endpoint
echo "  Testing /api/users..."
USERS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/users)
if [ "$USERS_STATUS" -eq 200 ]; then
    echo -e "  ${GREEN}✓ /api/users endpoint is accessible (HTTP $USERS_STATUS)${NC}"
else
    echo -e "  ${RED}✗ /api/users endpoint returned (HTTP $USERS_STATUS)${NC}"
fi

echo ""

# Test operations dashboard endpoint
echo "  Testing /api/operations/dashboard..."
OPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/operations/dashboard)
if [ "$OPS_STATUS" -eq 200 ]; then
    echo -e "  ${GREEN}✓ /api/operations/dashboard endpoint is accessible (HTTP $OPS_STATUS)${NC}"
    
    # Check if JSON is returned
    OPS_JSON=$(curl -s $BACKEND_URL/api/operations/dashboard)
    if echo "$OPS_JSON" | python3 -m json.tool > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ /api/operations/dashboard returns valid JSON${NC}"
    else
        echo -e "  ${RED}✗ /api/operations/dashboard does not return valid JSON${NC}"
    fi
else
    echo -e "  ${RED}✗ /api/operations/dashboard endpoint returned (HTTP $OPS_STATUS)${NC}"
fi

echo ""

# Test projects endpoint
echo "  Testing /api/operations/projects..."
PROJECTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/operations/projects)
if [ "$PROJECTS_STATUS" -eq 200 ]; then
    echo -e "  ${GREEN}✓ /api/operations/projects endpoint is accessible (HTTP $PROJECTS_STATUS)${NC}"
else
    echo -e "  ${RED}✗ /api/operations/projects endpoint returned (HTTP $PROJECTS_STATUS)${NC}"
fi

echo ""

# Test CRM endpoints
echo "  Testing /api/crm/owners..."
CRM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/crm/owners)
if [ "$CRM_STATUS" -eq 200 ]; then
    echo -e "  ${GREEN}✓ /api/crm/owners endpoint is accessible (HTTP $CRM_STATUS)${NC}"
else
    echo -e "  ${RED}✗ /api/crm/owners endpoint returned (HTTP $CRM_STATUS)${NC}"
fi

echo ""

# Test sourcing endpoints
echo "  Testing /api/sourcing/applications..."
SOURCING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/sourcing/applications)
if [ "$SOURCING_STATUS" -eq 200 ] || [ "$SOURCING_STATUS" -eq 401 ]; then
    echo -e "  ${GREEN}✓ /api/sourcing/applications endpoint is accessible (HTTP $SOURCING_STATUS)${NC}"
else
    echo -e "  ${RED}✗ /api/sourcing/applications endpoint returned (HTTP $SOURCING_STATUS)${NC}"
fi

echo ""

# Test CORS headers
echo "Testing CORS headers..."
CORS_HEADERS=$(curl -s -I -X OPTIONS $BACKEND_URL/api/hospitals 2>/dev/null | grep -i "access-control")
if [[ ! -z "$CORS_HEADERS" ]]; then
    echo -e "${GREEN}✓ CORS headers are present${NC}"
    echo "$CORS_HEADERS" | sed 's/^/    /'
else
    echo -e "${RED}✗ CORS headers are not present${NC}"
fi

echo ""
echo "======================================"
echo "Test Complete!"
echo ""

# Summary
echo "Public URLs Summary:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend API: $BACKEND_URL"
echo ""
echo "Key Endpoints:"
echo "  - Dashboard: $FRONTEND_URL/dashboard"
echo "  - Command Centre: $FRONTEND_URL/operations"
echo "  - Hospital Management: $FRONTEND_URL/hospitals"
echo "  - CRM: $FRONTEND_URL/crm"
echo "  - Projects: $FRONTEND_URL/operations/projects"
echo "======================================"
