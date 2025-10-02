# GrandPro HMSO API Documentation

## Base URL
```
Production: https://api.grandpro-hmso.ng
Development: http://localhost:5001
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "data": {},
  "message": "Response message",
  "error": "Error message (if applicable)"
}
```

---

## 1. Authentication Endpoints

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@grandpro.ng",
  "password": "Admin123!@#"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@grandpro.ng",
    "role": "admin",
    "firstName": "John",
    "lastName": "Doe"
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
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "patient",
  "phone": "+234 801 234 5678"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Reset Password
```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

## 2. Hospital Management

### List Hospitals
```http
GET /api/hospitals
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `location` (string): Filter by location
- `type` (string): Filter by type (general, specialist, clinic)

**Response:**
```json
{
  "success": true,
  "hospitals": [
    {
      "id": "uuid",
      "name": "Lagos General Hospital",
      "location": "Lagos, Nigeria",
      "type": "general",
      "beds": 200,
      "status": "active"
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 5
}
```

### Get Hospital Details
```http
GET /api/hospitals/:id
Authorization: Bearer <token>
```

### Create Hospital
```http
POST /api/hospitals
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Hospital",
  "location": "Abuja, Nigeria",
  "type": "specialist",
  "beds": 150,
  "phone": "+234 802 345 6789",
  "email": "info@hospital.ng"
}
```

### Update Hospital
```http
PUT /api/hospitals/:id
Authorization: Bearer <token>
```

### Delete Hospital
```http
DELETE /api/hospitals/:id
Authorization: Bearer <token>
```

---

## 3. Patient Management

### List Patients
```http
GET /api/patients
Authorization: Bearer <token>
```

### Get Patient Details
```http
GET /api/patients/:id
Authorization: Bearer <token>
```

### Register Patient
```http
POST /api/patients
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "patient@example.com",
  "phone": "+234 803 456 7890",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "address": "123 Main St, Lagos",
  "bloodType": "O+",
  "allergies": ["penicillin"],
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+234 804 567 8901",
    "relationship": "spouse"
  }
}
```

### Update Patient
```http
PUT /api/patients/:id
Authorization: Bearer <token>
```

---

## 4. Appointments

### List Appointments
```http
GET /api/appointments
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` (string): Filter by date (YYYY-MM-DD)
- `status` (string): pending, confirmed, completed, cancelled
- `doctorId` (string): Filter by doctor
- `patientId` (string): Filter by patient

### Book Appointment
```http
POST /api/appointments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid",
  "hospitalId": "uuid",
  "date": "2025-10-15",
  "time": "10:00",
  "type": "consultation",
  "reason": "Regular checkup",
  "duration": 30
}
```

### Update Appointment
```http
PUT /api/appointments/:id
Authorization: Bearer <token>
```

### Cancel Appointment
```http
POST /api/appointments/:id/cancel
Authorization: Bearer <token>
```

---

## 5. Medical Records

### Get Patient Medical Records
```http
GET /api/emr/patients/:patientId
Authorization: Bearer <token>
```

### Add Medical Record
```http
POST /api/emr/records
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "type": "consultation",
  "date": "2025-10-02",
  "diagnosis": "Hypertension",
  "symptoms": ["headache", "dizziness"],
  "vitals": {
    "bloodPressure": "140/90",
    "temperature": 37.2,
    "pulse": 75,
    "weight": 75
  },
  "prescription": [
    {
      "drug": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "30 days"
    }
  ],
  "notes": "Patient advised lifestyle changes"
}
```

---

## 6. Billing & Payments

### Create Invoice
```http
POST /api/billing/invoices
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "hospitalId": "uuid",
  "items": [
    {
      "description": "Consultation",
      "amount": 5000,
      "quantity": 1
    },
    {
      "description": "Blood Test",
      "amount": 3000,
      "quantity": 1
    }
  ],
  "currency": "NGN",
  "paymentMethod": "cash",
  "status": "pending"
}
```

### Get Invoice
```http
GET /api/billing/invoices/:id
Authorization: Bearer <token>
```

### Process Payment
```http
POST /api/billing/payments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "invoiceId": "uuid",
  "amount": 8000,
  "method": "card",
  "reference": "PAY-12345",
  "currency": "NGN"
}
```

---

## 7. Inventory Management

