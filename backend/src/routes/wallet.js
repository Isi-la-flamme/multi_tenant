const express = require('express');
const router = express.Router();
const walletService = require('../services/wallet-service');
const userService = require('../services/user-service');
const { authenticateUser } = require('../middleware/auth');
const { ForbiddenError } = require('../utils/errors');

// ⚠️ TOUTES les routes nécessitent authentification ET tenant
router.use(authenticateUser);

// GET /api/wallet/balance
router.get('/balance', async (req, res, next) => {
    try {
        // Vérifier que req.tenant existe
        if (!req.tenant || !req.tenant.id) {
            return res.status(401).json({ status: 'fail', message: 'Tenant non résolu' });
        }
        
        const balance = await walletService.getBalance(req.user.id, req.tenant.id);
        res.json({ status: 'success', data: balance });
    } catch (error) {
        next(error);
    }
});

// GET /api/wallet/transactions
router.get('/transactions', async (req, res, next) => {
    try {
        if (!req.tenant || !req.tenant.id) {
            return res.status(401).json({ status: 'fail', message: 'Tenant non résolu' });
        }
        
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const transactions = await walletService.getTransactions(
            req.user.id,
            req.tenant.id,
            limit,
            offset
        );
        
        res.json({ status: 'success', data: transactions });
    } catch (error) {
        next(error);
    }
});

// POST /api/wallet/credit
router.post('/credit', async (req, res, next) => {
    try {
        if (!req.tenant || !req.tenant.id) {
            return res.status(401).json({ status: 'fail', message: 'Tenant non résolu' });
        }
        
        const profile = await userService.findProfileByTenant(req.user.id, req.tenant.id);
        if (!['admin', 'manager'].includes(profile.role)) {
            throw new ForbiddenError('Droits admin requis');
        }
        
        const { userId, amount, description } = req.body;
        
        const result = await walletService.credit(
            userId,
            req.tenant.id,
            amount,
            description || 'Crédit manuel',
            { source: 'admin_credit' },
            req.user.id
        );
        
        res.json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
});

// POST /api/wallet/debit
router.post('/debit', async (req, res, next) => {
    try {
        if (!req.tenant || !req.tenant.id) {
            return res.status(401).json({ status: 'fail', message: 'Tenant non résolu' });
        }
        
        const profile = await userService.findProfileByTenant(req.user.id, req.tenant.id);
        if (!['admin', 'manager'].includes(profile.role)) {
            throw new ForbiddenError('Droits admin requis');
        }
        
        const { userId, amount, description } = req.body;
        
        const result = await walletService.debit(
            userId,
            req.tenant.id,
            amount,
            description || 'Débit manuel',
            { source: 'admin_debit' },
            req.user.id
        );
        
        res.json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
});

module.exports = router;