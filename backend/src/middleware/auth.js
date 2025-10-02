const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // For testing, just pass through
  // In production, verify JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // For now, allow unauthenticated requests for testing
    req.user = { id: 'test-user', role: 'admin' };
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    // For testing, allow anyway
    req.user = { id: 'test-user', role: 'admin' };
    next();
  }
};

module.exports = authMiddleware;
