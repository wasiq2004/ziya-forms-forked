import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatarUrl?: string | null;
      role?: string;
      status?: 'active' | 'inactive';
    };
  }

  interface User {
    id: string;
    avatarUrl?: string | null;
    role?: string;
    status?: 'active' | 'inactive';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
    avatarUrl?: string | null;
    role?: string;
    status?: 'active' | 'inactive';
  }
}
