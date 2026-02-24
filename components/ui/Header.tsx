'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <nav className="gradient-bg text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href={session ? "/dashboard" : "/"}>
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="relative w-8 h-8">
                  <Image 
                    src="/logo.svg" 
                    alt="Ziya Forms Logo" 
                    width={32} 
                    height={32}
                    className="rounded-md"
                  />
                </div>
                <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">
                  Ziya Forms
                </h1>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <ThemeToggle />
                <span className="text-sm opacity-90 hidden sm:inline">{session.user?.name || session.user?.email}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}