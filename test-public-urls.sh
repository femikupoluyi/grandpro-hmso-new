#!/bin/bash

# Test script for GrandPro HMSO Public URLs
BASE_URL="https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing GrandPro HMSO Public Endpoints"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local method=${3:-GET}
    
    echo -n "Testing $description ($method $endpoint)... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" -H "Content-Type: application/json")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "204" ]; then
        echo -e "${GREEN}✓ SUCCESS${NC} (HTTP $response)"
    elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo -e "${YELLOW}⚠ AUTH REQUIRED${NC} (HTTP $response)"
    elif [ "$response" = "404" ]; then
        echo -e "${RED}✗ NOT FOUND${NC} (HTTP $response)"
    else
        echo -e "${RED}✗ ERROR${NC} (HTTP $response)"
    fi
}

echo "=== Core Endpoints ==="
test_endpoint "/" "Frontend Homepage"
test_endpoint "/health" "Health Check"

echo ""
echo "=== Authentication & User Management ==="
test_endpoint "/api/auth/login" "Login" "POST"
test_endpoint "/api/auth/register" "Register" "POST"
test_endpoint "/api/users" "Users List"

echo ""
echo "=== Hospital Management ==="
test_endpoint "/api/hospitals" "Hospitals List"
test_endpoint "/api/hospitals/stats" "Hospital Statistics"
test_endpoint "/api/applications" "Applications List"
test_endpoint "/api/contracts" "Contracts List"

echo ""
echo "=== Digital Sourcing & Onboarding ==="
test_endpoint "/api/onboarding/applications" "Onboarding Applications"
test_endpoint "/api/onboarding/evaluation/criteria" "Evaluation Criteria"
test_endpoint "/api/dashboard/stats" "Dashboard Statistics"

echo ""
echo "=== CRM Module ==="
test_endpoint "/api/crm/owners" "Owner CRM"
test_endpoint "/api/crm/patients" "Patient CRM"
test_endpoint "/api/crm/campaigns" "Communication Campaigns"
test_endpoint "/api/crm/appointments" "Appointments"
test_endpoint "/api/crm/feedback" "Patient Feedback"

echo ""
echo "=== Core Operations ==="
test_endpoint "/api/emr/patients" "Electronic Medical Records"
test_endpoint "/api/billing/invoices" "Billing & Invoices"
test_endpoint "/api/inventory/items" "Inventory Management"
test_endpoint "/api/hr/staff" "HR & Staff Management"

echo ""
echo "=== Operations Command Centre ==="
test_endpoint "/api/operations/command-centre/overview" "Command Centre Overview"
test_endpoint "/api/operations/command-centre/metrics" "Performance Metrics"
test_endpoint "/api/operations/alerts" "System Alerts"
test_endpoint "/api/operations/projects" "Project Management"

echo ""
echo "=== Partner Integrations ==="
test_endpoint "/api/insurance/providers" "Insurance Providers"
test_endpoint "/api/pharmacy/suppliers" "Pharmacy Suppliers"
test_endpoint "/api/telemedicine/sessions" "Telemedicine Sessions"

echo ""
echo "=== Analytics & AI ==="
test_endpoint "/api/analytics/dashboard" "Analytics Dashboard"
test_endpoint "/api/analytics/predictions" "Predictive Analytics"
test_endpoint "/api/analytics/ml/triage" "AI Triage Bot"

echo ""
echo "=== Security & Compliance ==="
test_endpoint "/api/security/audit-logs" "Audit Logs"
test_endpoint "/api/security/compliance-status" "Compliance Status"

echo ""
echo "========================================"
echo "Public URL Test Complete"
echo "Main Application: $BASE_URL"
echo "API Documentation: $BASE_URL/api-docs (if available)"
echo "========================================"
