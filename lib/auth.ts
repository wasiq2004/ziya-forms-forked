import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { getUserById } from '@/lib/mysql/utils';

function isExpectedDynamicUsageError(error: unknown) {
  return error instanceof Error && (
    error.message.includes('Dynamic server usage') ||
    (typeof (error as { digest?: string }).digest === 'string' && (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE')
  );
}

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return null;
    }

    const user = await getUserById(session.user.id!);

    if (!user || (user.status && user.status === 'inactive')) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role || 'user',
      status: user.status || 'active',
      avatar_url: user.avatar_url,
    };
  } catch (error) {
    if (!isExpectedDynamicUsageError(error)) {
      console.error('Failed to resolve current user:', error);
    }
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}
