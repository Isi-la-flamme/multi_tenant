const request = require('supertest');
const app = require('../src/index');

describe('Products API', () => {
    let token;
    
    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-Subdomain', 'demo')
            .send({ email: 'admin@demo.com', password: 'Admin123!' });
        token = res.body.data.token;
    });
    
    let productId;
    
    test('POST /api/products - crée un produit', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .send({ name: 'Test Product', price: 9.99 });
        
        expect(res.status).toBe(201);
        productId = res.body.data.product.id;
    });
    
    test('GET /api/products - liste les produits', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo');
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.products)).toBe(true);
    });
    
    test('GET /api/products/:id - détail produit', async () => {
        const res = await request(app)
            .get(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo');
        
        expect(res.status).toBe(200);
        expect(res.body.data.product.id).toBe(productId);
    });
    
    test('PUT /api/products/:id - modifie produit', async () => {
        const res = await request(app)
            .put(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .send({ name: 'Updated Product' });
        
        expect(res.status).toBe(200);
        expect(res.body.data.product.name).toBe('Updated Product');
    });
    
    test('DELETE /api/products/:id - supprime produit', async () => {
        const res = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo');
        
        expect(res.status).toBe(200);
    });
    
    test('Isolation: produit de demo pas visible dans client1', async () => {
        // Créer un produit dans demo
        const createRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'demo')
            .send({ name: 'Demo Only', price: 1 });
        
        const demoProductId = createRes.body.data.product.id;
        
        // Essayer de le voir depuis client1
        const res = await request(app)
            .get(`/api/products/${demoProductId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('X-Tenant-Subdomain', 'client1');
        
        expect(res.status).toBe(404);
    });
});