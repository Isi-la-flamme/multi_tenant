const request = require('supertest');
const API_URL = 'http://localhost:3000';

async function testCreditClient() {
    console.log('\n💰 TEST CRÉDIT CLIENT\n');
    
    let adminToken = null;
    let userToken = null;
    let userId = null;
    let invoiceId = null;
    
    // 1. Login admin
    console.log('1️⃣  Login admin...');
    const adminLogin = await request(API_URL)
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'demo')
        .send({ email: 'admin@demo.com', password: 'Admin123!' });
    
    if (adminLogin.status === 200) {
        adminToken = adminLogin.body.data.accessToken;
        console.log('   ✅ Admin connecté');
    } else {
        console.log('   ❌ Admin login échoué');
        return;
    }
    
    // 2. Créer un utilisateur
    console.log('\n2️⃣  Création utilisateur...');
    const timestamp = Date.now();
    const testEmail = `credit-${timestamp}@demo.com`;
    
    const register = await request(API_URL)
        .post('/api/auth/register')
        .set('X-Tenant-Subdomain', 'demo')
        .send({
            email: testEmail,
            password: 'Test123!',
            name: 'Credit Tester'
        });
    
    if (register.status === 201) {
        userId = register.body.data.user.id;
        console.log('   ✅ Utilisateur créé:', testEmail);
        console.log('   📍 ID:', userId);
    } else {
        console.log('   ❌ Erreur création');
        return;
    }
    
    // 3. Créer une ligne de crédit
    console.log('\n3️⃣  Création ligne de crédit (500 000 FCFA)...');
    const creditRes = await request(API_URL)
        .post('/api/credit/admin/create-line')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            userId: userId,
            creditLimit: 500000,
            paymentDelayDays: 30
        });
    
    if (creditRes.status === 201) {
        console.log('   ✅ Ligne de crédit créée');
        console.log('   💰 Plafond:', creditRes.body.data.credit_limit);
        console.log('   📅 Délai:', creditRes.body.data.payment_delay_days, 'jours');
    } else {
        console.log('   ❌ Erreur:', creditRes.body);
        return;
    }
    
    // 4. Créer une facture
    console.log('\n4️⃣  Création facture (25 000 FCFA)...');
    const invoiceRes = await request(API_URL)
        .post('/api/credit/admin/create-invoice')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            userId: userId,
            amount: 25000,
            description: 'Achat de 10 produits',
            referenceId: 'REF-001'
        });
    
    if (invoiceRes.status === 201) {
        invoiceId = invoiceRes.body.data.id;
        console.log('   ✅ Facture créée');
        console.log('   📄 Numéro:', invoiceRes.body.data.invoice_number);
        console.log('   💰 Montant:', invoiceRes.body.data.amount);
        console.log('   📅 Échéance:', invoiceRes.body.data.due_date);
    } else {
        console.log('   ❌ Erreur:', invoiceRes.body);
        return;
    }
    
    // 5. Voir le crédit du client
    console.log('\n5️⃣  Voir crédit client...');
    // Login user
    const userLogin = await request(API_URL)
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'demo')
        .send({ email: testEmail, password: 'Test123!' });
    
    if (userLogin.status === 200) {
        userToken = userLogin.body.data.accessToken;
        
        const creditView = await request(API_URL)
            .get('/api/credit/my-credit')
            .set('X-Tenant-Subdomain', 'demo')
            .set('Authorization', `Bearer ${userToken}`);
        
        if (creditView.status === 200) {
            console.log('   ✅ Crédit disponible:', creditView.body.data.available_amount);
            console.log('   ✅ Crédit utilisé:', creditView.body.data.used_amount);
        }
    }
    
    // 6. Enregistrer un paiement
    console.log('\n6️⃣  Enregistrement paiement (15 000 FCFA)...');
    const paymentRes = await request(API_URL)
        .post('/api/credit/admin/pay')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            userId: userId,
            invoiceId: invoiceId,
            amount: 15000,
            paymentMethod: 'wave',
            reference: 'WAVE-123456'
        });
    
    if (paymentRes.status === 200) {
        console.log('   ✅ Paiement enregistré');
        console.log('   💳 Montant:', paymentRes.body.data.amount);
        console.log('   📱 Méthode:', paymentRes.body.data.payment_method);
    } else {
        console.log('   ❌ Erreur:', paymentRes.body);
    }
    
    // 7. Voir les factures du client
    console.log('\n7️⃣  Voir factures client...');
    const invoicesView = await request(API_URL)
        .get('/api/credit/my-invoices')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${userToken}`);
    
    if (invoicesView.status === 200) {
        console.log('   ✅ Factures trouvées:', invoicesView.body.data.total);
        invoicesView.body.data.invoices.forEach((inv, i) => {
            console.log(`      ${i+1}. ${inv.invoice_number} - ${inv.amount} FCFA - ${inv.status}`);
        });
    }
    
    // 8. Résumé du crédit
    console.log('\n8️⃣  Résumé crédit tenant...');
    const summaryRes = await request(API_URL)
        .get('/api/credit/admin/summary')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${adminToken}`);
    
    if (summaryRes.status === 200) {
        console.log('   📊 Total clients crédit:', summaryRes.body.data.total_clients);
        console.log('   💰 Crédit total accordé:', summaryRes.body.data.total_credit_limit);
        console.log('   📊 Dette totale:', summaryRes.body.data.total_debt);
        console.log('   ⏰ Factures en retard:', summaryRes.body.data.overdue_invoices);
    }
    
    console.log('\n✨ Test crédit client terminé !\n');
}

// Exécuter
testCreditClient().catch(console.error);