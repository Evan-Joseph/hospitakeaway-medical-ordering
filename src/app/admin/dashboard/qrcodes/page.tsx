
// src/app/admin/dashboard/qrcodes/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { BedQrCode } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
// 所有数据库操作方法现在通过适配器系统提供
// 无需直接导入 firebase/firestore
import { QrCode as QrCodeIconLucide, PlusCircle, ListChecks, ArrowLeft, Loader2, Edit, ToggleLeft, ToggleRight, Download, Eye, Layers } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

const qrCodeFormSchema = z.object({
  bedId: z.string().min(1, "床位ID不能为空"),
  department: z.string().optional(),
  room: z.string().optional(),
  details: z.string().min(1, "详细描述不能为空 (例如: A区, 102房, 1床)"),
});

type QrCodeFormData = z.infer<typeof qrCodeFormSchema>;

const batchQrCodeFormSchema = z.object({
  prefix: z.string().min(1, "床位ID前缀不能为空"),
  startNumber: z.coerce.number().int().min(0, "起始编号必须为非负整数"),
  count: z.coerce.number().int().min(1, "生成数量必须大于0").max(100, "单次最多生成100个"),
  suffix: z.string().optional(),
  department: z.string().optional(),
  room: z.string().optional(),
  detailsTemplate: z.string().min(1, "详细描述模板不能为空"),
});

type BatchQrCodeFormData = z.infer<typeof batchQrCodeFormSchema>;


