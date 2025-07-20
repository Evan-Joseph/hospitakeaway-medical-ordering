
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/contexts/favorites-context';
import MenuItemCard from '@/components/restaurants/menu-item-card';
import { Button } from '@/components/ui/button';
import { HeartCrack, Utensils, Loader2, AlertTriangle } from 'lucide-react';
import type { MenuItem, Restaurant as RestaurantType } from '@/types';
import { db } from '@/lib/firebase';
// 移除Firebase导入 - 使用适配器系统
import { Skeleton } from '@/components/ui/skeleton';

const CardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export default function FavoritesPage() {
  const { favoriteItems, loadingFavorites: loadingFavoriteIds } = useFavorites(); 
  const [detailedFavoriteItems, setDetailedFavoriteItems] = useState<MenuItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (favoriteItems.length > 0 && !loadingFavoriteIds) {
      setLoadingDetails(true);
      setError(null);
      const fetchDetails = async () => {
        const items: MenuItem[] = [];
        const restaurantCache = new Map<string, RestaurantType>();

        for (const fav of favoriteItems) {
          try {
            let restaurantDoc: RestaurantType | undefined = restaurantCache.get(fav.restaurantId);
            if (!restaurantDoc) {
              // 使用适配器系统获取餐厅数据
              const docRef = db.doc(`restaurants/${fav.restaurantId}`);
              const docSnap = await docRef.get();
              if (docSnap.exists()) {
                const data = docSnap.data() as any;
                restaurantDoc = { id: docSnap.id, ...data } as RestaurantType;
                if (restaurantDoc) restaurantCache.set(fav.restaurantId, restaurantDoc);
              } else {
                console.warn(`餐馆 ${fav.restaurantId} 未找到，对应收藏商品 ${fav.itemId}`);
                continue; 
              }
            }

            if (restaurantDoc && restaurantDoc.menu) {
              const menuItem = restaurantDoc.menu.find(m => m.id === fav.itemId);
              if (menuItem) {
                items.push({ ...menuItem, restaurantId: fav.restaurantId });
              } else {
                 console.warn(`菜单项 ${fav.itemId} 未在餐馆 ${fav.restaurantId} 中找到`);
              }
            }
          } catch (fetchErr) {
            console.error(`获取收藏商品 ${fav.itemId} (餐馆 ${fav.restaurantId}) 详情出错:`, fetchErr);
          }
        }
        setDetailedFavoriteItems(items);
        if (items.length < favoriteItems.length) {
            console.warn("部分收藏商品未能完全加载。");
        }
        setLoadingDetails(false);
      };
      fetchDetails();
    } else if (favoriteItems.length === 0 && !loadingFavoriteIds) {
      setDetailedFavoriteItems([]); 
      setLoadingDetails(false);
    }
  }, [favoriteItems, loadingFavoriteIds]);

  const isLoading = loadingFavoriteIds || loadingDetails;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">我的收藏</h1>
          <p className="mt-2 text-lg text-foreground/80">正在加载您收藏的美味...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-semibold text-destructive mb-4">加载收藏出错</h1>
        <p className="text-muted-foreground mb-8">{error}</p>
        <Button asChild size="lg">
          <Link href="/restaurants">
            <Utensils className="mr-2 h-5 w-5" /> 浏览餐馆
          </Link>
        </Button>
      </div>
    );
  }


  if (detailedFavoriteItems.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <HeartCrack className="h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4">暂无收藏</h1>
        <p className="text-muted-foreground mb-8">
          您还没有收藏任何商品。
          <br />
          去逛逛餐馆，点击心形图标即可收藏您喜欢的菜品！
        </p>
        <Button asChild size="lg">
          <Link href="/restaurants">
            <Utensils className="mr-2 h-5 w-5" /> 浏览餐馆
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">我的收藏</h1>
        <p className="mt-2 text-lg text-foreground/80">
          所有您珍藏的美味都在这里，方便快速查找。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {detailedFavoriteItems.map((item) => (
          <MenuItemCard key={`${item.restaurantId}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}
