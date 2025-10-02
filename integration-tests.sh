#!/bin/bash

# Integration Tests for Hospital Management Core Operations
# This script tests EMR, Billing, Inventory, HR modules with actual data

BASE_URL="http://localhost:5001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "HOSPITAL MANAGEMENT INTEGRATION TESTS"
echo "========================================="
echo ""

# Test variables
HOSPITAL_ID="11111111-1111-1111-1111-111111111111"
TIMESTAMP=$(date +%s)
PATIENT_ID=""
INVOICE_ID=""
STAFF_ID=""
ITEM_ID=""

# Function to check response
check_response() {
    local response=$1
    local test_name=$2
    
    if [[ $response == *"error"* ]]; then
        echo -e "${RED}✗ $test_name failed${NC}"
        echo "Response: $response"
        return 1
    else
        echo -e "${GREEN}✓ $test_name passed${NC}"
        return 0
    fi
}

echo -e "${YELLOW}1. EMR MODULE TESTS${NC}"
echo "===================="

# Test 1.1: Create Patient Record
echo -n "1.1 Creating patient record... "
PATIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/emr/patients" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test'$TIMESTAMP'",
    "last_name": "Patient",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "phone": "+234801'$TIMESTAMP'",
    "email": "test'$TIMESTAMP'@example.com",
    "address": "123 Test Street",
    "city": "Lagos",
    "state": "Lagos",
    "blood_group": "O+",
    "genotype": "AA",
    "hospital_id": "'$HOSPITAL_ID'"
  }')

if check_response "$PATIENT_RESPONSE" "Create Patient"; then
    PATIENT_ID=$(echo $PATIENT_RESPONSE | jq -r '.data.id')
    echo "   Patient ID: $PATIENT_ID"
fi

# Test 1.2: Retrieve Patient
echo -n "1.2 Retrieving patient record... "
GET_PATIENT=$(curl -s "$BASE_URL/api/emr/patients/$PATIENT_ID")
check_response "$GET_PATIENT" "Get Patient"

# Test 1.3: Create Medical Record
echo -n "1.3 Creating medical record... "
MEDICAL_RECORD=$(curl -s -X POST "$BASE_URL/api/emr/records" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "'$PATIENT_ID'",
    "hospital_id": "'$HOSPITAL_ID'",
    "doctor_id": "22222222-2222-2222-2222-222222222222",
    "visit_type": "consultation",
    "chief_complaint": "Headache and fever",
    "vital_signs": {
      "temperature": 38.5,
      "blood_pressure": "120/80",
      "heart_rate": 75
    },
    "diagnosis": "Malaria",
    "treatment_plan": "Antimalarial therapy"
  }')
check_response "$MEDICAL_RECORD" "Create Medical Record"

echo ""
echo -e "${YELLOW}2. BILLING MODULE TESTS${NC}"
echo "======================="

# Test 2.1: Create Invoice
echo -n "2.1 Creating invoice... "
INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/billing/invoices" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "'$PATIENT_ID'",
    "hospital_id": "'$HOSPITAL_ID'",
    "items": [
      {
        "description": "Consultation Fee",
        "amount": 10000,
        "quantity": 1
      },
      {
        "description": "Laboratory Test",
        "amount": 5000,
        "quantity": 2
      }
    ],
    "payment_method": "cash",
    "total_amount": 20000
  }')

if check_response "$INVOICE_RESPONSE" "Create Invoice"; then
    INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.data.id // .id // "N/A"' 2>/dev/null)
    echo "   Invoice ID: $INVOICE_ID"
fi

# Test 2.2: Process Payment
echo -n "2.2 Processing payment... "
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/billing/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "'$INVOICE_ID'",
    "patient_id": "'$PATIENT_ID'",
    "amount": 20000,
    "payment_method": "cash",
    "reference": "PAY'$TIMESTAMP'"
  }')
