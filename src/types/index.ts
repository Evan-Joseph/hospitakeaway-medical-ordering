
export interface RestaurantPaymentMethod {
  id: string; // Unique ID for the payment method entry, e.g., timestamp or UUID
  type: 'alipay' | 'wechat' | 'custom';
  name: string; // e.g., "支付宝", "微信支付", "店铺收款码" or user-defined for custom
  qrCodeUrl: string;
}

export type PromotionType = 'discount_percentage' | 'discount_fixed_amount' | 'free_delivery';

export interface Promotion {
  id: string; // Unique identifier for the promotion
  description: string; // e.g., "满¥30减¥5", "新用户首单8折"
  type: PromotionType; 
  details: { 
    minValue?: number; 
    percentage?: number; 
    amount?: number; 
  };
  isActive: boolean; 
  startDate?: string; 
  endDate?: string; 
}

export type RestaurantStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  distance: string; 
  imageUrl: string;
  dataAiHint?: string; 
  rating: number; 
  deliveryTime: string; 
  activePaymentMethods?: RestaurantPaymentMethod[];
  promotions?: Promotion[]; 
  ownerUid?: string; 
  description?: string; 
  menu?: MenuItem[]; 
  status?: RestaurantStatus; // New field for merchant status
}

export interface MenuItem {
  id: string;
  name:string;
  description: string;
  price: number;
  imageUrl: string;
  dataAiHint?: string; 
  restaurantId: string; 
  isAvailable?: boolean; 
}

export interface CartItemType extends MenuItem {
  quantity: number;
}

export type OrderStatus = 'Pending Payment' | 'Order Placed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  items: CartItemType[];
  totalAmount: number; 
  status: OrderStatus;
  orderDate: string;
  deliveryLocation: string; 
  verificationCode: string;
  restaurantName: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  paymentQrCodeUrl?: string;
  rating?: number; 
  appliedPromotion?: { 
    id: string;
    description: string;
    type: PromotionType;
    details: Promotion['details'];
  };
  discountAmount?: number; 
}

export interface DeliveryLocation {
  bedId: string; 
  details: string; 
  department?: string; 
  room?: string;             
}

export interface FavoriteItem {
  itemId: string;
  restaurantId: string;
  itemName: string; 
  addedAt?: any; 
}

export interface BedQrCode {
  id: string; 
  bedId: string; 
  department?: string;
  room?: string;
  details: string; 
  qrCodeValue: string; 
  isActive: boolean;
  createdAt: any; 
  lastUpdatedAt?: any; 
}
