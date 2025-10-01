# Voting System Backend

MVP backend for an organization voting system built with Hono.js and MongoDB Atlas.

## Features

- **Authentication**: JWT-based login system
- **Dynamic CRUD**: Generic CRUD operations for all collections
- **Soft Delete**: All delete operations use soft delete
- **Search & Pagination**: Built-in search and pagination support
- **Vote Constraints**: Prevents duplicate voting per position/period

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Hono.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with NIS and password
- `GET /api/auth/profile` - Get current user profile (protected)

### CRUD Operations (All protected)
- `GET /api/{collection}` - Get all records with pagination/search
- `GET /api/{collection}/{id}` - Get single record by ID
- `POST /api/{collection}` - Create new record
- `PUT /api/{collection}/{id}` - Update record
- `DELETE /api/{collection}/{id}` - Soft delete record

### Collections
- `users` - User management
- `positions` - Voting positions (Ketua, Sekretaris, etc.)
- `candidates` - Candidates for each position
- `votes` - Vote records
- `elections` - Election periods

### Query Parameters
- `search` - Search in text fields
- `limit` - Number of records (1-100 or "no_limit")
- `page` - Page number for pagination
- `is_count` - Return only count (true/false)

## Example Usage

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nis": "123456", "password": "password123"}'
```

### Get Users (with auth)
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Candidate
```bash
curl -X POST http://localhost:3000/api/candidates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "position_id": 1,
    "candidate_number": 1,
    "period_start": 2025,
    "period_end": 2026,
    "user_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "vision_mission": "Make the organization better"
  }'
```

## Database Schema

See the models in `src/models/` for detailed schema definitions.

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Development

The project uses ES modules and follows these conventions:
- **Variables**: `snake_case`
- **Functions**: `camelCase`
- **Files**: `snake_case.dot.case`

## Health Check

Visit `http://localhost:3000/health` to check if the service is running.