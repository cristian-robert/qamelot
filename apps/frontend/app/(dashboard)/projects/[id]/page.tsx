'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error || !project) {
    return <div className="p-6">Project not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      {project.description && (
        <p className="mt-2 text-muted-foreground">{project.description}</p>
      )}
      <div className="mt-8 text-muted-foreground">
        Test suites and runs will appear here in future issues.
      </div>
    </div>
  );
}
