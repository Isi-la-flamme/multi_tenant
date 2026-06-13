const { globalPool } = require('../config/database');
const { cacheGet, cacheSet, cacheDelete } = require('../config/redis');
const logger = require('../utils/logger');

class TenantService {
    async findBySubdomain(subdomain) {
        // Chercher dans le cache d'abord
        const cacheKey = `tenant:${subdomain}`;
        let tenant = await cacheGet(cacheKey);
        
        if (tenant) {
            logger.debug(`Tenant "${subdomain}" trouvé dans le cache`);
            return tenant;
        }
        
        // Sinon chercher en base
        const { rows } = await globalPool.query(
            'SELECT * FROM tenants WHERE subdomain = $1 AND is_active = true',
            [subdomain]
        );
        
        if (rows.length === 0) {
            return null;
        }
        
        tenant = rows[0];
        
        // Mettre en cache pour 1 heure
        await cacheSet(cacheKey, tenant, 3600);
        logger.debug(`Tenant "${subdomain}" mis en cache`);
        
        return tenant;
    }
    
    async findById(id) {
        const { rows } = await globalPool.query(
            'SELECT * FROM tenants WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    }
    
    async create({ name, subdomain, dbSchema = null }) {
        const { rows } = await globalPool.query(
            `INSERT INTO tenants (name, subdomain, db_schema) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [name, subdomain, dbSchema]
        );
        
        logger.success(`Tenant "${name}" créé avec succès`);
        return rows[0];
    }
    
    async isUserInTenant(userId, tenantId) {
        const { rows } = await globalPool.query(
            'SELECT * FROM tenant_users WHERE user_id = $1 AND tenant_id = $2',
            [userId, tenantId]
        );
        return rows.length > 0;
    }
    
    async addUserToTenant(userId, tenantId, role = 'member') {
        const { rows } = await globalPool.query(
            `INSERT INTO tenant_users (user_id, tenant_id, role) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = $3
             RETURNING *`,
            [userId, tenantId, role]
        );
        
        logger.success(`Utilisateur ${userId} ajouté au tenant ${tenantId} comme ${role}`);
        return rows[0];
    }
}

module.exports = new TenantService();