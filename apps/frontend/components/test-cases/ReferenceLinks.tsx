'use client';

import { Badge } from '@/components/ui/badge';

interface ReferenceLinksProps {
  references: string;
}

const URL_PATTERN = /^https?:\/\//;

/** Parse a comma-separated references string into trimmed tokens */
export function parseReferences(references: string): string[] {
  return references
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
}

/** Check if a reference string looks like a URL */
export function isUrl(value: string): boolean {
  return URL_PATTERN.test(value);
}

/**
 * Renders comma-separated references as badges.
 * URLs are rendered as clickable links; plain text as static badges.
 */
export function ReferenceLinks({ references }: ReferenceLinksProps) {
  const refs = parseReferences(references);

  if (refs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" data-testid="reference-links">
      {refs.map((ref, index) =>
        isUrl(ref) ? (
          <a
            key={`${ref}-${index}`}
            href={ref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              {ref}
            </Badge>
          </a>
        ) : (
          <Badge key={`${ref}-${index}`} variant="outline">
            {ref}
          </Badge>
        ),
      )}
    </div>
  );
}