### List Inventory Items
```http
GET /api/inventory
Authorization: Bearer <token>
```

### Add Inventory Item
```http
POST /api/inventory
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Paracetamol",
  "category": "drug",
  "unit": "tablets",
  "quantity": 1000,
  "reorderLevel": 100,
  "price": 10,
  "supplier": "PharmaCo Nigeria",
  "expiryDate": "2026-12-31"
}
```

### Update Stock
```http
PUT /api/inventory/:id/stock
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 500,
  "operation": "add|remove",
  "reason": "Restocking"
}
```

---

## 8. Data Analytics

### Drug Demand Forecast
```http
POST /api/data-analytics/forecast/drug-demand
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "hospitalId": "uuid",
  "drugId": 1,
  "days": 30
}
```

**Response:**
```json
{
  "success": true,
  "forecast": {
    "drugId": 1,
    "hospitalId": "uuid",
    "forecastPeriodDays": 30,
    "predictedDemand": 300,
    "confidenceInterval": {
      "lower": 240,
      "upper": 360
    },
    "historicalAverage": 10,
    "seasonalFactor": 1
  }
}
```

### Patient Risk Score
```http
POST /api/data-analytics/risk-score/patient
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "age": 65,
  "conditions": ["diabetes", "hypertension"],
  "vitals": {
    "bp": "160/95",
    "glucose": 180
  }
}
```

### Fraud Detection
```http
POST /api/data-analytics/fraud/detect
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "entityType": "insurance_claim",
  "entityId": "CLAIM-001",
  "transactionData": {
    "amount": 5000000,
    "claimType": "surgery",
    "hospitalId": "uuid",
    "frequency": 15
  }
}
```

### Triage Prediction
```http
POST /api/data-analytics/triage/predict
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "symptoms": ["chest pain", "shortness of breath"],
  "age": 55,
  "vitals": {
    "heartRate": 120,
    "bloodPressure": "180/100"
  }
}
```

---

## 9. Operations Dashboard

### Get Real-time Metrics
```http
GET /api/operations/metrics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalPatients": 1250,
    "activeStaff": 45,
    "occupancyRate": 78,
    "avgWaitTime": 25,
    "revenue": {
      "daily": 500000,
      "monthly": 15000000
    }
  }
}
```

### Get Alerts
```http
GET /api/operations/alerts
Authorization: Bearer <token>
```

### Get KPIs
```http
GET /api/operations/kpi
Authorization: Bearer <token>
```

---

## 10. Insurance Integration

### Submit Claim
```http
POST /api/insurance/claim
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "providerId": "NHIS",
  "claimAmount": 50000,
  "serviceDate": "2025-10-01",
  "diagnosis": "ICD-10 code",
  "procedures": ["procedure codes"],
  "documents": ["url1", "url2"]
}
```

### Check Claim Status
```http
GET /api/insurance/claim/:claimId
Authorization: Bearer <token>
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Data analytics endpoints: 50 requests per hour

## Webhooks

Configure webhooks to receive real-time notifications:

```http
POST /api/webhooks/configure
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": [
    "appointment.created",
    "appointment.cancelled",
    "payment.completed",
    "alert.critical"
  ],
  "secret": "your-webhook-secret"
}
```

## Testing

Use the following test credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@grandpro.ng | Admin123!@# |
| Doctor | doctor@grandpro.ng | Doctor123!@# |
| Patient | patient@grandpro.ng | Patient123!@# |

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.grandpro-hmso.ng',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Get hospitals
const hospitals = await api.get('/api/hospitals');

// Create appointment
const appointment = await api.post('/api/appointments', {
  patientId: 'uuid',
  doctorId: 'uuid',
  date: '2025-10-15',
  time: '10:00'
});
```

### Python
```python
import requests

base_url = 'https://api.grandpro-hmso.ng'
headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}

# Get hospitals
response = requests.get(f'{base_url}/api/hospitals', headers=headers)
hospitals = response.json()

# Create appointment
appointment_data = {
    'patientId': 'uuid',
    'doctorId': 'uuid',
    'date': '2025-10-15',
    'time': '10:00'
}
response = requests.post(
    f'{base_url}/api/appointments',
    json=appointment_data,
    headers=headers
)
```

---

**API Version**: 1.0.0  
**Last Updated**: October 2, 2025  
**Support**: api-support@grandpro.ng
