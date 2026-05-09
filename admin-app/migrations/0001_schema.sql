-- K-LINE MEN admin — initial D1 schema (Phase 1b)
--
-- Design notes:
--   * Editable entities (products, categories, looks, promotions, homepage,
--     ig_strip, faqs, delivery_returns) carry a `status` column for the
--     Phase 1j approval workflow: draft → pending_review → published →
--     archived. inquiries skips this because it's system-generated.
--   * `revisions` and `audit_log` are generic (entity_type + entity_id) so
--     we don't multiply tables per entity type.
--   * Timestamps are unix-epoch milliseconds (INTEGER). D1 supports
--     `unixepoch()` so default values work without app-side intervention.
--   * Public IDs (products, categories.slug, looks) preserve their
--     existing string form to avoid breaking links and prerendered URLs.

-- Categories ---------------------------------------------------------------

CREATE TABLE categories (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  intro_copy      TEXT,
  hero_image_url  TEXT,
  status          TEXT NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft','pending_review','published','archived')),
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by      TEXT NOT NULL DEFAULT 'system',
  updated_by      TEXT NOT NULL DEFAULT 'system'
);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_status     ON categories(status);

-- Products -----------------------------------------------------------------

CREATE TABLE products (
  id            TEXT PRIMARY KEY,                       -- 'shirts-001' etc.
  name          TEXT NOT NULL,
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  price         INTEGER NOT NULL,                       -- UGX, integer
  sale_price    INTEGER,
  color_name    TEXT,
  color_hex     TEXT,
  description   TEXT,
  featured      INTEGER NOT NULL DEFAULT 0,             -- 0/1, manual feature flag
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','pending_review','published','archived')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by    TEXT NOT NULL DEFAULT 'system',
  updated_by    TEXT NOT NULL DEFAULT 'system'
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status   ON products(status);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = 1;

-- One row per image; sort_order 0 is the primary/cover image. Keeps gallery
-- ordering explicit instead of relying on insert order.
CREATE TABLE product_images (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  alt          TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_product_images_product ON product_images(product_id, sort_order);

-- Sizes carried on the product (preset like S/M/L or 30/32/34). stock_count
-- is NULL until Phase 1h fills it in; a NULL count means 'show this size by
-- default' (matches the pre-CMS public-site behaviour where sizes were
-- always listed regardless of inventory).
CREATE TABLE product_sizes (
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  stock_count  INTEGER,
  PRIMARY KEY (product_id, size)
);

-- Tag-like attributes. (product_id, value) PK keeps them small; sort_order
-- only matters for display consistency.
CREATE TABLE product_occasions (
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  occasion     TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, occasion)
);

CREATE TABLE product_badges (
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  badge        TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, badge)
);

-- Homepage (singleton) -----------------------------------------------------

-- id is hardcoded to 1; the admin UI overwrites this row in place rather
-- than deleting and recreating.
CREATE TABLE homepage (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  hero_image_url  TEXT,
  hero_headline   TEXT,
  hero_subline    TEXT,
  hero_cta_label  TEXT,
  hero_cta_link   TEXT,
  look_of_week_id TEXT,                                -- soft FK to looks(id), no constraint so deletes don't break the homepage
  status          TEXT NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft','pending_review','published','archived')),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_by      TEXT NOT NULL DEFAULT 'system'
);

-- Owner-curated lists; sort_order is the source of truth.
CREATE TABLE homepage_bestsellers (
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL,
  PRIMARY KEY (product_id)
);
CREATE INDEX idx_homepage_bestsellers_sort ON homepage_bestsellers(sort_order);

CREATE TABLE homepage_featured (
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL,
  PRIMARY KEY (product_id)
);
CREATE INDEX idx_homepage_featured_sort ON homepage_featured(sort_order);

-- Looks (Look of the Week + others) ---------------------------------------

CREATE TABLE looks (
  id            TEXT PRIMARY KEY,                       -- e.g. 'look-2026-week-19'
  role          TEXT NOT NULL DEFAULT 'inspiration'
                  CHECK (role IN ('weekly','inspiration')),
  title         TEXT NOT NULL,
  caption       TEXT,
  flatlay_url   TEXT,
  active_from   INTEGER,
  active_until  INTEGER,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','pending_review','published','archived')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by    TEXT NOT NULL DEFAULT 'system',
  updated_by    TEXT NOT NULL DEFAULT 'system'
);
CREATE INDEX idx_looks_status_active ON looks(status, active_from);

