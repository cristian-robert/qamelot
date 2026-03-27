'use client';

import { mainNav, adminNav } from './nav-items';
import { NavLink } from './NavLink';

interface GlobalSidebarProps {
  pathname: string;
  isAdmin: boolean;
}

export function GlobalSidebar({ pathname, isAdmin }: GlobalSidebarProps) {
  return (
    <>
      <p className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-sidebar-muted uppercase">
        Main
      </p>
      {mainNav.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}

      {isAdmin && (
        <>
          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold tracking-widest text-sidebar-muted uppercase">
            Admin
          </p>
          {adminNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </>
      )}
    </>
  );
}
