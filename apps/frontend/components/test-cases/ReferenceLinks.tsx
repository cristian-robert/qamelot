'use client';

import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface ReferenceLinksProps {
  references: string | null | undefined;
}

function resolveUrl(ref: string): string | null {
  const trimmed = ref.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^JIRA-/i.test(trimmed)) return `https://jira.example.com/browse/${trimmed}`;
  if (/^REQ-/i.test(trimmed)) return `https://requirements.example.com/${trimmed}`;
  return null;
}

export function ReferenceLinks({ references }: ReferenceLinksProps) {
  if (!references) return null;

  const refs = references.split(',').map((r) => r.trim()).filter(Boolean);
  if (refs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {refs.map((ref) => {
        const url = resolveUrl(ref);
        if (url) {
          return (
            <a key={ref} href={url} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="cursor-pointer gap-1 hover:bg-muted">
                <ExternalLink className="size-2.5" />
                {ref}
              </Badge>
            </a>
          );
        }
        return (
          <Badge key={ref} variant="outline">
            {ref}
          </Badge>
        );
      })}
    </div>
  );
}
