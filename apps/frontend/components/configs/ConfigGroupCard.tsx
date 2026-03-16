'use client';

import { useState } from 'react';
import { Trash2, Plus, Pencil } from 'lucide-react';
import type { ConfigGroupWithItemsDto } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConfigGroupCardProps {
  group: ConfigGroupWithItemsDto;
  onAddItem: (groupId: string, name: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateGroup: (groupId: string, name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  isAddingItem: boolean;
}

export function ConfigGroupCard({
  group,
  onAddItem,
  onDeleteItem,
  onUpdateGroup,
  onDeleteGroup,
  isAddingItem,
}: ConfigGroupCardProps) {
  const [newItemName, setNewItemName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  function handleAddItem() {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    onAddItem(group.id, trimmed);
    setNewItemName('');
  }

  function handleSaveGroupName() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === group.name) {
      setIsEditing(false);
      setEditName(group.name);
      return;
    }
    onUpdateGroup(group.id, trimmed);
    setIsEditing(false);
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveGroupName();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditName(group.name);
                }
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveGroupName}>
              Save
            </Button>
          </div>
        ) : (
          <h3 className="text-sm font-semibold">{group.name}</h3>
        )}
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => {
              setEditName(group.name);
              setIsEditing(true);
            }}
            aria-label={`Rename ${group.name}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onDeleteGroup(group.id)}
            aria-label={`Delete ${group.name}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {group.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No items yet.</p>
      ) : (
        <ul className="space-y-1">
          {group.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm"
            >
              <span>{item.name}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => onDeleteItem(item.id)}
                aria-label={`Remove ${item.name}`}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="New item name..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddItem();
          }}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddItem}
          disabled={!newItemName.trim() || isAddingItem}
        >
          <Plus className="mr-1 size-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
