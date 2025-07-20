
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useOrders } from '@/contexts/order-context';
import type { Order, OrderStatus as OrderStatusType, Promotion } from '@/types';
import OrderStatusStepper from '@/components/orders/order-status-stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, MapPin, CalendarDays, Hash, ShoppingBag, Star, CircleDollarSign, Utensils, Loader2, User, Phone, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge'; 
import { cn } from '@/lib/utils'; 

// Helper for status translation
const translateOrderStatus = (status: OrderStatusType): string => {
  const map: Record<OrderStatusType, string> = {
    'Pending Payment': '等待付款',
    'Order Placed': '订单已下单',
    'Preparing': '准备中',
    'Out for Delivery': '配送中',
    'Delivered': '已送达',
    'Cancelled': '已取消'
  };
  return map[status] || status;
};

const getStatusBadgeVariant = (status: OrderStatusType): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Delivered': return 'default';
    case 'Out for Delivery': return 'secondary';
    case 'Preparing': return 'secondary';
    case 'Order Placed': return 'outline';
    case 'Pending Payment': return 'outline';
    case 'Cancelled': return 'destructive';
    default: return 'secondary';
  }
};


export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { orderId } = params;
  const { getOrderById, updateOrderStatus, updateOrderRating, loadingOrders: ordersLoadingContext, fetchOrders } = useOrders();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null | undefined>(undefined); 
  const [localRating, setLocalRating] = useState(0); 
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true); 
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);


  useEffect(() => {
    async function loadOrder() {
      if (orderId) {
        setIsLoading(true);
        let foundOrder = getOrderById(orderId as string);
        if (ordersLoadingContext || !foundOrder) {
          // await fetchOrders(); // fetchOrders is not directly exposed by context anymore, rely on onSnapshot or initial load
          // For now, if order not found immediately and context is loading, we wait for context to update.
          // If context isn't loading and order not found, it's likely a bad ID or data issue.
        }
        setOrder(foundOrder); // Will be undefined if not found after context load
        if (foundOrder?.rating) {
          setLocalRating(foundOrder.rating); 
        } else {
          setLocalRating(0); 
        }
        setIsLoading(false); // Set loading to false once attempt to find order is done
      }
    }
    loadOrder();
  }, [orderId, getOrderById, ordersLoadingContext]); 
  
  useEffect(() => {
    if (order?.rating) {
      setLocalRating(order.rating);
    }
  }, [order?.rating]);


  const handleConfirmDelivery = async () => {
    if (order) {
      const success = await updateOrderStatus(order.id, 'Delivered');
      if (success) {
        setOrder(prev => prev ? { ...prev, status: 'Delivered' } : null);
        toast({ title: "已确认送达!", description: "感谢您的确认。" });
      }
    }
  };

  const handleSetRating = async (rate: number) => {
    if (!order || isSubmittingRating || order.rating) return; 

    setIsSubmittingRating(true);
    setLocalRating(rate); 
    const success = await updateOrderRating(order.id, rate);
    if (success) {
       setOrder(prev => prev ? { ...prev, rating: rate } : null); 
    } else {
      setLocalRating(order.rating || 0); 
    }
    setIsSubmittingRating(false);
  };

  if (isLoading || ordersLoadingContext) { 
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-16 w-16 text-muted-foreground mb-6 animate-spin" />
        <h1 className="text-2xl font-semibold">正在加载订单详情...</h1>
      </div>
    );
  }

  if (order === null || order === undefined) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold">未找到订单</h1>
        <p className="text-muted-foreground">您查找的订单不存在或仍在加载中。</p>
        <Button variant="link" onClick={() => router.push('/orders')} className="mt-4">
          查看所有订单
        </Button>
      </div>
    );
  }
  
  const subtotal = order.totalAmount + (order.discountAmount || 0);

  return (
    <div className="space-y-8">
       <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回订单列表
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <CardTitle className="text-2xl sm:text-3xl text-primary">订单详情</CardTitle>
            <Badge variant={getStatusBadgeVariant(order.status)} className="text-lg px-4 py-2 self-start sm:self-center">{translateOrderStatus(order.status)}</Badge>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            <Hash className="inline h-4 w-4 mr-1" />ID: {order.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Utensils className="mr-2 h-5 w-5 text-primary" />餐馆</h3>
            <p>{order.restaurantName}</p>
          </div>
          <Separator />
           <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><User className="mr-2 h-5 w-5 text-primary" />联系人姓名</h3>
            <p>{order.customerName}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Phone className="mr-2 h-5 w-5 text-primary" />联系电话</h3>
            <p>{order.customerPhone}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" />配送位置</h3>
            <p>{order.deliveryLocation}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" />下单日期</h3>
            <p>{new Date(order.orderDate).toLocaleString()}</p>
          </div>
          <Separator />
           {order.status !== 'Pending Payment' && order.verificationCode && (
            <div>
              <h3 className="text-lg font-semibold mb-2">取餐验证码</h3>
              <p className="font-mono text-accent text-xl bg-muted/50 p-2 rounded inline-block">{order.verificationCode}</p>
            </div>
           )}
          <Separator />
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4 text-primary">订单进度</h3>
            <OrderStatusStepper currentStatus={order.status} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><ShoppingBag className="mr-2 text-primary" />所点商品</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {order.items.map(item => (
              <li key={item.id} className="flex items-start space-x-4 p-3 border rounded-md bg-muted/20">
                <div className="relative h-20 w-20 rounded-md overflow-hidden shrink-0">
                  <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint || "food item"} />
                </div>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">数量: {item.quantity}</p>
                  <p className="text-sm text-muted-foreground">价格: ¥{item.price.toFixed(2)} /份</p>
                </div>
                <p className="ml-auto font-semibold text-primary">¥{(item.price * item.quantity).toFixed(2)}</p>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="text-right space-y-2">
            <p className="text-md">
              小计: <span className="font-semibold">¥{subtotal.toFixed(2)}</span>
            </p>
            {order.appliedPromotion && order.discountAmount && order.discountAmount > 0 && (
              <p className="text-md text-accent flex justify-end items-center">
                <Tag className="mr-1 h-4 w-4" /> {order.appliedPromotion.description}: <span className="font-semibold ml-1">- ¥{order.discountAmount.toFixed(2)}</span>
              </p>
            )}
             <Separator className="my-2" />
            <p className="text-lg font-semibold flex justify-end items-center">
              <CircleDollarSign className="mr-2 h-5 w-5 text-primary" /> 总金额: <span className="text-2xl text-primary ml-2">¥{order.totalAmount.toFixed(2)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {order.status === 'Out for Delivery' && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Button onClick={handleConfirmDelivery} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
              确认已送达
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === 'Delivered' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {order.rating ? "您的评价" : "评价您的订单"}
            </CardTitle>
            {order.rating && <CardDescription>您之前已评价过此订单。</CardDescription>}
          </CardHeader>
          <CardContent className="flex items-center space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={cn(
                  "h-8 w-8",
                  order.rating ? "cursor-default" : "cursor-pointer", 
                  (hoverRating || localRating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                )}
                onMouseEnter={() => !order.rating && !isSubmittingRating && setHoverRating(star)}
                onMouseLeave={() => !order.rating && !isSubmittingRating && setHoverRating(0)}
                onClick={() => !order.rating && !isSubmittingRating && handleSetRating(star)}
                aria-disabled={!!order.rating || isSubmittingRating}
                aria-label={`${star} 星`}
              />
            ))}
            {isSubmittingRating && <Loader2 className="h-6 w-6 animate-spin ml-3" />}
            {order.rating && !isSubmittingRating && (
              <p className="ml-2 sm:ml-4 text-sm text-muted-foreground">
                感谢您的 {order.rating} 星评价!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
