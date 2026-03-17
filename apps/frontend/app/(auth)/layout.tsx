'use client';

import { Shield, CheckCircle2, BarChart3, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

const features = [
  { icon: CheckCircle2, text: 'Organize test suites & cases' },
  { icon: BarChart3, text: 'Track execution & coverage' },
  { icon: Users, text: 'Collaborate with your team' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="relative hidden w-[480px] shrink-0 overflow-hidden bg-gradient-to-br from-primary via-primary to-emerald-800 lg:flex lg:flex-col lg:justify-between">
        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <Shield className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Qamelot</span>
          </div>

          <h2 className="mb-3 text-3xl leading-tight font-bold text-white">
            {isLogin ? 'Welcome back.' : 'Get started today.'}
          </h2>
          <p className="mb-10 text-base leading-relaxed text-white/70">
            {isLogin
              ? 'Sign in to continue managing your test suites and track quality across releases.'
              : 'Create your account and start organizing test cases in minutes.'}
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-white/10">
                  <Icon className="size-4 text-white/80" />
                </div>
                <span className="text-sm font-medium text-white/80">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decorative element */}
        <div className="relative z-10 border-t border-white/10 px-12 py-6">
          <p className="text-xs text-white/40">
            Test Management Platform
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="dot-grid-bg flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile-only branding */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Shield className="size-5.5 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight">Qamelot</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Test Management Platform
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
