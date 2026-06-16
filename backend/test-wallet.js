const request = require('supertest');

const API_URL = 'http://localhost:3000';

async function testWallet() {
    console.log('\n💰 TEST WALLETS & CREDITS\n');
    
    let userToken = null;
    
    // 1. Créer un utilisateur
    console.log('1️⃣  Création utilisateur...');
    const timestamp = Date.now();
    const testEmail = `wallet-${timestamp}@demo.com`;
    
    const registerRes = await request(API_URL)
        .post('/api/auth/register')
        .set('X-Tenant-Subdomain', 'demo')
        .send({
            email: testEmail,
            password: 'Test123!',
            name: 'Wallet Tester'
        });
    
    if (registerRes.status === 201) {
        console.log('   ✅ Utilisateur créé:', testEmail);
    } else {
        console.log('   ❌ Erreur création:', registerRes.body);
        return;
    }
    
    // 2. Login pour obtenir token
    console.log('\n2️⃣  Login...');
    const loginRes = await request(API_URL)
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'demo')
        .send({
            email: testEmail,
            password: 'Test123!'
        });
    
    if (loginRes.status === 200) {
        userToken = loginRes.body.data.accessToken;
        console.log('   ✅ Token obtenu');
    } else {
        console.log('   ❌ Login échoué:', loginRes.body);
        return;
    }
    
    // 3. Voir le solde
    console.log('\n3️⃣  Voir solde...');
    const balanceRes = await request(API_URL)
        .get('/api/wallet/balance')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${userToken}`);
    
    if (balanceRes.status === 200) {
        console.log('   ✅ Solde:', balanceRes.body.data.balance, balanceRes.body.data.currency);
    } else {
        console.log('   ❌ Erreur:', balanceRes.status, balanceRes.body);
    }
    
    // 4. Voir historique
    console.log('\n4️⃣  Voir historique...');
    const historyRes = await request(API_URL)
        .get('/api/wallet/transactions')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${userToken}`);
    
    if (historyRes.status === 200) {
        console.log('   ✅ Transactions:', historyRes.body.data.total);
    } else {
        console.log('   ❌ Erreur:', historyRes.status, historyRes.body);
    }
    
    console.log('\n✨ Test terminé !\n');
}

// Créer admin si nécessaire
async function createAdmin() {
    console.log('\n👑 Création admin si nécessaire...\n');
    
    // Vérifier si admin existe déjà
    const loginRes = await request(API_URL)
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'demo')
        .send({
            email: 'admin@demo.com',
            password: 'Admin123!'
        });
    
    if (loginRes.status === 200) {
        console.log('   ✅ Admin existe déjà');
        return loginRes.body.data.accessToken;
    }
    
    // Créer admin
    console.log('   Création admin...');
    const registerRes = await request(API_URL)
        .post('/api/auth/register')
        .set('X-Tenant-Subdomain', 'demo')
        .send({
            email: 'admin@demo.com',
            password: 'Admin123!',
            name: 'Administrator'
        });
    
    if (registerRes.status === 201) {
        console.log('   ✅ Admin créé');
        // Mettre à jour le rôle
        const loginNew = await request(API_URL)
            .post('/api/auth/login')
            .set('X-Tenant-Subdomain', 'demo')
            .send({ email: 'admin@demo.com', password: 'Admin123!' });
        
        return loginNew.body.data.accessToken;
    }
    
    console.log('   ⚠️ Impossible de créer admin');
    return null;
}

async function testAdminWallet() {
    console.log('\n👑 TEST ADMIN - CREDITS & DEBITS\n');
    
    let adminToken = await createAdmin();
    if (!adminToken) {
        console.log('   ❌ Pas de token admin, arrêt');
        return;
    }
    
    let targetUserId = null;
    
    // 1. Créer un utilisateur cible
    console.log('\n1️⃣  Création utilisateur cible...');
    const timestamp = Date.now();
    const testEmail = `target-${timestamp}@demo.com`;
    
    const registerRes = await request(API_URL)
        .post('/api/auth/register')
        .set('X-Tenant-Subdomain', 'demo')
        .send({
            email: testEmail,
            password: 'Test123!',
            name: 'Target User'
        });
    
    if (registerRes.status === 201) {
        targetUserId = registerRes.body.data.user.id;
        console.log('   ✅ Utilisateur créé:', testEmail);
        console.log('   📍 ID:', targetUserId);
    } else {
        console.log('   ❌ Erreur:', registerRes.body);
        return;
    }
    
    // 2. Créditer l'utilisateur
    console.log('\n2️⃣  Crédit de 100€...');
    const creditRes = await request(API_URL)
        .post('/api/wallet/credit')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            userId: targetUserId,
            amount: 100,
            description: 'Bonus de bienvenue'
        });
    
    if (creditRes.status === 200) {
        console.log('   ✅ Crédit réussi');
        console.log('   💰 Nouveau solde:', creditRes.body.data.balance);
    } else {
        console.log('   ❌ Erreur:', creditRes.status, creditRes.body);
    }
    
    // 3. Débiter l'utilisateur
    console.log('\n3️⃣  Débit de 30€...');
    const debitRes = await request(API_URL)
        .post('/api/wallet/debit')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            userId: targetUserId,
            amount: 30,
            description: 'Achat de services'
        });
    
    if (debitRes.status === 200) {
        console.log('   ✅ Débit réussi');
        console.log('   💰 Nouveau solde:', debitRes.body.data.balance);
    } else {
        console.log('   ❌ Erreur:', debitRes.status, debitRes.body);
    }
    
    // 4. Voir le solde final
    console.log('\n4️⃣  Vérification solde final...');
    const userLogin = await request(API_URL)
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'demo')
        .send({ email: testEmail, password: 'Test123!' });
    
    if (userLogin.status === 200) {
        const userToken = userLogin.body.data.accessToken;
        const balanceRes = await request(API_URL)
            .get('/api/wallet/balance')
            .set('X-Tenant-Subdomain', 'demo')
            .set('Authorization', `Bearer ${userToken}`);
        
        if (balanceRes.status === 200) {
            console.log('   ✅ Solde final:', balanceRes.body.data.balance, '€');
        }
    }
    
    console.log('\n✨ Test admin terminé !\n');
}

// Exécuter les tests
async function run() {
    await testWallet();
    await testAdminWallet();
}

run().catch(console.error);