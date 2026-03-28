import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="animate-in">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PassRateCard({ rate }: { rate: number | null }) {
  const circumference = 2 * Math.PI * 18;
  const offset = rate !== null ? circumference - (rate / 100) * circumference : circumference;
  const rateColor =
    rate === null ? 'text-muted'
    : rate >= 80 ? 'text-status-passed'
    : rate >= 50 ? 'text-status-blocked'
    : 'text-status-failed';
  const strokeColor =
    rate === null ? 'stroke-muted'
    : rate >= 80 ? 'stroke-status-passed'
    : rate >= 50 ? 'stroke-status-blocked'
    : 'stroke-status-failed';

  return (
    <Card className="animate-in">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="relative flex size-10 shrink-0 items-center justify-center">
          <svg className="size-10 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20" cy="20" r="18"
              fill="none"
              strokeWidth="3"
              className="stroke-muted"
            />
            <circle
              cx="20" cy="20" r="18"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${strokeColor} transition-all duration-700`}
            />
          </svg>
          <CheckCircle2 className={`absolute size-4 ${rateColor}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pass Rate</p>
          {rate === null ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className={`text-2xl font-bold tracking-tight ${rateColor}`}>
              {rate}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="group transition-all hover:border-primary/30 hover:shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-primary/10">
            <Icon className="size-4.5 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium group-hover:text-primary">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="size-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}
