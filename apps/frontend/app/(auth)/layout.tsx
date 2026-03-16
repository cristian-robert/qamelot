import { Shield } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden w-[480px] shrink-0 flex-col items-center justify-center bg-[linear-gradient(135deg,oklch(0.16_0.03_240),oklch(0.25_0.08_155))] px-12 lg:flex">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Shield className="size-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Qamelot
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            Your precision test management platform. Organize, execute, and track
            quality with confidence.
          </p>
        </div>
      </div>

      {/* Right form area */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        {children}
      </div>
    </main>
  );
}
