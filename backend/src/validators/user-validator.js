const Joi = require('joi');

const inviteUserSchema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('admin', 'manager', 'member').optional().default('member')
});

const updateUserSchema = Joi.object({
    role: Joi.string().valid('admin', 'manager', 'member').optional(),
    phone: Joi.string().max(50).optional().allow('', null),
    avatarUrl: Joi.string().uri().optional().allow('', null),
    isActive: Joi.boolean().optional()
}).min(1);

module.exports = { inviteUserSchema, updateUserSchema };