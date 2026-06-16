const Joi = require('joi');

const uploadMetadataSchema = Joi.object({
    entityType: Joi.string()
        .valid('general', 'product', 'avatar', 'document', 'invoice')
        .default('general'),
    
    entityId: Joi.when('entityType', {
        is: 'product',
        then: Joi.string().uuid().required().messages({
            'any.required': 'entityId est requis pour les images produit',
            'string.uuid': 'entityId doit être un UUID valide'
        }),
        otherwise: Joi.alternatives().try(
            Joi.string().max(100),
            Joi.valid(null)
        ).optional()
    })
});

const avatarUploadSchema = Joi.object({
    // Aucun champ supplémentaire pour l'avatar, juste le fichier
}).optional();

const productImageSchema = Joi.object({
    // Aucun champ supplémentaire
}).optional();

module.exports = { uploadMetadataSchema, avatarUploadSchema, productImageSchema };





