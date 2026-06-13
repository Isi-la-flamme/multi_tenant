const express = require('express');
const router = express.Router();
const statsService = require('../services/stats-service');
const { authenticateUser } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticateUser);

// GET /api/dashboard - Dashboard du tenant
router.get('/', async (req, res, next) => {
    try {
        const dashboard = await statsService.getDashboard(req.tenant.id);
        res.json({
            status: 'success',
            data: dashboard
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/dashboard/products-chart - Produits créés par jour
router.get('/products-chart', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = await statsService.getProductsCreatedByDay(req.tenant.id, days);
        res.json({
            status: 'success',
            data: { chart: data }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/dashboard/users-chart - Utilisateurs ajoutés par jour
router.get('/users-chart', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = await statsService.getUsersJoinedByDay(req.tenant.id, days);
        res.json({
            status: 'success',
            data: { chart: data }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;