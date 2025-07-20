
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import RestaurantCard from '@/components/restaurants/restaurant-card';
import type { Restaurant } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ListFilter, Search, ArrowUpDown, Loader2, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
// 移除Firebase导入 - 使用适配器系统
import { Skeleton } from '@/components/ui/skeleton';

const RestaurantCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
    <Skeleton className="w-full h-48" />
    <div className="p-4 flex-grow">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-1" />
      <Skeleton className="h-4 w-1/3 mb-1" />
      <Skeleton className="h-4 w-1/2 mb-4" />
    </div>
    <div className="p-4 pt-0">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);


export default function RestaurantsPage() {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'rating', 'name'

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      try {
        // 使用适配器系统获取餐厅数据
        const restaurantsCollectionRef = db.collection("restaurants");
        const q = restaurantsCollectionRef.where("status", "==", "Approved");
        const querySnapshot = await q.get();
        const fetchedRestaurants = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Restaurant));
        setAllRestaurants(fetchedRestaurants);
      } catch (err) {
        console.error("获取餐馆数据出错:", err);
        setError("加载餐馆列表失败，请稍后再试。");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const uniqueCuisines = useMemo(() => {
    const cuisines = new Set<string>();
    allRestaurants.forEach(r => {
      (r.cuisine || '').split(',').forEach(c => cuisines.add(c.trim()));
    });
    return ['all', ...Array.from(cuisines).filter(c => c)];
  }, [allRestaurants]);

  const filteredAndSortedRestaurants = useMemo(() => {
    let restaurants = allRestaurants;

    if (searchTerm) {
      restaurants = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.cuisine || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cuisineFilter !== 'all') {
      restaurants = restaurants.filter(r =>
        (r.cuisine || '').toLowerCase().includes(cuisineFilter.toLowerCase())
      );
    }
    
    return [...restaurants].sort((a, b) => {
      if (sortBy === 'distance') {
        const distA = parseFloat(a.distance.replace(/[^0-9.]/g, ''));
        const distB = parseFloat(b.distance.replace(/[^0-9.]/g, ''));
        return distA - distB;
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [allRestaurants, searchTerm, cuisineFilter, sortBy]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">发现美食</h1>
        <p className="mt-2 text-lg text-foreground/80">浏览附近的餐馆，选择您喜爱的菜肴。</p>
      </div>

      <div className="sticky top-[calc(var(--header-height,60px)+1rem)] z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索餐馆或菜系..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={cuisineFilter} onValueChange={setCuisineFilter} disabled={loading}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="按菜系筛选">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="筛选菜系" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCuisines.map(cuisine => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine === 'all' ? '所有菜系' : cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="排序方式">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">距离</SelectItem>
              <SelectItem value="rating">评分</SelectItem>
              <SelectItem value="name">名称 (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <RestaurantCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <p className="text-xl text-destructive">{error}</p>
        </div>
      ) : filteredAndSortedRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedRestaurants.map((restaurant: Restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">没有找到符合条件的餐馆。</p>
          <Button variant="link" onClick={() => { setSearchTerm(''); setCuisineFilter('all'); }}>清除筛选条件</Button>
        </div>
      )}
    </div>
  );
}

