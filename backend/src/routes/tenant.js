const express = require('express');
const router = express.Router();
const tenantService = require('../services/tenant-service');
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/tenant/current - Infos du tenant actuel
router.get('/current', async (req, res) => {
    res.json({
        status: 'success',
        data: {
            tenant: {
                id: req.tenant.id,
                name: req.tenant.name,
                subdomain: req.tenant.subdomain
            }
        }
    });
});

// POST /api/tenant/join - Rejoindre un tenant (nécessite auth)
router.post('/join', authenticateUser, async (req, res, next) => {
    try {
        const { subdomain } = req.body;
        
        const tenant = await tenantService.findBySubdomain(subdomain);
        if (!tenant) {
            return res.status(404).json({
                status: 'fail',
                message: 'Tenant non trouvé'
            });
        }
        
        await tenantService.addUserToTenant(req.user.id, tenant.id);
        
        logger.success(`${req.user.email} a rejoint le tenant ${tenant.name}`);
        
        res.json({
            status: 'success',
            message: `Vous avez rejoint ${tenant.name}`
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;