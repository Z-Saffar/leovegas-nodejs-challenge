require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
  });

  const dbName = process.env.DB_NAME || 'leovegas';

  await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);

  const schema = fs
    .readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8')
    .replace(/leovegas/g, dbName);
  const statements = schema.split(';').filter((s) => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) await connection.query(stmt);
  }

  const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${dbName}\`.users`);
  if (rows[0].count === 0) {
    const hash = await bcrypt.hash('password123', 10);
    await connection.query(
      `INSERT INTO \`${dbName}\`.users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@test.com', hash, 'ADMIN']
    );
    console.log('Seeded admin user: admin@test.com / password123');
  }

  await connection.end();
  console.log(`Database setup complete (${dbName}).`);
}

setup().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
