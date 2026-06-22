// src/validators/pos-validator.js
const Joi = require('joi');

const addToCart = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).max(999).default(1),
});

const updateCartItem = Joi.object({
  quantity: Joi.number().integer().min(0).max(999).required(),
});

const checkout = Joi.object({
  cart: Joi.object({
    id: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        productId: Joi.string().required(),
        productName: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().positive().required(),
        total: Joi.number().positive().required(),
      })
    ).min(1).required(),
    subtotal: Joi.number().positive().required(),
    tax: Joi.number().positive().required(),
    total: Joi.number().positive().required(),
    taxRate: Joi.number().min(0).max(100).default(20),
  }).required(),
  payment: Joi.object({
    method: Joi.string().valid('cash', 'card', 'credit', 'mixed').required(),
    amount: Joi.number().positive().required(),
    cashAmount: Joi.number().positive(),
    cardAmount: Joi.number().positive(),
    creditAmount: Joi.number().positive(),
    change: Joi.number().min(0),
  }).required(),
  customerId: Joi.string().uuid(),
  customerName: Joi.string().max(100),
});

const refund = Joi.object({
  reason: Joi.string().max(500).default('Remboursement'),
});

module.exports = {
  posValidator: {
    addToCart,
    updateCartItem,
    checkout,
    refund,
  },
};