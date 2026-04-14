'use client';

import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, KeyRound, MoreVertical, PencilLine, Power, Trash2, BadgeDollarSign } from 'lucide-react';
import type { AdminUserSummary } from '@/lib/types/database';

type UserActionsMenuProps = {
  user: AdminUserSummary;
  onView: (user: AdminUserSummary) => void;
  onEdit: (user: AdminUserSummary) => void;
  onToggleStatus: (user: AdminUserSummary) => void;
  onToggleBillingPlan: (user: AdminUserSummary) => void;
  onDelete: (user: AdminUserSummary) => void;
  onResetPassword: (user: AdminUserSummary) => void;
};

export function UserActionsMenu({
  user,
  onView,
  onEdit,
  onToggleStatus,
  onToggleBillingPlan,
  onDelete,
  onResetPassword,
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };

    window.addEventListener('click', onClickOutside);
    return () => window.removeEventListener('click', onClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;

      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const padding = 8;
      const fallbackHeight = 320;
      const fallbackWidth = 224;
      const menuHeight = menu?.offsetHeight ?? fallbackHeight;
      const menuWidth = menu?.offsetWidth ?? fallbackWidth;

      const top = Math.max(padding, rect.top - menuHeight - gap);
      const left = Math.min(
        Math.max(padding, rect.right - menuWidth),
        Math.max(padding, window.innerWidth - menuWidth - padding),
      );

      setMenuPosition({
        top,
        left,
        minWidth: Math.max(rect.width, fallbackWidth),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--muted-foreground)] shadow-sm transition hover:bg-[color:var(--background)] dark:hover:bg-slate-800"
          aria-label="Open user actions"
          aria-expanded={open}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {open && typeof document !== 'undefined'
        ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl"
            style={{
              top: menuPosition?.top ?? -9999,
              left: menuPosition?.left ?? -9999,
              minWidth: menuPosition?.minWidth ?? 224,
            }}
          >
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--background)] dark:hover:bg-[color:var(--background)]" onClick={() => { setOpen(false); onView(user); }}>
              <Eye className="h-4 w-4" />
              View details
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--background)] dark:hover:bg-[color:var(--background)]" onClick={() => { setOpen(false); onEdit(user); }}>
              <PencilLine className="h-4 w-4" />
              Edit user
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--background)] dark:hover:bg-[color:var(--background)]" onClick={() => { setOpen(false); onToggleStatus(user); }}>
              <Power className="h-4 w-4" />
              {user.status === 'active' ? 'Deactivate user' : 'Activate user'}
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--background)] dark:hover:bg-[color:var(--background)]" onClick={() => { setOpen(false); onToggleBillingPlan(user); }}>
              <BadgeDollarSign className="h-4 w-4" />
              Mark as {user.billingPlan === 'paid' ? 'Free' : 'Paid'}
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--background)] dark:hover:bg-[color:var(--background)]" onClick={() => { setOpen(false); onResetPassword(user); }}>
              <KeyRound className="h-4 w-4" />
              Reset password
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setOpen(false); onDelete(user); }}>
              <Trash2 className="h-4 w-4" />
              Delete user
            </button>
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
