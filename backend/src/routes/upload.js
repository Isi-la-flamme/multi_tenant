const express = require('express');
const router = express.Router();
const { upload } = require('../config/upload');
const uploadService = require('../services/upload-service');
const { authenticateUser } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Toutes les routes nécessitent authentification
router.use(authenticateUser);

// POST /api/upload - Upload simple
router.post('/', (req, res, next) => {
    req.uploadType = 'all';
    
    upload.single('file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'Aucun fichier fourni' });
            }
            
            const file = await uploadService.saveFileMetadata(
                req.tenant.id,
                req.user.id,
                req.file,
                req.body.entityType || 'general',
                req.body.entityId || null
            );
            
            res.status(201).json({
                status: 'success',
                message: 'Fichier uploadé avec succès',
                data: { file }
            });
        } catch (error) {
            next(error);
        }
    });
});

// POST /api/upload/avatar - Upload avatar utilisateur
router.post('/avatar', (req, res, next) => {
    req.uploadType = 'avatar';
    
    upload.single('avatar')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'Aucune image fournie' });
            }
            
            const file = await uploadService.saveFileMetadata(
                req.tenant.id,
                req.user.id,
                req.file,
                'avatar',
                req.user.id
            );
            
            // Mettre à jour le profil utilisateur avec l'URL de l'avatar
            const avatarUrl = `/api/upload/file/${file.id}`;
            await globalPool.query(
                'UPDATE profiles SET avatar_url = $1 WHERE user_id = $2 AND tenant_id = $3',
                [avatarUrl, req.user.id, req.tenant.id]
            );
            
            res.status(201).json({
                status: 'success',
                message: 'Avatar uploadé avec succès',
                data: { file, avatarUrl }
            });
        } catch (error) {
            next(error);
        }
    });
});

// POST /api/upload/product-image/:productId - Upload image produit
router.post('/product-image/:productId', (req, res, next) => {
    req.uploadType = 'image';
    
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'Aucune image fournie' });
            }
            
            const file = await uploadService.saveFileMetadata(
                req.tenant.id,
                req.user.id,
                req.file,
                'product',
                req.params.productId
            );
            
            res.status(201).json({
                status: 'success',
                message: 'Image produit uploadée',
                data: { file }
            });
        } catch (error) {
            next(error);
        }
    });
});

// GET /api/upload - Liste des fichiers du tenant
router.get('/', async (req, res, next) => {
    try {
        const filters = {
            entityType: req.query.type,
            entityId: req.query.entityId,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        
        const files = await uploadService.getFiles(req.tenant.id, filters);
        
        res.json({
            status: 'success',
            data: { files }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/upload/file/:fileId - Télécharger un fichier
router.get('/file/:fileId', async (req, res, next) => {
    try {
        const file = await uploadService.getFileById(req.params.fileId, req.tenant.id);
        const filePath = uploadService.getFilePath(file);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ status: 'error', message: 'Fichier non trouvé sur le disque' });
        }
        
        res.setHeader('Content-Type', file.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/upload/:fileId - Supprimer un fichier
router.delete('/:fileId', async (req, res, next) => {
    try {
        const result = await uploadService.deleteFile(req.params.fileId, req.tenant.id);
        res.json({ status: 'success', message: result.message });
    } catch (error) {
        next(error);
    }
});

// Import pour la route avatar
const { globalPool } = require('../config/database');

module.exports = router;