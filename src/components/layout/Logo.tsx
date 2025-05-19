import { Coins } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function Logo({ collapsed } : { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-sidebar-foreground hover:text-sidebar-primary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-sm p-1 -ml-1">
      <Coins className="h-7 w-7 shrink-0 text-sidebar-primary" />
      {!collapsed && <span className="text-xl font-semibold tracking-tight">{APP_NAME}</span>}
    </Link>
  );
}
