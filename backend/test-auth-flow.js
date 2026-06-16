const request = require('supertest');
const app = require('./src/index');

async function testAuthFlow() {
    console.log('\n🔐 Test du flux d\'authentification\n');
    
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@demo.com`;
    const testPassword = 'Test123!';
    
    let accessToken = null;
    let refreshToken = null;
    
    // 1. TEST REGISTER
    console.log('1️⃣  Test Register...');
    const registerRes = await request(app)
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
        console.log('   ❌ Register échoué:', registerRes.body);
        return;
    }
    
    // 2. TEST LOGIN
    console.log('\n2️⃣  Test Login...');
    const loginRes = await request(app)
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
        console.log('   🔑 Access Token:', accessToken.substring(0, 50) + '...');
        console.log('   🔄 Refresh Token:', refreshToken.substring(0, 50) + '...');
    } else {
        console.log('   ❌ Login échoué:', loginRes.body);
        return;
    }
    
    // 3. TEST ACCÈS PROTÉGÉ
    console.log('\n3️⃣  Test accès route protégée...');
    const meRes = await request(app)
        .get('/api/me')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${accessToken}`);
    
    if (meRes.status === 200) {
        console.log('   ✅ Accès autorisé');
        console.log('   👤 Utilisateur:', meRes.body.data.user.email);
    } else {
        console.log('   ❌ Accès refusé:', meRes.status);
    }
    
    // 4. TEST REFRESH TOKEN
    console.log('\n4️⃣  Test Refresh Token...');
    const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('X-Tenant-Subdomain', 'demo')
        .send({ refreshToken });
    
    if (refreshRes.status === 200) {
        console.log('   ✅ Refresh token valide');
        console.log('   🆕 Nouveau token:', refreshRes.body.data.accessToken.substring(0, 50) + '...');
        accessToken = refreshRes.body.data.accessToken;
    } else {
        console.log('   ❌ Refresh échoué:', refreshRes.body);
    }
    
    // 5. TEST LOGOUT
    console.log('\n5️⃣  Test Logout...');
    const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('X-Tenant-Subdomain', 'demo')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });
    
    if (logoutRes.status === 200) {
        console.log('   ✅ Logout réussi');
    } else {
        console.log('   ❌ Logout échoué:', logoutRes.body);
    }
    
    // 6. TEST REFRESH APRÈS LOGOUT (doit échouer)
    console.log('\n6️⃣  Test Refresh après logout (doit échouer)...');
    const refreshAfterLogoutRes = await request(app)
        .post('/api/auth/refresh')
        .set('X-Tenant-Subdomain', 'demo')
        .send({ refreshToken });
    
    if (refreshAfterLogoutRes.status === 401) {
        console.log('   ✅ Refresh correctement refusé après logout');
    } else {
        console.log('   ⚠️  Refresh accepté après logout (bug potentiel)');
    }
    
    console.log('\n✨ Test terminé!\n');
}

// Exécuter le test
testAuthFlow().catch(console.error);