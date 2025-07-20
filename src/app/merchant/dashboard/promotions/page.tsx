
// src/app/merchant/dashboard/promotions/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Restaurant, Promotion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle, DialogDescription as ShadDialogDescription, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit3, Trash2, Loader2, Tags, AlertTriangle, ArrowLeft } from 'lucide-react';
import PromotionForm, { PromotionFormData } from '@/components/merchant/promotion-form';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const generatePromotionId = () => `promo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// Helper for promotion type translation
const translatePromotionType = (type: Promotion['type']): string => {
  const map: Record<Promotion['type'], string> = {
    'discount_fixed_amount': '固定金额折扣',
    'discount_percentage': '百分比折扣', // Placeholder for future
    'free_delivery': '免配送费', // Placeholder for future
  };
  return map[type] || type.replace(/_/g, ' '); // Fallback for unmapped types
};

export default function MerchantPromotionsPage() {
  const { currentUser, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isFormSubmitting, setIsFormSubmitting] = useState(false); 
  const [pageError, setPageError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const fetchRestaurantPromotions = useCallback(async () => {
    if (!currentUser?.uid) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    setPageError(null);
    const restaurantId = currentUser.uid;

    try {
      const restaurantRef = doc(db, "restaurants", restaurantId);
      const docSnap = await getDoc(restaurantRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Restaurant;
        setRestaurant(data);
        setPromotions(data.promotions || []);
      } else {
        setPageError("未找到您的餐馆数据。无法管理促销活动。");
        setRestaurant(null);
        setPromotions([]);
      }
    } catch (err) {
      console.error("获取餐馆促销出错:", err);
      setPageError("加载促销失败。请重试。");
      toast({ title: "加载错误", description: "无法加载促销信息。", variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  }, [currentUser?.uid, toast]);

  useEffect(() => {
    if (loadingAuth) return;
    if (!currentUser) {
      router.push('/merchant/login');
    } else {
      fetchRestaurantPromotions();
    }
  }, [currentUser, loadingAuth, router, fetchRestaurantPromotions]);

  const handleTogglePromotionActive = (promotionId: string) => {
    setPromotions(prev =>
      prev.map(p => p.id === promotionId ? { ...p, isActive: !p.isActive } : p)
    );
  };

  const handleSavePromotionsToFirestore = async () => {
    if (!restaurant || !currentUser?.uid) {
      toast({ title: "错误", description: "缺少餐馆数据。", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const restaurantRef = doc(db, "restaurants", currentUser.uid);
      await updateDoc(restaurantRef, { promotions: promotions });
      toast({ title: "成功", description: "促销活动已成功更新并保存至数据库。" });
    } catch (err) {
      console.error("保存促销出错:", err);
      toast({ title: "保存错误", description: "保存促销活动至数据库失败。", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openAddForm = () => {
    setEditingPromotion(null);
    setIsFormOpen(true);
  };

  const openEditForm = (promo: Promotion) => {
    setEditingPromotion(promo);
    setIsFormOpen(true);
  };

  const handlePromotionFormSubmit = async (data: PromotionFormData) => {
    setIsFormSubmitting(true);
    if (editingPromotion) { 
      setPromotions(prev => prev.map(p => 
        p.id === editingPromotion.id 
        ? { ...p, description: data.description, details: data.details } 
        : p
      ));
      toast({ title: "促销已本地更新", description: "点击“保存促销活动”以持久化。" });
    } else { 
      const newPromo: Promotion = {
        id: generatePromotionId(),
        description: data.description,
        type: 'discount_fixed_amount', 
        details: data.details,
        isActive: false, 
      };
      setPromotions(prev => [...prev, newPromo]);
      toast({ title: "新促销已本地添加", description: "点击“保存促销活动”以持久化。" });
    }
    setIsFormSubmitting(false);
    setIsFormOpen(false);
    setEditingPromotion(null);
  };
  
  const handleDeletePromotion = (promotionId: string) => {
    if (!window.confirm("您确定要删除此促销活动吗？此更改将在您点击“保存促销活动”时生效。")) return;
    setPromotions(prev => prev.filter(p => p.id !== promotionId));
    toast({ title: "促销已本地移除", description: "点击“保存促销活动”以持久化此更改。"});
  };

  if (loadingAuth || (isLoadingPage && currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">{loadingAuth ? "正在验证身份..." : "正在加载促销信息..."}</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">加载促销出错</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{pageError}</p>
        <Button onClick={() => router.push('/merchant/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" />仪表盘</Button>
        <Button onClick={fetchRestaurantPromotions} variant="outline" className="ml-2">重试</Button>
      </div>
    );
  }
  
  if (!restaurant && !isLoadingPage && currentUser && !pageError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">未找到餐馆数据</h2>
         <p className="text-muted-foreground mb-6 max-w-md">无法加载餐馆数据以管理促销活动。请确保您的餐馆 (ID: {currentUser?.uid}) 已正确设置。</p>
        <Button onClick={() => router.push('/merchant/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" />仪表盘</Button>
         <Button onClick={fetchRestaurantPromotions} variant="outline" className="ml-2">重试加载</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            <Tags className="inline-block h-8 w-8 mr-2 align-text-bottom" />
            促销活动管理
          </h1>
          <p className="text-muted-foreground">
            餐馆: <span className="font-semibold">{restaurant?.name || "加载中..."}</span>
          </p>
        </div>
        <Button onClick={() => router.push('/merchant/dashboard')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> 仪表盘
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Dialog open={isFormOpen} onOpenChange={(open) => { 
            if (isFormSubmitting || isSubmitting) return; 
            setIsFormOpen(open); 
            if (!open) setEditingPromotion(null); 
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={openAddForm} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSubmitting || !restaurant}
            >
              <PlusCircle className="mr-2 h-5 w-5" /> 添加新促销活动
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <ShadDialogHeader>
              <ShadDialogTitle>{editingPromotion ? '编辑促销活动' : '添加新促销活动'}</ShadDialogTitle>
              <ShadDialogDescription>
                配置您的促销活动详情。当前支持固定金额折扣。
              </ShadDialogDescription>
            </ShadDialogHeader>
            <PromotionForm
                onSubmit={handlePromotionFormSubmit}
                initialData={editingPromotion || undefined}
                isLoading={isFormSubmitting}
                onCancel={() => { setIsFormOpen(false); setEditingPromotion(null); }}
            />
          </DialogContent>
        </Dialog>

        <Button 
          onClick={handleSavePromotionsToFirestore}
          disabled={isSubmitting || !restaurant || promotions.length === 0}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          保存促销活动
        </Button>
      </div>
      
      {promotions.length === 0 && !isLoadingPage && restaurant ? (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">{restaurant?.name} 暂无促销活动。</p>
          <p className="text-sm text-muted-foreground">点击 "添加新促销活动" 开始创建。</p>
        </div>
      ) : null}

      {restaurant && promotions.length > 0 && (
        <div className="space-y-4">
          {promotions.map(promo => (
            <Card key={promo.id} className="shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{promo.description}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`active-switch-${promo.id}`} className="text-sm cursor-pointer">
                      {promo.isActive ? "已启用" : "未启用"}
                    </Label>
                    <Switch
                      id={`active-switch-${promo.id}`}
                      checked={promo.isActive}
                      onCheckedChange={() => handleTogglePromotionActive(promo.id)}
                      disabled={isSubmitting}
                      aria-label={`切换 ${promo.description} 启用状态`}
                    />
                  </div>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  类型: {translatePromotionType(promo.type)} | 详情: {`最低消费: ¥${promo.details.minValue ?? 0}, 优惠金额: ¥${promo.details.amount ?? 0}`}
                  {promo.startDate && ` | 开始日期: ${new Date(promo.startDate).toLocaleDateString()}`}
                  {promo.endDate && ` | 结束日期: ${new Date(promo.endDate).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEditForm(promo)} disabled={isSubmitting || isFormSubmitting}>
                  <Edit3 className="mr-1 h-4 w-4" /> 编辑
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeletePromotion(promo.id)} disabled={isSubmitting || isFormSubmitting}>
                  <Trash2 className="mr-1 h-4 w-4" /> 删除
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       {!restaurant && !isLoadingPage && !pageError && currentUser &&
        <p className="text-center text-muted-foreground py-8">无法加载餐馆数据。请确保您的账户已正确设置。</p>
      }
    </div>
  );
}
