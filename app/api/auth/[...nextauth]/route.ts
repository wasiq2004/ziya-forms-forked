import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, updateUser } from '@/lib/mysql/utils';

// Environment variable validation
const validateEnvironment = () => {
  const errors = [];
  
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is not set');
  }
  
  if (!process.env.GOOGLE_CLIENT_ID) {
    errors.push('GOOGLE_CLIENT_ID is not set');
  }
  
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    errors.push('GOOGLE_CLIENT_SECRET is not set');
  }
  
  if (errors.length > 0) {
    throw new Error(`Missing environment variables: ${errors.join(', ')}`);
  }
};

// Validate environment variables at startup
validateEnvironment();

// Get the base URL for NextAuth and set it in environment
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (process.env.REPLIT_DEV_DOMAIN) {
    const url = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    process.env.NEXTAUTH_URL = url;
    return url;
  }
  
  const url = 'http://localhost:5000';
  process.env.NEXTAUTH_URL = url;
  return url;
};

// Initialize NEXTAUTH_URL
getBaseUrl();

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
          // Check if user exists
          const user = await getUserByEmail(credentials.email);
          
          if (!user) {
            // User doesn't exist
            console.log('User not found');
            return null;
          }
          
          // Check if password_hash exists (for backward compatibility)
          if (!user.password_hash) {
            console.error('User exists but has no password hash');
            return null;
          }
          
          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isValid) {
            console.log('Invalid password');
            return null;
          }
          
          // Return user object without password hash
          const { password_hash, ...userWithoutPassword } = user;
          
          console.log('User authenticated successfully:', userWithoutPassword);
          return {
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            name: userWithoutPassword.full_name,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async session({ session, token }) {
      console.log('Session callback - session:', session, 'token:', token);
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      console.log('JWT callback - token:', token, 'user:', user, 'account:', account, 'profile:', profile);
      // If this is the first time the user is signing in
      if (user) {
        token.sub = user.id;
      }
      
      // For Google sign-in, we might need to fetch the user ID
      if (account?.provider === 'google' && profile) {
        try {
          const existingUser = await getUserByEmail(profile.email!);
          
          if (existingUser) {
            token.sub = existingUser.id;
          }
        } catch (error) {
          console.error('Error fetching user ID for JWT token:', error);
        }
      }
      
      return token;
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered', { user, account, profile });
      
      // If signing in with Google
      if (account?.provider === 'google') {
        try {
          // Check if user already exists
          const existingUser = await getUserByEmail(user.email!);
          
          // If user doesn't exist, create them
          if (!existingUser) {
            console.log('Creating new user from Google auth:', { email: user.email, name: user.name });
            const newUser = await createUser({
              email: user.email!,
              full_name: user.name || undefined,
              avatar_url: user.image || undefined,
            });
            
            // Update the user object with the new user data
            user.id = newUser.id;
            console.log('New user created successfully:', newUser.id);
          } else {
            // Update existing user with latest info from Google
            console.log('Updating existing user with Google info:', existingUser.id);
            await updateUser(existingUser.id, {
              full_name: user.name || undefined,
              avatar_url: user.image || undefined,
            });
            
            // Update the user object with existing user data
            user.id = existingUser.id;
            console.log('User updated successfully:', existingUser.id);
          }
          
          return true;
        } catch (error) {
          console.error('Error during Google sign-in:', error);
          return false;
        }
      }
      
      console.log('SignIn callback returning true');
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - url:', url, 'baseUrl:', baseUrl);
      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If it's already an absolute URL with the correct base, use it
      else if (url.startsWith(baseUrl)) {
        return url;
      }
      // Check if it's a Google callback URL
      else if (url.includes('google')) {
        return `${baseUrl}/dashboard`;
      }
      // For credentials login, redirect to dashboard
      else if (url.includes('credentials')) {
        return `${baseUrl}/dashboard`;
      }
      // Otherwise, redirect to dashboard
      return `${baseUrl}/dashboard`;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };