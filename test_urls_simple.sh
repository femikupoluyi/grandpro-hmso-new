#!/bin/bash

# Simple test script for GrandPro HMSO Platform URLs

echo "======================================"
echo "🏥 GrandPro HMSO Platform URL Tests"
echo "======================================"
echo ""

BACKEND_URL="https://grandpro-backend-morphvm-wz7xxc7v.http.cloud.morph.so"
FRONTEND_URL="https://grandpro-frontend-static-morphvm-wz7xxc7v.http.cloud.morph.so"

echo "📍 Testing Backend API..."
echo "URL: $BACKEND_URL"
echo ""

# Test backend health
echo "1. Testing Health Endpoint:"
curl -s "$BACKEND_URL/health" | head -100
echo ""
echo ""

# Test onboarding endpoint
echo "2. Testing Onboarding Registration:"
curl -X POST "$BACKEND_URL/api/onboarding/register" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerEmail": "test.owner'$(date +%s)'@hospital.ng",
    "ownerName": "Dr. Test Owner",
    "ownerPhone": "+2348012345678",
    "password": "TestPass123!",
    "hospitalName": "Test Hospital Lagos",
    "hospitalAddress": "123 Test Street, Lagos Island",
    "city": "Lagos",
    "state": "Lagos",
    "bedCapacity": 100,
    "staffCount": 50
  }' | head -200
echo ""
echo ""

echo "📍 Testing Frontend App..."
echo "URL: $FRONTEND_URL"
echo ""

# Test frontend
echo "3. Testing Frontend Access:"
curl -I "$FRONTEND_URL"
echo ""

echo "======================================"
echo "✅ Test Complete!"
echo "======================================"
echo ""
echo "🌐 Working URLs:"
echo "   Backend API: $BACKEND_URL"
echo "   Frontend App: $FRONTEND_URL"
echo ""
echo "📝 API Endpoints Available:"
echo "   - GET  $BACKEND_URL/health"
echo "   - POST $BACKEND_URL/api/onboarding/register"
echo "   - POST $BACKEND_URL/api/auth/login"
echo "   - GET  $BACKEND_URL/api/hospitals"
echo "   - GET  $BACKEND_URL/api/applications"
echo ""
