// backend/src/database/tenant-query.js
class TenantQuery {
    constructor(pool, tenantId) {
        this.pool = pool;
        this.tenantId = tenantId;
    }

    async query(text, params = []) {
        // Injecte automatiquement le tenant_id dans la requête
        const scopedText = text.replace(
            'FROM your_table',
            `FROM your_table WHERE tenant_id = $${params.length + 1}`
        );
        return this.pool.query(scopedText, [...params, this.tenantId]);
    }
}

// Dans vos routes
app.get('/api/data', async (req, res) => {
    const db = new TenantQuery(req.tenant.db, req.tenant.id);
    const data = await db.query('SELECT * FROM your_table');
    res.json(data.rows);
});