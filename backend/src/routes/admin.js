const express = require('express');
const router = express.Router();
const statsService = require('../services/stats-service');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

// GET /api/admin/stats - Stats globales (tous les tenants)
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await statsService.getGlobalStats();
        res.json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;