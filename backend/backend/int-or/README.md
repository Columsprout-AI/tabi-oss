# Tabi BE — int-or (Setup & API)

**int-or** is the single backend surface your frontend talks to. It coordinates:

- **Auth** (Clerk)
- **File upload → GCS** (signed URL) → **ingestion** (headers & batching)
- **Experiment** (10-row preview via OpenAI Assistant)
- **Credits** (estimate)
- **Processing** (apply to whole file) → **export logging**
- **Payments** (Razorpay, with daily FX cache)

---

## 0) Prereqs

- **PostgreSQL 13+** – apply schema at `backend/int-or/db/schema.sql`.
- **MongoDB** – same cluster used by ingestion/experiment/processing.
- **GCS bucket** – CORS configured; ADC available (see §5).
- **Docker** – repo ships a compose that brings up all services.

---

## 1) Environment

Create `backend/int-or/.env` from this example and fill values:

```ini
# Runtime
NODE_ENV=production
PORT=3000

# Postgres
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=columsprout_tabi
DB_PORT=5432

# Mongo (used by some utilities/controllers)
MONGO_URI=

# Clerk
CLERK_WEBHOOK_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Internal services (use Docker service names or host:port)
INGESTION_URL=http://ingestion:5001
EXPERIMENT_URL=http://experiment:5002
PROCESSING_URL=http://processing:5003

# FE webhook base (must be reachable from int-or)
FRONTEND_WEBHOOK_URL=https://<your-fe-domain>

# FX (USD→INR cached daily)
EXCHANGE_RATES_API_KEY=

# Free credits for new users
FREE_USER_CREDITS=10
```

> When running via docker compose, use the service names shown above (`ingestion` / `experiment` / `processing`).

---

## 2) Database & connections

- **Postgres** client (`utils/db.js`) uses the env above. On boot you should see *“Connected to the database”*.
- **Mongo** (`utils/mongoConfig.js`) uses `MONGO_URI` and logs a successful connection.

Apply schema:

```bash
psql -d columsprout_tabi -f backend/int-or/db/schema.sql
```

If you’re starting from an existing DB, see the safe **ALTERs** in the **Appendix** of this doc.

---

## 3) Clerk (Auth) — exact steps

1. In **Clerk Dashboard** create your application.
2. Enable your **sign-in methods** (e.g., Google + Email code).
3. **Webhooks → Add endpoint**
   - **Prod:** `https://<your-domain>/webhook/intor/clerk`
   - **Local (tunnel):** `https://<tunnel>/webhook/intor/clerk`
4. **Subscribe to events:**
   - `user.updated`, `user.deleted`, `session.ended`, `session.removed`
5. **Copy Signing secret** → set `CLERK_WEBHOOK_SECRET` in `.env`.

**Already wired routes**

- **Webhook:** `POST /webhook/intor/clerk` *(raw body parser is enabled)*
- FE should also call (after your auth UI completes):
  - `POST /api/intor/record-signup` *(first time only)*
  - `POST /api/intor/record-login` *(each login)*
  - `POST /api/intor/record-logout` *(logout)*

**Verify:** In Clerk → **Send test event** → expect **2xx**.

---

## 4) Razorpay — setup & flow

- Create a **Razorpay** account and get **Key ID/Secret** → put into `.env`.
- Keep **FX cron** active by setting `EXCHANGE_RATES_API_KEY` (used to convert USD→INR daily at 00:00 UTC). If you’re not using payments yet, comment out the **cron import** in `app.js`.

### Routes

**Create order**

```
POST /api/intor/razorpay/create-order
Body: { "amount": "5.00", "clerkId": "<clerk_user_id>" }  // USD
→ Returns an order_id (amount converted to INR via cached FX).
```

**Verify success**

```
POST /api/intor/razorpay/verify-payment
Body: { "order_id","payment_id","signature" }
→ HMAC verified; credits added: credits = (amount_in_INR / 87) * 100; returns { updatedCredits }.
```

**Mark failed**

```
POST /api/intor/razorpay/fail-payment
Body: { "order_id": "..." }
```

---

## 5) GCS & ADC (Uploads)

### What you need

A **GCS bucket** (e.g., `tabi-files`) with **CORS**:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

Apply:

```bash
gsutil cors set gcs-cors.json gs://<YOUR_BUCKET_NAME>
```

### ADC (Application Default Credentials)

