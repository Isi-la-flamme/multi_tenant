const { ValidationError } = require('../utils/errors');

function validate(schema, property = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const message = error.details.map(d => d.message).join(', ');
            return next(new ValidationError(message));
        }
        
        req[property] = value;
        next();
    };
}

module.exports = { validate };