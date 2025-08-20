-- =====================================================================
-- Tabi / int-or  —  PostgreSQL schema
-- Source of truth for the BE models in backend/int-or/models/*
-- =====================================================================

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  userid           BIGSERIAL PRIMARY KEY,
  clerkid          TEXT NOT NULL,
  email            TEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login       TIMESTAMP,
  credits_count    NUMERIC(18,4) NOT NULL DEFAULT 0,   -- supports fractional credits
  delete_account   BOOLEAN NOT NULL DEFAULT FALSE
);

-- Clerk ID must be unique for mapping
CREATE UNIQUE INDEX IF NOT EXISTS users_clerkid_uidx ON users (clerkid);
-- Helpful email lookup (case-insensitive)
CREATE INDEX IF NOT EXISTS users_email_idx ON users (LOWER(email));

-- ---------------------------------------------------------------------
-- FILES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
  fileid         BIGSERIAL PRIMARY KEY,
  userid         BIGINT NOT NULL,
  input_filepath TEXT,                -- "gs://bucket/uploads/<userId>.<fileId>"
  inputcolumn    TEXT,
  inputindex     INTEGER,
  s3_path        TEXT,                -- final download URL
  export_status  TEXT NOT NULL DEFAULT '0',  -- "0" or "1"
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS files_userid_idx ON files (userid);
CREATE INDEX IF NOT EXISTS files_fileid_idx ON files (fileid);

-- ---------------------------------------------------------------------
-- EXPERIMENTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experiments (
  experimentid   BIGSERIAL PRIMARY KEY,
  fileid         BIGINT NOT NULL,
  exp_prompt     TEXT,
  exp_credits    NUMERIC(18,4),       -- credits used during the preview
  rand_batch     JSONB,               -- optional: stores sampled batch metadata
  total_tokens   BIGINT,
  input_tokens   BIGINT,
  output_tokens  BIGINT,
  total_cost     NUMERIC(18,6),
  user_remark    TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiments_fileid_idx ON experiments (fileid);

-- ---------------------------------------------------------------------
-- CREDITS (ledger-ish per experiment/project)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credits (
  id                BIGSERIAL PRIMARY KEY,
  userid            BIGINT NOT NULL,
  fileid            BIGINT NOT NULL,
  experimentid      BIGINT,             -- latest experiment for this user+file
  exp_credits       NUMERIC(18,4),
  estimated_credits NUMERIC(18,4),
  projectid         BIGINT,
  project_credits   NUMERIC(18,4),
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Fast “latest by experiment” lookups used in your code
CREATE INDEX IF NOT EXISTS credits_user_file_idx
  ON credits (userid, fileid, experimentid DESC);

-- ---------------------------------------------------------------------
-- PROJECTS (final apply runs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  projectid      BIGSERIAL PRIMARY KEY,
  userid         BIGINT NOT NULL,
  fileid         BIGINT NOT NULL,
  project_prompt TEXT,
  project_credits NUMERIC(18,4),
  total_tokens    BIGINT,
  input_tokens    BIGINT,
  output_tokens   BIGINT,
  total_cost      NUMERIC(18,6),
  op_filepath     TEXT,              -- final output file URL
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_user_file_idx ON projects (userid, fileid);

-- ---------------------------------------------------------------------
-- SESSIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  serialno    BIGSERIAL PRIMARY KEY,
  sessionid   TEXT NOT NULL,
  userid      BIGINT NOT NULL,
  fileid      BIGINT,                -- latest file tied to this session (nullable)
  timestamp   TIMESTAMP NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMP              -- set from Clerk session end
);

CREATE INDEX IF NOT EXISTS sessions_sessionid_ts_idx ON sessions (sessionid, timestamp DESC);
CREATE INDEX IF NOT EXISTS sessions_userid_ts_idx   ON sessions (userid,   timestamp DESC);

-- ---------------------------------------------------------------------
-- PAYMENTS (Razorpay)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id          BIGSERIAL PRIMARY KEY,
  userid      BIGINT,
  order_id    TEXT NOT NULL,
  payment_id  TEXT,
  signature   TEXT,
  amount      NUMERIC(18,2) NOT NULL,   -- stored in INR
  currency    TEXT NOT NULL DEFAULT 'INR',
  status      TEXT NOT NULL DEFAULT 'created',  -- created/paid/failed
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- order_id must be unique
ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS payments_order_id_key UNIQUE (order_id);

CREATE INDEX IF NOT EXISTS payments_userid_idx ON payments (userid);

-- ---------------------------------------------------------------------
-- USER ACTIVITY (analytics trail)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity (
  id          BIGSERIAL PRIMARY KEY,
  userid      BIGINT NOT NULL,
  user_action TEXT NOT NULL,
  timestamp   TIMESTAMP NOT NULL DEFAULT NOW(),
  fileid      BIGINT
);

CREATE INDEX IF NOT EXISTS user_activity_userid_ts_idx
  ON user_activity (userid, timestamp DESC);
CREATE INDEX IF NOT EXISTS user_activity_fileid_idx
  ON user_activity (fileid);

-- ---------------------------------------------------------------------
-- SYSTEM EVENTS (service-level logs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_events (
  id              BIGSERIAL PRIMARY KEY,
  userid          BIGINT,
  event_type      TEXT NOT NULL,      -- e.g., "Ingestion started"
  microservice    TEXT NOT NULL,      -- e.g., "Ingestion" | "Processing"
  event_timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS system_events_userid_ts_idx
  ON system_events (userid, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS system_events_micro_ts_idx
  ON system_events (microservice, event_timestamp DESC);

-- ---------------------------------------------------------------------
-- FOREIGN KEYS (optional but recommended for fresh installs)
-- If you have existing data, these may fail until you clean orphans.
-- ---------------------------------------------------------------------
ALTER TABLE files
  ADD CONSTRAINT IF NOT EXISTS files_userid_fk
  FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE;

ALTER TABLE experiments
  ADD CONSTRAINT IF NOT EXISTS experiments_fileid_fk
  FOREIGN KEY (fileid) REFERENCES files(fileid) ON DELETE CASCADE;

ALTER TABLE credits
  ADD CONSTRAINT IF NOT EXISTS credits_userid_fk
  FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE;

ALTER TABLE credits
  ADD CONSTRAINT IF NOT EXISTS credits_fileid_fk
  FOREIGN KEY (fileid) REFERENCES files(fileid) ON DELETE CASCADE;

ALTER TABLE credits
  ADD CONSTRAINT IF NOT EXISTS credits_experimentid_fk
  FOREIGN KEY (experimentid) REFERENCES experiments(experimentid) ON DELETE SET NULL;

ALTER TABLE projects
  ADD CONSTRAINT IF NOT EXISTS projects_userid_fk
  FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE;

ALTER TABLE projects
  ADD CONSTRAINT IF NOT EXISTS projects_fileid_fk
  FOREIGN KEY (fileid) REFERENCES files(fileid) ON DELETE CASCADE;

ALTER TABLE sessions
  ADD CONSTRAINT IF NOT EXISTS sessions_userid_fk
  FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE;

ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS payments_userid_fk
  FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE SET NULL;
