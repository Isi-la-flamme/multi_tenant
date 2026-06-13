const express = require('express');
const { tenantResolver } = require('./middleware/tenant-resolver');

const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// 1. Résoudre le tenant AVANT tout
app.use(tenantResolver);

// Routes
app.get('/api/health', (req, res) => {
    console.log('✅ Health check reçu');
    console.log('Tenant:', req.tenant?.subdomain || 'non défini');
    
    res.json({ 
        status: 'ok',
        tenant: req.tenant?.subdomain || 'non défini',
        timestamp: new Date().toISOString(),
        service: 'multitenant-api'
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).json({ 
        error: 'Erreur interne du serveur',
        message: err.message 
    });
});

const PORT = process.env.PORT || 3000;

// Démarrer le serveur
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API multitenant démarrée sur le port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

// Gérer l'arrêt gracieux
process.on('SIGTERM', () => {
    console.log('Signal SIGTERM reçu, arrêt gracieux...');
    server.close(() => {
        console.log('Serveur arrêté');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Signal SIGINT reçu, arrêt gracieux...');
    server.close(() => {
        console.log('Serveur arrêté');
        process.exit(0);
    });
});