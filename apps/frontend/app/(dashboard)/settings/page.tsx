'use client';

import { Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <Settings className="size-7" />
          </div>
          <h3 className="text-lg font-semibold">Settings coming soon</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Configure application preferences, integrations, and notification
            settings from this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
