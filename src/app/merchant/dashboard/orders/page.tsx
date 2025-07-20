
'use client';

import { useEffect, useState, useCallback } from 'react'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrders } from '@/contexts/order-context';
import MerchantOrderItemCard from '@/components/merchant/merchant-order-item-card';
import { Button } from '@/components/ui/button';
import { PackageSearch, Loader2, ArrowLeft, ShoppingBag, AlertTriangle } from 'lucide-react';


export default function MerchantOrdersPage() {
  const { currentUser, loadingAuth } = useAuth();
  const { orders, loadingOrders } = useOrders(); 
  const router = useRouter();
  const [merchantOrders, setMerchantOrders] = useState<typeof orders>([]); 

  useEffect(() => {
    if (!loadingAuth && !currentUser) {
      router.push('/merchant/login');
    }
  }, [currentUser, loadingAuth, router]);

  useEffect(() => {
    if (currentUser && currentUser.uid && Array.isArray(orders)) {
      const filtered = orders.filter(order => order.restaurantId === currentUser.uid);
      setMerchantOrders(filtered);
    } else {
      setMerchantOrders([]); 
    }
  }, [currentUser, orders]); 


  if (loadingAuth || (!currentUser && !loadingAuth && router && router.asPath && !router.asPath.includes('/merchant/login'))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-24 w-24 text-primary mb-6 animate-spin" />
        <h1 className="text-3xl font-semibold mb-4">
          {loadingAuth ? "正在验证身份..." : "正在跳转至登录..."}
        </h1>
      </div>
    );
  }
  
  if (currentUser && loadingOrders && merchantOrders.length === 0 && orders.length === 0) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-24 w-24 text-primary mb-6 animate-spin" />
        <h1 className="text-3xl font-semibold mb-4">正在加载订单...</h1>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
           <ShoppingBag className="inline-block h-8 w-8 mr-2 align-text-bottom" />
           订单管理
        </h1>
        <Button variant="outline" onClick={() => router.push('/merchant/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回仪表盘
        </Button>
      </div>
      {currentUser && (
        <div className="p-3 bg-secondary/70 border-l-4 border-primary text-foreground rounded-md text-sm">
          <AlertTriangle className="inline-block h-4 w-4 mr-1 align-text-top text-primary" />
          正在显示您的餐馆 (用户: {currentUser?.email}) 的订单。
          您的餐馆 ID 是: <strong>{currentUser?.uid}</strong>。
        </div>
      )}

      {merchantOrders.length === 0 && !loadingOrders ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageSearch className="h-24 w-24 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-semibold mb-4">您的餐馆暂无订单</h1>
          <p className="text-muted-foreground mb-8">
            当前您的餐馆还没有任何订单。
            <br/>
            当顾客下单后，订单会显示在这里。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchantOrders.map(order => (
            <MerchantOrderItemCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
