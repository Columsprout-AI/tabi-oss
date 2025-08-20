# Tabi BE — **ingestion** (headers, batching & export)

Reads files from **GCS**, extracts **headers**, builds **10-row batches** in **Mongo** for experiments, computes the selected column’s `inputIndex`, and notifies **int-or** when ingestion is done.  
It can also return a **download URL** for the final output.

---

## 1) Environment

Create `backend/ingestion/.env` from `.env.example`:

```ini
NODE_ENV=production
PORT=5001

# Mongo
MONGO_URI=mongodb://<user>:<pass>@<host>:27017/columsprout_tabi?authSource=admin

# Int-or base URL
INTOR_URL=http://int-or:3000

# Default bucket for outputs (fallback if not provided in request body)
BUCKET_NAME=
```

**GCP auth (ADC):**  
- **Local:** `gcloud auth application-default login` *(or set `GOOGLE_APPLICATION_CREDENTIALS` to a SA key)*.  
- **GCP runtime:** attach a Service Account with:  
  - **Storage Object Viewer** (read `uploads/`)  
  - **Storage Object Creator** (write `outputs/`)

**Path convention (important):**  
- `int-or` uploads to `gs://<bucket>/uploads/<userId>.<fileId>`  
- **Ingestion reads exactly that key.**

---

## 2) Endpoints

### **POST `/api/ing/extract-headers`**

**Body**
```json
{ "inputFilePath": "gs://<bucket>/uploads/<userId>.<fileId>" }
```

**Behavior**
- Streams the object from **GCS** using **ADC** (no local rename).
- Extracts the **header row** (CSV).

**Response**
```json
{ "message": "Headers extracted successfully", "headerValues": ["colA","colB","..."] }
```

---

### **POST `/api/ing/start-ingestion`**  *(sent by int-or)*

**Body**
```json
{
  "sessionId": "s1",
  "userId": 42,
  "fileId": 101,
  "inputColumn": "Email",
  "gcpProjectId": "<project-id>",
  "bucketName": "<bucket>" // optional; falls back to env BUCKET_NAME
}
```

**Immediate response**
```json
{ "message": "started" }
```

**Behavior**
- Streams `gs://<bucket>/uploads/<userId>.<fileId>`.
- Finds **inputIndex** for `inputColumn` (case/trim-normalized).
- Writes **10-row batches** to Mongo collection:  
  `<userId>.<fileId>.<inputIndex>`
- Values **> 600 chars** are trimmed (hardcoded).
- Webhooks **int-or**:
  ```http
  POST ${INTOR_URL}/api/intor/ingestion-webhook
  {
    "sessionId": "...",
    "fileId": 101,
    "inputIndex": 2,
    "ingestionStatus": "Ingestion completed"
  }
  ```

---

### **POST `/api/ing/output-path`**

**Body**
```json
{ "userId": 42, "fileId": 101, "inputIndex": 2, "bucketName": "<optional-bucket>" }
```

**Behavior**
- Reads **all batch docs** from Mongo collection `<userId>.<fileId>.<inputIndex>`.
- Builds a CSV and writes it to:  
  `gs://<bucket>/outputs/<userId>.<fileId>-output.csv`
- **Bucket resolution:** `bucketName` in body → else `BUCKET_NAME` env.  
  If neither is provided → **400**.

**Response**
```json
{ "message": "Output file generated successfully on GCS", "downloadUrl": "<signed-url>" }
```

---

## 3) Run locally

From repo root:
```bash
docker compose up --build ingestion
# or start the whole stack:
docker compose up --build
```

Service listens on **:5001**. You should see:
```
Ingestion service is running on port 5001
```

---

## 4) Quick curl tests

**Headers**
```bash
curl -X POST http://localhost:5001/api/ing/extract-headers \
  -H 'Content-Type: application/json' \
  -d '{"inputFilePath":"gs://<bucket>/uploads/<user>.<file>"}'
```

**Start ingestion**
```bash
curl -X POST http://localhost:5001/api/ing/start-ingestion \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"s1","userId":1,"fileId":123,"inputColumn":"Email","gcpProjectId":"<pid>","bucketName":"<bucket>"}'
```

**Output path (uses body bucket or `BUCKET_NAME` env)**
```bash
# explicit bucket override
curl -X POST http://localhost:5001/api/ing/output-path \
  -H 'Content-Type: application/json' \
  -d '{"userId":1,"fileId":123,"inputIndex":2,"bucketName":"my-bucket"}'

```

---

## 5) Troubleshooting

- **403 on GCS stream** → ADC not configured or SA missing **Storage** permissions.  
- **Webhook never hits int-or** → wrong `INTOR_URL` (in Docker it should be `http://int-or:3000`).  
- **OverwriteModelError on re-ingest** → guard dynamic models:
  ```js
  const model = mongoose.models[name] || mongoose.model(name, schema, name);
  ```
- **Wrong bucket in download URL** → set `BUCKET_NAME` or pass `bucketName` to `/output-path`.  
- **Signed URL expired** → default is ~15 min; request a fresh one.

---

## Tiny alignment checklist (do these once)

- In `.env`, rename `INT_OR_URL` → **`INTOR_URL`**.  
- `extractHeadersController` should **stream from GCS** (not local fs/rename).  
- In dynamic model creation, use the **guard pattern** shown above.  
- `outputPathController` should rely on **ADC** and use `bucketName || process.env.BUCKET_NAME`.
