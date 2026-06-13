const rateLimit = require('express-rate-limit');

const tenantLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    keyGenerator: (req) => {
        return req.tenant?.id || req.ip;
    },
    message: {
        status: 'error',
        message: 'Trop de requêtes, veuillez réessayer plus tard'
    }
});

module.exports = { tenantLimiter };