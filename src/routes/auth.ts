import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/user';
import { formatErrors, formatResource } from '../utils/jsonapi';
import { validate } from '../middleware/validate';
import { loginValidators } from '../validators/auth';

const router = Router();

router.post('/login', validate(loginValidators), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findUserByEmail(String(email).trim());
    if (!user) {
      return res.status(401).json(
        formatErrors([{ status: '401', title: 'Unauthorized', detail: 'Invalid email or password' }])
      );
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json(
        formatErrors([{ status: '401', title: 'Unauthorized', detail: 'Invalid email or password' }])
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('POST /auth/login: JWT_SECRET is not configured');
      return res.status(500).json(
        formatErrors([{ status: '500', title: 'Internal Server Error', detail: 'Server configuration error' }])
      );
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      secret,
      { expiresIn: '2h' }
    );

    res.status(200).json(formatResource('auth', user.id, { access_token: token }));
  } catch (error) {
    console.error('POST /auth/login:', error);
    res.status(500).json(
      formatErrors([{ status: '500', title: 'Internal Server Error', detail: 'Failed to login' }])
    );
  }
});

export default router;
