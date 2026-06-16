const request = require('supertest');
const app = require('../src/index');

describe('Debug Upload', () => {
    let token;
    
    test('1. Vérifier health endpoint', async () => {
        const res = await request(app)
            .get('/api/health')
            .set('X-Tenant-Subdomain', 'demo');
        
        console.log('Health status:', res.status);
        console.log('Health body:', res.body);
        expect(res.status).toBe(200);
    });
    
    test('2. Tenter de créer un utilisateur', async () => {
        const timestamp = Date.now();
        const res = await request(app)
            .post('/api/auth/register')
            .set('X-Tenant-Subdomain', 'demo')
            .send({
                email: `debug-${timestamp}@demo.com`,
                password: 'Test123!',
                name: 'Debug User'
            });
        
        console.log('Register status:', res.status);
        console.log('Register body:', res.body);
        
        if (res.status === 201) {
            console.log('✅ Utilisateur créé');
        }
    });
    
    test('3. Tenter de se connecter', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-Subdomain', 'demo')
            .send({
                email: 'admin@demo.com',
                password: 'Admin123!'
            });
        
        console.log('Login status:', res.status);
        console.log('Login body:', res.body);
        
        if (res.body.data?.token) {
            token = res.body.data.token;
            console.log('✅ Token obtenu');
        }
    });
    
    test('4. Tester upload avec validation', async () => {
        if (!token) {
            console.log('⏭️ Pas de token, skip test');
            return;
        }
        
        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .field('entityType', 'invalid_type')
            .attach('file', 'tests/fixtures/test.txt');
        
        console.log('Upload status:', res.status);
        console.log('Upload body:', res.body);
        
        expect(res.status).toBe(400);
    });
});