import { Shield } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dot-grid-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Shield className="size-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Qamelot</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Test Management Platform
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
