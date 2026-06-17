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