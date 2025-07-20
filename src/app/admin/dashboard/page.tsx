
// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, QrCode, Users, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { currentUser, isAdmin, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth) {
      if (!currentUser || !isAdmin) {
        router.push('/admin/login');
      }
    }
  }, [currentUser, isAdmin, loadingAuth, router]);

  if (loadingAuth || !currentUser || isAdmin === null ) { // Also check isAdmin === null for initial loading phase of admin status
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"> 
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">正在加载或验证管理员权限...</p>
      </div>
    );
  }

  if (!isAdmin && currentUser) { // Logged in but not an admin
     // This case should ideally be caught by the useEffect redirect, but as a fallback
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-destructive">权限不足。正在跳转至登录页面...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-4">
            <LayoutDashboard className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl">管理员后台</CardTitle>
          </div>
          <CardDescription>
            欢迎您, 管理员！在此管理二维码、商家和系统设置。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-primary">核心管理区域</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/admin/dashboard/qrcodes">
                  <QrCode className="mr-2 h-5 w-5" /> 管理二维码
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/admin/dashboard/merchants">
                  <Users className="mr-2 h-5 w-5" /> 管理商家
                </Link>
              </Button>
              <Button variant="outline" size="lg" disabled>
                <Settings className="mr-2 h-5 w-5" /> 系统设置 (敬请期待)
              </Button>
            </div>
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
