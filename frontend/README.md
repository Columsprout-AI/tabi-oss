# Tabi — Frontend (Next.js)

Tabi lets users **create, transform, enrich, and manipulate data at scale** from a spreadsheet.  
This folder contains the **Next.js 15 / React 19** client that talks to the backend **int-or** service.

**Flow:** Upload CSV/XLSX → pick a column → preview results on 10 rows → estimate tokens → apply to all → download CSV.

- Auth via **Clerk**; payments via **Razorpay**; optional **GA4** tracking.  
- Tight **security headers + CSP** are included.  
- The backend lives in `backend/`. This README is only for the frontend. See the backend README for service env, DBs, GCS, OpenAI, and Docker.

---

## Quick links

- **Local dev:** FE on **:3001**, BE on **:3000**  
- **FE API base:** `${NEXT_PUBLIC_API_URL}/api/intor`  
  (With `NEXT_PUBLIC_API_URL=http://localhost:3000`, calls hit `http://localhost:3000/api/intor/...`)

**FE webhook routes the backend calls:**

- `POST /api/ingestion-update`
- `POST /api/process-update`

---

## Prerequisites

- **Node 18+** (Node 20 recommended)
- **pnpm** (repo includes `pnpm-lock.yaml`)
- **Running backend** (**int-or**), locally or hosted

---

## Environment variables

Create `frontend/.env.local`:

```ini
# Backend base (required). Examples:
# http://localhost:3000  (local int-or)
# https://api.tabi.columsprout.ai  (prod)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Clerk publishable key (required for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXX

# Razorpay key_id (client-side, safe to expose)
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_XXXXXXXX

# GA4 Measurement ID (optional). Leave empty to disable analytics.
NEXT_PUBLIC_GA_ID=
```

> No other FE secrets are needed. All sensitive keys live in the **backend**.

---

## Run locally

In two terminals:

**Backend**  
Follow `backend/README.md` (compose or bare node). Default: `http://localhost:3000`.

**Frontend**

```bash
cd frontend
pnpm install
pnpm dev
# http://localhost:3001
```

Make sure `NEXT_PUBLIC_API_URL` points to the backend.

---

## Deploying the frontend (Vercel)

1. Import the **frontend** folder as a Vercel project.  
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL` → your public backend base (e.g., `https://api.tabi.columsprout.ai`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_RAZORPAY_KEY`
   - `NEXT_PUBLIC_GA_ID` (optional)
3. Build/Output: **auto-detected** by Vercel for Next.js.
4. **CSP** is preconfigured; if you change your **Clerk** instance domain or add new SDKs, update `next.config.ts` (see **Security & CSP** below).

> **Note on serverless:** this FE uses **in-memory maps** in `/api/ingestion-update` and `/api/process-update`. In horizontally scaled/serverless environments, replace them with a small store (e.g., **Redis/Upstash**) for consistent webhook polling.

---

## What the frontend does (end-to-end)

### Auth (Clerk)

- `src/Listeners` detect first-time sign-up vs. login and call backend:
  - `POST /record-signup` *(first time only)*
  - `POST /record-login` *(subsequent logins)*
  - `POST /record-logout` *(explicit logout or inactivity timer)*

### Upload & headers

1. `POST /upload-to-GCP` → receive a **signed URL**  
2. Browser **PUTs** your file to **GCS** directly  
3. FE parses **headers locally** to show the column picker

### Ingestion

- `POST /start-ingestion` with `{ sessionId, inputColumn }`  
- Backend ingests, then **webhooks FE**: `POST /api/ingestion-update` with `{ sessionId, fileId }`  
- FE polls `GET /api/ingestion-update?sessionId=...` until completed

### Experiment (preview)

- `POST /start-experiment` with `{ sessionId, expPrompt }`  
- FE renders input vs output for ~10 rows

### Estimate & process

- `POST /estimate-credits` with `{ sessionId, projectPrompt }`  
- On confirm: `POST /start-processing`  
- Backend webhooks FE: `POST /api/process-update` with `{ sessionId, projectId, outputFilePath, projectCredits, userCredits }`  
- FE polls `GET /api/process-update?sessionId=...` until it receives the payload, then shows **Download CSV**

### Export log

- Clicking **Download** triggers `POST /record-export { sessionId }` (for backend logging/analytics)

---

## API endpoints the FE calls

**Base:** `${NEXT_PUBLIC_API_URL}/api/intor`

- `POST /upload-to-GCP`
- `POST /start-ingestion`
- `POST /start-experiment`
- `POST /estimate-credits`
- `POST /start-processing`
- `POST /record-export`

**Auth telemetry**

- `POST /record-signup`
- `POST /record-login`
- `POST /record-logout`

**Payments**

- `POST /razorpay/create-order`
- `POST /razorpay/verify-payment`
- `POST /razorpay/fail-payment`

---

## FE-hosted webhook routes (backend → FE)

- `POST /api/ingestion-update` *(body: `{ sessionId, fileId }`)*
- `GET /api/ingestion-update?sessionId=...` →  
  `200 { data: { message: "Ingestion completed", fileId } }` **or** `null` while waiting
