// src/app/(dashboard)/pos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { usePOSProducts, useCart, useCreateCart, useAddToCart, useUpdateCartItem, useRemoveFromCart, useClearCart, useCheckout, usePOSStats } from '@/components/features/pos/hooks/usePOS';
import { ProductGrid } from '@/components/features/pos/components/ProductGrid';
import { Cart } from '@/components/features/pos/components/Cart';
import { CheckoutModal } from '@/components/features/pos/components/CheckoutModal';
import { POSStatsComponent } from '@/components/features/pos/components/POSStats';
import { POSCart } from '@/types/pos.types';

export default function POSPage() {
  const { data: session, status } = useSession();
  const [cartId, setCartId] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Statistiques
  const { data: stats } = usePOSStats();

  // Produits
  const { data: productsData, isLoading: productsLoading } = usePOSProducts();

  // Panier
  const { data: cart, refetch: refetchCart } = useCart(cartId);
  const createCart = useCreateCart();
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();
  const checkout = useCheckout();

  // Créer un panier au chargement
  useEffect(() => {
    if (!cartId && !createCart.isPending) {
      createCart.mutate(undefined, {
        onSuccess: (data) => {
          setCartId(data.id);
        },
      });
    }
  }, [cartId]);

  // Handlers
  const handleAddToCart = (product: any) => {
    if (!cartId) {
      createCart.mutate(undefined, {
        onSuccess: (data) => {
          setCartId(data.id);
          addToCart.mutate({
            cartId: data.id,
            productId: product.id,
            quantity: 1,
          });
        },
      });
      return;
    }
    addToCart.mutate({
      cartId,
      productId: product.id,
      quantity: 1,
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (!cartId) return;
    updateCartItem.mutate({ cartId, itemId, quantity });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!cartId) return;
    removeFromCart.mutate({ cartId, itemId });
  };

  const handleClearCart = () => {
    if (!cartId) return;
    clearCart.mutate(cartId);
  };

  const handleCheckout = (payment: any) => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return;
    }
    checkout.mutate({
      cart,
      payment,
    }, {
      onSuccess: () => {
        setIsCheckoutOpen(false);
        // Créer un nouveau panier
        createCart.mutate(undefined, {
          onSuccess: (data) => {
            setCartId(data.id);
          },
        });
      },
    });
  };

  const handleOpenCheckout = () => {
    // ✅ Vérifier que le panier existe et a des items
    if (cart && cart.items && cart.items.length > 0 && cart.total > 0) {
      setIsCheckoutOpen(true);
    }
  };

  // Vérification de l'authentification
  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Statistiques */}
      <POSStatsComponent stats={stats} isLoading={false} />

      {/* POS Principal */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {/* Grille des produits */}
        <div className="col-span-2 overflow-y-auto">
          <ProductGrid
            products={productsData?.data || []}
            onAddToCart={handleAddToCart}
            isLoading={productsLoading}
          />
        </div>

        {/* Panier */}
        <div className="border rounded-lg overflow-hidden">
          <Cart
            cart={cart || null}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClear={handleClearCart}
            onCheckout={handleOpenCheckout}
            isLoading={checkout.isPending}
          />
        </div>
      </div>

      {/* Modal de paiement */}
      <CheckoutModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        cart={cart || null}
        onConfirm={handleCheckout}
        isLoading={checkout.isPending}
      />
    </div>
  );
}