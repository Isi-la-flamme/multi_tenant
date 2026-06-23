-- Add catalog fields used by products and POS screens.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS image VARCHAR(500),
    ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
