# GrandPro HMSO - Public URL Documentation

## Base URL
**Production URL**: `https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so`

## Application Status
✅ **Frontend**: Active and accessible
✅ **Backend API**: Active and responding
✅ **Database**: Connected (Neon PostgreSQL)

## Functional Public Endpoints

### Core System
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/` | GET | ✅ Working | Frontend homepage |
| `/health` | GET | ✅ Working | System health check |

### Hospital Management
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/hospitals` | GET | ✅ Working | List all hospitals |
| `/api/hospitals/:id` | GET | ✅ Working | Get hospital details |
| `/api/applications` | GET | 🔒 Auth Required | Hospital applications |
| `/api/contracts` | GET | 🔒 Auth Required | Contract management |

### CRM Module
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/crm/owners` | GET | ✅ Working | Hospital owners list |
| `/api/crm/patients` | GET | ✅ Working | Patient list |
| `/api/crm/campaigns` | GET | ✅ Working | Communication campaigns |
| `/api/crm/appointments` | GET | ✅ Working | Appointment management |
| `/api/crm/feedback` | GET | ✅ Working | Patient feedback |

### Core Operations
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/emr/patients` | GET | ✅ Working | Electronic medical records |
| `/api/billing/invoices` | GET | ✅ Working | Billing and invoices |
| `/api/inventory/items` | GET | ✅ Working | Inventory management |
| `/api/hr/staff` | GET | ✅ Working | Staff management |

### Operations Command Centre
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/operations/command-centre/overview` | GET | ✅ Working | Command centre overview |
| `/api/operations/command-centre/metrics` | GET | ✅ Working | Performance metrics |
| `/api/operations/alerts` | GET | ✅ Working | System alerts |
| `/api/operations/projects` | GET | ✅ Working | Project management |

### Partner Integrations
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/insurance/providers` | GET | ✅ Working | Insurance providers |
| `/api/pharmacy/suppliers` | GET | ✅ Working | Pharmacy suppliers |
| `/api/telemedicine/sessions` | GET | ✅ Working | Telemedicine sessions |

### Analytics & AI
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/analytics/dashboard` | GET | ✅ Working | Analytics dashboard |
| `/api/analytics/predictions` | GET | ✅ Working | Predictive analytics |
| `/api/analytics/ml/triage` | GET | ✅ Working | AI triage bot |

### Security & Compliance
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/security/audit-logs` | GET | ✅ Working | Audit logs |
| `/api/security/compliance-status` | GET | ✅ Working | Compliance status |

## Authentication Endpoints
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/auth/login` | POST | ⚠️ Requires Body | User login |
| `/api/auth/register` | POST | ⚠️ Requires Body | User registration |
| `/api/users` | GET | 🔒 Auth Required | User management |

## Sample API Responses

### Health Check
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/health
```
Response:
```json
{
  "status": "healthy",
  "service": "GrandPro HMSO Backend API",
  "timestamp": "2025-10-03T20:30:00.000Z",
  "environment": "development",
  "timezone": "Africa/Lagos",
  "currency": "NGN"
}
```

### Hospital List
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/hospitals
```
Returns list of registered hospitals with Nigerian data.

### CRM Owners
```bash
curl https://grandpro-hmso-morphvm-wz7xxc7v.http.cloud.morph.so/api/crm/owners
```
Returns list of hospital owners with contract and payout information.

## Testing Script
A comprehensive test script is available at:
```bash
/root/grandpro-hmso-new/test-public-urls.sh
```

## Nigerian Localization
All data is configured for the Nigerian market:
- Currency: Nigerian Naira (NGN)
- Timezone: Africa/Lagos
- States: All 36 Nigerian states + FCT
- Sample hospitals: LUTH, National Hospital Abuja, UCH Ibadan

## Access Methods
1. **Direct Browser Access**: Visit the base URL
2. **API Testing**: Use curl, Postman, or any HTTP client
3. **Frontend Application**: Accessible via browser at base URL

## Infrastructure
- **Backend**: Node.js/Express on port 5001
- **Frontend**: React/Vite on port 3001
- **Proxy**: Nginx on port 9000
- **Database**: Neon PostgreSQL (Project: fancy-morning-15722239)
- **Process Manager**: PM2

## Monitoring
- Backend logs: `pm2 logs grandpro-backend`
- Frontend logs: `pm2 logs grandpro-frontend`
- Process status: `pm2 list`

## Support
For any issues or questions about the public URLs, check:
1. Server logs for error details
2. Database connectivity
3. PM2 process status
4. Nginx proxy configuration
