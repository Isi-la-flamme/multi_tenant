const request = require('supertest');
const app = require('../src/index');
const path = require('path');

describe('📁 Upload Validation', () => {
    let token;
    
    beforeAll(async () => {
        // Créer un utilisateur et récupérer un token
        const email = `upload-test-${Date.now()}@demo.com`;
        await request(app)
            .post('/api/auth/register')
            .set('X-Tenant-Subdomain', 'demo')
            .send({ email, password: 'Test123!', name: 'Upload Tester' });
        
        const loginRes = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-Subdomain', 'demo')
            .send({ email, password: 'Test123!' });
        
        token = loginRes.body.data.token;
    });
    
    test('✅ Accepte un entityType valide (general)', async () => {
        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .field('entityType', 'general')
            .attach('file', path.join(__dirname, 'fixtures', 'test.txt'));
        
        // Note: adaptez selon votre fixture
        expect(res.status).not.toBe(400);
    });
    
    test('❌ Refuse un entityType invalide', async () => {
        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .field('entityType', 'invalid_type')
            .attach('file', path.join(__dirname, 'fixtures', 'test.txt'));
        
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('entityType');
    });
    
    test('❌ Pour un produit, entityId est requis', async () => {
        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .field('entityType', 'product')
            // Pas de entityId
            .attach('file', path.join(__dirname, 'fixtures', 'test.txt'));
        
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('entityId est requis');
    });
    
    test('✅ Pour un produit, entityId UUID est accepté', async () => {
        const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';
        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .field('entityType', 'product')
            .field('entityId', fakeUuid)
            .attach('file', path.join(__dirname, 'fixtures', 'test.txt'));
        
        // Note: le produit n'existe pas vraiment, donc la route échouera plus tard
        // Mais la validation Joi passe (status 400 viendrait de la validation)
        expect(res.status).not.toBe(400);
    });
});