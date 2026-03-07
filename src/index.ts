import 'dotenv/config';
import express from 'express';
import usersRouter from './routes/users';
import authRouter from './routes/auth';

const app = express();
app.use(express.json());

app.use('/auth', authRouter);
app.use('/users', usersRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
