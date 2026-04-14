import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Function to check if user has a NextAuth.js session
async function getAuthToken(request: NextRequest) {
  try {
    // Get token from NextAuth
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    return token;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and public files so images/icons are never redirected.
  if (/\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Get user authentication status
  const token = await getAuthToken(request);
  const userAuthenticated = !!token;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/api/auth/',
  ];
  
  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );
  const isRootPath = pathname === '/';
  
  // Check if the current path is a form view path (publicly accessible forms)
  const isFormPath = pathname.startsWith('/form/');
  const isEmbedPath = pathname.startsWith('/forms/embed');
  const isAdminPath = pathname.startsWith('/admin');

  // If user is not authenticated and trying to access protected routes
  if (
    !userAuthenticated && 
    !isPublicPath && 
    !isRootPath &&
    !isFormPath &&
    !isEmbedPath
  ) {
    // Redirect to login page
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (
    userAuthenticated && 
    (pathname === '/auth/login' || 
     pathname === '/auth/register')
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  if (userAuthenticated && isAdminPath && token?.role !== 'super_admin') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }
  
  // For authenticated users accessing protected routes, continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [

    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
