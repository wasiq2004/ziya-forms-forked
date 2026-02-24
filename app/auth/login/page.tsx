'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Chrome } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is already logged in
  useEffect(() => {
    console.log('LoginPage useEffect - status:', status);
    if (status === 'authenticated') {
      console.log('User already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to sign in with credentials:', { email });
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // We'll handle the redirect manually
      });
      
      console.log('Sign in result:', result);
      
      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else if (result?.ok) {
        console.log('Sign in successful, redirecting to dashboard');
        // Wait a bit for the session to be established
        // Then redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Attempting Google sign in');
      // For Google sign-in, we let NextAuth handle the redirect
      const result = await signIn('google', { callbackUrl: '/dashboard' });
      console.log('Google sign in result:', result);
      
      // If there's an error, handle it
      if (result?.error) {
        setError('Failed to sign in with Google: ' + result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  // Don't render anything while checking session status
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If already authenticated, don't show login form
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2 font-[family-name:var(--font-poppins)]">
            Welcome to Ziya Forms
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to start creating amazing forms
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full flex items-center justify-center gap-3 text-lg py-3"
            disabled={loading}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <span>Sign in</span>
            )}
          </Button>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="mx-4 text-gray-500 dark:text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-3 text-lg py-3"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <Chrome className="w-5 h-5" />
          Sign in with Google
        </Button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <a href="/auth/register" className="text-blue-600 hover:underline dark:text-blue-400">
              Create one
            </a>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}