# SQL Showdown

Full-stack SQL competition platform with a React frontend and a Node.js/TypeScript backend judge.

This repository contains two apps:

- `sql_shd_frontend` - Contestant and admin UI (React + Vite + TypeScript)
- `sql_shd_backend` - API, authentication, SQL execution, and judging (Express + TypeScript + MongoDB)

## What This Project Does

- Team login/authentication with JWT
- Fetches contest questions from backend
- Lets teams run SQL and submit judged answers
- Integrates with OneCompiler (via RapidAPI) for SQL execution
- Stores users, questions, progress, and submissions in MongoDB
- Includes admin functionality for question and contest management

## Repository Structure

```text
.
├── sql_shd_backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   ├── API.md
│   ├── QUICKSTART.md
│   └── SETUP.md
└── sql_shd_frontend/
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── pages/
    │   ├── services/
    │   └── types/
    ├── package.json
    └── .env.example
```

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite (rolldown-vite)
- React Router
- Monaco Editor
- Tailwind CSS

### Backend

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT + bcrypt authentication
- OneCompiler API (RapidAPI)
- Helmet + CORS + rate limiting

## Prerequisites

- Node.js 20.x
- npm 10.x
- MongoDB Atlas (or local MongoDB)
- RapidAPI key for OneCompiler

## Quick Start (Run Full Stack)

### 1. Start Backend

```bash
cd sql_shd_backend
npm install
```

Create a `.env` file in `sql_shd_backend` with at least:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=24h

RAPIDAPI_KEY=<your-rapidapi-key>
RAPIDAPI_HOST=onecompiler-apis.p.rapidapi.com
ONECOMPILER_URL=https://onecompiler-apis.p.rapidapi.com/api/v1/run

FRONTEND_URL=http://localhost:5173

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_RUN=30
RATE_LIMIT_MAX_SUBMIT=20
```

(Optional) Seed sample data:

```bash
npm run seed
```

Run backend:

```bash
npm run dev
```

Backend API base URL: `http://localhost:5000/api`
Health check: `http://localhost:5000/health`

### 2. Start Frontend

In a separate terminal:

```bash
cd sql_shd_frontend
npm install
```

Create `sql_shd_frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## NPM Scripts

### Backend (`sql_shd_backend`)

- `npm run dev` - Start backend in development (nodemon + ts-node)
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled server
- `npm run seed` - Seed sample questions and demo data
- `npm run seed:chest1` - Seed chest1 question set
- `npm run seed:teams` - Seed teams
- `npm run generate:sheets` - Generate team sheets
- `npm run lint` - Lint backend code
- `npm run format` - Format backend source

### Frontend (`sql_shd_frontend`)

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm start` - Serve built app from `dist`
- `npm run lint` - Lint frontend code

## Main API Areas (Backend)

- `/api/auth` - login, register, logout
- `/api/questions` - list/get questions
- `/api/run` - run SQL and submit SQL
- `/api/competition` - competition state/progress
- `/api/submissions` - submission endpoints
- `/api/admin` - admin operations

See detailed API documentation in `sql_shd_backend/API.md`.

## Notes and Current Gotchas

- Backend defaults to port `5000`, while frontend service fallback in code points to `5001`.
  - Always set `VITE_API_URL=http://localhost:5000/api` for local development unless you explicitly run backend on 5001.
- `sql_shd_frontend/.env.example` currently contains a typo (`localhos` instead of `localhost`).
  - Use your own `.env` with a correct URL.
- Backend docs reference `.env.example`, but the file is not currently present in `sql_shd_backend`.
  - Create `.env` manually using the variables listed in this README or `sql_shd_backend/SETUP.md`.

## Recommended Development Workflow

1. Start backend first and verify `/health` responds.
2. Start frontend and confirm login page loads.
3. Log in with a seeded/demo account (if data seeded).
4. Open a question, run SQL, then submit to verify judge flow.
5. Use admin routes for contest and question management.

## Deployment

Each app has a `Procfile` for deployment-oriented setups.

General order:

1. Deploy backend and set production env variables.
2. Set frontend `VITE_API_URL` to deployed backend `/api` URL.
3. Build and deploy frontend.

## Additional Documentation

- Backend overview: `sql_shd_backend/README.md`
- Backend setup: `sql_shd_backend/SETUP.md`
- Backend API reference: `sql_shd_backend/API.md`
- Frontend quickstart notes: `sql_shd_frontend/QUICKSTART.md`
- Frontend implementation notes: `sql_shd_frontend/IMPLEMENTATION_SUMMARY.md`
