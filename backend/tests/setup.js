process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'postgres';
process.env.DB_PORT = 5432;
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'secret';
process.env.DB_NAME = 'multitenant_db';
process.env.REDIS_URL = 'redis://redis:6379';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRATION = '1h';
process.env.DEFAULT_TENANT = 'demo';

// Désactiver les logs pendant les tests
jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    tenant: jest.fn()
}));