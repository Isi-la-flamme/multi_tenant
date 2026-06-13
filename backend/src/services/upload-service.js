const fs = require('fs');
const path = require('path');
const { globalPool } = require('../config/database');
const { UPLOADS_ROOT } = require('../config/upload');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class UploadService {
    
    // Sauvegarder les métadonnées d'un fichier
    async saveFileMetadata(tenantId, userId, file, entityType = 'general', entityId = null) {
        const { rows } = await globalPool.query(
            `INSERT INTO files (tenant_id, user_id, filename, original_name, 
             mimetype, size, path, entity_type, entity_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                tenantId,
                userId,
                file.filename,
                file.originalname,
                file.mimetype,
                file.size,
                file.path,
                entityType,
                entityId
            ]
        );
        
        logger.tenant(tenantId, `Fichier uploadé: ${file.originalname}`);
        return rows[0];
    }
    
    // Récupérer les fichiers d'un tenant
    async getFiles(tenantId, filters = {}) {
        let query = 'SELECT * FROM files WHERE tenant_id = $1';
        const params = [tenantId];
        let paramCount = 1;
        
        if (filters.entityType) {
            paramCount++;
            query += ` AND entity_type = $${paramCount}`;
            params.push(filters.entityType);
        }
        
        if (filters.entityId) {
            paramCount++;
            query += ` AND entity_id = $${paramCount}`;
            params.push(filters.entityId);
        }
        
        query += ' ORDER BY created_at DESC LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
        params.push(filters.limit || 50, filters.offset || 0);
        
        const { rows } = await globalPool.query(query, params);
        return rows;
    }
    
    // Récupérer un fichier par ID
    async getFileById(fileId, tenantId) {
        const { rows } = await globalPool.query(
            'SELECT * FROM files WHERE id = $1 AND tenant_id = $2',
            [fileId, tenantId]
        );
        
        if (rows.length === 0) {
            throw new NotFoundError('Fichier non trouvé');
        }
        
        return rows[0];
    }
    
    // Supprimer un fichier
    async deleteFile(fileId, tenantId) {
        const file = await this.getFileById(fileId, tenantId);
        
        // Supprimer le fichier physique
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        
        // Supprimer les métadonnées
        await globalPool.query(
            'DELETE FROM files WHERE id = $1 AND tenant_id = $2',
            [fileId, tenantId]
        );
        
        logger.tenant(tenantId, `Fichier supprimé: ${file.original_name}`);
        return { message: 'Fichier supprimé avec succès' };
    }
    
    // Obtenir le chemin absolu d'un fichier
    getFilePath(file) {
        return file.path;
    }
    
    // Nettoyer les fichiers orphelins (sans métadonnées)
    async cleanOrphanFiles(tenantId) {
        const { rows } = await globalPool.query(
            'SELECT path FROM files WHERE tenant_id = $1',
            [tenantId]
        );
        
        const dbPaths = new Set(rows.map(r => r.path));
        const tenantDir = path.join(UPLOADS_ROOT, `tenant_${tenantId}`);
        
        if (fs.existsSync(tenantDir)) {
            this.cleanDirectory(tenantDir, dbPaths);
        }
    }
    
    cleanDirectory(dir, dbPaths) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.cleanDirectory(fullPath, dbPaths);
            } else if (!dbPaths.has(fullPath)) {
                fs.unlinkSync(fullPath);
                logger.info(`Fichier orphelin supprimé: ${fullPath}`);
            }
        }
    }
}

module.exports = new UploadService();