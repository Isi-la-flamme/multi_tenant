const { Pool } = require('pg');

// Pool global pour la gestion des tenants et utilisateurs
const globalPool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME || 'multitenant_db',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Cache des pools par tenant
const tenantPools = new Map();

function getTenantPool(tenantId, dbSchema = null) {
    if (!tenantPools.has(tenantId)) {
        const config = {
            host: process.env.DB_HOST || 'postgres',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'admin',
            password: process.env.DB_PASSWORD || 'secret',
            database: process.env.DB_NAME || 'multitenant_db',
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
        
        if (dbSchema) {
            config.options = `-c search_path=${dbSchema},public`;
        }
        
        tenantPools.set(tenantId, new Pool(config));
    }
    return tenantPools.get(tenantId);
}

async function closeAllPools() {
    await globalPool.end();
    for (const pool of tenantPools.values()) {
        await pool.end();
    }
}

module.exports = { globalPool, getTenantPool, closeAllPools };