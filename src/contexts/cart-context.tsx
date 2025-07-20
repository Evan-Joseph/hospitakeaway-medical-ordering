
// src/contexts/cart-context.tsx
"use client";

import type { CartItemType, MenuItem, Order } from '@/types'; 
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItemType[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  isCartFromMultipleRestaurants: () => boolean;
  getCartRestaurantId: () => string | null;
  reOrderItems: (orderToRecreate: Order) => void; 
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'mediOrderCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error("从localStorage解析购物车数据出错:", error);
        setCartItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      if (prevItems.length > 0 && prevItems[0].restaurantId !== item.restaurantId) {
        setTimeout(() => {
          toast({
            title: "餐馆不匹配",
            description: "您一次只能从一家餐馆订购。请先清空购物车或完成当前订单。",
            variant: "destructive",
          });
        }, 0);
        return prevItems;
      }

      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        const updatedItems = prevItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
        setTimeout(() => {
          toast({
            title: `${item.name} 数量已更新`,
            description: `当前数量: ${existingItem.quantity + 1}。`,
          });
        }, 0);
        return updatedItems;
      }
      setTimeout(() => {
        toast({
          title: `${item.name} 已添加到购物车`,
          description: `价格: ¥${item.price.toFixed(2)}`,
        });
      }, 0);
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    setTimeout(() => {
      toast({
          title: "商品已从购物车移除",
          variant: "default",
        });
    }, 0);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setTimeout(() => {
      toast({
          title: "购物车已清空",
        });
    }, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };
  
  const isCartFromMultipleRestaurants = () => {
    if (cartItems.length <= 1) return false;
    const firstRestaurantId = cartItems[0].restaurantId;
    return cartItems.some(item => item.restaurantId !== firstRestaurantId);
  };

  const getCartRestaurantId = (): string | null => {
    return cartItems.length > 0 ? cartItems[0].restaurantId : null;
  };

  const reOrderItems = (orderToRecreate: Order) => {
    const { items: itemsToReOrder, restaurantId: reOrderRestaurantId, restaurantName: reOrderRestaurantName } = orderToRecreate;
    const currentCartRestaurantId = getCartRestaurantId();

    if (currentCartRestaurantId && currentCartRestaurantId !== reOrderRestaurantId && cartItems.length > 0) {
      setTimeout(() => { 
        toast({
          title: "餐馆不匹配",
          description: `您的购物车中包含来自其他餐馆的商品。请先清空购物车或完成当前订单，才能从 ${reOrderRestaurantName} 重新下单。`,
          variant: "destructive",
        });
      }, 0);
      return; 
    }
    
    if (!itemsToReOrder || itemsToReOrder.length === 0) {
      setTimeout(() => {
        toast({
          title: "无商品可重新下单",
          description: "所选的历史订单中没有商品。",
          variant: "default",
        });
      }, 0);
      return;
    }

    setCartItems((prevItems) => {
      let newCartItems = [...prevItems];
      let itemsAddedCount = 0;
      let itemsUpdatedCount = 0;
      const itemNamesAdded: string[] = [];

      itemsToReOrder.forEach(itemFromOrder => {
        const itemForCart: CartItemType = {
          id: itemFromOrder.id,
          name: itemFromOrder.name,
          description: itemFromOrder.description,
          price: itemFromOrder.price,
          imageUrl: itemFromOrder.imageUrl,
          dataAiHint: itemFromOrder.dataAiHint,
          restaurantId: reOrderRestaurantId, 
          quantity: itemFromOrder.quantity,
        };

        const existingItemIndex = newCartItems.findIndex(
          cartItem => cartItem.id === itemForCart.id && cartItem.restaurantId === reOrderRestaurantId
        );

        if (existingItemIndex > -1) {
          newCartItems[existingItemIndex] = {
            ...newCartItems[existingItemIndex],
            quantity: newCartItems[existingItemIndex].quantity + itemForCart.quantity,
          };
          itemsUpdatedCount++;
        } else {
          newCartItems.push(itemForCart);
          itemsAddedCount++;
          itemNamesAdded.push(itemForCart.name);
        }
      });
      
      if (itemsAddedCount > 0 || itemsUpdatedCount > 0) {
        setTimeout(() => {
          toast({
            title: "商品已添加到购物车",
            description: `${itemsAddedCount > 0 ? `${itemNamesAdded.join('、')} 已添加。` : ''}${itemsUpdatedCount > 0 ? `${itemsUpdatedCount} 个已有商品数量已更新。` : ''}您的购物车已更新。`,
          });
        }, 0);
      }
      return newCartItems;
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        isCartFromMultipleRestaurants,
        getCartRestaurantId,
        reOrderItems, 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart 必须在 CartProvider 中使用');
  }
  return context;
};
