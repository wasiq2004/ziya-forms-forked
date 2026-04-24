'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageCropPicker } from '@/components/forms/ImageCropPicker';
import { getInitials } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, CalendarDays, Mail, Shield, Sparkles } from 'lucide-react';

type ProfileData = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  status?: string | null;
  role?: string | null;
  billing_plan?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await apiFetch('/api/users/me');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load profile');
        }

        setProfile(data.user || null);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router, session, status]);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar_url]);

  const saveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const response = await apiFetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setProfile(data.user || profile);
      window.dispatchEvent(new Event('profile-updated'));
      
      // Refresh the session to update avatarUrl in session data
      await update({
        avatarUrl: data.user?.avatar_url || null,
      });
      
      router.refresh();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="h-11 w-36 rounded-2xl bg-[color:var(--border)]/80 /80 animate-pulse" />
            <div className="hidden h-9 w-32 rounded-full bg-[color:var(--border)]/80 /80 animate-pulse md:block" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
              <div className="h-52 rounded-2xl bg-[color:var(--border)]/80 /80 animate-pulse" />
              <div className="mt-6 space-y-3">
                <div className="h-4 w-1/3 rounded bg-[color:var(--border)]/80 /80 animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-[color:var(--border)]/80 /80 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-[color:var(--border)]/80 /80 animate-pulse" />
              </div>
            </div>
            <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
              <div className="space-y-4">
                <div className="h-6 w-40 rounded bg-[color:var(--border)]/80 /80 animate-pulse" />
                <div className="h-12 rounded-2xl bg-[color:var(--border)]/80 /80 animate-pulse" />
                <div className="h-12 rounded-2xl bg-[color:var(--border)]/80 /80 animate-pulse" />
                <div className="h-48 rounded-2xl bg-[color:var(--border)]/80 /80 animate-pulse" />
                <div className="h-12 rounded-2xl bg-[color:var(--border)]/80 /80 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2 border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/60 dark:hover:bg-[color:var(--muted)]">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--muted-foreground)] shadow-lg backdrop-blur md:inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            Profile center
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--card)] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur">
            <div
              className="px-8 py-10 text-white"
              style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--primary), var(--gradient-end))' }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[color:var(--card)]/10 shadow-xl ring-1 ring-white/15">
                  {profile?.avatar_url && !avatarError ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'Profile'}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="text-lg font-semibold uppercase">
                      {getInitials(profile?.full_name || session.user?.name || profile?.email || 'Profile')}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/60">Account</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight">{profile?.full_name || session.user?.name || 'Your profile'}</h1>
                  <p className="mt-1 text-white/70">{profile?.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-8 py-8">
              <div className="grid gap-3 text-sm text-[color:var(--muted-foreground)]">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>{profile?.role || 'user'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Joined recently'}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-[color:var(--background)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Plan</p>
                <p className="mt-1 text-lg font-semibold capitalize text-[color:var(--foreground)]">
                  {profile?.billing_plan || 'free'}
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted-foreground)]">
                Update your name and picture here. The dashboard header will use this profile automatically.
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur">
            <div className="border-b border-[color:var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Edit profile</h2>
              <p className="text-sm text-[color:var(--muted-foreground)]">Make your account feel more personal.</p>
            </div>

            <div className="space-y-6 p-6">
              <ImageCropPicker
                label="Profile photo"
                description="Choose a clean square avatar."
                value={profile?.avatar_url || null}
                onChange={(avatarUrl) => setProfile((current) => current ? { ...current, avatar_url: avatarUrl } : current)}
                aspectRatio={1}
                buttonLabel="Choose photo"
                emptyLabel="Add a profile picture."
                cropTitle="Crop profile photo"
                cropHint="Drag to position the image inside the square frame."
                previewClassName="rounded-full"
                className="mx-auto max-w-[240px]"
                uploadScope="users/avatars"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--muted-foreground)]">Full name</label>
                <input
                  value={profile?.full_name || ''}
                  onChange={(event) => setProfile((current) => current ? { ...current, full_name: event.target.value } : current)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:bg-[color:var(--card)]"
                />
              </div>

              <div className="grid gap-3 rounded-2xl bg-[color:var(--background)] p-4 text-sm text-[color:var(--muted-foreground)]">
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <span className="font-medium text-[color:var(--foreground)]">{profile?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-medium capitalize text-[color:var(--foreground)]">{profile?.status || 'active'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Role</span>
                  <span className="font-medium capitalize text-[color:var(--foreground)]">{profile?.role || 'user'}</span>
                </div>
              </div>

              <Button
                onClick={saveProfile}
                isLoading={isSaving}
                className="w-full bg-[color:var(--primary)] text-white hover:opacity-95"
              >
                Save profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
