const request = require('supertest');

// Utiliser l'API déjà démarrée sur localhost:3000
const API_URL = 'http://localhost:3000';

async function testAuthFlow() {
    console.log('\n🔐 Test du flux d\'authentification\n');
    
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@demo.com`;
    const testPassword = 'Test123!';
    
    let accessToken = null;
    let refreshToken = null;
    
    // 1. TEST REGISTER
    console.log('1️⃣  Test Register...');
    try {
        const registerRes = await request(API_URL)
            .post('/api/auth/register')
            .set('X-Tenant-Subdomain', 'demo')
            .send({
                email: testEmail,
                password: testPassword,
                name: 'Test User'
            });
        
        if (registerRes.status === 201) {
            console.log('   ✅ Register réussi');
            console.log('   📧 Email:', testEmail);
        } else {
            console.log('   ❌ Register échoué:', registerRes.status, registerRes.body);
            return;
        }
    } catch (err) {
        console.log('   ❌ Erreur réseau:', err.message);
        return;
    }
    
    // 2. TEST LOGIN
    console.log('\n2️⃣  Test Login...');
    try {
        const loginRes = await request(API_URL)
            .post('/api/auth/login')
            .set('X-Tenant-Subdomain', 'demo')
            .send({
                email: testEmail,
                password: testPassword
            });
        
        if (loginRes.status === 200) {
            console.log('   ✅ Login réussi');
            accessToken = loginRes.body.data.accessToken;
            refreshToken = loginRes.body.data.refreshToken;
            console.log('   🔑 Access Token obtenu');
            console.log('   🔄 Refresh Token obtenu');
        } else {
            console.log('   ❌ Login échoué:', loginRes.status, loginRes.body);
            return;
        }
    } catch (err) {
        console.log('   ❌ Erreur réseau:', err.message);
        return;
    }
    
    // 3. TEST ACCÈS PROTÉGÉ
    console.log('\n3️⃣  Test accès route protégée...');
    try {
        const meRes = await request(API_URL)
            .get('/api/me')
            .set('X-Tenant-Subdomain', 'demo')
            .set('Authorization', `Bearer ${accessToken}`);
        
        if (meRes.status === 200) {
            console.log('   ✅ Accès autorisé');
            console.log('   👤 Utilisateur:', meRes.body.data.user.email);
        } else {
            console.log('   ❌ Accès refusé:', meRes.status);
        }
    } catch (err) {
        console.log('   ❌ Erreur:', err.message);
    }
    
    // 4. TEST REFRESH TOKEN
    console.log('\n4️⃣  Test Refresh Token...');
    try {
        const refreshRes = await request(API_URL)
            .post('/api/auth/refresh')
            .set('X-Tenant-Subdomain', 'demo')
            .send({ refreshToken });
        
        if (refreshRes.status === 200) {
            console.log('   ✅ Refresh token valide');
            console.log('   🆕 Nouveau token obtenu');
            accessToken = refreshRes.body.data.accessToken;
        } else {
            console.log('   ❌ Refresh échoué:', refreshRes.status, refreshRes.body);
        }
    } catch (err) {
        console.log('   ❌ Erreur:', err.message);
    }
    
    // 5. TEST LOGOUT
    console.log('\n5️⃣  Test Logout...');
    try {
        const logoutRes = await request(API_URL)
            .post('/api/auth/logout')
            .set('X-Tenant-Subdomain', 'demo')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ refreshToken });
        
        if (logoutRes.status === 200) {
            console.log('   ✅ Logout réussi');
        } else {
            console.log('   ❌ Logout échoué:', logoutRes.status, logoutRes.body);
        }
    } catch (err) {
        console.log('   ❌ Erreur:', err.message);
    }
    
    console.log('\n✨ Test terminé!\n');
}

// Exécuter le test
testAuthFlow().catch(console.error);