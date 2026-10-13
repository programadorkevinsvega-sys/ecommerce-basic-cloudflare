# Matriz de auditoría del esquema D1

Generada por comparación estática de migraciones fuente y búsqueda textual en repositorios TypeScript. No verifica el estado remoto. Wrangler raíz usa `apps/api/migrations/`; Wrangler de `apps/api` usa `migrations/`.

## `audit__0001_init.sql` · fuente `apps/api/src/modules/audit/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 1; índices explícitos: 3. Copias: `migrations/audit__0001_init.sql` y `apps/api/migrations/audit__0001_init.sql`.

### `audit_logs`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `actor_id TEXT NOT NULL`
- `actor_type TEXT NOT NULL`
- `action TEXT NOT NULL`
- `entity_type TEXT NOT NULL`
- `entity_id TEXT NOT NULL`
- `changes_json TEXT`
- `ip_address TEXT`
- `trace_id TEXT`
- `created_at TEXT NOT NULL`

Índices: `idx_audit_actor` (actor_id), `idx_audit_entity` (entity_type, entity_id), `idx_audit_created` (created_at)

Repositorios que referencian la tabla: `apps/api/src/modules/audit/infrastructure/persistence/d1/repositories/D1AuditRepository.ts`

## `cart__0001_init.sql` · fuente `apps/api/src/modules/cart/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 3; índices explícitos: 4. Copias: `migrations/cart__0001_init.sql` y `apps/api/migrations/cart__0001_init.sql`.

### `cart_carts`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `customer_id TEXT`
- `status TEXT NOT NULL DEFAULT 'active'`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_cart_carts_cust` (customer_id), `idx_cart_carts_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/cart/infrastructure/persistence/d1/repositories/D1CartRepository.ts`

### `cart_items`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `cart_id TEXT NOT NULL`
- `product_id TEXT NOT NULL`
- `quantity INTEGER NOT NULL DEFAULT 1`
- `unit_price_cents INTEGER NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `UNIQUE (cart_id, product_id)`

Índices: `idx_cart_items_cart` (cart_id)

Repositorios que referencian la tabla: `apps/api/src/modules/cart/infrastructure/persistence/d1/repositories/D1CartRepository.ts`

### `cart_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `created_at TEXT NOT NULL`
- `published_at TEXT`

Índices: `idx_cart_outbox_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/cart/infrastructure/persistence/d1/repositories/D1CartOutboxRepository.ts`

## `catalog__0001_init.sql` · fuente `apps/api/src/modules/catalog/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 7; índices explícitos: 5. Copias: `migrations/catalog__0001_init.sql` y `apps/api/migrations/catalog__0001_init.sql`.

### `catalog_categories`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `description TEXT`
- `parent_id TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_catalog_categories_slug` (slug)

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1CategoryRepository.ts`

### `catalog_products`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `description TEXT NOT NULL`
- `price_in_cents INTEGER NOT NULL`
- `sku TEXT NOT NULL UNIQUE`
- `stock_quantity INTEGER NOT NULL DEFAULT 0`
- `status TEXT NOT NULL DEFAULT 'draft'`
- `allows_cash_on_delivery INTEGER NOT NULL DEFAULT 1`
- `shipping_scope TEXT NOT NULL DEFAULT 'national'`
- `sale_mode TEXT NOT NULL DEFAULT 'cash'`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_catalog_products_slug` (slug), `idx_catalog_products_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts`

### `catalog_product_categories`

Declaraciones de columnas/restricciones:
- `product_id TEXT NOT NULL`
- `category_id TEXT NOT NULL`
- `PRIMARY KEY (product_id, category_id)`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts`

### `catalog_product_images`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `product_id TEXT NOT NULL`
- `media_id TEXT NOT NULL`
- `sort_order INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`

Índices: `idx_catalog_product_images_pid` (product_id)

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts`

### `catalog_product_coverage`

Declaraciones de columnas/restricciones:
- `product_id TEXT NOT NULL`
- `zone_id TEXT NOT NULL`
- `PRIMARY KEY (product_id, zone_id)`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts`

### `catalog_products_fts`

Declaraciones de columnas/restricciones:
- `product_id UNINDEXED`
- `name`
- `description`
- `sku`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts`

