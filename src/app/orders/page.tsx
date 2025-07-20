
'use client';

import { useOrders } from '@/contexts/order-context';
import OrderItemCard from '@/components/orders/order-item-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PackageSearch, Utensils, Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const { orders, loadingOrders } = useOrders();

  if (loadingOrders) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-24 w-24 text-muted-foreground mb-6 animate-spin" />
        <h1 className="text-3xl font-semibold mb-4">正在加载订单...</h1>
        <p className="text-muted-foreground">请稍候，我们正在获取您的订单记录。</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageSearch className="h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4">暂无订单</h1>
        <p className="text-muted-foreground mb-8">您还没有下过任何订单。先去逛逛餐馆吧。</p>
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
      <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl text-center">您的订单</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => ( // Already sorted by date in context if using Firestore query, otherwise sort here
          <OrderItemCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

