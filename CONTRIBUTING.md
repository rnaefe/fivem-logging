# Contributing

This project is strongest when changes respect the split that makes it work: emitters stay cheap, the backend stays thin, Elasticsearch handles log search, MySQL handles relational state, and the dashboard enforces access before proxying queries.

## Local Setup

```bash
cd backend
npm install
cp env.example .env

cd ../dashboard
npm install
cp env.example .env.local
```

Create MySQL state:

```bash
mysql -u root -p < backend/database/schema.sql
```

Run Elasticsearch before starting the backend. The backend bootstraps the log index if it is missing.

## Pull Requests

- Keep backend, dashboard, database, and adapter changes separated when they are unrelated.
- Update docs when an endpoint, environment variable, schema table, or deployment assumption changes.
- Include screenshots for UI changes.
- Call out API contract changes between the emitter and `/log`.
- Do not commit `.env` files or secrets.

## Engineering Bar

- Do not move expensive work into the source runtime unless there is no other place for it.
- Prefer Elasticsearch aggregations over fetching logs and counting in app code.
- Keep permission checks in server-side dashboard routes, not only in React visibility rules.
- Keep MySQL as the source of truth for users, sessions, servers, channels, and access.
- Keep ingest failure non-fatal to the observed runtime.

## Security Reports

Do not open a public issue for vulnerabilities involving OAuth, JWT/session handling, unauthorized search, Elasticsearch exposure, or ingest abuse. Report privately to the maintainer so the fix can land before public disclosure.
