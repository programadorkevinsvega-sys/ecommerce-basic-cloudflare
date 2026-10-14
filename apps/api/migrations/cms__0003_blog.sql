-- Blog del módulo CMS. Aditiva: conserva páginas, menús y versiones existentes.
CREATE TABLE IF NOT EXISTS cms_blog_authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  image_media_id TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_blog_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL,
  author_id TEXT NOT NULL,
  featured_image_media_id TEXT,
  featured_image_alt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at TEXT,
  published_at TEXT,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  canonical_url TEXT,
  noindex INTEGER NOT NULL DEFAULT 0 CHECK (noindex IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES cms_blog_authors(id)
);

CREATE TABLE IF NOT EXISTS cms_blog_post_categories (
  post_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES cms_blog_posts(id),
  FOREIGN KEY (category_id) REFERENCES cms_blog_categories(id)
);

CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_status_date ON cms_blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_schedule ON cms_blog_posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cms_blog_post_categories_category ON cms_blog_post_categories(category_id, post_id);
