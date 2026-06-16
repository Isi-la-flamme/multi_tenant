const express = require('express');
const router = express.Router();
const creditClientService = require('../services/credit-client-service');
const userService = require('../services/user-service');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ForbiddenError, ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const pdfService = require('../services/pdf-service');


// ============================================
// MIDDLEWARE : Vérification admin
// ============================================
async function requireAdmin(req, res, next) {
    try {
        const profile = await userService.findProfileByTenant(req.user.id, req.tenant.id);
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            throw new ForbiddenError('Droits admin requis');
        }
        req.userProfile = profile;
        next();
    } catch (error) {
        next(error);
    }
}

// ============================================
// ROUTES CLIENT (authentifié)
// ============================================

// GET /api/credit/my-credit - Voir son crédit
router.get('/my-credit', authenticateUser, async (req, res, next) => {
    try {
        const credit = await creditClientService.getCreditLine(req.user.id, req.tenant.id);
        
        if (!credit) {
            return res.json({
                status: 'success',
                data: {
                    has_credit: false,
                    message: 'Aucune ligne de crédit pour ce client'
                }
            });
        }
        
        res.json({
            status: 'success',
            data: {
                has_credit: true,
                credit_limit: credit.credit_limit,
                used_amount: credit.used_amount,
                available_amount: credit.available_amount,
                payment_delay_days: credit.payment_delay_days,
                is_active: credit.is_active
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/credit/my-invoices - Voir ses factures
router.get('/my-invoices', authenticateUser, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const invoices = await creditClientService.getClientInvoices(
            req.user.id,
            req.tenant.id,
            limit,
            offset
        );
        
        res.json({
            status: 'success',
            data: {
                invoices,
                total: invoices.length,
                limit,
                offset
            }
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// ROUTES ADMIN (admin requis)
// ============================================

// POST /api/credit/admin/create-line - Créer une ligne de crédit
router.post('/admin/create-line', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const { userId, creditLimit, paymentDelayDays = 30, interestRate = 0 } = req.body;
        
        if (!userId) {
            throw new ValidationError('userId requis');
        }
        
        if (!creditLimit || creditLimit <= 0) {
            throw new ValidationError('creditLimit doit être positif');
        }
        
        const credit = await creditClientService.createCreditLine(
            userId,
            req.tenant.id,
            creditLimit,
            paymentDelayDays,
            interestRate,
            req.user.id
        );
        
        res.status(201).json({
            status: 'success',
            message: 'Ligne de crédit créée avec succès',
            data: credit
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/credit/admin/update-line - Mettre à jour une ligne de crédit
router.put('/admin/update-line', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const { userId, creditLimit, paymentDelayDays, interestRate, isActive } = req.body;
        
        if (!userId) {
            throw new ValidationError('userId requis');
        }
        
        const credit = await creditClientService.updateCreditLine(
            userId,
            req.tenant.id,
            { creditLimit, paymentDelayDays, interestRate, isActive }
        );
        
        res.json({
            status: 'success',
            message: 'Ligne de crédit mise à jour',
            data: credit
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/credit/admin/create-invoice - Créer une facture
router.post('/admin/create-invoice', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const { userId, amount, description, referenceId } = req.body;
        
        if (!userId) {
            throw new ValidationError('userId requis');
        }
        
        if (!amount || amount <= 0) {
            throw new ValidationError('amount doit être positif');
        }
        
        if (!description) {
            throw new ValidationError('description requise');
        }
        
        const invoice = await creditClientService.createInvoice(
            userId,
            req.tenant.id,
            amount,
            description,
            referenceId || null,
            req.user.id
        );
        
        res.status(201).json({
            status: 'success',
            message: 'Facture créée avec succès',
            data: invoice
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/credit/admin/pay - Enregistrer un paiement
router.post('/admin/pay', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const { userId, invoiceId, amount, paymentMethod, reference } = req.body;
        
        if (!userId) {
            throw new ValidationError('userId requis');
        }
        
        if (!invoiceId) {
            throw new ValidationError('invoiceId requis');
        }
        
        if (!amount || amount <= 0) {
            throw new ValidationError('amount doit être positif');
        }
        
        if (!paymentMethod) {
            throw new ValidationError('paymentMethod requis');
        }
        
        const payment = await creditClientService.recordPayment(
            userId,
            req.tenant.id,
            invoiceId,
            amount,
            paymentMethod,
            reference || null,
            req.user.id
        );
        
        res.json({
            status: 'success',
            message: 'Paiement enregistré avec succès',
            data: payment
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/credit/admin/invoices - Liste des factures du tenant
router.get('/admin/invoices', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const status = req.query.status || null;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const invoices = await creditClientService.getTenantInvoices(
            req.tenant.id,
            status,
            limit,
            offset
        );
        
        res.json({
            status: 'success',
            data: {
                invoices,
                total: invoices.length,
                limit,
                offset
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/credit/admin/overdue - Factures impayées
router.get('/admin/overdue', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const invoices = await creditClientService.getOverdueInvoices(req.tenant.id);
        
        res.json({
            status: 'success',
            data: {
                invoices,
                total: invoices.length
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/credit/admin/summary - Résumé du crédit
router.get('/admin/summary', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const summary = await creditClientService.getCreditSummary(req.tenant.id);
        
        res.json({
            status: 'success',
            data: summary
        });
    } catch (error) {
        next(error);
    }
});


// ============================================
// EXPORT PDF
// ============================================

// GET /api/credit/admin/invoice-pdf/:invoiceId - Admin exporte en PDF
router.get('/admin/invoice-pdf/:invoiceId', authenticateUser, requireAdmin, async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        
        // Vérifier que la facture existe
        const invoice = await creditClientService.getInvoice(invoiceId, req.tenant.id);
        if (!invoice) {
            throw new NotFoundError('Facture non trouvée');
        }
        
        // Générer le PDF
        const pdfBuffer = await pdfService.generateInvoice(invoiceId, req.tenant.id);
        
        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoice_number}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
});

// GET /api/credit/my-invoice-pdf/:invoiceId - Client exporte sa facture
router.get('/my-invoice-pdf/:invoiceId', authenticateUser, async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        
        // Vérifier que la facture appartient au client
        const invoice = await creditClientService.getInvoice(invoiceId, req.tenant.id);
        if (!invoice) {
            throw new NotFoundError('Facture non trouvée');
        }
        
        if (invoice.user_id !== req.user.id) {
            throw new ForbiddenError('Cette facture ne vous appartient pas');
        }
        
        // Générer le PDF
        const pdfBuffer = await pdfService.generateInvoice(invoiceId, req.tenant.id);
        
        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoice_number}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
});

module.exports = router;