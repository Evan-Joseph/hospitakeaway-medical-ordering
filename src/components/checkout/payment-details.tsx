
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RestaurantPaymentMethod } from '@/types';
import { useState, useEffect } from 'react';

interface PaymentDetailsProps {
  amount: number;
  verificationCode: string;
  activePaymentMethods?: RestaurantPaymentMethod[];
  restaurantName: string;
}

export default function PaymentDetails({ amount, verificationCode, activePaymentMethods, restaurantName }: PaymentDetailsProps) {
  const { toast } = useToast();
  const [selectedMethodId, setSelectedMethodId] = useState<string | undefined>(undefined);

  const validPaymentMethods = activePaymentMethods?.filter(method => method.qrCodeUrl && method.name) || [];

  useEffect(() => {
    if (validPaymentMethods.length > 0 && !selectedMethodId) {
      setSelectedMethodId(validPaymentMethods[0].id);
    } else if (validPaymentMethods.length === 0) {
      setSelectedMethodId(undefined);
    }
  }, [validPaymentMethods, selectedMethodId]);

  const handleCopy = (textToCopy: string, type: '金额' | '验证码') => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: '已复制到剪贴板!',
          description: `${type} 已准备好粘贴。`,
        });
      })
      .catch(err => {
        toast({
          title: '复制失败',
          description: `无法复制${type}。请手动复制。`,
          variant: 'destructive',
        });
        console.error('复制失败: ', err);
      });
  };

  const selectedMethod = validPaymentMethods.find(m => m.id === selectedMethodId);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>向 {restaurantName} 付款</CardTitle>
        <CardDescription>
          请选择支付方式，使用您的支付应用扫描二维码，并确保输入正确的金额。
          如有可能，请在付款备注中填写验证码。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {validPaymentMethods.length > 0 ? (
          <div className="space-y-4">
            <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择支付方式" />
              </SelectTrigger>
              <SelectContent>
                {validPaymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name} ({method.type === 'alipay' ? '支付宝' : method.type === 'wechat' ? '微信支付' : '自定义'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMethod && (
              <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-muted/30 mt-4">
                <Image
                  src={selectedMethod.qrCodeUrl}
                  alt={`二维码 ${selectedMethod.name} - ${restaurantName}`}
                  width={250}
                  height={250}
                  className="rounded-md shadow-sm max-w-full h-auto"
                  data-ai-hint="payment QR code"
                  priority={true} 
                />
                <p className="text-sm text-muted-foreground">使用 {selectedMethod.name} 扫描</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/50 text-center">
            <Info className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">该餐馆当前未设置任何二维码支付方式。</p>
            <p className="text-sm text-muted-foreground mt-1">您可能需要选择“现金支付”或联系餐馆。</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-baseline p-3 bg-secondary rounded-md">
            <span className="text-lg font-medium text-secondary-foreground">总金额:</span>
            <span className="text-2xl font-bold text-primary">¥{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline p-3 bg-secondary rounded-md">
            <span className="text-lg font-medium text-secondary-foreground">验证码:</span>
            <span className="text-2xl font-bold text-accent">{verificationCode}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={() => handleCopy(`¥${amount.toFixed(2)}`, '金额')} className="w-full">
            <Copy className="mr-2 h-4 w-4" /> 复制金额
          </Button>
          <Button onClick={() => handleCopy(verificationCode, '验证码')} className="w-full" variant="outline">
            <Copy className="mr-2 h-4 w-4" /> 复制验证码
          </Button>
        </div>

        <div className="flex items-start p-3 border-l-4 border-yellow-400 bg-yellow-50 text-yellow-700 rounded-md">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 shrink-0 text-yellow-500" />
          <div>
            <p className="font-semibold">重要提示:</p>
            <ul className="list-disc list-inside text-sm">
              <li>付款前请仔细核对金额。</li>
              <li>使用验证码以便餐馆更快处理您的订单。</li>
              <li>付款后，点击“确认订单并支付”（或“提交现金订单”）。</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
