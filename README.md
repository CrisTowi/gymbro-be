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

Edit `.env` and set your `MONGODB_URI` value. For auth, set a secure `JWT_SECRET` (see `.env.example`).

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

The API will be available at `http://localhost:5001` (or the port in `.env`).

### 5. Create an invitation (one-time)

To register, you need a valid invitation link. From the project root:

```bash
npm run create-invitation
```

This prints a registration URL. Open it in the browser to create your account. The invitation expires after use and after the configured `INVITATION_EXPIRY_DAYS` (default 7).

### 6. Backfill existing data to your user (one-time migration)

If you had sessions or a weekly plan in the database before enabling auth, run the backfill script **after** registering:

```bash
npm run backfill-user-data -- your@email.com
```

Replace `your@email.com` with the email you used to register. This assigns all unclaimed sessions and the unclaimed weekly plan to your account. Run it only once.

## API Endpoints

### Auth (no token required for login/register)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/invitation/:token` | Validate invitation for registration |
| POST | `/api/auth/register` | Register with invitation (body: invitationToken, name, email, password, height?, weight?, goal?) |
| POST | `/api/auth/login` | Login (body: email, password) |
| GET | `/api/auth/me` | Current user (requires Bearer token) |

Protected routes below require `Authorization: Bearer <token>`.

### Exercises (Reference Data, no auth)

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

### Weekly Plan (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weekly-plan` | Get the current user's weekly plan |
| PUT | `/api/weekly-plan` | Update the weekly plan |

### Workout Sessions (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get current user's sessions (`?completed=`, `?routineId=`) |
| GET | `/api/sessions/active` | Get the active (in-progress) session |
| DELETE | `/api/sessions/active` | Clear the active session |
| GET | `/api/sessions/:id` | Get session by ID |
| POST | `/api/sessions` | Create a new session (starts a workout) |
| PUT | `/api/sessions/:id` | Update a session (log sets, finish workout) |

### Stats & Dashboard (auth required)

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
  middleware/             - requireAuth, error handling
  models/                 - Mongoose schemas (User, Invitation, Session, etc.)
  routes/                 - Express route definitions
  seed/                   - Database seed data and script
  index.js                - App entry point
scripts/
  create-invitation.js    - Create a one-time registration invitation
  backfill-user-data.js  - Assign unclaimed sessions/weekly plan to a user (migration)
```
