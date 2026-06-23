const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class ProductService {
    mapProduct(row) {
        if (!row) return null;
        return {
            id: row.id,
            tenantId: row.tenant_id,
            name: row.name,
            description: row.description || '',
            price: parseFloat(row.price) || 0,
            sku: row.sku || null,
            category: row.category || 'Autre',
            stock: parseInt(row.stock, 10) || 0,
            image: row.image || null,
            images: row.image ? [row.image] : [],
            barcode: row.barcode || null,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    addFilters(query, params, filters = {}) {
        let filteredQuery = query;

        if (filters.isActive !== null && filters.isActive !== undefined) {
            params.push(filters.isActive);
            filteredQuery += ` AND is_active = $${params.length}`;
        }
        if (filters.search) {
            params.push(`%${filters.search}%`);
            filteredQuery += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length} OR sku ILIKE $${params.length})`;
        }
        if (filters.category) {
            params.push(filters.category);
            filteredQuery += ` AND category = $${params.length}`;
        }
        if (filters.minPrice !== undefined && filters.minPrice !== null) {
            params.push(filters.minPrice);
            filteredQuery += ` AND price >= $${params.length}`;
        }
        if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
            params.push(filters.maxPrice);
            filteredQuery += ` AND price <= $${params.length}`;
        }
        if (filters.inStock !== undefined && filters.inStock !== null) {
            filteredQuery += filters.inStock ? ' AND stock > 0' : ' AND stock <= 0';
        }

        return filteredQuery;
    }

    async findAll(tenantId, filters = {}) {
        const params = [tenantId];
        let query = this.addFilters('SELECT * FROM products WHERE tenant_id = $1', params, filters);

        params.push(filters.limit || 50);
        query += ` ORDER BY created_at DESC LIMIT $${params.length}`;
        params.push(filters.offset || 0);
        query += ` OFFSET $${params.length}`;

        const { rows } = await globalPool.query(query, params);
        return rows.map(row => this.mapProduct(row));
    }

    async findById(id, tenantId) {
        const { rows } = await globalPool.query(
            'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        if (rows.length === 0) throw new NotFoundError('Produit non trouve');
        return this.mapProduct(rows[0]);
    }

    async getProductById(id, tenantId) {
        return this.findById(id, tenantId);
    }

    async create(tenantId, data) {
        const { name, description, price, sku, category, stock, images, image, barcode } = data;
        if (!name) throw new ValidationError('Le nom du produit est requis');
        if (price !== undefined && price < 0) throw new ValidationError('Le prix ne peut pas etre negatif');
        if (stock !== undefined && stock < 0) throw new ValidationError('Le stock ne peut pas etre negatif');

        if (sku) {
            const existing = await globalPool.query(
                'SELECT id FROM products WHERE tenant_id = $1 AND sku = $2',
                [tenantId, sku]
            );
            if (existing.rows.length > 0) throw new ValidationError('Ce SKU existe deja pour ce tenant');
        }

        const productImage = image || images?.[0] || null;
        const { rows } = await globalPool.query(
            `INSERT INTO products (tenant_id, name, description, price, sku, category, stock, image, barcode)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [tenantId, name, description || '', price || 0, sku || null, category || 'Autre', stock ?? 0, productImage, barcode || null]
        );

        logger.tenant(tenantId, `Produit cree: ${name}`);
        return this.mapProduct(rows[0]);
    }

    async update(id, tenantId, data) {
        const product = await this.findById(id, tenantId);
        const { name, description, price, sku, isActive, category, stock, images, image, barcode } = data;
        if (sku && sku !== product.sku) {
            const existing = await globalPool.query(
                'SELECT id FROM products WHERE tenant_id = $1 AND sku = $2 AND id != $3',
                [tenantId, sku, id]
            );
            if (existing.rows.length > 0) throw new ValidationError('Ce SKU existe deja pour ce tenant');
        }
        if (price !== undefined && price < 0) throw new ValidationError('Le prix ne peut pas etre negatif');
        if (stock !== undefined && stock < 0) throw new ValidationError('Le stock ne peut pas etre negatif');

        const productImage = image || images?.[0] || null;
        const { rows } = await globalPool.query(
            `UPDATE products
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 price = COALESCE($3, price),
                 sku = COALESCE($4, sku),
                 is_active = COALESCE($5, is_active),
                 category = COALESCE($6, category),
                 stock = COALESCE($7, stock),
                 image = COALESCE($8, image),
                 barcode = COALESCE($9, barcode),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 AND tenant_id = $11
             RETURNING *`,
            [name || null, description || null, price ?? null, sku || null, isActive ?? null, category || null, stock ?? null, productImage, barcode || null, id, tenantId]
        );

        logger.tenant(tenantId, `Produit mis a jour: ${rows[0].name}`);
        return this.mapProduct(rows[0]);
    }

    async updateStock(id, quantity, tenantId) {
        const parsedQuantity = Number(quantity);
        if (!Number.isFinite(parsedQuantity)) throw new ValidationError('La quantite doit etre un nombre');

        const { rows } = await globalPool.query(
            `UPDATE products
             SET stock = GREATEST(COALESCE(stock, 0) + $1, 0),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND tenant_id = $3
             RETURNING *`,
            [parsedQuantity, id, tenantId]
        );
        if (rows.length === 0) throw new NotFoundError('Produit non trouve');
        return this.mapProduct(rows[0]);
    }

    async delete(id, tenantId) {
        const product = await this.findById(id, tenantId);
        await globalPool.query(
            'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        logger.tenant(tenantId, `Produit desactive: ${product.name}`);
        return { message: 'Produit supprime avec succes' };
    }

    async hardDelete(id, tenantId) {
        const product = await this.findById(id, tenantId);
        await globalPool.query('DELETE FROM products WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        logger.tenant(tenantId, `Produit supprime definitivement: ${product.name}`);
        return { message: 'Produit supprime definitivement' };
    }

    async count(tenantId, filters = {}) {
        const params = [tenantId];
        const query = this.addFilters('SELECT COUNT(*) FROM products WHERE tenant_id = $1', params, filters);
        const { rows } = await globalPool.query(query, params);
        return parseInt(rows[0].count, 10);
    }
}

const { globalPool } = require('../config/database');

module.exports = new ProductService();
