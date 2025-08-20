# Tabi Backend

**Tabi** is an AI-powered data engine that lets users create, transform, enrich, and manipulate data at scale from plain spreadsheets.  
Give it a CSV, choose a column, describe the transformation in natural language, and Tabi returns a new column (or columns) — **preview first**, then **apply to all rows** — with usage metered and logged.

This backend is a small set of services wired together:

- **int-or** — the single API your frontend talks to (auth, file upload, orchestration, payments).
- **ingestion** — reads the uploaded CSV from GCS, finds the selected column, writes 10-row batches to Mongo.
- **experiment** — runs a quick 10-row preview with your OpenAI Assistant.
- **processing** — applies the final prompt to all rows, then ships a downloadable CSV.

---

## How it feels (one simple example)

**Sheet:** a CSV with a `description` column.  
**Goal:** generate two ad headlines per row.

### 1) Upload

- FE asks **int-or** for a **signed URL** → the browser uploads the CSV to:  
  `gs://<bucket>/uploads/<userId>.<fileId>`
- FE registers the upload with `POST /api/intor/upload-file` and includes the CSV **headers** so the backend can log the file, infer columns, etc.

### 2) Select a column & ingest

- User picks `description` → FE calls **int-or** `POST /start-ingestion`.
- **ingestion** streams the file from GCS, finds the selected column’s `inputIndex`, and writes **batches** (10 rows per document) to Mongo collections named:  
  `<userId>.<fileId>.<inputIndex>`

### 3) Preview (“experiment”)

- FE calls **int-or** `POST /start-experiment` with the prompt.
- **experiment** pulls a random batch (may be **10 or fewer** rows — batches are not guaranteed full), sends `{ prompt, inputData[] }` to the OpenAI Assistant, parses JSON, returns the preview `{ outputData[] }` along with input echo and a small **credit estimate**.

### 4) Apply to all (“processing”)

- FE calls **int-or** `POST /start-processing`.
- **processing** iterates every batch, sends `inputData[]` to the Assistant, writes `outputData[]` next to each `inputData[]`, and tallies **tokens/cost/credits**.

### 5) Export & notify

- **processing → int-or** fires a **webhook** with project metrics on completion.
- **int-or → ingestion** asks for an **output path**; ingestion builds:  
  `gs://<bucket>/outputs/<userId>.<fileId>-output.csv` and returns a **signed URL**.
- **int-or** updates SQL (projects, credits) and notifies the FE with the **download URL** via the FE webhook.

That’s the core loop: **upload → select → preview → apply → export**.

---

## Architecture (at a glance)

> Place your diagram image at `backend/docs/architecture.png` and render it like this:

```md
![Architecture](docs/architecture.png)
```

### Components & flows

- **Client UI ↔ int-or (HTTP/JSON)**  
  All FE calls hit **int-or**.

- **Webhooks from int-or back to the FE** update progress:  
  - `POST /api/ingestion-update`  
  - `POST /api/process-update`

- **int-or → Google Cloud Storage**  
  Signed URLs for browser uploads. Objects live under `uploads/` and `outputs/`.

- **int-or ↔ ingestion**  
  Start ingestion; later, request output path for the final CSV.

- **int-or ↔ experiment / processing**  
  Preview vs. full apply. Both talk to the OpenAI Assistant via their own API keys.

- **ingestion / experiment / processing ↔ MongoDB**  
  Batch data lives in Mongo collections named `<userId>.<fileId>.<inputIndex>`.

- **int-or ↔ Postgres**  
  Users, sessions, files, experiments, credits, projects, payments, logs.

- **OpenAI Assistant**  
  Stateless contract:  
  - **Input:** `inputData` JSON array + your prompt  
  - **Output:** JSON array or `{ "outputData": [...] }`  
  - Return **JSON only**, order must match inputs.

---

## Assistant configuration (one-time)

Create an Assistant and add these settings:

**System instructions:**

```
You help people with their data. You will get inputData in json format along with a prompt from user, do as the user says to the inputData and return outputData. in json format with new data. Make sure the order is correct.
Only return the json and nothing else. Respond to all the inputs.
```

- **Model:** `gpt-4o`  
- **Tools:** File Search OFF, Code Interpreter OFF, Functions OFF  
- **Response format:** `json_object`  
- **Temperature:** `0.05`  
- **Top P:** `0.90`

Put the credentials in:

- `backend/experiment/.env`
- `backend/processing/.env`

> Those services accept either a plain JSON array or `{ "outputData": [...] }` and normalize it.

---

## Setup

### 1) Clone & env files

Each service ships a `.env.example`. **Copy to `.env`** and fill.

- **Postgres DSN** lives in **int-or**’s `.env`.
- **Mongo URI + DB name** live in **ingestion / experiment / processing**.
- **GCS bucket + signing configuration** in **int-or / ingestion**.

### 2) Postgres schema

```bash
psql -d <your_db> -f backend/int-or/db/schema.sql
```