- **Local:** `gcloud auth application-default login` **or** set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json`
- **On GCP runtimes:** attach a **Service Account** to the VM/Cloud Run with:
  - **Storage Object Viewer** (read `uploads/`)
  - **Storage Object Creator** (write `outputs/`)

### Upload path convention

`int-or` issues a **signed PUT URL** and FE uploads to:

```
gs://<bucket>/uploads/<userId>.<fileId>
```

**One-time code constants** (in `controllers/uploadFiletoGCPController.js`):

```js
const storage    = new Storage({ projectId: "<YOUR_GCP_PROJECT_ID>" });
const bucketName = "<YOUR_BUCKET_NAME>";
```

### Endpoints

**Get signed URL**

```http
POST /api/intor/upload-to-GCP
Body: { "sessionId": "<clerk-session-id>" }
→ { "uploadUrl": "<signed PUT url>" }
```

**Register file + extract headers**

```http
POST /api/intor/upload-file
Body:
{
  "inputFilePath": "gs://<bucket>/uploads/<userId>.<fileId>",
  "sessionId": "<clerk-session-id>"
}
→ {
  "message": "File uploaded successfully",
  "fileId": "<id>",
  "headerValues": ["colA","colB","..."]
}
```

*(int-or ties file to the session in SQL, logs activity, and calls ingestion at `${INGESTION_URL}/api/ing/extract-headers`)*

---

## 6) Ingestion handshake

**Env**

```ini
INGESTION_URL=http://ingestion:5001
FRONTEND_WEBHOOK_URL=https://<your-fe-domain>
```

**Start**

```http
POST /api/intor/start-ingestion
Body:
{ "sessionId": "<clerk-session-id>", "inputColumn": "<columnName>" }

Immediate response:
{ "message": "Ingestion started successfully" }
```

*(int-or forwards to `${INGESTION_URL}/api/ing/start-ingestion`)*

**Completion webhook (ingestion → int-or)**

```http
POST /api/intor/ingestion-webhook
{
  "sessionId": "<same session>",
  "fileId": "<id>",
  "inputIndex": 2,
  "ingestionStatus": "Ingestion completed"
}
```

On success, int-or updates SQL and posts to FE:

```http
POST ${FRONTEND_WEBHOOK_URL}/api/ingestion-update
```

---

## 7) Experiment (10-row preview)

**Env**

```ini
EXPERIMENT_URL=http://experiment:5002
```
*(OpenAI keys live in the **experiment** service’s `.env`.)*

**Start**

```http
POST /api/intor/start-experiment
{ "sessionId": "<clerk-session-id>", "inputColumn": "<columnName>", "prompt": "<your prompt>" }
```

Returns a preview payload your FE already consumes (~10 rows).

---

## 8) Credits — estimate

**Env**

```ini
PROCESSING_URL=http://processing:5003
```

**Call**

```http
POST /api/intor/estimate-credits
{ "projectPrompt": "<prompt text>", "sessionId": "<clerk-session-id>" }
```

int-or resolves `userId/fileId/inputIndex`, fetches the latest `exp_credits`, then calls  
`${PROCESSING_URL}/api/proc/estimate-credits` and returns:

```json
{ "message": "Credit estimate retrieved successfully", "creditEstimate": <number> }
```

---

## 9) Processing (final apply) → FE notify

**Env**

```ini
PROCESSING_URL=http://processing:5003
INGESTION_URL=http://ingestion:5001
FRONTEND_WEBHOOK_URL=https://<your-fe-domain>
```

**Start**

```http
POST /api/intor/start-processing
{ "projectPrompt": "<prompt text>", "sessionId": "<clerk-session-id>" }
```

**Behavior**

- Validates user **credits** (from SQL)
- Creates a **project** row and calls `${PROCESSING_URL}/api/proc/start-processing` with:
  ```json
  { "sessionId":"...", "userId":1, "fileId":101, "inputIndex":2, "projectPrompt":"...", "projectId":999 }
  ```

**Webhook (processing → int-or)**

```json
{
  "sessionId":"...",
  "fileId":101,
  "projectId":999,
  "userId":42,
  "projectCredits":123,
  "projectTokens":6912,
  "projectInputTokens":1234,
  "projectOutputTokens":5678,
  "totalCost":"0.0123",
  "inputIndex":2
}
```

**int-or then:**

- Updates **projects + credits**, deducts user credits
- Requests the **output path** from ingestion:
  ```http
  POST ${INGESTION_URL}/api/ing/output-path { userId,fileId,inputIndex } → { downloadUrl }
  ```
- Saves `downloadUrl` to `projects.op_filepath` and `files.s3_path`
- **Notifies FE:** `POST ${FRONTEND_WEBHOOK_URL}/api/process-update`

---

## 10) Export logging

```http
POST /api/intor/record-export
Body: { "sessionId": "<clerk-session-id>" }
```
Marks `files.export_status = '1'` and logs activity.

---

## 11) Run locally (compose)

```bash
docker compose up --build          # all services
# or
docker compose up --build int-or
```

**Services:**

- **int-or** → <http://localhost:3000>  
- **ingestion** → <http://localhost:5001>  
- **experiment** → <http://localhost:5002>  
- **processing** → <http://localhost:5003>

**Handy:**

```bash
docker compose logs -f int-or
docker compose restart int-or
docker compose down
```

> If you don’t use a registry, delete the `image:` lines in `docker-compose.yml` so compose builds/uses local images only.

---

## 12) Troubleshooting

- **403 on GCS PUT** → CORS missing or SA/IAM issue; signed URL may have expired (≈15m).  
- **No FX / 500 on create-order** → set `EXCHANGE_RATES_API_KEY` or comment out FX cron import.  
- **No DB rows after signup** → check Postgres credentials & reachability.  
- **FE didn’t get webhooks** → `FRONTEND_WEBHOOK_URL` wrong/unreachable or FE routes missing.  
- **Ingestion/processing timeouts** → check service URLs (use compose names when local).

---

## 13) Data model — quick map

**Source of truth for DDL:** `backend/int-or/db/schema.sql`.

| Model file                 | Table          | Key columns                                                                 | Used by                                   |
|---------------------------|----------------|-----------------------------------------------------------------------------|-------------------------------------------|
| `models/usersModel.js`    | `users`        | `userid`, `clerkid (UNIQUE)`, `email`, `created_at`, `last_login`, `credits_count`, `delete_account` | auth, payments, processing                |
| `models/sessionsModel.js` | `sessions`     | `serialno`, `sessionid`, `userid`, `fileid`, `timestamp`, `logout_time`     | upload, ingestion, experiment, processing, export |
| `models/filesModel.js`    | `files`        | `fileid`, `userid`, `input_filepath`, `inputcolumn`, `inputindex`, `s3_path`, `export_status` | upload, ingestion, processing, export     |
| `models/experimentsModel.js` | `experiments` | `experimentid`, `fileid`, `exp_prompt`, `exp_credits`, `rand_batch`, `total_tokens`, `input_tokens`, `output_tokens`, `total_cost`, `user_remark` | preview, credits                           |
| `models/creditsModel.js`  | `credits`      | `userid`, `fileid`, `experimentid`, `exp_credits`, `estimated_credits`, `projectid`, `project_credits` | estimation, processing webhook            |
| `models/projectsModel.js` | `projects`     | `projectid`, `userid`, `fileid`, `project_prompt`, `project_credits`, `total_tokens`, `input_tokens`, `output_tokens`, `total_cost`, `op_filepath` | processing                                 |
| `models/paymentsModel.js` | `payments`     | `id`, `userid`, `order_id (UNIQUE)`, `payment_id`, `signature`, `amount`, `currency`, `status`, `created_at` | payments                                   |
| `models/userActivityModel.js` | `user_activity` | `id`, `userid`, `user_action`, `timestamp`, `fileid`                         | logging                                    |
| `models/systemEventsModel.js` | `system_events` | `id`, `userid`, `event_type`, `microservice`, `event_timestamp`             | logging/cleanup                            |

---

## Appendix — Safe schema patches (idempotent)

If you’re migrating an existing DB, apply these ALTER/CREATE INDEX statements:

```sql
-- Users
ALTER TABLE users
  ALTER COLUMN credits_count SET DEFAULT 0,
  ALTER COLUMN created_at    SET DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS users_clerkid_uidx ON users(clerkid);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email));

