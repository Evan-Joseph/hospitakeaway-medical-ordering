
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Restaurant as RestaurantType, MenuItem as MenuItemType, Promotion } from '@/types';
import MenuItemCard from '@/components/restaurants/menu-item-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Star, Clock, Utensils, AlertTriangle, Loader2, Info, Tag } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
// 移除Firebase导入 - 使用适配器系统
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export default function RestaurantMenuPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;
  
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getItemCount, getCartRestaurantId } = useCart();
  const cartItemCount = getItemCount();
  const cartRestaurantId = getCartRestaurantId();

  useEffect(() => {
    if (restaurantId) {
      const fetchRestaurant = async () => {
        setLoading(true);
        setError(null);
        try {
          // 使用适配器系统获取餐厅数据
          const restaurantDocRef = db.doc(`restaurants/${restaurantId}`);
          const docSnap = await restaurantDocRef.get();

          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            setRestaurant({ 
              id: docSnap.id, 
              ...data,
              menu: data?.menu?.filter((item: any) => item.isAvailable !== false) || [], 
              promotions: data?.promotions || [] 
            } as RestaurantType);
          } else {
            setError("餐馆未找到。");
          }
        } catch (err) {
          console.error("获取餐馆详情出错:", err);
          setError("加载餐馆详情失败，请稍后再试。");
        } finally {
          setLoading(false);
        }
      };
      fetchRestaurant();
    } else {
        setError("未提供餐馆ID。");
        setLoading(false);
    }
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-1/4 mb-6" /> 
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="mt-4 p-4 bg-card rounded-lg shadow space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/2" />
        </div>
        {/* Skeleton for Promotions */}
        <div className="mt-4 p-4 bg-card rounded-lg shadow space-y-2">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="mt-8">
            <Skeleton className="h-8 w-1/5 mb-6" /> 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-semibold text-destructive mb-4">错误</h1>
        <p className="text-muted-foreground mb-8">{error}</p>
        <Button onClick={() => router.push('/restaurants')}>
          <ArrowLeft className="mr-2 h-4 w-4" />返回餐馆列表
        </Button>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Utensils className="h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-semibold mb-4">未找到餐馆</h1>
        <p className="text-muted-foreground mb-8">您查找的餐馆不存在或无法加载。</p>
        <Button onClick={() => router.push('/restaurants')}>
           <ArrowLeft className="mr-2 h-4 w-4" /> 返回餐馆列表
        </Button>
      </div>
    );
  }

  const showRestaurantMismatchAlert = cartRestaurantId !== null && cartRestaurantId !== restaurant.id && cartItemCount > 0;
  const activePromotions = restaurant.promotions?.filter(promo => promo.isActive) || [];
  const availableMenuItems = restaurant.menu || []; // Already filtered in useEffect

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回
      </Button>

      <header className="mb-4">
        <div className="relative h-64 w-full rounded-lg overflow-hidden shadow-lg">
          <Image
            src={restaurant.imageUrl || "https://placehold.co/800x400.png"}
            alt={restaurant.name}
            fill
            style={{objectFit:"cover"}}
            priority
            data-ai-hint={restaurant.dataAiHint || "restaurant food"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-4xl font-bold text-white">{restaurant.name}</h1>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-card rounded-lg shadow">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center text-sm text-muted-foreground"><Utensils className="h-4 w-4 mr-1 text-primary" /> {restaurant.cuisine}</span>
            <span className="flex items-center text-sm text-muted-foreground"><Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" /> {restaurant.rating?.toFixed(1) || '暂无评分'}</span>
            <span className="flex items-center text-sm text-muted-foreground"><Clock className="h-4 w-4 mr-1 text-primary" /> {restaurant.deliveryTime}</span>
          </div>
           {cartItemCount > 0 && (
             <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2 sm:mt-0">
              <Link href="/cart">
                <ShoppingCart className="mr-2 h-5 w-5" /> 查看购物车 ({cartItemCount})
              </Link>
            </Button>
           )}
        </div>
      </header>

      {activePromotions.length > 0 && (
        <Alert variant="default" className="bg-accent/10 border-accent/50 text-accent-foreground">
          <Tag className="h-5 w-5 text-accent" />
          <AlertTitle className="font-semibold text-accent">当前优惠活动!</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              {activePromotions.map(promo => (
                <li key={promo.id}>
                  {promo.description} 
                  {promo.details.minValue && promo.details.amount ? 
                    ` (满 ¥${promo.details.minValue} 减 ¥${promo.details.amount})` 
                    : (promo.details.amount ? ` (减 ¥${promo.details.amount})` : '')}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {showRestaurantMismatchAlert && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>警告!</AlertTitle>
          <AlertDescription>
            您的购物车中包含来自其他餐馆的商品。从 <strong>{restaurant.name}</strong> 添加商品将需要您先清空当前购物车或完成当前订单。
          </AlertDescription>
        </Alert>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-6 text-primary">菜单</h2>
        {availableMenuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableMenuItems.map((item: MenuItemType) => (
              <MenuItemCard key={item.id} item={{...item, restaurantId: restaurant.id}} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Info className="mx-auto h-12 w-12 mb-4" />
            <p>该餐馆暂未添加任何可售商品，或所有商品当前均不可用。</p>
          </div>
        )}
      </section>
    </div>
  );
}
