const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '30d';

// Validation stricte sans async
if (process.env.NODE_ENV === 'production') {
    if (!JWT_SECRET || JWT_SECRET === 'dev-secret-key-change-me') {
        console.error('❌ JWT_SECRET is required and must be changed in production');
        process.exit(1);
    }
}

const generateToken = (payload, expiresIn = JWT_EXPIRATION) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRATION,
    JWT_REFRESH_EXPIRATION,
    generateToken,
    verifyToken,
    generateRefreshToken,
    verifyRefreshToken
};