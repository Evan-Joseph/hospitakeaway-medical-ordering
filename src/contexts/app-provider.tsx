
// src/contexts/app-provider.tsx
"use client";

import React, { ReactNode } from 'react';
import { AuthProvider } from './auth-context'; // Import AuthProvider
import { CartProvider } from './cart-context';
import { DeliveryProvider } from './delivery-context';
import { OrderProvider } from './order-context';
import { FavoritesProvider } from './favorites-context';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider> {/* Wrap with AuthProvider */}
      <DeliveryProvider>
        <FavoritesProvider>
          <CartProvider>
            <OrderProvider>
              {children}
            </OrderProvider>
          </CartProvider>
        </FavoritesProvider>
      </DeliveryProvider>
    </AuthProvider>
  );
};