export default function AdminQrCodesPage() {
  const router = useRouter();
  const { currentUser, isAdmin, loadingAuth } = useAuth();
  const [qrCodes, setQrCodes] = useState<BedQrCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQrCode, setEditingQrCode] = useState<BedQrCode | null>(null);
  const [qrToView, setQrToView] = useState<BedQrCode | null>(null);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<QrCodeFormData>({
    resolver: zodResolver(qrCodeFormSchema),
    defaultValues: {
      bedId: '',
      department: '',
      room: '',
      details: '',
    }
  });

  const {
    register: batchRegister,
    handleSubmit: handleBatchSubmitForm,
    reset: batchReset,
    formState: { errors: batchErrors }
  } = useForm<BatchQrCodeFormData>({
    resolver: zodResolver(batchQrCodeFormSchema),
    defaultValues: {
      prefix: '',
      startNumber: 1,
      count: 10,
      suffix: '',
      department: '',
      room: '',
      detailsTemplate: '【科室】, 【房间号】房, 【前缀】【编号】【后缀】',
    }
  });


  useEffect(() => {
    if (!loadingAuth) {
      if (!currentUser || !isAdmin) {
        router.push('/admin/login');
      } else {
        fetchQrCodes();
      }
    }
  }, [currentUser, isAdmin, loadingAuth, router]);


  const fetchQrCodes = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "bed-qrcodes"), firestoreOrderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const codes = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate() : new Date(data.createdAt || Date.now())
        } as BedQrCode;
      });
      setQrCodes(codes);
    } catch (error) {
      console.error("获取二维码数据出错:", error);
      toast({ title: "错误", description: "无法加载二维码列表。", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: QrCodeFormData) => {
    setIsSubmitting(true);
    const qrCodeJsonValue = JSON.stringify({
      bedId: data.bedId,
      department: data.department || undefined,
      room: data.room || undefined,
      details: data.details,
    });

    const qrDataPayload: Partial<BedQrCode> & { bedId: string; details: string; qrCodeValue: string; department?: string; room?: string; } = {
      bedId: data.bedId,
      details: data.details,
      qrCodeValue: qrCodeJsonValue,
    };
    if (data.department) qrDataPayload.department = data.department;
    if (data.room) qrDataPayload.room = data.room;


    try {
      if (editingQrCode) {
        // 使用适配器系统更新文档
        const qrRef = db.doc(`bed-qrcodes/${editingQrCode.id}`);
        await qrRef.update({ ...qrDataPayload, lastUpdatedAt: db.serverTimestamp() });
        toast({ title: "成功", description: "二维码信息已更新。" });
      } else {
        // 使用适配器系统添加文档
        const qrCodeCollection = db.collection("bed-qrcodes");
        await qrCodeCollection.add({
          ...qrDataPayload,
          isActive: true,
          createdAt: db.serverTimestamp(),
        });
        toast({ title: "成功", description: "新二维码数据已生成。" });
      }
      reset({ bedId: '', department: '', room: '', details: '' });
      setIsFormOpen(false);
      setEditingQrCode(null);
      await fetchQrCodes();
    } catch (error) {
      console.error("保存二维码数据出错:", error);
      toast({ title: "错误", description: "保存二维码数据失败。", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchSubmit = async (data: BatchQrCodeFormData) => {
    setIsBatchSubmitting(true);
    const qrCodesCollection = db.collection("bed-qrcodes");

    try {
      // 由于模拟环境不支持批量操作，改为逐个添加
      for (let i = 0; i < data.count; i++) {
        const currentNumber = data.startNumber + i;
        const bedId = `${data.prefix}${currentNumber}${data.suffix || ''}`;
        
        let details = data.detailsTemplate;
        details = details.replace(/【前缀】/g, data.prefix);
        details = details.replace(/【编号】/g, currentNumber.toString());
        details = details.replace(/【后缀】/g, data.suffix || '');
        details = details.replace(/【科室】/g, data.department || '无');
        details = details.replace(/【房间号】/g, data.room || '无');

        const qrCodeJsonValue = JSON.stringify({
          bedId: bedId,
          department: data.department || undefined,
          room: data.room || undefined,
          details: details,
        });

        const qrDataPayload: Omit<BedQrCode, 'id'> = {
          bedId: bedId,
          department: data.department || undefined,
          room: data.room || undefined,
          details: details,
          qrCodeValue: qrCodeJsonValue,
          isActive: true,
          createdAt: db.serverTimestamp(),
        };
        
        await qrCodesCollection.add(qrDataPayload);
      }

      toast({ title: "成功", description: `已成功批量生成 ${data.count} 个二维码数据。` });
      batchReset({
        prefix: '',
        startNumber: 1,
        count: 10,
        suffix: '',
        department: '',
        room: '',
        detailsTemplate: '【科室】, 【房间号】房, 【前缀】【编号】【后缀】',
      });
      setIsBatchFormOpen(false);
      await fetchQrCodes();
    } catch (error) {
      console.error("批量生成二维码数据出错:", error);
      toast({ title: "批量生成失败", description: "保存二维码数据时发生错误。", variant: "destructive" });
    } finally {
      setIsBatchSubmitting(false);
    }
  };


  const handleToggleActive = async (qr: BedQrCode) => {
    try {
        // 使用适配器系统更新文档
        const qrRef = db.doc(`bed-qrcodes/${qr.id}`);
        await qrRef.update({isActive: !qr.isActive});
        toast({title: "状态已更新", description: `床位 ${qr.bedId} 现已${!qr.isActive ? '激活' : '停用'}。`});
        await fetchQrCodes();
    } catch (error) {
        console.error("更新二维码状态失败：", error);
        toast({title: "错误", description: "更新二维码状态失败。", variant: "destructive"});
    }
  };

  const openAddForm = () => {
    reset({ bedId: '', department: '', room: '', details: '' });
    setEditingQrCode(null);
    setIsFormOpen(true);
  };

  const openBatchForm = () => {
    batchReset({ // Reset batch form to defaults
        prefix: '',
        startNumber: 1,
        count: 10,
        suffix: '',
        department: '',
        room: '',
        detailsTemplate: '【科室】, 【房间号】房, 【前缀】【编号】【后缀】',
    });
    setIsBatchFormOpen(true);
  };

  const openEditForm = (qrCode: BedQrCode) => {
    setEditingQrCode(qrCode);
    reset({
      bedId: qrCode.bedId,
      department: qrCode.department || '',
      room: qrCode.room || '',
      details: qrCode.details,
    });
    setIsFormOpen(true);
  };
  
  const handleDownloadQrCode = (qrValue: string, downloadFileNameWithPrefix: string) => {
    const baseNameForCanvasId = downloadFileNameWithPrefix.startsWith('qr_') 
      ? downloadFileNameWithPrefix.substring(3) 
      : downloadFileNameWithPrefix;
      
    const canvasId = `qr-canvas-${baseNameForCanvasId}`;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${downloadFileNameWithPrefix}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
       toast({ title: "已开始下载", description: `${downloadFileNameWithPrefix}.png` });
    } else {
       toast({ title: "下载错误", description: `无法找到ID为 '${canvasId}' 的二维码Canvas元素。`, variant: "destructive" });
    }
  };


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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl flex items-center">
          <QrCodeIconLucide className="mr-3 h-8 w-8" /> 二维码管理
        </h1>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')} className="self-start sm:self-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回管理员后台
        </Button>
      </div>

      <div className="flex space-x-2">
        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormOpen(open); if(!open) setEditingQrCode(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddForm} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> 生成新二维码数据
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingQrCode ? "编辑二维码数据" : "生成新二维码数据"}</DialogTitle>
              <DialogDescription>
                {editingQrCode ? "修改床位信息。" : "填写床位信息以生成二维码数据记录。实际二维码图片将在列表中显示。"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="bedId">床位ID (例如: A101-1, B区-2床)</Label>
                <Input id="bedId" {...register("bedId")} placeholder="唯一的床位标识符" disabled={isSubmitting} />
                {errors.bedId && <p className="text-xs text-destructive mt-1">{errors.bedId.message}</p>}
              </div>
              <div>
                <Label htmlFor="department">科室 (可选)</Label>
                <Input id="department" {...register("department")} placeholder="例如: 心内科" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="room">房间号 (可选)</Label>
                <Input id="room" {...register("room")} placeholder="例如: 102" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="details">详细描述 (配送地址)</Label>
                <Input id="details" {...register("details")} placeholder="例如: A区, 102房, 1床" disabled={isSubmitting} />
                {errors.details && <p className="text-xs text-destructive mt-1">{errors.details.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>取消</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingQrCode ? "保存更改" : "生成数据"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isBatchFormOpen} onOpenChange={(open) => { if (!isBatchSubmitting) setIsBatchFormOpen(open); }}>
            <DialogTrigger asChild>
                <Button onClick={openBatchForm} variant="secondary">
                <Layers className="mr-2 h-5 w-5" /> 批量生成二维码数据
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                <DialogTitle>批量生成二维码数据</DialogTitle>
                <DialogDescription>
                    填写参数以批量生成床位二维码的数据记录。
                </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBatchSubmitForm(handleBatchSubmit)} className="space-y-4 py-4">
                <div>
                    <Label htmlFor="batch-prefix">床位ID前缀</Label>
                    <Input id="batch-prefix" {...batchRegister("prefix")} placeholder="例如: A区-101房-" disabled={isBatchSubmitting} />
                    {batchErrors.prefix && <p className="text-xs text-destructive mt-1">{batchErrors.prefix.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="batch-startNumber">起始编号</Label>
                    <Input id="batch-startNumber" type="number" {...batchRegister("startNumber")} placeholder="1" disabled={isBatchSubmitting} />
                    {batchErrors.startNumber && <p className="text-xs text-destructive mt-1">{batchErrors.startNumber.message}</p>}
                    </div>
                    <div>
                    <Label htmlFor="batch-count">生成数量</Label>
                    <Input id="batch-count" type="number" {...batchRegister("count")} placeholder="10" disabled={isBatchSubmitting} />
                    {batchErrors.count && <p className="text-xs text-destructive mt-1">{batchErrors.count.message}</p>}
                    </div>
                </div>
                <div>
                    <Label htmlFor="batch-suffix">床位ID后缀 (可选)</Label>
                    <Input id="batch-suffix" {...batchRegister("suffix")} placeholder="例如: 床" disabled={isBatchSubmitting} />
                </div>
                <div>
                    <Label htmlFor="batch-department">科室 (可选)</Label>
                    <Input id="batch-department" {...batchRegister("department")} placeholder="例如: 心内科" disabled={isBatchSubmitting} />
                </div>
                <div>
                    <Label htmlFor="batch-room">房间号 (可选)</Label>
                    <Input id="batch-room" {...batchRegister("room")} placeholder="例如: 101" disabled={isBatchSubmitting} />
                </div>
                <div>
                    <Label htmlFor="batch-detailsTemplate">详细描述模板</Label>
                    <Input id="batch-detailsTemplate" {...batchRegister("detailsTemplate")} placeholder="例如: 【科室】, 【房间号】房, 【前缀】【编号】【后缀】" disabled={isBatchSubmitting} />
                    <p className="text-xs text-muted-foreground mt-1">
                    可用占位符: 【前缀】, 【编号】, 【后缀】, 【科室】, 【房间号】
                    </p>
                    {batchErrors.detailsTemplate && <p className="text-xs text-destructive mt-1">{batchErrors.detailsTemplate.message}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isBatchSubmitting}>取消</Button></DialogClose>
                    <Button type="submit" disabled={isBatchSubmitting}>
                    {isBatchSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
                    生成二维码数据
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>


      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>现有二维码数据列表</CardTitle>
          <CardDescription>
            管理已生成的床位二维码数据记录，并查看或下载对应的二维码。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">正在加载二维码列表...</p>
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ListChecks className="mx-auto h-12 w-12 mb-4" />
              <p>暂无二维码数据。</p>
              <p className="text-sm">点击上方“生成新二维码数据”按钮开始创建。</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>床位ID</TableHead>
                  <TableHead>详细描述 (配送地址)</TableHead>
                  <TableHead className="hidden sm:table-cell">科室</TableHead>
                  <TableHead className="hidden sm:table-cell">房间号</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell className="font-medium">{qr.bedId}</TableCell>
                    <TableCell>{qr.details}</TableCell>
                    <TableCell className="hidden sm:table-cell">{qr.department || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{qr.room || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={qr.isActive ? "default" : "outline"}>
                        {qr.isActive ? "已激活" : "未激活"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1 sm:space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => setQrToView(qr)} title="查看二维码">
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleToggleActive(qr)} title={qr.isActive ? "停用此二维码" : "激活此二维码"}>
                        {qr.isActive ? <ToggleRight className="h-4 w-4 text-destructive" /> : <ToggleLeft className="h-4 w-4 text-green-600" />}
                       </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(qr)} title="编辑数据">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!qrToView} onOpenChange={(open) => { if (!open) setQrToView(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>床位二维码: {qrToView?.bedId}</DialogTitle>
            <DialogDescription>
              {qrToView?.details} <br />
              {qrToView?.qrCodeValue && <span className="text-xs text-muted-foreground">数据: {qrToView.qrCodeValue}</span>}
            </DialogDescription>
          </DialogHeader>
          {qrToView?.qrCodeValue && (
            <div className="flex flex-col items-center justify-center my-4" ref={qrCanvasRef}>
              <QRCodeSVG value={qrToView.qrCodeValue} size={200} level="H" className="rounded-md shadow-md" />
              <QRCodeCanvas id={`qr-canvas-${qrToView.bedId.replace(/[^a-zA-Z0-9]/g, '')}`} value={qrToView.qrCodeValue} size={512} level="H" style={{ display: 'none' }} />
            </div>
          )}
          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={() => qrToView && handleDownloadQrCode(qrToView.qrCodeValue, `qr_${qrToView.bedId.replace(/[^a-zA-Z0-9]/g, '')}`)} disabled={!qrToView?.qrCodeValue}>
              <Download className="mr-2 h-4 w-4" /> 下载PNG
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">关闭</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

