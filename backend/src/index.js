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
const walletRoutes = require('./routes/wallet');
const posRoutes = require('./routes/pos');

const app = express();

// ============================================
// ✅ 1. CORS EN PREMIER (AVANT TOUT)
// ============================================
const corsOptions = {
    origin: function (origin, callback) {
        // Autoriser toutes les origines en développement ou les appels sans origine (ex: Postman)
        if (process.env.NODE_ENV === 'development' || !origin) {
            return callback(null, true);
        }
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://frontend:3000'
       
        ];
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'x-tenant-id',
        'x-tenant',
        'x-tenant-subdomain' // ✅ AJOUTEZ CETTE LIGNE
    ],
    exposedHeaders: ['Authorization'],
    credentials: true,
    optionsSuccessStatus: 200, // Pour la compatibilité avec les anciens navigateurs (SmartTVs, etc.)
};

// ✅ Appliquer CORS globalement
app.use(cors(corsOptions));

// ✅ (Optionnel mais recommandé) Gérer explicitement les requêtes preflight OPTIONS sur toutes les routes
app.options('*', cors(corsOptions));

// ============================================
// 2. Autres middlewares
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 3. TenantResolver (après CORS)
// ============================================
// ⚠️ tenantResolver DOIT être après CORS
app.use(tenantResolver);

// ============================================
// 4. Routes
// ============================================

// Route de santé (publique)
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

// Routes protégées
app.use('/api/products', authenticateUser, productRoutes);
app.use('/api/users', authenticateUser, userRoutes);
app.use('/api/dashboard', authenticateUser, dashboardRoutes);
app.use('/api/admin', authenticateUser, adminRoutes);
app.use('/api/upload', authenticateUser, uploadRoutes);
app.use('/api/wallet', authenticateUser, walletRoutes);
app.use('/api/credit', authenticateUser, creditClientRoutes);
app.use('/api/pos', authenticateUser, posRoutes);

// Route me
app.get('/api/me', authenticateUser, (req, res) => {
    res.json({
        status: 'success',
        data: {
            user: req.user,
            tenant: { id: req.tenant.id, name: req.tenant.name, subdomain: req.tenant.subdomain }
        }
    });
});

// ============================================
// 5. Gestion des erreurs
// ============================================

// 404
app.all('*', (req, res) => {
    res.status(404).json({ 
        status: 'fail', 
        message: `Route ${req.originalUrl} non trouvée` 
    });
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
    
    res.setHeader('Content-Type', 'application/json');
    
    if (err.isOperational) {
        return res.status(err.statusCode || 500).json({ 
            status: err.status || 'error', 
            message: err.message 
        });
    }
    
    res.status(500).json({ 
        status: 'error', 
        message: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
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