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
    assert orders.execute("SELECT guest_cart_id_hash FROM orders_orders WHERE id='legacy-guest'").fetchone() == (None,)
    print("Legacy orders upgrade passed (existing guest order preserved with nullable capability).")

    inventory = sqlite3.connect(":memory:")
    inventory_path = MIGRATIONS / "inventory/infrastructure/persistence/d1/migrations"
    inventory.executescript((inventory_path / "0001_init.sql").read_text(encoding="utf-8"))
    inventory.execute("INSERT INTO inventory_stocks(product_id,quantity,reserved_quantity,updated_at) VALUES('legacy-product',4,1,'t0')")
    inventory.executescript((inventory_path / "0002_idempotent_order_consumption.sql").read_text(encoding="utf-8"))
    assert inventory.execute("SELECT quantity,reserved_quantity FROM inventory_stocks WHERE product_id='legacy-product'").fetchone() == (4, 1)
    print("Legacy inventory upgrade passed (stock preserved; idempotency ledger added).")


if __name__ == "__main__":
    check_fresh_schema()
    check_legacy_backfills()
