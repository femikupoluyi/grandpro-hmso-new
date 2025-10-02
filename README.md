# GrandPro HMSO - Hospital Management Platform

## 🏥 Mission
Create a modular, secure, and scalable platform that allows GrandPro HMSO to recruit and manage hospitals, run daily operations, engage owners and patients, integrate with partners, and provide real-time oversight and analytics.

## 🌍 Nigerian Healthcare Context
- **Currency**: Nigerian Naira (₦)
- **Timezone**: West Africa Time (WAT)
- **Coverage**: All 36 Nigerian states
- **Phone Format**: +234 XXX XXX XXXX

## 📁 Project Structure
This is a modular monorepo with the following structure:

```
grandpro-hmso-new/
├── backend/          # Node.js/Express API server
├── frontend/         # React web application
├── shared/          # Shared utilities and types
└── README.md        # Project documentation
```

## 🎯 Core Modules

### 1. Digital Sourcing & Partner Onboarding
- Web portal for hospital owners to submit applications
- Automated evaluation and scoring system
- Contract generation and digital signing
- Dashboard for tracking onboarding progress

### 2. CRM & Relationship Management
- **Owner CRM**: Track contracts, payouts, communication
- **Patient CRM**: Appointment scheduling, reminders, feedback
- Integrated communication (WhatsApp, SMS, email)

### 3. Hospital Management (Core Operations)
- Electronic Medical Records (EMR)
- Billing and revenue management (cash, insurance, NHIS, HMOs)
- Inventory management for drugs and equipment
- HR and staff rostering
- Real-time analytics dashboards

### 4. Centralized Operations & Development
- Operations Command Centre for multi-hospital monitoring
- Real-time dashboards for patient flow and financial metrics
- Alerting system for anomalies
- Project management for hospital expansions

### 5. Partner & Ecosystem Integrations
- Insurance and HMO integration
- Pharmacy and supplier integration
- Telemedicine capabilities
- Government and NGO reporting

### 6. Data & Analytics
- Centralized data lake
- Predictive analytics for demand and occupancy
- AI/ML features: triage bots, fraud detection, risk scoring

### 7. Security & Compliance
- HIPAA/GDPR compliant
- End-to-end encryption
- Role-based access control
- Disaster recovery and backups

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL (Neon)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/femikupoluyi/grandpro-hmso-new.git
cd grandpro-hmso-new
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend (.env)
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret
PORT=5000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

4. Run the application:
```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

## 💻 Technology Stack

### Backend
- **Framework**: Node.js with Express
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT
- **File Storage**: Local + Cloud backup
- **API**: RESTful

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context/Redux
- **UI Components**: Material-UI
- **Charts**: Recharts

### Infrastructure
- **Hosting**: Cloud deployment ready
- **Database**: Neon PostgreSQL
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Health checks and logging

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev    # Start development server
npm run build  # Build for production
npm test      # Run tests
```

### Frontend Development
```bash
cd frontend
npm run dev    # Start development server
npm run build  # Build for production
npm test      # Run tests
```

### Shared Utilities
The `shared` folder contains:
- Type definitions
- Validation schemas
- Utility functions
- Constants

## 📊 API Documentation

API documentation is available at `/api/docs` when running the backend server.

Key endpoints:
- `GET /api/health` - System health check
- `POST /api/auth/login` - User authentication
- `POST /api/onboarding/applications/submit` - Submit hospital application
- `GET /api/operations/dashboard` - Real-time metrics

## 🔐 Security

- All data encrypted in transit and at rest
- Regular security audits
- RBAC implementation
- API rate limiting
- Input validation and sanitization

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📈 Performance

- Database query optimization
- Caching strategies
- Load balancing ready
- Horizontal scaling support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software for GrandPro HMSO.

## 📞 Support

For support and questions:
- Technical Issues: Create a GitHub issue
- Business Inquiries: Contact GrandPro HMSO team

## 🎯 Roadmap

- [x] Initial project setup
- [ ] Module 1: Digital Sourcing
- [ ] Module 2: CRM
- [ ] Module 3: Hospital Management
- [ ] Module 4: Command Centre
- [ ] Module 5: Partner Integrations
- [ ] Module 6: Analytics
- [ ] Module 7: Security
- [ ] Production deployment
- [ ] Multi-country expansion

---

© 2025 GrandPro HMSO. All rights reserved.
