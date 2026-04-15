'use client';

import { ChevronLeft, ChevronRight, Loader2, UserCircle2 } from 'lucide-react';
import type { AdminUserSummary } from '@/lib/types/database';
import { UserActionsMenu } from './UserActionsMenu';

type UsersTableProps = {
  users: AdminUserSummary[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView: (user: AdminUserSummary) => void;
  onEdit: (user: AdminUserSummary) => void;
  onToggleStatus: (user: AdminUserSummary) => void;
  onToggleBillingPlan: (user: AdminUserSummary) => void;
  onDelete: (user: AdminUserSummary) => void;
  onResetPassword: (user: AdminUserSummary) => void;
};

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  inactive: 'bg-rose-50 text-rose-700 ring-rose-200   ',
};

export function UsersTable({
  users,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onView,
  onEdit,
  onToggleStatus,
  onToggleBillingPlan,
  onDelete,
  onResetPassword,
}: UsersTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_15px_60px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-[color:var(--background)]/80 /60">
            <tr>
              {['Name', 'Email', 'Status', 'Role', 'Forms Count', 'Embedded Forms Count', 'Created At', 'Actions'].map((label) => (
                <th key={label} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="inline-flex items-center gap-3 text-[color:var(--muted-foreground)]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-[color:var(--muted-foreground)]">
                    <div className="rounded-full bg-[color:var(--muted)] p-4">
                      <UserCircle2 className="h-8 w-8 text-[color:var(--muted-foreground)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">No users found</h3>
                    <p className="text-sm">Try clearing the search or changing the status filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="bg-[color:var(--card)]/80 transition hover:bg-[color:var(--background)] /40 dark:hover:bg-[color:var(--background)]/40">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[color:var(--foreground)]">{user.name}</div>
                    {user.role === 'super_admin' && (
                      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">Super Admin</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-[color:var(--muted-foreground)]">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[user.status]}`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm capitalize text-[color:var(--muted-foreground)]">{user.role.replace('_', ' ')}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[color:var(--foreground)]">{user.formsCount}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[color:var(--foreground)]">{user.embeddedFormsCount}</td>
                  <td className="px-5 py-4 text-sm text-[color:var(--muted-foreground)]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <UserActionsMenu
                      user={user}
                      onView={onView}
                      onEdit={onEdit}
                      onToggleStatus={onToggleStatus}
                      onToggleBillingPlan={onToggleBillingPlan}
                      onDelete={onDelete}
                      onResetPassword={onResetPassword}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-[color:var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Showing page <span className="font-semibold text-[color:var(--foreground)]">{page}</span> of{' '}
          <span className="font-semibold text-[color:var(--foreground)]">{totalPages}</span> ·{' '}
          <span className="font-semibold text-[color:var(--foreground)]">{total}</span> total users
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] shadow-sm transition hover:bg-[color:var(--background)] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] shadow-sm transition hover:bg-[color:var(--background)] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
