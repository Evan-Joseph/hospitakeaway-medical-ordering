
// src/components/merchant/promotion-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Promotion } from '@/types';
import { useEffect } from 'react';

const promotionSchema = z.object({
  description: z.string().min(1, '描述不能为空'),
  details: z.object({
    minValue: z.coerce.number().min(0, '最低消费金额必须大于或等于0').optional(),
    amount: z.coerce.number().positive('优惠金额必须为正数'),
  }),
});

export type PromotionFormData = z.infer<typeof promotionSchema>;

interface PromotionFormProps {
  onSubmit: (data: PromotionFormData) => Promise<void>;
  initialData?: Partial<Promotion>; 
  isLoading: boolean;
  onCancel?: () => void;
}

export default function PromotionForm({ onSubmit, initialData, isLoading, onCancel }: PromotionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      description: initialData?.description || '',
      details: {
        minValue: initialData?.details?.minValue ?? 0,
        amount: initialData?.details?.amount ?? 0,
      },
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        description: initialData.description || '',
        details: {
          minValue: initialData.details?.minValue ?? 0,
          amount: initialData.details?.amount ?? 0,
        },
      });
    } else {
      reset({
        description: '',
        details: { minValue: 0, amount: 0 },
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: PromotionFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="description">促销描述</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="例如: 订单满 ¥100 减 ¥10"
          disabled={isLoading}
          rows={3}
        />
        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="details.minValue">最低消费金额 (¥) (可选)</Label>
        <Input
          id="details.minValue"
          type="number"
          step="0.01"
          {...register('details.minValue')}
          placeholder="例如: 100 (0 表示无最低消费)"
          disabled={isLoading}
        />
        {errors.details?.minValue && <p className="text-xs text-destructive mt-1">{errors.details.minValue.message}</p>}
      </div>

      <div>
        <Label htmlFor="details.amount">优惠金额 (¥)</Label>
        <Input
          id="details.amount"
          type="number"
          step="0.01"
          {...register('details.amount')}
          placeholder="例如: 10"
          disabled={isLoading}
        />
        {errors.details?.amount && <p className="text-xs text-destructive mt-1">{errors.details.amount.message}</p>}
      </div>
      
      <p className="text-xs text-muted-foreground">
        提示: 当前表单仅支持“固定金额折扣”。促销类型和启用状态在主促销页面管理。开始/结束日期功能可后续添加。
      </p>

      <div className="flex justify-end space-x-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData?.id ? '保存更改' : '添加促销'}
        </Button>
      </div>
    </form>
  );
}
