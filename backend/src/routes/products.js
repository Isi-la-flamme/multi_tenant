// backend/src/routes/products.js
app.get('/api/products', async (req, res) => {
    const db = req.tenant.db;
    const { rows } = await db.query(
        'SELECT * FROM products WHERE tenant_id = $1',
        [req.tenant.id]
    );
    res.json(rows);
});