-- Sessions
CREATE INDEX IF NOT EXISTS sessions_sessionid_ts_idx ON sessions(sessionid, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS sessions_userid_ts_idx   ON sessions(userid,     "timestamp" DESC);

-- Files
ALTER TABLE files
  ALTER COLUMN export_status SET DEFAULT '0';
CREATE INDEX IF NOT EXISTS files_userid_idx ON files(userid);
CREATE INDEX IF NOT EXISTS files_fileid_idx ON files(fileid);

-- Experiments
CREATE INDEX IF NOT EXISTS experiments_fileid_idx ON experiments(fileid);

-- Credits
ALTER TABLE credits
  ADD COLUMN IF NOT EXISTS estimated_credits numeric,
  ADD COLUMN IF NOT EXISTS projectid        integer;
CREATE INDEX IF NOT EXISTS credits_user_file_idx ON credits(userid, fileid, experimentid DESC);

-- Projects
-- Ensure column name matches code: projects.op_filepath
-- If your DB used op_file_path previously:
-- ALTER TABLE projects RENAME COLUMN op_file_path TO op_filepath;
CREATE INDEX IF NOT EXISTS projects_user_file_idx ON projects(userid, fileid);

-- Payments
ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS payments_order_id_key UNIQUE (order_id);
CREATE INDEX IF NOT EXISTS payments_userid_idx ON payments(userid);
ALTER TABLE payments
  ALTER COLUMN status SET DEFAULT 'created';

-- Activity / Events
CREATE INDEX IF NOT EXISTS user_activity_userid_ts_idx
  ON user_activity(userid, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS user_activity_fileid_idx
  ON user_activity(fileid);
CREATE INDEX IF NOT EXISTS system_events_userid_ts_idx
  ON system_events(userid, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS system_events_micro_ts_idx
  ON system_events(microservice, event_timestamp DESC);
```
