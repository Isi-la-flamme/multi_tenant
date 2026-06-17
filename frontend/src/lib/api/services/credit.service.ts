import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { Credit, CreditTransaction, CreditSummary, CreateCreditDTO } from '@/types/credit.types';
import { PaginatedResponse } from '@/types/common.types';

export const creditService = {
  getAll: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<Credit>>(
      `${API_ENDPOINTS.CREDITS.GET_ALL}?page=${page}&limit=${limit}`
    );
    return data;
  },

  getByClientId: async (clientId: string) => {
    const { data } = await apiClient.get<Credit>(
      API_ENDPOINTS.CREDITS.GET_BY_CLIENT(clientId)
    );
    return data;
  },

  getTransactions: async (clientId: string, page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<CreditTransaction>>(
      `${API_ENDPOINTS.CREDITS.GET_TRANSACTIONS(clientId)}?page=${page}&limit=${limit}`
    );
    return data;
  },

  getSummary: async () => {
    const { data } = await apiClient.get<CreditSummary>(
      API_ENDPOINTS.CREDITS.GET_SUMMARY
    );
    return data;
  },

  create: async (credit: CreateCreditDTO) => {
    const { data } = await apiClient.post<Credit>(
      API_ENDPOINTS.CREDITS.CREATE,
      credit
    );
    return data;
  },

  update: async (id: string, credit: Partial<Credit>) => {
    const { data } = await apiClient.put<Credit>(
      API_ENDPOINTS.CREDITS.UPDATE(id),
      credit
    );
    return data;
  },

  addTransaction: async (clientId: string, transaction: Omit<CreditTransaction, 'id' | 'createdAt'>) => {
    const { data } = await apiClient.post<CreditTransaction>(
      `${API_ENDPOINTS.CREDITS.GET_BY_CLIENT(clientId)}/transactions`,
      transaction
    );
    return data;
  },
};