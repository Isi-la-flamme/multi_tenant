-- Migration: Création des tables de crédit client
-- Date: 2026-06-16

BEGIN;

-- Lignes de crédit client
CREATE TABLE IF NOT EXISTS client_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    used_amount DECIMAL(15,2) DEFAULT 0,
    available_amount DECIMAL(15,2) DEFAULT 0,
    payment_delay_days INTEGER DEFAULT 30,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(tenant_id, user_id)
);

-- Factures en attente de paiement
CREATE TABLE IF NOT EXISTS debt_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_credit_id UUID REFERENCES client_credits(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    amount_remaining DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Paiements reçus
CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES debt_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_client_credits_user_id ON client_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_client_credits_tenant_id ON client_credits(tenant_id);

CREATE INDEX IF NOT EXISTS idx_debt_invoices_user_id ON debt_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_invoices_tenant_id ON debt_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_debt_invoices_status ON debt_invoices(status);
CREATE INDEX IF NOT EXISTS idx_debt_invoices_due_date ON debt_invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_debt_payments_invoice_id ON debt_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON debt_payments(user_id);

-- Triggers
CREATE TRIGGER update_client_credits_updated_at 
    BEFORE UPDATE ON client_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debt_invoices_updated_at 
    BEFORE UPDATE ON debt_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;