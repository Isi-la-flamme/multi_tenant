const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../validators/auth-validator');
const userService = require('../services/user-service');
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
        const user = await userService.register(req.body);
        logger.success(`Nouvel utilisateur enregistré: ${req.body.email}`);
        res.status(201).json({
            status: 'success',
            message: 'Utilisateur créé avec succès',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const result = await userService.login(req.body);
        logger.success(`Connexion réussie: ${req.body.email}`);
        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/refresh - Rafraîchir le token
router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await userService.refreshAccessToken(refreshToken);
        
        logger.info(`Token rafraîchi pour utilisateur`);
        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout - Déconnexion (session unique)
router.post('/logout', authenticateUser, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            await userService.revokeRefreshToken(refreshToken);
        }
        
        logger.success(`Déconnexion: ${req.user.email}`);
        res.json({
            status: 'success',
            message: 'Déconnecté avec succès'
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout-all - Déconnexion de tous les appareils
router.post('/logout-all', authenticateUser, async (req, res, next) => {
    try {
        await userService.revokeAllUserRefreshTokens(req.user.id);
        
        logger.success(`Déconnexion globale: ${req.user.email}`);
        res.json({
            status: 'success',
            message: 'Déconnecté de tous les appareils'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;