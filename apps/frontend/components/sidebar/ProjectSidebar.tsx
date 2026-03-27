'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useProject } from '@/lib/projects/useProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { projectNav } from './nav-items';
import { NavLink } from './NavLink';

interface ProjectSidebarProps {
  projectId: string;
  pathname: string;
}

export function ProjectSidebar({ projectId, pathname }: ProjectSidebarProps) {
  const { data: project, isLoading } = useProject(projectId);
  const basePath = `/projects/${projectId}`;

  return (
    <>
      <Link
        href="/projects"
        className="group mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-sidebar-foreground/70 transition-all hover:bg-white/5 hover:text-sidebar-foreground"
      >
        <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
        Back to Projects
      </Link>

      <div className="mb-3 mt-1 px-3">
        {isLoading ? (
          <Skeleton className="h-5 w-32 bg-white/10" />
        ) : (
          <p className="truncate text-sm font-semibold text-white">
            {project?.name ?? 'Project'}
          </p>
        )}
      </div>

      <div className="mb-2 border-t border-white/10" />

      <p className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-sidebar-muted uppercase">
        Navigation
      </p>
      {projectNav.map((item) => {
        const href = item.segment ? `${basePath}/${item.segment}` : basePath;
        return (
          <NavLink
            key={item.segment || '__overview'}
            item={{ label: item.label, href, icon: item.icon }}
            pathname={pathname}
            exact={!item.segment}
          />
        );
      })}
    </>
  );
}
