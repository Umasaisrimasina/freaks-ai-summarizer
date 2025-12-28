# Auth Service

Authentication microservice with JWT token-based auth for the AI Study Companion.

## Features

- User registration with bcrypt password hashing
- User login with JWT token generation
- JWT token verification for other services
- PostgreSQL database with Sequelize ORM
- RESTful API endpoints

## Endpoints

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "alex@example.com",
  "password": "SecurePass123!",
  "name": "Alex"
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "uuid-123",
  "message": "User registered successfully"
}
```

### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{
  "email": "alex@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid-123",
    "email": "alex@example.com",
    "name": "Alex"
  }
}
```

### POST /auth/verify
Verify JWT token validity.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "valid": true,
  "user_id": "uuid-123",
  "email": "alex@example.com"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2025-12-28T07:00:00.000Z"
}
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
PORT=3001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/auth_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h
NODE_ENV=development
```

4. Create PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE auth_db;
\q
```

5. Run the service:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The service will automatically create the `users` table on first run.

## Testing

Test with curl:

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Verify (replace TOKEN with actual token from login)
curl -X POST http://localhost:3001/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN"}'
```

## Database Schema

### users table
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- CORS enabled for frontend integration
- Input validation on all endpoints

## Architecture

```
auth-service/
├── src/
│   ├── config/
│   │   └── database.js      # Sequelize connection
│   ├── models/
│   │   └── User.js          # User model
│   ├── controllers/
│   │   └── authController.js # Auth logic
│   ├── routes/
│   │   └── auth.js          # Route definitions
│   └── index.js             # Express server
├── .env.example
├── package.json
└── README.md
```
