import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest } from 'next/server';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return null;
  }
  
  return {
    id: session.user.id!,
    email: session.user.email!,
    name: session.user.name,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}
