#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de configuration Shadcn/ui et création des services API
Auteur: Tenant SaaS
Usage: python setup-shadcn-services.py
"""

import os
import json
import subprocess
from pathlib import Path
import sys


# Couleurs pour l'affichage
class Colors:
    GREEN = '\033[32m'
    BLUE = '\033[34m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    NC = '\033[0m'

def log(message):
    print(f"{Colors.BLUE}➜ {Colors.NC}{message}")

def success(message):
    print(f"{Colors.GREEN}✓ {Colors.NC}{message}")

def error(message):
    print(f"{Colors.RED}✗ {Colors.NC}{message}")

def run_command(command, cwd=None):
    """Exécute une commande shell"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, cwd=cwd)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def create_file(path, content):
    """Crée un fichier avec son contenu"""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    """Fonction principale"""
    print(f"{Colors.CYAN}🚀 Configuration de Shadcn/ui et création des services API...{Colors.NC}\n")
    
    # Vérification que le dossier frontend existe
    if not os.path.exists("frontend"):
        error("Le dossier 'frontend' n'existe pas. Lancez d'abord le script de création.")
        sys.exit(1)
    
    os.chdir("frontend")
    
    # ============================================
    # 1. INITIALISATION DE SHADCN/UI
    # ============================================
    log("Initialisation de Shadcn/ui...")
    
    # Vérifier si shadcn est déjà installé
    if not os.path.exists("components.json"):
        success_flag, output = run_command("npx shadcn-ui@latest init -y")
        if not success_flag:
            error(f"Erreur lors de l'init de Shadcn: {output}")
        else:
            success("Shadcn/ui initialisé avec succès")
    else:
        success("Shadcn/ui déjà configuré")
    
    # Installation des composants Shadcn/ui
    log("Installation des composants Shadcn/ui...")
    components = [
        "button",
        "card",
        "dialog",
        "dropdown-menu",
        "form",
        "input",
        "label",
        "select",
        "table",
        "tabs",
        "toast",
        "alert",
        "badge",
        "sheet",
        "avatar",
        "separator",
        "skeleton",
        "progress",
        "switch",
        "checkbox",
        "radio-group"
    ]
    
    for component in components:
        log(f"Installation de {component}...")
        success_flag, output = run_command(f"npx shadcn-ui@latest add {component} -y")
        if success_flag:
            success(f"{component} installé")
        else:
            error(f"Erreur pour {component}: {output}")
    
    # ============================================
    # 2. CRÉATION DES SERVICES API
    # ============================================
    log("\nCréation des services API...")
    
    # 2.1. Service de base (api/client.ts déjà créé)
    # On va ajouter les endpoints
    endpoints_content = '''// src/lib/api/endpoints.ts
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  
  // Products
  PRODUCTS: {
    BASE: '/products',
    GET_ALL: '/products',
    GET_BY_ID: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
  },
  
  // Credits
  CREDITS: {
    BASE: '/credit-client',
    GET_ALL: '/credit-client',
    GET_BY_CLIENT: (clientId: string) => `/credit-client/${clientId}`,
    GET_TRANSACTIONS: (clientId: string) => `/credit-client/${clientId}/transactions`,
    GET_SUMMARY: '/credit-client/summary',
    CREATE: '/credit-client',
    UPDATE: (id: string) => `/credit-client/${id}`,
  },
  
  // Invoices
  INVOICES: {
    BASE: '/invoices',
    GET_ALL: '/invoices',
    GET_BY_ID: (id: string) => `/invoices/${id}`,
    CREATE: '/invoices',
    UPDATE: (id: string) => `/invoices/${id}`,
    DELETE: (id: string) => `/invoices/${id}`,
    GENERATE_PDF: (id: string) => `/invoices/${id}/pdf`,
  },
  
  // Wallet
  WALLET: {
    BASE: '/wallet',
    GET_BALANCE: '/wallet/balance',
    GET_TRANSACTIONS: '/wallet/transactions',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
  },
  
  // Dashboard
  DASHBOARD: {
    BASE: '/dashboard',
    GET_STATS: '/dashboard/stats',
    GET_RECENT_ACTIVITY: '/dashboard/recent-activity',
    GET_CHART_DATA: '/dashboard/chart-data',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    GET_PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },
  
  // Upload
  UPLOAD: {
    BASE: '/upload',
    UPLOAD_FILE: '/upload',
    GET_FILE: (filename: string) => `/uploads/${filename}`,
  },
};
'''
    create_file("src/lib/api/endpoints.ts", endpoints_content)
    success("endpoints.ts créé")
    
    # 2.2. Types génériques
    common_types = '''// src/types/common.types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface Filters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
export interface SelectOption {
  label: string;
  value: string;
}
'''
    create_file("src/types/common.types.ts", common_types)
    success("common.types.ts créé")
    
    # 2.3. Service Products
    products_service = '''// src/lib/api/services/product.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse } from '../../types/common.types'; // Corrected import path

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const productService = {
  // Récupérer tous les produits
  getAll: async (filters?: ProductFilters, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.minPrice && { minPrice: String(filters.minPrice) }),
      ...(filters?.maxPrice && { maxPrice: String(filters.maxPrice) }),
      ...(filters?.inStock !== undefined && { inStock: String(filters.inStock) }),
    });
    
    const { data } = await apiClient.get<PaginatedResponse<Product>>(
      `${API_ENDPOINTS.PRODUCTS.GET_ALL}?${params.toString()}`
    );
    return data;
  },

  // Récupérer un produit par ID
  getById: async (id: string) => {
    const { data } = await apiClient.get<Product>(
      API_ENDPOINTS.PRODUCTS.GET_BY_ID(id)
    );
    return data;
  },

  // Créer un produit
  create: async (product: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await apiClient.post<Product>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      product
    );
    return data;
  },

  // Mettre à jour un produit
  update: async (id: string, product: Partial<Product>) => {
    const { data } = await apiClient.put<Product>(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      product
    );
    return data;
  },

  // Supprimer un produit
  delete: async (id: string) => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
  },

  // Mise à jour du stock
  updateStock: async (id: string, quantity: number) => {
    const { data } = await apiClient.patch<Product>(
      `${API_ENDPOINTS.PRODUCTS.UPDATE(id)}/stock`,
      { quantity }
    );
    return data;
  },
};
'''
    create_file("src/lib/api/services/product.service.ts", products_service)
    success("product.service.ts créé")
    
    # 2.3. Service Credits
    credits_service = '''// src/lib/api/services/credit.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse } from '../../types/common.types'; // Corrected import path

export interface Credit {
  id: string;
  clientId: string;
  clientName: string;
  totalCredit: number;
  usedCredit: number;
  availableCredit: number;
  status: 'active' | 'suspended' | 'closed';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  clientId: string;
  type: 'debit' | 'credit' | 'payment';
  amount: number;
  description: string;
  reference: string;
  createdAt: Date;
}

export interface CreditSummary {
  totalClients: number;
  totalCredit: number;
  totalUsed: number;
  totalAvailable: number;
  averageUsage: number;
}

export const creditService = {
  // Récupérer tous les crédits
  getAll: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<Credit>>(
      `${API_ENDPOINTS.CREDITS.GET_ALL}?page=${page}&limit=${limit}`
    );
    return data;
  },

  // Récupérer le crédit d'un client (Corrected comment)
  getByClientId: async (clientId: string) => {
    const { data } = await apiClient.get<Credit>(
      API_ENDPOINTS.CREDITS.GET_BY_CLIENT(clientId)
    );
    return data;
  },

  // Récupérer les transactions d'un client
  getTransactions: async (clientId: string, page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<CreditTransaction>>(
      `${API_ENDPOINTS.CREDITS.GET_TRANSACTIONS(clientId)}?page=${page}&limit=${limit}`
    );
    return data;
  },

  // Récupérer le résumé des crédits
  getSummary: async () => {
    const { data } = await apiClient.get<CreditSummary>(
      API_ENDPOINTS.CREDITS.GET_SUMMARY
    );
    return data;
  },

  // Créer un crédit client
  create: async (credit: Omit<Credit, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await apiClient.post<Credit>(
      API_ENDPOINTS.CREDITS.CREATE,
      credit
    );
    return data;
  },

  // Mettre à jour un crédit
  update: async (id: string, credit: Partial<Credit>) => {
    const { data } = await apiClient.put<Credit>(
      API_ENDPOINTS.CREDITS.UPDATE(id),
      credit
    );
    return data;
  },

  // Ajouter une transaction
  addTransaction: async (clientId: string, transaction: Omit<CreditTransaction, 'id' | 'createdAt'>) => {
    const { data } = await apiClient.post<CreditTransaction>(
      `${API_ENDPOINTS.CREDITS.GET_BY_CLIENT(clientId)}/transactions`,
      transaction
    );
    return data;
  },
};
'''
    create_file("src/lib/api/services/credit.service.ts", credits_service)
    success("credit.service.ts créé")
    
    # 2.4. Service Invoices
    invoices_service = '''// src/lib/api/services/invoice.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse } from '../../types/common.types'; // Corrected import path

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  issuedDate: Date;
  paidDate?: Date;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceDTO {
  clientId: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  dueDate: Date;
  notes?: string;
  taxRate?: number;
}

export const invoiceService = {
  // Récupérer toutes les factures
  getAll: async (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status && { status }),
    });
    const { data } = await apiClient.get<PaginatedResponse<Invoice>>(
      `${API_ENDPOINTS.INVOICES.GET_ALL}?${params.toString()}`
    );
    return data;
  },

  // Récupérer une facture par ID
  getById: async (id: string) => {
    const { data } = await apiClient.get<Invoice>(
      API_ENDPOINTS.INVOICES.GET_BY_ID(id)
    );
    return data;
  },

  // Créer une facture
  create: async (invoice: CreateInvoiceDTO) => {
    const { data } = await apiClient.post<Invoice>(
      API_ENDPOINTS.INVOICES.CREATE,
      invoice
    );
    return data;
  },

  // Mettre à jour une facture
  update: async (id: string, invoice: Partial<Invoice>) => {
    const { data } = await apiClient.put<Invoice>(
      API_ENDPOINTS.INVOICES.UPDATE(id),
      invoice
    );
    return data;
  },

  // Supprimer une facture
  delete: async (id: string) => {
    await apiClient.delete(API_ENDPOINTS.INVOICES.DELETE(id));
  },

  // Générer le PDF d'une facture
  generatePDF: async (id: string) => {
    const { data } = await apiClient.get<{ url: string; filename: string }>(
      API_ENDPOINTS.INVOICES.GENERATE_PDF(id)
    );
    return data;
  },

  // Marquer comme payée
  markAsPaid: async (id: string) => {
    const { data } = await apiClient.patch<Invoice>(
      `${API_ENDPOINTS.INVOICES.UPDATE(id)}/paid`
    );
    return data;
  },

  // Annuler une facture
  cancel: async (id: string, reason?: string) => {
    const { data } = await apiClient.patch<Invoice>(
      `${API_ENDPOINTS.INVOICES.UPDATE(id)}/cancel`,
      { reason }
    );
    return data;
  },
};
'''
    create_file("src/lib/api/services/invoice.service.ts", invoices_service)
    success("invoice.service.ts créé")
    
    # 2.5. Service Wallet
    wallet_service = '''// src/lib/api/services/wallet.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { PaginatedResponse } from '../../types/common.types'; // Corrected import path

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  frozenBalance: number;
  availableBalance: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'fee';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
}

export interface DepositDTO {
  amount: number;
  method: 'bank_transfer' | 'card' | 'crypto';
  reference?: string;
}

export interface WithdrawDTO {
  amount: number;
  method: 'bank_transfer' | 'crypto';
  accountDetails: Record<string, any>;
}

export const walletService = {
  // Récupérer le solde du wallet
  getBalance: async () => {
    const { data } = await apiClient.get<Wallet>(
      API_ENDPOINTS.WALLET.GET_BALANCE
    );
    return data;
  },

  // Récupérer les transactions
  getTransactions: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<WalletTransaction>>(
      `${API_ENDPOINTS.WALLET.GET_TRANSACTIONS}?page=${page}&limit=${limit}`
    );
    return data;
  },

  // Effectuer un dépôt
  deposit: async (deposit: DepositDTO) => {
    const { data } = await apiClient.post<WalletTransaction>(
      API_ENDPOINTS.WALLET.DEPOSIT,
      deposit
    );
    return data;
  },

  // Effectuer un retrait
  withdraw: async (withdraw: WithdrawDTO) => {
    const { data } = await apiClient.post<WalletTransaction>(
      API_ENDPOINTS.WALLET.WITHDRAW,
      withdraw
    );
    return data;
  },
};
'''
    create_file("src/lib/api/services/wallet.service.ts", wallet_service)
    success("wallet.service.ts créé")
    
    # 2.6. Service Dashboard
    dashboard_service = '''// src/lib/api/services/dashboard.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'payment' | 'credit' | 'invoice';
  description: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

export const dashboardService = {
  // Récupérer les statistiques
  getStats: async () => {
    const { data } = await apiClient.get<DashboardStats>(
      API_ENDPOINTS.DASHBOARD.GET_STATS
    );
    return data;
  },

  // Récupérer les données du graphique
  getChartData: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    const { data } = await apiClient.get<ChartData>(
      `${API_ENDPOINTS.DASHBOARD.GET_CHART_DATA}?period=${period}`
    );
    return data;
  },

  // Récupérer les activités récentes
  getRecentActivity: async (limit = 10) => {
    const { data } = await apiClient.get<RecentActivity[]>(
      `${API_ENDPOINTS.DASHBOARD.GET_RECENT_ACTIVITY}?limit=${limit}`
    );
    return data;
  },
};
'''
    create_file("src/lib/api/services/dashboard.service.ts", dashboard_service)
    success("dashboard.service.ts créé")
    
    # 2.7. Service Users
    users_service = '''// src/lib/api/services/user.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  tenantId: string;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userService = {
  // Récupérer le profil de l'utilisateur
  getProfile: async () => {
    const { data } = await apiClient.get<User>(
      API_ENDPOINTS.USERS.GET_PROFILE
    );
    return data;
  },

  // Mettre à jour le profil
  updateProfile: async (profile: UpdateProfileDTO) => {
    const { data } = await apiClient.put<User>(
      API_ENDPOINTS.USERS.UPDATE_PROFILE,
      profile
    );
    return data;
  },

  // Changer le mot de passe
  changePassword: async (passwordData: ChangePasswordDTO) => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.USERS.CHANGE_PASSWORD,
      passwordData
    );
    return data;
  },
};
'''
    create_file("src/lib/api/services/user.service.ts", users_service)
    success("user.service.ts créé")
    
    # 2.8. Service Upload
    upload_service = '''// src/lib/api/services/upload.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface UploadFile {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export const uploadService = {
  // Upload un fichier
  uploadFile: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const { data } = await apiClient.post<UploadFile>(
      API_ENDPOINTS.UPLOAD.UPLOAD_FILE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  // Upload multiple fichiers
  uploadMultiple: async (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const { data } = await apiClient.post<UploadFile[]>(
      `${API_ENDPOINTS.UPLOAD.UPLOAD_FILE}/multiple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  // Obtenir l'URL d'un fichier
  getFileUrl: (filename: string) => {
    return `${process.env.NEXT_PUBLIC_UPLOAD_URL}/${filename}`;
  },
};
'''
    create_file("src/lib/api/services/upload.service.ts", upload_service)
    success("upload.service.ts créé")
    
    # 2.9. Index des services
    services_index = '''// src/lib/api/services/index.ts
export * from './product.service';
export * from './credit.service';
export * from './invoice.service';
export * from './wallet.service';
export * from './dashboard.service';
export * from './user.service';
export * from './upload.service';
'''
    create_file("src/lib/api/services/index.ts", services_index)
    success("services/index.ts créé")
    
    # ============================================
    # 3. CRÉATION DES TYPES
    # ============================================
    log("\nCréation des types supplémentaires...")
    
    # 3.1. Types pour les produits
    product_types = '''// src/types/product.types.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}
'''
    create_file("src/types/product.types.ts", product_types)
    success("product.types.ts créé")
    
    # 3.2. Types pour les crédits
    credit_types = '''// src/types/credit.types.ts
export interface Credit {
  id: string;
  clientId: string;
  clientName: string;
  totalCredit: number;
  usedCredit: number;
  availableCredit: number;
  status: 'active' | 'suspended' | 'closed';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  clientId: string;
  type: 'debit' | 'credit' | 'payment';
  amount: number;
  description: string;
  reference: string;
  createdAt: Date;
}

export interface CreditSummary {
  totalClients: number;
  totalCredit: number;
  totalUsed: number;
  totalAvailable: number;
  averageUsage: number;
}

export interface CreateCreditDTO {
  clientId: string;
  clientName: string;
  totalCredit: number;
}
'''
    create_file("src/types/credit.types.ts", credit_types)
    success("credit.types.ts créé")
    
    # 3.3. Types pour les factures
    invoice_types = '''// src/types/invoice.types.ts
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  issuedDate: Date;
  paidDate?: Date;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceDTO {
  clientId: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  dueDate: Date;
  notes?: string;
  taxRate?: number;
}

export interface UpdateInvoiceDTO extends Partial<CreateInvoiceDTO> {
  status?: Invoice['status'];
}
'''
    create_file("src/types/invoice.types.ts", invoice_types)
    success("invoice.types.ts créé")
    
    # 3.4. Types pour le dashboard
    dashboard_types = '''// src/types/dashboard.types.ts
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'payment' | 'credit' | 'invoice';
  description: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}
'''
    create_file("src/types/dashboard.types.ts", dashboard_types)
    success("dashboard.types.ts créé")
    
    # 3.5. Types pour le wallet
    wallet_types = '''// src/types/wallet.types.ts
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  frozenBalance: number;
  availableBalance: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'fee';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
}

export interface DepositDTO {
  amount: number;
  method: 'bank_transfer' | 'card' | 'crypto';
  reference?: string;
}

export interface WithdrawDTO {
  amount: number;
  method: 'bank_transfer' | 'crypto';
  accountDetails: Record<string, any>;
}
'''
    create_file("src/types/wallet.types.ts", wallet_types)
    success("wallet.types.ts créé")
    
    # ============================================
    # 4. CRÉATION DES HOOKS REACT-QUERY
    # ============================================
    log("\nCréation des hooks React-Query...")
    
    # 4.1. Hook Products
    products_hook = '''// src/components/features/products/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/lib/api/services';
import { Product, ProductFilters, CreateProductDTO } from '@/types/product.types';
import { toast } from 'sonner';

export const useProducts = (filters?: ProductFilters, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['products', filters, page, limit],
    queryFn: () => productService.getAll(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProductDTO) => productService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Produit "${data.name}" créé avec succès`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      toast.success(`Produit "${data.name}" mis à jour avec succès`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      productService.updateStock(id, quantity),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      toast.success('Stock mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour du stock');
    },
  });
};
'''
    create_file("src/components/features/products/hooks/useProducts.ts", products_hook)
    success("useProducts.ts créé")
    
    # 4.2. Hook Credits
    credits_hook = '''// src/components/features/credits/hooks/useCredits.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditService } from '@/lib/api/services';
import { CreateCreditDTO } from '@/types/credit.types';
import { toast } from 'sonner';

export const useCredits = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['credits', page, limit],
    queryFn: () => creditService.getAll(page, limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreditByClient = (clientId: string) => {
  return useQuery({
    queryKey: ['credit', clientId],
    queryFn: () => creditService.getByClientId(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreditTransactions = (clientId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['credit-transactions', clientId, page, limit],
    queryFn: () => creditService.getTransactions(clientId, page, limit),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreditSummary = () => {
  return useQuery({
    queryKey: ['credit-summary'],
    queryFn: () => creditService.getSummary(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCredit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCreditDTO) => creditService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
      toast.success('Crédit client créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création');
    },
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clientId, transaction }: { clientId: string; transaction: any }) =>
      creditService.addTransaction(clientId, transaction),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['credit-transactions', clientId] });
      queryClient.invalidateQueries({ queryKey: ['credit', clientId] });
      queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
      toast.success('Transaction ajoutée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\\'ajout de la transaction');
    },
  });
};
'''
    create_file("src/components/features/credits/hooks/useCredits.ts", credits_hook)
    success("useCredits.ts créé")
    
    # 4.3. Hook Invoices
    invoices_hook = '''// src/components/features/invoices/hooks/useInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/lib/api/services';
import { CreateInvoiceDTO } from '@/types/invoice.types';
import { toast } from 'sonner';

export const useInvoices = (page = 1, limit = 20, status?: string) => {
  return useQuery({
    queryKey: ['invoices', page, limit, status],
    queryFn: () => invoiceService.getAll(page, limit, status),
    staleTime: 5 * 60 * 1000,
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateInvoiceDTO) => invoiceService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Facture ${data.invoiceNumber} créée avec succès`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création');
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      invoiceService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      toast.success(`Facture ${data.invoiceNumber} mise à jour`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });
};

export const useGeneratePDF = () => {
  return useMutation({
    mutationFn: (id: string) => invoiceService.generatePDF(id),
    onSuccess: (data) => {
      // Ouvrir le PDF dans un nouvel onglet
      window.open(data.url, '_blank');
      toast.success('PDF généré avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la génération du PDF');
    },
  });
};

export const useMarkInvoiceAsPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => invoiceService.markAsPaid(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      toast.success(`Facture ${data.invoiceNumber} marquée comme payée`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors du marquage');
    },
  });
};
'''
    create_file("src/components/features/invoices/hooks/useInvoices.ts", invoices_hook)
    success("useInvoices.ts créé")
    
    # 4.4. Hook Dashboard
    dashboard_hook = '''// src/components/features/dashboard/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/api/services';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Rafraîchir toutes les 5 minutes
  });
};

export const useChartData = (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQuery({
    queryKey: ['chart-data', period],
    queryFn: () => dashboardService.getChartData(period),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => dashboardService.getRecentActivity(limit),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};
'''
    create_file("src/components/features/dashboard/hooks/useDashboard.ts", dashboard_hook)
    success("useDashboard.ts créé")
    
    # 4.5. Hook Auth
    auth_hook = '''// src/components/features/auth/hooks/useAuth.ts
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email ou mot de passe incorrect');
        return { success: false, error: result.error };
      }

      toast.success('Connexion réussie');
      router.push('/dashboard/overview');
      router.refresh();
      return { success: true };
    } catch (error) {
      toast.error('Une erreur est survenue');
      return { success: false, error: 'Une erreur est survenue' };
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    toast.success('Déconnexion réussie');
    router.push('/login');
    router.refresh();
  };

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    login,
    logout,
  };
};
'''
    create_file("src/components/features/auth/hooks/useAuth.ts", auth_hook)
    success("useAuth.ts créé")
    
    # ============================================
    # 5. MISE À JOUR DE package.json
    # ============================================
    log("\nMise à jour de package.json...")
    
    with open('package.json', 'r', encoding='utf-8') as f:
        package_json = json.load(f)
    
    # Ajouter des scripts supplémentaires
    if 'scripts' in package_json:
        package_json['scripts']['dev'] = 'next dev'
        package_json['scripts']['build'] = 'next build'
        package_json['scripts']['start'] = 'next start'
        package_json['scripts']['lint'] = 'next lint'
        package_json['scripts']['format'] = 'prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}"'
        package_json['scripts']['test'] = 'jest'
        package_json['scripts']['test:watch'] = 'jest --watch'
    
    with open('package.json', 'w', encoding='utf-8') as f:
        json.dump(package_json, f, indent=2, ensure_ascii=False)
    success("package.json mis à jour")
    
    # ============================================
    # 6. FIN
    # ============================================
    print("\n" + "="*60)
    success("🎉 Configuration terminée avec succès !")
    print("="*60)
    print(f"""
{Colors.CYAN}📦 Composants installés :{Colors.NC}
  - Shadcn/ui initialisé
  - 20+ composants UI installés

{Colors.CYAN}📁 Services API créés :{Colors.NC}
  - product.service.ts
  - credit.service.ts
  - invoice.service.ts
  - wallet.service.ts
  - dashboard.service.ts
  - user.service.ts
  - upload.service.ts

{Colors.CYAN}🔧 Hooks React-Query :{Colors.NC}
  - useProducts, useProduct, useCreateProduct...
  - useCredits, useCreditSummary...
  - useInvoices, useGeneratePDF...
  - useDashboardStats, useChartData...
  - useAuth

{Colors.CYAN}📝 Types TypeScript :{Colors.NC}
  - Tous les types pour chaque ressource

{Colors.CYAN}🚀 Pour démarrer :{Colors.NC}
  cd frontend
  npm run dev

{Colors.CYAN}📚 Structure des services :{Colors.NC}
  src/lib/api/services/
  ├── index.ts          # Export de tous les services
  ├── product.service.ts
  ├── credit.service.ts
  ├── invoice.service.ts
  ├── wallet.service.ts
  ├── dashboard.service.ts
  ├── user.service.ts
  └── upload.service.ts
""")

if __name__ == "__main__":
    import sys
    try:
        main()
    except KeyboardInterrupt:
        print("\n" + Colors.YELLOW + "⚠ Script interrompu par l'utilisateur" + Colors.NC)
        sys.exit(0)
    except Exception as e:
        error(f"Erreur inattendue: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)