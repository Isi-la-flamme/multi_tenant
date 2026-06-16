
const request = require('supertest');
const fs = require('fs');
const API_URL = 'http://localhost:3000';

async function testPDF() {
    console.log('\n📄 TEST EXPORT PDF\n');
    
    // Login admin
    const loginRes = await request(API_URL)
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'demo')
        .send({ email: 'admin@demo.com', password: 'Admin123!' });
    
    if (loginRes.status !== 200) {
        console.log('❌ Login échoué');
        return;
    }
    
    const token = loginRes.body.data.accessToken;
    
    // Récupérer une facture
    const invoicesRes = await request(API_URL)
        .get('/api/credit/admin/invoices')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${token}`);
    
    if (invoicesRes.status !== 200 || invoicesRes.body.data.invoices.length === 0) {
        console.log('❌ Aucune facture trouvée');
        return;
    }
    
    const invoiceId = invoicesRes.body.data.invoices[0].id;
    console.log('📄 Facture ID:', invoiceId);
    
    // Exporter en PDF
    const pdfRes = await request(API_URL)
        .get(`/api/credit/admin/invoice-pdf/${invoiceId}`)
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${token}`);
    
    if (pdfRes.status === 200) {
        // Sauvegarder le PDF
        fs.writeFileSync('facture-test.pdf', pdfRes.body);
        console.log('✅ PDF généré avec succès');
        console.log('📁 Fichier: facture-test.pdf');
        console.log('📊 Taille:', (pdfRes.body.length / 1024).toFixed(2), 'KB');
    } else {
        console.log('❌ Erreur:', pdfRes.status, pdfRes.body);
    }
}

testPDF().catch(console.error);
