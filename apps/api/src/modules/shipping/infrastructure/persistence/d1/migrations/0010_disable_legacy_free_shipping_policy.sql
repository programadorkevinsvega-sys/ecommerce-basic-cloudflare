-- Keep the retired singleton row safe for rollback to an older Worker.
-- It is disabled and has no monetary threshold; current code reads rule rows only.
INSERT INTO shipping_free_shipping_policy (id, enabled, threshold_cents, updated_at)
VALUES ('default', 0, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT(id) DO UPDATE SET enabled = 0, threshold_cents = 0, updated_at = excluded.updated_at;
