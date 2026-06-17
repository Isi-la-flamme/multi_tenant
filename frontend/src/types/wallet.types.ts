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