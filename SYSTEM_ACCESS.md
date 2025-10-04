# GrandPro HMSO - System Access Information

## 🌐 Public URLs (All Working)

### Main Application
- **Frontend URL**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so
- **Alternative Frontend**: https://grandpro-frontend-morphvm-wz7xxc7v.http.cloud.morph.so
- **Health Check**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health

## 📱 Demo Login Credentials

### Admin Account
- **Email**: admin@grandpro.ng
- **Password**: admin123
- **Role**: System Administrator
- **Access**: Full system access and management capabilities

### Owner Account  
- **Email**: owner.test@grandpro.ng
- **Password**: test123
- **Role**: Hospital Owner
- **Name**: Victoria Adeleke
- **Access**: Contract management, payouts, owner dashboard

### Patient Account
- **Email**: patient.test@grandpro.ng
- **Password**: test123
- **Role**: Patient
- **Name**: Kemi Adewale
- **Access**: Appointments, feedback, loyalty rewards

### Staff Account
- **Email**: staff@grandpro.ng
- **Password**: test123
- **Role**: Hospital Staff
- **Access**: EMR, billing, inventory, operations

## 🔌 API Endpoints (External Access)

### Authentication
```bash
# Login
curl -X POST https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@grandpro.ng","password":"admin123"}'

# Register
curl -X POST https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123","firstName":"John","lastName":"Doe","role":"patient"}'
```

### Hospital Management
- GET `/api/hospitals` - List all hospitals
- GET `/api/emr/patients` - List patients (requires auth)
- GET `/api/billing/invoices` - List invoices (requires auth)
- GET `/api/inventory/items` - List inventory items (requires auth)
- GET `/api/hr/staff` - List staff members (requires auth)

### CRM Endpoints
- GET `/api/crm/owners` - List hospital owners
- GET `/api/crm/patients` - List CRM patients
- GET `/api/crm/campaigns` - Communication campaigns

### Analytics
- GET `/api/analytics/metrics` - Real-time metrics
- GET `/api/analytics/occupancy` - Occupancy rates
- GET `/api/analytics/revenue` - Revenue analytics

## 🗄️ Database Information

### Neon PostgreSQL
- **Project**: crimson-star-18937963
- **Database**: neondb
- **Region**: US East
- **Connection**: Pooled connection enabled

### Database Tables
- **Users**: 37 users (admin, owners, patients, staff)
- **Hospitals**: 7 registered hospitals
- **Patients**: 10 patient records
- **Appointments**: Active appointment system
- **Inventory**: Drug and equipment tracking
- **Billing**: Invoice and payment management

## 🏥 Sample Nigerian Hospitals

1. **Lagos University Teaching Hospital**
   - Location: Idi-Araba, Lagos
   - Type: Teaching Hospital
   - Beds: 500

2. **St. Nicholas Hospital**
   - Location: Victoria Island, Lagos
   - Type: Private Hospital
   - Specialization: Multi-specialty

3. **National Hospital Abuja**
   - Location: Central District, Abuja
   - Type: Federal Hospital
   - Beds: 400

4. **Reddington Hospital**
   - Location: Victoria Island, Lagos
   - Type: Private Hospital
   - Specialization: Multi-specialty

5. **University College Hospital**
   - Location: Ibadan, Oyo State
   - Type: Teaching Hospital
   - Beds: 850

## 💻 Technical Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT tokens
- **Process Manager**: PM2
- **Port**: 5001 (proxied through 9000)

### Frontend
- **Framework**: React with Vite
- **UI Library**: Material-UI
- **State Management**: Zustand
- **Routing**: React Router v6
- **Port**: 3001 (development), 9000 (production)

### Infrastructure
- **Web Server**: Nginx
- **Proxy Port**: 9000
- **SSL**: Enabled via Caddy
- **Environment**: Development

## 🇳🇬 Nigerian Localization

- **Currency**: Nigerian Naira (₦)
- **Timezone**: Africa/Lagos (GMT+1)
- **Phone Format**: +234 XXX XXX XXXX
- **States**: All 36 states + FCT
- **LGAs**: 774 Local Government Areas
- **SMS Provider**: Termii
- **WhatsApp**: Business API integrated

## 📊 System Features

### ✅ Completed Modules
1. **Digital Sourcing & Partner Onboarding**
   - Hospital application portal
   - Document upload system
   - Automated scoring
   - Contract generation
   - Digital signatures

2. **CRM & Relationship Management**
   - Owner CRM with contract tracking
   - Patient CRM with appointments
   - Communication campaigns
   - WhatsApp/SMS/Email integration
   - Loyalty program (2,500 points system)

3. **Hospital Management (Core Operations)**
   - Electronic Medical Records (EMR)
   - Billing & Revenue Management
   - Inventory Management
   - HR & Rostering
   - Real-time Analytics

### 🚧 Pending Modules
4. Hospital Management Frontend UI
5. Centralized Operations Command Centre
6. Partner & Ecosystem Integrations
7. Advanced Data & Analytics Layer
8. Full Security & Compliance Implementation

## 🔐 Security Features

- **Authentication**: JWT with bcrypt hashing
- **Rate Limiting**: Applied to auth endpoints
- **CORS**: Configured for external access
- **Audit Logging**: All actions logged
- **Role-Based Access**: OWNER, PATIENT, STAFF, ADMIN
- **Session Management**: 1-hour timeout

## 📝 GitHub Repository

- **URL**: https://github.com/femikupoluyi/grandpro-hmso-new
- **Branch**: master
- **Last Updated**: October 4, 2025

## 🚀 Quick Start

1. Visit: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so
2. Click on any demo role card to explore
3. Use the provided credentials for full login
4. API documentation available at `/api/docs` (pending)

## 📞 Support

- **Email**: support@grandpro.ng
- **Phone**: +234 800 GRANDPRO
- **Technical Issues**: Create issue on GitHub

---
*System is currently in development mode with demo data for testing*
