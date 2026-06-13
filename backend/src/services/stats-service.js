const { globalPool } = require('../config/database');
const logger = require('../utils/logger');

class StatsService {
    
    // ============================================
    // Dashboard complet d'un tenant
    // ============================================
    async getDashboard(tenantId) {
        const [
            products,
            users,
            activeProducts,
            inactiveProducts,
            usersByRole,
            recentProducts,
            recentUsers
        ] = await Promise.all([
            this.countProducts(tenantId),
            this.countUsers(tenantId),
            this.countProductsByStatus(tenantId, true),
            this.countProductsByStatus(tenantId, false),
            this.countUsersByRole(tenantId),
            this.getRecentProducts(tenantId, 5),
            this.getRecentUsers(tenantId, 5)
        ]);
        
        return {
            totals: {
                products,
                users,
                activeProducts,
                inactiveProducts
            },
            usersByRole,
            recentProducts,
            recentUsers
        };
    }
    
    // ============================================
    // Compteurs
    // ============================================
    async countProducts(tenantId) {
        const { rows } = await globalPool.query(
            'SELECT COUNT(*) FROM products WHERE tenant_id = $1',
            [tenantId]
        );
        return parseInt(rows[0].count);
    }
    
    async countProductsByStatus(tenantId, isActive) {
        const { rows } = await globalPool.query(
            'SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND is_active = $2',
            [tenantId, isActive]
        );
        return parseInt(rows[0].count);
    }
    
    async countUsers(tenantId) {
        const { rows } = await globalPool.query(
            `SELECT COUNT(*) FROM profiles WHERE tenant_id = $1 AND is_active = true`,
            [tenantId]
        );
        return parseInt(rows[0].count);
    }
    
    async countUsersByRole(tenantId) {
        const { rows } = await globalPool.query(
            `SELECT role, COUNT(*) as count 
             FROM profiles 
             WHERE tenant_id = $1 AND is_active = true 
             GROUP BY role 
             ORDER BY count DESC`,
            [tenantId]
        );
        return rows;
    }
    
    // ============================================
    // Éléments récents
    // ============================================
    async getRecentProducts(tenantId, limit = 5) {
        const { rows } = await globalPool.query(
            `SELECT id, name, price, is_active, created_at 
             FROM products 
             WHERE tenant_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [tenantId, limit]
        );
        return rows;
    }
    
    async getRecentUsers(tenantId, limit = 5) {
        const { rows } = await globalPool.query(
            `SELECT u.id, u.email, u.name, p.role, p.created_at 
             FROM users u
             JOIN profiles p ON u.id = p.user_id
             WHERE p.tenant_id = $1
             ORDER BY p.created_at DESC 
             LIMIT $2`,
            [tenantId, limit]
        );
        return rows;
    }
    
    // ============================================
    // Statistiques d'activité
    // ============================================
    async getProductsCreatedByDay(tenantId, days = 7) {
        const { rows } = await globalPool.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM products 
             WHERE tenant_id = $1 AND created_at >= CURRENT_DATE - $2::INTEGER
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [tenantId, days]
        );
        return rows;
    }
    
    async getUsersJoinedByDay(tenantId, days = 7) {
        const { rows } = await globalPool.query(
            `SELECT DATE(p.created_at) as date, COUNT(*) as count
             FROM profiles p
             WHERE p.tenant_id = $1 AND p.created_at >= CURRENT_DATE - $2::INTEGER
             GROUP BY DATE(p.created_at)
             ORDER BY date ASC`,
            [tenantId, days]
        );
        return rows;
    }
    
    // ============================================
    // Stats globales (admin seulement)
    // ============================================
    async getGlobalStats() {
        const [
            totalTenants,
            totalUsers,
            totalProducts,
            tenantsWithStats
        ] = await Promise.all([
            globalPool.query('SELECT COUNT(*) FROM tenants WHERE is_active = true'),
            globalPool.query('SELECT COUNT(*) FROM users WHERE is_active = true'),
            globalPool.query('SELECT COUNT(*) FROM products WHERE is_active = true'),
            this.getAllTenantsStats()
        ]);
        
        return {
            totalTenants: parseInt(totalTenants.rows[0].count),
            totalUsers: parseInt(totalUsers.rows[0].count),
            totalProducts: parseInt(totalProducts.rows[0].count),
            tenants: tenantsWithStats
        };
    }
    
    async getAllTenantsStats() {
        const { rows } = await globalPool.query(
            `SELECT t.id, t.name, t.subdomain, t.created_at,
                    (SELECT COUNT(*) FROM profiles WHERE tenant_id = t.id) as users_count,
                    (SELECT COUNT(*) FROM products WHERE tenant_id = t.id) as products_count
             FROM tenants t
             WHERE t.is_active = true
             ORDER BY t.created_at DESC`
        );
        return rows;
    }
}

module.exports = new StatsService();