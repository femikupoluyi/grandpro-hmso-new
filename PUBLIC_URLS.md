# GrandPro HMSO - Public URLs

## Main Application URL
- **Main URL**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so
- **Frontend Direct**: https://hmso-frontend-morphvm-wz7xxc7v.http.cloud.morph.so

## Available Pages/Routes

### Public Pages (No Login Required)
1. **Login Page**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/login
2. **Onboarding Portal**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/onboarding

### Demo Access Pages (Auto-login)
1. **Patient Portal**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/patient
2. **Owner Dashboard**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/owner
3. **Hospital Dashboard**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/hospital
4. **Command Centre**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/demo/command-centre

### Role-based Dashboards (After Login)
1. **Administrator Dashboard**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/operations
2. **Hospital Staff Dashboard**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/staff/dashboard
3. **Billing Management**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/billing
4. **Inventory Management**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/inventory
5. **HR Management**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/hr

### CRM Pages
1. **Owner CRM**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/owner-crm
2. **Patient CRM**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/patient-crm

### Hospital Management Pages
1. **EMR (Electronic Medical Records)**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/emr
2. **Projects Management**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/projects

## API Endpoints (Backend)
The API is accessible through the main URL with `/api` prefix:
- **Base API URL**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/api

### Key API Endpoints:
- `/api/hospitals` - Get all hospitals
- `/api/contracts` - Get all contracts
- `/api/operations/dashboard` - Operations dashboard data
- `/api/operations/command-centre` - Command centre metrics
- `/api/onboarding/status` - Onboarding status
- `/api/auth/login` - User authentication

## Test Credentials

### Administrator
- Role: Select "Administrator" on login page
- Access: Full system access, Command Centre, all management features

### Hospital Owner
- Role: Select "Hospital Owner" on login page
- Access: Contract management, payout history, communication dashboard

### Hospital Staff
- Role: Select "Hospital Staff" on login page
- Access: EMR, billing, inventory, operations

### Patient
- Role: Select "Patient" on login page
- Access: Appointments, medical history, feedback, loyalty rewards

## Technical Details

### Services Running
1. **Frontend**: React + Vite application served on port 3001
2. **Backend**: Node.js + Express API on port 5001
3. **Nginx**: Reverse proxy on port 80 (main) and 8081 (API direct)
4. **Database**: Neon PostgreSQL (cloud-hosted)

### Process Management
- All services managed by PM2
- Auto-restart enabled for reliability
- Logs available via `pm2 logs`

### CORS Configuration
- All origins allowed for demo purposes
- Proper headers configured in Nginx
- API accessible from any domain

## Status Check
All URLs have been verified and are functional as of the last check.
To verify status:
```bash
curl -I https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so
```

## Notes
- The application uses Nigerian context data (Naira currency, Lagos locations)
- Sample data includes 7 hospitals in Lagos
- Real-time updates configured with 30-second refresh intervals
- All modules are accessible through the main navigation menu
