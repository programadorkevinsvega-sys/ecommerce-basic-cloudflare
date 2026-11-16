CREATE TABLE orders_guest_checkout_attempts (
  order_id TEXT PRIMARY KEY,
  ip_fingerprint TEXT NOT NULL,
  email_fingerprint TEXT NOT NULL,
  cart_fingerprint TEXT NOT NULL,
  pending INTEGER NOT NULL CHECK (pending IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE orders_guest_checkout_email_reservations (
  order_id TEXT NOT NULL,
  recipient_fingerprint TEXT NOT NULL,
  email_count INTEGER NOT NULL CHECK (email_count BETWEEN 1 AND 3),
  created_at TEXT NOT NULL,
  PRIMARY KEY (order_id, recipient_fingerprint)
);

CREATE INDEX orders_guest_checkout_attempts_ip_idx
  ON orders_guest_checkout_attempts (ip_fingerprint, pending, created_at);

CREATE INDEX orders_guest_checkout_attempts_email_idx
  ON orders_guest_checkout_attempts (email_fingerprint, pending, created_at);

CREATE INDEX orders_guest_checkout_attempts_cart_idx
  ON orders_guest_checkout_attempts (cart_fingerprint, pending, created_at);

CREATE INDEX orders_guest_checkout_emails_recipient_idx
  ON orders_guest_checkout_email_reservations (recipient_fingerprint, created_at);
