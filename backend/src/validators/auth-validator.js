const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().min(6).max(128).required(),
    name: Joi.string().max(255).optional(),
    tenantSubdomain: Joi.string().max(100).optional().default('demo')
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token requis'
    })
});

module.exports = { registerSchema, loginSchema, refreshTokenSchema };