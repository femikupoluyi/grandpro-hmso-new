# GrandPro HMSO API Specification

**Version**: 1.0.0  
**Base URL**: `https://backend-api-morphvm-wz7xxc7v.http.cloud.morph.so`  
**Authentication**: JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Digital Onboarding](#digital-onboarding)
3. [CRM](#crm)
4. [Hospital Management](#hospital-management)
5. [Operations](#operations)
6. [Analytics](#analytics)
7. [Partners](#partners)
8. [Security](#security)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@grandpro.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@grandpro.com",
    "name": "Admin User",
    "role": "SUPER_ADMIN",
    "hospitalId": null
  }
}
```

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "role": "DOCTOR",
  "hospitalId": 1
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 45,
    "email": "newuser@example.com",
    "full_name": "John Doe",
    "role": "DOCTOR"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Digital Onboarding

### Get Applications
```http
GET /api/onboarding/applications
```

**Query Parameters:**
- `status` (optional): PENDING, APPROVED, REJECTED
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
[
  {
    "id": 1,
    "hospital_name": "Lagos University Teaching Hospital",
    "owner_name": "Dr. Adebayo",
    "email": "admin@luth.ng",
    "phone": "+2348012345678",
    "address": "Idi-Araba, Lagos",
    "status": "APPROVED",
    "score": 85,
    "documents": {
      "license": "url_to_license",
      "registration": "url_to_registration"
    },
    "created_at": "2025-10-01T10:00:00Z"
  }
]
```

### Submit Application
```http
POST /api/onboarding/applications
```

**Request Body:**
```json
{
  "hospitalName": "New Hospital",
  "ownerName": "Dr. Smith",
  "email": "admin@newhospital.com",
  "phone": "+2348012345678",
  "address": "Victoria Island, Lagos",
  "documents": {
    "license": "base64_or_url",
    "registration": "base64_or_url",
    "certificate": "base64_or_url"
  },
  "hospitalType": "GENERAL",
  "bedCapacity": 100,
  "specializations": ["General Medicine", "Surgery", "Pediatrics"]
}
```

### Update Application Status
```http
PUT /api/onboarding/applications/:id/status
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "comments": "Application approved after verification",
  "score": 90
}
```

### Generate Contract
```http
POST /api/onboarding/contracts
```

**Request Body:**
```json
{
  "applicationId": 1,
  "contractType": "STANDARD",
  "terms": {
    "duration": "2 years",
    "revenueShare": "80-20",
    "minimumPatients": 100
  }
}
```

### Sign Contract
```http
POST /api/onboarding/contracts/:id/sign
```

**Request Body:**
```json
{
  "signature": "digital_signature_data",
  "signedBy": "Dr. Smith",
  "signedAt": "2025-10-04T12:00:00Z"
}
```

---

## CRM

### Patients

#### List Patients
```http
GET /api/crm/patients
```

**Query Parameters:**
- `search` (optional): Search by name, email, or phone
- `hospitalId` (optional): Filter by hospital
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": "PAT1234567",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "date_of_birth": "1985-05-15",
    "gender": "Male",
    "blood_group": "O+",
    "genotype": "AA",
    "created_at": "2025-10-01T10:00:00Z"
  }
]
```

#### Create Patient
```http
POST /api/crm/patients
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2348012345678",
  "dateOfBirth": "1990-03-20",
  "gender": "Female",
  "bloodGroup": "A+",
  "genotype": "AS",
  "address": "Ikeja, Lagos",
  "nextOfKin": {
    "name": "John Doe",
    "relationship": "Spouse",
    "phone": "+2348087654321"
  }
}
```

#### Get Patient Details
```http
GET /api/crm/patients/:id
```

**Response:**
```json
{
  "id": 1,
  "patient_id": "PAT1234567",
  "full_name": "John Doe",
  "medical_history": [],
  "appointments": [],
  "bills": [],
  "loyalty_points": 150
}
```

#### Update Patient
```http
PUT /api/crm/patients/:id
```

**Request Body:**
```json
{
  "phone": "+2348098765432",
  "address": "New Address, Lagos",
  "emergencyContact": "+2348012345678"
}
```

### Appointments

#### Create Appointment
```http
POST /api/crm/appointments
```

**Request Body:**
```json
{
  "patientId": 1,
  "doctorId": 5,
  "dateTime": "2025-10-10T10:00:00Z",
  "type": "CONSULTATION",
  "department": "General Medicine",
  "reason": "Follow-up visit"
}
```

#### Get Appointments
```http
GET /api/crm/appointments
```

**Query Parameters:**
- `date` (optional): Filter by date
- `doctorId` (optional): Filter by doctor
- `patientId` (optional): Filter by patient
- `status` (optional): SCHEDULED, COMPLETED, CANCELLED

### Communications

#### Send Message
```http
POST /api/crm/communications/send
```

**Request Body:**
```json
{
  "recipients": ["patient_1", "patient_2"],
  "channel": "SMS",
  "message": "Your appointment is confirmed for tomorrow at 10 AM",
  "scheduledAt": "2025-10-09T08:00:00Z"
}
```

---

## Hospital Management

### Electronic Medical Records

#### Create Medical Record
```http
POST /api/hospital/emr
```

**Request Body:**
```json
{
  "patientId": 1,
  "encounter": {
    "type": "CONSULTATION",
    "chiefComplaint": "Fever and headache",
    "presentIllness": "Patient reports fever for 2 days",
    "vitalSigns": {
      "temperature": 38.5,
      "bloodPressure": "120/80",
      "pulse": 88,
      "respiratoryRate": 20,
      "weight": 70,
      "height": 175
    },
    "diagnosis": ["Malaria", "Dehydration"],
    "treatment": "Artemether-Lumefantrine, IV fluids",
    "prescription": [
      {
        "drug": "Artemether-Lumefantrine",
        "dosage": "4 tablets",
        "frequency": "Twice daily",
        "duration": "3 days"
      }
    ],
    "labTests": ["Malaria RDT", "Complete Blood Count"],
    "followUp": "1 week"
  }
}
```

### Billing

#### Create Bill
```http
POST /api/hospital/billing
```

**Request Body:**
```json
{
  "patientId": 1,
  "encounterId": 10,
  "items": [
    {
      "description": "Consultation",
      "quantity": 1,
      "unitPrice": 5000,
      "amount": 5000
    },
    {
      "description": "Malaria RDT",
      "quantity": 1,
      "unitPrice": 2000,
      "amount": 2000
    }
  ],
  "totalAmount": 7000,
  "paymentMethod": "CASH",
  "insuranceProvider": null
}
```

#### Get Bills
```http
GET /api/hospital/billing
```

**Query Parameters:**
- `patientId` (optional)
- `status` (optional): PENDING, PAID, PARTIAL, OVERDUE
- `dateFrom` (optional)
- `dateTo` (optional)

### Inventory

#### Get Inventory
```http
GET /api/hospital/inventory
```

**Response:**
```json
[
  {
    "id": 1,
    "item_code": "MED001",
    "item_name": "Paracetamol 500mg",
    "category": "MEDICATION",
    "quantity_available": 5000,
    "reorder_level": 1000,
    "unit_price": 10,
    "expiry_date": "2026-12-31"
  }
]
```

#### Update Stock
```http
PUT /api/hospital/inventory/:id
```

**Request Body:**
```json
{
  "quantity": 10000,
  "reason": "Stock replenishment",
  "supplier": "MedPlus Pharmacy",
  "batchNumber": "BATCH2025-100",
  "expiryDate": "2027-06-30"
}
```

### HR & Scheduling

#### Get Staff Schedule
```http
GET /api/hospital/hr/schedule
```

**Query Parameters:**
- `date` (optional): Specific date
- `departmentId` (optional)
- `staffId` (optional)

**Response:**
```json
[
  {
    "id": 1,
    "staff_id": 10,
    "staff_name": "Dr. Adebayo",
    "department": "Emergency",
    "shift": "MORNING",
    "date": "2025-10-04",
    "start_time": "08:00",
    "end_time": "16:00",
    "status": "SCHEDULED"
  }
]
```

#### Create Schedule
```http
POST /api/hospital/hr/schedule
```

**Request Body:**
```json
{
  "staffId": 10,
  "shifts": [
    {
      "date": "2025-10-10",
      "shift": "MORNING",
      "startTime": "08:00",
      "endTime": "16:00"
    }
  ]
}
```

---

## Operations

### Metrics
```http
GET /api/operations/metrics
```

**Response:**
```json
{
  "patientFlow": {
    "inbound": 45,
    "outbound": 32,
    "admissions": 12,
    "discharges": 8
  },
  "staffKPIs": {
    "onDuty": 85,
    "efficiency": 92,
    "utilization": 78
  },
  "financial": {
    "dailyRevenue": 450000,
    "collections": 380000,
    "outstanding": 70000
  },
  "occupancy": {
    "beds": 120,
    "occupied": 95,
    "rate": 79.2
  }
}
```

### Alerts
```http
GET /api/operations/alerts
```

**Response:**
```json
[
  {
    "id": 1,
    "type": "LOW_STOCK",
    "severity": "HIGH",
    "message": "Paracetamol stock below reorder level",
    "timestamp": "2025-10-04T10:00:00Z",
    "acknowledged": false
  }
]
```

---

## Analytics

### Summary
```http
GET /api/analytics/summary
```

**Query Parameters:**
- `period` (optional): daily, weekly, monthly, yearly
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "totalPatients": 1250,
  "newPatients": 45,
  "totalRevenue": 15000000,
  "averageStayDays": 3.5,
  "bedOccupancyRate": 78.5,
  "patientSatisfaction": 4.5,
  "topDiagnoses": [
    {"diagnosis": "Malaria", "count": 230},
    {"diagnosis": "Hypertension", "count": 180}
  ]
}
```

### Predictions
```http
GET /api/analytics/predictions
```

**Response:**
```json
{
  "patientInflowForecast": {
    "nextWeek": 320,
    "nextMonth": 1400
  },
  "drugDemand": [
    {"drug": "Paracetamol", "predictedDemand": 5000},
    {"drug": "Artemether", "predictedDemand": 2000}
  ],
  "revenueProjection": {
    "nextMonth": 18000000,
    "confidence": 85
  }
}
```

---

## Partners

### Insurance

#### Get Providers
```http
GET /api/partners/insurance
```

**Response:**
```json
{
  "providers": [
    {
      "id": 1,
      "name": "NHIS",
      "status": "ACTIVE",
      "coverageTypes": ["Basic", "Comprehensive"],
      "enrolledPatients": 450
    }
  ]
}
```

#### Submit Claim
```http
POST /api/partners/insurance/claims
```

**Request Body:**
```json
{
  "patientId": 1,
  "providerId": 1,
  "encounterId": 10,
  "claimAmount": 50000,
  "services": [
    {
      "code": "CONS001",
      "description": "Consultation",
      "amount": 5000
    }
  ],
  "documents": ["url_to_document"]
}
```

### Pharmacy

#### Get Suppliers
```http
GET /api/partners/pharmacy/suppliers
```

#### Place Order
```http
POST /api/partners/pharmacy/orders
```

**Request Body:**
```json
{
  "supplierId": 1,
  "items": [
    {
      "itemCode": "MED001",
      "quantity": 1000,
      "unitPrice": 10
    }
  ],
  "deliveryDate": "2025-10-15",
  "paymentTerms": "NET30"
}
```

### Telemedicine

#### Schedule Session
```http
POST /api/partners/telemedicine/sessions
```

**Request Body:**
```json
{
  "patientId": 1,
  "doctorId": 5,
  "dateTime": "2025-10-10T14:00:00Z",
  "duration": 30,
  "platform": "ZOOM"
}
```

---

## Security

### Audit Logs
```http
GET /api/security/audit-logs
```

**Query Parameters:**
- `userId` (optional)
- `action` (optional)
- `dateFrom` (optional)
- `dateTo` (optional)

**Response:**
```json
[
  {
    "id": 166,
    "user_id": 1,
    "user_email": "admin@grandpro.com",
    "action": "LOGIN",
    "resource_type": "AUTH",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2025-10-04T10:00:00Z"
  }
]
```

### Role Permissions
```http
GET /api/security/rbac
```

**Response:**
```json
{
  "roles": [
    {
      "role": "DOCTOR",
      "permissions": [
        "VIEW_PATIENTS",
        "CREATE_PRESCRIPTION",
        "VIEW_MEDICAL_RECORDS",
        "UPDATE_MEDICAL_RECORDS"
      ]
    }
  ]
}
```

---

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  },
  "timestamp": "2025-10-04T10:00:00Z"
}
```

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| AUTH_FAILED | Authentication failed |
| TOKEN_EXPIRED | JWT token has expired |
| INVALID_TOKEN | Invalid JWT token |
| PERMISSION_DENIED | User lacks required permission |
| VALIDATION_ERROR | Request validation failed |
| RESOURCE_NOT_FOUND | Requested resource not found |
| DUPLICATE_ENTRY | Resource already exists |
| DATABASE_ERROR | Database operation failed |
| EXTERNAL_SERVICE_ERROR | Third-party service error |
| RATE_LIMIT_EXCEEDED | Too many requests |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

### Limits

| Endpoint Type | Requests | Window |
|--------------|----------|--------|
| Authentication | 5 | 15 minutes |
| Read Operations | 100 | 1 minute |
| Write Operations | 30 | 1 minute |
| File Uploads | 10 | 5 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696416000
```

