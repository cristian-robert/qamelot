import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Qamelot',
  description: 'Test Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-[family-name:var(--font-dm-sans)] antialiased">
        <QueryProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
