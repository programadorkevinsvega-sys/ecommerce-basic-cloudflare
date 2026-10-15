CREATE TABLE IF NOT EXISTS catalog_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catalog_tags_status_name ON catalog_tags(status,name);

-- Conserva como entidades las etiquetas ya usadas en el JSON histórico de productos.
INSERT OR IGNORE INTO catalog_tags(id,name,description,status,created_at,updated_at)
SELECT lower(hex(randomblob(16))), trim(j.value), '', 'active', datetime('now'), datetime('now')
FROM catalog_products p, json_each(CASE WHEN json_valid(p.tags) THEN p.tags ELSE '[]' END) j
WHERE typeof(j.value)='text' AND trim(j.value)<>''
GROUP BY lower(trim(j.value));

INSERT OR IGNORE INTO catalog_tags(id,name,description,status,created_at,updated_at) VALUES
('tag-new-arrival','Novedad','Productos recién incorporados al catálogo.','active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('tag-best-seller','Más vendido','Productos destacados por su popularidad.','active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('tag-limited-edition','Edición limitada','Productos disponibles en cantidades limitadas.','active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');