### `catalog_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'PENDING'`
- `created_at TEXT NOT NULL`
- `relayed_at TEXT`

Índices: `idx_catalog_outbox_status` (status)

Repositorios que referencian la tabla: no encontrado

## `catalog__0002_product_seo_fields.sql` · fuente `apps/api/src/modules/catalog/infrastructure/persistence/d1/migrations/0002_product_seo_fields.sql`

Tablas: 0; índices explícitos: 0. Copias: `migrations/catalog__0002_product_seo_fields.sql` y `apps/api/migrations/catalog__0002_product_seo_fields.sql`.

## `catalog__0003_brands_attributes.sql` · fuente `apps/api/src/modules/catalog/infrastructure/persistence/d1/migrations/0003_brands_attributes.sql`

Tablas: 2; índices explícitos: 2. Copias: `migrations/catalog__0003_brands_attributes.sql` y `apps/api/migrations/catalog__0003_brands_attributes.sql`.

### `catalog_brands`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `description TEXT`
- `website_url TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_catalog_brands_slug` (slug)

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1BrandRepository.ts`

### `catalog_attributes`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `'Color'`
- `'Dimensiones'`
- `'Proveedor' code TEXT NOT NULL UNIQUE`
- `'color'`
- `'dimensions'`
- `'supplier' type TEXT NOT NULL CHECK(type IN ('text', 'select', 'number'))`
- `options TEXT NOT NULL DEFAULT '[]'`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_catalog_attributes_code` (code)

Repositorios que referencian la tabla: `apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1AttributeRepository.ts`

## `cms__0001_init.sql` · fuente `apps/api/src/modules/cms/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 5; índices explícitos: 6. Copias: `migrations/cms__0001_init.sql` y `apps/api/migrations/cms__0001_init.sql`.

### `cms_pages`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `title TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `status TEXT NOT NULL CHECK(status IN ('draft', 'published', 'archived'))`
- `current_version INTEGER NOT NULL DEFAULT 1`
- `seo_title TEXT`
- `seo_description TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_cms_pages_slug` (slug), `idx_cms_pages_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/cms/infrastructure/persistence/d1/repositories/D1PageRepository.ts`

### `cms_page_versions`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `page_id TEXT NOT NULL`
- `version_number INTEGER NOT NULL`
- `title TEXT NOT NULL`
- `blocks TEXT NOT NULL`
- `created_by_admin_id TEXT`
- `created_at TEXT NOT NULL`

Índices: `idx_cms_page_versions_page_id` (page_id), `idx_cms_page_versions_unique` (page_id, version_number)

Repositorios que referencian la tabla: `apps/api/src/modules/cms/infrastructure/persistence/d1/repositories/D1PageRepository.ts`

### `cms_menus`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `code TEXT NOT NULL UNIQUE`
- `'footer'`
- `'sidebar' title TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/cms/infrastructure/persistence/d1/repositories/D1MenuRepository.ts`

### `cms_menu_items`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `menu_id TEXT NOT NULL`
- `parent_id TEXT`
- `title TEXT NOT NULL`
- `url TEXT NOT NULL`
- `sort_order INTEGER NOT NULL DEFAULT 0`
- `target TEXT DEFAULT '_self'`
- `created_at TEXT NOT NULL`

Índices: `idx_cms_menu_items_menu_id` (menu_id), `idx_cms_menu_items_parent_id` (parent_id)

Repositorios que referencian la tabla: `apps/api/src/modules/cms/infrastructure/persistence/d1/repositories/D1MenuRepository.ts`

### `cms_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `retry_count INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `processed_at TEXT`

Índices: ninguno explícito

Repositorios que referencian la tabla: no encontrado

## `identity__0001_init.sql` · fuente `apps/api/src/modules/identity/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 6; índices explícitos: 4. Copias: `migrations/identity__0001_init.sql` y `apps/api/migrations/identity__0001_init.sql`.

### `identity_customers`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE`
- `password_hash TEXT NOT NULL`
- `full_name TEXT NOT NULL`
- `phone TEXT`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `email_verified INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/identity/infrastructure/persistence/d1/repositories/D1CustomerRepository.ts`

