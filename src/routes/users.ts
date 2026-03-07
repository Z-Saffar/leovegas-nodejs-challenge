import { Router, Request, Response } from 'express';
import userModel, { UPDATABLE_FIELDS } from '../models/user';
import type { ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['name, email, and password are required'],
      });
    }

    const userData = {
      name: String(name).trim(),
      email: String(email).trim(),
      password: String(password),
      role: role ?? 'USER',
    };

    const result = (await userModel.createUser(userData)) as ResultSetHeader;
    res.status(201).json({
      data: {
        type: 'users',
        id: String(result.insertId),
        attributes: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('POST /users error:', err.message ?? err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        errors: [{ status: '409', title: 'Conflict', detail: 'Email already exists' }],
      });
    }
    const isDev = process.env.NODE_ENV !== 'production';
    const detail = isDev ? String(err.message ?? err) : 'Failed to create user';
    res.status(500).json({
      errors: [{ status: '500', title: 'Internal Server Error', detail }],
    });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await userModel.getAllUsers();
    res.status(200).json({
      data: rows.map((row) => ({
        type: 'users',
        id: String(row.id),
        attributes: {
          name: row.name,
          email: row.email,
          role: row.role,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [{ status: '500', title: 'Internal Server Error', detail: 'Failed to get all users' }],
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({
        errors: [{ status: '404', title: 'Not Found', detail: 'User not found' }],
      });
    }
    const { id: _id, ...attributes } = user as Record<string, unknown> & { id: number };
    res.status(200).json({
      data: { type: 'users', id: String(user.id), attributes },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [{ status: '500', title: 'Internal Server Error', detail: 'Failed to get user' }],
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userData: Record<string, string> = {};
    for (const key of UPDATABLE_FIELDS) {
      if (req.body[key] !== undefined) {
        userData[key] = req.body[key];
      }
    }
    if (Object.keys(userData).length === 0) {
      return res.status(400).json({
        errors: [{ status: '400', title: 'Bad Request', detail: 'At least one field (name, email, role) is required' }],
      });
    }
    const result = await userModel.updateUser(id, userData);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        errors: [{ status: '404', title: 'Not Found', detail: 'User not found' }],
      });
    }
    res.status(200).json({
      data: { type: 'users', id, attributes: userData },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [{ status: '500', title: 'Internal Server Error', detail: 'Failed to update user' }],
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await userModel.deleteUser(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        errors: [{ status: '404', title: 'Not Found', detail: 'User not found' }],
      });
    }
    res.status(200).json({ data: { type: 'users', id, attributes: {} } });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [{ status: '500', title: 'Internal Server Error', detail: 'Failed to delete user' }],
    });
  }
});

export default router;
