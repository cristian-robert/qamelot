'use client';

import { useState } from 'react';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/lib/api-keys/useApiKeys';
import { useProjects } from '@/lib/projects/useProjects';
import type { ApiKeyDto } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Key, Copy, Trash2, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState } from '@/components/ui/empty-state';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ApiKeysPage() {
  const { data: projects, isLoading: loadingProjects, isError: projectsError, refetch: refetchProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { data: keys, isLoading: loadingKeys, isError: keysError, refetch: refetchKeys } = useApiKeys(selectedProjectId);
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [rawKey, setRawKey] = useState<string | null>(null);

  async function handleCreate() {
    if (!selectedProjectId || !keyName.trim()) return;
    try {
      const result = await createMutation.mutateAsync({
        projectId: selectedProjectId,
        data: { name: keyName.trim() },
      });
      setRawKey(result.rawKey);
      setKeyName('');
      toast.success('API key created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create key');
    }
  }

  async function handleRevoke(key: ApiKeyDto) {
    try {
      await revokeMutation.mutateAsync({
        projectId: selectedProjectId,
        keyId: key.id,
      });
      toast.success(`Key "${key.name}" revoked`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function handleDialogClose() {
    setCreateOpen(false);
    setRawKey(null);
    setKeyName('');
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <PageHeader
        title="API Keys"
        subtitle="Manage API keys for automation integrations"
      />

      <div className="grid gap-6 lg:max-w-3xl">
        {/* Project Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
            <CardDescription>Select a project to manage its API keys</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsError ? (
              <ErrorState onRetry={refetchProjects} />
            ) : (
            <Select
              value={selectedProjectId}
              onValueChange={(val) => setSelectedProjectId(val ?? '')}
              disabled={loadingProjects}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select a project...">
                  {projects?.find((p) => p.id === selectedProjectId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
          </CardContent>
        </Card>

        {/* Keys List */}
        {selectedProjectId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Keys</CardTitle>
                  <CardDescription>
                    Keys are used to authenticate automation API calls
                  </CardDescription>
                </div>
                <Dialog open={createOpen} onOpenChange={(open) => {
                  if (!open) handleDialogClose();
                  else setCreateOpen(true);
                }}>
                  <DialogTrigger render={<Button size="sm" />}>
                    <Plus className="mr-1 size-3.5" />
                    Create Key
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                    </DialogHeader>

                    {rawKey ? (
                      <div className="space-y-3">
                        <Alert>
                          <Key className="size-4" />
                          <AlertTitle>Save this key now</AlertTitle>
                          <AlertDescription>
                            This is the only time the full key will be shown.
                            Copy it and store it securely.
                          </AlertDescription>
                        </Alert>
                        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                          <code className="flex-1 break-all text-xs">
                            {rawKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            onClick={() => handleCopy(rawKey)}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                        <DialogFooter>
                          <DialogClose render={<Button />}>
                            Done
                          </DialogClose>
                        </DialogFooter>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="key-name">Key Name</Label>
                          <Input
                            id="key-name"
                            placeholder="e.g. CI Pipeline Key"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose render={<Button variant="outline" />}>
                            Cancel
                          </DialogClose>
                          <Button
                            onClick={handleCreate}
                            disabled={!keyName.trim() || createMutation.isPending}
                          >
                            {createMutation.isPending && (
                              <Loader2 className="mr-1 size-3.5 animate-spin" />
                            )}
                            Create
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {keysError ? (
                <ErrorState onRetry={refetchKeys} />
              ) : loadingKeys ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading keys...
                </p>
              ) : !keys || keys.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Key className="size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No API keys for this project.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create one to start using the automation API.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key Prefix</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {key.keyPrefix}...
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(key.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(key.lastUsedAt)}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-destructive"
                                />
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently revoke &ldquo;{key.name}&rdquo;.
                                  Any integrations using this key will stop working.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  onClick={() => handleRevoke(key)}
                                  disabled={revokeMutation.isPending}
                                >
                                  {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
