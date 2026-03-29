'use client';

import { Permission } from '@app/shared';
import { usePermissions } from '@/lib/auth/usePermissions';
import { mainNav, adminNav } from './nav-items';
import { NavLink } from './NavLink';

interface GlobalSidebarProps {
  pathname: string;
}

export function GlobalSidebar({ pathname }: GlobalSidebarProps) {
  const { hasPermission } = usePermissions();

  return (
    <>
      <p className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-sidebar-muted uppercase">
        Main
      </p>
      {mainNav.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}

      {hasPermission(Permission.MANAGE_USERS) && (
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
