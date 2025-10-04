# GrandPro HMSO - Public Access Guide

## 🌐 PUBLIC ACCESS URLs

### External Access URL
The application is publicly accessible via the Morph cloud platform at:
- **Main URL**: `https://morphvm-wz7xxc7v-80.app.morph.so/`

### Alternative Access
- **Direct IP**: `http://34.30.54.231/` (Port 80)
- **Internal**: `http://localhost/` (for local testing)

## 🔐 LOGIN CREDENTIALS

### Administrative Access
- **Admin Account**
  - Email: `admin@grandpro.com`
  - Password: `Admin123!`
  - Role: Full system access

### Hospital Management
- **Hospital Owner**
  - Email: `john.owner@example.com`
  - Password: `password123`
  - Role: Hospital administration

### Medical Staff
- **Doctor**
  - Email: `dr.adebayo@luth.ng`
  - Password: `password123`
  - Role: Medical records, patient care

- **Nurse**
  - Email: `nurse.funke@luth.ng`
  - Password: `password123`
  - Role: Patient care, medication

### Patient Access
- **Patient Account**
  - Email: `patient1@example.com`
  - Password: `password123`
  - Role: View appointments, medical records

### Administrative Staff
- **Billing Clerk**
  - Email: `billing@luth.ng`
  - Password: `password123`
  - Role: Billing and payments

## 🏥 SYSTEM FEATURES

### 1. Digital Sourcing & Partner Onboarding
- Hospital application submission
- Document upload and verification
- Automated scoring system
- Digital contract signing
- Onboarding progress tracking

### 2. CRM & Relationship Management
- **Owner CRM**: Contract management, payouts, communications
- **Patient CRM**: Appointments, reminders, feedback, loyalty programs
- Integrated communication (SMS, WhatsApp, Email)

### 3. Hospital Management (Core Operations)
- Electronic Medical Records (EMR)
- Billing and revenue management
- Inventory management
- HR and staff rostering
- Real-time analytics

### 4. Operations Command Centre
- Multi-hospital monitoring dashboard
- Real-time patient flow tracking
- Staff KPI monitoring
- Financial metrics
- Alert management system
- Project management for expansions

### 5. Partner Integrations
- Insurance/HMO claim processing
- Pharmacy supplier integration
- Telemedicine capabilities
- Government reporting

### 6. Analytics & AI
- Predictive analytics for patient demand
- Drug usage forecasting
- Occupancy predictions
- AI-powered triage suggestions
- Fraud detection

### 7. Security & Compliance
- HIPAA/GDPR aligned
- End-to-end encryption
- Role-based access control
- Audit logging
- Automated backups

## 📊 AVAILABLE API ENDPOINTS

### Public Endpoints (No Authentication Required)
- `GET /health` - System health check
- `GET /api/dashboard/stats` - Public dashboard statistics
- `GET /api/system/info` - System information
- `GET /api/hospitals` - List of hospitals
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

### Authenticated Endpoints (Requires Login)

#### Admin Only
- `GET /api/operations/command-centre/dashboard` - Command centre overview
- `GET /api/analytics/overview` - System-wide analytics
- `GET /api/users` - User management
- `GET /api/admin/dashboard` - Admin dashboard

#### Hospital Owner
- `GET /api/crm/owners/profile` - Owner profile
- `GET /api/crm/owners/contracts` - Contract management
- `GET /api/crm/owners/payouts` - Payout history

#### Medical Staff
- `GET /api/emr/patients` - Patient records
- `POST /api/emr/records` - Create medical records
- `GET /api/inventory/medications` - Medication inventory
- `GET /api/hr/schedules` - Staff schedules

#### Patients
- `GET /api/crm/patients/profile` - Patient profile
- `GET /api/crm/patients/appointments` - Appointments
- `POST /api/crm/patients/feedback` - Submit feedback
- `GET /api/crm/patients/medical-records` - View medical records

## 🚀 QUICK START GUIDE

### 1. Access the Application
Navigate to: `https://morphvm-wz7xxc7v-80.app.morph.so/`

### 2. Login
1. Click on "Login" button
2. Enter credentials from the list above
3. Select appropriate role if prompted

### 3. Navigate Dashboard
- Use the sidebar menu to access different modules
- Role-based features will be automatically displayed
- Real-time notifications appear in the header

### 4. Key Features by Role

#### As Admin
- Monitor all hospitals from Command Centre
- View system-wide analytics
- Manage users and permissions
- Configure system settings

#### As Hospital Owner
- Submit and track hospital applications
- Manage contracts and documents
- View financial reports
- Monitor hospital performance

#### As Doctor/Nurse
- Access patient records
- Create prescriptions
- View schedules
- Update medical records

#### As Patient
- Book appointments
- View medical history
- Submit feedback
- Access test results

## 🔧 TECHNICAL DETAILS

### Architecture
- **Frontend**: React + Vite (Port 3001)
- **Backend**: Node.js + Express (Port 5001)
- **Database**: PostgreSQL (Neon)
- **Proxy**: Nginx (Port 80)
- **Process Manager**: PM2

### Nigerian Localization
- Currency: Nigerian Naira (₦)
- Timezone: West Africa Time (WAT)
- Sample Hospitals: LUTH, UCH Ibadan, National Hospital Abuja
- Phone format: +234-XXX-XXX-XXXX

### Security Features
- JWT authentication
- CORS enabled
- Rate limiting
- Input sanitization
- SQL injection prevention
- XSS protection

## 📱 MOBILE ACCESS

The application is fully responsive and can be accessed on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Tablet devices

## 🆘 TROUBLESHOOTING

### Cannot Login
1. Ensure correct credentials
2. Check caps lock
3. Clear browser cache
4. Try incognito/private mode

### Slow Performance
1. Check internet connection
2. Clear browser cache
3. Disable browser extensions
4. Try a different browser

### Features Not Loading
1. Ensure you're logged in with appropriate role
2. Refresh the page
3. Check browser console for errors
4. Contact support if issue persists

## 📞 SUPPORT

For technical support or questions:
- System Status: Check `/health` endpoint
- API Documentation: Available at `/api/docs`
- Error Reporting: Check browser console and network tab

## 🔄 SYSTEM STATUS

Current Status: **OPERATIONAL**
- Backend: ✅ Running
- Frontend: ✅ Running
- Database: ✅ Connected
- External Access: ✅ Available

Last Updated: October 4, 2025
Version: 1.0.0

---

© 2025 GrandPro HMSO - Hospital Management System Organization
