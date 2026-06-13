const express = require('express');
const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' });
        }
        
        res.status(201).json({
            status: 'success',
            message: 'Utilisateur créé avec succès',
            data: {
                user: {
                    id: 'user-' + Date.now(),
                    email,
                    name: name || email.split('@')[0]
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: 'user-' + Date.now(), email },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '24h' }
        );
        
        res.json({
            status: 'success',
            data: {
                user: { id: 'user-1', email },
                token
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;