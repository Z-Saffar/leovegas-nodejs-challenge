import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import pool from '../config/database';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UserDbRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const createUser = async (user: CreateUserInput) => {
  const hashPassword = await bcrypt.hash(user.password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [user.name, user.email, hashPassword, user.role]
  );
  return result;
};

const getAllUsers = async () => {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT id, name, email, role, created_at, updated_at FROM users'
  );
  return rows;
};

const getUserById = async (id: string) => {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
};

export const UPDATABLE_FIELDS = ['name', 'email', 'role'] as const;

const updateUser = async (
  id: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'role'>>
): Promise<{ affectedRows: number }> => {
  const fields: string[] = [];
  const values: (string | undefined)[] = [];

  for (const field of UPDATABLE_FIELDS) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (fields.length === 0) {
    return { affectedRows: 0 };
  }

  values.push(id);
  const [result] = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result as unknown as { affectedRows: number };
};

const deleteUser = async (id: string): Promise<{ affectedRows: number }> => {
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return result as unknown as { affectedRows: number };
};

export default {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
