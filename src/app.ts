import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import { formatErrors } from './utils/jsonapi';

const app = express();
app.use(express.json());

app.use('/auth', authRouter);
app.use('/users', usersRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json(formatErrors([{ status: '500', title: 'Internal Server Error', detail: 'An unexpected error occurred' }]));
});

export default app;