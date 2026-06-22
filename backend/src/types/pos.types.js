// src/types/pos.types.js

/**
 * @typedef {Object} POSProduct
 * @property {string} id - ID du produit
 * @property {string} name - Nom du produit
 * @property {number} price - Prix unitaire
 * @property {string} category - Catégorie
 * @property {number} stock - Quantité en stock
 * @property {string} [image] - URL de l'image
 * @property {string} [barcode] - Code-barres
 */

/**
 * @typedef {Object} POSCartItem
 * @property {string} id - ID de l'item
 * @property {string} productId - ID du produit
 * @property {string} productName - Nom du produit
 * @property {number} quantity - Quantité
 * @property {number} unitPrice - Prix unitaire
 * @property {number} total - Total de l'item
 * @property {string} [barcode] - Code-barres
 */

/**
 * @typedef {Object} POSCart
 * @property {string} id - ID du panier
 * @property {POSCartItem[]} items - Articles du panier
 * @property {number} subtotal - Sous-total
 * @property {number} tax - TVA
 * @property {number} total - Total
 * @property {number} taxRate - Taux de TVA
 * @property {string} [customerId] - ID du client
 * @property {string} [customerName] - Nom du client
 */

/**
 * @typedef {Object} POSPayment
 * @property {'cash'|'card'|'credit'|'mixed'} method - Méthode de paiement
 * @property {number} amount - Montant total
 * @property {number} [cashAmount] - Montant en espèces
 * @property {number} [cardAmount] - Montant par carte
 * @property {number} [creditAmount] - Montant par crédit
 * @property {number} [change] - Monnaie rendue
 */

/**
 * @typedef {Object} POSSale
 * @property {string} id - ID de la vente
 * @property {string} invoiceNumber - Numéro de facture
 * @property {POSCart} cart - Panier
 * @property {POSPayment} payment - Paiement
 * @property {'completed'|'pending'|'cancelled'|'refunded'} status - Statut
 * @property {Date} createdAt - Date de création
 * @property {string} cashierId - ID du caissier
 * @property {string} cashierName - Nom du caissier
 * @property {string} tenantId - ID du tenant
 */