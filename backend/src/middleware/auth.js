// src/middleware/auth.js
const { verifyToken } = require('../config/jwt');
const userService = require('../services/user-service');
const tenantService = require('../services/tenant-service');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

async function authenticateUser(req, res, next) {
    try {
        // 1. Vérifier que le tenant est résolu
        if (!req.tenant || !req.tenant.id) {
            throw new UnauthorizedError('Tenant non résolu');
        }
        
        // 2. Vérifier le header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Token d\'authentification manquant');
        }
        
        const token = authHeader.split(' ')[1];
        
        // 3. Vérifier le token JWT
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token expiré');
            }
            if (err.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Token invalide');
            }
            throw new UnauthorizedError('Erreur d\'authentification');
        }
        
        // 4. Récupérer l'utilisateur
        const user = await userService.findById(decoded.userId);
        if (!user || !user.is_active) {
            throw new UnauthorizedError('Utilisateur non trouvé ou désactivé');
        }
        
        // 5. Vérifier l'appartenance au tenant
        const isMember = await tenantService.isUserInTenant(user.id, req.tenant.id);
        if (!isMember) {
            throw new ForbiddenError('Vous n\'avez pas accès à ce tenant');
        }
        
        // 6. Attacher l'utilisateur
        req.user = user;
        
        logger.debug(`✅ Utilisateur authentifié: ${user.email} | Tenant: ${req.tenant.subdomain}`);
        next();
        
    } catch (error) {
        next(error);
    }
}

async function optionalAuth(req, res, next) {
    try {
        if (!req.tenant) {
            return next();
        }
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            req.user = await userService.findById(decoded.userId);
        }
    } catch (err) {
        // Ignorer
    }
    next();
}

// ✅ Alias pour compatibilité
const auth = authenticateUser;

module.exports = { 
    authenticateUser, 
    optionalAuth,
    auth  // ✅ Exporté pour compatibilité
};