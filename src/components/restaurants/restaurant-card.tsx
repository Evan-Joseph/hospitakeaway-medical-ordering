
import Link from 'next/link';
import Image from 'next/image';
import type { Restaurant } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Clock, Utensils } from 'lucide-react'; 

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={restaurant.dataAiHint || "restaurant food"}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl mb-1">{restaurant.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground flex items-center mb-1">
          <Utensils className="h-4 w-4 mr-1 text-primary" /> {restaurant.cuisine}
        </CardDescription>
        <div className="flex items-center text-sm text-muted-foreground mb-1">
          <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" /> {restaurant.rating.toFixed(1)}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1 text-primary" /> {restaurant.deliveryTime} &bull; {restaurant.distance}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/restaurants/${restaurant.id}`}>查看菜单</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
