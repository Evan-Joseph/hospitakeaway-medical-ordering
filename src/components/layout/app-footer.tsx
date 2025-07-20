// src/components/layout/app-footer.tsx
'use client'; // Required for useAuth hook

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth
import { Button } from "@/components/ui/button"; // Import Button
import { LogOut } from "lucide-react";

export default function AppFooter() {
  const { currentUser, signOut, loadingAuth } = useAuth(); // Get auth state and signOut function

  return (
    <footer className="bg-secondary text-secondary-foreground py-6 text-center mt-auto">
      <div className="container mx-auto px-4">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} MediOrder. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Your trusted partner for hospital meal delivery.
        </p>
        
        <div className="mt-2 space-x-2 sm:space-x-4 text-xs">
          {!currentUser && !loadingAuth && (
             <Link href="/merchant/login" className="text-muted-foreground hover:text-primary underline">
              Merchant Login
            </Link>
          )}
          {currentUser && (
            <Button variant="link" size="sm" onClick={signOut} className="text-xs text-muted-foreground hover:text-primary underline p-0 h-auto">
              <LogOut className="mr-1 h-3 w-3" /> Logout ({currentUser.email?.split('@')[0]})
            </Button>
          )}
           <Link href="/merchant/dashboard" className="text-muted-foreground hover:text-primary underline">
            Merchant Dashboard
          </Link>
           <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary underline">
            Admin Dashboard (Dev)
          </Link>
        </div>
      </div>
    </footer>
  );
}
