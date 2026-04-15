'use client';

import { Filter } from 'lucide-react';

type FiltersProps = {
  status: string;
  onStatusChange: (value: string) => void;
};

export function Filters({ status, onStatusChange }: FiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Filter className="h-4 w-4 text-[color:var(--muted-foreground)]" />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)]/90 px-4 py-2 text-sm text-[color:var(--muted-foreground)] shadow-sm outline-none transition focus:border-blue-400 /80"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
