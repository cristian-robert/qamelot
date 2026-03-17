'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import type { ProjectDto } from '@app/shared';
import { useProjects, useCreateProject } from '@/lib/projects/useProjects';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleCreate() {
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setDescription('');
        },
      },
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your test management projects
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            New Project
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Add a new project to organize your test suites and runs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Name</Label>
                <Input
                  id="project-name"
                  placeholder="Project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-desc">Description</Label>
                <Textarea
                  id="project-desc"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createProject.isPending}
              >
                {createProject.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: ProjectDto) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(project.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FolderKanban className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No projects yet. Create your first project to get started.
          </p>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            New Project
          </Button>
        </div>
      )}
    </div>
  );
}
