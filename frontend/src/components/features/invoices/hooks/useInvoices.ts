// src/components/features/invoices/hooks/useInvoices.ts
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

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => invoiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Facture supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
};

export const useGeneratePDF = () => {
  return useMutation({
    mutationFn: (id: string) => invoiceService.generatePDF(id),
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, '_blank');
      }
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

export const useCancelInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => invoiceService.cancel(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      toast.success(`Facture ${data.invoiceNumber} annulée`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'annulation');
    },
  });
};