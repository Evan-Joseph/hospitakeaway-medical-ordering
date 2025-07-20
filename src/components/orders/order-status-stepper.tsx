
'use client';

import type { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle, Truck, CookingPot, ShoppingBag, CircleDollarSign, XCircle } from 'lucide-react';

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
}

const statusesInChinese: Record<OrderStatus, string> = {
  'Pending Payment': '等待付款',
  'Order Placed': '订单已下单',
  'Preparing': '准备中',
  'Out for Delivery': '配送中',
  'Delivered': '已送达',
  'Cancelled': '已取消'
};

const orderedStatuses: OrderStatus[] = ['Pending Payment', 'Order Placed', 'Preparing', 'Out for Delivery', 'Delivered'];
const cancelledStatus: OrderStatus = 'Cancelled';

const getStatusIcon = (status: OrderStatus, isActive: boolean, isCompleted: boolean) => {
  const iconPropsBase = "h-6 w-6 sm:h-7 sm:w-7";
  let iconColor = "text-muted-foreground";
  if (isActive) iconColor = "text-primary";
  if (isCompleted) iconColor = "text-primary";
  if (status === 'Delivered' && isCompleted) iconColor = "text-green-500";
  if (status === 'Cancelled') iconColor = "text-destructive";

  const iconProps = { className: cn(iconPropsBase, iconColor) };
  
  switch (status) {
    case 'Pending Payment': return <CircleDollarSign {...iconProps} />;
    case 'Order Placed': return <ShoppingBag {...iconProps} />;
    case 'Preparing': return <CookingPot {...iconProps} />;
    case 'Out for Delivery': return <Truck {...iconProps} />;
    case 'Delivered': return <CheckCircle {...iconProps} />;
    case 'Cancelled': return <XCircle {...iconProps} />;
    default: return null;
  }
};

export default function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
  const currentIndex = orderedStatuses.indexOf(currentStatus);

  if (currentStatus === cancelledStatus) {
    return (
        <div className="flex items-center p-3 border border-destructive bg-destructive/10 rounded-lg shadow-sm">
            {getStatusIcon(cancelledStatus, true, true)}
            <span className="ml-3 text-md font-semibold text-destructive">{statusesInChinese[cancelledStatus]}</span>
        </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-2">
      <ol className="flex items-start justify-between w-full min-w-max space-x-2 sm:space-x-4 px-1">
        {orderedStatuses.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          
          return (
            <li
              key={status}
              className={cn(
                "flex flex-col items-center text-center flex-1 min-w-[80px] sm:min-w-[100px]", 
                isActive || isCompleted ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                  "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0 mb-1.5 transition-all duration-300 ease-in-out", // made height consistent sm:w-12 to sm:h-12
                  isActive ? "bg-primary/20 border-2 border-primary scale-110" : 
                  (isCompleted ? "bg-primary/10 border-2 border-primary" : "bg-muted border-2 border-gray-300")
                )}
              >
                {getStatusIcon(status, isActive, isCompleted)}
              </div>
              <span className={cn(
                "text-xs sm:text-sm leading-tight", 
                isActive ? "font-semibold" : "font-normal"
                )}
              >
                {statusesInChinese[status]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
