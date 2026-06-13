const request = require('supertest');

// On importe après le setup pour que les variables d'env soient chargées
const app = require('../src/index');

describe('🔐 Auth API', () => {
    const uniqueEmail = `test-${Date.now()}@demo.com`;
    const testUser = {
        email: uniqueEmail,
        password: 'Test123!',
        name: 'Test User'
    };
    let token;

    // ============================================
    // REGISTER
    // ============================================
    describe('POST /api/auth/register', () => {
        test('✅ Crée un utilisateur avec des données valides', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('X-Tenant-Subdomain', 'demo')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.user.id).toBeDefined();
        });

        test('❌ Refuse un email invalide', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('X-Tenant-Subdomain', 'demo')
                .send({ email: 'invalid', password: 'Test123!' });

            expect(res.status).toBe(400);
        });

        test('❌ Refuse un mot de passe trop court', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('X-Tenant-Subdomain', 'demo')
                .send({ email: 'test@test.com', password: '123' });

            expect(res.status).toBe(400);
        });

        test('❌ Refuse un email déjà utilisé', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('X-Tenant-Subdomain', 'demo')
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('déjà utilisé');
        });

        test('❌ Refuse sans email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('X-Tenant-Subdomain', 'demo')
                .send({ password: 'Test123!' });

            expect(res.status).toBe(400);
        });
    });

    // ============================================
    // LOGIN
    // ============================================
    describe('POST /api/auth/login', () => {
        test('✅ Connecte avec les bons identifiants', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Tenant-Subdomain', 'demo')
                .send({ email: testUser.email, password: testUser.password });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.tenants).toBeDefined();
            token = res.body.data.token;
        });

        test('❌ Refuse un mauvais mot de passe', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Tenant-Subdomain', 'demo')
                .send({ email: testUser.email, password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('fail');
        });

        test('❌ Refuse un email inexistant', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Tenant-Subdomain', 'demo')
                .send({ email: 'nexistepas@demo.com', password: 'Test123!' });

            expect(res.status).toBe(401);
        });

        test('❌ Refuse sans mot de passe', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('X-Tenant-Subdomain', 'demo')
                .send({ email: testUser.email });

            expect(res.status).toBe(400);
        });
    });

    // ============================================
    // ROUTES PROTÉGÉES
    // ============================================
    describe('GET /api/me (protégée)', () => {
        test('✅ Accède avec un token valide', async () => {
            const res = await request(app)
                .get('/api/me')
                .set('Authorization', `Bearer ${token}`)
                .set('X-Tenant-Subdomain', 'demo');

            expect(res.status).toBe(200);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.tenant.subdomain).toBe('demo');
        });

        test('❌ Refuse sans token', async () => {
            const res = await request(app)
                .get('/api/me')
                .set('X-Tenant-Subdomain', 'demo');

            expect(res.status).toBe(401);
        });

        test('❌ Refuse avec un token invalide', async () => {
            const res = await request(app)
                .get('/api/me')
                .set('Authorization', 'Bearer token_invalide')
                .set('X-Tenant-Subdomain', 'demo');

            expect(res.status).toBe(401);
        });
    });
});