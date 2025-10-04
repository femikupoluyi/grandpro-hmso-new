const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GrandPro HMSO Backend'
  });
});

// API Status
app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      status: 'operational',
      database: 'connected',
      timestamp: result.rows[0].time
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Get basic stats
    const hospitals = await pool.query('SELECT COUNT(*) as count FROM hospitals');
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    const patients = await pool.query('SELECT COUNT(*) as count FROM patients');
    
    res.json({
      hospitals: parseInt(hospitals.rows[0].count),
      users: parseInt(users.rows[0].count),
      patients: parseInt(patients.rows[0].count),
      status: 'operational'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.json({
      hospitals: 0,
      users: 0,
      patients: 0,
      status: 'error',
      error: error.message
    });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, hospital_id FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      // In production, verify password hash
      res.json({
        success: true,
        token: 'dummy-jwt-token-' + user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          hospitalId: user.hospital_id
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, role } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, password, fullName, role || 'VIEWER']
    );
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Hospital onboarding
app.get('/api/onboarding/applications', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, h.name as hospital_name 
      FROM applications a 
      LEFT JOIN hospitals h ON h.id = a.hospital_id 
      ORDER BY a.created_at DESC 
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Applications error:', error);
    res.json([]);
  }
});

app.post('/api/onboarding/applications', async (req, res) => {
  const { hospitalName, ownerName, email, phone, address } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO applications (hospital_name, owner_name, email, phone, address, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [hospitalName, ownerName, email, phone, address, 'PENDING']
    );
    
    res.json({
      success: true,
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Application error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Hospital management
app.get('/api/hospital/overview', async (req, res) => {
  try {
    const hospitals = await pool.query('SELECT * FROM hospitals LIMIT 10');
    res.json({
      hospitals: hospitals.rows,
      total: hospitals.rowCount
    });
  } catch (error) {
    console.error('Hospital overview error:', error);
    res.json({
      hospitals: [],
      total: 0
    });
  }
});

// Patient CRM
app.get('/api/crm/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients LIMIT 20');
    res.json(result.rows);
  } catch (error) {
    console.error('Patients error:', error);
    res.json([]);
  }
});

app.post('/api/crm/patients', async (req, res) => {
  const { name, email, phone, dateOfBirth } = req.body;
  
  try {
    const patientId = 'PAT' + Date.now();
    const result = await pool.query(
      'INSERT INTO patients (patient_id, full_name, email, phone, date_of_birth) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [patientId, name, email, phone, dateOfBirth]
    );
    
    res.json({
      success: true,
      patient: result.rows[0]
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Operations Command Centre
app.get('/api/operations/metrics', async (req, res) => {
  try {
    const metrics = {
      patientFlow: {
        inbound: Math.floor(Math.random() * 50) + 20,
        outbound: Math.floor(Math.random() * 30) + 10,
        admissions: Math.floor(Math.random() * 20) + 5
      },
      staffKPIs: {
        onDuty: Math.floor(Math.random() * 100) + 50,
        efficiency: Math.floor(Math.random() * 30) + 70
      },
      financial: {
        dailyRevenue: Math.floor(Math.random() * 500000) + 100000,
        collections: Math.floor(Math.random() * 400000) + 80000
      }
    };
    res.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const summary = {
      totalPatients: Math.floor(Math.random() * 1000) + 500,
      totalRevenue: Math.floor(Math.random() * 10000000) + 5000000,
      averageStay: Math.floor(Math.random() * 5) + 2,
      bedOccupancy: Math.floor(Math.random() * 30) + 60
    };
    res.json(summary);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Partners
app.get('/api/partners/insurance', async (req, res) => {
  res.json({
    providers: [
      { id: 1, name: 'NHIS', status: 'active' },
      { id: 2, name: 'AXA Mansard', status: 'active' },
      { id: 3, name: 'Hygeia HMO', status: 'active' }
    ]
  });
});

// Security
app.get('/api/security/audit-logs', async (req, res) => {
  try {
    const logs = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20');
    res.json(logs.rows);
  } catch (error) {
    res.json([]);
  }
});

// Generic API info
app.get('/api', (req, res) => {
  res.json({
    message: 'GrandPro HMSO API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/status',
      '/api/auth/login',
      '/api/auth/register',
      '/api/dashboard/stats',
      '/api/onboarding/applications',
      '/api/hospital/overview',
      '/api/crm/patients',
      '/api/operations/metrics',
      '/api/analytics/summary',
      '/api/partners/insurance',
      '/api/security/audit-logs'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`
==============================================
GrandPro HMSO Backend Server
==============================================
✓ Server running on http://${HOST}:${PORT}
✓ Health check: http://${HOST}:${PORT}/health
✓ API status: http://${HOST}:${PORT}/api/status
==============================================
  `);
});

module.exports = app;
