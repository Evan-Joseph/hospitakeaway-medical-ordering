
import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, CalendarDays, Hash, Store, CircleDollarSign, RotateCcw } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/cart-context'; 

interface OrderItemCardProps {
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
    case 'Delivered':
      return 'default'; 
    case 'Out for Delivery':
    case 'Preparing':
      return 'secondary'; 
    case 'Pending Payment':
    case 'Order Placed':
      return 'outline'; 
    case 'Cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function OrderItemCard({ order }: OrderItemCardProps) {
  const { reOrderItems, getCartRestaurantId, cartItems } = useCart();
  const cartRestaurantId = getCartRestaurantId();
  const isCartNotEmptyFromDifferentRestaurant = cartItems.length > 0 && cartRestaurantId !== null && cartRestaurantId !== order.restaurantId;

  const handleReOrder = () => {
    if (order.items && order.items.length > 0) {
      reOrderItems(order);
    } else {
      reOrderItems(order); 
    }
  };
  
  const reOrderButtonTitle = isCartNotEmptyFromDifferentRestaurant 
    ? `清空购物车中其他餐馆的商品后，才能从 ${order.restaurantName} 重新下单` 
    : order.items && order.items.length > 0 
      ? `从 ${order.restaurantName} 重新下单`
      : "此订单无商品可重新下单";

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-xl mb-1">
              <Hash className="mr-2 h-5 w-5 text-primary" /> 订单号: {order.id.substring(order.id.length - 6).toUpperCase()}
            </CardTitle>
            <CardDescription className="flex items-center text-sm">
              <Store className="mr-2 h-4 w-4 text-muted-foreground" /> {order.restaurantName}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1">
            {translateOrderStatus(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-muted-foreground text-sm">
          <CalendarDays className="mr-2 h-4 w-4" /> 
          下单于: {new Date(order.orderDate).toLocaleDateString()} {new Date(order.orderDate).toLocaleTimeString()}
        </div>
        <div className="flex items-center text-muted-foreground text-sm">
          <CircleDollarSign className="mr-2 h-4 w-4" /> 
          总金额: <span className="font-semibold text-primary ml-1">¥{order.totalAmount.toFixed(2)}</span>
        </div>
         <div className="flex items-center text-muted-foreground text-sm">
          <Package className="mr-2 h-4 w-4" /> 
          商品数: {order.items.reduce((acc, item) => acc + item.quantity, 0)}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 items-stretch">
        <Button asChild className="w-full">
          <Link href={`/orders/${order.id}`}>查看详情与追踪</Link>
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleReOrder}
          disabled={isCartNotEmptyFromDifferentRestaurant || !order.items || order.items.length === 0}
          title={reOrderButtonTitle}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> 重新下单
        </Button>
      </CardFooter>
    </Card>
  );
}
