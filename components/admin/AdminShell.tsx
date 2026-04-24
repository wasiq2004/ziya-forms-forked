'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type AdminShellProps = {
  currentUserName?: string | null;
  children: ReactNode;
};

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/templates', label: 'Templates panel' },
  { href: '/admin/smtp', label: 'SMTP' },
] as const;

export function AdminShell({ currentUserName, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[color:var(--background)] dark:bg-[color:var(--background)]">
      <div className="mx-auto flex min-h-screen max-w-[1760px] flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full shrink-0 lg:w-72">
          <div className="sticky top-4 rounded-[2rem] border border-white/50 bg-[color:var(--card)]/80 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur /40">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">Admin Panels</p>
              <h2 className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">ZiyaForms</h2>
            </div>

            <nav className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {adminNavItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? 'bg-[color:var(--background)] text-blue shadow-lg shadow-slate-900/20'
                        : 'text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]  dark:hover:bg-[color:var(--background)]/70'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold">Current account</p>
              <p className="mt-1">{currentUserName || 'Super admin'}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