### `identity_roles`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL UNIQUE`
- `description TEXT NOT NULL`
- `permissions TEXT NOT NULL`
- `is_system INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/identity/infrastructure/persistence/d1/repositories/D1RoleRepository.ts`

### `identity_admins`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE`
- `password_hash TEXT NOT NULL`
- `full_name TEXT NOT NULL`
- `role_id TEXT NOT NULL`
- `mfa_secret TEXT`
- `mfa_enabled INTEGER NOT NULL DEFAULT 0`
- `failed_login_attempts INTEGER NOT NULL DEFAULT 0`
- `locked_until TEXT`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/identity/infrastructure/persistence/d1/repositories/D1AdminUserRepository.ts`

### `identity_sessions`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `token_hash TEXT NOT NULL UNIQUE`
- `actor_type TEXT NOT NULL`
- `actor_id TEXT NOT NULL`
- `expires_at TEXT NOT NULL`
- `ip_address TEXT`
- `user_agent TEXT`
- `created_at TEXT NOT NULL`
- `last_active_at TEXT NOT NULL`

Índices: `idx_identity_sessions_hash` (token_hash), `idx_identity_sessions_actor` (actor_id)

Repositorios que referencian la tabla: `apps/api/src/modules/identity/infrastructure/persistence/d1/repositories/D1SessionRepository.ts`

### `identity_addresses`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `customer_id TEXT NOT NULL`
- `title TEXT NOT NULL`
- `recipient_name TEXT NOT NULL`
- `phone TEXT NOT NULL`
- `street_address TEXT NOT NULL`
- `city TEXT NOT NULL`
- `department TEXT NOT NULL`
- `is_default INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_identity_addresses_customer` (customer_id)

Repositorios que referencian la tabla: no encontrado

### `identity_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_id TEXT NOT NULL UNIQUE`
- `event_type TEXT NOT NULL`
- `event_version INTEGER NOT NULL`
- `payload TEXT NOT NULL`
- `trace_id TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `attempts INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `published_at TEXT`

Índices: `idx_identity_outbox_status` (status, attempts)

Repositorios que referencian la tabla: no encontrado

## `inventory__0001_init.sql` · fuente `apps/api/src/modules/inventory/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 4; índices explícitos: 4. Copias: `migrations/inventory__0001_init.sql` y `apps/api/migrations/inventory__0001_init.sql`.

### `inventory_stocks`

Declaraciones de columnas/restricciones:
- `product_id TEXT PRIMARY KEY`
- `quantity INTEGER NOT NULL DEFAULT 0`
- `reserved_quantity INTEGER NOT NULL DEFAULT 0`
- `updated_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/inventory/infrastructure/persistence/d1/repositories/D1InventoryRepository.ts`

### `inventory_movements`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `product_id TEXT NOT NULL`
- `type TEXT NOT NULL`
- `quantity INTEGER NOT NULL`
- `reason TEXT`
- `reference_id TEXT`
- `created_at TEXT NOT NULL`

Índices: `idx_inventory_movements_prod` (product_id)

Repositorios que referencian la tabla: `apps/api/src/modules/inventory/infrastructure/persistence/d1/repositories/D1InventoryRepository.ts`

### `inventory_reservations`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `order_id TEXT NOT NULL`
- `product_id TEXT NOT NULL`
- `quantity INTEGER NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `expires_at TEXT NOT NULL`
- `created_at TEXT NOT NULL`

Índices: `idx_inventory_reservations_ord` (order_id), `idx_inventory_reservations_exp` (status, expires_at)

Repositorios que referencian la tabla: `apps/api/src/modules/inventory/infrastructure/persistence/d1/repositories/D1InventoryRepository.ts`

### `inventory_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `created_at TEXT NOT NULL`
- `published_at TEXT`

Índices: `idx_inventory_outbox_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/inventory/infrastructure/persistence/d1/repositories/D1InventoryOutboxRepository.ts`

