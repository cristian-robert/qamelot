'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/format';
import type { ProjectDto, ProjectStatsDto } from '@app/shared';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function PassRateIndicator({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600';
  return <span className={`text-xs font-semibold ${color}`}>{rate}%</span>;
}

interface ProjectCardProps {
  project: ProjectDto;
  stats?: ProjectStatsDto;
}

export function ProjectCard({ project, stats }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${getAvatarColor(project.name)}`}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="mt-0.5 line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {stats ? (
              <>
                <span>{stats.caseCount} cases</span>
                <span className="text-border">|</span>
                <span>{stats.activeRunCount} active run{stats.activeRunCount !== 1 ? 's' : ''}</span>
                <span className="text-border">|</span>
                <PassRateIndicator rate={stats.passRate} />
              </>
            ) : (
              <span>Loading stats...</span>
            )}
          </div>
          {stats?.lastActivityAt && (
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">
              Last activity {formatRelativeTime(stats.lastActivityAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
