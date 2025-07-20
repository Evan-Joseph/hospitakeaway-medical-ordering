
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDelivery } from '@/contexts/delivery-context';
import { ScanLine, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import type { DeliveryLocation } from '@/types';

export default function ScanQrPage() {
  const router = useRouter();
  const { setDeliveryLocationInfo } = useDelivery();
  const { toast } = useToast();
  const [qrDataInput, setQrDataInput] = useState('');

  const handleParseAndSetLocation = () => {
    if (!qrDataInput.trim()) {
      toast({
        title: '请输入内容',
        description: '请将二维码JSON数据粘贴到文本区域。',
        variant: 'destructive',
      });
      return;
    }
    try {
      const parsedData = JSON.parse(qrDataInput) as Partial<DeliveryLocation>;

      if (!parsedData.bedId || !parsedData.details) {
        throw new Error('无效的二维码数据："bedId" 和 "details" 为必填项。');
      }
      
      const locationData: DeliveryLocation = {
        bedId: parsedData.bedId,
        details: parsedData.details,
        department: parsedData.department, 
        room: parsedData.room,             
      };

      setDeliveryLocationInfo(locationData);
      toast({
        title: '位置已设置!',
        description: `配送位置已更新为: ${locationData.details}`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      router.push('/restaurants');
    } catch (error) {
      console.error("解析二维码数据出错:", error);
      toast({
        title: '二维码数据无效',
        description: error instanceof Error ? error.message : '提供的数据不是有效的JSON或缺少必要字段。',
        variant: 'destructive',
        action: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ScanLine className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">扫描床位二维码</CardTitle>
          <CardDescription>
            请将摄像头对准床位二维码。为模拟操作，请在下方文本框中粘贴二维码的JSON数据。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 border border-dashed rounded-lg bg-muted/50">
            <Image src="https://placehold.co/300x300.png?text=在此扫描" alt="二维码占位符" width={200} height={200} className="mx-auto rounded-md" data-ai-hint="QR code"/>
            <p className="text-sm text-muted-foreground mt-2">摄像头视图 (下方为模拟输入)</p>
          </div>
          
          <div>
            <label htmlFor="qrData" className="block text-sm font-medium text-foreground mb-1">
              粘贴二维码JSON数据:
            </label>
            <Textarea
              id="qrData"
              placeholder='例如: {"bedId": "B101A", "details": "B区, 101房, A床", "department": "心内科", "room": "101"}'
              value={qrDataInput}
              onChange={(e) => setQrDataInput(e.target.value)}
              rows={5}
              className="w-full"
              aria-label="粘贴二维码JSON数据"
            />
          </div>
          
          <Button 
            onClick={handleParseAndSetLocation}
            className="w-full"
          >
            解析并使用此位置 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            onClick={() => {
              setDeliveryLocationInfo(null); 
              toast({ title: "手动模式", description: "配送位置已清除。您将在结账时手动输入。" });
              router.push('/restaurants');
            }}
            className="w-full"
            variant="secondary"
          >
            跳过扫描，手动浏览 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
