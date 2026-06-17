import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { Invoice, CreateInvoiceDTO } from '@/types/invoice.types';
import { PaginatedResponse } from '@/types/common.types';

export const invoiceService = {
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

  getById: async (id: string) => {
    const { data } = await apiClient.get<Invoice>(
      API_ENDPOINTS.INVOICES.GET_BY_ID(id)
    );
    return data;
  },

  create: async (invoice: CreateInvoiceDTO) => {
    const { data } = await apiClient.post<Invoice>(
      API_ENDPOINTS.INVOICES.CREATE,
      invoice
    );
    return data;
  },

  update: async (id: string, invoice: Partial<Invoice>) => {
    const { data } = await apiClient.put<Invoice>(
      API_ENDPOINTS.INVOICES.UPDATE(id),
      invoice
    );
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(API_ENDPOINTS.INVOICES.DELETE(id));
  },

  generatePDF: async (id: string) => {
    const { data } = await apiClient.get<{ url: string; filename: string }>(
      API_ENDPOINTS.INVOICES.GENERATE_PDF(id)
    );
    return data;
  },

  markAsPaid: async (id: string) => {
    const { data } = await apiClient.patch<Invoice>(
      API_ENDPOINTS.INVOICES.MARK_PAID(id)
    );
    return data;
  },

  cancel: async (id: string, reason?: string) => {
    const { data } = await apiClient.patch<Invoice>(
      API_ENDPOINTS.INVOICES.CANCEL(id),
      { reason }
    );
    return data;
  },
};