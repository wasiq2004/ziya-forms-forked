'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Chrome, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function RegisterPage() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      setSuccess(true);
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.error) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      setError('Registration successful, but login failed. Please try logging in manually.');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-[color:var(--background)] dark:bg-[color:var(--background)] sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-[color:var(--card)]/90 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur /70"
      >
        <div className="border-b border-[color:var(--border)]/70 bg-[color:var(--background)]/80 px-6 py-6 text-center /40 sm:px-8">
          <div className="flex justify-center mb-6">
            <Image
              src={theme === 'dark' ? "/ziyavoicelogo.png" : "/ziyavoiceblack.png"}
              alt="Ziya Forms"
              width={160}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--muted)] bg-[color:var(--muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            Start free
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
            Set up your workspace and start building forms in minutes.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              Account created successfully! Logging you in...
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70 dark:focus:border-[color:var(--gradient-end)]"
                placeholder="John Doe"
                required
              />
            </div>

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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70 dark:focus:border-[color:var(--gradient-end)]"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                Must be at least 6 characters.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70 dark:focus:border-[color:var(--gradient-end)]"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center gap-3 py-3 text-base font-semibold shadow-lg shadow-blue-500/20"
              disabled={loading}
            >
              {loading ? <span>Creating account...</span> : <span>Create account</span>}
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
            Sign up with Google
          </Button>

          <div className="mt-6 rounded-2xl bg-[color:var(--background)] px-4 py-3 text-center text-sm text-[color:var(--muted-foreground)] /60">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-[color:var(--primary)] hover:underline">
              Sign in
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
            <ShieldCheck className="h-4 w-4 text-[color:var(--primary)]" />
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
