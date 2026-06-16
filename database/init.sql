-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Mettre à jour le timestamp automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLES CŒUR
-- ============================================

-- Tenants (clients/organisations)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    db_schema VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Utilisateurs globaux
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLES DE LIAISON
-- ============================================

-- Profiles (liaison User-Tenant avec rôles et métadonnées)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    phone VARCHAR(50),
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tenant_id)
);

-- ============================================
-- TABLES MÉTIER
-- ============================================

-- Products (produits par tenant)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files (fichiers uploadés par tenant)
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'general',
    entity_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLES D'AUTHENTIFICATION
-- ============================================

-- Refresh tokens (gestion des sessions JWT)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLES D'AUDIT (optionnel)
-- ============================================

-- Audit logs (journalisation des actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX
-- ============================================

-- Index pour tenants
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Index pour profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Index pour products
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Index pour files
CREATE INDEX IF NOT EXISTS idx_files_tenant_id ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);

-- Index pour refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(revoked);

-- Index pour audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- TRIGGERS (updated_at automatique)
-- ============================================

CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refresh_tokens_updated_at 
    BEFORE UPDATE ON refresh_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONNÉES DE TEST
-- ============================================

-- Tenants de test
INSERT INTO tenants (name, subdomain, is_active) VALUES 
    ('Client Démo', 'demo', true),
    ('Client Un', 'client1', true),
    ('Client Deux', 'client2', true)
ON CONFLICT (subdomain) DO NOTHING;

-- ============================================
-- FONCTIONS STOCKÉES UTILES
-- ============================================

-- Créer un utilisateur
CREATE OR REPLACE FUNCTION create_user(
    p_email VARCHAR(255),
    p_password_hash VARCHAR(255),
    p_name VARCHAR(255)
) RETURNS users AS $$
DECLARE
    v_user users;
BEGIN
    INSERT INTO users (email, password_hash, name)
    VALUES (p_email, p_password_hash, p_name)
    RETURNING * INTO v_user;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql;

-- Trouver un utilisateur par email
CREATE OR REPLACE FUNCTION find_user_by_email(
    p_email VARCHAR(255)
) RETURNS users AS $$
DECLARE
    v_user users;
BEGIN
    SELECT * INTO v_user FROM users WHERE email = p_email;
    RETURN v_user;
END;
$$ LANGUAGE plpgsql;

-- Nettoyer les refresh tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() OR revoked = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;

-- ============================================
-- WALLETS & CREDITS
-- ============================================

-- Portefeuilles (un par utilisateur/tenant)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, user_id)
);

-- Journal des transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'purchase', 'refund', 'bonus'
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    reference_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- ============================================
-- INDEX POUR WALLETS & TRANSACTIONS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_tenant_id ON wallets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(balance);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- TRIGGERS POUR WALLETS
-- ============================================

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTIONS POUR LES SOLDES
-- ============================================

-- Obtenir le solde d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_balance(
    p_user_id UUID,
    p_tenant_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT balance INTO v_balance
    FROM wallets
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id AND is_active = true;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Créditer un utilisateur (avec transaction automatique)
CREATE OR REPLACE FUNCTION credit_user(
    p_user_id UUID,
    p_tenant_id UUID,
    p_amount DECIMAL,
    p_description TEXT,
    p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance DECIMAL;
    v_transaction_id UUID;
BEGIN
    -- Récupérer ou créer le wallet
    SELECT id INTO v_wallet_id
    FROM wallets
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id AND is_active = true;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO wallets (user_id, tenant_id, balance)
        VALUES (p_user_id, p_tenant_id, 0)
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Mettre à jour le solde
    UPDATE wallets 
    SET balance = balance + p_amount, updated_at = NOW()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_new_balance;
    
    -- Enregistrer la transaction
    INSERT INTO transactions (wallet_id, user_id, tenant_id, type, amount, balance_after, description, created_by)
    VALUES (v_wallet_id, p_user_id, p_tenant_id, 'credit', p_amount, v_new_balance, p_description, p_created_by)
    RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object(
        'success', true,
        'balance', v_new_balance,
        'transaction_id', v_transaction_id
    );
END;
$$ LANGUAGE plpgsql;

-- Débiter un utilisateur (avec vérification de solde)
CREATE OR REPLACE FUNCTION debit_user(
    p_user_id UUID,
    p_tenant_id UUID,
    p_amount DECIMAL,
    p_description TEXT,
    p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_wallet_id UUID;
    v_current_balance DECIMAL;
    v_new_balance DECIMAL;
    v_transaction_id UUID;
BEGIN
    -- Récupérer le wallet
    SELECT id, balance INTO v_wallet_id, v_current_balance
    FROM wallets
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id AND is_active = true;
    
    IF v_wallet_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Wallet not found'
        );
    END IF;
    
    -- Vérifier le solde
    IF v_current_balance < p_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient balance',
            'balance', v_current_balance
        );
    END IF;
    
    -- Mettre à jour le solde
    UPDATE wallets 
    SET balance = balance - p_amount, updated_at = NOW()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_new_balance;
    
    -- Enregistrer la transaction
    INSERT INTO transactions (wallet_id, user_id, tenant_id, type, amount, balance_after, description, created_by)
    VALUES (v_wallet_id, p_user_id, p_tenant_id, 'debit', p_amount, v_new_balance, p_description, p_created_by)
    RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object(
        'success', true,
        'balance', v_new_balance,
        'transaction_id', v_transaction_id
    );
END;

$$ LANGUAGE plpgsql;