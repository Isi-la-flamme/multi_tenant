const { createClient } = require('redis');
const { Pool } = require('pg');

// Pool global pour la DB "public" (gestion des tenants)
const globalPool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME || 'multitenant_db',
    max: 10
});

// Cache Redis
const redis = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
redis.connect().catch(err => console.warn('⚠️ Redis non connecté:', err.message));

// Cache des pools par tenant
const tenantPools = new Map();

async function tenantResolver(req, res, next) {
    try {
        // 1. Déterminer le sous-domaine de plusieurs sources
        let subdomain = null;
        
        // Priorité 1: Header personnalisé X-Tenant-Subdomain
        if (req.headers['x-tenant-subdomain']) {
            subdomain = req.headers['x-tenant-subdomain'];
            console.log('📋 Tenant depuis header X-Tenant-Subdomain:', subdomain);
        }
        // Priorité 2: Sous-domaine du Host
        else if (req.headers['host']) {
            const host = req.headers['host'].split(':')[0]; // Enlever le port
            const parts = host.split('.');
            
            // Si c'est un sous-domaine (plus de 2 parties)
            if (parts.length > 2) {
                subdomain = parts[0];
                console.log('🌐 Tenant depuis sous-domaine:', subdomain);
            }
            // Si c'est localhost ou une IP
            else if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
                subdomain = 'demo';
                console.log('💻 Développement local, tenant par défaut:', subdomain);
            }
        }
        
        // Fallback final
        if (!subdomain) {
            subdomain = 'demo';
            console.log('⚠️ Aucun tenant détecté, fallback vers:', subdomain);
        }
        
        // Nettoyer le sous-domaine
        subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

        // 2. Chercher dans le cache Redis
        let tenant = null;
        const cacheKey = `tenant:${subdomain}`;
        
        try {
            const cachedTenant = await redis.get(cacheKey);
            if (cachedTenant) {
                tenant = JSON.parse(cachedTenant);
                console.log('📦 Tenant trouvé dans le cache Redis');
            }
        } catch (err) {
            console.warn('⚠️ Erreur Redis, recherche dans PostgreSQL...');
        }

        // 3. Si pas dans le cache, chercher dans PostgreSQL
        if (!tenant) {
            try {
                const { rows } = await globalPool.query(
                    'SELECT * FROM tenants WHERE subdomain = $1 AND is_active = true',
                    [subdomain]
                );
                
                if (rows.length > 0) {
                    tenant = rows[0];
                    console.log('🗄️ Tenant trouvé dans PostgreSQL');
                    
                    // Mettre en cache pour 1 heure
                    try {
                        await redis.setEx(cacheKey, 3600, JSON.stringify(tenant));
                    } catch (err) {
                        console.warn('⚠️ Impossible de mettre en cache Redis');
                    }
                }
            } catch (err) {
                console.error('❌ Erreur PostgreSQL:', err.message);
            }
        }

        // 4. Si tenant non trouvé, utiliser un fallback
        if (!tenant) {
            console.warn(`⚠️ Tenant "${subdomain}" non trouvé en base`);
            
            // En développement, on crée un tenant virtuel
            if (process.env.NODE_ENV !== 'production') {
                tenant = {
                    id: '00000000-0000-0000-0000-000000000000',
                    name: `Tenant ${subdomain} (virtuel)`,
                    subdomain: subdomain,
                    is_active: true
                };
                console.log('🔧 Tenant virtuel créé pour le développement');
            } else {
                return res.status(404).json({ 
                    error: 'Tenant non trouvé',
                    subdomain: subdomain 
                });
            }
        }

        // 5. Établir la connexion DB du tenant (si nécessaire)
        if (!tenantPools.has(tenant.id)) {
            const tenantPoolConfig = {
                host: process.env.DB_HOST || 'postgres',
                port: process.env.DB_PORT || 5432,
                user: process.env.DB_USER || 'admin',
                password: process.env.DB_PASSWORD || 'secret',
                database: process.env.DB_NAME || 'multitenant_db',
                max: 5
            };
            
            // Utiliser un schéma dédié si configuré
            if (tenant.db_schema) {
                tenantPoolConfig.options = `-c search_path=${tenant.db_schema},public`;
            }
            
            const tenantPool = new Pool(tenantPoolConfig);
            tenantPools.set(tenant.id, tenantPool);
        }

        // 6. Attacher le tenant et sa connexion à la requête
        req.tenant = {
            ...tenant,
            db: tenantPools.get(tenant.id)
        };

        console.log(`✅ Tenant résolu: ${tenant.name} (${tenant.subdomain})`);
        next();
        
    } catch (error) {
        console.error('💥 Erreur critique résolution tenant:', error);
        
        // Même en cas d'erreur, on fournit un tenant par défaut
        req.tenant = {
            id: 'default',
            name: 'Default Tenant',
            subdomain: 'demo',
            is_active: true
        };
        next();
    }
}

// Nettoyage des pools à l'arrêt
process.on('SIGTERM', async () => {
    console.log('🧹 Nettoyage des connexions...');
    await globalPool.end();
    for (const pool of tenantPools.values()) {
        await pool.end();
    }
    await redis.quit();
});

module.exports = { tenantResolver, globalPool };