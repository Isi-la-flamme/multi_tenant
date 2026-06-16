const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { globalPool } = require('../config/database');
const currencyService = require('./currency-service');
const logger = require('../utils/logger');

class PDFService {
    
    // Générer une facture PDF
    async generateInvoice(invoiceId, tenantId) {
        // Récupérer les données de la facture
        const invoiceResult = await globalPool.query(
            `SELECT i.*, 
                    u.name as client_name, 
                    u.email as client_email,
                    t.name as tenant_name,
                    t.subdomain as tenant_subdomain
             FROM debt_invoices i
             JOIN users u ON i.user_id = u.id
             JOIN tenants t ON i.tenant_id = t.id
             WHERE i.id = $1 AND i.tenant_id = $2`,
            [invoiceId, tenantId]
        );
        
        if (invoiceResult.rows.length === 0) {
            throw new Error('Facture non trouvée');
        }
        
        const invoice = invoiceResult.rows[0];
        
        // Récupérer les paiements associés
        const paymentsResult = await globalPool.query(
            `SELECT * FROM debt_payments 
             WHERE invoice_id = $1 
             ORDER BY created_at DESC`,
            [invoiceId]
        );
        
        invoice.payments = paymentsResult.rows;
        
        // Générer le PDF
        return this.generatePDF(invoice);
    }
    
    // Générer le PDF à partir des données
    generatePDF(invoice) {
        return new Promise((resolve, reject) => {
            try {
                const chunks = [];
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: `Facture ${invoice.invoice_number}`,
                        Author: invoice.tenant_name,
                        Subject: 'Facture',
                        Keywords: 'facture, crédit',
                        Creator: 'SaaS Multitenant'
                    }
                });
                
                // Collecter les chunks
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                
                // ============================================
                // EN-TÊTE
                // ============================================
                
                // Logo (si disponible)
                // doc.image('logo.png', 50, 45, { width: 50 });
                
                // Titre
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .text('FACTURE', { align: 'center' })
                   .moveDown();
                
                // Numéro de facture
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`N°: ${invoice.invoice_number}`, { align: 'center' })
                   .moveDown(2);
                
                // ============================================
                // INFORMATIONS
                // ============================================
                
                // Coordonnées du vendeur
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text(invoice.tenant_name, 50, 150)
                   .font('Helvetica')
                   .text('SaaS Multitenant')
                   .text('Tél: +221 78 123 45 67')
                   .text('Email: contact@saas.com')
                   .moveDown();
                
                // Coordonnées du client
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('CLIENT', 350, 150)
                   .font('Helvetica')
                   .text(invoice.client_name)
                   .text(invoice.client_email)
                   .moveDown();
                
                // Ligne de séparation
                doc.moveTo(50, 250)
                   .lineTo(550, 250)
                   .stroke();
                
                // ============================================
                // DÉTAILS DE LA FACTURE
                // ============================================
                
                const startY = 270;
                let y = startY;
                
                doc.fontSize(10);
                
                // En-tête du tableau
                doc.font('Helvetica-Bold')
                   .text('Description', 50, y, { width: 250 })
                   .text('Montant', 350, y, { width: 100, align: 'right' })
                   .text('Statut', 450, y, { width: 100, align: 'center' });
                
                y += 20;
                
                // Ligne de séparation
                doc.moveTo(50, y)
                   .lineTo(550, y)
                   .stroke();
                
                y += 10;
                
                // Ligne de la facture
                const statusMap = {
                    'pending': 'En attente',
                    'partial': 'Partiel',
                    'paid': 'Payé',
                    'overdue': 'En retard',
                    'cancelled': 'Annulé'
                };
                
                const statusText = statusMap[invoice.status] || invoice.status;
                
                doc.font('Helvetica')
                   .text(invoice.description || 'Description non disponible', 50, y, { width: 250 })
                   .text(currencyService.formatPrice(invoice.amount), 350, y, { width: 100, align: 'right' })
                   .text(statusText, 450, y, { width: 100, align: 'center' });
                
                y += 25;
                
                // Ligne de séparation
                doc.moveTo(50, y)
                   .lineTo(550, y)
                   .stroke();
                
                y += 15;
                
                // ============================================
                // TOTAUX
                // ============================================
                
                // Montant total
                doc.font('Helvetica-Bold')
                   .text('Total', 350, y, { width: 100, align: 'right' })
                   .font('Helvetica')
                   .text(currencyService.formatPrice(invoice.amount), 450, y, { width: 100, align: 'right' });
                
                y += 20;
                
                // Montant payé
                doc.font('Helvetica-Bold')
                   .text('Payé', 350, y, { width: 100, align: 'right' })
                   .font('Helvetica')
                   .text(currencyService.formatPrice(invoice.amount_paid), 450, y, { width: 100, align: 'right' });
                
                y += 20;
                
                // Montant restant
                doc.font('Helvetica-Bold')
                   .text('Restant dû', 350, y, { width: 100, align: 'right' })
                   .font('Helvetica')
                   .text(currencyService.formatPrice(invoice.amount_remaining), 450, y, { width: 100, align: 'right' });
                
                y += 30;
                
                // ============================================
                // HISTORIQUE DES PAIEMENTS
                // ============================================
                
                if (invoice.payments && invoice.payments.length > 0) {
                    doc.font('Helvetica-Bold')
                       .text('Historique des paiements', 50, y, { width: 500, align: 'center' });
                    
                    y += 20;
                    
                    doc.fontSize(9)
                       .font('Helvetica-Bold')
                       .text('Date', 50, y)
                       .text('Méthode', 150, y)
                       .text('Référence', 250, y)
                       .text('Montant', 450, y, { align: 'right' });
                    
                    y += 15;
                    
                    doc.font('Helvetica');
                    invoice.payments.forEach((payment, index) => {
                        const date = new Date(payment.created_at).toLocaleDateString('fr-FR');
                        doc.text(date, 50, y)
                           .text(payment.payment_method || 'N/A', 150, y)
                           .text(payment.payment_reference || 'N/A', 250, y)
                           .text(currencyService.formatPrice(payment.amount), 450, y, { align: 'right' });
                        y += 15;
                    });
                    
                    y += 10;
                }
                
                // ============================================
                // PIED DE PAGE
                // ============================================
                
                // Ligne de séparation
                doc.moveTo(50, 750)
                   .lineTo(550, 750)
                   .stroke();
                
                doc.fontSize(8)
                   .font('Helvetica')
                   .text(`Facture générée le ${new Date().toLocaleDateString('fr-FR')}`, 50, 770)
                   .text(`Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, 350, 770);
                
                doc.end();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Sauvegarder le PDF sur le disque
    async saveInvoicePDF(invoiceId, tenantId, outputPath) {
        const pdfBuffer = await this.generateInvoice(invoiceId, tenantId);
        fs.writeFileSync(outputPath, pdfBuffer);
        return outputPath;
    }
}

module.exports = new PDFService();