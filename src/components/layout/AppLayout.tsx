

"use client"; 

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from './Logo';
import { SidebarNav } from './SidebarNav';
import { PageHeader } from './PageHeader';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency'; // Added
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added
import { SUPPORTED_CURRENCIES } from '@/lib/constants'; // Added
import type { CurrencyCode } from '@/lib/types'; // Added

function AppLogoWrapper() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  return <Logo collapsed={collapsed} />;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency(); // Added
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Loading application...
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Redirecting to login...
      </div>
    );
  }

  if (pathname === '/login') {
    return <main className="flex-1">{children}</main>;
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <AppLogoWrapper />
        </SidebarHeader>
        <Separator className="bg-sidebar-border" />
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 space-y-2">
          <div className="flex items-center space-x-2 text-sidebar-foreground">
            <Globe className="h-4 w-4" />
            <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
              <SelectTrigger className="w-full bg-sidebar border-sidebar-border text-sidebar-foreground focus:ring-sidebar-ring">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start text-sidebar-foreground hover:text-white"
          >
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle Theme
          </Button>
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-sidebar-foreground hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <PageHeader />
        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
