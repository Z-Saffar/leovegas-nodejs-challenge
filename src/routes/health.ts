import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unhealthy', detail: 'Database unavailable' });
  }
});

export default router;