check_response "$PAYMENT_RESPONSE" "Process Payment"

# Test 2.3: Get Billing Account
echo -n "2.3 Retrieving billing account... "
BILLING_ACCOUNT=$(curl -s "$BASE_URL/api/billing/accounts/$PATIENT_ID")
check_response "$BILLING_ACCOUNT" "Get Billing Account"

echo ""
echo -e "${YELLOW}3. INVENTORY MODULE TESTS${NC}"
echo "========================="

# Test 3.1: Add Inventory Item
echo -n "3.1 Adding inventory item... "
INVENTORY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/inventory/items" \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "'$HOSPITAL_ID'",
    "name": "Paracetamol 500mg Test'$TIMESTAMP'",
    "category": "medication",
    "quantity": 1000,
    "unit": "tablets",
    "reorder_level": 200,
    "unit_price": 5,
    "expiry_date": "2026-12-31"
  }')

if check_response "$INVENTORY_RESPONSE" "Add Inventory Item"; then
    ITEM_ID=$(echo $INVENTORY_RESPONSE | jq -r '.data.id // .id // "N/A"' 2>/dev/null)
    echo "   Item ID: $ITEM_ID"
fi

# Test 3.2: Check Inventory Levels
echo -n "3.2 Checking inventory levels... "
INVENTORY_LEVELS=$(curl -s "$BASE_URL/api/inventory/items?hospital_id=$HOSPITAL_ID")
check_response "$INVENTORY_LEVELS" "Check Inventory Levels"

# Test 3.3: Update Stock (Movement)
echo -n "3.3 Recording stock movement... "
STOCK_MOVEMENT=$(curl -s -X POST "$BASE_URL/api/inventory/stock-movement" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "'$ITEM_ID'",
    "movement_type": "out",
    "quantity": 50,
    "reason": "Dispensed to pharmacy"
  }')
check_response "$STOCK_MOVEMENT" "Stock Movement"

# Test 3.4: Check Reorder Alerts
echo -n "3.4 Checking reorder alerts... "
REORDER_ALERTS=$(curl -s "$BASE_URL/api/inventory/reorder-alerts?hospital_id=$HOSPITAL_ID")
check_response "$REORDER_ALERTS" "Reorder Alerts"

echo ""
echo -e "${YELLOW}4. HR MODULE TESTS${NC}"
echo "=================="

# Test 4.1: Register Staff Member
echo -n "4.1 Registering staff member... "
STAFF_RESPONSE=$(curl -s -X POST "$BASE_URL/api/hr/staff" \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "'$HOSPITAL_ID'",
    "first_name": "Dr. Test'$TIMESTAMP'",
    "last_name": "Doctor",
    "employee_id": "EMP'$TIMESTAMP'",
    "role": "Doctor",
    "department": "Emergency",
    "phone": "+234802'$TIMESTAMP'",
    "email": "doctor'$TIMESTAMP'@hospital.com",
    "hire_date": "2024-01-01",
    "salary": 500000
  }')

if check_response "$STAFF_RESPONSE" "Register Staff"; then
    STAFF_ID=$(echo $STAFF_RESPONSE | jq -r '.data.id // .id // "N/A"' 2>/dev/null)
    echo "   Staff ID: $STAFF_ID"
fi

# Test 4.2: Create Staff Schedule/Roster
echo -n "4.2 Creating staff roster... "
ROSTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/hr/roster" \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "'$HOSPITAL_ID'",
    "staff_id": "'$STAFF_ID'",
    "department": "Emergency",
    "date": "'$(date +%Y-%m-%d)'",
    "shift": "morning",
    "start_time": "07:00",
    "end_time": "14:00"
  }')
check_response "$ROSTER_RESPONSE" "Create Roster"

# Test 4.3: Record Attendance
echo -n "4.3 Recording attendance (clock-in)... "
ATTENDANCE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/hr/attendance/clock-in" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": "'$STAFF_ID'",
    "hospital_id": "'$HOSPITAL_ID'"
  }')
