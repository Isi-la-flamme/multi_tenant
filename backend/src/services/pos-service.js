// src/services/pos-service.js
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');
const productService = require('./product-service');

class POSService {
  /**
   * Récupère les produits pour le POS
   */
  async getProducts(tenantId, search, category, limit = 100) {
    let query = `
      SELECT 
        id, name, description, price, category, stock, 
        image, barcode, created_at as "createdAt"
      FROM products 
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR barcode = $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY name LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Récupère un produit par son code-barres
   */
  async getProductByBarcode(tenantId, barcode) {
    const result = await pool.query(
      `SELECT 
        id, name, description, price, category, stock, 
        image, barcode, created_at as "createdAt"
      FROM products 
      WHERE tenant_id = $1 AND barcode = $2`,
      [tenantId, barcode]
    );
    return result.rows[0] || null;
  }

  /**
   * Crée un nouveau panier
   */
  async createCart(tenantId) {
    const id = uuidv4();
    const cart = {
      id,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      taxRate: 20, // TVA par défaut
      createdAt: new Date(),
    };

    // Stocker le panier en session/cache (Redis)
    await this.saveCart(tenantId, id, cart);
    return cart;
  }

  /**
   * Récupère un panier
   */
  async getCart(tenantId, cartId) {
    const cart = await this.getCartFromCache(tenantId, cartId);
    if (!cart) {
      // Si le panier n'existe pas en cache, en créer un nouveau
      return this.createCart(tenantId);
    }
    return cart;
  }

  /**
   * Ajoute un produit au panier
   */
  async addToCart(tenantId, cartId, productId, quantity) {
    // Récupérer le panier
    let cart = await this.getCartFromCache(tenantId, cartId);
    if (!cart) {
      cart = await this.createCart(tenantId);
      cartId = cart.id;
    }

    // Récupérer le produit
    const product = await productService.getProductById(productId, tenantId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Vérifier le stock
    if (product.stock < quantity) {
      throw new AppError('Stock insuffisant', 400);
    }

    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      // Mettre à jour la quantité
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
    } else {
      // Ajouter un nouvel article
      cart.items.push({
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        total: quantity * product.price,
        barcode: product.barcode,
      });
    }

    // Recalculer les totaux
    this.recalculateCart(cart);

    // Sauvegarder le panier
    await this.saveCart(tenantId, cartId, cart);

    return cart;
  }

  /**
   * Modifie la quantité d'un article
   */
  async updateCartItem(tenantId, cartId, itemId, quantity) {
    const cart = await this.getCartFromCache(tenantId, cartId);
    if (!cart) {
      throw new AppError('Panier non trouvé', 404);
    }

    const item = cart.items.find(item => item.id === itemId);
    if (!item) {
      throw new AppError('Article non trouvé', 404);
    }

    if (quantity <= 0) {
      return this.removeFromCart(tenantId, cartId, itemId);
    }

    // Vérifier le stock
    const product = await productService.getProductById(item.productId, tenantId);
    if (product && product.stock < quantity) {
      throw new AppError('Stock insuffisant', 400);
    }

    item.quantity = quantity;
    item.total = quantity * item.unitPrice;

    this.recalculateCart(cart);
    await this.saveCart(tenantId, cartId, cart);

    return cart;
  }

  /**
   * Supprime un article du panier
   */
  async removeFromCart(tenantId, cartId, itemId) {
    const cart = await this.getCartFromCache(tenantId, cartId);
    if (!cart) {
      throw new AppError('Panier non trouvé', 404);
    }

    cart.items = cart.items.filter(item => item.id !== itemId);

    this.recalculateCart(cart);
    await this.saveCart(tenantId, cartId, cart);

    return cart;
  }

  /**
   * Vide le panier
   */
  async clearCart(tenantId, cartId) {
    const cart = await this.getCartFromCache(tenantId, cartId);
    if (!cart) {
      throw new AppError('Panier non trouvé', 404);
    }

    cart.items = [];
    cart.subtotal = 0;
    cart.tax = 0;
    cart.total = 0;

    await this.saveCart(tenantId, cartId, cart);
    return cart;
  }

  /**
   * Finalise la vente (checkout)
   */
  async checkout(tenantId, userId, userName, data) {
    const { cart, payment, customerId, customerName } = data;

    // Vérifier que le panier n'est pas vide
    if (!cart.items || cart.items.length === 0) {
      throw new AppError('Le panier est vide', 400);
    }

    // Vérifier le stock de chaque produit
    for (const item of cart.items) {
      const product = await productService.getProductById(item.productId, tenantId);
      if (!product) {
        throw new AppError(`Produit ${item.productName} non trouvé`, 404);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Stock insuffisant pour ${item.productName}`, 400);
      }
    }

    // Déduire le stock
    for (const item of cart.items) {
      await productService.updateStock(item.productId, -item.quantity, tenantId);
    }

    // Générer un numéro de facture
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Créer la vente
    const saleId = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO pos_sales (
        id, tenant_id, invoice_number, cart, payment, 
        status, cashier_id, cashier_name, 
        customer_id, customer_name, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      saleId,
      tenantId,
      invoiceNumber,
      JSON.stringify(cart),
      JSON.stringify(payment),
      'completed',
      userId,
      userName,
      customerId || null,
      customerName || null,
      now,
    ]);

    // Supprimer le panier du cache
    await this.deleteCart(tenantId, cart.id);

    // Logger la vente
    logger.info(`Vente ${invoiceNumber} créée par ${userName}`, {
      tenantId,
      total: cart.total,
      items: cart.items.length,
    });

    return {
      id: result.rows[0].id,
      invoiceNumber: result.rows[0].invoice_number,
      cart,
      payment,
      status: 'completed',
      createdAt: now,
      cashierId: userId,
      cashierName: userName,
      tenantId,
    };
  }

  /**
   * Récupère l'historique des ventes
   */
  async getSales(tenantId, page = 1, limit = 20, startDate, endDate) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        id, invoice_number as "invoiceNumber", 
        cart, payment, status, 
        cashier_name as "cashierName",
        customer_name as "customerName",
        created_at as "createdAt"
      FROM pos_sales 
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM pos_sales WHERE tenant_id = $1`,
      [tenantId]
    );

    return {
      data: result.rows.map(row => ({
        ...row,
        cart: typeof row.cart === 'string' ? JSON.parse(row.cart) : row.cart,
        payment: typeof row.payment === 'string' ? JSON.parse(row.payment) : row.payment,
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  /**
   * Récupère une vente
   */
  async getSale(tenantId, saleId) {
    const result = await pool.query(
      `SELECT 
        id, invoice_number as "invoiceNumber", 
        cart, payment, status, 
        cashier_id as "cashierId",
        cashier_name as "cashierName",
        customer_id as "customerId",
        customer_name as "customerName",
        created_at as "createdAt"
      FROM pos_sales 
      WHERE tenant_id = $1 AND id = $2`,
      [tenantId, saleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      cart: typeof row.cart === 'string' ? JSON.parse(row.cart) : row.cart,
      payment: typeof row.payment === 'string' ? JSON.parse(row.payment) : row.payment,
    };
  }

  /**
   * Rembourse une vente
   */
  async refundSale(tenantId, saleId, reason = 'Remboursement') {
    const sale = await this.getSale(tenantId, saleId);
    if (!sale) {
      throw new AppError('Vente non trouvée', 404);
    }

    if (sale.status === 'refunded') {
      throw new AppError('Cette vente a déjà été remboursée', 400);
    }

    if (sale.status === 'cancelled') {
      throw new AppError('Cette vente est annulée', 400);
    }

    // Remettre le stock
    for (const item of sale.cart.items) {
      await productService.updateStock(item.productId, item.quantity, tenantId);
    }

    // Mettre à jour le statut
    const result = await pool.query(
      `UPDATE pos_sales 
       SET status = 'refunded', refund_reason = $1 
       WHERE tenant_id = $2 AND id = $3 
       RETURNING *`,
      [reason, tenantId, saleId]
    );

    logger.info(`Vente ${sale.invoiceNumber} remboursée`, {
      tenantId,
      saleId,
      reason,
    });

    return {
      ...sale,
      status: 'refunded',
    };
  }

  /**
   * Récupère les statistiques du POS
   */
  async getStats(tenantId) {
    // Ventes du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await pool.query(
      `SELECT 
        COUNT(*) as "totalSales",
        COALESCE(SUM((cart->>'total')::numeric), 0) as "totalRevenue",
        COALESCE(SUM(jsonb_array_length(cart->'items')), 0) as "totalItemsSold",
        COALESCE(AVG((cart->>'total')::numeric), 0) as "averageTicket"
      FROM pos_sales 
      WHERE tenant_id = $1 
        AND status = 'completed'
        AND created_at >= $2`,
      [tenantId, today]
    );

    const stats = result.rows[0];

    // Dernière vente
    const lastSaleResult = await pool.query(
      `SELECT 
        id, invoice_number as "invoiceNumber", 
        cart, created_at as "createdAt"
      FROM pos_sales 
      WHERE tenant_id = $1 AND status = 'completed'
      ORDER BY created_at DESC 
      LIMIT 1`,
      [tenantId]
    );

    let lastSale = null;
    if (lastSaleResult.rows.length > 0) {
      const row = lastSaleResult.rows[0];
      lastSale = {
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        total: row.cart.total || 0,
        createdAt: row.createdAt,
      };
    }

    return {
      totalSales: parseInt(stats.totalSales) || 0,
      totalRevenue: parseFloat(stats.totalRevenue) || 0,
      totalItemsSold: parseInt(stats.totalItemsSold) || 0,
      averageTicket: parseFloat(stats.averageTicket) || 0,
      lastSale,
    };
  }

  // ============================================
  // Méthodes privées
  // ============================================

  /**
   * Recalcule les totaux du panier
   */
  recalculateCart(cart) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
    cart.tax = cart.subtotal * (cart.taxRate / 100);
    cart.total = cart.subtotal + cart.tax;
  }

  /**
   * Sauvegarde le panier en cache (Redis)
   */
  async saveCart(tenantId, cartId, cart) {
    // TODO: Implémenter avec Redis
    // Pour le moment, on stocke en mémoire (à remplacer par Redis)
    if (!this.carts) {
      this.carts = {};
    }
    const key = `${tenantId}:${cartId}`;
    this.carts[key] = cart;
    return cart;
  }

  /**
   * Récupère le panier du cache (Redis)
   */
  async getCartFromCache(tenantId, cartId) {
    // TODO: Implémenter avec Redis
    if (!this.carts) {
      this.carts = {};
    }
    const key = `${tenantId}:${cartId}`;
    return this.carts[key] || null;
  }

  /**
   * Supprime le panier du cache
   */
  async deleteCart(tenantId, cartId) {
    if (!this.carts) {
      this.carts = {};
    }
    const key = `${tenantId}:${cartId}`;
    delete this.carts[key];
  }

  /**
   * Génère un numéro de facture
   */
  async generateInvoiceNumber(tenantId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Compter les ventes du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await pool.query(
      `SELECT COUNT(*) FROM pos_sales 
       WHERE tenant_id = $1 AND created_at >= $2`,
      [tenantId, today]
    );

    const count = parseInt(result.rows[0].count) + 1;
    const sequence = String(count).padStart(4, '0');

    return `INV-${year}${month}${day}-${sequence}`;
  }
}

module.exports = new POSService();