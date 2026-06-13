const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth-validator');
const userService = require('../services/user-service');
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

module.exports = router;