"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/categories")) return "Categories";
  if (pathname.startsWith("/reports")) return "Reports";
  return "PennyPincher";
};

export function PageHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
    </header>
  );
}
