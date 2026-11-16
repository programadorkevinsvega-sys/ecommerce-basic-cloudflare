CREATE TABLE IF NOT EXISTS identity_admin_login_attempts (
  admin_id TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  locked_until TEXT,
  alert_claimed_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (admin_id, source_hash)
);

CREATE INDEX IF NOT EXISTS idx_identity_admin_login_attempts_updated
  ON identity_admin_login_attempts (updated_at);
