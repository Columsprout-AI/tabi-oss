Got it — here’s a clean, paste-ready `backend/int-or/db/README.md` with proper Markdown fences and no “Copy/Edit” artifacts:

```md
# Postgres schema setup (int-or)

This folder contains the SQL needed for Tabi’s backend (int-or + other services) to run.

## Prereqs
- PostgreSQL 13+ (or a managed instance)
- `psql` on your PATH
- **DB name used in examples:** `columsprout_tabi` (use underscores, not hyphens)

## 1) Create a database
```bash
createdb columsprout_tabi
# or:
psql -c "CREATE DATABASE columsprout_tabi;"
```

## 2) Apply schema
```bash
psql -d columsprout_tabi -f backend/int-or/db/schema.sql
```

> If you load data first (from a dump), adding FKs may fail if there are orphans.  
> Clean up orphans, then re-run the FK `ALTER TABLE` statements from `schema.sql`.

## 3) Configure the backend
Set these in `backend/int-or/.env`:
```ini
DB_HOST=<your-host>      # e.g. localhost or private IP
DB_USER=<username>
DB_PASSWORD=<password>
DB_NAME=columsprout_tabi
DB_PORT=5432
```

**Remote psql quick example (optional)**
```bash
psql "host=<host> port=5432 dbname=columsprout_tabi user=<user> sslmode=disable"
# If your DB requires SSL, use: sslmode=require
# (and update utils/db.js if you want the app itself to use SSL)
```

> This repo does **not** ship a seed. All rows are created via normal app flows (signup/login/upload/etc).  
> For testing, you can grant credits:
```sql
UPDATE users SET credits_count = 1000 WHERE email = 'you@example.com';
```

## 4) Verify
```bash
psql -d columsprout_tabi -c "\dt"
# should list: users, sessions, files, experiments, credits, projects, payments, user_activity, system_events
```

## Notes
- Models mapping: see `backend/int-or/README.md` → **Data model — quick map**.
- The app’s PG client uses `ssl: false` by default (`utils/db.js`).  
  For hosted DBs that require SSL, put a proxy/terminator in front **or** modify the client config.
- Cleanup cron deletes records older than **10 days** in `user_activity`, `system_events`, and `sessions`.
```