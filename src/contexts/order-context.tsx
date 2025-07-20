
// src/contexts/order-context.tsx
"use client";

import type { Order, OrderStatus, CartItemType, Promotion } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
// 所有数据库操作方法现在通过适配器系统提供
// 无需直接导入 firebase/firestore
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
      // 使用适配器系统查询订单
      const ordersCollectionRef = db.collection("orders");
      const q = ordersCollectionRef.orderBy("orderDate", "desc");
      const querySnapshot = await q.get();
      const fetchedOrders = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          items: (data.items || []) as CartItemType[],
          totalAmount: data.totalAmount,
          status: data.status as OrderStatus,
          orderDate: data.orderDate?.toDate?.()?.toISOString() || new Date().toISOString(),
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
      console.error("从数据库初次获取订单出错: ", error);
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
    // 使用适配器系统进行实时监听
    const ordersCollectionRef = db.collection("orders");
    const q = ordersCollectionRef.orderBy("orderDate", "desc");

    const unsubscribe = q.onSnapshot((querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          items: (data.items || []) as CartItemType[],
          totalAmount: data.totalAmount,
          status: data.status as OrderStatus,
          orderDate: data.orderDate?.toDate?.()?.toISOString() || new Date().toISOString(),
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
      console.log("通过实时监听更新订单:", fetchedOrders.length);
    }, (error) => {
      console.error("实时监听订单出错: ", error);
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
    console.log("向数据库添加订单:", orderData);
    try {
      const ordersCollectionRef = db.collection("orders");
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
        orderDate: db.serverTimestamp ? db.serverTimestamp() : new Date(),
        status: orderData.status || (orderData.paymentQrCodeUrl ? 'Pending Payment' : 'Order Placed')
      };
      
      if (orderData.appliedPromotion) {
        docDataWithTimestamp.appliedPromotion = orderData.appliedPromotion;
      }
      if (orderData.discountAmount !== undefined) {
        docDataWithTimestamp.discountAmount = orderData.discountAmount;
      }


      // 使用适配器系统添加文档
      const docRef = await ordersCollectionRef.add(docDataWithTimestamp);
      const newDocSnap = await docRef.get(); 
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
          orderDate: dataFromDb.orderDate?.toDate?.()?.toISOString() || new Date().toISOString(),
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
      console.error("向数据库添加订单出错: ", error);
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
    console.log(`向数据库更新订单 ${orderId} 状态为 ${status}`);
    try {
      // 使用适配器系统更新文档
      const orderRef = db.doc(`orders/${orderId}`);
      await orderRef.update({ status });
      return true;
    } catch (error) {
      console.error("向数据库更新订单状态出错: ", error);
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
    console.log(`向数据库更新订单 ${orderId} 评分为 ${rating}`);
    try {
      // 使用适配器系统更新文档
      const orderRef = db.doc(`orders/${orderId}`);
      await orderRef.update({ rating });
      setTimeout(() => {
      toast({ title: `已评价 ${rating} 星!`, description: "感谢您的反馈。" });
    },0);
      return true;
    } catch (error) {
      console.error("向数据库更新订单评分出错: ", error);
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
