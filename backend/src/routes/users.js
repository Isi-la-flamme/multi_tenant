const express = require('express');
const router = express.Router();
const userService = require('../services/user-service');
const { authenticateUser } = require('../middleware/auth');
const { ValidationError, ForbiddenError } = require('../utils/errors');

// Middleware : seuls les admins/managers peuvent gérer les utilisateurs
async function requireAdmin(req, res, next) {
    try {
        const profile = await userService.findProfileByTenant(req.user.id, req.tenant.id);
        
        if (!profile) {
            throw new ForbiddenError('Vous n\'appartenez pas à ce tenant');
        }
        
        if (!['admin', 'manager'].includes(profile.role)) {
            throw new ForbiddenError('Droits admin/manager requis');
        }
        
        req.userProfile = profile;
        next();
    } catch (error) {
        next(error);
    }
}

// Toutes les routes nécessitent une authentification
router.use(authenticateUser);

// GET /api/users - Liste des utilisateurs du tenant
router.get('/', async (req, res, next) => {
    try {
        const filters = {
            role: req.query.role,
            isActive: req.query.active === 'true' ? true : 
                     req.query.active === 'false' ? false : undefined,
            search: req.query.search,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        
        const [users, total] = await Promise.all([
            userService.findAllByTenant(req.tenant.id, filters),
            userService.countByTenant(req.tenant.id, filters)
        ]);
        
        res.json({
            status: 'success',
            data: {
                users,
                pagination: { total, limit: filters.limit, offset: filters.offset }
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/users/:userId - Profil d'un utilisateur dans le tenant
router.get('/:userId', async (req, res, next) => {
    try {
        const user = await userService.findProfileByTenant(req.params.userId, req.tenant.id);
        res.json({ status: 'success', data: { user } });
    } catch (error) {
        next(error);
    }
});

// POST /api/users/invite - Ajouter un utilisateur au tenant
router.post('/invite', requireAdmin, async (req, res, next) => {
    try {
        const { email, role } = req.body;
        
        if (!email) {
            throw new ValidationError('Email requis');
        }
        
        const result = await userService.addUserToTenant(email, req.tenant.id, role || 'member');
        
        res.status(201).json({
            status: 'success',
            message: 'Utilisateur ajouté au tenant',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/:userId - Modifier le profil dans le tenant
router.put('/:userId', requireAdmin, async (req, res, next) => {
    try {
        const { role, phone, avatarUrl, metadata, isActive } = req.body;
        
        // Un admin ne peut pas se rétrograder lui-même
        if (req.params.userId === req.user.id && role && role !== 'admin') {
            throw new ValidationError('Vous ne pouvez pas modifier votre propre rôle admin');
        }
        
        const profile = await userService.updateProfile(
            req.params.userId, 
            req.tenant.id, 
            { role, phone, avatarUrl, metadata, isActive }
        );
        
        res.json({
            status: 'success',
            message: 'Profil mis à jour',
            data: { profile }
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/users/:userId - Retirer un utilisateur du tenant
router.delete('/:userId', requireAdmin, async (req, res, next) => {
    try {
        // Empêcher de se retirer soi-même
        if (req.params.userId === req.user.id) {
            throw new ValidationError('Vous ne pouvez pas vous retirer vous-même du tenant');
        }
        
        const result = await userService.removeUserFromTenant(req.params.userId, req.tenant.id);
        res.json({ status: 'success', message: result.message });
    } catch (error) {
        next(error);
    }
});

// POST /api/users/:userId/reactivate - Réactiver un utilisateur
router.post('/:userId/reactivate', requireAdmin, async (req, res, next) => {
    try {
        const result = await userService.reactivateUser(req.params.userId, req.tenant.id);
        res.json({ status: 'success', message: result.message });
    } catch (error) {
        next(error);
    }
});

module.exports = router;