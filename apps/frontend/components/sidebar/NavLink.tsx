'use client';

import Link from 'next/link';
import type { NavItem } from './nav-items';

interface NavLinkProps {
  item: NavItem;
  pathname: string;
  exact?: boolean;
}

export function NavLink({ item, pathname, exact }: NavLinkProps) {
  const isActive = exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all ${
        isActive
          ? 'border-l-2 border-sidebar-accent bg-white/10 text-white'
          : 'border-l-2 border-transparent text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground'
      }`}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}
