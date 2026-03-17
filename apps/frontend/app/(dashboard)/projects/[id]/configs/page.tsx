'use client';

import { use, useState } from 'react';
import { Plus, Settings2, X } from 'lucide-react';
import type { ConfigGroupWithItemsDto, ConfigItemDto } from '@app/shared';
import { useProject } from '@/lib/projects/useProjects';
import {
  useConfigGroups,
  useCreateConfigGroup,
  useCreateConfigItem,
  useDeleteConfigItem,
} from '@/lib/configs/useConfigs';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function ConfigsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: groups, isLoading } = useConfigGroups(projectId);
  const createGroup = useCreateConfigGroup(projectId);
  const createItem = useCreateConfigItem();
  const deleteItem = useDeleteConfigItem();

  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [itemOpen, setItemOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');

  function handleCreateGroup() {
    if (!groupName.trim()) return;
    createGroup.mutate(
      { name: groupName.trim() },
      {
        onSuccess: () => {
          setGroupOpen(false);
          setGroupName('');
        },
      },
    );
  }

  function handleCreateItem() {
    if (!itemName.trim() || !selectedGroupId) return;
    createItem.mutate(
      { groupId: selectedGroupId, data: { name: itemName.trim() } },
      {
        onSuccess: () => {
          setItemOpen(false);
          setItemName('');
          setSelectedGroupId(null);
        },
      },
    );
  }

  function openAddItem(groupId: string) {
    setSelectedGroupId(groupId);
    setItemName('');
    setItemOpen(true);
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? '...', href: `/projects/${projectId}` },
          { label: 'Configs' },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Configurations</h1>
        <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            Add Group
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Config Group</DialogTitle>
              <DialogDescription>
                A config group organizes configuration items for matrix testing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g. Browsers, OS, Environments"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || createGroup.isPending}
              >
                {createGroup.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Config Item</DialogTitle>
            <DialogDescription>
              Add a configuration option to this group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name</Label>
              <Input
                id="item-name"
                placeholder="e.g. Chrome, Firefox, Safari"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateItem}
              disabled={!itemName.trim() || createItem.isPending}
            >
              {createItem.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group: ConfigGroupWithItemsDto) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item: ConfigItemDto) => (
                    <Badge
                      key={item.id}
                      variant="secondary"
                      className="gap-1"
                    >
                      {item.name}
                      <button
                        onClick={() => deleteItem.mutate(item.id)}
                        className="ml-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {group.items.length === 0 && (
                    <p className="text-xs text-muted-foreground">No items yet</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddItem(group.id)}
                >
                  <Plus className="size-3" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Settings2 className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No configuration groups yet. Create groups for matrix testing.
          </p>
          <Button variant="outline" onClick={() => setGroupOpen(true)}>
            <Plus className="size-4" />
            Add Group
          </Button>
        </div>
      )}
    </div>
  );
}
