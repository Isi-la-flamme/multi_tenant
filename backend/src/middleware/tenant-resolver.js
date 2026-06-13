const tenantService = require('../services/tenant-service');
const { getTenantPool } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

async function tenantResolver(req, res, next) {
    try {
        // 1. Déterminer le sous-domaine
        let subdomain = null;
        
        if (req.headers['x-tenant-subdomain']) {
            subdomain = req.headers['x-tenant-subdomain'];
        } else if (req.headers['host']) {
            const host = req.headers['host'].split(':')[0];
            const parts = host.split('.');
            
            if (parts.length > 2) {
                subdomain = parts[0];
            } else if (['localhost', '127.0.0.1'].includes(host)) {
                subdomain = process.env.DEFAULT_TENANT || 'demo';
            }
        }
        
        if (!subdomain) {
            subdomain = process.env.DEFAULT_TENANT || 'demo';
        }
        
        subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        // 2. Chercher le tenant
        let tenant = await tenantService.findBySubdomain(subdomain);
        
        // 3. En développement, créer un tenant virtuel si non trouvé
        if (!tenant) {
            if (process.env.NODE_ENV === 'development') {
                logger.warn(`Tenant "${subdomain}" non trouvé, création virtuelle`);
                tenant = {
                    id: '00000000-0000-0000-0000-000000000000',
                    name: `Tenant ${subdomain} (dev)`,
                    subdomain: subdomain,
                    is_active: true
                };
            } else {
                throw new NotFoundError(`Tenant "${subdomain}" non trouvé`);
            }
        }
        
        // 4. Attacher le tenant et sa connexion DB
        req.tenant = {
            ...tenant,
            db: getTenantPool(tenant.id, tenant.db_schema)
        };
        
        logger.tenant(subdomain, `Résolu: ${tenant.name}`);
        next();
        
    } catch (error) {
        next(error);
    }
}

module.exports = { tenantResolver };