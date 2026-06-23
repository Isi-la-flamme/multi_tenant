const Joi = require('joi');

const createProductSchema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().max(2000).optional().allow(''),
    price: Joi.number().min(0).optional().default(0),
    sku: Joi.string().max(100).optional().allow(null),
    category: Joi.string().max(100).optional().allow(''),
    stock: Joi.number().integer().min(0).optional().default(0),
    image: Joi.string().max(500).optional().allow(null, ''),
    images: Joi.array().items(Joi.string().max(500)).optional(),
    barcode: Joi.string().max(100).optional().allow(null, '')
});

const updateProductSchema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(2000).optional().allow(''),
    price: Joi.number().min(0).optional(),
    sku: Joi.string().max(100).optional().allow(null),
    category: Joi.string().max(100).optional().allow(''),
    stock: Joi.number().integer().min(0).optional(),
    image: Joi.string().max(500).optional().allow(null, ''),
    images: Joi.array().items(Joi.string().max(500)).optional(),
    barcode: Joi.string().max(100).optional().allow(null, ''),
    isActive: Joi.boolean().optional()
}).min(1);

module.exports = { createProductSchema, updateProductSchema };
