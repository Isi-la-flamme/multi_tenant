const jwt = require('jsonwebtoken');
const tenantService = require('../services/tenant-service');
const userService = require('../services/user-service');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

async function authenticateUser(req, res, next) {
    try {
        // 1. Vérifier le header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Token d\'authentification manquant');
        }
        
        // 2. Vérifier le token JWT
        const token = authHeader.split(' ')[1];
        let decoded;
        
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        } catch (err) {
            throw new UnauthorizedError('Token invalide ou expiré');
        }
        
        // 3. Récupérer l'utilisateur
        const user = await userService.findById(decoded.userId);
        if (!user) {
            throw new UnauthorizedError('Utilisateur non trouvé');
        }
        
        // 4. Vérifier que l'utilisateur appartient au tenant
        const isMember = await tenantService.isUserInTenant(user.id, req.tenant.id);
        if (!isMember && process.env.NODE_ENV === 'production') {
            throw new ForbiddenError('Vous n\'avez pas accès à ce tenant');
        }
        
        // 5. Attacher l'utilisateur à la requête
        req.user = user;
        
        logger.debug(`Utilisateur authentifié: ${user.email}`);
        next();
        
    } catch (error) {
        next(error);
    }
}

// Middleware optionnel (n'échoue pas si pas de token)
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
            req.user = await userService.findById(decoded.userId);
        }
    } catch (err) {
        // Pas d'erreur, l'utilisateur reste non authentifié
    }
    next();
}

module.exports = { authenticateUser, optionalAuth };