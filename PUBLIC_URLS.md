# GrandPro HMSO - Public URLs

## Live Application URLs

### Frontend Application
- **URL**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so
- **Description**: Main web application for GrandPro HMSO
- **Port**: 80 (via Nginx proxy to port 3000)

### Backend API
- **URL**: https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so
- **Description**: REST API backend service
- **Port**: 8081 (via Nginx proxy to port 5001)

## Key Endpoints

### Health Check
- **Endpoint**: `GET https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/health`
- **Response**: 
  ```json
  {
    "status": "healthy",
    "service": "GrandPro HMSO Backend API",
    "timestamp": "2025-10-02T15:27:34.898Z",
    "environment": "production"
  }
  ```

### Authentication
- **Register**: `POST https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/api/auth/register`
- **Login**: `POST https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/api/auth/login`

### Application Routes
- **Hospital Application Form**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/onboarding/application
- **Document Upload**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/onboarding/documents
- **Onboarding Dashboard**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/onboarding/dashboard
- **Contract Review**: https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so/onboarding/contract-review

## Service Architecture

### Nginx Configuration
- Port 80 → Frontend (React application served from port 3000)
- Port 8081 → Backend API (Node.js/Express on port 5001)
- CORS enabled for cross-origin requests

### Process Management
- **PM2** manages both frontend and backend processes
- Auto-restart on failure
- Configured to start on system boot
- Process names:
  - `grandpro-backend`
  - `grandpro-frontend`

### Database
- **Provider**: Neon PostgreSQL
- **Database Name**: neondb
- **Connection**: Pooled connection for production use

## Testing the URLs

### Test Frontend
```bash
curl -I https://hmso-app-morphvm-wz7xxc7v.http.cloud.morph.so
```

### Test Backend API
```bash
curl https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/health
```

### Test Registration
```bash
curl -X POST https://hmso-api-morphvm-wz7xxc7v.http.cloud.morph.so/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","name":"Test User","role":"hospital_owner"}'
```

## Monitoring

### Check PM2 Status
```bash
pm2 list
pm2 logs
```

### Check Nginx Status
```bash
nginx -t
nginx -s reload
```

## Maintenance

### Restart Services
```bash
pm2 restart all
```

### View Logs
```bash
pm2 logs grandpro-backend
pm2 logs grandpro-frontend
```

### Update Environment Variables
```bash
pm2 reload ecosystem.config.js --update-env
```

## Security Notes
- HTTPS enabled on all public URLs
- JWT authentication for API endpoints
- CORS configured for secure cross-origin requests
- Environment variables stored securely in PM2 ecosystem config
