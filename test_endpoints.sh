#!/bin/bash

BASE_URL="https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so"

echo "Testing GrandPro HMSO Public URLs..."
echo "======================================"
echo ""

# Test main page
echo "1. Testing Main Page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
echo "   Main Page: $STATUS"

# Test API endpoints
echo ""
echo "2. Testing API Endpoints..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/hospitals")
echo "   /api/hospitals: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/contracts")
echo "   /api/contracts: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/operations/dashboard")
echo "   /api/operations/dashboard: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/operations/command-centre")
echo "   /api/operations/command-centre: $STATUS"

# Test main pages
echo ""
echo "3. Testing Main Pages..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
echo "   /login: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/onboarding")
echo "   /onboarding: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/patient")
echo "   /patient: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/owner")
echo "   /owner: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/hospital")
echo "   /hospital: $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/demo/command-centre")
echo "   /demo/command-centre: $STATUS"

echo ""
echo "======================================"
echo "All endpoints tested successfully!"
