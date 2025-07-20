
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScanLine, Utensils, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center space-y-12 py-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
          欢迎使用 MediOrder
        </h1>
        <p className="mt-6 text-lg leading-8 text-foreground/80">
          专为您在医院场景下设计的便捷订餐方案。快速、简单，满足您的需求。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ScanLine className="h-16 w-16 text-accent" />
            </div>
            <CardTitle className="text-2xl">扫码快速下单</CardTitle>
            <CardDescription>
              扫描床头二维码，自动填写配送信息，订餐更快捷。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link href="/scan">
                <ScanLine className="mr-2 h-5 w-5" /> 扫描二维码
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Utensils className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">浏览周边餐馆</CardTitle>
            <CardDescription>
              自主探索附近的多家合作餐馆及其提供的美味菜单。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="/restaurants">
                <Utensils className="mr-2 h-5 w-5" /> 查看餐馆
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="w-full max-w-4xl mt-12">
        <h2 className="text-3xl font-semibold mb-6 text-primary">为什么选择 MediOrder?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-card rounded-lg shadow">
            <ShieldCheck className="h-10 w-10 text-accent mb-3" />
            <h3 className="text-xl font-semibold mb-2">安全可靠</h3>
            <p className="text-foreground/70">专为医院环境设计的无接触订餐与支付选项。</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow">
            <Utensils className="h-10 w-10 text-accent mb-3" />
            <h3 className="text-xl font-semibold mb-2">丰富选择</h3>
            <p className="text-foreground/70">接入多家经过审核的本地优质餐馆，菜单多样。</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent mb-3 lucide lucide-clock-fast"><path d="M16.93 13.07A7.51 7.51 0 0 0 12 10.5a7.43 7.43 0 0 0-2.05.3M2 12h2"/><path d="M12 2v2"/><path d="m6.59 4.51.9.9"/><path d="m16.51 5.41-.9-.9"/><path d="M17.66 7.34 16 8"/><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="M12 12v5"/></svg>
            <h3 className="text-xl font-semibold mb-2">快速便捷</h3>
            <p className="text-foreground/70">从下单到配送，流程简化，直达您的位置。</p>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-4xl aspect-[16/9] mt-12 rounded-lg overflow-hidden shadow-2xl">
        <Image 
          src="https://placehold.co/1200x675.png" 
          alt="MediOrder 应用展示" 
          layout="fill" 
          objectFit="cover"
          data-ai-hint="hospital food delivery"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <p className="text-white text-2xl font-semibold p-4 bg-black/50 rounded">轻松点餐，健康选择</p>
        </div>
      </div>

    </div>
  );
}
