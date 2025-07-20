
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import CartItemRow from '@/components/cart/cart-item-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Trash2, ArrowRight, Utensils, Loader2, Tag } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Restaurant, Promotion } from '@/types';

export default function CartPage() {
  const { cartItems, getCartTotal, clearCart, getItemCount, getCartRestaurantId } = useCart();
  const cartSubtotal = getCartTotal();
  const itemCount = getItemCount();
  const restaurantId = getCartRestaurantId();
  
  const [restaurantDetails, setRestaurantDetails] = useState<Restaurant | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [calculatedDiscount, setCalculatedDiscount] = useState<number>(0);

  const finalTotal = cartSubtotal - calculatedDiscount;

  useEffect(() => {
    if (restaurantId) {
      setLoadingRestaurant(true);
      const fetchRestaurantDetails = async () => {
        try {
          const restaurantDocRef = doc(db, "restaurants", restaurantId);
          const docSnap = await getDoc(restaurantDocRef);
          if (docSnap.exists()) {
            const restaurantData = { id: docSnap.id, ...docSnap.data(), promotions: docSnap.data()?.promotions || [] } as Restaurant;
            setRestaurantDetails(restaurantData);
          } else {
            setRestaurantDetails(null);
            console.error("购物车：未找到餐馆详情。");
          }
        } catch (error) {
          console.error("购物车：获取餐馆详情出错:", error);
          setRestaurantDetails(null);
        } finally {
          setLoadingRestaurant(false);
        }
      };
      fetchRestaurantDetails();
    } else {
      setRestaurantDetails(null);
      setLoadingRestaurant(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantDetails && restaurantDetails.promotions && cartSubtotal > 0) {
      const activePromos = restaurantDetails.promotions.filter(p => p.isActive && p.type === 'discount_fixed_amount');
      let bestPromo: Promotion | null = null;
      let bestDiscount = 0;

      for (const promo of activePromos) {
        if (cartSubtotal >= (promo.details.minValue || 0)) {
          const currentDiscount = promo.details.amount || 0;
          if (currentDiscount > bestDiscount) {
            bestDiscount = currentDiscount;
            bestPromo = promo;
          }
        }
      }
      setAppliedPromotion(bestPromo);
      setCalculatedDiscount(bestDiscount);
    } else {
      setAppliedPromotion(null);
      setCalculatedDiscount(0);
    }
  }, [restaurantDetails, cartSubtotal]);


  if (itemCount === 0 && !loadingRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingCart className="h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4">您的购物车是空的</h1>
        <p className="text-muted-foreground mb-8">看起来您还没有添加任何商品到购物车。</p>
        <Button asChild size="lg">
          <Link href="/restaurants">
            <Utensils className="mr-2 h-5 w-5" /> 开始购物
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">您的购物车</h1>
        {itemCount > 0 && (
          <Button variant="outline" onClick={clearCart} className="text-destructive border-destructive hover:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" /> 清空购物车
          </Button>
        )}
      </div>

      {loadingRestaurant && itemCount > 0 ? (
        <div className="flex items-center space-x-2 text-lg text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>加载餐馆信息...</span>
        </div>
      ) : restaurantDetails && (
        <p className="text-lg text-muted-foreground">
          订购自: <span className="font-semibold text-primary">{restaurantDetails.name}</span>
        </p>
      )}

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">商品</TableHead>
                <TableHead className="w-[25%] text-center">数量</TableHead>
                <TableHead className="w-[15%] text-right">小计</TableHead>
                <TableHead className="w-[10%] text-right">移除</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.map(item => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </TableBody>
             {cartItems.length === 0 && !loadingRestaurant && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">您的购物车当前为空。</TableCell>
                </TableRow>
            )}
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-lg sticky bottom-4 z-10">
        <CardHeader>
          <CardTitle>订单摘要</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">商品总数:</span>
            <span>{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">小计:</span>
            <span>¥{cartSubtotal.toFixed(2)}</span>
          </div>
          {appliedPromotion && calculatedDiscount > 0 && (
            <div className="flex justify-between text-accent">
              <span className="flex items-center"><Tag className="mr-1 h-4 w-4" /> {appliedPromotion.description}:</span>
              <span>- ¥{calculatedDiscount.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-2"/>
          <div className="flex justify-between text-xl font-bold">
            <span>总金额:</span>
            <span className="text-primary">¥{finalTotal.toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild disabled={itemCount === 0 || loadingRestaurant}>
            <Link href="/checkout">
              {loadingRestaurant && itemCount > 0 ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              去结算 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
