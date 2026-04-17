"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // Import the useAuth hook

const getPageTitle = (pathname: string): string => {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/categories")) return "Categories";
  if (pathname.startsWith("/reports")) return "Reports";
  return "PennyPincher";
};

export function PageHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname ?? "");
  const { user } = useAuth(); 

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">{title}</h1>
      </div>

      {/* Logged-in user info */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm sm:text-base md:text-2xl font-semibold text-foreground truncate max-w-[100px] sm:max-w-[200px] md:max-w-none">Welcome, {user?.username}</h1>
      </div>
    </header>
  );
}