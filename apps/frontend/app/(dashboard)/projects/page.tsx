'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema, type CreateProjectInput } from '@app/shared';
import { FolderKanban, Plus, Calendar } from 'lucide-react';
import { useProjects } from '@/lib/projects/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
          <FolderKanban className="size-7" />
        </div>
        <h3 className="text-lg font-semibold">No projects yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first project to start organizing test suites and tracking results.
        </p>
        <Button className="mt-6" onClick={onCreateClick}>
          <Plus className="size-4" />
          Create Project
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { projects, isLoading, error, createProject } = useProjects();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
  });

  function openDialog() {
    reset();
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    reset();
  }

  function onSubmit(data: CreateProjectInput) {
    createProject.mutate(data, {
      onSuccess: () => {
        closeDialog();
      },
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <Button onClick={openDialog}>
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load projects'}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <ProjectsSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState onCreateClick={openDialog} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group">
              <Card className="border-l-4 border-l-emerald-500 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="space-y-2">
                  <h2 className="font-semibold group-hover:text-emerald-700 transition-colors">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="size-3" />
                    <span>Created {formatRelativeDate(project.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your test suites and cases.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Project name
              </label>
              <Input
                id="name"
                placeholder="My project"
                autoFocus
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Description{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                id="description"
                placeholder="A short description..."
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {createProject.error && (
              <p className="text-sm text-destructive">
                {createProject.error instanceof Error
                  ? createProject.error.message
                  : 'Failed to create project'}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
