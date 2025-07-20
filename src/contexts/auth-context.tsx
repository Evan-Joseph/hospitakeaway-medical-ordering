
// src/contexts/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthAdapter, type User, type AuthError } from '@/lib/adapters/auth-adapter';
import { DatabaseAdapter } from '@/lib/adapters/database-adapter';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import type { Restaurant, RestaurantStatus } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean | null;
  loadingAuth: boolean;
  signInWithEmailPassword: (email: string, password: string) => Promise<User | null>;
  signUpWithEmailPasswordAndRestaurant: (
    email: string, 
    password: string, 
    restaurantName: string, 
    restaurantCuisine: string
  ) => Promise<User | null>;
  signOut: () => Promise<void>;
  error: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 管理员邮箱列表
const ADMIN_EMAILS = ['admin@t.com', 'your-admin-email@domain.com'];

// 初始化适配器
const authAdapter = new AuthAdapter();
const dbAdapter = new DatabaseAdapter();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    // 简化的管理员检查
    const userIsAdmin = ADMIN_EMAILS.includes(user.email || '');
    setIsAdmin(userIsAdmin);
    console.log(`User ${user.email} is admin: ${userIsAdmin}`);
  }, []);

  useEffect(() => {
    // 监听认证状态变化
    const unsubscribe = authAdapter.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      await checkAdminStatus(user);
      setLoadingAuth(false);
      if (user) {
        console.log("用户已登录:", user.uid, "是管理员:", isAdmin);
      } else {
        console.log("用户已登出或未认证。");
      }
    });
    return () => unsubscribe();
  }, [checkAdminStatus, isAdmin]);

  const clearError = () => setError(null);

  const signInWithEmailPasswordInternal = async (email: string, password: string): Promise<User | null> => {
    setLoadingAuth(true);
    setError(null);
    try {
      const userCredential = await authAdapter.signInWithEmailAndPassword(email, password);
      toast({ title: "登录成功", description: "欢迎回来！" });
      setLoadingAuth(false);
      return userCredential.user;
    } catch (err) {
      const authError = err as AuthError;
      console.error("登录出错:", authError);
      setError(authError);
      toast({ title: "登录失败", description: authError.message || "邮箱或密码错误。", variant: "destructive" });
      setLoadingAuth(false);
      return null;
    }
  };

  const signUpWithEmailPasswordAndRestaurant = async (
    email: string, 
    password: string, 
    restaurantName: string, 
    restaurantCuisine: string
  ): Promise<User | null> => {
    setLoadingAuth(true);
    setError(null);
    try {
      const userCredential = await authAdapter.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const newRestaurantData: Restaurant = { 
        id: user.uid, 
        name: restaurantName,
        cuisine: restaurantCuisine,
        ownerUid: user.uid,
        menu: [], 
        rating: 0, 
        imageUrl: `https://placehold.co/600x400.png?text=${encodeURIComponent(restaurantName)}`, 
        dataAiHint: restaurantCuisine.toLowerCase().split(',')[0].trim() || "restaurant food",
        deliveryTime: "20-30 分钟", 
        distance: "0.5 公里",
        activePaymentMethods: [],
        promotions: [],
        description: "",
        status: 'Pending' as RestaurantStatus,
      };
      
      // 使用数据库适配器保存餐厅信息
      await dbAdapter.setDoc(`restaurants/${user.uid}`, newRestaurantData);

      toast({ title: "注册成功!", description: "您的餐馆已创建。等待管理员审核。" });
      setLoadingAuth(false);
      return user;
    } catch (err) {
      const authError = err as AuthError;
      console.error("注册出错:", authError);
      setError(authError);
      toast({ title: "注册失败", description: authError.message || "注册时发生错误。", variant: "destructive" });
      setLoadingAuth(false);
      return null;
    }
  };

  const signOut = async () => {
    setLoadingAuth(true);
    setError(null);
    try {
      await authAdapter.signOut();
      toast({ title: "已登出", description: "您已成功登出。" });
    } catch (err) {
      const authError = err as AuthError;
      console.error("登出出错:", authError);
      setError(authError);
      toast({
        title: "登出失败",
        description: authError.message || "登出时发生错误。",
        variant: "destructive",
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAdmin, 
      loadingAuth, 
      signInWithEmailPassword: signInWithEmailPasswordInternal, 
      signUpWithEmailPasswordAndRestaurant, 
      signOut, 
      error, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 中使用');
  }
  return context;
};
