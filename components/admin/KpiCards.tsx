'use client';

import type { ComponentType } from 'react';
import { FileText, UserCheck, Users, Webhook } from 'lucide-react';
import type { AdminDashboardStats } from '@/lib/types/database';

type KpiCardsProps = {
  stats: AdminDashboardStats | null;
  loading?: boolean;
};

type CardShellProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string;
  helper?: string;
  accent: string;
};

const CardShell = ({ icon: Icon, title, value, helper, accent }: CardShellProps) => (
  <div className={`rounded-3xl border border-white/20 bg-gradient-to-br p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur /40 ${accent}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[color:var(--muted-foreground)]">{title}</p>
        <h3 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--foreground)]">{value}</h3>
        {helper && <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{helper}</p>}
      </div>
      <div className="rounded-2xl bg-[color:var(--background)]/5 p-3 /10">
        <Icon className="h-6 w-6 text-[color:var(--muted-foreground)]" />
      </div>
    </div>
  </div>
);

export function KpiCards({ stats, loading }: KpiCardsProps) {
  const totalUsers = loading ? '...' : String(stats?.totalUsers ?? 0);
  const activeUsers = loading ? '...' : String(stats?.activeUsers ?? 0);
  const inactiveUsers = loading ? '...' : String(stats?.inactiveUsers ?? 0);
  const totalForms = loading ? '...' : String(stats?.totalForms ?? 0);
  const embeddedForms = loading ? '...' : String(stats?.embeddedForms ?? 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardShell icon={Users} title="Total Users" value={totalUsers} accent="from-sky-500/10 to-cyan-500/10" />
      <CardShell
        icon={UserCheck}
        title="Active / Inactive"
        value={`${activeUsers} / ${inactiveUsers}`}
        helper="User status split across the platform"
        accent="from-emerald-500/10 to-lime-500/10"
      />
      <CardShell icon={FileText} title="Total Forms" value={totalForms} accent="from-violet-500/10 to-fuchsia-500/10" />
      <CardShell icon={Webhook} title="Embedded Forms" value={embeddedForms} accent="from-amber-500/10 to-orange-500/10" />
    </div>
  );
}
