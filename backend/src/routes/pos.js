// src/routes/pos.js
const express = require('express');
const router = express.Router();
// ❌ Plus besoin d'importer auth ici, car c'est fait dans index.js
const { validate } = require('../middleware/validate');
const posService = require('../services/pos-service');

// ✅ Plus de router.use(auth) - L'authentification est gérée par index.js

// ============================================
// Routes POS
// ============================================

// GET /api/pos/test - Route de test
router.get('/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'POS API is running!',
        user: req.user ? { id: req.user.id, email: req.user.email } : null,
        tenant: req.tenant ? { id: req.tenant.id, name: req.tenant.name } : null
    });
});

// GET /api/pos/products - Liste des produits
router.get('/products', async (req, res, next) => {
    try {
        const { search, category, limit = 100 } = req.query;
        const products = await posService.getProducts(
            req.tenant.id,
            search,
            category,
            parseInt(limit)
        );
        res.json({
            status: 'success',
            data: products,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/pos/products/barcode/:barcode
router.get('/products/barcode/:barcode', async (req, res, next) => {
    try {
        const product = await posService.getProductByBarcode(
            req.tenant.id,
            req.params.barcode
        );
        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Produit non trouvé',
            });
        }
        res.json({
            status: 'success',
            data: product,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/pos/cart - Créer un panier
router.post('/cart', async (req, res, next) => {
    try {
        const cart = await posService.createCart(req.tenant.id);
        res.status(201).json({
            status: 'success',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/pos/cart/:cartId - Récupérer un panier
router.get('/cart/:cartId', async (req, res, next) => {
    try {
        const cart = await posService.getCart(req.tenant.id, req.params.cartId);
        if (!cart) {
            return res.status(404).json({
                status: 'error',
                message: 'Panier non trouvé',
            });
        }
        res.json({
            status: 'success',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/pos/cart/:cartId/items - Ajouter au panier
router.post('/cart/:cartId/items', async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const cart = await posService.addToCart(
            req.tenant.id,
            req.params.cartId,
            productId,
            quantity
        );
        res.json({
            status: 'success',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/pos/cart/:cartId/items/:itemId - Modifier quantité
router.put('/cart/:cartId/items/:itemId', async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const cart = await posService.updateCartItem(
            req.tenant.id,
            req.params.cartId,
            req.params.itemId,
            quantity
        );
        res.json({
            status: 'success',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/pos/cart/:cartId/items/:itemId - Supprimer un article
router.delete('/cart/:cartId/items/:itemId', async (req, res, next) => {
    try {
        const cart = await posService.removeFromCart(
            req.tenant.id,
            req.params.cartId,
            req.params.itemId
        );
        res.json({
            status: 'success',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/pos/cart/:cartId - Vider le panier
router.delete('/cart/:cartId', async (req, res, next) => {
    try {
        const cart = await posService.clearCart(
            req.tenant.id,
            req.params.cartId
        );
        res.json({
            status: 'success',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/pos/checkout - Finaliser la vente
router.post('/checkout', async (req, res, next) => {
    try {
        const sale = await posService.checkout(
            req.tenant.id,
            req.user.id,
            req.user.name,
            req.body
        );
        res.status(201).json({
            status: 'success',
            data: sale,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/pos/sales - Historique des ventes
router.get('/sales', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, startDate, endDate } = req.query;
        const sales = await posService.getSales(
            req.tenant.id,
            parseInt(page),
            parseInt(limit),
            startDate,
            endDate
        );
        res.json({
            status: 'success',
            data: sales,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/pos/sales/:id - Détail d'une vente
router.get('/sales/:id', async (req, res, next) => {
    try {
        const sale = await posService.getSale(req.tenant.id, req.params.id);
        if (!sale) {
            return res.status(404).json({
                status: 'error',
                message: 'Vente non trouvée',
            });
        }
        res.json({
            status: 'success',
            data: sale,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/pos/sales/:id/refund - Rembourser une vente
router.post('/sales/:id/refund', async (req, res, next) => {
    try {
        const { reason } = req.body;
        const sale = await posService.refundSale(
            req.tenant.id,
            req.params.id,
            reason
        );
        res.json({
            status: 'success',
            data: sale,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/pos/stats - Statistiques
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await posService.getStats(req.tenant.id);
        res.json({
            status: 'success',
            data: stats,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;