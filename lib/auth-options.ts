import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, updateUser } from '@/lib/mysql/utils';
import { ensureSuperAdminAccount } from '@/lib/mysql/bootstrap-admin';

function validateEnvironment() {
  const errors: string[] = [];

  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is not set');
  }

  if (errors.length > 0) {
    throw new Error(`Missing environment variables: ${errors.join(', ')}`);
  }
}

export function getNextAuthUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }

  return 'http://localhost:4000';
}

export function getNextAuthBasePath() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  const explicitBasePath = process.env.NEXT_PUBLIC_NEXTAUTH_BASE_PATH?.replace(/\/$/, '');

  if (explicitBasePath) {
    return explicitBasePath;
  }

  if (!apiUrl) {
    return '/api/auth';
  }

  if (/^https?:\/\//i.test(apiUrl)) {
    return `${apiUrl}/api/auth`;
  }

  if (apiUrl.endsWith('/api')) {
    return `${apiUrl}/auth`;
  }

  return `${apiUrl}/api/auth`;
}

validateEnvironment();

process.env.NEXTAUTH_URL = getNextAuthUrl();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleProviderEnabled = !!googleClientId && !!googleClientSecret;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          if (credentials.email.toLowerCase() === 'superadmin@ziyaforms.com') {
            await ensureSuperAdminAccount();
          }

          const user = await getUserByEmail(credentials.email);

          if (!user) {
            return null;
          }

          if (!user.password_hash) {
            console.error('User exists but has no password hash');
            return null;
          }

          if ((user.status || 'active') === 'inactive') {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValid) {
            return null;
          }

          const { password_hash, ...userWithoutPassword } = user;

          return {
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            name: userWithoutPassword.full_name,
            avatarUrl: userWithoutPassword.avatar_url || null,
            role: userWithoutPassword.role || 'user',
            status: userWithoutPassword.status || 'active',
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    }),
    ...(googleProviderEnabled
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : [])
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role || 'user';
        session.user.status = token.status || 'active';
        session.user.avatarUrl = (token.avatarUrl as string | null | undefined) || null;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role || token.role || 'user';
        token.status = user.status || token.status || 'active';
        token.avatarUrl = user.avatarUrl || token.avatarUrl || null;
      }

      if (account?.provider === 'google' && profile) {
        try {
          const existingUser = await getUserByEmail(profile.email!);

          if (existingUser) {
            token.sub = existingUser.id;
            token.role = existingUser.role || 'user';
            token.status = existingUser.status || 'active';
            token.avatarUrl = existingUser.avatar_url || token.avatarUrl || null;
          }
        } catch (error) {
          console.error('Error fetching user ID for JWT token:', error);
        }
      }

      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await getUserByEmail(user.email!);

          if (existingUser && (existingUser.status || 'active') === 'inactive') {
            return false;
          }

          if (!existingUser) {
            const newUser = await createUser({
              email: user.email!,
              full_name: user.name || undefined,
              avatar_url: user.image || undefined,
              status: 'active',
              role: 'user',
            });

            user.id = newUser.id;
            user.role = 'user';
            user.status = 'active';
            user.avatarUrl = user.image || null;
          } else {
            await updateUser(existingUser.id, {
              full_name: user.name || undefined,
              avatar_url: user.image || undefined,
            });

            user.id = existingUser.id;
            user.role = existingUser.role || 'user';
            user.status = existingUser.status || 'active';
            user.avatarUrl = existingUser.avatar_url || user.image || null;
          }

          return true;
        } catch (error) {
          console.error('Error during Google sign-in:', error);
          return false;
        }
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      if (url.includes('google')) {
        return `${baseUrl}/dashboard`;
      }

      if (url.includes('credentials')) {
        return `${baseUrl}/dashboard`;
      }

      return `${baseUrl}/dashboard`;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
