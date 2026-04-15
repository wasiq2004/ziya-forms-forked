'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSession, signIn, useSession } from 'next-auth/react';
import { Chrome, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/ui/ThemeProvider';

const getDestinationForRole = (role?: string | null) => {
  return role === 'super_admin' ? '/admin/dashboard' : '/dashboard';
};

export default function LoginPage() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const redirectAuthenticatedUser = async () => {
      const currentSession = session ?? (await getSession());
      router.replace(getDestinationForRole(currentSession?.user?.role));
    };

    void redirectAuthenticatedUser();
  }, [session, status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        return;
      }

      if (result?.ok) {
        const currentSession = await getSession();
        router.replace(getDestinationForRole(currentSession?.user?.role));
        return;
      }

      setError('An unexpected error occurred. Please try again.');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('google', { callbackUrl: '/dashboard' });

      if (result?.error) {
        setError(`Failed to sign in with Google: ${result.error}`);
        setLoading(false);
      }
    } catch {
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[color:var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 bg-[color:var(--background)] dark:bg-[color:var(--background)] sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-[color:var(--card)]/90 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur /70"
      >
        <div className="border-b border-[color:var(--border)]/70 bg-[color:var(--background)]/80 px-6 py-6 text-center /40 sm:px-8">
          <div className="flex justify-center mb-8">
            <Image
              src={theme === 'dark' ? "/ziyavoicelogo.png" : "/ziyavoiceblack.png"}
              alt="Ziya Forms"
              width={220}
              height={60}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--muted)] bg-[color:var(--muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            Secure access
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
            Sign in to continue building and managing forms.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70 dark:focus:border-[color:var(--gradient-end)]"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 pr-10 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70 dark:focus:border-[color:var(--gradient-end)]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs font-medium text-[color:var(--primary)] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center gap-3 py-3 text-base font-semibold shadow-lg shadow-blue-500/20"
              disabled={loading}
            >
              {loading ? <span>Signing in...</span> : <span>Sign in</span>}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--border)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">or</span>
            <div className="h-px flex-1 bg-[color:var(--border)]" />
          </div>

          <Button
            variant="outline"
            className="w-full justify-center gap-3 py-3 text-base font-semibold"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome className="h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="mt-6 rounded-2xl bg-[color:var(--background)] px-4 py-3 text-center text-sm text-[color:var(--muted-foreground)] /60">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-[color:var(--primary)] hover:underline">
              Create one
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
            <ShieldCheck className="h-4 w-4 text-[color:var(--primary)]" />
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
