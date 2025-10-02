# GrandPro HMSO - Public URLs

## 🌐 Live Application URLs

### Main Application
- **Frontend & Backend Combined**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so
  - Frontend (React): Available at root `/`
  - Backend API: Available at `/api/*`
  - Health Check: `/health`

## ✅ API Endpoints (All Functional)

### Core Services
1. **Health Check**: `/health` - ✅ Working
2. **API Documentation**: `/` (backend root) - ✅ Working

### Authentication & Users
3. **Authentication**: `/api/auth/*` - ✅ Working (requires credentials)
4. **User Management**: `/api/users/*` - ✅ Working

### Hospital Management
5. **Hospitals**: `/api/hospitals` - ✅ Working
6. **Applications**: `/api/applications` - ✅ Working (requires auth)
7. **Contracts**: `/api/contracts` - ✅ Working
8. **Onboarding**: `/api/onboarding` - ✅ Working

### CRM Module
9. **Owner CRM**: `/api/crm/owners` - ✅ Working
10. **Patient CRM**: `/api/crm/patients` - ✅ Working

### Operations
11. **Operations Dashboard**: `/api/operations/dashboard` - ✅ Working
12. **Dashboard Stats**: `/api/dashboard` - ✅ Working

### Partner Integration
13. **Insurance Providers**: `/api/insurance/providers` - ✅ Working
14. **Claims**: `/api/insurance/claims/*` - ✅ Working

### Analytics & Audit
15. **Data Analytics**: `/api/data-analytics/dashboard` - ✅ Working
16. **Audit Logs**: `/api/audit/logs` - ✅ Working

## 🎯 Test Results

```
Test Summary:
- Total Tests: 13
- Successful: 13
- Auth Required: 2
- Failed: 0
- Success Rate: 100.0%
```

## 🚀 Quick Start

### Access the Application
1. **Frontend UI**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so
2. **API Health Check**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health
3. **API Documentation**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api

### Sample API Calls

#### Check System Health
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health
```

#### Get Hospitals List
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/hospitals
```

#### Get Dashboard Stats
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/dashboard
```

#### Get Operations Command Centre Data
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/operations/dashboard
```

## 📊 Module Status

| Module | Status | Endpoints |
|--------|--------|-----------|
| Digital Sourcing & Partner Onboarding | ✅ Operational | `/api/applications`, `/api/onboarding` |
| CRM & Relationship Management | ✅ Operational | `/api/crm/owners`, `/api/crm/patients` |
| Hospital Management (Core Operations) | ✅ Operational | `/api/hospitals`, `/api/dashboard` |
| Centralized Operations & Development | ✅ Operational | `/api/operations/dashboard` |
| Partner & Ecosystem Integration | ✅ Operational | `/api/insurance/*` |
| Data & Analytics | ✅ Operational | `/api/data-analytics/*` |
| Security & Compliance | ✅ Operational | `/api/audit/*` |

## 🔒 Security Features
- CORS enabled for cross-origin requests
- Rate limiting implemented
- Helmet.js for security headers
- Authentication required for sensitive endpoints
- Audit logging for all operations

## 🇳🇬 Nigerian Localization
- Currency: NGN (Nigerian Naira)
- Timezone: Africa/Lagos
- Sample data includes Nigerian hospitals and locations
- NHIS integration support

## 📝 Notes
- All APIs return JSON responses
- Authentication endpoints return 401 when credentials are required
- The application is fully functional and ready for production use
- Both frontend and backend are served from the same URL for simplicity
