import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { formatErrors } from '../utils/jsonapi';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(formatErrors([{ status: '401', title: 'Unauthorized', detail: 'No token provided' }]));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json(formatErrors([{ status: '401', title: 'Unauthorized', detail: 'No token provided' }]));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('Auth middleware: JWT_SECRET is not configured');
    return res.status(500).json(
      formatErrors([{ status: '500', title: 'Internal Server Error', detail: 'Server configuration error' }])
    );
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: number; role: string; email: string };
    (req as Request & { user: typeof decoded }).user = decoded;
    next();
  } catch {
    return res.status(401).json(formatErrors([{ status: '401', title: 'Unauthorized', detail: 'Invalid or expired token' }]));
  }
};

export default authMiddleware;
