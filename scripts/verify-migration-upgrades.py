"""SQLite compatibility checks for D1 migration SQL and affected repository writes."""
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "apps/api/src/modules"


def apply_module(db: sqlite3.Connection, module: str) -> None:
    files = sorted(
        (MIGRATIONS / module / "infrastructure/persistence/d1/migrations").glob("*.sql"),
        key=lambda path: int(re.match(r"(\d+)", path.name).group(1)),
    )
    for migration in files:
        db.executescript(migration.read_text(encoding="utf-8"))


def check_fresh_schema() -> None:
    db = sqlite3.connect(":memory:")
    for module in sorted(path.name for path in MIGRATIONS.iterdir() if path.is_dir()):
        apply_module(db, module)
    tables = db.execute("SELECT count(*) FROM sqlite_master WHERE type='table'").fetchone()[0]
    assert tables >= 60, f"Expected the complete schema, found {tables} tables"
    order_columns = {row[1] for row in db.execute("PRAGMA table_info(orders_orders)")}
    assert "guest_cart_id_hash" in order_columns, "Guest order ownership migration is missing"
    assert db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='inventory_order_consumptions'").fetchone(), "Idempotent inventory migration is missing"
    catalog_columns = {row[1] for row in db.execute("PRAGMA table_info(catalog_products)")}
    assert {"supplier_cost_cents", "target_margin_basis_points", "pricing_target_type", "target_profit_cents", "allowed_payment_methods", "pricing_version"} <= catalog_columns
    assert "legacy_price_before_tax_cents" in catalog_columns
    assert {"catalog_collections", "catalog_collection_products"} <= {
        row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")
    }, "Collection migrations are missing from the fresh schema"
    order_columns = {row[1] for row in db.execute("PRAGMA table_info(orders_orders)")}
    assert {"tax_cents", "pricing_version", "estimated_payment_fee_cents"} <= order_columns
    assert "transaction_fee_cents" in order_columns
    invoice_columns = {row[1] for row in db.execute("PRAGMA table_info(invoicing_invoices)")}
    assert "tax_included" in invoice_columns
    db.execute("INSERT INTO payments_settlement_costs(order_id,actual_fee_cents,estimated_fee_cents,report_reference,recorded_by,recorded_at) VALUES('ord-1',420,500,'report-row-1','admin-1','t0')")
    assert db.execute("SELECT actual_fee_cents-estimated_fee_cents FROM payments_settlement_costs WHERE order_id='ord-1'").fetchone() == (-80,)

    db.execute(
        """INSERT INTO payments_cod_collections
        (id, order_id, amount_in_cents, collected_by, collected_at, receipt_number, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        ("cod-1", "ord-1", 2500, "admin-1", "2026-10-12T10:00:00Z", "R-1", None, "2026-10-12T10:00:00Z"),
    )
    assert db.execute("SELECT receipt_number, created_at FROM payments_cod_collections WHERE id='cod-1'").fetchone() == ("R-1", "2026-10-12T10:00:00Z")

    db.execute(
        """INSERT INTO storefront_banners
        (id,title,description,banner_type,button_text,placement,image_url,link_url,alt_text,is_active,starts_at,ends_at,sort_order,created_at,updated_at)
        VALUES ('b1','Title','old','promotional','Shop','home','/a','/p','Alt',1,NULL,NULL,0,'t0','t0')"""
    )
    db.execute(
        """INSERT INTO storefront_banners
        (id,title,description,banner_type,button_text,placement,image_url,link_url,alt_text,is_active,starts_at,ends_at,sort_order,created_at,updated_at)
        VALUES ('b1','Title','new','informative',NULL,'product','/a','#','Alt',1,'2026-10-13T00:00:00Z',NULL,7,'t0','t1')
        ON CONFLICT(id) DO UPDATE SET description=excluded.description,banner_type=excluded.banner_type,
        button_text=excluded.button_text,placement=excluded.placement,image_url=excluded.image_url,
        link_url=excluded.link_url,alt_text=excluded.alt_text,is_active=excluded.is_active,
        starts_at=excluded.starts_at,ends_at=excluded.ends_at,sort_order=excluded.sort_order,updated_at=excluded.updated_at"""
    )
    row = db.execute("SELECT description,placement,starts_at,sort_order FROM storefront_banners WHERE id='b1'").fetchone()
    assert row == ("new", "product", "2026-10-13T00:00:00Z", 7), row
    print(f"Fresh schema + COD insert + banner update + guest order capability passed ({tables} tables).")


def check_legacy_backfills() -> None:
    cms = sqlite3.connect(":memory:")
    cms_path = MIGRATIONS / "cms/infrastructure/persistence/d1/migrations"
    cms.executescript((cms_path / "0001_init.sql").read_text(encoding="utf-8"))
    cms.execute("INSERT INTO cms_pages(id,title,slug,status,current_version,created_at,updated_at) VALUES('legacy-page','Página existente','sobre-nosotros','published',1,'t0','t0')")
    cms.execute("INSERT INTO cms_page_versions(id,page_id,version_number,title,blocks,created_at) VALUES('legacy-version','legacy-page',1,'Página existente','[]','t0')")
    cms.executescript((cms_path / "0002_institutional_pages.sql").read_text(encoding="utf-8"))
    cms.executescript((cms_path / "0003_blog.sql").read_text(encoding="utf-8"))
    cms.executescript((cms_path / "0003_blog.sql").read_text(encoding="utf-8"))
    blog_seed = (cms_path / "0004_blog_welcome_article.sql").read_text(encoding="utf-8")
    cms.executescript(blog_seed)
    cms.executescript(blog_seed)
    assert cms.execute("SELECT title,status FROM cms_pages WHERE id='legacy-page'").fetchone() == ("Página existente", "published")
    assert {row[0] for row in cms.execute("SELECT name FROM sqlite_master WHERE type='table'")} >= {
        "cms_blog_authors", "cms_blog_categories", "cms_blog_posts", "cms_blog_post_categories",
    }
    assert cms.execute("SELECT title,status FROM cms_blog_posts WHERE slug='bienvenido-al-blog-de-vega-store'").fetchone() == ("Bienvenido al blog de Vega Store", "published")
    assert cms.execute("SELECT COUNT(*) FROM cms_blog_posts").fetchone()[0] == 1
    assert cms.execute("SELECT COUNT(*) FROM cms_blog_post_categories").fetchone()[0] == 1
    print("Legacy CMS upgrade passed (published page preserved; blog schema and welcome seed idempotent).")

    db = sqlite3.connect(":memory:")
    for module in ("payments", "realtime", "storefront"):
        source = MIGRATIONS / module / "infrastructure/persistence/d1/migrations"
        initial = next(source.glob("0001_*.sql"))
        db.executescript(initial.read_text(encoding="utf-8"))
    db.execute("INSERT INTO payments_cod_collections(id,order_id,amount_in_cents,collected_by,collected_at) VALUES('c','o',5,'admin','2026-01-01T00:00:00Z')")
    db.execute("INSERT INTO realtime_notifications(id,channel,event_type,title,message,payload,is_read,created_at) VALUES('n','admin','e','t','m','{}',1,'2026-01-01T00:00:00Z')")
    for module in ("payments", "realtime", "storefront"):
        source = MIGRATIONS / module / "infrastructure/persistence/d1/migrations"
        for migration in sorted(source.glob("*.sql"), key=lambda path: int(re.match(r"(\d+)", path.name).group(1))):
            if migration.name.startswith("0001_"):
                continue
            db.executescript(migration.read_text(encoding="utf-8"))
    assert db.execute("SELECT created_at FROM payments_cod_collections WHERE id='c'").fetchone()[0] == "2026-01-01T00:00:00Z"
    assert db.execute("SELECT read FROM realtime_notifications WHERE id='n'").fetchone()[0] == 1
    print("Legacy upgrade passed (COD timestamp backfill; read state preserved).")

    orders = sqlite3.connect(":memory:")
    orders_path = MIGRATIONS / "orders/infrastructure/persistence/d1/migrations"
    orders.executescript(next(orders_path.glob("0001_*.sql")).read_text(encoding="utf-8"))
    orders.execute(
        """INSERT INTO orders_orders
        (id, customer_email, customer_name, customer_phone, shipping_address, shipping_zone_id,
         subtotal_cents, total_cents, payment_method, created_at, updated_at)
        VALUES ('legacy-guest','g@example.test','Guest','3000000000','{}','zone',100,100,'wompi','t0','t0')"""
    )
    orders.executescript((orders_path / "0002_guest_cart_capability.sql").read_text(encoding="utf-8"))
    orders.executescript((orders_path / "0003_pricing_snapshots.sql").read_text(encoding="utf-8"))
    orders.executescript((orders_path / "0004_checkout_transaction_fee.sql").read_text(encoding="utf-8"))
    assert orders.execute("SELECT guest_cart_id_hash FROM orders_orders WHERE id='legacy-guest'").fetchone() == (None,)
    assert orders.execute("SELECT subtotal_cents,total_cents,tax_cents,pricing_version FROM orders_orders WHERE id='legacy-guest'").fetchone() == (100, 100, 0, 1)
    assert orders.execute("SELECT transaction_fee_cents FROM orders_orders WHERE id='legacy-guest'").fetchone() == (0,)
    print("Legacy orders upgrade passed (guest capability retained; financial snapshot and transaction fee defaults preserved).")

    inventory = sqlite3.connect(":memory:")
    inventory_path = MIGRATIONS / "inventory/infrastructure/persistence/d1/migrations"
    inventory.executescript((inventory_path / "0001_init.sql").read_text(encoding="utf-8"))
    inventory.execute("INSERT INTO inventory_stocks(product_id,quantity,reserved_quantity,updated_at) VALUES('legacy-product',4,1,'t0')")
    inventory.executescript((inventory_path / "0002_idempotent_order_consumption.sql").read_text(encoding="utf-8"))
    assert inventory.execute("SELECT quantity,reserved_quantity FROM inventory_stocks WHERE product_id='legacy-product'").fetchone() == (4, 1)
    print("Legacy inventory upgrade passed (stock preserved; idempotency ledger added).")

    catalog = sqlite3.connect(":memory:")
    catalog_path = MIGRATIONS / "catalog/infrastructure/persistence/d1/migrations"
    for migration in sorted(catalog_path.glob("000[1-3]_*.sql")):
        catalog.executescript(migration.read_text(encoding="utf-8"))
    catalog.execute("INSERT INTO catalog_brands(id,name,slug,created_at,updated_at) VALUES('b','Legacy Brand','legacy-brand','t0','t0')")
    catalog.execute("INSERT INTO catalog_products(id,name,slug,description,price_in_cents,sku,created_at,updated_at) VALUES('p','Legacy','legacy','desc',10000,'sku','t0','t0')")
    catalog.executescript((catalog_path / "0004_product_pricing.sql").read_text(encoding="utf-8"))
    legacy = catalog.execute("SELECT price_in_cents,pricing_version,supplier_cost_cents,target_margin_basis_points FROM catalog_products WHERE id='p'").fetchone()
    assert legacy == (10000, 1, None, 2000), legacy
    catalog.execute("UPDATE catalog_products SET supplier_cost_cents=5000,allowed_payment_methods='[\"wompi\"]',pricing_version=2 WHERE id='p'")
    assert catalog.execute("SELECT supplier_cost_cents,allowed_payment_methods,pricing_version FROM catalog_products WHERE id='p'").fetchone() == (5000, '["wompi"]', 2)
    catalog.executescript((catalog_path / "0005_profit_target_pricing.sql").read_text(encoding="utf-8"))
    defaults = catalog.execute("SELECT price_in_cents,pricing_target_type,target_profit_cents FROM catalog_products WHERE id='p'").fetchone()
    assert defaults == (10000, "margin", None), defaults
    catalog.execute("UPDATE catalog_products SET pricing_target_type='profit',target_profit_cents=2000000 WHERE id='p'")
    assert catalog.execute("SELECT pricing_target_type,target_profit_cents FROM catalog_products WHERE id='p'").fetchone() == ("profit", 2000000)
    catalog.executescript((catalog_path / "0006_suppliers_variants.sql").read_text(encoding="utf-8"))
    catalog.executescript((catalog_path / "0007_taxonomy_status.sql").read_text(encoding="utf-8"))
    previous_product = catalog.execute("SELECT price_in_cents,pricing_target_type,target_profit_cents FROM catalog_products WHERE id='p'").fetchone()
    catalog.executescript((catalog_path / "0008_collections.sql").read_text(encoding="utf-8"))
    catalog.executescript((catalog_path / "0008_collections.sql").read_text(encoding="utf-8"))
    catalog.executescript((catalog_path / "0009_collection_image.sql").read_text(encoding="utf-8"))
    catalog.executescript((catalog_path / "0010_brand_image.sql").read_text(encoding="utf-8"))
    assert catalog.execute("SELECT price_in_cents,pricing_target_type,target_profit_cents FROM catalog_products WHERE id='p'").fetchone() == previous_product
    assert catalog.execute("SELECT status FROM catalog_collections").fetchone() is None
    assert catalog.execute("SELECT name, image_media_id FROM catalog_brands WHERE id='b'").fetchone() == ("Legacy Brand", None)
    assert catalog.execute("SELECT image_media_id FROM catalog_collections").fetchone() is None
    print("Legacy catalog upgrade passed (product and brand data preserved; collection and brand image columns added).")

    invoices = sqlite3.connect(":memory:")
    invoice_path = MIGRATIONS / "invoicing/infrastructure/persistence/d1/migrations"
    invoices.executescript((invoice_path / "0001_init.sql").read_text(encoding="utf-8"))
    invoices.execute("INSERT INTO invoicing_invoices(id,invoice_number,order_id,customer_name,customer_email,subtotal_cents,tax_cents,shipping_cost_cents,total_cents,payment_method,snapshot_json,created_at,updated_at) VALUES('i','FAC-1','legacy-order','Guest','g@example.test',100,19,0,119,'wompi','{}','t0','t0')")
    invoices.executescript((invoice_path / "0002_tax_included.sql").read_text(encoding="utf-8"))
    assert invoices.execute("SELECT subtotal_cents,tax_cents,total_cents,tax_included FROM invoicing_invoices WHERE id='i'").fetchone() == (100, 19, 119, 0)
    print("Legacy invoice upgrade passed (stored amounts preserved; tax remains marked as added).")


if __name__ == "__main__":
    check_fresh_schema()
    check_legacy_backfills()