## `invoicing__0001_init.sql` · fuente `apps/api/src/modules/invoicing/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 4; índices explícitos: 4. Copias: `migrations/invoicing__0001_init.sql` y `apps/api/migrations/invoicing__0001_init.sql`.

### `invoicing_sequences`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `prefix TEXT NOT NULL UNIQUE`
- `current_number INTEGER NOT NULL DEFAULT 0`
- `resolution_number TEXT`
- `updated_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/invoicing/infrastructure/persistence/d1/repositories/D1InvoiceRepository.ts`

### `invoicing_invoices`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `invoice_number TEXT UNIQUE NOT NULL`
- `order_id TEXT UNIQUE NOT NULL`
- `customer_id TEXT`
- `customer_name TEXT NOT NULL`
- `customer_email TEXT NOT NULL`
- `customer_tax_id TEXT`
- `customer_phone TEXT`
- `subtotal_cents INTEGER NOT NULL`
- `tax_cents INTEGER NOT NULL`
- `shipping_cost_cents INTEGER NOT NULL`
- `discount_cents INTEGER NOT NULL DEFAULT 0`
- `total_cents INTEGER NOT NULL`
- `currency TEXT NOT NULL DEFAULT 'COP'`
- `payment_method TEXT NOT NULL`
- `payment_reference TEXT`
- `status TEXT NOT NULL DEFAULT 'issued'`
- `pdf_r2_key TEXT`
- `snapshot_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_invoicing_order` (order_id), `idx_invoicing_customer` (customer_id), `idx_invoicing_created_at` (created_at)

Repositorios que referencian la tabla: `apps/api/src/modules/invoicing/infrastructure/persistence/d1/repositories/D1InvoiceRepository.ts`

### `invoicing_credit_notes`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `credit_note_number TEXT UNIQUE NOT NULL`
- `invoice_id TEXT NOT NULL`
- `reason TEXT NOT NULL`
- `amount_in_cents INTEGER NOT NULL`
- `issued_by TEXT NOT NULL`
- `created_at TEXT NOT NULL`

Índices: `idx_credit_notes_invoice` (invoice_id)

Repositorios que referencian la tabla: `apps/api/src/modules/invoicing/infrastructure/persistence/d1/repositories/D1InvoiceRepository.ts`

### `invoicing_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_type TEXT NOT NULL`
- `payload_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: no encontrado

## `media__0001_init.sql` · fuente `apps/api/src/modules/media/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 3; índices explícitos: 3. Copias: `migrations/media__0001_init.sql` y `apps/api/migrations/media__0001_init.sql`.

### `media_folders`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `parent_id TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: no encontrado

### `media_assets`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `storage_key TEXT NOT NULL UNIQUE`
- `original_file_name TEXT NOT NULL`
- `mime_type TEXT NOT NULL`
- `file_size_bytes INTEGER NOT NULL`
- `width INTEGER`
- `height INTEGER`
- `alt_text TEXT NOT NULL`
- `folder_id TEXT`
- `is_private INTEGER NOT NULL DEFAULT 0`
- `uploaded_by_admin_id TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_media_assets_folder` (folder_id), `idx_media_assets_storage_key` (storage_key)

Repositorios que referencian la tabla: `apps/api/src/modules/media/infrastructure/persistence/d1/repositories/D1MediaAssetRepository.ts`

### `media_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'PENDING'`
- `created_at TEXT NOT NULL`
- `relayed_at TEXT`

Índices: `idx_media_outbox_status` (status)

Repositorios que referencian la tabla: no encontrado

## `notifications__0001_init.sql` · fuente `apps/api/src/modules/notifications/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 2; índices explícitos: 3. Copias: `migrations/notifications__0001_init.sql` y `apps/api/migrations/notifications__0001_init.sql`.

### `notifications_log`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `recipient_email TEXT NOT NULL`
- `template_name TEXT NOT NULL`
- `subject TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `provider TEXT NOT NULL DEFAULT 'resend'`
- `provider_message_id TEXT`
- `idempotency_key TEXT UNIQUE NOT NULL`
- `error_message TEXT`
- `created_at TEXT NOT NULL`
- `sent_at TEXT`

Índices: `idx_notifications_recipient` (recipient_email), `idx_notifications_idempotency` (idempotency_key), `idx_notifications_created` (created_at)

Repositorios que referencian la tabla: `apps/api/src/modules/notifications/infrastructure/persistence/d1/repositories/D1NotificationLogRepository.ts`

### `notifications_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_type TEXT NOT NULL`
- `payload_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: no encontrado

