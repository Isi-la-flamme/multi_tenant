// src/components/features/wallet/hooks/useWallet.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/lib/api/services';
import { DepositDTO, WithdrawDTO } from '@/types/wallet.types';
import { toast } from 'sonner';

export const useWalletBalance = () => {
  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletService.getBalance(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Rafraîchir toutes les 2 minutes
  });
};

export const useWalletTransactions = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['wallet-transactions', page, limit],
    queryFn: () => walletService.getTransactions(page, limit),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeposit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: DepositDTO) => walletService.deposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Dépôt effectué avec succès');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erreur lors du dépôt'
      );
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WithdrawDTO) => walletService.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Retrait effectué avec succès');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erreur lors du retrait'
      );
    },
  });
};