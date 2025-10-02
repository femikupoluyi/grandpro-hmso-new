#!/bin/bash

# Test Analytics and ML Endpoints

BASE_URL="https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/api/data-analytics"

echo "=========================================="
echo "TESTING DATA ANALYTICS & ML SERVICES"
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
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        ((FAILED++))
    fi
    echo ""
}

echo "1. ETL PIPELINE TESTS"
echo "---------------------"

# Test ETL status
test_endpoint "GET" "/etl/status" "" \
    "Get ETL pipeline status"

echo "2. PREDICTIVE ANALYTICS TESTS"
echo "------------------------------"

# Get first hospital ID for testing
HOSPITAL_ID="2e5900f8-f2b9-4f62-bb16-8c3f41d4f08c"

# Test drug demand forecasting
forecast_data='{
    "hospitalId": "'$HOSPITAL_ID'",
    "drugId": "DRUG001",
    "days": 30
}'
test_endpoint "POST" "/forecast/drug-demand" "$forecast_data" \
    "Forecast drug demand for Paracetamol"

# Test patient risk scoring
risk_data='{
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "riskCategory": "readmission"
}'
test_endpoint "POST" "/risk-score/patient" "$risk_data" \
    "Calculate patient risk score"

# Test fraud detection
fraud_data='{
    "entityType": "claim",
    "entityId": "CLM-TEST-001",
    "transactionData": {
        "patientId": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 150000,
        "services": ["Surgery", "Lab Tests", "Medication"]
    }
}'
test_endpoint "POST" "/fraud/detect" "$fraud_data" \
    "Detect fraudulent insurance claim"

# Test triage bot
triage_data='{
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "symptoms": ["chest pain", "shortness of breath", "dizziness"]
}'
test_endpoint "POST" "/triage/predict" "$triage_data" \
    "Triage patient with critical symptoms"

echo "3. ANALYTICS DASHBOARD TESTS"
echo "----------------------------"

# Test analytics dashboard
test_endpoint "GET" "/dashboard/$HOSPITAL_ID" "" \
    "Get analytics dashboard for hospital"

# Test data lake statistics
test_endpoint "GET" "/data-lake/stats" "" \
    "Get data lake statistics"

# Test ML model registry
test_endpoint "GET" "/models" "" \
    "Get ML model registry"

# Test fraud alerts
test_endpoint "GET" "/fraud/alerts?status=pending" "" \
    "Get pending fraud alerts"

echo "4. FORECASTING QUERIES"
echo "----------------------"

# Get drug demand forecasts
test_endpoint "GET" "/forecast/drug-demand/$HOSPITAL_ID" "" \
    "Get all drug demand forecasts for hospital"

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}ALL DATA ANALYTICS TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the responses above.${NC}"
    exit 1
fi
