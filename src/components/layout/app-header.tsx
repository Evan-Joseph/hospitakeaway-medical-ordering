
import Link from 'next/link';
import { Home, Utensils, ShoppingCart, Package, Heart } from 'lucide-react'; // Added Heart icon
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          MediOrder
        </Link>
        <nav className="flex items-center space-x-1 sm:space-x-2"> {/* Reduced spacing slightly for more items */}
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 px-2 sm:px-3" asChild>
            <Link href="/" aria-label="首页">
              <Home className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">首页</span>
            </Link>
          </Button>
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 px-2 sm:px-3" asChild>
            <Link href="/restaurants" aria-label="餐馆">
              <Utensils className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">餐馆</span>
            </Link>
          </Button>
           <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 px-2 sm:px-3" asChild>
            <Link href="/favorites" aria-label="我的收藏">
              <Heart className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">收藏</span>
            </Link>
          </Button>
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 px-2 sm:px-3" asChild>
            <Link href="/cart" aria-label="购物车">
              <ShoppingCart className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">购物车</span>
            </Link>
          </Button>
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 px-2 sm:px-3" asChild>
            <Link href="/orders" aria-label="我的订单">
              <Package className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">订单</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
