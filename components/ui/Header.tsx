'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useSession, signOut } from 'next-auth/react';
import { getInitials } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const homeHref = session?.user?.role === 'super_admin' ? '/admin/dashboard' : session ? '/dashboard' : '/';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(session?.user?.avatarUrl || null);

  useEffect(() => {
    if (!session) {
      setAvatarUrl(null);
      return;
    }

    let cancelled = false;

    const loadProfileAvatar = async () => {
      try {
        const response = await apiFetch('/api/users/me', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (!cancelled) {
          setAvatarUrl(data.user?.avatar_url || null);
        }
      } catch (error) {
        console.error('Failed to load profile avatar:', error);
        if (!cancelled) {
          // Fallback to session avatarUrl if API fails
          setAvatarUrl(session.user?.avatarUrl || null);
        }
      }
    };

    void loadProfileAvatar();

    const handleProfileUpdated = () => {
      void loadProfileAvatar();
    };

    window.addEventListener('profile-updated', handleProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [session, session?.user?.avatarUrl]);

  const displayName = session?.user?.name || session?.user?.email || 'Profile';

  function AvatarImage({ src, alt }: { src: string; alt: string }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
      return null;
    }

    return (
      <img
        key={src}
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--card)]/95 text-[color:var(--foreground)] shadow-sm backdrop-blur /90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href={homeHref} className="flex items-center">
          <Image
            src={theme === 'dark' ? "/ziyavoicelogo.png" : "/ziyavoiceblack.png"}
            alt="Ziya Forms"
            width={240}
            height={70}
            className="h-12 w-auto object-contain sm:h-16 lg:h-16"
            priority
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/70 dark:hover:bg-[color:var(--card)]/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {session ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-2 text-[color:var(--foreground)] transition hover:bg-[color:var(--muted)]/70 hover:border-[color:var(--primary)] /5 /90 dark:hover:bg-[color:var(--card)]/10 sm:px-3"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[color:var(--primary)] text-white">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : (
                    <span className="text-sm font-semibold">
                      {session.user?.name ? getInitials(session.user.name) : session.user?.email?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-none">{displayName}</span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full border border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/70 dark:hover:bg-[color:var(--card)]/10"
                onClick={handleSignOut}
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </>
          ) : (
            <Link href="/auth/login">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full border border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/70 dark:hover:bg-[color:var(--card)]/10"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
