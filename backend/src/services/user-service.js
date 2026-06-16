const { generateToken, generateRefreshToken } = require('../config/jwt');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
        
        // Trouver ou créer le tenant
        let tenantResult = await globalPool.query(
            'SELECT id FROM tenants WHERE subdomain = $1',
            [tenantSubdomain]
        );
        
        let tenantId;
        if (tenantResult.rows.length > 0) {
            tenantId = tenantResult.rows[0].id;
        } else if (tenantSubdomain === 'demo') {
            // Créer le tenant par défaut
            const newTenant = await globalPool.query(
                `INSERT INTO tenants (name, subdomain, is_active) 
                 VALUES ('Client Démo', 'demo', true)
                 RETURNING id`,
                []
            );
            tenantId = newTenant.rows[0].id;
        } else {
            throw new ValidationError(`Tenant "${tenantSubdomain}" n'existe pas`);
        }
        
        // Créer le profil dans la table profiles
        await globalPool.query(
            `INSERT INTO profiles (user_id, tenant_id, role, is_active) 
             VALUES ($1, $2, 'member', true)
             ON CONFLICT (user_id, tenant_id) DO NOTHING`,
            [user.id, tenantId]
        );
        
        logger.success(`Nouvel utilisateur créé: ${email} dans tenant ${tenantSubdomain}`);
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
        
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshTokenForUser(user);
        const tenants = await this.getUserTenants(user.id);
        
        // Stocker le refresh token
        await this.storeRefreshToken(user.id, refreshToken);
        
        logger.success(`Utilisateur connecté: ${email}`);
        
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            tenants,
            accessToken,
            refreshToken
        };
    }
    
    // ============================================
    // REFRESH TOKEN
    // ============================================
    async storeRefreshToken(userId, token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        // Révoquer les anciens tokens
        await globalPool.query(
            `UPDATE refresh_tokens SET revoked = true 
             WHERE user_id = $1 AND revoked = false`,
            [userId]
        );
        
        // Insérer le nouveau token
        await globalPool.query(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked) 
             VALUES ($1, $2, $3, false)`,
            [userId, tokenHash, expiresAt]
        );
    }
    
    async verifyRefreshToken(token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        const { rows } = await globalPool.query(
            `SELECT * FROM refresh_tokens 
             WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
            [tokenHash]
        );
        
        if (rows.length === 0) {
            throw new UnauthorizedError('Refresh token invalide ou expiré');
        }
        
        return rows[0];
    }
    
    async revokeRefreshToken(token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        await globalPool.query(
            `UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`,
            [tokenHash]
        );
    }
    
    async revokeAllUserRefreshTokens(userId) {
        await globalPool.query(
            `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`,
            [userId]
        );
    }
    
    async refreshAccessToken(refreshToken) {
        const tokenRecord = await this.verifyRefreshToken(refreshToken);
        const user = await this.findById(tokenRecord.user_id);
        
        if (!user || !user.is_active) {
            throw new UnauthorizedError('Utilisateur non trouvé ou désactivé');
        }
        
        const newAccessToken = this.generateAccessToken(user);
        
        return { accessToken: newAccessToken };
    }
    
    // ============================================
    // JWT
    // ============================================
    generateAccessToken(user) {
        return generateToken({ userId: user.id, email: user.email });
    }

    generateRefreshTokenForUser(user) {
        return generateRefreshToken({ userId: user.id, email: user.email, type: 'refresh' });
    }
    
    // ============================================
    // TENANTS DE L'UTILISATEUR (via profiles)
    // ============================================
    async getUserTenants(userId) {
        const { rows } = await globalPool.query(
            `SELECT t.id, t.name, t.subdomain, p.role, p.is_active
             FROM tenants t
             JOIN profiles p ON t.id = p.tenant_id
             WHERE p.user_id = $1 AND t.is_active = true AND p.is_active = true`,
            [userId]
        );
        return rows;
    }
    
    // ============================================
    // PROFILS (CRUD via profiles)
    // ============================================
    
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
    
    async findProfileByTenant(userId, tenantId) {
        const { rows } = await globalPool.query(
            `SELECT u.id, u.email, u.name, p.role, p.phone, p.avatar_url, p.metadata, p.is_active, p.created_at, p.updated_at
             FROM users u
             JOIN profiles p ON u.id = p.user_id
             WHERE u.id = $1 AND p.tenant_id = $2 AND p.is_active = true`,
            [userId, tenantId]
        );
        
        if (rows.length === 0) {
            throw new NotFoundError('Utilisateur non trouvé dans ce tenant');
        }
        
        return rows[0];
    }
    
    async addUserToTenant(email, tenantId, role = 'member') {
        // Trouver l'utilisateur
        const userResult = await globalPool.query(
            'SELECT id, email, name FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            throw new NotFoundError('Utilisateur non trouvé avec cet email');
        }
        
        const user = userResult.rows[0];
        
        // Vérifier s'il existe déjà
        const existingProfile = await globalPool.query(
            'SELECT id FROM profiles WHERE user_id = $1 AND tenant_id = $2',
            [user.id, tenantId]
        );
        
        if (existingProfile.rows.length > 0) {
            // Réactiver si désactivé
            await globalPool.query(
                `UPDATE profiles SET is_active = true, role = $1 
                 WHERE user_id = $2 AND tenant_id = $3`,
                [role, user.id, tenantId]
            );
        } else {
            // Créer le profil
            await globalPool.query(
                `INSERT INTO profiles (user_id, tenant_id, role, is_active) 
                 VALUES ($1, $2, $3, true)`,
                [user.id, tenantId, role]
            );
        }
        
        logger.tenant(tenantId, `Utilisateur ajouté: ${email} comme ${role}`);
        return { user: { id: user.id, email: user.email, name: user.name } };
    }
    
    async updateProfile(userId, tenantId, data) {
        await this.findProfileByTenant(userId, tenantId);
        
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
        
        logger.tenant(tenantId, `Profil mis à jour pour utilisateur ${userId}`);
        return rows[0];
    }
    
    async removeUserFromTenant(userId, tenantId) {
        await this.findProfileByTenant(userId, tenantId);
        
        await globalPool.query(
            `UPDATE profiles SET is_active = false, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $1 AND tenant_id = $2`,
            [userId, tenantId]
        );
        
        logger.tenant(tenantId, `Utilisateur ${userId} désactivé du tenant`);
        return { message: 'Utilisateur retiré du tenant avec succès' };
    }
    
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
            'SELECT id, email, name, created_at, last_login, is_active FROM users WHERE id = $1',
            [userId]
        );
        return rows[0] || null;
    }
    
    async countByTenant(tenantId, filters = {}) {
        let query = `
            SELECT COUNT(*) 
            FROM profiles p
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
    
    async isUserInTenant(userId, tenantId) {
        const { rows } = await globalPool.query(
            `SELECT id FROM profiles 
             WHERE user_id = $1 AND tenant_id = $2 AND is_active = true`,
            [userId, tenantId]
        );
        return rows.length > 0;
    }
}

module.exports = new UserService();