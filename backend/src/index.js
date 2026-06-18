require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { tenantResolver } = require('./middleware/tenant-resolver');
const { authenticateUser } = require('./middleware/auth');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenant');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const creditClientRoutes = require('./routes/credit-client');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const walletRoutes = require('./routes/wallet');  // ← À ajouter

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ⚠️ CRITICAL: tenantResolver DOIT être AVANT toutes les routes
app.use(tenantResolver);

// Routes publiques
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        tenant: req.tenant?.subdomain || 'unknown',
        timestamp: new Date().toISOString()
    });
});

// Routes d'auth (publiques)
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);

// Routes protégées (nécessitent authentification)
app.use('/api/products', authenticateUser, productRoutes);
app.use('/api/users', authenticateUser, userRoutes);
app.use('/api/dashboard', authenticateUser, dashboardRoutes);
app.use('/api/admin', authenticateUser, adminRoutes);
app.use('/api/upload', authenticateUser, uploadRoutes);
app.use('/api/wallet', authenticateUser, walletRoutes);  // ← Ajouter avec authenticateUser
app.use('/api/credit', authenticateUser, creditClientRoutes);  // ← Ajouter avec authenticateUser
// Route protégée simple
app.get('/api/me', authenticateUser, (req, res) => {
    res.json({
        status: 'success',
        data: {
            user: req.user,
            tenant: { id: req.tenant.id, name: req.tenant.name, subdomain: req.tenant.subdomain }
        }
    });
});

// 404
app.all('*', (req, res) => {
    res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} non trouvée` });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('🚨 Error handler caught:', {
        message: err.message,
        statusCode: err.statusCode,
        isOperational: err.isOperational,
        stack: err.stack?.split('\n')[0]
    });
    
    logger.error(`${err.statusCode || 500} - ${err.message}`);
    
    // Set content-type explicitly
    res.setHeader('Content-Type', 'application/json');
    
    if (err.isOperational) {
        return res.status(err.statusCode).json({ 
            status: err.status, 
            message: err.message 
        });
    }
    
    res.status(500).json({ 
        status: 'error', 
        message: 'Erreur interne du serveur',
        details: err.message
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API démarrée sur le port ${PORT}`);
});

// Arrêt gracieux...
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function gracefulShutdown(signal) {
    logger.warn(`Signal ${signal} reçu, arrêt gracieux...`);
    server.close(async () => {
        const { closeAllPools } = require('./config/database');
        await closeAllPools();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
}

module.exports = app;