## `orders__0001_init.sql` · fuente `apps/api/src/modules/orders/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 4; índices explícitos: 6. Copias: `migrations/orders__0001_init.sql` y `apps/api/migrations/orders__0001_init.sql`.

### `orders_orders`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `customer_id TEXT`
- `guest_cart_id_hash TEXT` (migración `orders__0002_guest_cart_capability.sql`, SHA-256 del cookie guest; nullable para pedidos históricos)
- `customer_email TEXT NOT NULL`
- `customer_name TEXT NOT NULL`
- `customer_phone TEXT NOT NULL`
- `shipping_address TEXT NOT NULL`
- `municipio`
- `departamento y código DANE shipping_zone_id TEXT NOT NULL`
- `shipping_cost_cents INTEGER NOT NULL DEFAULT 0`
- `subtotal_cents INTEGER NOT NULL`
- `discount_cents INTEGER NOT NULL DEFAULT 0`
- `coupon_code TEXT`
- `total_cents INTEGER NOT NULL`
- `payment_method TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'placed'`
- `payment_status TEXT NOT NULL DEFAULT 'pending'`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_orders_customer` (customer_id), `idx_orders_status` (status), `idx_orders_created` (created_at)

Repositorios que referencian la tabla: `apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.ts`

### `orders_lines`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `order_id TEXT NOT NULL`
- `product_id TEXT NOT NULL`
- `product_name TEXT NOT NULL`
- `product_sku TEXT NOT NULL`
- `quantity INTEGER NOT NULL`
- `unit_price_cents INTEGER NOT NULL`
- `total_cents INTEGER NOT NULL`

Índices: `idx_orders_lines_ord` (order_id)

Repositorios que referencian la tabla: `apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.ts`

### `orders_history`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `order_id TEXT NOT NULL`
- `from_status TEXT`
- `to_status TEXT NOT NULL`
- `note TEXT`
- `actor TEXT NOT NULL`
- `created_at TEXT NOT NULL`

Índices: `idx_orders_history_ord` (order_id)

Repositorios que referencian la tabla: `apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.ts`

### `orders_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `created_at TEXT NOT NULL`
- `published_at TEXT`

Índices: `idx_orders_outbox_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderOutboxRepository.ts`

## `payments__0001_init.sql` · fuente `apps/api/src/modules/payments/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 4; índices explícitos: 6. Copias: `migrations/payments__0001_init.sql` y `apps/api/migrations/payments__0001_init.sql`.

### `payments_transactions`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `order_id TEXT NOT NULL`
- `payment_method TEXT NOT NULL`
- `amount_in_cents INTEGER NOT NULL`
- `currency TEXT NOT NULL DEFAULT 'COP'`
- `reference TEXT NOT NULL UNIQUE`
- `wompi_transaction_id TEXT`
- `integrity_signature TEXT`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_payments_order` (order_id), `idx_payments_reference` (reference), `idx_payments_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/payments/infrastructure/persistence/d1/repositories/D1PaymentRepository.ts`

### `payments_webhook_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_id TEXT NOT NULL UNIQUE`
- `event_type TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `processed_at TEXT NOT NULL`

Índices: `idx_payments_webhook_event` (event_id)

Repositorios que referencian la tabla: `apps/api/src/modules/payments/infrastructure/persistence/d1/repositories/D1PaymentRepository.ts`

### `payments_cod_collections`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `order_id TEXT NOT NULL`
- `amount_in_cents INTEGER NOT NULL`
- `collected_by TEXT NOT NULL`
- `collected_at TEXT NOT NULL`
- `notes TEXT`

Índices: `idx_payments_cod_order` (order_id)

Repositorios que referencian la tabla: `apps/api/src/modules/payments/infrastructure/persistence/d1/repositories/D1PaymentRepository.ts`

