
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, LogIn, Loader2, AlertTriangle, Store } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email({ message: "邮箱地址无效。" }),
  password: z.string().min(6, { message: "密码至少需要6位。" }),
  confirmPassword: z.string(),
  restaurantName: z.string().min(1, { message: "餐馆名称不能为空。" }),
  restaurantCuisine: z.string().min(1, { message: "菜系类型不能为空 (例如: 中餐, 意餐, 快餐)。" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致。",
  path: ["confirmPassword"], 
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function MerchantRegisterPage() {
  const router = useRouter();
  const { signUpWithEmailPasswordAndRestaurant, error: authError, loadingAuth, clearError, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

   useEffect(() => {
    if (!loadingAuth && currentUser) {
      router.push('/merchant/dashboard');
    }
  }, [currentUser, loadingAuth, router]);


  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    clearError(); 
    const user = await signUpWithEmailPasswordAndRestaurant(
      data.email,
      data.password,
      data.restaurantName,
      data.restaurantCuisine
    );
    setIsSubmitting(false);
    if (user) {
      router.push('/merchant/dashboard'); 
    }
  };

  if (loadingAuth && !currentUser) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">商家注册</CardTitle>
          <CardDescription>创建您的账户并设置您的餐馆信息。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email">邮箱地址</Label>
              <Input id="email" type="email" {...register("email")} placeholder="your@email.com" disabled={isSubmitting || loadingAuth} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" {...register("password")} placeholder="••••••••" disabled={isSubmitting || loadingAuth} />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} placeholder="••••••••" disabled={isSubmitting || loadingAuth} />
              {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
            </div>
            
            <hr className="my-4"/>
            
            <div className="flex items-center mb-2">
              <Store className="h-5 w-5 mr-2 text-primary" />
              <h3 className="text-lg font-semibold">餐馆详情</h3>
            </div>


            <div>
              <Label htmlFor="restaurantName">餐馆名称</Label>
              <Input id="restaurantName" {...register("restaurantName")} placeholder="例如: 我的美味小厨" disabled={isSubmitting || loadingAuth} />
              {errors.restaurantName && <p className="text-xs text-destructive mt-1">{errors.restaurantName.message}</p>}
            </div>

            <div>
              <Label htmlFor="restaurantCuisine">菜系类型 (例如: 中餐, 健康餐, 甜品)</Label>
              <Input id="restaurantCuisine" {...register("restaurantCuisine")} placeholder="例如: 意大利菜, 沙拉, 咖啡" disabled={isSubmitting || loadingAuth} />
              {errors.restaurantCuisine && <p className="text-xs text-destructive mt-1">{errors.restaurantCuisine.message}</p>}
            </div>
            
            {authError && (
              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <p>{authError.message || '注册过程中发生未知错误。'}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || loadingAuth}>
              {isSubmitting || loadingAuth ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isSubmitting || loadingAuth ? '注册中...' : '注册并创建餐馆'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
          <p className="text-muted-foreground">
            已有账户?{' '}
            <Link href="/merchant/login" className="font-medium text-primary hover:underline" onClick={clearError}>
              在此登录
            </Link>
          </p>
          <Link href="/" className="text-primary hover:underline mt-2">
            &larr; 返回顾客首页
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
