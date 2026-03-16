'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { useConfigs } from '@/lib/configs/useConfigs';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ConfigGroupCard } from '@/components/configs/ConfigGroupCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProjectConfigsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [newGroupName, setNewGroupName] = useState('');

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !!projectId,
  });

  const {
    groups,
    isLoading: configsLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    createItem,
    deleteItem,
  } = useConfigs(projectId);

  function handleCreateGroup() {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    createGroup.mutate({ name: trimmed }, {
      onSuccess: () => setNewGroupName(''),
    });
  }

  if (projectLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!project) {
    return <div className="text-destructive">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${projectId}` },
        { label: 'Configurations' },
      ]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define configuration groups (e.g., Browser, OS) and values for matrix testing.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="New group name (e.g., Browser)"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateGroup();
          }}
          className="max-w-xs"
        />
        <Button
          onClick={handleCreateGroup}
          disabled={!newGroupName.trim() || createGroup.isPending}
        >
          <Plus className="mr-1.5 size-4" />
          Add Group
        </Button>
      </div>

      {configsLoading ? (
        <p className="text-sm text-muted-foreground">Loading configurations...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No configuration groups yet. Create your first group to start defining test
          configurations.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <ConfigGroupCard
              key={group.id}
              group={group}
              onAddItem={(groupId, name) =>
                createItem.mutate({ groupId, data: { name } })
              }
              onDeleteItem={(itemId) => deleteItem.mutate(itemId)}
              onUpdateGroup={(groupId, name) =>
                updateGroup.mutate({ id: groupId, data: { name } })
              }
              onDeleteGroup={(groupId) => deleteGroup.mutate(groupId)}
              isAddingItem={createItem.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
