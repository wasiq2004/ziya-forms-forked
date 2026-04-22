'use client';

import type { Session } from 'next-auth';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { getNextAuthBasePath } from '@/lib/endpoints';

export function SessionProvider({ children, session }: { children: ReactNode; session?: Session | null }) {
  return (
    <NextAuthSessionProvider
      session={session}
      basePath={getNextAuthBasePath()}
      refetchOnWindowFocus={false}
      refetchInterval={0}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
