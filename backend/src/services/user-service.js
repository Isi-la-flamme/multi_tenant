const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { globalPool } = require('../config/database');
const logger = require('../utils/logger');
const { ValidationError, UnauthorizedError } = require('../utils/errors');

class UserService {
    async register({ email, password, name }) {
        // Vérifier si l'utilisateur existe déjà
        const existing = await globalPool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existing.rows.length > 0) {
            throw new ValidationError('Cet email est déjà utilisé');
        }
        
        // Hasher le mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Créer l'utilisateur
        const { rows } = await globalPool.query(
            `INSERT INTO users (email, password_hash, name) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, name, created_at`,
            [email, passwordHash, name]
        );
        
        logger.success(`Nouvel utilisateur créé: ${email}`);
        return rows[0];
    }
    
    async login({ email, password }) {
        // Trouver l'utilisateur
        const { rows } = await globalPool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (rows.length === 0) {
            throw new UnauthorizedError('Email ou mot de passe incorrect');
        }
        
        const user = rows[0];
        
        // Vérifier le mot de passe
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            throw new UnauthorizedError('Email ou mot de passe incorrect');
        }
        
        // Générer le JWT
        const token = this.generateToken(user);
        
        // Récupérer les tenants de l'utilisateur
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
    
    generateToken(user) {
        return jwt.sign(
            { 
                userId: user.id, 
                email: user.email 
            },
            process.env.JWT_SECRET || 'dev-secret-key',
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );
    }
    
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
    
    async findById(userId) {
        const { rows } = await globalPool.query(
            'SELECT id, email, name, created_at FROM users WHERE id = $1',
            [userId]
        );
        return rows[0] || null;
    }
}

module.exports = new UserService();