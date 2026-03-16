'use client';

import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>

      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <Users className="size-7" />
          </div>
          <h3 className="text-lg font-semibold">User management coming soon</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Manage team members, assign roles, and control access permissions
            from this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
