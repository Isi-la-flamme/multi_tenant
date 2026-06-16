
const { globalPool } = require('../config/database');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const currencyService = require('./currency-service');

class CreditClientService {
    
    async createCreditLine(userId, tenantId, creditLimit, paymentDelayDays = 30, interestRate = 0, createdBy = null) {
        const existing = await this.getCreditLine(userId, tenantId);
        if (existing) {
            throw new ValidationError('Ce client a déjà une ligne de crédit');
        }
        if (creditLimit <= 0) {
            throw new ValidationError('Le plafond de crédit doit être positif');
        }
        const { rows } = await globalPool.query(
            `INSERT INTO client_credits 
             (user_id, tenant_id, credit_limit, used_amount, available_amount, payment_delay_days, interest_rate, created_by)
             VALUES ($1, $2, $3, 0, $3, $4, $5, $6)
             RETURNING *`,
            [userId, tenantId, creditLimit, paymentDelayDays, interestRate, createdBy]
        );
        logger.tenant(tenantId, `✅ Ligne de crédit créée pour utilisateur ${userId}: ${currencyService.formatPrice(creditLimit)}`);
        return rows[0];
    }
    
    async getCreditLine(userId, tenantId) {
        const { rows } = await globalPool.query(
            `SELECT * FROM client_credits 
             WHERE user_id = $1 AND tenant_id = $2 AND is_active = true`,
            [userId, tenantId]
        );
        return rows[0] || null;
    }
    
    async updateCreditLine(userId, tenantId, updates) {
        const credit = await this.getCreditLine(userId, tenantId);
        if (!credit) {
            throw new NotFoundError('Ligne de crédit non trouvée');
        }
        const { creditLimit, paymentDelayDays, interestRate, isActive } = updates;
        const { rows } = await globalPool.query(
            `UPDATE client_credits 
             SET credit_limit = COALESCE($1, credit_limit),
                 payment_delay_days = COALESCE($2, payment_delay_days),
                 interest_rate = COALESCE($3, interest_rate),
                 is_active = COALESCE($4, is_active),
                 updated_at = NOW()
             WHERE user_id = $5 AND tenant_id = $6
             RETURNING *`,
            [creditLimit, paymentDelayDays, interestRate, isActive, userId, tenantId]
        );
        logger.tenant(tenantId, `📝 Ligne de crédit mise à jour pour utilisateur ${userId}`);
        return rows[0];
    }
    