### `payments_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `created_at TEXT NOT NULL`
- `published_at TEXT`

Índices: `idx_payments_outbox_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/payments/infrastructure/persistence/d1/repositories/D1PaymentOutboxRepository.ts`

## `payments__0002_expand_columns.sql` · fuente `apps/api/src/modules/payments/infrastructure/persistence/d1/migrations/0002_expand_columns.sql`

Tablas: 0; índices explícitos: 4. Copias: `migrations/payments__0002_expand_columns.sql` y `apps/api/migrations/payments__0002_expand_columns.sql`.

## `payments__0003_cod_collection_receipts.sql` · fuente `apps/api/src/modules/payments/infrastructure/persistence/d1/migrations/0003_cod_collection_receipts.sql`

Tablas: 0; índices explícitos: 1. Copias: `migrations/payments__0003_cod_collection_receipts.sql` y `apps/api/migrations/payments__0003_cod_collection_receipts.sql`.

## `promotions__0001_init.sql` · fuente `apps/api/src/modules/promotions/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 4; índices explícitos: 5. Copias: `migrations/promotions__0001_init.sql` y `apps/api/migrations/promotions__0001_init.sql`.

### `promotions_rules`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `description TEXT`
- `discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount'))`
- `discount_value INTEGER NOT NULL`
- `target_type TEXT NOT NULL CHECK(target_type IN ('all', 'product', 'category'))`
- `target_id TEXT`
- `min_order_amount_cents INTEGER NOT NULL DEFAULT 0`
- `starts_at TEXT NOT NULL`
- `ends_at TEXT NOT NULL`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `priority INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_promotions_rules_active` (is_active, starts_at, ends_at), `idx_promotions_rules_target` (target_type, target_id)

Repositorios que referencian la tabla: `apps/api/src/modules/promotions/infrastructure/persistence/d1/repositories/D1PromotionRuleRepository.ts`

### `promotions_coupons`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `code TEXT NOT NULL UNIQUE`
- `description TEXT`
- `discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount'))`
- `discount_value INTEGER NOT NULL`
- `min_order_amount_cents INTEGER NOT NULL DEFAULT 0`
- `max_uses_global INTEGER`
- `max_uses_per_customer INTEGER DEFAULT 1`
- `current_uses_count INTEGER NOT NULL DEFAULT 0`
- `starts_at TEXT NOT NULL`
- `ends_at TEXT NOT NULL`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_promotions_coupons_code` (code), `idx_promotions_coupons_active` (is_active)

Repositorios que referencian la tabla: `apps/api/src/modules/promotions/infrastructure/persistence/d1/repositories/D1CouponRepository.ts`

### `promotions_redemptions`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `coupon_id TEXT NOT NULL`
- `order_id TEXT`
- `customer_id TEXT NOT NULL`
- `discount_applied_cents INTEGER NOT NULL`
- `redeemed_at TEXT NOT NULL`

Índices: `idx_promotions_redemptions_coupon_customer` (coupon_id, customer_id)

Repositorios que referencian la tabla: `apps/api/src/modules/promotions/infrastructure/persistence/d1/repositories/D1CouponRepository.ts`

### `promotions_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `retry_count INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `processed_at TEXT`

Índices: ninguno explícito

Repositorios que referencian la tabla: no encontrado

## `promotions__0002_coupon_targets.sql` · fuente `apps/api/src/modules/promotions/infrastructure/persistence/d1/migrations/0002_coupon_targets.sql`

Tablas: 0; índices explícitos: 1. Copias: `migrations/promotions__0002_coupon_targets.sql` y `apps/api/migrations/promotions__0002_coupon_targets.sql`.

## `realtime__0001_init.sql` · fuente `apps/api/src/modules/realtime/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 1; índices explícitos: 2. Copias: `migrations/realtime__0001_init.sql` y `apps/api/migrations/realtime__0001_init.sql`.