### Rate Limit Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## Pagination

All list endpoints support pagination:

### Request Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (e.g., "created_at")
- `order`: Sort order ("asc" or "desc")

### Response Headers
```http
X-Total-Count: 250
X-Page-Count: 13
X-Current-Page: 1
X-Per-Page: 20
```

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "total": 250,
    "page": 1,
    "perPage": 20,
    "pages": 13,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Webhooks

### Available Events
- `patient.created`
- `appointment.scheduled`
- `bill.generated`
- `payment.received`
- `inventory.low_stock`
- `contract.signed`

### Webhook Payload
```json
{
  "event": "patient.created",
  "timestamp": "2025-10-04T10:00:00Z",
  "data": {
    "id": 1,
    "patient_id": "PAT1234567",
    "full_name": "John Doe"
  }
}
```

### Webhook Security
Webhooks are secured with HMAC-SHA256 signatures:

```http
X-Webhook-Signature: sha256=3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c
```

---

## Testing

### Test Environment
Base URL: `https://test-api.grandprohmso.ng`

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | test-admin@grandpro.com | Test123! |
| Doctor | test-doctor@grandpro.com | Test123! |
| Patient | test-patient@grandpro.com | Test123! |

---

## SDK & Client Libraries

### JavaScript/TypeScript
```bash
npm install @grandpro/hmso-sdk
```

```javascript
const GrandProAPI = require('@grandpro/hmso-sdk');

const api = new GrandProAPI({
  baseURL: 'https://api.grandprohmso.ng',
  apiKey: 'your-api-key'
});

// Login
const { token } = await api.auth.login({
  email: 'admin@grandpro.com',
  password: 'Admin123!'
});

// Get patients
const patients = await api.crm.getPatients();
```

---

## Support

- **Documentation**: https://docs.grandprohmso.ng
- **API Status**: https://status.grandprohmso.ng
- **Support Email**: api-support@grandprohmso.ng
- **GitHub**: https://github.com/femikupoluyi/grandpro-hmso-new

---

**Version History**
- v1.0.0 (2025-10-04): Initial release

---

*Generated on October 4, 2025*
