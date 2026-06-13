const express = require('express');
const router = express.Router();
const userService = require('../services/user-service');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        
        // Validation
        if (!email || !password) {
            throw new ValidationError('Email et mot de passe requis');
        }
        
        if (!email.includes('@')) {
            throw new ValidationError('Email invalide');
        }
        
        if (password.length < 6) {
            throw new ValidationError('Le mot de passe doit contenir au moins 6 caractères');
        }
        
        const user = await userService.register({ email, password, name });
        
        logger.success(`Nouvel utilisateur enregistré: ${email}`);
        
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
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            throw new ValidationError('Email et mot de passe requis');
        }
        
        const result = await userService.login({ email, password });
        
        logger.success(`Connexion réussie: ${email}`);
        
        res.json({
            status: 'success',
            data: result
        });
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;