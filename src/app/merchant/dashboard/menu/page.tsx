
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Restaurant, MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit3, Trash2, Loader2, Store, AlertTriangle, ArrowLeft, EyeOff, Eye } from 'lucide-react';
import MenuItemForm, { MenuItemFormData } from '@/components/merchant/menu-item-form';
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

const generateMenuItemId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export default function MerchantMenuPage() {
  const { currentUser, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState<string | null>(null); 

  const fetchRestaurantMenu = useCallback(async () => {
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
        setMenuItems(data.menu?.map(item => ({ ...item, isAvailable: item.isAvailable !== false })) || []); 
      } else {
        setPageError("未找到您的餐馆数据。请完成注册或联系支持。");
        setRestaurant(null);
        setMenuItems([]);
      }
    } catch (err) {
      console.error("获取餐馆菜单出错:", err);
      setPageError("加载餐馆菜单失败。请重试。");
    } finally {
      setIsLoadingPage(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (loadingAuth) return;
    if (!currentUser) {
      router.push('/merchant/login');
    } else {
      fetchRestaurantMenu();
    }
  }, [currentUser, loadingAuth, router, fetchRestaurantMenu]);

  const handleFormSubmit = async (data: MenuItemFormData) => {
    if (!restaurant || !currentUser?.uid) {
      toast({ title: "错误", description: "缺少餐馆上下文或用户认证信息。", variant: "destructive" });
      return;
    }
    setIsSubmittingForm(true);
    const restaurantRef = doc(db, "restaurants", currentUser.uid);

    try {
      let imageUrlToSave = data.imageUrl;

      if (editingItem) {
        const updatedMenuItems = menuItems.map(item =>
          item.id === editingItem.id
            ? {
              ...item,
              name: data.name,
              description: data.description,
              price: Number(data.price),
              imageUrl: imageUrlToSave || item.imageUrl,
              dataAiHint: data.dataAiHint,
              isAvailable: item.isAvailable !== false, 
              restaurantId: currentUser.uid
            }
            : item
        );
        await updateDoc(restaurantRef, { menu: updatedMenuItems });
        setMenuItems(updatedMenuItems);
        toast({ title: "成功", description: `${data.name} 已更新。` });
      } else {
        const newItem: MenuItem = {
          id: generateMenuItemId(),
          restaurantId: currentUser.uid,
          name: data.name,
          description: data.description,
          price: Number(data.price),
          imageUrl: imageUrlToSave || `https://placehold.co/400x300.png?text=${encodeURIComponent(data.name)}`,
          dataAiHint: data.dataAiHint,
          isAvailable: true, 
        };
        await updateDoc(restaurantRef, { menu: arrayUnion(newItem) });
        setMenuItems(prevItems => [...prevItems, newItem]);
        toast({ title: "成功", description: `${newItem.name} 已添加。` });
      }
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (err) {
      console.error("提交菜单项出错:", err);
      toast({ title: "提交错误", description: "保存菜单项失败。", variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!restaurant || !currentUser?.uid || !window.confirm(`您确定要删除 "${itemName}" 吗?`)) return;
    setIsSubmittingForm(true);
    const restaurantRef = doc(db, "restaurants", currentUser.uid);
    const itemToDelete = menuItems.find(item => item.id === itemId);
    if (!itemToDelete) return;

    try {
      await updateDoc(restaurantRef, { menu: arrayRemove(itemToDelete) });
      setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast({ title: "成功", description: `${itemName} 已删除。` });
    } catch (err) {
      console.error("删除菜单项出错:", err);
      toast({ title: "删除错误", description: `删除 ${itemName} 失败。`, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleToggleAvailability = async (itemId: string, currentAvailability: boolean) => {
    if (!restaurant || !currentUser?.uid) return;
    setIsUpdatingAvailability(itemId);
    const restaurantRef = doc(db, "restaurants", currentUser.uid);
    const updatedMenuItems = menuItems.map(item =>
      item.id === itemId ? { ...item, isAvailable: !currentAvailability } : item
    );

    try {
      await updateDoc(restaurantRef, { menu: updatedMenuItems });
      setMenuItems(updatedMenuItems);
      toast({ title: "上/下架状态已更新", description: `商品现在 ${!currentAvailability ? '已上架' : '已下架'}。` });
    } catch (err) {
      console.error("更新商品上/下架状态出错:", err);
      toast({ title: "更新失败", description: "无法更新商品上/下架状态。", variant: "destructive" });
      setMenuItems(prevItems => prevItems.map(item => 
        item.id === itemId ? { ...item, isAvailable: currentAvailability } : item
      ));
    } finally {
      setIsUpdatingAvailability(null);
    }
  };

  const openAddForm = () => { setEditingItem(null); setIsFormOpen(true); };
  const openEditForm = (item: MenuItem) => { setEditingItem(item); setIsFormOpen(true); };

  if (loadingAuth || (isLoadingPage && currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">{loadingAuth ? "正在验证身份..." : "正在加载菜单..."}</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">加载菜单出错</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{pageError}</p>
        <Button onClick={() => router.push('/merchant/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" />仪表盘</Button>
        <Button onClick={fetchRestaurantMenu} variant="outline" className="ml-2">重试</Button>
      </div>
    );
  }
  
  if (!restaurant && !isLoadingPage && currentUser && !pageError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Store className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">未找到餐馆数据</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          无法找到餐馆数据 (ID: {currentUser?.uid})。请确保您的餐馆已正确设置。
        </p>
        <Button onClick={() => router.push('/merchant/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" />仪表盘</Button>
        <Button onClick={fetchRestaurantMenu} variant="outline" className="ml-2">重试加载</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            <Store className="inline-block h-8 w-8 mr-2 align-text-bottom" />
            菜单管理
          </h1>
          <p className="text-muted-foreground">
            餐馆: <span className="font-semibold">{restaurant?.name || "加载中..."}</span>
          </p>
        </div>
        <Button onClick={() => router.push('/merchant/dashboard')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> 仪表盘
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (isSubmittingForm) return;
        setIsFormOpen(open);
        if (!open) setEditingItem(null);
      }}>
        <DialogTrigger asChild>
          <Button
            onClick={openAddForm}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSubmittingForm || !restaurant || isLoadingPage || pageError !== null}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> 添加新菜单项
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <ShadDialogHeader className="p-6 pb-0 sticky top-0 bg-background z-10 border-b">
            <ShadDialogTitle>{editingItem ? '编辑菜单项' : '添加新菜单项'}</ShadDialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" />
          </ShadDialogHeader>
          <div className="overflow-y-auto flex-grow">
            <MenuItemForm
              onSubmit={handleFormSubmit}
              initialData={editingItem || undefined}
              isLoading={isSubmittingForm}
              onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {menuItems.length === 0 && !isLoadingPage && restaurant ? (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">{restaurant?.name} 暂无菜单项。</p>
          <p className="text-sm text-muted-foreground">点击 "添加新菜单项" 开始创建。</p>
        </div>
      ) : null}

      {restaurant && !isLoadingPage && menuItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <Card key={item.id} className={cn("flex flex-col relative", !item.isAvailable && "opacity-60")}>
              {!item.isAvailable && (
                <Badge variant="destructive" className="absolute top-2 right-2 z-10">已下架</Badge>
              )}
              <CardHeader className="relative p-0">
                <div className="relative w-full h-48 bg-muted">
                  <Image
                    src={item.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(item.name)}`}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    data-ai-hint={item.dataAiHint || "food item"}
                    priority={false}
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/400x300.png?text=Error`; }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mb-2 min-h-[40px] line-clamp-2">{item.description}</CardDescription>
                <p className="text-lg font-semibold text-primary">¥{item.price.toFixed(2)}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-2">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditForm(item)} disabled={isSubmittingForm || !item.isAvailable || isUpdatingAvailability === item.id}>
                    <Edit3 className="mr-1 h-4 w-4" /> 编辑
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id, item.name)} disabled={isSubmittingForm || !item.isAvailable || isUpdatingAvailability === item.id}>
                    <Trash2 className="mr-1 h-4 w-4" /> 删除
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <Label htmlFor={`available-switch-${item.id}`} className="text-sm flex items-center">
                    {item.isAvailable ? <Eye className="mr-2 h-4 w-4 text-green-600" /> : <EyeOff className="mr-2 h-4 w-4 text-red-600" />}
                    {item.isAvailable ? "已上架" : "已下架"}
                  </Label>
                  {isUpdatingAvailability === item.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Switch
                      id={`available-switch-${item.id}`}
                      checked={item.isAvailable}
                      onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailable || false)}
                      disabled={isUpdatingAvailability !== null && isUpdatingAvailability !== item.id} 
                    />
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
