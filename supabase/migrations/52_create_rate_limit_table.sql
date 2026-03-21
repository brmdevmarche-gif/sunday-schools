-- Rate limiting table for tracking request counts per key
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by key + time window
CREATE INDEX idx_rate_limit_key_created ON rate_limit_entries (key, created_at);

-- Auto-cleanup: delete entries older than 1 hour
-- This runs periodically via pg_cron if available, otherwise cleanup happens on each check
CREATE INDEX idx_rate_limit_created ON rate_limit_entries (created_at);

-- RLS: only service_role can access this table
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- No public access policies — only the admin/service_role client can read/write
