// src/app/admin/dashboard/merchants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowLeft, ListChecks, Construction, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
// 所有数据库操作方法现在通过适配器系统提供
import type { Restaurant, RestaurantStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";

const translateRestaurantStatus = (status?: RestaurantStatus): string => {
  if (!status) return "未知";
  const map: Record<RestaurantStatus, string> = {
    'Pending': '待审核',
    'Approved': '已批准',
    'Rejected': '已拒绝',
    'Suspended': '已暂停'
  };
  return map[status] || status;
};

const getStatusBadgeVariant = (status?: RestaurantStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  switch (status) {
    case 'Approved': return 'default'; 
    case 'Pending': return 'secondary'; 
    case 'Rejected':
    case 'Suspended': return 'destructive'; 
    default: return 'outline';
  }
};

export default function AdminMerchantsPage() {
  const router = useRouter();
  const { currentUser, isAdmin, loadingAuth } = useAuth();
  const { toast } = useToast();
  const [merchants, setMerchants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For merchant data fetching
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth) {
      if (!currentUser || !isAdmin) {
        router.push('/admin/login');
      } else {
        fetchMerchants();
      }
    }
  }, [currentUser, isAdmin, loadingAuth, router]);

  const fetchMerchants = async () => {
    setIsLoading(true);
    try {
      const restaurantsCollection = db.collection("restaurants");
      const q = restaurantsCollection.orderBy("name");
      const querySnapshot = await q.get();
      const fetchedMerchants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Restaurant));
      setMerchants(fetchedMerchants);
    } catch (error) {
      console.error("获取商家列表出错:", error);
      toast({ title: "错误", description: "加载商家列表失败。", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (restaurantId: string, newStatus: RestaurantStatus) => {
    setIsUpdatingStatus(restaurantId);
    try {
      const restaurantRef = db.doc(`restaurants/${restaurantId}`);
      await restaurantRef.update({ status: newStatus });
      setMerchants(prevMerchants =>
        prevMerchants.map(merchant =>
          merchant.id === restaurantId ? { ...merchant, status: newStatus } : merchant
        )
      );
      toast({ title: "状态已更新", description: `商家状态已更新为 ${translateRestaurantStatus(newStatus)}。` });
    } catch (error) {
      console.error("更新商家状态出错:", error);
      toast({ title: "更新失败", description: "无法更新商家状态。", variant: "destructive" });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const availableStatuses: RestaurantStatus[] = ['Pending', 'Approved', 'Rejected', 'Suspended'];

  if (loadingAuth || (!currentUser && !isAdmin && isAdmin !== false)) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">正在验证管理员权限或跳转至登录...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl flex items-center">
          <Users className="mr-3 h-8 w-8" /> 商家管理
        </h1>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')} className="self-start sm:self-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回管理员后台
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>商家列表</CardTitle>
          <CardDescription>
            查看和管理系统中的所有商家账户及其审核状态。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">正在加载商家列表...</p>
            </div>
          ) : merchants.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ListChecks className="mx-auto h-12 w-12 mb-4" />
              <p>暂无商家数据。</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>餐馆名称</TableHead>
                  <TableHead className="hidden sm:table-cell">注册UID (商家ID)</TableHead>
                  <TableHead>当前状态</TableHead>
                  <TableHead className="text-right">更改状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell className="font-medium">{merchant.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{merchant.ownerUid || merchant.id}</TableCell> 
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(merchant.status)}>
                        {translateRestaurantStatus(merchant.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isUpdatingStatus === merchant.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Select
                          value={merchant.status || 'Pending'}
                          onValueChange={(value) => handleStatusChange(merchant.id, value as RestaurantStatus)}
                        >
                          <SelectTrigger className="w-[120px] sm:w-[150px]">
                            <SelectValue placeholder="更改状态" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStatuses.map(statusKey => (
                              <SelectItem key={statusKey} value={statusKey}>
                                {translateRestaurantStatus(statusKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
       <Card className="shadow-md mt-8">
        <CardHeader>
          <CardTitle>待开发功能</CardTitle>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground p-4 border border-dashed rounded-md">
            <Construction className="inline-block h-5 w-5 mr-2 text-amber-500" />
            商家详细信息编辑、禁用/启用账号、查看商家订单等功能正在规划开发中。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}