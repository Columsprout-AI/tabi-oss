# Tabi BE — **processing** (full-apply & webhook)

Applies the approved prompt to **all batches** created by ingestion, writes each batch’s `outputData` back to **Mongo**, totals **tokens/cost/credits**, and finally **webhooks int-or** so it can update SQL, compute the output path, and notify the FE.

---

## 1) Environment

Create `backend/processing/.env` from this template:

```ini
# Runtime
NODE_ENV=production
PORT=5003

# MongoDB (same cluster used by ingestion/experiment)
MONGO_URI=mongodb://<user>:<pass>@<host>:27017/columsprout_tabi?authSource=admin
DB_NAME=columsprout_tabi

# OpenAI (Assistants API)
OPENAI_API_KEY=
ASSISTANT_ID=

# Callback back to int-or
INTOR_URL=http://int-or:3000

# Optional knobs (keep defaults if you like)
# TOKEN_COST_PER_MILLION_INPUT=0.15
# TOKEN_COST_PER_MILLION_OUTPUT=0.6
# MAX_RUN_RETRIES=20
# RUN_RETRY_DELAY_MS=5000
# MARKUP_CONSTANT=1.2      # used by /estimate-credits
```

**Assistant JSON contract:** For each batch the Assistant must return JSON. Either:
```json
{ "outputData": ["...", "..."] }
```
or a plain JSON array
```json
["...", "..."]
```
(the service treats this as `outputData`).

---

## 2) Endpoints

### **POST `/api/proc/estimate-credits`**

**Body**
```json
{
  "projectPrompt": "final prompt text",
  "userId": 42,
  "fileId": 101,
  "inputIndex": 2,
  "lastExpCredits": 12.34
}
```

**Behavior**
- Opens collection `<userId>.<fileId>.<inputIndex>` in `DB_NAME`.
- `documentCount = countDocuments()` (each doc = up to 10 rows).
- `estimatedCredits = lastExpCredits * documentCount * MARKUP_CONSTANT` *(default 1.2).*

**Response**
```json
{
  "message": "Credit estimation completed successfully",
  "estimatedCredits": 123.45
}
```

---

### **POST `/api/proc/start-processing`**

**Body**
```json
{
  "sessionId": "s1",
  "userId": 42,
  "fileId": 101,
  "inputIndex": 2,
  "projectPrompt": "final prompt text",
  "projectId": 999
}
```

**Immediate response**
```json
{ "status": "started" }
```

**Behavior**
- Iterates **all batch docs** in `<userId>.<fileId>.<inputIndex>` *(one at a time)*.
- For each batch:
  - Creates a **thread**, posts `projectPrompt`, then runs the Assistant with the **JSON array of inputs** (`inputData`).
  - Polls run completion *(default `MAX_RUN_RETRIES` × `RUN_RETRY_DELAY_MS` → 20 × 5s).*
  - Reads the **last message**, parses JSON *(accepts array or `{ "outputData": [...] }`)*.
  - Writes `outputData` back to the **same batch document**.
  - Accumulates **token usage and cost** using per‑million token costs *(defaults: input `0.15`, output `0.6`).*

- Totals are converted to **credits** *(**$0.01 = 100 credits** in this service’s math).*

- On finish, POSTs **webhook** to int-or:

```
POST ${INTOR_URL}/api/intor/processing-webhook
```

**Body**
```json
{
  "sessionId":"...",
  "fileId":101,
  "projectId":999,
  "userId":42,
  "projectCredits": 123,
  "projectTokens": 6912,
  "projectInputTokens": 1234,
  "projectOutputTokens": 5678,
  "totalCost": "0.0123",
  "inputIndex": 2
}
```

*int-or then updates SQL, asks ingestion for `/api/ing/output-path`, saves the `downloadUrl`, and notifies the FE.*

---

## 3) Run locally

From repo root:
```bash
docker compose up --build processing
# or bring all services
docker compose up --build
```

Logs include: `Processing service is running on port 5003`.

---

## 4) Quick curl

**Estimate credits**
```bash
curl -X POST http://localhost:5003/api/proc/estimate-credits \
  -H 'Content-Type: application/json' \
  -d '{
    "projectPrompt":"final prompt",
    "userId":1,"fileId":123,"inputIndex":2,"lastExpCredits":10
  }'
```

**Start processing**
```bash
curl -X POST http://localhost:5003/api/proc/start-processing \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId":"s1","userId":1,"fileId":123,"inputIndex":2,
    "projectPrompt":"final prompt","projectId":999
  }'
```

---

## 5) Troubleshooting

- **JSON parse error in logs** → The Assistant returned prose or invalid JSON. Instruct it: “**Return JSON only**.”  
- **Never completes** → run status doesn’t become `completed`. Increase `MAX_RUN_RETRIES` / `RUN_RETRY_DELAY_MS` or check Assistant/tool config.  
- **No batches found** → ingestion didn’t create collection `<userId>.<fileId>.<inputIndex>` yet (or `DB_NAME` mismatch).  
- **Webhook not received by int-or** → wrong `INTOR_URL` (inside Docker Compose it should be `http://int-or:3000`).  
- **Throughput** → loop is intentionally sequential; no parallelization implemented.
