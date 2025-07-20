
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function MerchantLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithEmailPassword, error: authError, loadingAuth, clearError, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!loadingAuth && currentUser) {
      router.push('/merchant/dashboard');
    }
  }, [currentUser, loadingAuth, router]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError(); 
    const user = await signInWithEmailPassword(email, password);
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
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">商家登录</CardTitle>
          <CardDescription>访问您的餐馆管理后台。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="merchant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || loadingAuth}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting || loadingAuth}
              />
            </div>
            {authError && (
              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <p>{authError.message || '发生未知错误。'}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting || loadingAuth}>
              {isSubmitting || loadingAuth ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isSubmitting || loadingAuth ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
          <p className="text-muted-foreground">
            还没有账户?{' '}
            <Link href="/merchant/register" className="font-medium text-primary hover:underline" onClick={clearError}>
              <UserPlus className="inline-block h-4 w-4 mr-1" /> 在此注册
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