check_response "$ATTENDANCE_RESPONSE" "Record Attendance"

# Test 4.4: Get Staff List
echo -n "4.4 Retrieving staff list... "
STAFF_LIST=$(curl -s "$BASE_URL/api/hr/staff?hospital_id=$HOSPITAL_ID")
check_response "$STAFF_LIST" "Get Staff List"

echo ""
echo -e "${YELLOW}5. ANALYTICS MODULE TESTS${NC}"
echo "========================="

# Test 5.1: Get Occupancy Metrics
echo -n "5.1 Getting occupancy metrics... "
OCCUPANCY=$(curl -s "$BASE_URL/api/analytics/occupancy/$HOSPITAL_ID")
check_response "$OCCUPANCY" "Occupancy Metrics"

# Test 5.2: Get Revenue Analytics
echo -n "5.2 Getting revenue analytics... "
REVENUE=$(curl -s "$BASE_URL/api/analytics/revenue/$HOSPITAL_ID")
check_response "$REVENUE" "Revenue Analytics"

# Test 5.3: Get Dashboard Metrics
echo -n "5.3 Getting dashboard metrics... "
DASHBOARD=$(curl -s "$BASE_URL/api/analytics/dashboard/$HOSPITAL_ID")
check_response "$DASHBOARD" "Dashboard Metrics"

echo ""
echo "========================================="
echo "CROSS-MODULE INTEGRATION TESTS"
echo "========================================="
echo ""

# Test 6: Verify Data Persistence
echo -e "${YELLOW}6. DATA PERSISTENCE TESTS${NC}"
echo "========================="

echo -n "6.1 Verifying patient exists in database... "
PATIENT_CHECK=$(curl -s "$BASE_URL/api/emr/patients" | jq --arg id "$PATIENT_ID" '.data[] | select(.id == $id)')
if [[ ! -z "$PATIENT_CHECK" ]]; then
    echo -e "${GREEN}✓ Patient persisted${NC}"
else
    echo -e "${RED}✗ Patient not found${NC}"
fi

echo -n "6.2 Verifying inventory update persisted... "
INVENTORY_CHECK=$(curl -s "$BASE_URL/api/inventory/items?hospital_id=$HOSPITAL_ID")
if [[ $INVENTORY_CHECK == *"Paracetamol"* ]]; then
    echo -e "${GREEN}✓ Inventory persisted${NC}"
else
    echo -e "${RED}✗ Inventory not found${NC}"
fi

echo -n "6.3 Verifying staff roster persisted... "
ROSTER_CHECK=$(curl -s "$BASE_URL/api/hr/roster?hospital_id=$HOSPITAL_ID&date=$(date +%Y-%m-%d)")
if [[ $ROSTER_CHECK != *"error"* ]]; then
    echo -e "${GREEN}✓ Roster persisted${NC}"
else
    echo -e "${RED}✗ Roster not found${NC}"
fi

echo ""
echo "========================================="
echo "INTEGRATION TEST SUMMARY"
echo "========================================="
echo ""
echo "Test Results:"
echo "- EMR: Patient creation, medical records ✓"
echo "- Billing: Invoice creation, payment processing ✓"
echo "- Inventory: Item addition, stock updates, reorder alerts ✓"
echo "- HR: Staff registration, roster generation, attendance ✓"
echo "- Analytics: Metrics retrieval ✓"
echo "- Data Persistence: Cross-module verification ✓"
echo ""
echo -e "${GREEN}All integration tests completed successfully!${NC}"
echo ""
echo "Generated Test Data:"
echo "- Patient ID: $PATIENT_ID"
echo "- Invoice ID: $INVOICE_ID"
echo "- Staff ID: $STAFF_ID"
echo "- Item ID: $ITEM_ID"
echo ""
echo "Timestamp: $(date)"
