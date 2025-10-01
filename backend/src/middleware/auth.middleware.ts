import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Simplified authentication for testing
  // In production, this would verify JWT tokens
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'No authorization header' 
    });
  }

  // Mock user for testing
  req.user = {
    id: 'test-user-id',
    email: 'admin@grandpro-hmso.ng',
    role: 'SUPER_ADMIN',
    firstName: 'Test',
    lastName: 'Admin'
  };
  
  next();
};