- `POST /api/process-update` *(body: `{ sessionId, projectId, outputFilePath, projectCredits, userCredits }`)*
- `GET /api/process-update?sessionId=...` →  
  `202 { message: "Processing..." }` **or** `200 { sessionId, projectId, outputFilePath, projectCredits, userCredits }`

The FE handlers live under `src/app/api/*`. For real prod, replace the **in-memory maps** with a **shared store**.

---

## Project structure (frontend)

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth pages) sign-in/, sign-up/
│   │   ├── home/                # main flow
│   │   ├── api/
│   │   │   ├── ingestion-update/route.ts
│   │   │   ├── process-update/route.ts
│   │   │   └── startProcess/route.ts (helper stub)
│   │   ├── layout.tsx
│   │   └── ClientWrapper.tsx    # mounts listeners
│   ├── components/
│   │   ├── custom/steps/        # Upload, Field, Experiment, Results, Credits
│   │   ├── custom/...           # AppSidebar, Header, Loader, Profile, etc.
│   │   └── ui/                  # shadcn wrappers (button, card, select, etc.)
│   ├── hooks/                   # polling hooks, xlsx→csv
│   ├── Listeners/               # Clerk-driven login/signup/logout/session
│   ├── Redux/                   # slices + thunks (Auth, Ingestion, Experiment, Processing, Credits, Exports, Razorpay)
│   └── utils/                   # axios instance, baseUrl, GA (gtag), Razorpay loader
├── next.config.ts               # security headers + CSP
├── tailwind.config.ts
└── package.json
```

---

## Auth (Clerk)

- The app wraps UI in `<ClerkProvider>` and provides `/sign-in` & `/sign-up`.
- **Listeners** (`src/Listeners`) decide signup vs login the first time and record a logout on Clerk floatie sign-out or **10-minute inactivity** (configurable in `userLogout.tsx`).
- Required env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- **CSP note:** `next.config.ts` already allows Clerk domains. If your Clerk instance domain differs (e.g., not `*.clerk.accounts.dev`), add it in `connect-src` and `img-src`.

---

## Payments (Razorpay)

- The FE loads `https://checkout.razorpay.com/v1/checkout.js` on demand.

**Flow:**

1. `POST /razorpay/create-order` *(backend returns `order_id`)*  
2. Open widget with that `order_id`  
3. On success → `POST /razorpay/verify-payment` *(backend updates credits)*  
4. On failure → `POST /razorpay/fail-payment`

Required env: `NEXT_PUBLIC_RAZORPAY_KEY` (publishable).  
**CSP note:** Razorpay **script & frames** are allowed in `next.config.ts`.

---

## Google Analytics (GA4) — optional

- Set `NEXT_PUBLIC_GA_ID` (e.g., `G-XXXXXXXX`) to enable.
- `src/utils/gtag.ts` exposes pageview/event.  
- `src/components/Analytics.tsx` injects GA and sends a `page_view` on route changes.

If left blank, GA simply stays inactive—no code changes needed.  
**CSP note:** GA/Tag Manager domains are already allowed.

---

## Security & CSP

Security headers are configured in `next.config.ts` (**XFO**, **XXSS**, **X-CTO**, **HSTS**, **CSP**). The CSP includes:

- **script-src** — self, GA, Tag Manager, Clerk, Razorpay, jsDelivr
- **connect-src** — self, GA, Clerk, Razorpay, `NEXT_PUBLIC_API_URL`, GCS
- **img-src** — self, data:, GA/Tag Manager, Google, Clerk
- **frame-src** — self, Razorpay, Tag Manager
- **style-src** — self, inline, Google Fonts
- **font-src** — Google Fonts

If you introduce another SDK, **extend CSP** accordingly.

---

## Known behaviors & troubleshooting

- **“Ingestion sometimes spins forever”**  
  The FE polls until the backend webhooks into `/api/ingestion-update`. In dev or on multi-instance serverless, the in-memory map may miss an update. Use a **shared store** (e.g., Redis) or run a **single FE instance** for reliability. A soft timeout and retry UX is recommended if you see this often.

- **403 on GCS upload**  
  Usually CORS or expired signed URL. Check the backend’s GCS CORS and signing configuration.

- **Razorpay widget doesn’t open**  
  Ensure `NEXT_PUBLIC_RAZORPAY_KEY` is set and the script loads. Also ensure your domain is **whitelisted** at Razorpay for the key in use.

- **CSP blocking requests**  
  If you change your Clerk instance domain or `NEXT_PUBLIC_API_URL`, update `next.config.ts` CSP to include those hosts.

---

## Scripts

```bash
pnpm dev      # next dev -p 3001 --turbopack
pnpm build    # next build
pnpm start    # next start
pnpm lint
```

You can use npm if you prefer, but **pnpm** is the project default.

---

## Contributing

- Add new network calls via **Redux** slices under `src/Redux/*`.
- Keep UI primitives in `src/components/ui/*` and app logic in `src/components/custom/*`.
- Follow **Tailwind/shadcn** patterns already present.
- If you add third-party SDKs: 1) update **CSP**, 2) gate them behind envs (like GA).
