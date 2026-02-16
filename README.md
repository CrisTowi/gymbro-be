# GymTrack API

REST API backend for the GymTrack workout tracker, built with Express and MongoDB.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your MongoDB Atlas URI:

```bash
cp .env.example .env
```

Edit `.env` and set your `MONGODB_URI` value.

### 3. Seed the database

Populate exercises, routines, and the default weekly plan:

```bash
npm run seed
```

### 4. Run the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

## API Endpoints

### Exercises (Reference Data)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercises` | Get all exercises (`?category=`, `?tag=`) |
| GET | `/api/exercises/categories` | Get all muscle group categories |
| GET | `/api/exercises/:id` | Get exercise by ID |
| GET | `/api/exercises/:id/alternatives` | Get alternative exercises (`?exclude=id1,id2`) |

### Routines (Reference Data)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routines` | Get all routines |
| GET | `/api/routines/:id` | Get routine by ID |

### Weekly Plan

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weekly-plan` | Get the weekly plan |
| PUT | `/api/weekly-plan` | Update the weekly plan |

### Workout Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get all sessions (`?completed=`, `?routineId=`) |
| GET | `/api/sessions/active` | Get the active (in-progress) session |
| DELETE | `/api/sessions/active` | Clear the active session |
| GET | `/api/sessions/:id` | Get session by ID |
| POST | `/api/sessions` | Create a new session (starts a workout) |
| PUT | `/api/sessions/:id` | Update a session (log sets, finish workout) |

### Stats & Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/overview` | Aggregate stats (sessions, weight, PRs) |
| GET | `/api/stats/personal-records` | All personal records by exercise |
| GET | `/api/stats/last-session` | Most recent completed session |
| GET | `/api/stats/exercises/:id/history` | Exercise progress history |
| GET | `/api/stats/exercises/:id/last` | Last performance for an exercise |
| GET | `/api/stats/exercises/:id/recommended-sets` | Recommended sets (`?sets=4`) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## Project Structure

```
src/
  config/db.js            - MongoDB connection
  controllers/            - Route handlers
  middleware/              - Error handling
  models/                 - Mongoose schemas
  routes/                 - Express route definitions
  seed/                   - Database seed data and script
  index.js                - App entry point
```
