const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class ProductService {
    
    // Lister les produits d'un tenant
    async findAll(tenantId, filters = {}) {
        const { rows } = await globalPool.query(
            `SELECT * FROM products 
             WHERE tenant_id = $1 
             AND ($2::BOOLEAN IS NULL OR is_active = $2)
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [
                tenantId,
                filters.isActive ?? null,
                filters.limit || 50,
                filters.offset || 0
            ]
        );
        return rows;
    }
    
    // Trouver un produit par ID (vérifie le tenant)
    async findById(id, tenantId) {
        const { rows } = await globalPool.query(
            'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        
        if (rows.length === 0) {
            throw new NotFoundError('Produit non trouvé');
        }
        
        return rows[0];
    }
    
    // Créer un produit
    async create(tenantId, data) {
        const { name, description, price, sku } = data;
        
        if (!name) {
            throw new ValidationError('Le nom du produit est requis');
        }
        
        if (price !== undefined && price < 0) {
            throw new ValidationError('Le prix ne peut pas être négatif');
        }
        
        // Vérifier l'unicité du SKU dans le tenant
        if (sku) {
            const existing = await globalPool.query(
                'SELECT id FROM products WHERE tenant_id = $1 AND sku = $2',
                [tenantId, sku]
            );
            if (existing.rows.length > 0) {
                throw new ValidationError('Ce SKU existe déjà pour ce tenant');
            }
        }
        
        const { rows } = await globalPool.query(
            `INSERT INTO products (tenant_id, name, description, price, sku) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [tenantId, name, description || '', price || 0, sku || null]
        );
        
        logger.tenant(tenantId, `Produit créé: ${name}`);
        return rows[0];
    }
    
    // Mettre à jour un produit
    async update(id, tenantId, data) {
        // Vérifier que le produit existe et appartient au tenant
        const product = await this.findById(id, tenantId);
        
        const { name, description, price, sku, isActive } = data;
        
        // Vérifier l'unicité du SKU
        if (sku && sku !== product.sku) {
            const existing = await globalPool.query(
                'SELECT id FROM products WHERE tenant_id = $1 AND sku = $2 AND id != $3',
                [tenantId, sku, id]
            );
            if (existing.rows.length > 0) {
                throw new ValidationError('Ce SKU existe déjà pour ce tenant');
            }
        }
        
        if (price !== undefined && price < 0) {
            throw new ValidationError('Le prix ne peut pas être négatif');
        }
        
        const { rows } = await globalPool.query(
            `UPDATE products 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 price = COALESCE($3, price),
                 sku = COALESCE($4, sku),
                 is_active = COALESCE($5, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND tenant_id = $7
             RETURNING *`,
            [
                name || null,
                description || null,
                price ?? null,
                sku || null,
                isActive ?? null,
                id,
                tenantId
            ]
        );
        
        logger.tenant(tenantId, `Produit mis à jour: ${rows[0].name}`);
        return rows[0];
    }
    
    // Supprimer un produit (soft delete)
    async delete(id, tenantId) {
        const product = await this.findById(id, tenantId);
        
        await globalPool.query(
            "UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2",
            [id, tenantId]
        );
        
        logger.tenant(tenantId, `Produit désactivé: ${product.name}`);
        return { message: 'Produit supprimé avec succès' };
    }
    
    // Suppression dure (hard delete)
    async hardDelete(id, tenantId) {
        const product = await this.findById(id, tenantId);
        
        await globalPool.query(
            'DELETE FROM products WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        
        logger.tenant(tenantId, `Produit supprimé définitivement: ${product.name}`);
        return { message: 'Produit supprimé définitivement' };
    }
    
    // Compter les produits d'un tenant
    async count(tenantId, isActive = null) {
        let query = 'SELECT COUNT(*) FROM products WHERE tenant_id = $1';
        const params = [tenantId];
        
        if (isActive !== null) {
            query += ' AND is_active = $2';
            params.push(isActive);
        }
        
        const { rows } = await globalPool.query(query, params);
        return parseInt(rows[0].count);
    }
}

// Import ici pour éviter les dépendances circulaires
const { globalPool } = require('../config/database');

module.exports = new ProductService();