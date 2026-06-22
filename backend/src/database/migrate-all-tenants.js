// src/database/migrate-all-tenants.js
const { globalPool, getTenantPool, closeAllPools } = require('../config/database');

async function migrateAllTenants() {
  console.log('🚀 Début des migrations multi-tenants...');
  console.log('============================================\n');
  
  try {
    // 1. Vérifier la connexion à la base de données
    console.log('🔍 Test de connexion à PostgreSQL...');
    await globalPool.query('SELECT 1');
    console.log('✅ Connexion à PostgreSQL établie\n');

    // ============================================
    // Tables globales (partagées)
    // ============================================
    console.log('📦 Création des tables globales...');

    // Table tenants
    console.log('  ➜ Table tenants...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        subdomain VARCHAR(100) UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================
    // Tables tenant-specific (avec tenant_id)
    // ============================================
    console.log('\n📦 Création des tables tenant-specific...');

    // Table users
    console.log('  ➜ Table users...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, email)
      );
    `);

    // Table products
    console.log('  ➜ Table products...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        category VARCHAR(100),
        stock INTEGER DEFAULT 0,
        image VARCHAR(500),
        barcode VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table credit_clients
    console.log('  ➜ Table credit_clients...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS credit_clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        client_id VARCHAR(100) UNIQUE NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        total_credit DECIMAL(10,2) DEFAULT 0,
        used_credit DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table credit_transactions
    console.log('  ➜ Table credit_transactions...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES credit_clients(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table invoices
    console.log('  ➜ Table invoices...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        client_id VARCHAR(100) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        due_date DATE,
        issued_date DATE DEFAULT CURRENT_DATE,
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table wallets
    console.log('  ➜ Table wallets...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(10,2) DEFAULT 0,
        frozen_balance DECIMAL(10,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'EUR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table wallet_transactions
    console.log('  ➜ Table wallet_transactions...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        balance_before DECIMAL(10,2) NOT NULL,
        balance_after DECIMAL(10,2) NOT NULL,
        description TEXT,
        reference VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table pos_sales
    console.log('  ➜ Table pos_sales...');
    await globalPool.query(`
      CREATE TABLE IF NOT EXISTS pos_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
    `);

    // ============================================
    // Index
    // ============================================
    console.log('\n📦 Création des index...');
    
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
    
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`);
    
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_pos_sales_tenant_id ON pos_sales(tenant_id)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_pos_sales_invoice_number ON pos_sales(invoice_number)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at ON pos_sales(created_at)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_pos_sales_status ON pos_sales(status)`);
    
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`);
    await globalPool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    console.log('✅ Index créés');

    // ============================================
    // Récupérer et itérer sur les tenants
    // ============================================
    console.log('\n📊 Vérification des tenants existants...');
    
    const tenantsResult = await globalPool.query('SELECT * FROM tenants ORDER BY name');
    
    if (tenantsResult.rows.length === 0) {
      console.log('🏢 Aucun tenant trouvé. Création du tenant par défaut...');
      await globalPool.query(`
        INSERT INTO tenants (id, name, subdomain, is_active)
        VALUES (gen_random_uuid(), 'Demo Tenant', 'demo', true)
      `);
      console.log('✅ Tenant par défaut créé');
      
      const updatedTenants = await globalPool.query('SELECT * FROM tenants ORDER BY name');
      tenantsResult.rows = updatedTenants.rows;
    }

    console.log(`\n🔄 ${tenantsResult.rows.length} tenant(s) trouvé(s)`);
    console.log('============================================\n');

    // Itérer sur chaque tenant
    for (const tenant of tenantsResult.rows) {
      console.log(`📦 Tenant: ${tenant.name} (${tenant.subdomain})`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Actif: ${tenant.is_active ? '✅' : '❌'}`);
      
      // Optionnel: Créer un pool spécifique pour ce tenant
      // const tenantPool = getTenantPool(tenant.id);
      // Les migrations spécifiques au tenant ici
      
      console.log(`   ✅ OK\n`);
    }

    console.log('============================================');
    console.log(`🎉 Migration terminée ! ${tenantsResult.rows.length} tenant(s) traités.`);

  } catch (error) {
    console.error('\n❌ Erreur lors des migrations:');
    console.error(`   Message: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  } finally {
    // Fermer toutes les connexions
    await closeAllPools();
    console.log('\n🔌 Toutes les connexions à la base de données ont été fermées');
  }
}

// Exécuter la migration
migrateAllTenants();