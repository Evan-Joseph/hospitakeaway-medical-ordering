import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Using Geist from existing files
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/app-header';
import AppFooter from '@/components/layout/app-footer';
import { AppProvider } from '@/contexts/app-provider';

const geistSans = Geist({ // Using Geist Sans as primary font as specified by user
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MediOrder - Hospital Food Delivery',
  description: 'Convenient food delivery for hospital patients and their families.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#75A3D1" />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <AppProvider>
          <AppHeader />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <AppFooter />
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
