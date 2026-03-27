'use client';

import { usePathname } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { Role } from '@app/shared';
import { Button } from '@/components/ui/button';
import { bottomNav, extractProjectId } from '@/components/sidebar/nav-items';
import { NavLink } from '@/components/sidebar/NavLink';
import { GlobalSidebar } from '@/components/sidebar/GlobalSidebar';
import { ProjectSidebar } from '@/components/sidebar/ProjectSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === Role.ADMIN;
  const projectId = extractProjectId(pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-5">
          <Shield className="size-5 text-sidebar-accent" />
          <span className="text-lg font-bold tracking-tight text-white">
            Qamelot
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-4">
          {projectId ? (
            <ProjectSidebar projectId={projectId} pathname={pathname} />
          ) : (
            <GlobalSidebar pathname={pathname} isAdmin={isAdmin} />
          )}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-3">
          {bottomNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

          {user && (
            <div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/20 text-xs font-semibold text-sidebar-accent">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-sidebar-muted">
                  {user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout.mutate()}
                className="size-7 shrink-0 text-sidebar-muted hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      <main className="dot-grid-bg flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
