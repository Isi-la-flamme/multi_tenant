// backend/src/config/tenant-database.js (nouveau)
class TenantAwarePool {
    constructor(globalPool) {
        this.pool = globalPool;
    }

    async query(tenantId, text, params = []) {
        // AST simple: on injecte tenant_id = $X dans le WHERE
        const injectedText = this.injectTenantFilter(text);
        const injectedParams = [tenantId, ...params];
        return this.pool.query(injectedText, injectedParams);
    }

    injectTenantFilter(sql) {
        // Logique simple pour ajouter "AND tenant_id = $1"
        // Attention: parser du SQL est complexe. Une meilleure approche:
        // - Utiliser un query builder comme Knex.js
        // - Ou forcer le pattern: toutes les requêtes commencent par "SELECT ... WHERE tenant_id = $1"
        if (sql.includes('WHERE')) {
            return sql.replace('WHERE', 'WHERE tenant_id = $1 AND');
        }
        return sql + ' WHERE tenant_id = $1';
    }
}