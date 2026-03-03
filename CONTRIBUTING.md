# Contributing to GymTrack API

Thanks for your interest! This is the Express/MongoDB backend. The frontend lives in [gymtrack](https://github.com/CrisTowi/gymtrack).

## Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (free tier is fine) or a local MongoDB instance

## Local setup

```bash
# 1. Clone
git clone https://github.com/CrisTowi/gymtrack-be.git
cd gymtrack-be

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET at minimum
# See .env.example for all options

# 4. Seed the exercise catalog
npm run seed

# 5. Create your first user
npm run create-invitation
# Open the printed URL in the browser (frontend must be running)

# 6. Start the dev server
npm run dev
```

The API will be at `http://localhost:5001`.

## Before submitting a PR

- The project has no automated test suite yet — manual testing against the running server is expected
- Make sure `npm run dev` starts without errors
- Run `node --check src/index.js` to catch obvious syntax errors

## Conventions

- **Controllers**: all business logic lives in `src/controllers/` — routes are thin (just `router.get(..., controller.method)`)
- **Auth**: all non-public routes must use the `requireAuth` middleware
- **LLM provider**: always resolved from `process.env.LLM_PROVIDER` — never accept it from a request body
- **IDs**: MongoDB uses `_id`; normalize to `id` in response helpers, not in schemas
- **No new dependencies** without a clear reason

## Reporting bugs

Open an issue with steps to reproduce, the request that triggers the bug, and the error/response you see.
