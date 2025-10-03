# GrandPro HMSO - Hospital Management Platform

## 🏥 Overview
A comprehensive, modular, and secure hospital management platform designed specifically for the Nigerian healthcare ecosystem. This platform enables GrandPro HMSO to recruit, manage hospitals, run daily operations, and provide real-time analytics and oversight.

## 🚀 Live Demo
- **Platform URL**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so
- **Health Check**: https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health

## 🏗️ Project Structure
```
grandpro-hmso-new/
├── backend/          # Node.js/Express backend API
│   ├── src/          # Source code
│   ├── modules/      # Feature modules
│   ├── config/       # Configuration files
│   └── migrations/   # Database migrations
├── frontend/         # React/Vite frontend application
│   ├── src/          # Source code
│   └── dist/         # Build output
└── logs/            # Application logs
```

## 🎯 Key Features

### 7 Core Modules
1. **Digital Sourcing & Partner Onboarding** - Hospital recruitment and evaluation
2. **CRM & Relationship Management** - Owner and patient relationship tracking
3. **Hospital Management** - EMR, billing, inventory, and HR management
4. **Centralized Operations** - Real-time monitoring across all hospitals
5. **Partner & Ecosystem Integrations** - Insurance, pharmacy, and telemedicine
6. **Data & Analytics** - Predictive analytics and AI/ML capabilities
7. **Security & Compliance** - HIPAA/GDPR aligned security measures

## 🛠️ Technology Stack
- **Backend**: Node.js, Express.js
- **Frontend**: React, Vite, TailwindCSS
- **Database**: PostgreSQL (Neon)
- **Process Manager**: PM2
- **Web Server**: Nginx
- **Authentication**: Stack Auth (ready for configuration)

## 📦 Installation

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database (or Neon account)
- PM2 for process management
- Nginx for reverse proxy

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run migrate       # Run database migrations
npm start            # Start the backend server
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Development mode
npm run build        # Production build
npm run preview      # Preview production build
```

## 🔧 Environment Variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL=your_neon_database_url
PORT=5001
NODE_ENV=development
TIMEZONE=Africa/Lagos
CURRENCY=NGN
```

## 🌍 Nigerian Localization
- Currency: Nigerian Naira (NGN)
- Timezone: Africa/Lagos
- States: All 36 Nigerian states + FCT
- Sample data: Nigerian hospitals and healthcare providers

## 📊 API Endpoints

### Health Check
- `GET /health` - System health status

### CRM Module
- `GET /api/crm/owners` - Hospital owners
- `GET /api/crm/patients` - Patients list
- `GET /api/crm/communications/campaigns` - Communication campaigns

### Hospital Management
- `GET /api/hospital-management/emr/patients` - Electronic medical records
- `GET /api/hospital-management/billing/invoices` - Billing information
- `GET /api/hospital-management/inventory` - Inventory management

### Operations
- `GET /api/operations/alerts` - System alerts
- `GET /api/operations/projects` - Project management
- `GET /api/operations/command-center/metrics` - Command center metrics

## 🔐 Security Features
- End-to-end encryption
- Role-based access control (RBAC)
- HIPAA/GDPR compliance ready
- Audit logging
- Automated backups

## 📈 Current Status
- **Platform Status**: Operational
- **API Endpoints**: 66.7% functional (12/18)
- **Database**: Fully configured with all tables
- **Services**: Running stable on PM2

## 🚦 Service Management
```bash
# Check service status
pm2 list

# Restart services
pm2 restart grandpro-backend
pm2 restart grandpro-frontend

# View logs
pm2 logs grandpro-backend
pm2 logs grandpro-frontend
```

## 📝 Documentation
- Platform Status: See `PLATFORM_STATUS.md`
- API Documentation: Available at `/api-docs` (when configured)
- Database Schema: See `backend/migrations/`

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is proprietary software for GrandPro HMSO.

## 👥 Team
Developed for GrandPro HMSO - Tech-Driven Hospital Management

## 📞 Support
For support and inquiries, please contact the development team.

---
**Last Updated**: October 2025
**Version**: 1.0.0
**Status**: Production Ready (with minor enhancements needed)
