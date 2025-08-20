# Tabi BE — **experiment** (10-row preview)

Runs a 10-row preview (“experiment”) using your OpenAI Assistant on the column batches prepared by **ingestion**.  
It reads a random batch from Mongo, sends it to the Assistant, parses the JSON reply, and returns token usage + credits.

---

## 1) Environment

Create `backend/experiment/.env` from this template:

```ini
# Runtime
NODE_ENV=production
PORT=5002

# MongoDB (same cluster used by ingestion)
MONGO_URI=mongodb://<user>:<pass>@<host>:27017/columsprout_tabi?authSource=admin
DB_NAME=columsprout_tabi   # must match the DB used by ingestion

# OpenAI (Assistants API)
OPENAI_API_KEY=
ASSISTANT_ID=              # the Assistant you created in OpenAI

# Optional: override default token costs (per 1,000,000 tokens)
# TOKEN_COST_PER_MILLION_INPUT=0.15
# TOKEN_COST_PER_MILLION_OUTPUT=0.6
```

**JSON contract:** The Assistant must return **valid JSON**.  
If it doesn’t include an `outputData` key and instead returns a plain JSON array, the service wraps it as `{ "outputData": [...] }`.

---

## 2) Endpoint

**`POST /api/exp/start-experiment`**

**Body**
```json
{
  "userId": 42,
  "fileId": 101,
  "inputIndex": 2,
  "expPrompt": "Rewrite as catchy product taglines.",
  "experimentId": 555
}
```

**Behavior**
- Connects to Mongo (`DB_NAME`) and opens collection:  
  `<userId>.<fileId>.<inputIndex>`  
  (created by ingestion; each document is a batch with up to 10 rows)
- Selects a **random batch**. If there are multiple batches, the final batch is excluded (since it may have fewer rows). If only one batch exists, it is used.
- Creates an **OpenAI thread**, then a **run** with:
  - the user prompt (`expPrompt`)
  - an additional **user message** containing the JSON array of inputs (`inputData`)
- Polls until the run completes (**max 4 tries**, **5s** between).
- Retrieves the **last assistant message**, parses JSON, and computes **token usage & credit estimate**.

**Token cost defaults** (per 1M tokens):
- input: **0.15**
- output: **0.60**  
(You can override via env vars shown above.)

**Response**
```json
{
  "message": "Experiment completed successfully.",
  "parsedResponse": { "outputData": ["...", "..."] },
  "inputData": ["...", "..."],
  "randBatch": { "_id": "<mongo id>", "inputData": "<first row sample>" },
  "expCredits": "12.3456",
  "inputTokens": 1234,
  "outputTokens": 5678,
  "totalTokens": 6912,
  "totalCost": 0.0123
}
```
*Credits are derived from the per-million token costs in this service.*

---

## 3) Assistant setup (OpenAI)

- Create an **Assistant** in the OpenAI dashboard and set `ASSISTANT_ID`.
- The Assistant must respond with **JSON**, for example:
  ```json
  { "outputData": ["...", "..."] }
  ```
  or a plain JSON array
  ```json
  ["...", "..."]
  ```
  *(the service wraps it to `{ "outputData": [...] }`)*.
- Suggested **system instructions**:
  ```
  You help people with their data. You will get inputData in JSON format along with a prompt from user, 
  do as the user says to the inputData and return outputData in JSON format with new data. 
  Make sure the order is correct. Only return the JSON and nothing else.
  ```

---

## 4) Run locally

From repo root:
```bash
docker compose up --build experiment
# or bring up the whole stack:
docker compose up --build
```

Logs contain: `Experiment service is running on port 5002`.

---

## 5) Quick curl

```bash
curl -X POST http://localhost:5002/api/exp/start-experiment   -H 'Content-Type: application/json'   -d '{
    "userId":1,
    "fileId":123,
    "inputIndex":2,
    "expPrompt":"Summarize in 1 sentence. Return JSON array only.",
    "experimentId":999
  }'
```

---

## 6) Troubleshooting

- **500 JSON parse error** → The Assistant didn’t return valid JSON. Tighten its instructions to “**return JSON only**.”
- **Hang/timeout** → Run status never becomes `completed`. Check Assistant settings or increase retries (`MAX_RETRIES`).
- **Mongo errors** → `DB_NAME`/`MONGO_URI` incorrect, or ingestion hasn’t created the `<userId>.<fileId>.<inputIndex>` collection yet.
- **401 from OpenAI** → `OPENAI_API_KEY` invalid or missing.
- **Preview shows fewer rows than expected** → By design, the last (possibly short) batch is excluded if multiple exist. If you want it included, change the selection logic.