    async createInvoice(userId, tenantId, amount, description, referenceId = null, createdBy = null) {
        const credit = await this.getCreditLine(userId, tenantId);
        if (!credit) {
            throw new NotFoundError('Aucune ligne de crédit trouvée pour ce client');
        }
        if (parseFloat(credit.available_amount) < amount) {
            throw new ValidationError(`Crédit insuffisant. Disponible: ${currencyService.formatPrice(credit.available_amount)}`);
        }
        if (amount <= 0) {
            throw new ValidationError('Le montant doit être positif');
        }
        let validReferenceId = null;
        if (referenceId) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(referenceId)) {
                validReferenceId = referenceId;
            }
        }
        const client = await globalPool.connect();
        try {
            await client.query('BEGIN');
            const invoiceNumber = `FACT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + credit.payment_delay_days);
            const { rows } = await client.query(
                `INSERT INTO debt_invoices 
                 (tenant_id, user_id, client_credit_id, invoice_number, amount, 
                  amount_remaining, due_date, description, reference_id, created_by)
                 VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [tenantId, userId, credit.id, invoiceNumber, amount, dueDate, description, validReferenceId, createdBy]
            );
            const invoice = rows[0];
            await client.query(
                `UPDATE client_credits 
                 SET used_amount = used_amount + $1, available_amount = available_amount - $1, updated_at = NOW()
                 WHERE id = $2`,
                [amount, credit.id]
            );
            let walletResult = await client.query(
                `SELECT id, balance FROM wallets WHERE user_id = $1 AND tenant_id = $2`,
                [userId, tenantId]
            );
            let walletId, currentBalance;
            if (walletResult.rows.length === 0) {
                const newWallet = await client.query(
                    `INSERT INTO wallets (user_id, tenant_id, balance) VALUES ($1, $2, 0) RETURNING id, balance`,
                    [userId, tenantId]
                );
                walletId = newWallet.rows[0].id;
                currentBalance = 0;
            } else {
                walletId = walletResult.rows[0].id;
                currentBalance = parseFloat(walletResult.rows[0].balance);
            }
            const newBalance = currentBalance - amount;
            await client.query(
                `INSERT INTO transactions 
                 (wallet_id, user_id, tenant_id, type, amount, balance_after, description, metadata)
                 VALUES ($1, $2, $3, 'debit', $4, $5, $6, $7)`,
                [walletId, userId, tenantId, amount, newBalance, 
                 `Facture ${invoiceNumber} - ${description}`, JSON.stringify({ invoiceId: invoice.id })]
            );
            await client.query(`UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2`, [newBalance, walletId]);
            await client.query('COMMIT');
            logger.tenant(tenantId, `📄 Facture ${invoiceNumber} créée: ${currencyService.formatPrice(amount)}`);
            return invoice;
        } catch (err) {
            await client.query('ROLLBACK');
            logger.error('Erreur createInvoice:', err.message);
            throw err;
        } finally {
            client.release();
        }
    }
    
    async getInvoice(invoiceId, tenantId) {
        const { rows } = await globalPool.query(
            `SELECT i.*, u.name as client_name, u.email as client_email
             FROM debt_invoices i JOIN users u ON i.user_id = u.id
             WHERE i.id = $1 AND i.tenant_id = $2`,
            [invoiceId, tenantId]
        );
        return rows[0] || null;
    }
    
    async getClientInvoices(userId, tenantId, limit = 50, offset = 0) {
        const { rows } = await globalPool.query(
            `SELECT * FROM debt_invoices WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
            [userId, tenantId, limit, offset]
        );
        return rows;
    }
    
    async getTenantInvoices(tenantId, status = null, limit = 50, offset = 0) {
        let query = `SELECT * FROM debt_invoices WHERE tenant_id = $1`;
        const params = [tenantId];
        if (status) {
            query += ` AND status = $2`;
            params.push(status);
        }
        query += ` ORDER BY due_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const { rows } = await globalPool.query(query, params);
        return rows;
    }
    
    async recordPayment(userId, tenantId, invoiceId, amount, paymentMethod, reference = null, createdBy = null) {
        const client = await globalPool.connect();
        try {
            await client.query('BEGIN');
            const invoiceResult = await client.query(
                `SELECT *, client_credit_id FROM debt_invoices WHERE id = $1::UUID AND tenant_id = $2::UUID`,
                [invoiceId, tenantId]
            );
            if (invoiceResult.rows.length === 0) {
                throw new NotFoundError('Facture non trouvée');
            }
            const invoice = invoiceResult.rows[0];
            const creditId = invoice.client_credit_id;
            const amountRemaining = parseFloat(invoice.amount_remaining);
            if (amount > amountRemaining) {
                throw new ValidationError(`Le montant dépasse le solde restant: ${currencyService.formatPrice(amountRemaining)}`);
            }
            if (amount <= 0) {
                throw new ValidationError('Le montant doit être positif');
            }
            const { rows } = await client.query(
                `INSERT INTO debt_payments 
                 (tenant_id, user_id, invoice_id, amount, payment_method, payment_reference, created_by)
                 VALUES ($1::UUID, $2::UUID, $3::UUID, $4, $5, $6, $7::UUID)
                 RETURNING *`,
                [tenantId, userId, invoiceId, amount, paymentMethod, reference, createdBy]
            );
            const payment = rows[0];
            const newRemaining = amountRemaining - amount;
            const newPaid = parseFloat(invoice.amount_paid) + amount;
            const status = newRemaining === 0 ? 'paid' : 'partial';
            await client.query(
                `UPDATE debt_invoices 
                 SET amount_paid = $1, amount_remaining = $2, status = $3, 
                     paid_at = CASE WHEN $3 = 'paid' THEN NOW() ELSE paid_at END,
                     updated_at = NOW()
                 WHERE id = $4::UUID`,
                [newPaid, newRemaining, status, invoiceId]
            );
            await client.query(
                `UPDATE client_credits 
                 SET used_amount = used_amount - $1, available_amount = available_amount + $1, updated_at = NOW()
                 WHERE id = $2::UUID`,
                [amount, creditId]
            );
            let walletResult = await client.query(
                `SELECT id, balance FROM wallets WHERE user_id = $1::UUID AND tenant_id = $2::UUID`,
                [userId, tenantId]
            );
            let walletId, currentBalance;
            if (walletResult.rows.length === 0) {
                const newWallet = await client.query(
                    `INSERT INTO wallets (user_id, tenant_id, balance) VALUES ($1::UUID, $2::UUID, 0) RETURNING id, balance`,
                    [userId, tenantId]
                );
                walletId = newWallet.rows[0].id;
                currentBalance = 0;
            } else {
                walletId = walletResult.rows[0].id;
                currentBalance = parseFloat(walletResult.rows[0].balance);
            }
            const newBalance = currentBalance + amount;
            await client.query(
                `INSERT INTO transactions 
                 (wallet_id, user_id, tenant_id, type, amount, balance_after, description, metadata)
                 VALUES ($1::UUID, $2::UUID, $3::UUID, 'credit', $4, $5, $6, $7)`,
                [walletId, userId, tenantId, amount, newBalance, 
                 `Paiement facture ${invoice.invoice_number}`, JSON.stringify({ invoiceId })]
            );
            await client.query(`UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2::UUID`, [newBalance, walletId]);
            await client.query('COMMIT');
            logger.tenant(tenantId, `💳 Paiement de ${currencyService.formatPrice(amount)} enregistré pour facture ${invoice.invoice_number}`);
            return payment;
        } catch (err) {
            await client.query('ROLLBACK');
            logger.error('Erreur recordPayment:', err.message);
            throw err;
        } finally {
            client.release();
        }
    }
    
    async getOverdueInvoices(tenantId) {
        const { rows } = await globalPool.query(
            `SELECT i.*, u.name as client_name, u.email as client_email
             FROM debt_invoices i JOIN users u ON i.user_id = u.id
             WHERE i.tenant_id = $1 AND i.status IN ('pending', 'partial') AND i.due_date < NOW()
             ORDER BY i.due_date ASC`,
            [tenantId]
        );
        return rows;
    }
    
    async getCreditSummary(tenantId) {
        const { rows } = await globalPool.query(
            `SELECT 
                COUNT(*) as total_clients,
                SUM(credit_limit) as total_credit_limit,
                SUM(used_amount) as total_used,
                SUM(available_amount) as total_available,
                (SELECT COUNT(*) FROM debt_invoices WHERE tenant_id = $1 AND status = 'pending') as pending_invoices,
                (SELECT COUNT(*) FROM debt_invoices WHERE tenant_id = $1 AND status = 'overdue') as overdue_invoices,
                (SELECT SUM(amount_remaining) FROM debt_invoices WHERE tenant_id = $1 AND status IN ('pending', 'partial')) as total_debt
             FROM client_credits WHERE tenant_id = $1 AND is_active = true`,
            [tenantId]
        );
        return rows[0] || { total_clients: 0, total_credit_limit: 0, total_used: 0, total_available: 0, pending_invoices: 0, overdue_invoices: 0, total_debt: 0 };
    }
}

module.exports = new CreditClientService();
