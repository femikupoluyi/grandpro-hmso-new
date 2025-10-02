# GrandPro HMSO - Public URLs Documentation

## 🌐 Live Application URLs

### Production Environment
The GrandPro HMSO platform is now fully deployed and accessible at the following URLs:

#### Main Application
- **Frontend URL**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so
- **Backend API URL**: https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so

## ✅ Status: All URLs Functional

All public URLs have been tested and confirmed to be working correctly as of October 2, 2025.

### Test Results Summary:
- ✅ Frontend application loads successfully
- ✅ Backend API responds correctly
- ✅ CORS headers configured properly
- ✅ All modules accessible via routing

## 📍 Key Endpoints

### Frontend Pages (Public Demo)
These demo pages are accessible without authentication for testing purposes:

1. **Command Centre Dashboard**
   - URL: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/demo/command-centre
   - Features: Real-time multi-hospital analytics, configurable alerts, project tracking
   - Tabs: Overview, Alerts, Projects, Analytics

2. **Project Management**
   - URL: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/demo/projects
   - Features: Hospital expansion/renovation tracking, budget management, milestone tracking

### Backend API Endpoints

#### Core APIs (Tested & Working)
- `GET /api/hospitals` - List all hospitals ✅
- `GET /api/users` - List users ✅
- `GET /api/operations/dashboard` - Operations dashboard data ✅
- `GET /api/operations/projects` - Project management data ✅
- `GET /api/operations/alerts` - Alert management ✅
- `GET /api/operations/command-centre` - Command centre metrics ✅

#### Authentication
For protected routes, use these test credentials:
- **Email**: admin@grandpro-hmso.ng
- **Password**: Admin@123
- **Role**: ADMIN

## 🔧 Technical Details

### Infrastructure
- **Hosting**: Morph Cloud (VPS)
- **Web Server**: Nginx (reverse proxy)
- **Backend**: Node.js + Express (Port 5001)
- **Frontend**: React + Vite (Port 3001)
- **Database**: Neon PostgreSQL

### Service Status
```bash
# PM2 Process Status
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ grandpro-backend   │ fork     │ 314  │ online    │ 0%       │ 86.1mb   │
│ 2  │ grandpro-frontend  │ fork     │ 2    │ online    │ 0%       │ 66.8mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

### Nginx Configuration
- Frontend: Port 80 → localhost:3001
- Backend API: Port 8081 → localhost:5001
- CORS: Enabled for all origins

## 🚀 Features Implemented in Command Centre

### 1. Real-Time Dashboard
- System health monitoring
- Key metrics display (patients, staff, revenue, occupancy)
- Auto-refresh intervals (10s, 30s, 1min, 5min)
- Live data indicators

### 2. Alert Management
- Configurable alert rules
- Severity levels (Critical, Warning, Info)
- Alert acknowledgment system
- Filter by severity
- Custom threshold settings

### 3. Project Management Board
- Kanban-style project tracking
- Status categories: Planning, Approved, Active, Completed
- Budget tracking
- Milestone management
- Progress indicators

### 4. Analytics
- Hospital occupancy distribution
- Staff performance metrics
- Patient-to-staff ratios
- Expansion opportunity identification
- Revenue performance charts

## 🧪 Testing Script

A comprehensive testing script is available at:
```bash
/root/grandpro-hmso-new/test-public-urls.sh
```

Run it with:
```bash
chmod +x test-public-urls.sh
./test-public-urls.sh
```

## 🔍 Verification Steps

To verify the URLs are working:

1. **Frontend Test**:
   ```bash
   curl -I https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so
   # Expected: HTTP 200 OK
   ```

2. **API Test**:
   ```bash
   curl https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/api/hospitals
   # Expected: JSON response with hospital data
   ```

3. **Command Centre Test**:
   - Open: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/demo/command-centre
   - Verify all tabs load correctly
   - Check real-time data updates
   - Test alert configuration modal

## 📱 Nigerian Context Implementation

All data and configurations use Nigerian-relevant settings:
- **Currency**: Nigerian Naira (₦)
- **Time Zone**: West Africa Time (WAT)
- **Locations**: Lagos, Abuja, Port Harcourt, etc.
- **Phone Format**: +234 format
- **Sample Data**: Nigerian hospital names and addresses

## 🎯 Summary

The GrandPro HMSO platform is now fully operational with:
- ✅ Publicly accessible URLs
- ✅ Working Command Centre with all features
- ✅ Project Management system
- ✅ Real-time analytics and monitoring
- ✅ Alert configuration system
- ✅ Nigerian context implementation

All URLs have been tested and verified to be functional. The system is ready for demonstration and further development.

---
Last Updated: October 2, 2025, 18:30 WAT
