ALTER TABLE identity_admins
  ADD COLUMN mfa_last_used_counter INTEGER;

ALTER TABLE identity_admins
  ADD COLUMN mfa_enrollment_failed_attempts INTEGER NOT NULL DEFAULT 0
  CHECK (mfa_enrollment_failed_attempts BETWEEN 0 AND 5);

ALTER TABLE identity_admins
  ADD COLUMN mfa_enrollment_locked_until TEXT;
