# GrandPro HMSO - Working URLs Summary

## 🌐 Public Access URLs

### Main Application
- **Frontend**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so
- **Backend API**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api
- **Health Check**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health

## ✅ All Frontend Pages (100% Working)

1. **Home Page**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/
2. **Login Page**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/login
3. **Signup Page**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/signup
4. **Onboarding Module**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/onboarding
5. **Application Form**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/application
6. **Document Upload**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/documents
7. **Dashboard**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/dashboard
8. **Patient Portal**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/patient-portal
9. **Owner Portal**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/owner-portal
10. **Appointments**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/appointments
11. **Medical Records**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/medical-records
12. **Billing**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/billing
13. **Inventory**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/inventory
14. **HR Management**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/hr
15. **Operations Center**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/operations

## ✅ Working API Endpoints

### System Health
✅ `GET /health` - Returns system status

### Onboarding Module
✅ `POST /api/onboarding/register` - Register new hospital
✅ `GET /api/onboarding/document-types` - Get document requirements
✅ `GET /api/onboarding/applications/{id}/status` - Check application status
✅ `POST /api/onboarding/applications/{id}/evaluate` - Evaluate application
✅ `POST /api/onboarding/applications/{id}/generate-contract` - Generate contract

### CRM Module
✅ `GET /api/crm/owners` - List hospital owners
✅ `GET /api/crm/owners/stats` - Owner statistics
✅ `POST /api/crm/patients/register` - Register patient
✅ `GET /api/crm/campaigns` - List campaigns
✅ `GET /api/crm/messages/templates` - Message templates

### Hospital Management
✅ `GET /api/hospital/emr/patients` - List EMR patients
✅ `GET /api/hospital/billing/invoices` - List invoices
✅ `GET /api/hospital/inventory/items` - List inventory
✅ `GET /api/hospital/hr/staff` - List staff

### Operations Center
✅ `GET /api/operations/dashboard` - Operations dashboard
✅ `GET /api/operations/metrics` - Performance metrics
✅ `GET /api/operations/alerts` - System alerts
✅ `GET /api/operations/projects` - Development projects

### Analytics
✅ `GET /api/analytics/overview` - Analytics overview
✅ `GET /api/analytics/patient-flow` - Patient flow data
✅ `GET /api/analytics/revenue` - Revenue analytics
✅ `GET /api/analytics/predictions` - Predictive analytics

## 📝 Example API Calls

### Register a Hospital
```bash
curl -X POST https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/onboarding/register \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_name": "Lagos Premier Hospital",
    "owner_first_name": "Chidi",
    "owner_last_name": "Okonkwo",
    "owner_email": "chidi@hospital.ng",
    "owner_phone": "+2348012345678",
    "hospital_address": "123 Marina Road",
    "hospital_city": "Lagos Island",
    "hospital_state": "Lagos"
  }'
```

### Get Analytics Overview
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/analytics/overview
```

### Get Operations Dashboard
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/operations/dashboard
```

## 🎯 Key Features Working

1. **Digital Sourcing & Partner Onboarding** ✅
   - Hospital registration
   - Document management
   - Application tracking
   - Contract generation

2. **CRM & Relationship Management** ✅
   - Owner management
   - Patient registration
   - Communication campaigns
   - Message templates

3. **Hospital Management** ✅
   - Electronic Medical Records
   - Billing & Revenue
   - Inventory Management
   - HR & Staff Management

4. **Operations Center** ✅
   - Real-time dashboard
   - Performance metrics
   - Alert system
   - Project management

5. **Data & Analytics** ✅
   - Overview dashboards
   - Patient flow analysis
   - Revenue tracking
   - Predictive analytics

## 🇳🇬 Nigerian Localization
- Currency: NGN (₦)
- Timezone: Africa/Lagos
- Phone: +234 format
- States: All 36 states + FCT
- Compliance: CAC, TIN, NHIS

## 🔧 Technical Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Neon PostgreSQL
- Proxy: NGINX
- Deployment: Docker containers

## 📊 System Status
- **Frontend**: ✅ Running on port 3001
- **Backend**: ✅ Running on port 5001
- **Database**: ✅ Connected to Neon
- **Proxy**: ✅ NGINX on port 9000
- **Public Access**: ✅ HTTPS enabled
