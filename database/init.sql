-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Tables de gestion globale (schéma public)
-- ============================================

-- Tenants
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

-- Utilisateurs
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

-- Liaison utilisateurs <-> tenants
CREATE TABLE IF NOT EXISTS tenant_users (
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, user_id)
);

-- ============================================
-- Données de test (développement)
-- ============================================

-- Tenants de test
INSERT INTO tenants (name, subdomain) VALUES 
    ('Client Démo', 'demo'),
    ('Client Un', 'client1'),
    ('Client Deux', 'client2')
ON CONFLICT (subdomain) DO NOTHING;

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Mettre à jour le timestamp automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Ajouter à la fin du fichier existant

-- Fonction pour créer un utilisateur
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

-- Fonction pour trouver un utilisateur par email
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