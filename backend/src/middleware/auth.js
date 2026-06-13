function authenticateUser(req, res, next) {
    // Pour le moment, on laisse tout passer
    // Plus tard, vous ajouterez la vérification JWT
    
    // Simuler un utilisateur pour le test
    req.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'admin'
    };
    
    console.log(`✅ Utilisateur authentifié: ${req.user.email}`);
    next();
}

module.exports = { authenticateUser };