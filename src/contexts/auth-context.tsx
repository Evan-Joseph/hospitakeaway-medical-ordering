
// src/contexts/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase'; 
import type { User, AuthError } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  getIdTokenResult
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import type { Restaurant, RestaurantStatus } from '@/types'; 

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean | null; // null if status unknown, true if admin, false if not
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

// !!! IMPORTANT FOR ADMIN FUNCTIONALITY !!!
// Replace with your actual admin email(s) for testing.
// For production, use Firebase Custom Claims for robust role management.
const ADMIN_EMAILS = ['admin@t.com', 'your-admin-email@domain.com']; 

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
    // Simplified admin check (NOT FOR PRODUCTION)
    // In production, use Firebase Custom Claims:
    // try {
    //   const idTokenResult = await getIdTokenResult(user);
    //   setIsAdmin(idTokenResult.claims.admin === true);
    // } catch (err) {
    //   console.error("Error getting custom claims:", err);
    //   setIsAdmin(false);
    // }
    const userIsAdmin = ADMIN_EMAILS.includes(user.email || '');
    setIsAdmin(userIsAdmin);
    console.log(`User ${user.email} is admin: ${userIsAdmin}`);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
  }, [checkAdminStatus, isAdmin]); // Added isAdmin to dependency array for safety, though checkAdminStatus is useCallback

  const clearError = () => setError(null);

  const signInWithEmailPasswordInternal = async (email: string, password: string): Promise<User | null> => {
    setLoadingAuth(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setCurrentUser and checkAdminStatus
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
      
      const restaurantRef = doc(db, "restaurants", user.uid);
      await setDoc(restaurantRef, newRestaurantData);

      // onAuthStateChanged will handle setCurrentUser and checkAdminStatus
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
      await firebaseSignOut(auth);
      // onAuthStateChanged will set currentUser to null and isAdmin to false
      toast({ title: "已登出", description: "您已成功登出。" });
      // Let individual pages handle redirection based on auth state
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
    <AuthContext.Provider value={{ currentUser, isAdmin, loadingAuth, signInWithEmailPassword: signInWithEmailPasswordInternal, signUpWithEmailPasswordAndRestaurant, signOut, error, clearError }}>
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
