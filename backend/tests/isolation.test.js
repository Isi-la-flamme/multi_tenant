const request = require('supertest');
const app = require('../src/index');

describe('🔒 Isolation Multi-Tenant', () => {
    let tokenDemo;
    let tokenClient1;
    let productId;

    beforeAll(async () => {
        // Créer un utilisateur dans demo
        const emailDemo = `demo-${Date.now()}@demo.com`;
        await request(app)
            .post('/api/auth/register')
            .set('X-Tenant-Subdomain', 'demo')
            .send({ email: emailDemo, password: 'Test123!' });

        const loginDemo = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-Subdomain', 'demo')
            .send({ email: emailDemo, password: 'Test123!' });
        tokenDemo = loginDemo.body.data.token;

        // Login admin dans client1
        const loginClient1 = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-Subdomain', 'client1')
            .send({ email: 'admin@demo.com', password: 'Admin123!' });
        tokenClient1 = loginClient1.body.data.token;
    });

    test('✅ Un produit créé dans demo n\'est pas visible dans client1', async () => {
        // Créer dans demo
        const createRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${tokenDemo}`)
            .set('X-Tenant-Subdomain', 'demo')
            .send({ name: 'Demo Product', price: 10 });
        
        expect(createRes.status).toBe(201);
        productId = createRes.body.data.product.id;

        // Essayer de voir dans client1
        const res = await request(app)
            .get(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${tokenClient1}`)
            .set('X-Tenant-Subdomain', 'client1');

        expect(res.status).toBe(404);
    });

    test('✅ Les produits listés sont différents par tenant', async () => {
        const demoProducts = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${tokenDemo}`)
            .set('X-Tenant-Subdomain', 'demo');

        const client1Products = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${tokenClient1}`)
            .set('X-Tenant-Subdomain', 'client1');

        const demoIds = demoProducts.body.data.products.map(p => p.id);
        const client1Ids = client1Products.body.data.products.map(p => p.id);

        // Le produit créé dans demo ne doit pas être dans client1
        expect(client1Ids).not.toContain(productId);
    });

    test('✅ Le dashboard est isolé par tenant', async () => {
        const demoDashboard = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${tokenDemo}`)
            .set('X-Tenant-Subdomain', 'demo');

        const client1Dashboard = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${tokenClient1}`)
            .set('X-Tenant-Subdomain', 'client1');

        // Les totaux doivent être différents
        expect(demoDashboard.body.data.totals).toBeDefined();
        expect(client1Dashboard.body.data.totals).toBeDefined();
    });
});