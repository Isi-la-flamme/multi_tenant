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
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'ajout de la transaction');
    },
  });
};