### `realtime_notifications`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `channel TEXT NOT NULL`
- `event_type TEXT NOT NULL`
- `title TEXT NOT NULL`
- `message TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `pedido`
- `cliente`
- `entrega is_read INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`

Índices: `idx_realtime_channel` (channel), `idx_realtime_created` (created_at)

Repositorios que referencian la tabla: `apps/api/src/modules/realtime/infrastructure/persistence/d1/repositories/D1RealtimeRepository.ts`

## `realtime__0002_expand_columns.sql` · fuente `apps/api/src/modules/realtime/infrastructure/persistence/d1/migrations/0002_expand_columns.sql`

Tablas: 0; índices explícitos: 1. Copias: `migrations/realtime__0002_expand_columns.sql` y `apps/api/migrations/realtime__0002_expand_columns.sql`.

## `realtime__0003_preserve_read_state.sql` · fuente `apps/api/src/modules/realtime/infrastructure/persistence/d1/migrations/0003_preserve_read_state.sql`

Tablas: 0; índices explícitos: 0. Copias: `migrations/realtime__0003_preserve_read_state.sql` y `apps/api/migrations/realtime__0003_preserve_read_state.sql`.

## `seo__0001_init.sql` · fuente `apps/api/src/modules/seo/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 3; índices explícitos: 3. Copias: `migrations/seo__0001_init.sql` y `apps/api/migrations/seo__0001_init.sql`.

### `seo_redirects`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `from_path TEXT NOT NULL UNIQUE`
- `to_path TEXT NOT NULL`
- `status_code INTEGER NOT NULL DEFAULT 301`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_seo_redirects_from` (from_path)

Repositorios que referencian la tabla: `apps/api/src/modules/seo/infrastructure/persistence/d1/repositories/D1RedirectRepository.ts`

### `seo_metadata`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `entity_type TEXT NOT NULL`
- `entity_id TEXT NOT NULL`
- `seo_title TEXT`
- `seo_description TEXT`
- `canonical_url TEXT`
- `noindex INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `UNIQUE (entity_type, entity_id)`

Índices: `idx_seo_metadata_entity` (entity_type, entity_id)

Repositorios que referencian la tabla: no encontrado

### `seo_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'PENDING'`
- `created_at TEXT NOT NULL`
- `relayed_at TEXT`

Índices: `idx_seo_outbox_status` (status)

Repositorios que referencian la tabla: no encontrado

## `settings__0001_init.sql` · fuente `apps/api/src/modules/settings/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 2; índices explícitos: 1. Copias: `migrations/settings__0001_init.sql` y `apps/api/migrations/settings__0001_init.sql`.

### `settings_store`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `store_name TEXT NOT NULL`
- `currency TEXT NOT NULL DEFAULT 'COP'`
- `tax_rate_percent REAL NOT NULL DEFAULT 19.0`
- `support_email TEXT NOT NULL`
- `support_phone TEXT`
- `require_cod_verification INTEGER NOT NULL DEFAULT 1`
- `updated_at TEXT NOT NULL`

Índices: ninguno explícito

Repositorios que referencian la tabla: `apps/api/src/modules/settings/infrastructure/persistence/d1/repositories/D1SettingsRepository.ts`

### `settings_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_id TEXT NOT NULL UNIQUE`
- `event_type TEXT NOT NULL`
- `event_version INTEGER NOT NULL`
- `payload TEXT NOT NULL`
- `trace_id TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `attempts INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `published_at TEXT`

Índices: `idx_settings_outbox_status_attempts` (status, attempts)

Repositorios que referencian la tabla: no encontrado

## `settings__0002_company_tax_fields.sql` · fuente `apps/api/src/modules/settings/infrastructure/persistence/d1/migrations/0002_company_tax_fields.sql`

Tablas: 0; índices explícitos: 0. Copias: `migrations/settings__0002_company_tax_fields.sql` y `apps/api/migrations/settings__0002_company_tax_fields.sql`.

## `shipping__0001_init.sql` · fuente `apps/api/src/modules/shipping/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 4; índices explícitos: 7. Copias: `migrations/shipping__0001_init.sql` y `apps/api/migrations/shipping__0001_init.sql`.

### `shipping_divipola`

Declaraciones de columnas/restricciones:
- `dane_code TEXT PRIMARY KEY`
- `department TEXT NOT NULL`
- `municipality TEXT NOT NULL`
- `type TEXT NOT NULL DEFAULT 'municipio'`

