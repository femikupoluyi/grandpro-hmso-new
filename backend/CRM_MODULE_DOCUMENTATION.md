# GrandPro HMSO - CRM & Relationship Management Module

## 📋 Overview
The CRM Module provides comprehensive customer relationship management for both hospital owners and patients, including automated communications, loyalty programs, feedback management, and payment tracking.

## 🗄️ Database Schema

### Owner CRM Tables
- **owner_communications** - Communication logs with owners
- **owner_payouts** - Payment tracking and management
- **owner_satisfaction** - Satisfaction survey results

### Patient CRM Tables  
- **patient_profiles** - Extended patient information
- **patient_communications** - Patient communication logs
- **appointment_reminders** - Automated appointment reminders
- **patient_feedback** - Patient feedback and ratings
- **loyalty_points** - Loyalty program points tracking
- **loyalty_transactions** - Points earning/redemption history
- **loyalty_rewards** - Available rewards catalog
- **reward_redemptions** - Reward redemption tracking

### Campaign Management Tables
- **communication_campaigns** - Marketing and health campaigns
- **campaign_recipients** - Campaign recipient tracking

## 🔌 API Endpoints

### Owner CRM Endpoints

#### Get Owner Profile
```
GET /api/crm/owners/:ownerId/profile
```
Returns complete owner profile with contracts, payouts, and satisfaction metrics.

#### Payout Management
```
POST /api/crm/owners/payouts - Create new payout
GET /api/crm/owners/payouts - Get payout history
PATCH /api/crm/owners/payouts/:payoutId/status - Update payout status
POST /api/crm/owners/payouts/process-monthly - Process monthly payouts
```

#### Owner Communications
```
POST /api/crm/owners/:ownerId/communications - Send communication
GET /api/crm/owners/:ownerId/communications - Get communication history
POST /api/crm/owners/communications/bulk - Send bulk communications
```

#### Satisfaction Surveys
```
POST /api/crm/owners/:ownerId/satisfaction - Submit satisfaction survey
GET /api/crm/owners/satisfaction/metrics - Get satisfaction metrics
```

### Patient CRM Endpoints

#### Patient Profile Management
```
POST /api/crm/patients/profile - Register patient profile
GET /api/crm/patients/:patientId/profile - Get patient profile
PATCH /api/crm/patients/:patientId/preferences - Update communication preferences
```

#### Appointment Management
```
POST /api/crm/patients/appointments - Schedule appointment
POST /api/crm/patients/appointments/reminders/process - Process reminders
```

#### Patient Feedback
```
POST /api/crm/patients/:patientId/feedback - Submit feedback
GET /api/crm/patients/feedback/summary - Get feedback summary
```

#### Loyalty Program
```
GET /api/crm/patients/:patientId/loyalty - Get loyalty points
GET /api/crm/patients/:patientId/loyalty/transactions - Get transaction history
POST /api/crm/patients/:patientId/loyalty/award - Award points
GET /api/crm/patients/loyalty/rewards - Get available rewards
POST /api/crm/patients/:patientId/loyalty/redeem - Redeem reward
```

#### Patient Communications
```
POST /api/crm/patients/:patientId/communications - Send communication
GET /api/crm/patients/:patientId/communications - Get communication history
```

### Communication Management Endpoints

#### Campaign Management
```
POST /api/crm/communications/campaigns - Create campaign
GET /api/crm/communications/campaigns - Get campaigns
POST /api/crm/communications/campaigns/:id/execute - Execute campaign
```

#### Communication Services
```
POST /api/crm/communications/send - Send single communication
POST /api/crm/communications/send-bulk - Send bulk communications
POST /api/crm/communications/process-scheduled - Process scheduled messages
GET /api/crm/communications/templates - Get message templates
GET /api/crm/communications/statistics - Get communication statistics
POST /api/crm/communications/test - Test communication channel
```

## 🔧 Services

### CommunicationService
Handles all communication channels (SMS, WhatsApp, Email) with support for:
- Template-based messaging
- Bulk communications with rate limiting
- Scheduled message processing
- Delivery tracking and logging
- Nigerian phone number formatting

### OwnerCRMService
Manages hospital owner relationships:
- Profile management with contract tracking
- Automated monthly payout processing
- Communication logging
- Satisfaction survey management
- Revenue calculation and sharing

