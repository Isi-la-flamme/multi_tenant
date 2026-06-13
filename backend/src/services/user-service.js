const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { globalPool } = require('../config/database');
const logger = require('../utils/logger');
const { ValidationError, UnauthorizedError, NotFoundError, ForbiddenError } = require('../utils/errors');

class UserService {
    
    // ============================================
    // AUTH - Register
    // ============================================
    async register({ email, password, name, tenantSubdomain = 'demo' }) {
        // Vérifier si l'email existe déjà
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
            [email, passwordHash, name || email.split('@')[0]]
        );
        
        const user = rows[0];
        
        // Ajouter au tenant spécifié
        try {
            const tenantResult = await globalPool.query(
                'SELECT id FROM tenants WHERE subdomain = $1',
                [tenantSubdomain]
            );
            if (tenantResult.rows.length > 0) {
                await globalPool.query(
                    `INSERT INTO profiles (user_id, tenant_id, role) 
                     VALUES ($1, $2, 'member')
                     ON CONFLICT DO NOTHING`,
                    [user.id, tenantResult.rows[0].id]
                );
            }
        } catch (err) {
            logger.warn('Impossible d\'ajouter au tenant:', err.message);
        }
        
        logger.success(`Nouvel utilisateur créé: ${email}`);
        return user;
    }
    
    // ============================================
    // AUTH - Login
    // ============================================
    async login({ email, password }) {
        const { rows } = await globalPool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        
        if (rows.length === 0) {
            throw new UnauthorizedError('Email ou mot de passe incorrect');
        }
        
        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            throw new UnauthorizedError('Email ou mot de passe incorrect');
        }
        
        await globalPool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        const token = this.generateToken(user);
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
    // JWT
    // ============================================
    generateToken(user) {
        return jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'dev-secret-key-change-me',
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );
    }
    
    // ============================================
    // TENANTS DE L'UTILISATEUR
    // ============================================
    async getUserTenants(userId) {
        const { rows } = await globalPool.query(
            `SELECT t.id, t.name, t.subdomain, p.role 
             FROM tenants t
             JOIN profiles p ON t.id = p.tenant_id
             WHERE p.user_id = $1 AND t.is_active = true AND p.is_active = true`,
            [userId]
        );
        return rows;
    }
    
    // ============================================
    // PROFILS (CRUD par tenant)
    // ============================================
    
    // Lister les utilisateurs d'un tenant
    async findAllByTenant(tenantId, filters = {}) {
        let query = `
            SELECT u.id, u.email, u.name, p.role, p.phone, p.avatar_url, p.is_active, p.created_at
            FROM users u
            JOIN profiles p ON u.id = p.user_id
            WHERE p.tenant_id = $1
        `;
        const params = [tenantId];
        let paramCount = 1;
        
        if (filters.role) {
            paramCount++;
            query += ` AND p.role = $${paramCount}`;
            params.push(filters.role);
        }
        
        if (filters.isActive !== undefined) {
            paramCount++;
            query += ` AND p.is_active = $${paramCount}`;
            params.push(filters.isActive);
        }
        
        if (filters.search) {
            paramCount++;
            query += ` AND (u.email ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
        }
        
        query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(filters.limit || 50, filters.offset || 0);
        
        const { rows } = await globalPool.query(query, params);
        return rows;
    }
    
    // Voir un profil utilisateur dans un tenant
    async findProfileByTenant(userId, tenantId) {
        const { rows } = await globalPool.query(
            `SELECT u.id, u.email, u.name, p.role, p.phone, p.avatar_url, p.metadata, p.is_active, p.created_at, p.updated_at
             FROM users u
             JOIN profiles p ON u.id = p.user_id
             WHERE u.id = $1 AND p.tenant_id = $2`,
            [userId, tenantId]
        );
        
        if (rows.length === 0) {
            throw new NotFoundError('Utilisateur non trouvé dans ce tenant');
        }
        
        return rows[0];
    }
    
    // Ajouter un utilisateur existant à un tenant
    async addUserToTenant(email, tenantId, role = 'member') {
        // Trouver l'utilisateur par email
        const userResult = await globalPool.query(
            'SELECT id, email, name FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new NotFoundError('Utilisateur non trouvé avec cet email');
        }
        
        const user = userResult.rows[0];
        
        // Vérifier s'il est déjà dans le tenant
        const existingProfile = await globalPool.query(
            'SELECT id FROM profiles WHERE user_id = $1 AND tenant_id = $2',
            [user.id, tenantId]
        );
        
        if (existingProfile.rows.length > 0) {
            throw new ValidationError('Cet utilisateur est déjà dans ce tenant');
        }
        
        // Ajouter le profil
        const { rows } = await globalPool.query(
            `INSERT INTO profiles (user_id, tenant_id, role) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [user.id, tenantId, role]
        );
        
        logger.tenant(tenantId, `Utilisateur ajouté: ${email} comme ${role}`);
        return {
            user: { id: user.id, email: user.email, name: user.name },
            profile: rows[0]
        };
    }
    
    // Mettre à jour le rôle d'un utilisateur dans un tenant
    async updateProfile(userId, tenantId, data) {
        const profile = await this.findProfileByTenant(userId, tenantId);
        
        const { role, phone, avatarUrl, metadata, isActive } = data;
        
        const { rows } = await globalPool.query(
            `UPDATE profiles 
             SET role = COALESCE($1, role),
                 phone = COALESCE($2, phone),
                 avatar_url = COALESCE($3, avatar_url),
                 metadata = COALESCE($4, metadata),
                 is_active = COALESCE($5, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $6 AND tenant_id = $7
             RETURNING *`,
            [role || null, phone || null, avatarUrl || null, 
             metadata ? JSON.stringify(metadata) : null, 
             isActive ?? null, userId, tenantId]
        );
        
        logger.tenant(tenantId, `Profil mis à jour: ${profile.email}`);
        return rows[0];
    }
    
    // Désactiver un utilisateur d'un tenant
    async removeUserFromTenant(userId, tenantId) {
        const profile = await this.findProfileByTenant(userId, tenantId);
        
        await globalPool.query(
            `UPDATE profiles SET is_active = false, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $1 AND tenant_id = $2`,
            [userId, tenantId]
        );
        
        logger.tenant(tenantId, `Utilisateur désactivé: ${profile.email}`);
        return { message: 'Utilisateur retiré du tenant avec succès' };
    }
    
    // Réactiver un utilisateur
    async reactivateUser(userId, tenantId) {
        await globalPool.query(
            `UPDATE profiles SET is_active = true, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $1 AND tenant_id = $2`,
            [userId, tenantId]
        );
        
        return { message: 'Utilisateur réactivé avec succès' };
    }
    
    // ============================================
    // UTILITAIRES
    // ============================================
    
    async findById(userId) {
        const { rows } = await globalPool.query(
            'SELECT id, email, name, created_at, last_login FROM users WHERE id = $1',
            [userId]
        );
        return rows[0] || null;
    }
    
    async countByTenant(tenantId, filters = {}) {
        let query = `
            SELECT COUNT(*) 
            FROM users u
            JOIN profiles p ON u.id = p.user_id
            WHERE p.tenant_id = $1
        `;
        const params = [tenantId];
        
        if (filters.role) {
            query += ` AND p.role = $2`;
            params.push(filters.role);
        }
        
        if (filters.isActive !== undefined) {
            query += ` AND p.is_active = $${params.length + 1}`;
            params.push(filters.isActive);
        }
        
        const { rows } = await globalPool.query(query, params);
        return parseInt(rows[0].count);
    }
}

module.exports = new UserService();