const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { globalPool } = require('../config/database');
const logger = require('../utils/logger');
const { ValidationError, UnauthorizedError } = require('../utils/errors');

class UserService {
    
    // ============================================
    // Register
    // ============================================
    async register({ email, password, name }) {
        // 1. Vérifier si l'email existe déjà
        const existing = await globalPool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existing.rows.length > 0) {
            throw new ValidationError('Cet email est déjà utilisé');
        }
        
        // 2. Hasher le mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // 3. Créer l'utilisateur
        const { rows } = await globalPool.query(
            `INSERT INTO users (email, password_hash, name) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, name, created_at`,
            [email, passwordHash, name || email.split('@')[0]]
        );
        
        const user = rows[0];
        
        // 4. Ajouter automatiquement au tenant "demo" pour le test
        try {
            const tenantResult = await globalPool.query(
                "SELECT id FROM tenants WHERE subdomain = 'demo'"
            );
            if (tenantResult.rows.length > 0) {
                await globalPool.query(
                    `INSERT INTO tenant_users (tenant_id, user_id, role) 
                     VALUES ($1, $2, 'member')
                     ON CONFLICT DO NOTHING`,
                    [tenantResult.rows[0].id, user.id]
                );
            }
        } catch (err) {
            logger.warn('Impossible d\'ajouter au tenant demo:', err.message);
        }
        
        logger.success(`Nouvel utilisateur créé: ${email}`);
        return user;
    }
    
    // ============================================
    // Login
    // ============================================
    async login({ email, password }) {
        // 1. Trouver l'utilisateur
        const { rows } = await globalPool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        
        if (rows.length === 0) {
            throw new UnauthorizedError('Email ou mot de passe incorrect');
        }
        
        const user = rows[0];
        
        // 2. Vérifier le mot de passe
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            throw new UnauthorizedError('Email ou mot de passe incorrect');
        }
        
        // 3. Mettre à jour last_login
        await globalPool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // 4. Générer le JWT
        const token = this.generateToken(user);
        
        // 5. Récupérer les tenants de l'utilisateur
        const tenants = await this.getUserTenants(user.id);
        
        logger.success(`Utilisateur connecté: ${email}`);
        
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            tenants,
            token
        };
    }
    
    // ============================================
    // Génération de JWT
    // ============================================
    generateToken(user) {
        return jwt.sign(
            { 
                userId: user.id, 
                email: user.email 
            },
            process.env.JWT_SECRET || 'dev-secret-key-change-me',
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );
    }
    
    // ============================================
    // Récupérer les tenants d'un utilisateur
    // ============================================
    async getUserTenants(userId) {
        const { rows } = await globalPool.query(
            `SELECT t.id, t.name, t.subdomain, tu.role 
             FROM tenants t
             JOIN tenant_users tu ON t.id = tu.tenant_id
             WHERE tu.user_id = $1 AND t.is_active = true`,
            [userId]
        );
        return rows;
    }
    
    // ============================================
    // Trouver un utilisateur par ID
    // ============================================
    async findById(userId) {
        const { rows } = await globalPool.query(
            'SELECT id, email, name, created_at, last_login FROM users WHERE id = $1',
            [userId]
        );
        return rows[0] || null;
    }
}

module.exports = new UserService();