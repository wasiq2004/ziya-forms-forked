'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, placeholder = 'Search by name or email' }: SearchBarProps) {
  return (
    <div className="relative w-full min-w-[260px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 bg-[color:var(--card)]/90 /80 border-[color:var(--border)] shadow-sm"
      />
    </div>
  );
}
