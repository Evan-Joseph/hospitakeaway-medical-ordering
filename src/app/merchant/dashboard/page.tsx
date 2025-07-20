
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, ListOrdered, LogIn, Loader2, Settings, BarChart3, Store, Cog, Tags } from "lucide-react"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MerchantDashboardPage() {
  const { currentUser, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !currentUser) {
      router.push('/merchant/login');
    }
  }, [currentUser, loadingAuth, router]);

  if (loadingAuth || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"> 
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">正在加载仪表盘或跳转至登录...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-4">
            <LayoutDashboard className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl">商家仪表盘</CardTitle>
          </div>
          <CardDescription>
            欢迎您, {currentUser.email}! 在这里管理您的餐馆、订单和菜单。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-primary">核心功能</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/merchant/dashboard/orders">
                  <ListOrdered className="mr-2 h-5 w-5" /> 查看与管理订单
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/merchant/dashboard/menu">
                  <Store className="mr-2 h-5 w-5" /> 管理菜单
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/merchant/dashboard/promotions">
                  <Tags className="mr-2 h-5 w-5" /> 管理促销活动
                </Link>
              </Button>
               <Button asChild variant="outline" size="lg">
                <Link href="/merchant/dashboard/settings">
                  <Cog className="mr-2 h-5 w-5" /> 餐馆设置
                </Link>
              </Button>
               <Button variant="outline" size="lg" disabled>
                 <BarChart3 className="mr-2 h-5 w-5" /> 经营分析 (敬请期待)
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-muted-foreground">未来功能展望:</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>菜单项图片直接上传 (优化)</li>
              <li>餐馆简介与营业时间设置</li>
              <li>顾客评价管理</li>
            </ul>
          </div>
          
          <div className="mt-8 pt-4 border-t">
            <Link href="/" className="text-sm text-primary hover:underline">
              &larr; 返回顾客首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
