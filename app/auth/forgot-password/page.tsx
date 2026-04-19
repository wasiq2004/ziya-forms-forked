'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sparkles, ShieldCheck, Loader, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/ui/ThemeProvider';
import { apiFetch } from '@/lib/api';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setSuccessMessage('OTP sent to your email');
      setCurrentStep('otp');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      setSuccessMessage('OTP verified successfully');
      setCurrentStep('password');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setCurrentStep('success');
    } catch (err) {
      setError((err as Error).message);
    } finally {
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
            Reset password
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
            {currentStep === 'email' && 'Forgot Password?'}
            {currentStep === 'otp' && 'Verify OTP'}
            {currentStep === 'password' && 'Set New Password'}
            {currentStep === 'success' && 'Password Reset'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
            {currentStep === 'email' && 'Enter your email to receive an OTP'}
            {currentStep === 'otp' && 'Enter the OTP sent to your email'}
            {currentStep === 'password' && 'Create a new password for your account'}
            {currentStep === 'success' && 'Your password has been reset successfully'}
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {successMessage && currentStep !== 'success' && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {/* Email Step */}
          {currentStep === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center gap-3 py-3 text-base font-semibold shadow-lg shadow-blue-500/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </Button>
            </form>
          )}

          {/* OTP Step */}
          {currentStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-center text-2xl tracking-widest text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">Check your email for the 6-digit OTP</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center gap-3 py-3 text-base font-semibold shadow-lg shadow-blue-500/20"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify OTP</span>
                )}
              </Button>
            </form>
          )}

          {/* Password Step */}
          {currentStep === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 pr-10 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70"
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

              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--muted)]/70"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center gap-3 py-3 text-base font-semibold shadow-lg shadow-blue-500/20"
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </Button>
            </form>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 p-4">
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <p className="text-[color:var(--foreground)]">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link href="/auth/login">
                <Button variant="primary" className="w-full justify-center gap-3 py-3 text-base font-semibold shadow-lg shadow-blue-500/20">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}

          {/* Back to Login Link */}
          {currentStep !== 'success' && (
            <div className="mt-6 flex items-center justify-center">
              <Link href="/auth/login" className="flex items-center gap-2 text-xs font-medium text-[color:var(--primary)] hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
            <ShieldCheck className="h-4 w-4 text-[color:var(--primary)]" />
            Your password is encrypted and secure.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
