import { JwtPayload } from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload & { userId: number; email: string; role: string };
  }
}
