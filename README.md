# Node.js Challenge

A RESTful API for user management with authentication and role-based authorization. Built with Node.js, TypeScript, Express, and MySQL.

## Features

- **User CRUD** – Create, read, update, and delete users
- **Authentication** – JWT-based login
- **Authorization** – Role-based access (USER, ADMIN)
- **Validation** – Request validation with express-validator
- **JSON:API** – Responses follow JSON:API format

### Roles

| Role | Permissions |
|------|-------------|
| **USER** | View/update own profile only |
| **ADMIN** | List all users, view/update/delete any user (except self-delete) |

## Tech Stack

- Node.js + TypeScript
- Express
- MySQL (mysql2)
- JWT (jsonwebtoken)
- bcrypt, express-validator
- Vitest + Supertest (testing)

## Prerequisites

- Node.js 18+
- MySQL 8+ (or Docker)

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd Leovegas-nodejs-challange
npm install
```

### 2. Environment variables

Copy the example env file and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=leovegas
JWT_SECRET=your-secret-key
```

### 3. Database

**Option A: Using Docker**

```bash
docker-compose up -d
npm run db:setup
```

**Option B: Existing MySQL**

Ensure MySQL is running, then:

```bash
npm run db:setup
```

This creates the database, `users` table, and seeds an admin user:

- **Email:** `admin@test.com`
- **Password:** `password123`

## Run

**Development (with hot reload):**

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

Server runs at `http://localhost:3000`.

## Tests

**Run all tests:**

```bash
npm test
```

**Watch mode (re-run on file changes):**

```bash
npm run test:watch
```

**With coverage:**

```bash
npm run test:coverage
```

> **Note:** Tests use the same database. Ensure `.env` is configured and MySQL is running.

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Login, returns JWT |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users` | No | Create user |
| GET | `/users` | Admin | List all users |
| GET | `/users/:id` | Owner or Admin | Get user by ID |
| PUT | `/users/:id` | Owner or Admin | Update user |
| DELETE | `/users/:id` | Admin | Delete user |

For API testing with Bruno, see [bruno/README.md](bruno/README.md).

## Project Structure

```
src/
├── config/       # Database connection
├── middleware/   # Auth, validation, authorization
├── models/       # User model
├── routes/       # Auth and user routes
├── test/         # Test helpers
├── types/        # TypeScript declarations
└── utils/       # JSON:API helpers
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled app |
| `npm test` | Run tests |
| `npm run db:setup` | Initialize database and seed admin |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
