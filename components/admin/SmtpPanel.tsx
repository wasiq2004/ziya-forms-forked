'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { SmtpSettings } from '@/lib/types/database';
import { apiFetch } from '@/lib/api';
import { Mail, LockKeyhole, RefreshCcw } from 'lucide-react';

export function SmtpPanel() {
  const [form, setForm] = useState<SmtpSettings>({
    host: '',
    port: 465,
    user: '',
    password: '',
    secure: true,
    from_email: '',
    from_name: 'Ziya Forms',
    admin_email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/admin/smtp');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load SMTP settings');
      }
      if (data.settings) {
        setForm(data.settings);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      // Trim all string values to prevent whitespace issues
      // Note: username is automatically set to from_email
      const trimmedForm = {
        host: form.host.trim(),
        port: form.port,
        password: form.password.trim(),
        from_email: form.from_email.trim(),
        from_name: form.from_name.trim(),
        admin_email: form.admin_email.trim(),
        secure: form.secure,
      };

      const response = await apiFetch('/api/admin/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmedForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save SMTP settings');
      }
      setNotice('SMTP settings saved.');
      if (data.settings) {
        setForm(data.settings);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-white/60 bg-[color:var(--card)]/75 shadow-[0_15px_60px_rgba(15,23,42,0.08)] backdrop-blur /40">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">SMTP</p>
          <h2 className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">Sender configuration</h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">Configure the SMTP credentials used for transactional emails.</p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reload
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-sm text-[color:var(--muted-foreground)]">Loading SMTP settings...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted-foreground)]">SMTP Host</span>
            <input value={form.host} onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Port</span>
            <input type="number" value={form.port} onChange={(e) => setForm((prev) => ({ ...prev, port: Number(e.target.value) }))} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted-foreground)]">From Email</span>
            <input value={form.from_email} onChange={(e) => setForm((prev) => ({ ...prev, from_email: e.target.value }))} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted-foreground)]">From Name</span>
            <input value={form.from_name} onChange={(e) => setForm((prev) => ({ ...prev, from_name: e.target.value }))} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Admin Email (Notification Recipient)</span>
            <input type="email" value={form.admin_email} onChange={(e) => setForm((prev) => ({ ...prev, admin_email: e.target.value }))} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-[color:var(--foreground)] outline-none" />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-3 /60">
            <input type="checkbox" checked={!!form.secure} onChange={(e) => setForm((prev) => ({ ...prev, secure: e.target.checked }))} />
            <span className="text-sm text-[color:var(--muted-foreground)]">Use secure connection (TLS/SSL)</span>
          </label>
          <div className="rounded-2xl bg-[color:var(--background)] p-4 text-sm text-[color:var(--muted-foreground)] /60">
            <div className="flex items-center gap-2 font-semibold text-[color:var(--foreground)]"><Mail className="h-4 w-4" /> SMTP Overview</div>
            <p className="mt-3">These settings control the sender identity and transport for ZiyaForms platform emails.</p>
            <p className="mt-2 text-xs">The SMTP username is automatically set to the <strong>From Email</strong> address.</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]"><LockKeyhole className="h-4 w-4" /> Keep credentials limited to super admin access.</div>
          </div>

          {notice && <div className="lg:col-span-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">{notice}</div>}
          {error && <div className="lg:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

          <div className="lg:col-span-2 flex justify-end">
            <Button onClick={saveSettings} isLoading={saving} className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
              Save SMTP Settings
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
