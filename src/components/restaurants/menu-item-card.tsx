
'use client';

import Image from 'next/image';
import type { MenuItem } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Heart, Loader2 } from 'lucide-react'; 
import { useCart } from '@/contexts/cart-context';
import { useFavorites } from '@/contexts/favorites-context';
import { cn } from '@/lib/utils';
import { useState } from 'react'; 

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite, loadingFavorites } = useFavorites();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const currentlyFavorited = isFavorite(item.id, item.restaurantId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsTogglingFavorite(true);
    await toggleFavorite(item.id, item.restaurantId, item.name);
    setIsTogglingFavorite(false);
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-40">
          <Image
            src={item.imageUrl}
            alt={item.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={item.dataAiHint || "food item"}
          />
           <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 bg-card/80 hover:bg-card rounded-full p-1.5 shadow-md",
              currentlyFavorited ? "text-destructive hover:text-destructive/90" : "text-muted-foreground hover:text-primary"
            )}
            onClick={handleToggleFavorite}
            aria-label={currentlyFavorited ? "从收藏中移除" : "添加到收藏"}
            disabled={isTogglingFavorite || loadingFavorites} 
          >
            {isTogglingFavorite ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={cn("h-5 w-5", currentlyFavorited && "fill-current")} />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden">
          {item.description}
        </CardDescription>
        <p className="text-lg font-semibold text-primary">¥{item.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={() => addToCart(item)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> 添加到购物车
        </Button>
      </CardFooter>
    </Card>
  );
}
