
// src/contexts/order-context.tsx
"use client";

import type { Order, OrderStatus, CartItemType, Promotion } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase'; 
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  getDoc,
  getDocs, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";


interface OrderContextType {
  orders: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'orderDate' | 'rating'>) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  updateOrderRating: (orderId: string, rating: number) => Promise<boolean>;
  getOrderById: (orderId: string) => Order | undefined;
  loadingOrders: boolean;
  fetchOrders: () => Promise<void>; 
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Helper for status translation
const translateOrderStatus = (status: OrderStatus): string => {
  const map: Record<OrderStatus, string> = {
    'Pending Payment': '等待付款',
    'Order Placed': '订单已下单',
    'Preparing': '准备中',
    'Out for Delivery': '配送中',
    'Delivered': '已送达',
    'Cancelled': '已取消'
  };
  return map[status] || status;
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchOrdersInitial = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const ordersCollectionRef = collection(db, "orders");
      const q = query(ordersCollectionRef, orderBy("orderDate", "desc"));
      const querySnapshot = await getDocs(q); 
      const fetchedOrders = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          items: (data.items || []) as CartItemType[],
          totalAmount: data.totalAmount,
          status: data.status as OrderStatus,
          orderDate: (data.orderDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          deliveryLocation: data.deliveryLocation,
          verificationCode: data.verificationCode,
          restaurantName: data.restaurantName,
          restaurantId: data.restaurantId,
          customerName: data.customerName || '',
          customerPhone: data.customerPhone || '',
          paymentQrCodeUrl: data.paymentQrCodeUrl,
          rating: data.rating || undefined,
          appliedPromotion: data.appliedPromotion || undefined,
          discountAmount: data.discountAmount || undefined,
        } as Order;
      });
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("从Firestore初次获取订单出错: ", error);
      toast({
        title: "获取订单失败",
        description: "无法加载订单历史，请稍后再试。",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [toast]);


  useEffect(() => {
    setLoadingOrders(true);
    const ordersCollectionRef = collection(db, "orders");
    const q = query(ordersCollectionRef, orderBy("orderDate", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          items: (data.items || []) as CartItemType[],
          totalAmount: data.totalAmount,
          status: data.status as OrderStatus,
          orderDate: (data.orderDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          deliveryLocation: data.deliveryLocation,
          verificationCode: data.verificationCode,
          restaurantName: data.restaurantName,
          restaurantId: data.restaurantId,
          customerName: data.customerName || '',
          customerPhone: data.customerPhone || '',
          paymentQrCodeUrl: data.paymentQrCodeUrl,
          rating: data.rating || undefined,
          appliedPromotion: data.appliedPromotion || undefined,
          discountAmount: data.discountAmount || undefined,
        } as Order;
      });
      setOrders(fetchedOrders);
      setLoadingOrders(false); 
      console.log("通过onSnapshot更新订单:", fetchedOrders.length);
    }, (error) => {
      console.error("onSnapshot订单出错: ", error);
      setTimeout(() => {
        toast({
          title: "实时同步错误",
          description: "无法实时同步订单，显示的是上次已知数据。",
          variant: "destructive",
        });
      },0);
      setLoadingOrders(false);
    });

    return () => {
      console.log("取消订单更新订阅。");
      unsubscribe();
    };
  }, [toast]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'orderDate' | 'rating'>): Promise<Order | null> => {
    console.log("向Firestore添加订单:", orderData);
    try {
      const ordersCollectionRef = collection(db, "orders");
      const docDataWithTimestamp: any = { 
        ...orderData,
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          dataAiHint: item.dataAiHint,
          restaurantId: item.restaurantId,
          quantity: item.quantity,
        })),
        orderDate: serverTimestamp(),
        status: orderData.status || (orderData.paymentQrCodeUrl ? 'Pending Payment' : 'Order Placed')
      };
      
      if (orderData.appliedPromotion) {
        docDataWithTimestamp.appliedPromotion = orderData.appliedPromotion;
      }
      if (orderData.discountAmount !== undefined) {
        docDataWithTimestamp.discountAmount = orderData.discountAmount;
      }


      const docRef = await addDoc(ordersCollectionRef, docDataWithTimestamp);
      const newDocSnap = await getDoc(docRef); 
      if (newDocSnap.exists()) {
        const dataFromDb = newDocSnap.data();
         if (!dataFromDb) {
           throw new Error("文档快照存在但数据未定义。");
        }
        const newOrder: Order = {
          id: newDocSnap.id,
          items: (dataFromDb.items || []) as CartItemType[],
          totalAmount: dataFromDb.totalAmount,
          status: dataFromDb.status as OrderStatus,
          orderDate: (dataFromDb.orderDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          deliveryLocation: dataFromDb.deliveryLocation,
          verificationCode: dataFromDb.verificationCode,
          restaurantName: dataFromDb.restaurantName,
          restaurantId: dataFromDb.restaurantId,
          customerName: dataFromDb.customerName || '',
          customerPhone: dataFromDb.customerPhone || '',
          paymentQrCodeUrl: dataFromDb.paymentQrCodeUrl,
          rating: dataFromDb.rating || undefined,
          appliedPromotion: dataFromDb.appliedPromotion || undefined,
          discountAmount: dataFromDb.discountAmount || undefined,
        };
        return newOrder;
      } else {
         console.error("新创建的订单文档在创建后立即未找到。");
        return null; 
      }

    } catch (error) {
      console.error("向Firestore添加订单出错: ", error);
      setTimeout(() => {
        toast({
          title: "下单失败",
          description: "保存您的订单时发生错误，请重试。",
          variant: "destructive",
        });
      },0);
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    console.log(`向Firestore更新订单 ${orderId} 状态为 ${status}`);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status });
      return true;
    } catch (error) {
      console.error("向Firestore更新订单状态出错: ", error);
      setTimeout(() => {
      toast({
        title: "订单更新失败",
        description: `无法将订单状态更新为 ${translateOrderStatus(status)}。`,
        variant: "destructive",
      });
    },0);
      return false;
    }
  };

  const updateOrderRating = async (orderId: string, rating: number): Promise<boolean> => {
    console.log(`向Firestore更新订单 ${orderId} 评分为 ${rating}`);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { rating });
      setTimeout(() => {
      toast({ title: `已评价 ${rating} 星!`, description: "感谢您的反馈。" });
    },0);
      return true;
    } catch (error) {
      console.error("向Firestore更新订单评分出错: ", error);
      setTimeout(() => {
      toast({
        title: "评价失败",
        description: "无法保存您的评价，请重试。",
        variant: "destructive",
      });
    },0);
      return false;
    }
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrderRating, getOrderById, loadingOrders, fetchOrders: fetchOrdersInitial }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders 必须在 OrderProvider 中使用');
  }
  return context;
};
