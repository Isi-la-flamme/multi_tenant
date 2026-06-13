-- Schéma public pour la gestion globale
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    db_schema VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Un utilisateur peut appartenir à plusieurs tenants
CREATE TABLE tenant_users (
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member',
    PRIMARY KEY (tenant_id, user_id)
);

-- Seed un tenant de test
INSERT INTO tenants (name, subdomain) VALUES 
    ('Client Demo', 'demo');

-- Créer un schéma par tenant (optionnel, pour isolation forte)
CREATE SCHEMA IF NOT EXISTS tenant_demo;