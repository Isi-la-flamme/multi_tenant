import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { Wallet, WalletTransaction, DepositDTO, WithdrawDTO } from '@/types/wallet.types';
import { PaginatedResponse } from '@/types/common.types';

export const walletService = {
  getBalance: async () => {
    const { data } = await apiClient.get<Wallet>(
      API_ENDPOINTS.WALLET.GET_BALANCE
    );
    return data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<WalletTransaction>>(
      `${API_ENDPOINTS.WALLET.GET_TRANSACTIONS}?page=${page}&limit=${limit}`
    );
    return data;
  },

  deposit: async (deposit: DepositDTO) => {
    const { data } = await apiClient.post<WalletTransaction>(
      API_ENDPOINTS.WALLET.DEPOSIT,
      deposit
    );
    return data;
  },

  withdraw: async (withdraw: WithdrawDTO) => {
    const { data } = await apiClient.post<WalletTransaction>(
      API_ENDPOINTS.WALLET.WITHDRAW,
      withdraw
    );
    return data;
  },
};