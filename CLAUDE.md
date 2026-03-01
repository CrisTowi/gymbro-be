# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo with two separate apps:

```
GymTrack/
├── gymtrack/        # Frontend — Next.js 16 / TypeScript / React 19
└── gymtrack-be/     # Backend — Node.js / Express 5 / MongoDB
```

All frontend work happens under `gymtrack/`, all backend work under `gymtrack-be/`. There is no shared package between them.

## Commands

### Frontend (`gymtrack/`)

```bash
npm run dev              # Start dev server on :3000
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Jest (all tests)
npm run test:watch       # Jest in watch mode
npm run test -- --testPathPattern=<name>  # Run a single test file
npm run test:coverage    # Coverage report
npm run validate-i18n    # Check for missing/extra i18n keys between en.json and es.json
```

### Backend (`gymtrack-be/`)

```bash
npm run dev              # nodemon dev server on :5001
npm run seed             # Populate exercises, routines, and default weekly plan (first-time setup)
npm run create-invitation  # Generate a one-time registration link (printed to stdout)
npm run backfill-user-data -- <email>  # One-time: assign pre-auth data to a user
```

## Architecture

### Authentication Flow

Registration is invite-only. `npm run create-invitation` generates a token stored in the `Invitation` collection. The user visits `APP_URL/register?token=<token>` to create an account. After login, a JWT is returned and stored in `localStorage` by `AuthContext`. All protected API calls include `Authorization: Bearer <token>`.

`AuthGuard` (wraps the root layout) redirects unauthenticated users to `/login`. Public routes: `/login`, `/register`.

### Frontend Data Flow

- `src/lib/api.ts` — single API client module; all HTTP calls go through the `request()` helper which injects the auth token automatically.
- `src/context/AuthContext.tsx` — manages the JWT and `User` object globally.
- `src/context/LocaleContext.tsx` — manages `'en' | 'es'` locale; persists to user profile via `PATCH /api/auth/me`.
- Pages live in `src/app/` (Next.js App Router). Components are in `src/components/`.
- i18n strings live in `messages/en.json` and `messages/es.json`. Use `useTranslations('<namespace>')` from `next-intl`. When adding new strings, always add to both files.

### Backend Structure

- `src/index.js` — Express app setup, middleware, route mounting.
- `src/controllers/` — all business logic; one file per domain.
- `src/routes/` — thin Express routers; map HTTP verbs to controller functions.
- `src/models/` — Mongoose schemas: `User`, `Invitation`, `Exercise`, `Routine`, `Session`, `WeeklyPlan`.
- `src/middleware/requireAuth.js` — JWT verification; attach `req.user.userId` for use in controllers.
- `src/lib/llm.js` — LLM adapter. Provider is resolved from `LLM_PROVIDER` env var (default: `'google'`). Never accept a provider from the request body — it must come from the environment only.

### LLM / AI Routine Generation

Provider is set via `LLM_PROVIDER=openai|anthropic|google` in `gymtrack-be/.env`. Default is `google`. Model overrides: `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `GOOGLE_MODEL`. The provider is resolved exclusively server-side — the frontend does not send or display a provider choice.

### Workout Session Lifecycle

1. `POST /api/sessions` — creates a session (`completed: false`)
2. `PUT /api/sessions/:id` — updates sets/reps during workout; marks `completed: true` on finish
3. `GET /api/sessions/active` — returns the in-progress session (at most one per user)
4. Personal records are calculated and stored on session completion inside `statsController`.

### Weekly Plan

`WeeklyPlan` maps each day of the week to a `Routine` ObjectId (or `null` for rest). The `generate` endpoint uses the LLM to convert a natural language description into a day→routine mapping using the user's actual routine names.

## Environment Setup

### Backend `.env`

```
PORT=5001
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:3000
LLM_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=...
GOOGLE_MODEL=models/gemini-3-flash-preview
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## Key Conventions

- **IDs**: MongoDB uses `_id` internally. The frontend normalizes to `id` via `normalizeRoutine()` / `normalizeSession()` helpers in `api.ts`. Don't assume `_id` exists on frontend objects.
- **Exercise names/descriptions**: Always stored as `Record<Locale, string>` (`{ en: '...', es: '...' }`). Legacy string values are normalized at the API layer in `api.ts`.
- **CSS**: Scoped CSS Modules (`.module.css`) per component. No global utility classes.
- **No shared state library**: State is local (`useState`) or in the two React Contexts. No Redux/Zustand.
