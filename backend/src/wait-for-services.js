const { createClient } = require('redis');
const { Pool } = require('pg');

async function waitForPostgres(retries = 10, delay = 2000) {
    const pool = new Pool({
        host: process.env.DB_HOST || 'postgres',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'secret',
        database: process.env.DB_NAME || 'multitenant_db',
        connectionTimeoutMillis: 3000
    });

    for (let i = 0; i < retries; i++) {
        try {
            await pool.query('SELECT 1');
            console.log('✅ PostgreSQL est prêt');
            await pool.end();
            return true;
        } catch (err) {
            console.log(`⏳ Attente PostgreSQL... (${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('PostgreSQL non disponible après plusieurs tentatives');
}

async function waitForRedis(retries = 10, delay = 2000) {
    const client = createClient({ 
        url: process.env.REDIS_URL || 'redis://redis:6379' 
    });

    for (let i = 0; i < retries; i++) {
        try {
            await client.connect();
            await client.ping();
            console.log('✅ Redis est prêt');
            await client.quit();
            return true;
        } catch (err) {
            console.log(`⏳ Attente Redis... (${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Redis non disponible après plusieurs tentatives');
}

async function waitForServices() {
    try {
        await Promise.all([waitForPostgres(), waitForRedis()]);
        console.log('🚀 Tous les services sont prêts, démarrage de l\'API...');
    } catch (error) {
        console.error('Erreur fatale:', error.message);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    waitForServices();
}

module.exports = { waitForServices };