CREATE TABLE look_products (
  look_id      TEXT NOT NULL REFERENCES looks(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (look_id, product_id)
);

-- Promotions --------------------------------------------------------------

CREATE TABLE promotions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  label         TEXT NOT NULL,                          -- short tag e.g. 'BLACK_FRIDAY'
  banner_text   TEXT NOT NULL,
  link_url      TEXT,
  starts_at     INTEGER,                                -- NULL = active immediately
  ends_at       INTEGER,                                -- NULL = no end
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','pending_review','published','archived')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by    TEXT NOT NULL DEFAULT 'system',
  updated_by    TEXT NOT NULL DEFAULT 'system'
);
CREATE INDEX idx_promotions_active ON promotions(status, starts_at, ends_at);

-- IG strip entries --------------------------------------------------------

CREATE TABLE ig_strip (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url     TEXT NOT NULL,
  caption       TEXT,
  link_url      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft','pending_review','published','archived')),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_by    TEXT NOT NULL DEFAULT 'system'
);
CREATE INDEX idx_ig_strip_sort ON ig_strip(sort_order);

-- FAQs --------------------------------------------------------------------

CREATE TABLE faqs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft','pending_review','published','archived')),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_by    TEXT NOT NULL DEFAULT 'system'
);
CREATE INDEX idx_faqs_sort ON faqs(sort_order);

-- Settings (singleton) ----------------------------------------------------

CREATE TABLE settings (
  id                       INTEGER PRIMARY KEY CHECK (id = 1),
  store_name               TEXT,
  tagline                  TEXT,
  address_line_1           TEXT,
  address_line_2           TEXT,
  country                  TEXT,
  whatsapp_display         TEXT,
  whatsapp_raw             TEXT,
  call_display             TEXT,
  call_raw                 TEXT,
  email                    TEXT,
  hours                    TEXT,
  instagram_handle         TEXT,
  instagram_url            TEXT,
  whatsapp_order_template  TEXT,
  updated_at               INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_by               TEXT NOT NULL DEFAULT 'system'
);

-- Delivery & Returns (singleton) -----------------------------------------

CREATE TABLE delivery_returns (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  delivery_heading  TEXT,
  delivery_body     TEXT,
  returns_heading   TEXT,
  returns_body      TEXT,
  status            TEXT NOT NULL DEFAULT 'published'
                      CHECK (status IN ('draft','pending_review','published','archived')),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_by        TEXT NOT NULL DEFAULT 'system'
);

-- Inquiries (Phase 1i) ----------------------------------------------------

-- Captures every "Order on WhatsApp" click for the Reports tab. No status —
-- system-generated and immutable. product_id is nullable in case the click
-- came from a non-PDP page (homepage WhatsApp link, etc.).
CREATE TABLE inquiries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    TEXT REFERENCES products(id) ON DELETE SET NULL,
  source_page   TEXT,
  user_agent    TEXT,
  country       TEXT,
  occurred_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_inquiries_occurred ON inquiries(occurred_at);
CREATE INDEX idx_inquiries_product  ON inquiries(product_id);

-- Revisions (Phase 1j undo) -----------------------------------------------

-- Every save to an editable entity writes a JSON snapshot here. Powers the
-- 30-day one-click undo. Generic on entity_type + entity_id so we don't
-- need a revisions table per entity. Pruning > 30d will be a future cron.
CREATE TABLE revisions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT NOT NULL,                          -- 'products', 'categories', etc.
  entity_id     TEXT NOT NULL,
  snapshot      TEXT NOT NULL,                          -- JSON-serialised full row
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by    TEXT NOT NULL DEFAULT 'system'
);
CREATE INDEX idx_revisions_entity ON revisions(entity_type, entity_id, created_at DESC);

-- Audit log (Phase 1j approval workflow) ---------------------------------

-- Tracks who did what, when. Used for the approval queue, the activity feed
-- on each entity, and (eventually) compliance reports.
CREATE TABLE audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  action        TEXT NOT NULL,                          -- create | update | delete | submit | approve | reject
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  user_email    TEXT NOT NULL,
  details       TEXT,                                   -- JSON, e.g. { "comment": "Pricing wrong" }
  occurred_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, occurred_at DESC);
CREATE INDEX idx_audit_log_user   ON audit_log(user_email, occurred_at DESC);
