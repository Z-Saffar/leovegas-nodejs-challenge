import mysql from 'mysql2/promise';

const dbName = process.env.VITEST
  ? (process.env.DB_NAME_TEST ?? 'leovegas_test')
  : (process.env.DB_NAME ?? 'leovegas');

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
