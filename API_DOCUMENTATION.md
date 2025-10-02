# GrandPro HMSO API Documentation

## Base URLs
- **Backend API**: http://localhost:5001 (Internal)
- **Frontend**: http://localhost:3000 (Internal)
- **External Backend**: Contact administrator for external URL
- **External Frontend**: Contact administrator for external URL

## Hospital Management Core Operations APIs

### 1. Electronic Medical Records (EMR) Module

#### Test Endpoint
```
GET /api/emr/test
```
Returns list of all available EMR endpoints

#### Patient Management
```
POST /api/emr/patients
Body: {
  "first_name": "Adewale",
  "last_name": "Ogundimu", 
  "date_of_birth": "1985-06-15",
  "gender": "male",
  "phone": "+2348012345678",
  "email": "adewale@example.com",
  "address": "123 Victoria Island",
  "city": "Lagos",
  "state": "Lagos",
  "hospital_id": "uuid"
}

GET /api/emr/patients?hospital_id=uuid&page=1&limit=20
GET /api/emr/patients/:id
GET /api/emr/patients/:id/history
```

#### Medical Records
```
POST /api/emr/records
Body: {
  "patient_id": "uuid",
  "hospital_id": "uuid",
  "doctor_id": "uuid",
  "visit_type": "consultation",
  "chief_complaint": "Headache and fever",
  "vital_signs": {
    "temperature": 38.5,
    "blood_pressure": "120/80",
    "heart_rate": 75,
    "weight": 70
  },
  "diagnosis": "Malaria",
  "treatment_plan": "Antimalarial medication"
}

GET /api/emr/records/:id
```

#### Prescriptions
```
POST /api/emr/prescriptions
Body: {
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "medical_record_id": "uuid",
  "medications": [
    {
      "name": "Artemether/Lumefantrine",
      "dosage": "20/120mg",
      "frequency": "Twice daily",
      "duration": "3 days"
    }
  ]
}

GET /api/emr/prescriptions/patient/:patientId
```

#### Laboratory
```
POST /api/emr/lab-requests
Body: {
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "tests": ["Complete Blood Count", "Malaria Parasite Test"],
  "urgency": "routine"
}

POST /api/emr/lab-results
Body: {
  "lab_request_id": "uuid",
  "results": {
    "Complete Blood Count": "Normal",
    "Malaria Parasite Test": "Positive"
  }
}

GET /api/emr/lab-results/patient/:patientId
```

### 2. Billing and Revenue Management Module

#### Test Endpoint
```
GET /api/billing/test
```

#### Billing Accounts
```
POST /api/billing/accounts
Body: {
  "patient_id": "uuid",
  "hospital_id": "uuid",
  "payment_method": "insurance",
  "insurance_provider": "AXA Mansard",
  "insurance_number": "INS123456"
}

GET /api/billing/accounts/:patientId
```

#### Invoicing
```
POST /api/billing/invoices
Body: {
  "patient_id": "uuid",
  "hospital_id": "uuid",
  "items": [
    {
      "description": "Consultation",
      "amount": 5000,
      "quantity": 1
    },
    {
      "description": "Lab Test",
      "amount": 3000,
      "quantity": 2
    }
  ],
  "payment_method": "cash"
}

GET /api/billing/invoices/:id
GET /api/billing/invoices?hospital_id=uuid&status=pending
```

#### Payments
```
POST /api/billing/payments
Body: {
  "invoice_id": "uuid",
  "amount": 11000,
  "payment_method": "cash",
  "reference": "PAY123456"
}

GET /api/billing/payments/history/:patientId
```

#### Insurance Claims
```
POST /api/billing/insurance-claims
Body: {
  "patient_id": "uuid",
  "invoice_id": "uuid",
  "insurance_provider": "AXA Mansard",
  "claim_amount": 11000,
  "diagnosis_code": "B54"
}

GET /api/billing/insurance-claims/:id
```

#### NHIS Billing
```
POST /api/billing/nhis
Body: {
  "patient_id": "uuid",
  "nhis_number": "NHIS123456",
  "service_amount": 10000
}

GET /api/billing/nhis/claims/:patientId
```

#### HMO Billing
```
POST /api/billing/hmo
Body: {
  "patient_id": "uuid",
  "hmo_provider": "Hygeia HMO",
  "authorization_code": "AUTH123",
  "service_amount": 15000
}

POST /api/billing/hmo/authorization
```

### 3. Inventory Management Module

#### Test Endpoint
```
GET /api/inventory/test
```

#### Inventory Items
```
POST /api/inventory/items
Body: {
  "hospital_id": "uuid",
  "name": "Paracetamol 500mg",
  "category": "medication",
  "quantity": 1000,
  "unit": "tablets",
  "reorder_level": 200,
  "unit_price": 5,
  "expiry_date": "2025-12-31"
}

GET /api/inventory/items?hospital_id=uuid&category=medication
PUT /api/inventory/items/:id
```

#### Stock Management
```
POST /api/inventory/stock-movement
Body: {
  "item_id": "uuid",
  "movement_type": "in",
  "quantity": 500,
  "reason": "Purchase order #PO123"
}

GET /api/inventory/reorder-alerts?hospital_id=uuid
```