### PatientCRMService
Manages patient relationships:
- Extended profile with medical information
- Appointment scheduling with auto-reminders
- Feedback collection and analysis
- Loyalty program with points and rewards
- Communication preference management

## 🌍 Nigerian Context Features

### Data Localization
- **Phone Numbers**: +234 format validation
- **Currency**: NGN (Nigerian Naira) for all financial transactions
- **States**: All 36 Nigerian states + FCT
- **Time Zone**: Africa/Lagos
- **Language**: English (default) with support for local languages

### Insurance Integration
- NHIS (National Health Insurance Scheme) number tracking
- HMO provider integration
- Insurance policy management

### Communication Channels
- SMS via Nigerian carriers
- WhatsApp (widely used in Nigeria)
- Email notifications

## 🔐 Security & Compliance

### Data Protection
- End-to-end encryption for sensitive data
- Role-based access control (RBAC)
- Audit logging for all transactions
- HIPAA/GDPR-aligned practices

### Authentication
- JWT-based authentication
- Session management
- Password security with bcrypt

## 📊 Loyalty Program Features

### Point System
- **Bronze Tier**: 0-1,999 points
- **Silver Tier**: 2,000-4,999 points
- **Gold Tier**: 5,000-9,999 points
- **Platinum Tier**: 10,000+ points

### Point Earning
- Appointment booking: 10 points
- Feedback submission: 20 points
- Referrals: Variable points
- Payment completion: Based on amount

### Rewards
- Discount on services
- Free consultations
- Priority access
- Health packages

## 🚀 Integration Requirements

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Communication Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+234...
TWILIO_WHATSAPP_NUMBER=+14155238886

SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@grandprohmso.ng
```

### Dependencies
```json
{
  "express": "^4.x",
  "cors": "^2.x",
  "@neondatabase/serverless": "^0.x",
  "twilio": "^4.x",
  "@sendgrid/mail": "^7.x",
  "date-fns": "^2.x",
  "express-validator": "^7.x",
  "bcryptjs": "^2.x",
  "jsonwebtoken": "^9.x"
}
```

## 🧪 Testing

### Running Tests
```bash
# Start the server
node server.js

# Run CRM module tests
node test-crm-module.js
```

### Test Coverage
- Owner CRM operations
- Patient CRM operations
- Communication services
- Loyalty program
- Campaign management

## 📈 Analytics & Metrics

### Owner Metrics
- Average satisfaction score
- Payout completion rate
- Communication engagement rate
- Contract renewal rate

### Patient Metrics
- Appointment attendance rate
- Feedback response rate
- Loyalty program engagement
- Communication preferences

### System Metrics
- Message delivery rate
- Campaign effectiveness
- API response times
- Error rates

## 🔄 Scheduled Jobs

### Automated Processes
1. **Appointment Reminders**: Run every hour
2. **Monthly Payouts**: Run on 1st of each month
3. **Scheduled Communications**: Run every 15 minutes
4. **Loyalty Point Expiry**: Run daily at midnight

### Implementation with node-cron
```javascript
const cron = require('node-cron');

// Process reminders every hour
cron.schedule('0 * * * *', async () => {
  await patientCRMService.processAppointmentReminders();
});

// Process monthly payouts
cron.schedule('0 0 1 * *', async () => {
  await ownerCRMService.processMonthlyPayouts();
});
```

## 📱 Frontend Integration

### Required Components
1. Owner Dashboard
2. Patient Portal
3. Communication Center
4. Loyalty Program UI
5. Feedback Forms
6. Campaign Manager

### API Integration Example
```javascript
// Fetch owner profile
const ownerProfile = await fetch(`/api/crm/owners/${ownerId}/profile`);

// Submit patient feedback
const feedback = await fetch(`/api/crm/patients/${patientId}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(feedbackData)
});
```

## 🎯 Next Steps

1. Implement frontend components
2. Set up scheduled job runners
3. Configure production communication services
4. Add more sophisticated analytics
5. Implement AI-based patient risk scoring
6. Add telemedicine integration
7. Enhance loyalty program with gamification

## 📝 License
Proprietary - GrandPro HMSO © 2025
