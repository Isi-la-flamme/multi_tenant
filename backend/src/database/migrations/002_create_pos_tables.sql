-- 002_create_pos_tables.sql

-- Table des ventes POS
CREATE TABLE IF NOT EXISTS pos_sales (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    cart JSONB NOT NULL,
    payment JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    cashier_id UUID,
    cashier_name VARCHAR(100),
    customer_id VARCHAR(100),
    customer_name VARCHAR(100),
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_pos_sales_tenant_id ON pos_sales(tenant_id);
CREATE INDEX idx_pos_sales_invoice_number ON pos_sales(invoice_number);
CREATE INDEX idx_pos_sales_created_at ON pos_sales(created_at);
CREATE INDEX idx_pos_sales_status ON pos_sales(status);

-- Index pour les recherches
CREATE INDEX idx_pos_sales_customer_name ON pos_sales(customer_name);