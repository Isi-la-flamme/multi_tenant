const { globalPool } = require('../config/database');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class WalletService {
    
    // Obtenir ou créer un wallet
    async getOrCreateWallet(userId, tenantId, client = null) {
        const db = client || globalPool;
        
        let { rows } = await db.query(
            `SELECT * FROM wallets 
             WHERE user_id = $1 AND tenant_id = $2 AND is_active = true`,
            [userId, tenantId]
        );
        
        if (rows.length === 0) {
            const result = await db.query(
                `INSERT INTO wallets (user_id, tenant_id, balance) 
                 VALUES ($1, $2, 0) 
                 RETURNING *`,
                [userId, tenantId]
            );
            rows = result.rows;
        }
        
        return rows[0];
    }
    
    // Obtenir le solde
    async getBalance(userId, tenantId) {
        const wallet = await this.getOrCreateWallet(userId, tenantId);
        return { balance: parseFloat(wallet.balance), currency: wallet.currency };
    }
    
    // Créditer un utilisateur
    async credit(userId, tenantId, amount, description, metadata = {}, adminId = null) {
        if (amount <= 0) {
            throw new ValidationError('Le montant doit être positif');
        }
        
        const client = await globalPool.connect();
        
        try {
            await client.query('BEGIN');
            
            const wallet = await this.getOrCreateWallet(userId, tenantId, client);
            const newBalance = parseFloat(wallet.balance) + amount;
            
            // Mettre à jour le wallet
            await client.query(
                `UPDATE wallets SET balance = $1, updated_at = NOW() 
                 WHERE id = $2`,
                [newBalance, wallet.id]
            );
            
            // Enregistrer la transaction
            const { rows } = await client.query(
                `INSERT INTO transactions 
                 (wallet_id, user_id, tenant_id, type, amount, balance_after, description, metadata, created_by)
                 VALUES ($1, $2, $3, 'credit', $4, $5, $6, $7, $8)
                 RETURNING *`,
                [wallet.id, userId, tenantId, amount, newBalance, description, JSON.stringify(metadata), adminId]
            );
            
            await client.query('COMMIT');
            
            logger.tenant(tenantId, `💰 Crédit de ${amount} pour utilisateur ${userId}`);
            
            return {
                success: true,
                balance: newBalance,
                transaction: rows[0]
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
    
    // Débiter un utilisateur
    async debit(userId, tenantId, amount, description, metadata = {}, adminId = null) {
        if (amount <= 0) {
            throw new ValidationError('Le montant doit être positif');
        }
        
        const client = await globalPool.connect();
        
        try {
            await client.query('BEGIN');
            
            const wallet = await this.getOrCreateWallet(userId, tenantId, client);
            
            if (parseFloat(wallet.balance) < amount) {
                throw new ValidationError('Solde insuffisant');
            }
            
            const newBalance = parseFloat(wallet.balance) - amount;
            
            // Mettre à jour le wallet
            await client.query(
                `UPDATE wallets SET balance = $1, updated_at = NOW() 
                 WHERE id = $2`,
                [newBalance, wallet.id]
            );
            
            // Enregistrer la transaction
            const { rows } = await client.query(
                `INSERT INTO transactions 
                 (wallet_id, user_id, tenant_id, type, amount, balance_after, description, metadata, created_by)
                 VALUES ($1, $2, $3, 'debit', $4, $5, $6, $7, $8)
                 RETURNING *`,
                [wallet.id, userId, tenantId, amount, newBalance, description, JSON.stringify(metadata), adminId]
            );
            
            await client.query('COMMIT');
            
            logger.tenant(tenantId, `💰 Débit de ${amount} pour utilisateur ${userId}`);
            
            return {
                success: true,
                balance: newBalance,
                transaction: rows[0]
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
    
    // Historique des transactions
    async getTransactions(userId, tenantId, limit = 50, offset = 0) {
        const { rows } = await globalPool.query(
            `SELECT t.*, u.name as user_name
             FROM transactions t
             LEFT JOIN users u ON t.created_by = u.id
             WHERE t.user_id = $1 AND t.tenant_id = $2
             ORDER BY t.created_at DESC
             LIMIT $3 OFFSET $4`,
            [userId, tenantId, limit, offset]
        );
        
        const { rows: countRows } = await globalPool.query(
            `SELECT COUNT(*) FROM transactions 
             WHERE user_id = $1 AND tenant_id = $2`,
            [userId, tenantId]
        );
        
        return {
            transactions: rows,
            total: parseInt(countRows[0].count),
            limit,
            offset
        };
    }
    
    // Admin : lister les wallets d'un tenant
    async getTenantWallets(tenantId, limit = 50, offset = 0) {
        const { rows } = await globalPool.query(
            `SELECT w.*, u.email, u.name
             FROM wallets w
             JOIN users u ON w.user_id = u.id
             WHERE w.tenant_id = $1 AND w.is_active = true
             ORDER BY w.balance DESC
             LIMIT $2 OFFSET $3`,
            [tenantId, limit, offset]
        );
        
        return rows;
    }
}

module.exports = new WalletService();