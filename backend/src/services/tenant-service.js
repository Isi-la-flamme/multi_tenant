const { globalPool } = require('../config/database');
const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../utils/logger');

class TenantService {
    async findBySubdomain(subdomain) {
        const cacheKey = `tenant:${subdomain}`;
        let tenant = null;
        
        try {
            tenant = await cacheGet(cacheKey);
        } catch (err) {
            // Redis non disponible
        }
        
        if (tenant) {
            return tenant;
        }
        
        const { rows } = await globalPool.query(
            'SELECT * FROM tenants WHERE subdomain = $1 AND is_active = true',
            [subdomain]
        );
        
        if (rows.length === 0) {
            return null;
        }
        
        tenant = rows[0];
        
        try {
            await cacheSet(cacheKey, tenant, 3600);
        } catch (err) {
            // Redis non disponible
        }
        
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
            'SELECT id FROM profiles WHERE user_id = $1 AND tenant_id = $2 AND is_active = true',
            [userId, tenantId]
        );
        return rows.length > 0;
    }
    
    async addUserToTenant(userId, tenantId, role = 'member') {
        const { rows } = await globalPool.query(
            `INSERT INTO profiles (user_id, tenant_id, role, is_active) 
             VALUES ($1, $2, $3, true) 
             ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = $3, is_active = true
             RETURNING *`,
            [userId, tenantId, role]
        );
        
        logger.success(`Utilisateur ${userId} ajouté au tenant ${tenantId} comme ${role}`);
        return rows[0];
    }
}

module.exports = new TenantService();