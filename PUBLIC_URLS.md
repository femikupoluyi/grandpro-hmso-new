# GrandPro HMSO Platform - Public URLs

## Main Application URLs
The GrandPro HMSO platform is publicly accessible through multiple endpoints:

### Primary Access Points
- **Port 80 (Main)**: Available through Morph.so cloud proxy
- **Port 3001 (Frontend Direct)**: Frontend development server  
- **Port 5001 (Backend API Direct)**: Backend API server
- **Port 9000 (Alternative)**: Combined proxy endpoint

### Working Local Endpoints (Verified ✅)
- **Frontend**: `http://localhost:80/`
- **Backend API**: `http://localhost:80/api/*`
- **Health Check**: `http://localhost:80/health`
- **Dashboard Stats**: `http://localhost:80/api/dashboard/stats`

## Available Endpoints

### Frontend Application
- **URL**: `https://morphvm-wz7xxc7v-9000.morphvm.com`
- **Description**: Main web application interface for all users
- **Features**:
  - Login/Authentication
  - Hospital Owner Portal
  - Patient Portal
  - Staff Dashboard
  - Admin Dashboard

### Backend API
- **Base URL**: `https://morphvm-wz7xxc7v-9000.morphvm.com/api`
- **Health Check**: `https://morphvm-wz7xxc7v-9000.morphvm.com/health`

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

#### Hospital Management
- `GET /api/hospitals` - List all hospitals
- `POST /api/hospitals` - Create new hospital
- `GET /api/hospitals/:id` - Get hospital details
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital

#### Digital Sourcing & Onboarding
- `GET /api/applications` - List applications
- `POST /api/applications` - Submit new application
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id/score` - Update application score
- `POST /api/applications/:id/approve` - Approve application

#### CRM
- `GET /api/crm/owners` - List hospital owners
- `GET /api/crm/patients` - List patients
- `POST /api/crm/communications/send` - Send communication
- `GET /api/crm/campaigns` - List campaigns

#### Hospital Operations
- `GET /api/emr/patients` - Electronic Medical Records
- `POST /api/billing/invoices` - Create invoice
- `GET /api/inventory/items` - Inventory management
- `GET /api/hr/staff` - Staff management
- `GET /api/analytics/dashboard` - Analytics dashboard

#### Partner Integrations
- `POST /api/insurance/claims` - Submit insurance claim
- `GET /api/pharmacy/orders` - Pharmacy orders
- `POST /api/telemedicine/consultations` - Schedule consultation

## Test Credentials

### Admin User
- **Email**: admin@grandpro.com
- **Password**: Admin@123456

### Hospital Owner
- **Email**: owner@lagos.hospital.com
- **Password**: Owner@123456

### Patient
- **Email**: patient1@example.com
- **Password**: Patient@123

### Staff/Doctor
- **Email**: doctor@grandpro.com
- **Password**: Doctor@123456

## Nigerian Context
- **Currency**: Nigerian Naira (₦)
- **Timezone**: West Africa Time (WAT)
- **States**: All 36 states + FCT
- **Sample Hospitals**: Lagos University Teaching Hospital, St. Nicholas Hospital, etc.

## Features Available

### 1. Digital Sourcing & Partner Onboarding ✅
- Hospital owner application portal
- Document upload and management
- Automated scoring system
- Digital contract signing
- Progress tracking dashboard

### 2. CRM & Relationship Management ✅
- Owner CRM with contract tracking
- Patient CRM with loyalty program (2,500 points initial)
- SMS/WhatsApp/Email campaigns
- Satisfaction tracking

### 3. Hospital Management (Core Operations) ✅
- Electronic Medical Records (EMR)
- Billing and revenue management
- Inventory management
- HR and staff scheduling
- Real-time analytics

### 4. Centralized Operations & Development ✅
- Operations Command Centre
- Multi-hospital dashboards
- Alert system for anomalies
- Project management for expansions

### 5. Partner & Ecosystem Integrations ✅
- Insurance/HMO integration
- Pharmacy supplier integration
- Telemedicine module
- Government reporting

### 6. Data & Analytics ✅
- Centralized data aggregation
- Predictive analytics
- AI/ML capabilities (triage bot, fraud detection)
- Real-time dashboards

### 7. Security & Compliance ✅
- HIPAA/GDPR aligned
- End-to-end encryption
- Role-based access control
- Audit logging
- Automated backups

## System Status
- ✅ All modules operational
- ✅ Database connected (Neon PostgreSQL)
- ✅ Authentication working
- ✅ Nigerian localization active
- ✅ Sample data loaded

## Support
For any issues or questions, please check the application logs or contact system administrator.

---
Last Updated: October 4, 2025
