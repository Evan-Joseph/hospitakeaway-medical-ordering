
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { useDelivery } from '@/contexts/delivery-context';
import { useOrders } from '@/contexts/order-context';
import PaymentDetails from '@/components/checkout/payment-details';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, ShoppingBag, CreditCard, CircleDollarSign, AlertTriangle, ArrowLeft, Loader2, User, Phone, Tag } from 'lucide-react';
import type { Order, CartItemType, OrderStatus as OrderStatusValue, Restaurant as RestaurantType, RestaurantPaymentMethod, Promotion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

// Helper for status translation
const translateOrderStatus = (status: OrderStatusValue): string => {
  const map: Record<OrderStatusValue, string> = {
    'Pending Payment': '等待付款',
    'Order Placed': '订单已下单',
    'Preparing': '准备中',
    'Out for Delivery': '配送中',
    'Delivered': '已送达',
    'Cancelled': '已取消'
  };
  return map[status] || status;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, clearCart, getCartRestaurantId } = useCart();
  const { deliveryLocation, setDeliveryLocationInfo } = useDelivery();
  const { addOrder } = useOrders();
  const { toast } = useToast();

  const [currentDeliveryDetails, setCurrentDeliveryDetails] = useState(deliveryLocation?.details || '');
  const [isEditingDelivery, setIsEditingDelivery] = useState(!deliveryLocation?.details);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash'>('qr');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessfullyPlaced, setOrderSuccessfullyPlaced] = useState(false); 
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantType | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);

  const cartSubtotal = getCartTotal();
  const cartRestaurantId = getCartRestaurantId();

  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [calculatedDiscount, setCalculatedDiscount] = useState<number>(0);
  const finalTotal = cartSubtotal - calculatedDiscount;

  const [verificationCode, setVerificationCode] = useState('');
  useEffect(() => {
    setVerificationCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  useEffect(() => {
    if (cartRestaurantId) {
      setLoadingRestaurant(true);
      const fetchRestaurantDetails = async () => {
        try {
          const restaurantDocRef = doc(db, "restaurants", cartRestaurantId);
          const docSnap = await getDoc(restaurantDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as RestaurantType;
            setRestaurantDetails({ ...data, promotions: data.promotions || [] });
          } else {
            toast({ title: "餐馆信息缺失!", description: "无法加载餐馆信息，请返回购物车。", variant: "destructive"});
            setRestaurantDetails(null);
          }
        } catch (error) {
          console.error("结账页：获取餐馆详情出错:", error);
          toast({ title: "加载餐馆信息出错", description: "获取餐馆详情时发生错误。", variant: "destructive"});
          setRestaurantDetails(null);
        } finally {
          setLoadingRestaurant(false);
        }
      };
      fetchRestaurantDetails();
    } else {
      setLoadingRestaurant(false);
    }
  }, [cartRestaurantId, toast]);

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


  useEffect(() => {
    if (!isPlacingOrder && !orderSuccessfullyPlaced && cartItems.length === 0) { 
      toast({ title: "您的购物车是空的!", description: "正在跳转到餐馆列表页。", variant: "destructive"});
      router.push('/restaurants');
    } else if (!isPlacingOrder && !orderSuccessfullyPlaced && !cartRestaurantId && !loadingRestaurant) { 
      toast({ title: "餐馆信息缺失!", description: "请先从餐馆选择商品。", variant: "destructive"});
      router.push('/cart');
    }
  }, [cartItems, cartRestaurantId, router, toast, isPlacingOrder, loadingRestaurant, orderSuccessfullyPlaced]);

  const handleSaveDeliveryLocation = () => {
    if (currentDeliveryDetails.trim()) {
      const bedId = deliveryLocation?.bedId || `manual-${Date.now()}`;
      setDeliveryLocationInfo({ bedId, details: currentDeliveryDetails.trim() });
      setIsEditingDelivery(false);
      toast({ title: "配送位置已保存。" });
    } else {
      toast({ title: "错误", description: "配送详情不能为空。", variant: "destructive" });
    }
  };

  const handleConfirmOrder = async () => {
    if (!customerName.trim()) {
      toast({ title: "信息不完整", description: "请输入您的姓名或称呼。", variant: "destructive" });
      return;
    }
    if (!customerPhone.trim()) {
      toast({ title: "信息不完整", description: "请输入您的手机号码。", variant: "destructive" });
      return;
    }
    if (!currentDeliveryDetails.trim()) {
      toast({ title: "信息不完整", description: "请提供配送详情。", variant: "destructive" });
      setIsEditingDelivery(true);
      return;
    }
    if (!restaurantDetails || !cartRestaurantId) {
        toast({ title: "错误", description: "餐馆信息缺失或仍在加载中。", variant: "destructive" });
        return;
    }

    setIsPlacingOrder(true);

    let finalAppliedPromotion = appliedPromotion;
    let finalCalculatedDiscount = calculatedDiscount;

    // Re-validate promotion at the time of order submission
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
        finalAppliedPromotion = bestPromo;
        finalCalculatedDiscount = bestDiscount;
    } else {
        finalAppliedPromotion = null;
        finalCalculatedDiscount = 0;
    }
    const actualFinalTotal = cartSubtotal - finalCalculatedDiscount;


    const primaryPaymentQrUrl = restaurantDetails.activePaymentMethods && restaurantDetails.activePaymentMethods.length > 0
        ? restaurantDetails.activePaymentMethods[0].qrCodeUrl
        : undefined;

    const orderData: Omit<Order, 'id' | 'orderDate' | 'rating'> & { status?: OrderStatusValue } = {
      items: cartItems.map(item => ({...item}) as CartItemType),
      totalAmount: actualFinalTotal, 
      deliveryLocation: currentDeliveryDetails.trim(),
      verificationCode,
      restaurantName: restaurantDetails.name,
      restaurantId: cartRestaurantId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      paymentQrCodeUrl: paymentMethod === 'qr' ? primaryPaymentQrUrl : undefined, 
      status: paymentMethod === 'cash' ? 'Order Placed' : 'Pending Payment',
      appliedPromotion: finalAppliedPromotion ? { 
        id: finalAppliedPromotion.id, 
        description: finalAppliedPromotion.description,
        type: finalAppliedPromotion.type,
        details: finalAppliedPromotion.details
      } : undefined,
      discountAmount: finalCalculatedDiscount > 0 ? finalCalculatedDiscount : undefined,
    };

    const newOrder = await addOrder(orderData);

    if (newOrder) {
      clearCart();
      setOrderSuccessfullyPlaced(true); 
      toast({
        title: "下单成功!",
        description: `您的订单号是 ${newOrder.id}。状态: ${translateOrderStatus(newOrder.status)}。总金额: ¥${newOrder.totalAmount.toFixed(2)}`,
      });
      router.push(`/orders/${newOrder.id}`);
    } else {
      toast({
        title: "下单失败",
        description: "提交订单时发生错误，请重试。",
        variant: "destructive",
      });
    }
    setIsPlacingOrder(false);
  };

  if (loadingRestaurant && cartItems.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-16 w-16 text-muted-foreground mb-6 animate-spin" />
        <h1 className="text-2xl font-semibold">正在加载结账信息...</h1>
      </div>
    );
  }

  if ((cartItems.length === 0 || (!cartRestaurantId && !loadingRestaurant)) && !isPlacingOrder && !orderSuccessfullyPlaced) { 
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl">结账时发生错误，正在跳转...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6" disabled={isPlacingOrder}>
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回购物车
      </Button>
      <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">结账</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><User className="mr-2 text-primary" /> 联系信息</CardTitle>
              <CardDescription>此信息将用于配送目的。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">您的姓名/称呼</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="例如：张先生，患者家属"
                  disabled={isPlacingOrder}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">手机号码</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="例如：13800138000"
                  disabled={isPlacingOrder}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><MapPin className="mr-2 text-primary" /> 配送信息</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingDelivery ? (
                <div className="space-y-3">
                  <Label htmlFor="deliveryDetails">床位/房间详情 (例如：A区, 102房, 1床)</Label>
                  <Input
                    id="deliveryDetails"
                    value={currentDeliveryDetails}
                    onChange={(e) => setCurrentDeliveryDetails(e.target.value)}
                    placeholder="输入您的床位或房间号"
                    disabled={isPlacingOrder}
                  />
                  <Button onClick={handleSaveDeliveryLocation} disabled={!currentDeliveryDetails.trim() || isPlacingOrder}>
                    保存配送位置
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-lg">{currentDeliveryDetails || "未设置配送位置"}</p>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingDelivery(true)} disabled={isPlacingOrder}>
                    {currentDeliveryDetails ? "编辑" : "添加"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><CreditCard className="mr-2 text-primary" /> 支付方式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Button
                        variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('qr')}
                        className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0" 
                        disabled={isPlacingOrder}
                    >
                        <CreditCard className="mr-2 h-5 w-5" /> 二维码支付
                    </Button>
                    <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('cash')}
                        className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0"
                        disabled={isPlacingOrder}
                    >
                        <CircleDollarSign className="mr-2 h-5 w-5" /> 现金支付
                    </Button>
                </div>
                 {paymentMethod === 'cash' && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded">
                        <p className="text-sm">请准备好零钱交给配送员。此选项适用于特殊情况。</p>
                    </div>
                )}
            </CardContent>
          </Card>

          {paymentMethod === 'qr' && restaurantDetails && (
            <PaymentDetails
              amount={finalTotal} 
              verificationCode={verificationCode}
              activePaymentMethods={restaurantDetails.activePaymentMethods}
              restaurantName={restaurantDetails.name}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ShoppingBag className="mr-2 text-primary" /> 订单摘要</CardTitle>
              <CardDescription>来自: {loadingRestaurant ? <Loader2 className="inline h-4 w-4 animate-spin" /> : restaurantDetails?.name || "未知餐馆"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>¥{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-2"/>
              <div className="flex justify-between text-md">
                <span>小计:</span>
                <span>¥{cartSubtotal.toFixed(2)}</span>
              </div>
              {appliedPromotion && calculatedDiscount > 0 && (
                <div className="flex justify-between text-md text-accent">
                  <span className="flex items-center"><Tag className="mr-1 h-4 w-4" /> {appliedPromotion.description}:</span>
                  <span>- ¥{calculatedDiscount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2"/>
              <div className="flex justify-between text-lg font-bold">
                <span>总计:</span>
                <span className="text-primary">¥{finalTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3">
              <Button
                onClick={handleConfirmOrder}
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={!currentDeliveryDetails.trim() || !customerName.trim() || !customerPhone.trim() || isPlacingOrder || loadingRestaurant || !restaurantDetails}
              >
                {isPlacingOrder || loadingRestaurant ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isPlacingOrder ? '正在提交订单...' : loadingRestaurant ? '加载中...' : (paymentMethod === 'qr' ? '确认订单并支付' : '提交现金订单')}
              </Button>
              {(!currentDeliveryDetails.trim() || !customerName.trim() || !customerPhone.trim()) && !isPlacingOrder && !loadingRestaurant && <p className="text-xs text-destructive text-center">请填写所有联系方式和配送详情。</p>}
               {(!restaurantDetails && !loadingRestaurant && !isPlacingOrder) && <p className="text-xs text-destructive text-center">餐馆信息无法加载，无法下单。</p>}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
