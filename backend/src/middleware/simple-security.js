const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Basic rate limiter
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply all security middleware
const applyAll = (app) => {
  // Basic security headers with helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for now to avoid conflicts
    crossOriginEmbedderPolicy: false
  }));

  // CORS
  app.use(cors(corsOptions));

  // Basic rate limiting
  app.use(createRateLimiter());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        status: err.status || 500
      }
    });
  });
};

module.exports = {
  applyAll,
  corsOptions,
  createRateLimiter
};
