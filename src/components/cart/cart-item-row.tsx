
'use client';

import Image from 'next/image';
import type { CartItemType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { TableCell, TableRow } from "@/components/ui/table";

interface CartItemRowProps {
  item: CartItemType;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const { removeFromCart, updateQuantity } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(item.id, newQuantity);
    } else if (newQuantity === 0) {
      removeFromCart(item.id);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="relative h-16 w-16 rounded-md overflow-hidden">
            <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint || "food item"} />
          </div>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">单价: ¥{item.price.toFixed(2)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item.quantity - 1)} disabled={item.quantity <= 0} aria-label="减少数量">
            <MinusCircle className="h-5 w-5" />
          </Button>
          <Input 
            type="number" 
            value={item.quantity} 
            onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
            className="w-16 text-center"
            min="0"
            aria-label={`数量 ${item.name}`}
          />
          <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item.quantity + 1)} aria-label="增加数量">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive/80" aria-label={`从购物车移除 ${item.name}`}>
          <XCircle className="h-5 w-5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
