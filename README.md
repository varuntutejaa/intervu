# Intervu

## Structure

- `frontend/` — React + TypeScript + Vite app
- `backend/` — Express API that talks to a PostgreSQL (AWS RDS) database

## Running locally

**Backend**

```
cd backend
cp .env.example .env   # fill in your RDS endpoint/credentials
npm install
psql "$DATABASE_URL" -f schema.sql   # creates tables + seed data, once
npm run dev             # http://localhost:3001
```

**Frontend**

```
cd frontend
npm install
npm run dev              # http://localhost:5173, proxies /api to the backend
```

The Jobs and Applications pages fetch from `/api/jobs` and `/api/applications`,
which the Vite dev server proxies to `http://localhost:3001` (see
`frontend/vite.config.ts`). Both servers need to be running for those pages
to load data.
