-- Migración inicial para el módulo identity
-- Prefijo obligatorio: identity_*

CREATE TABLE IF NOT EXISTS identity_customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  permissions TEXT NOT NULL, -- JSON array de permisos
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL,
  mfa_secret TEXT,
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  actor_type TEXT NOT NULL, -- 'customer' | 'admin'
  actor_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  department TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_outbox_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL,
  payload TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_identity_sessions_hash ON identity_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_identity_sessions_actor ON identity_sessions(actor_id);
CREATE INDEX IF NOT EXISTS idx_identity_addresses_customer ON identity_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_identity_outbox_status ON identity_outbox_events(status, attempts);

-- Seed de roles estándar (Superadmin, Editor, Ventas, Soporte)
INSERT OR IGNORE INTO identity_roles (id, name, description, permissions, is_system, created_at)
VALUES 
  ('role_superadmin', 'Superadmin', 'Acceso total sin restricciones', '["*"]', 1, '2026-10-11T00:00:00Z'),
  ('role_editor', 'Editor', 'Gestión de catálogo, contenido y CMS', '["catalog:*","media:*","cms:*","storefront:*"]', 1, '2026-10-11T00:00:00Z'),
  ('role_ventas', 'Ventas', 'Gestión de órdenes, clientes y pagos', '["orders:*","payments:*","customers:read"]', 1, '2026-10-11T00:00:00Z'),
  ('role_soporte', 'Soporte', 'Atención y consulta de pedidos', '["orders:read","customers:read"]', 1, '2026-10-11T00:00:00Z');
