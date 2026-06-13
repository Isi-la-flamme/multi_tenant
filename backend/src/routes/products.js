const express = require('express');
const router = express.Router();
const productService = require('../services/product-service');
const { authenticateUser } = require('../middleware/auth');
const { ValidationError } = require('../utils/errors');

// Toutes les routes produits nécessitent une authentification
router.use(authenticateUser);

// GET /api/products - Liste des produits
router.get('/', async (req, res, next) => {
    try {
        const filters = {
            isActive: req.query.active === 'true' ? true : 
                     req.query.active === 'false' ? false : null,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        
        const [products, total] = await Promise.all([
            productService.findAll(req.tenant.id, filters),
            productService.count(req.tenant.id, filters.isActive)
        ]);
        
        res.json({
            status: 'success',
            data: {
                products,
                pagination: {
                    total,
                    limit: filters.limit,
                    offset: filters.offset
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/products/:id - Détail d'un produit
router.get('/:id', async (req, res, next) => {
    try {
        const product = await productService.findById(req.params.id, req.tenant.id);
        res.json({
            status: 'success',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/products - Créer un produit
router.post('/', async (req, res, next) => {
    try {
        const product = await productService.create(req.tenant.id, req.body);
        res.status(201).json({
            status: 'success',
            message: 'Produit créé avec succès',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/products/:id - Modifier un produit
router.put('/:id', async (req, res, next) => {
    try {
        const product = await productService.update(req.params.id, req.tenant.id, req.body);
        res.json({
            status: 'success',
            message: 'Produit mis à jour',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/products/:id - Supprimer un produit (soft delete)
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await productService.delete(req.params.id, req.tenant.id);
        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;