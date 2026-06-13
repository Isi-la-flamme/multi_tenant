// backend/src/database/migrate-all-tenants.js
const tenants = await globalPool.query('SELECT * FROM tenants');
for (const tenant of tenants.rows) {
    console.log(`Migration du tenant: ${tenant.subdomain}`);
    // Appliquer les migrations
}