// scripts/migrate-all.js
const { globalPool } = require('../src/config/database');

async function migrateAllTenants() {
    const { rows: tenants } = await globalPool.query('SELECT id, subdomain FROM tenants');
    
    for (const tenant of tenants) {
        console.log(`Migrating tenant: ${tenant.subdomain}`);
        // Exécuter les migrations pour ce tenant
        // Avec node-pg-migrate: `migrate up --database-url tenant-specific-url`
    }
}