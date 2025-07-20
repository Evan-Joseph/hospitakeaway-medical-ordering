
'use client';

import type { Order, OrderStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { useOrders } from '@/contexts/order-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Package, CalendarDays, Hash, User, Phone, MapPin, CircleDollarSign, CookingPot, Truck, CheckCircle, XCircle, Loader2, MessageSquareWarning, ArrowRight, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MerchantOrderItemCardProps {
  order: Order;
}

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

const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
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

const nextPositiveStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  'Pending Payment': 'Order Placed',
  'Order Placed': 'Preparing',
  'Preparing': 'Out for Delivery',
  'Out for Delivery': 'Delivered',
};

const nextPositiveStatusButtonText: Partial<Record<OrderStatus, string>> = {
  'Pending Payment': "确认收款并接单",
  'Order Placed': "开始备餐",
  'Preparing': "标记为配送中",
  'Out for Delivery': "标记为已送达",
};

const nextPositiveStatusButtonIcon: Partial<Record<OrderStatus, React.ElementType>> = {
    'Pending Payment': CheckCircle,
    'Order Placed': CookingPot,
    'Preparing': Truck,
    'Out for Delivery': CheckCircle,
};


export default function MerchantOrderItemCard({ order }: MerchantOrderItemCardProps) {
  const { updateOrderStatus } = useOrders();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (newStatus === order.status || isUpdating) return;

    setIsUpdating(true);
    const success = await updateOrderStatus(order.id, newStatus);
    if (success) {
      toast({
        title: '订单状态已更新',
        description: `订单 ${order.id.substring(order.id.length - 6).toUpperCase()} 状态已变更为 ${translateOrderStatus(newStatus)}。`,
      });
    } else {
      toast({
        title: '更新失败',
        description: `无法更新订单状态。当前状态: ${translateOrderStatus(order.status)}。`,
        variant: 'destructive',
      });
    }
    setIsUpdating(false);
    if (newStatus === 'Cancelled') setIsCancelAlertOpen(false);
  };

  const currentOrderStatus = order.status;
  const nextStatus = nextPositiveStatusMap[currentOrderStatus];
  const buttonText = nextStatus ? nextPositiveStatusButtonText[currentOrderStatus] : "无后续操作";
  const ButtonIcon = nextStatus ? nextPositiveStatusButtonIcon[currentOrderStatus] : ArrowRight;


  const canAdvanceOrder = !!nextStatus && currentOrderStatus !== 'Delivered' && currentOrderStatus !== 'Cancelled';
  const canCancelOrder = currentOrderStatus !== 'Delivered' && currentOrderStatus !== 'Cancelled';

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center text-lg mb-1">
            <Hash className="mr-2 h-5 w-5 text-primary" /> 订单号: {order.id.substring(order.id.length - 6).toUpperCase()}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1">
            {translateOrderStatus(order.status)}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          <CalendarDays className="mr-1 h-3 w-3 inline-block" />
          {new Date(order.orderDate).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <h4 className="font-semibold flex items-center mb-1"><User className="mr-2 h-4 w-4 text-primary" />顾客信息</h4>
          <p>称呼: {order.customerName}</p>
          <p>电话: {order.customerPhone}</p>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold flex items-center mb-1"><MapPin className="mr-2 h-4 w-4 text-primary" />配送信息</h4>
          <p>{order.deliveryLocation}</p>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold flex items-center mb-1"><Package className="mr-2 h-4 w-4 text-primary" />商品列表</h4>
          <ul className="list-disc list-inside pl-1">
            {order.items.map(item => (
              <li key={item.id}>{item.name} x {item.quantity} (¥{(item.price * item.quantity).toFixed(2)})</li>
            ))}
          </ul>
        </div>
        <Separator />
        {order.verificationCode && (
          <div>
            <h4 className="font-semibold flex items-center mb-1"><MessageSquareWarning className="mr-2 h-4 w-4 text-primary" />取餐验证码</h4>
            <p className="font-mono text-lg text-accent p-2 bg-muted/50 rounded inline-block">{order.verificationCode}</p>
          </div>
        )}
        <Separator />
        <div className="flex items-center font-semibold">
          <CircleDollarSign className="mr-2 h-4 w-4 text-primary" />
          总金额: <span className="text-primary ml-1">¥{order.totalAmount.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-4 border-t">
        <div className="w-full space-y-2">
            <div className="flex items-center space-x-2">
                <Button 
                    onClick={() => nextStatus && handleStatusUpdate(nextStatus)} 
                    disabled={!canAdvanceOrder || isUpdating}
                    className="flex-grow"
                    variant={currentOrderStatus === 'Pending Payment' ? 'default' : 'outline'}
                >
                    {isUpdating && nextStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ButtonIcon && <ButtonIcon className="mr-2 h-4 w-4" />}
                    {buttonText}
                </Button>

                <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            disabled={!canCancelOrder || isUpdating}
                            title="取消订单"
                        >
                            <Ban className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>您确定要取消此订单吗?</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作无法撤销。这会将订单标记为“已取消”。
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>否，保留订单</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => handleStatusUpdate('Cancelled')} 
                            disabled={isUpdating}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            是，取消订单
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
             {(!canAdvanceOrder && !canCancelOrder && !isUpdating) && (
                <p className="text-xs text-muted-foreground text-center">
                    此订单状态为 {translateOrderStatus(order.status).toLowerCase()}，无法进一步更新。
                </p>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
