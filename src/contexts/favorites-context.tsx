
// src/contexts/favorites-context.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { FavoriteItem } from '@/types';
import { db } from '@/lib/firebase';
// 所有数据库操作方法现在通过适配器系统提供
// 无需直接导入 firebase/firestore

interface FavoritesContextType {
  favoriteItems: FavoriteItem[];
  addFavorite: (itemId: string, restaurantId: string, itemName: string) => Promise<void>;
  removeFavorite: (itemId: string, restaurantId: string, itemName?: string) => Promise<void>;
  isFavorite: (itemId: string, restaurantId: string) => boolean;
  toggleFavorite: (itemId: string, restaurantId: string, itemName: string) => Promise<void>;
  loadingFavorites: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_COLLECTION_NAME = 'favorites';

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    console.log("从数据库获取收藏...");
    try {
      // 使用适配器系统查询收藏
      const favoritesCollectionRef = db.collection(FAVORITES_COLLECTION_NAME);
      const q = favoritesCollectionRef.orderBy("addedAt", "desc");
      const querySnapshot = await q.get();
      const fetchedFavorites = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          itemId: data.itemId,
          restaurantId: data.restaurantId,
          itemName: data.itemName,
        } as FavoriteItem; 
      });
      setFavoriteItems(fetchedFavorites);
      console.log("收藏获取成功:", fetchedFavorites.length);
    } catch (error) {
      console.error("从数据库获取收藏出错: ", error);
      toast({
        title: "获取收藏失败",
        description: "无法加载您的收藏商品，请稍后再试。",
        variant: "destructive",
      });
      setFavoriteItems([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = useCallback(async (itemId: string, restaurantId: string, itemName: string) => {
    const favoriteId = `${restaurantId}_${itemId}`;
    console.log(`向数据库添加收藏 ${favoriteId}`);
    try {
      // 使用适配器系统设置文档
      const favoriteDocRef = db.doc(`${FAVORITES_COLLECTION_NAME}/${favoriteId}`);
      const newFavorite: FavoriteItem & { addedAt: Date } = {
        itemId,
        restaurantId,
        itemName,
        addedAt: new Date(),
      };
      await favoriteDocRef.set(newFavorite);
      
      setFavoriteItems((prevItems) => {
        if (!prevItems.some(item => item.itemId === itemId && item.restaurantId === restaurantId)) {
          return [{ itemId, restaurantId, itemName, addedAt: newFavorite.addedAt }, ...prevItems]; // Keep local sort consistent
        }
        return prevItems;
      });
      setTimeout(() => {
        toast({
          title: "已添加到收藏!",
          description: `${itemName} 已添加到您的收藏夹。`,
        });
      },0);
    } catch (error) {
      console.error("向数据库添加收藏出错: ", error);
      setTimeout(() => {
      toast({
        title: "添加收藏失败",
        description: "保存您的收藏时发生错误，请重试。",
        variant: "destructive",
      });
    },0);
    }
  }, [toast]);

  const removeFavorite = useCallback(async (itemId: string, restaurantId: string, itemName?: string) => {
    const favoriteId = `${restaurantId}_${itemId}`;
    console.log(`从数据库移除收藏 ${favoriteId}`);
    const itemNameToDisplay = itemName || favoriteItems.find(fav => fav.itemId === itemId && fav.restaurantId === restaurantId)?.itemName || "商品";
    try {
      // 使用适配器系统删除文档
      const favoriteDocRef = db.doc(`${FAVORITES_COLLECTION_NAME}/${favoriteId}`);
      await favoriteDocRef.delete();

      setFavoriteItems((prevItems) => prevItems.filter(item => !(item.itemId === itemId && item.restaurantId === restaurantId)));
      setTimeout(() => {
        toast({
          title: "已从收藏中移除",
          description: `${itemNameToDisplay} 已从您的收藏夹中移除。`,
          variant: "default"
        });
      },0);
    } catch (error) {
      console.error("从数据库移除收藏出错: ", error);
      setTimeout(() => {
        toast({
          title: "移除收藏失败",
          description: "移除收藏时发生错误，请重试。",
          variant: "destructive",
        });
      },0);
    }
  }, [toast, favoriteItems]);

  const isFavorite = useCallback((itemId: string, restaurantId: string) => {
    return favoriteItems.some(item => item.itemId === itemId && item.restaurantId === restaurantId);
  }, [favoriteItems]);

  const toggleFavorite = useCallback(async (itemId: string, restaurantId: string, itemName: string) => {
    if (isFavorite(itemId, restaurantId)) {
      await removeFavorite(itemId, restaurantId, itemName);
    } else {
      await addFavorite(itemId, restaurantId, itemName);
    }
  }, [isFavorite, addFavorite, removeFavorite]);


  return (
    <FavoritesContext.Provider
      value={{
        favoriteItems,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        loadingFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites 必须在 FavoritesProvider 中使用');
  }
  return context;
};