### 3) Google Cloud

- Create a **bucket**.  
- Configure **CORS** for browser **PUTs**.  
- Use **Application Default Credentials (ADC):**
  - Local: `gcloud auth application-default login`
  - On GCP: attach a **service account** to the runtime.

### 4) Docker (recommended)

From repo root:

```bash
docker compose up --build
```

**Ports:**

- int-or: **3000**  
- ingestion: **5001**  
- experiment: **5002**  
- processing: **5003**

---

## API (surface that the FE uses)

All endpoints below are under **`/api/intor`**.

### Upload & registration

**`POST /upload-to-GCP`**  
Req:
```json
{ "sessionId": "<string>" }
```
Res:
```json
{ "uploadUrl": "<signedPutUrl>", "fileId": "<optional string>" }
```

**`POST /upload-file`**  
Purpose: register the upload + CSV headers for logging/UX.  
Req:
```json
{
  "sessionId": "abc123",
  "fileId": "optional-file-id-if-known",
  "headers": ["colA", "colB", "..."]
}
```
Res (example):
```json
{ "ok": true }
```

### Ingestion

**`POST /start-ingestion`**  
Req:
```json
{ "sessionId": "<string>", "inputColumn": "<string>" }
```
Res (example):
```json
{ "message": "Ingestion started" }
```

### Experiment (preview)

**`POST /start-experiment`**  
Req:
```json
{ "sessionId": "<string>", "expPrompt": "<string>" }
```
Res (example):
```json
{
  "message": "Experiment started successfully",
  "parsedResponse": { "outputData": ["..."] },
  "expCredits": 10,
  "inputData": ["..."],
  "userCredits": 90
}
```

### Estimate & processing

**`POST /estimate-credits`**  
Req:
```json
{ "sessionId": "<string>", "projectPrompt": "<string>" }
```
Res (example):
```json
{ "creditEstimate": 123 }
```

**`POST /start-processing`**  
Req:
```json
{
  "sessionId": "<string>",
  "projectPrompt": "<string>",
  "estimatedCredits": 123
}
```
Res (example):
```json
{ "message": "Processing started" }
```

**`POST /record-export`**  
Req:
```json
{ "sessionId": "<string>" }
```
Res (example):
```json
{ "ok": true }
```

### Payments

- `POST /razorpay/create-order`
- `POST /razorpay/verify-payment`
- `POST /razorpay/fail-payment`

(Backoffice: updates credits & logs payments in SQL.)

---

## Webhooks back to the FE

The FE exposes these routes (implemented in Next.js):

**`POST /api/ingestion-update`**  
Body (example):
```json
{ "sessionId": "abc123", "fileId": "f001" }
```

**`GET /api/ingestion-update?sessionId=abc123`**  
- `200 { "data": { "message": "Ingestion completed", "fileId": "f001" } }`  
- or `data: null` while waiting.

**`POST /api/process-update`**  
Body (example):
```json
{
  "sessionId": "abc123",
  "projectId": "p001",
  "outputFilePath": "https://storage.googleapis.com/<bucket>/outputs/user.file-output.csv?signature=...",
  "projectCredits": 42,
  "userCredits": 58
}
```

**`GET /api/process-update?sessionId=abc123`**  
- `202 { "message": "Processing..." }` while running  
- `200` (same shape as the POST body) once complete

> In production, prefer a **shared store** (e.g., Redis) instead of the FE’s in-memory map to avoid missing callbacks in multi-instance/serverless deployments.

---

## Quick smoke (optional)

1. **Upload:** `POST /api/intor/upload-to-GCP` → get signed URL → **PUT** the CSV.  
2. **Register:** `POST /api/intor/upload-file` with `{ sessionId, headers, fileId? }`.  
3. **Ingest:** `POST /api/intor/start-ingestion`.  
4. **Preview:** `POST /api/intor/start-experiment`.  
5. **Estimate:** `POST /api/intor/estimate-credits`.  
6. **Apply:** `POST /api/intor/start-processing` → FE should receive webhooks and expose a **download URL**.

---

## Operational notes

- **Batching:** ingestion writes up to **10 rows** per document; the final batch can have fewer rows.  
- **JSON only:** the Assistant must return a JSON array or `{ "outputData": [...] }`. Both **experiment** and **processing** normalize the response.  
- **Credits:** derived from per-million **token costs**. Estimation uses **experiment cost × number of documents** (plus a markup constant).  
- **GCS:** signed URLs **expire**; CORS must allow browser **PUTs** from your FE origin.

---

## Troubleshooting

- **403 on GCS** — CORS or IAM/ADC misconfigured; signed URL expired.  
- **No preview** — ingestion not finished; Mongo DB/collection name mismatch.  
- **JSON parse errors** — tighten Assistant prompt to “**return JSON only**.”  
- **No FE updates** — FE routes missing or `FRONTEND_WEBHOOK_URL` wrong.
