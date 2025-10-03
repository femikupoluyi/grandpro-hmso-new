# GrandPro HMSO - Public URLs Documentation

## Base URLs

- **Frontend Application**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so
- **Backend API**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api
- **Health Check**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health

## Working Frontend Pages

All frontend pages are accessible and functional:

### Core Pages
- **Home Page**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/
- **Login**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/login
- **Signup**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/signup
- **Dashboard**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/dashboard

### Onboarding Module
- **Main Onboarding**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/onboarding
- **Application Form**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/application
- **Document Upload**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/documents

### CRM Portals
- **Patient Portal**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/patient-portal
- **Owner Portal**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/owner-portal
- **Appointments**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/appointments

### Hospital Management
- **Medical Records**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/medical-records
- **Billing**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/billing
- **Inventory**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/inventory
- **HR Management**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/hr

### Operations
- **Operations Center**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/operations

## Working API Endpoints

### System Health
- `GET /health` - Backend health status

### Onboarding Module APIs
- `GET /api/onboarding/document-types` - Get required document types
- `GET /api/onboarding/applications/{id}/status` - Check application status
- `POST /api/onboarding/applications/{id}/evaluate` - Trigger evaluation
- `POST /api/onboarding/applications/{id}/generate-contract` - Generate contract

### CRM APIs
- `GET /api/crm/owners` - List all hospital owners
- `GET /api/crm/owners/stats` - Owner statistics
- `POST /api/crm/patients/register` - Register new patient
- `GET /api/crm/campaigns` - List communication campaigns
- `GET /api/crm/messages/templates` - Get message templates

### Hospital Management APIs
- `GET /api/hospital/emr/patients` - List all patients (EMR)
- `GET /api/hospital/billing/invoices` - List all invoices
- `GET /api/hospital/inventory/items` - List inventory items
- `GET /api/hospital/hr/staff` - List all staff members

### Operations Center APIs
- `GET /api/operations/dashboard` - Operations dashboard data
- `GET /api/operations/metrics` - Key performance metrics
- `GET /api/operations/alerts` - System alerts
- `GET /api/operations/projects` - Development projects

### Analytics APIs
- `GET /api/analytics/overview` - Analytics overview
- `GET /api/analytics/patient-flow` - Patient flow analytics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/predictions` - Predictive analytics

## Test Credentials

### Hospital Owner
```json
{
  "email": "owner@hospital.ng",
  "password": "Owner@123"
}
```

### Patient
```json
{
  "email": "patient@example.com",
  "password": "Patient@123"
}
```

### Admin
```json
{
  "email": "admin@grandpro.ng",
  "password": "Admin@123"
}
```

## Nigerian Localization

All data uses Nigerian-specific settings:
- **Currency**: NGN (Nigerian Naira)
- **Timezone**: Africa/Lagos
- **Phone Format**: +234XXXXXXXXXX
- **States**: All 36 Nigerian states + FCT
- **Regulatory**: CAC, TIN, NHIS numbers

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│          NGINX Reverse Proxy (Port 9000)    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Frontend   │      │   Backend    │   │
│  │  (Port 3001) │      │  (Port 5001) │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Neon PostgreSQL │
              └──────────────────┘
```

## Module Status

### ✅ Fully Functional Modules
1. **Digital Sourcing & Partner Onboarding** - Frontend UI complete
2. **CRM & Relationship Management** - Core APIs working
3. **Operations Center** - All endpoints functional
4. **Data & Analytics** - Core analytics working

### ⚠️ Partially Functional Modules
1. **Hospital Management** - Main endpoints working, some stats missing
2. **Partner Integrations** - Structure in place, needs implementation

### 🔧 Known Issues Being Fixed
1. Some statistics endpoints return 404
2. HR schedules endpoint has a callback error
3. Partner integration endpoints need implementation

## Testing the Application

### Quick Health Check
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health
```

### Test Frontend
Open in browser: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so

### Test API
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/crm/owners
```

## Development Notes

- Frontend built with React + Vite
- Backend built with Node.js + Express
- Database: Neon PostgreSQL
- Deployment: Docker containers with NGINX proxy
- All services are containerized and scalable