#### Dispensing
```
POST /api/inventory/dispense
Body: {
  "prescription_id": "uuid",
  "patient_id": "uuid",
  "items": [
    {
      "item_id": "uuid",
      "quantity": 6
    }
  ]
}

GET /api/inventory/dispensing/:patientId
```

#### Equipment Management
```
POST /api/inventory/equipment
Body: {
  "hospital_id": "uuid",
  "name": "X-Ray Machine",
  "model": "Siemens AXIOM",
  "serial_number": "SN123456",
  "department": "Radiology",
  "purchase_date": "2023-01-15",
  "warranty_expiry": "2026-01-15"
}

GET /api/inventory/equipment?hospital_id=uuid&department=Radiology
POST /api/inventory/equipment/maintenance
```

### 4. HR and Rostering Module

#### Test Endpoint
```
GET /api/hr/test
```

#### Staff Management
```
POST /api/hr/staff
Body: {
  "hospital_id": "uuid",
  "first_name": "Chioma",
  "last_name": "Adeyemi",
  "employee_id": "EMP001",
  "role": "Nurse",
  "department": "Emergency",
  "phone": "+2348098765432",
  "email": "chioma@hospital.com",
  "hire_date": "2023-06-01",
  "salary": 150000
}

GET /api/hr/staff?hospital_id=uuid&department=Emergency
GET /api/hr/staff/:id
PUT /api/hr/staff/:id
```

#### Roster Management
```
POST /api/hr/roster
Body: {
  "hospital_id": "uuid",
  "staff_id": "uuid",
  "department": "Emergency",
  "date": "2025-01-15",
  "shift": "morning",
  "start_time": "07:00",
  "end_time": "14:00"
}

GET /api/hr/roster?hospital_id=uuid&date=2025-01-15
GET /api/hr/roster/department/:departmentId
```

#### Attendance
```
POST /api/hr/attendance/clock-in
Body: {
  "staff_id": "uuid",
  "hospital_id": "uuid"
}

POST /api/hr/attendance/clock-out
Body: {
  "staff_id": "uuid",
  "hospital_id": "uuid"
}

GET /api/hr/attendance/report/:staffId?start_date=2025-01-01&end_date=2025-01-31
```

#### Payroll
```
POST /api/hr/payroll
Body: {
  "hospital_id": "uuid",
  "month": "2025-01",
  "staff_id": "uuid"
}

GET /api/hr/payroll/:staffId/:month
GET /api/hr/payroll/summary/:hospitalId?month=2025-01&year=2025
```

#### Leave Management
```
POST /api/hr/leave-requests
Body: {
  "staff_id": "uuid",
  "leave_type": "annual",
  "start_date": "2025-02-01",
  "end_date": "2025-02-14",
  "reason": "Family vacation"
}

PUT /api/hr/leave-requests/:id/approve
PUT /api/hr/leave-requests/:id/reject
GET /api/hr/leave-balance/:staffId
```

### 5. Real-time Analytics Module

#### Test Endpoint
```
GET /api/analytics/test
```

#### Occupancy Analytics
```
GET /api/analytics/occupancy/:hospitalId
GET /api/analytics/occupancy/:hospitalId/historical?days=30
```

#### Patient Flow
```
GET /api/analytics/patient-flow/:hospitalId
GET /api/analytics/patient-flow/:hospitalId/hourly?date=2025-01-15
GET /api/analytics/patient-flow/:hospitalId/daily?start_date=2025-01-01&end_date=2025-01-31
```

#### Emergency Department
```
GET /api/analytics/emergency/:hospitalId
GET /api/analytics/emergency/:hospitalId/wait-times
```

#### Revenue Analytics
```
GET /api/analytics/revenue/:hospitalId?start_date=2025-01-01&end_date=2025-01-31
GET /api/analytics/revenue/:hospitalId/payment-methods?period=month
GET /api/analytics/revenue/:hospitalId/insurance?period=month
```

#### Operational KPIs
```
GET /api/analytics/kpis/:hospitalId
GET /api/analytics/dashboard/:hospitalId
```

#### Predictive Analytics
```
GET /api/analytics/predictions/admissions/:hospitalId?days=7
```

## Nigerian Context Implementation

### Currency
All financial values are in Nigerian Naira (₦)

### Tax Rates
- VAT: 7.5%
- Pension: 8% (employee contribution)

### Insurance Providers
- NHIS (National Health Insurance Scheme) - 90% coverage
- Private HMOs: Hygeia, AXA Mansard, Leadway, etc.

### States
All 36 Nigerian states + FCT are supported in address fields

### Phone Format
Nigerian phone format: +234XXXXXXXXXX

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Responses
All errors follow this format:
```json
{
  "error": {
    "message": "Error description",
    "status": 400,
    "details": {}
  }
}
```

## Testing the APIs

### Using cURL

#### Test EMR API
```bash
curl -X GET http://localhost:5001/api/emr/test
```

#### Create a Patient
```bash
curl -X POST http://localhost:5001/api/emr/patients \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Patient",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "phone": "+2348012345678",
    "hospital_id": "test-hospital-id"
  }'
```

#### Create an Invoice
```bash
curl -X POST http://localhost:5001/api/billing/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "test-patient-id",
    "hospital_id": "test-hospital-id",
    "items": [
      {"description": "Consultation", "amount": 5000, "quantity": 1}
    ],
    "payment_method": "cash"
  }'
```

## Rate Limiting
API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Support
For API support and issues, please contact the development team.
