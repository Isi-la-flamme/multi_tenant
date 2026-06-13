require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { tenantResolver } = require('./middleware/tenant-resolver');
const logger = require('./utils/logger');
const { AppError } = require('./utils/errors');

// Routes
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenant');

const app = express();

// ============================================
// Middlewares globaux
// ============================================

// Sécurité HTTP headers
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { status: 'fail', message: 'Trop de requêtes, réessayez plus tard' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logger simple pour toutes les requêtes
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// ============================================
// Résolution du tenant
// ============================================
app.use(tenantResolver);

// ============================================
// Routes publiques
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        tenant: req.tenant?.subdomain || 'unknown',
        timestamp: new Date().toISOString(),
        service: 'multitenant-api',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// ============================================
// Routes semi-publiques (info tenant)
// ============================================
app.use('/api/tenant', tenantRoutes);

// ============================================
// Routes protégées (nécessitent authentification)
// ============================================
const { authenticateUser } = require('./middleware/auth');

app.get('/api/me', authenticateUser, (req, res) => {
    res.json({
        status: 'success',
        data: {
            user: req.user,
            tenant: {
                id: req.tenant.id,
                name: req.tenant.name,
                subdomain: req.tenant.subdomain
            }
        }
    });
});

// ============================================
// Gestion des erreurs 404
// ============================================
app.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Route ${req.originalUrl} non trouvée sur ce serveur`
    });
});

// ============================================
// Gestion globale des erreurs
// ============================================
app.use((err, req, res, next) => {
    logger.error(`${err.statusCode || 500} - ${err.message}`);
    
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    
    // Erreur de programmation
    if (process.env.NODE_ENV === 'development') {
        console.error('💥 ERREUR:', err);
        return res.status(500).json({
            status: 'error',
            message: err.message,
            stack: err.stack
        });
    }
    
    // Erreur en production (ne pas fuiter les détails)
    res.status(500).json({
        status: 'error',
        message: 'Erreur interne du serveur'
    });
});

// ============================================
// Démarrage du serveur
// ============================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    logger.success(`🚀 API démarrée sur le port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
    logger.info(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
});

// ============================================
// Arrêt gracieux
// ============================================
async function gracefulShutdown(signal) {
    logger.warn(`Signal ${signal} reçu, arrêt gracieux...`);
    
    server.close(async () => {
        logger.info('Serveur HTTP fermé');
        
        try {
            const { closeAllPools } = require('./config/database');
            await closeAllPools();
            logger.info('Connexions DB fermées');
        } catch (err) {
            logger.error('Erreur fermeture DB:', err.message);
        }
        
        process.exit(0);
    });
    
    // Force exit après 10 secondes
    setTimeout(() => {
        logger.error('Arrêt forcé après timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non catchées
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason.message);
    console.error(reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.message);
    console.error(error);
    process.exit(1);
});

module.exports = app;