Índices: `idx_shipping_divipola_dept` (department), `idx_shipping_divipola_muni` (municipality)

Repositorios que referencian la tabla: `apps/api/src/modules/shipping/infrastructure/persistence/d1/repositories/D1DivipolaRepository.ts`

### `shipping_zones`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `type TEXT NOT NULL DEFAULT 'city'`
- `price_in_cents INTEGER NOT NULL DEFAULT 0`
- `min_estimated_days INTEGER NOT NULL DEFAULT 1`
- `max_estimated_days INTEGER NOT NULL DEFAULT 3`
- `allows_cash_on_delivery INTEGER NOT NULL DEFAULT 1`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_shipping_zones_type` (type), `idx_shipping_zones_active` (is_active)

Repositorios que referencian la tabla: `apps/api/src/modules/shipping/infrastructure/persistence/d1/repositories/D1ShippingZoneRepository.ts`

### `shipping_zone_locations`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `zone_id TEXT NOT NULL`
- `dane_code TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `UNIQUE (zone_id, dane_code)`

Índices: `idx_shipping_zone_loc_zone` (zone_id), `idx_shipping_zone_loc_dane` (dane_code)

Repositorios que referencian la tabla: `apps/api/src/modules/shipping/infrastructure/persistence/d1/repositories/D1ShippingZoneRepository.ts`

### `shipping_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `created_at TEXT NOT NULL`
- `published_at TEXT`

Índices: `idx_shipping_outbox_status` (status)

Repositorios que referencian la tabla: `apps/api/src/modules/shipping/infrastructure/persistence/d1/repositories/D1ShippingOutboxRepository.ts`

## `storefront__0001_init.sql` · fuente `apps/api/src/modules/storefront/infrastructure/persistence/d1/migrations/0001_init.sql`

Tablas: 3; índices explícitos: 5. Copias: `migrations/storefront__0001_init.sql` y `apps/api/migrations/storefront__0001_init.sql`.

### `storefront_banners`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `title TEXT NOT NULL`
- `placement TEXT NOT NULL DEFAULT 'home'`
- `image_url TEXT NOT NULL`
- `link_url TEXT NOT NULL`
- `alt_text TEXT NOT NULL`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `starts_at TEXT`
- `ends_at TEXT`
- `sort_order INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_storefront_banners_placement` (placement), `idx_storefront_banners_active` (is_active)

Repositorios que referencian la tabla: `apps/api/src/modules/storefront/infrastructure/persistence/d1/repositories/D1StorefrontContentRepository.ts`

### `storefront_announcements`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `message TEXT NOT NULL`
- `placement TEXT NOT NULL DEFAULT 'top_bar'`
- `link_url TEXT`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `starts_at TEXT`
- `ends_at TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Índices: `idx_storefront_announcements_placement` (placement), `idx_storefront_announcements_active` (is_active)

Repositorios que referencian la tabla: `apps/api/src/modules/storefront/infrastructure/persistence/d1/repositories/D1StorefrontContentRepository.ts`

### `storefront_outbox_events`

Declaraciones de columnas/restricciones:
- `id TEXT PRIMARY KEY`
- `event_name TEXT NOT NULL`
- `payload TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'PENDING'`
- `created_at TEXT NOT NULL`
- `relayed_at TEXT`

Índices: `idx_storefront_outbox_status` (status)

Repositorios que referencian la tabla: no encontrado

## `storefront__0002_banner_description.sql` · fuente `apps/api/src/modules/storefront/infrastructure/persistence/d1/migrations/0002_banner_description.sql`

Tablas: 0; índices explícitos: 0. Copias: `migrations/storefront__0002_banner_description.sql` y `apps/api/migrations/storefront__0002_banner_description.sql`.

## `storefront__0003_banner_types_and_cta.sql` · fuente `apps/api/src/modules/storefront/infrastructure/persistence/d1/migrations/0003_banner_types_and_cta.sql`

Tablas: 0; índices explícitos: 0. Copias: `migrations/storefront__0003_banner_types_and_cta.sql` y `apps/api/migrations/storefront__0003_banner_types_and_cta.sql`.
