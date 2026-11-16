CREATE TABLE identity_customer_auth_tokens (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_identity_customer_auth_tokens_owner
  ON identity_customer_auth_tokens(customer_id, purpose, created_at);

CREATE TABLE identity_customer_login_attempts (
  account_key_hash TEXT PRIMARY KEY,
  customer_id TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts BETWEEN 0 AND 5),
  last_failed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE identity_outbox_events ADD COLUMN lease_expires_at TEXT;
ALTER TABLE identity_outbox_events ADD COLUMN lease_token TEXT;

CREATE INDEX idx_identity_outbox_auth_claim
  ON identity_outbox_events(status, event_type, created_at);
