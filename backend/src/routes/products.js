const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/product-validator');
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
            search: req.query.search,
            category: req.query.category,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            inStock: req.query.inStock === 'true' ? true :
                     req.query.inStock === 'false' ? false : null,
            limit: parseInt(req.query.limit) || 50,
            offset: req.query.offset !== undefined
                ? parseInt(req.query.offset)
                : ((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 50)
        };
        
        const [products, total] = await Promise.all([
            productService.findAll(req.tenant.id, filters),
            productService.count(req.tenant.id, filters)
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

// PATCH /api/products/:id/stock - Ajuster le stock
router.patch('/:id/stock', async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const product = await productService.updateStock(req.params.id, quantity, req.tenant.id);
        res.json({
            status: 'success',
            message: 'Stock mis a jour',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/products - Créer un produit
router.post('/', validate(createProductSchema), async (req, res, next) => {
    try {
        const product = await productService.create(req.tenant.id, req.body);
        res.status(201).json({ status: 'success', data: { product } });
    } catch (error) {
        next(error);
    }
});

// PUT /api/products/:id - Modifier un produit
router.put('/:id', validate(updateProductSchema), async (req, res, next) => {
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
