"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  Users,
  type LucideIcon,
  Receipt,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth to check admin status

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean; // Add an optional flag for admin-only items
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/scanReceipts", label: "Scan Your Receipt (Beta)", icon: Receipt },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/users", label: "User Management", icon: Users, adminOnly: true }, // Mark as admin-only
];

export function SidebarNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth(); // Use isAdmin from useAuth

  return (
    <SidebarMenu>
      {navItems
        .filter((item) => !item.adminOnly || isAdmin) // Filter out admin-only items if the user is not an admin
        .map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              className={cn(
                "justify-start",
                pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              tooltip={{ children: item.label, className: "text-xs" }}
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
    </SidebarMenu>
  );
}