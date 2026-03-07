import { Request, Response, NextFunction } from 'express';
import { formatErrors } from '../utils/jsonapi';

type AuthenticatedRequest = Request & { user: { userId: number; email: string; role: string } };

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json(formatErrors([{ status: '403', title: 'Forbidden', detail: 'Admin access required' }]));
  }
  next();
};

const requireOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(403).json(formatErrors([{ status: '403', title: 'Forbidden', detail: 'Authentication required' }]));
  }
  const targetUserId = req.params.id;
  const currentUserId = user.userId;

  if (Number(targetUserId) === currentUserId || user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json(formatErrors([{ status: '403', title: 'Forbidden', detail: 'You can only access your own profile' }]));
  }
};


export { requireAdmin, requireOwnerOrAdmin };   