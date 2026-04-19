'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { AdminDashboardStats, AdminUserSummary } from '@/lib/types/database';
import { apiFetch } from '@/lib/api';
import { KpiCards } from './KpiCards';
import { SearchBar } from './SearchBar';
import { Filters } from './Filters';
import { UsersTable } from './UsersTable';
import { PencilLine, RefreshCw, ShieldAlert, X } from 'lucide-react';

type AdminDashboardPageProps = {
  currentUserName?: string | null;
};

type ModalMode = 'view' | 'edit' | null;

type EditingState = {
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
};

export function AdminDashboardPage({ currentUserName }: AdminDashboardPageProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [activeUser, setActiveUser] = useState<AdminUserSummary | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const response = await apiFetch('/api/admin/dashboard/stats');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load dashboard stats');
        }

        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadUsers = async () => {
      setLoadingUsers(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          search,
          status,
        });

        const response = await apiFetch(`/api/admin/users?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load users');
        }

        if (!cancelled) {
          setUsers(data.users || []);
          setTotal(Number(data.total || 0));
          setPage(Number(data.page || page));
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && !cancelled) {
          setError(err.message || 'Failed to load users');
          setUsers([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, limit, search, status]);

  const closeModal = () => {
    setModalMode(null);
    setActiveUser(null);
    setEditingState(null);
  };

  const refreshData = async () => {
    setLoadingStats(true);
    setLoadingUsers(true);

    try {
      const [statsResponse, usersResponse] = await Promise.all([
        apiFetch('/api/admin/dashboard/stats'),
        apiFetch(`/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
      ]);

      const statsData = await statsResponse.json();
      const usersData = await usersResponse.json();

      if (statsResponse.ok) {
        setStats(statsData);
      }

      if (usersResponse.ok) {
        setUsers(usersData.users || []);
        setTotal(Number(usersData.total || 0));
      }
    } finally {
      setLoadingStats(false);
      setLoadingUsers(false);
    }
  };

  const openViewModal = (user: AdminUserSummary) => {
    setActiveUser(user);
    setModalMode('view');
  };

  const openEditModal = (user: AdminUserSummary) => {
    setActiveUser(user);
    setEditingState({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setModalMode('edit');
  };

  const handleToggleStatus = async (user: AdminUserSummary) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';

    if (!confirm(`Are you sure you want to ${nextStatus === 'active' ? 'activate' : 'deactivate'} ${user.name}?`)) {
      return;
    }

    setBusyAction(true);
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setNotice(`${user.name} is now ${nextStatus}.`);
      await refreshData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleToggleBillingPlan = async (user: AdminUserSummary) => {
    const nextBillingPlan = user.billingPlan === 'paid' ? 'free' : 'paid';

    if (!confirm(`Mark ${user.name} as ${nextBillingPlan.toUpperCase()}?`)) {
      return;
    }

    setBusyAction(true);
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingPlan: nextBillingPlan }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update billing plan');
      }

      setNotice(`${user.name} is now ${nextBillingPlan.toUpperCase()}.`);
      await refreshData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleDelete = async (user: AdminUserSummary) => {
    if (!confirm(`Delete ${user.name}? This will remove their forms and responses too.`)) {
      return;
    }

    setBusyAction(true);
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      setNotice(data.message || 'User deleted successfully');
      await refreshData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleResetPassword = async (user: AdminUserSummary) => {
    if (!confirm(`Reset password for ${user.name}?`)) {
      return;
    }

    setBusyAction(true);
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setNotice(`Temporary password for ${user.name}: ${data.temporaryPassword}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveUser = async () => {
    if (!activeUser || !editingState) {
      return;
    }

    setBusyAction(true);
    try {
      const response = await apiFetch(`/api/admin/users/${activeUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingState),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setNotice(`Updated ${editingState.name}.`);
      closeModal();
      await refreshData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="space-y-6 py-0">
        <div className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-white/50 bg-[color:var(--card)]/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur /40 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Super Admin</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
              Platform control center
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[color:var(--muted-foreground)]">
              Monitor growth, review platform usage, and manage every account from a single control surface.
              {currentUserName ? <span className="ml-1 font-semibold text-[color:var(--foreground)]">Signed in as {currentUserName}.</span> : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-[color:var(--border)] bg-[color:var(--card)]/80 text-[color:var(--foreground)] shadow-sm"
              onClick={refreshData}
              isLoading={loadingStats || loadingUsers || busyAction}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/20">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Admin mode
            </Button>
          </div>
        </div>

        {notice && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="mb-6">
          <KpiCards stats={stats} loading={loadingStats} />
        </div>

        <Card className="mb-6 border border-white/60 bg-[color:var(--card)]/70 shadow-[0_15px_60px_rgba(15,23,42,0.08)] backdrop-blur /40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-[color:var(--foreground)]">User directory</h2>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Search, filter, and take action on any account.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SearchBar value={search} onChange={(value) => { setPage(1); setSearch(value); }} />
              <Filters status={status} onStatusChange={(value) => { setPage(1); setStatus(value); }} />
            </div>
          </div>
        </Card>

        <UsersTable
          users={users}
          total={total}
          page={page}
          limit={limit}
          loading={loadingUsers || busyAction}
          onPageChange={setPage}
          onView={openViewModal}
          onEdit={openEditModal}
          onToggleStatus={handleToggleStatus}
          onToggleBillingPlan={handleToggleBillingPlan}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
        />

        {modalMode && activeUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-[color:var(--card)] p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                    {modalMode === 'edit' ? 'Edit user' : 'User details'}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">{activeUser.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted-foreground)] hover:bg-[color:var(--background)] dark:hover:bg-[color:var(--background)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalMode === 'view' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-[color:var(--background)] p-4 /60">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Email</p>
                    <p className="mt-2 font-medium text-[color:var(--foreground)]">{activeUser.email}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--background)] p-4 /60">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Role</p>
                    <p className="mt-2 font-medium capitalize text-[color:var(--foreground)]">{activeUser.role.replace('_', ' ')}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--background)] p-4 /60">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Plan</p>
                    <p className="mt-2 font-medium capitalize text-[color:var(--foreground)]">{activeUser.billingPlan}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--background)] p-4 /60">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Status</p>
                    <p className="mt-2 font-medium text-[color:var(--foreground)]">{activeUser.status}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--background)] p-4 /60">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Created at</p>
                    <p className="mt-2 font-medium text-[color:var(--foreground)]">{new Date(activeUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--background)] p-4 /60">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Forms</p>
                    <p className="mt-2 font-medium text-[color:var(--foreground)]">{activeUser.formsCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--background)] p-4 /60">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Embedded forms</p>
                    <p className="mt-2 font-medium text-[color:var(--foreground)]">{activeUser.embeddedFormsCount}</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-[color:var(--foreground)]">Name</span>
                    <input
                      value={editingState?.name || ''}
                      onChange={(e) => setEditingState((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-[color:var(--foreground)]">Email</span>
                    <input
                      value={editingState?.email || ''}
                      onChange={(e) => setEditingState((prev) => prev ? { ...prev, email: e.target.value } : prev)}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none focus:border-blue-500"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-[color:var(--foreground)]">Role</span>
                      <select
                        value={editingState?.role || 'user'}
                        onChange={(e) => setEditingState((prev) => prev ? { ...prev, role: e.target.value } : prev)}
                        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none focus:border-blue-500"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-[color:var(--foreground)]">Status</span>
                      <select
                        value={editingState?.status || 'active'}
                        onChange={(e) => setEditingState((prev) => prev ? { ...prev, status: e.target.value as 'active' | 'inactive' } : prev)}
                        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none focus:border-blue-500"
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={closeModal} className="border-[color:var(--border)]">
                  Cancel
                </Button>
                {modalMode === 'edit' && (
                  <Button onClick={handleSaveUser} isLoading={busyAction}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Save changes
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
