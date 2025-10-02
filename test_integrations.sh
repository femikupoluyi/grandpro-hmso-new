#!/bin/bash

# Partner Integration Test Script
# Tests Insurance/HMO, Pharmacy, and Telemedicine connectors

BASE_URL="https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/api"

echo "=========================================="
echo "TESTING PARTNER INTEGRATIONS"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "${BASE_URL}${endpoint}" -H "Content-Type: application/json")
    else
        response=$(curl -s -X POST "${BASE_URL}${endpoint}" -H "Content-Type: application/json" -d "${data}")
    fi
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        echo "Response: $(echo $response | jq -r '.message // "Success"' 2>/dev/null || echo "Success")"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        ((FAILED++))
    fi
    echo ""
}

echo "1. INSURANCE/HMO INTEGRATION TESTS"
echo "-----------------------------------"

# Test 1.1: Check eligibility
test_endpoint "GET" "/insurance/eligibility/PAT001?providerId=NHIS" "" \
    "Check patient eligibility with NHIS"

# Test 1.2: Submit insurance claim
claim_data='{
    "patientId": "PAT001",
    "providerId": "NHIS",
    "amount": 25000,
    "services": ["Consultation", "Lab Test"],
    "diagnosisCodes": ["A01.0", "B02.1"]
}'
test_endpoint "POST" "/insurance/claims/submit" "$claim_data" \
    "Submit insurance claim to NHIS"

# Test 1.3: Check claim status
test_endpoint "GET" "/insurance/claims/status/CLM-12345" "" \
    "Check claim status"

# Test 1.4: Request pre-authorization
preauth_data='{
    "patientId": "PAT001",
    "procedure": "Surgery",
    "estimatedCost": 500000
}'
test_endpoint "POST" "/insurance/preauth" "$preauth_data" \
    "Request pre-authorization for surgery"

echo "2. PHARMACY INTEGRATION TESTS"
echo "------------------------------"

# Test 2.1: Check drug availability
test_endpoint "GET" "/pharmacy/availability/DRUG001?supplierId=emzor" "" \
    "Check drug availability from Emzor"

# Test 2.2: Submit restock order
restock_data='{
    "drugId": "DRUG001",
    "drugName": "Paracetamol 500mg",
    "quantity": 1000,
    "supplierId": "emzor"
}'
test_endpoint "POST" "/pharmacy/restock" "$restock_data" \
    "Submit restock order for Paracetamol"

# Test 2.3: Set auto-reorder rule
autoreorder_data='{
    "drugId": "DRUG001",
    "minimumStock": 100,
    "reorderQuantity": 500,
    "supplierId": "emzor"
}'
test_endpoint "POST" "/pharmacy/auto-reorder" "$autoreorder_data" \
    "Set auto-reorder rule for Paracetamol"

# Test 2.4: Check order status
test_endpoint "GET" "/pharmacy/orders/ORD-12345" "" \
    "Check pharmacy order status"

# Test 2.5: Get supplier catalog
test_endpoint "GET" "/pharmacy/catalog?supplierId=emzor" "" \
    "Get Emzor supplier catalog"

echo "3. TELEMEDICINE INTEGRATION TESTS"
echo "----------------------------------"

# Test 3.1: Schedule consultation
consultation_data='{
    "patientId": "PAT001",
    "doctorId": "DOC001",
    "dateTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "type": "video",
    "reason": "General Consultation"
}'
test_endpoint "POST" "/telemedicine/consultations/schedule" "$consultation_data" \
    "Schedule video consultation"

# Test 3.2: Start video session
session_data='{
    "consultationId": "CONS-12345",
    "patientId": "PAT001",
    "doctorId": "DOC001"
}'
test_endpoint "POST" "/telemedicine/sessions/start" "$session_data" \
    "Start telemedicine video session"

# Test 3.3: End session
end_session_data='{
    "notes": "Patient consulted for general checkup",
    "prescription": [],
    "followUp": null
}'
test_endpoint "POST" "/telemedicine/sessions/SESS-12345/end" "$end_session_data" \
    "End telemedicine session"

# Test 3.4: Get available doctors
test_endpoint "GET" "/telemedicine/doctors/available" "" \
    "Get list of available doctors"

# Test 3.5: Submit prescription
prescription_data='{
    "consultationId": "CONS-12345",
    "patientId": "PAT001",
    "doctorId": "DOC001",
    "medications": [
        {
            "name": "Paracetamol 500mg",
            "dosage": "1 tablet",
            "frequency": "Three times daily",
            "duration": "5 days",
            "instructions": "Take after meals"
        }
    ]
}'
test_endpoint "POST" "/telemedicine/prescriptions" "$prescription_data" \
    "Submit digital prescription"

# Test 3.6: Get consultation history
test_endpoint "GET" "/telemedicine/consultations/history/PAT001" "" \
    "Get patient consultation history"

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}ALL PARTNER INTEGRATION TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the responses above.${NC}"
    exit 1
fi
