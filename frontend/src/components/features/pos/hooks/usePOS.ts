// src/components/features/pos/hooks/usePOS.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/lib/api/services/pos.service';
import { toast } from 'sonner';
import { POSCart, CreatePOSSaleDTO } from '@/types/pos.types';

// ============================================
// Produits
// ============================================
export const usePOSProducts = (search?: string, category?: string) => {
  return useQuery({
    queryKey: ['pos-products', search, category],
    queryFn: () => posService.getProducts(search, category),
    staleTime: 2 * 60 * 1000,
  });
};

export const useProductByBarcode = (barcode: string) => {
  return useQuery({
    queryKey: ['pos-product-barcode', barcode],
    queryFn: () => posService.getProductByBarcode(barcode),
    enabled: !!barcode && barcode.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// Panier
// ============================================
export const useCart = (cartId: string) => {
  return useQuery({
    queryKey: ['pos-cart', cartId],
    queryFn: () => posService.getCart(cartId),
    enabled: !!cartId,
    staleTime: 0, // Toujours frais pour le POS
  });
};

export const useCreateCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => posService.createCart(),
    onSuccess: (data) => {
      queryClient.setQueryData(['pos-cart', data.id], data);
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, productId, quantity }: { cartId: string; productId: string; quantity: number }) =>
      posService.addToCart(cartId, productId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['pos-cart', data.id], data);
      toast.success('Produit ajouté au panier');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'ajout');
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, itemId, quantity }: { cartId: string; itemId: string; quantity: number }) =>
      posService.updateCartItem(cartId, itemId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['pos-cart', data.id], data);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, itemId }: { cartId: string; itemId: string }) =>
      posService.removeFromCart(cartId, itemId),
    onSuccess: (data) => {
      queryClient.setQueryData(['pos-cart', data.id], data);
      toast.success('Produit retiré du panier');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors du retrait');
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cartId: string) => posService.clearCart(cartId),
    onSuccess: (data) => {
      queryClient.setQueryData(['pos-cart', data.id], data);
      toast.success('Panier vidé');
    },
  });
};

// ============================================
// Ventes
// ============================================
export const useCheckout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (saleData: CreatePOSSaleDTO) => posService.checkout(saleData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pos-sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos-stats'] });
      toast.success(`Vente ${data.invoiceNumber} validée !`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors du paiement');
    },
  });
};

export const useSales = (page = 1, limit = 20, startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['pos-sales', page, limit, startDate, endDate],
    queryFn: () => posService.getSales(page, limit, startDate, endDate),
    staleTime: 2 * 60 * 1000,
  });
};

export const useSale = (id: string) => {
  return useQuery({
    queryKey: ['pos-sale', id],
    queryFn: () => posService.getSale(id),
    enabled: !!id,
  });
};

export const useRefundSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      posService.refundSale(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pos-sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos-sale', data.id] });
      queryClient.invalidateQueries({ queryKey: ['pos-stats'] });
      toast.success(`Vente ${data.invoiceNumber} remboursée`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors du remboursement');
    },
  });
};

// ============================================
// Statistiques
// ============================================
export const usePOSStats = () => {
  return useQuery({
    queryKey: ['pos-stats'],
    queryFn: () => posService.getStats(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000, // Rafraîchir toutes les 30s
  });
};