import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Function to check if user has a NextAuth.js session
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // Get token from NextAuth
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    return !!token;
  } catch (error) {
    console.error('Error checking session token:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Get user authentication status
  const userAuthenticated = await isAuthenticated(request);
  
  console.log('Middleware - User authenticated:', userAuthenticated);
  console.log('Middleware - Request path:', request.nextUrl.pathname);

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/api/auth/',
  ];
  
  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // Check if the current path is a form view path (publicly accessible forms)
  const isFormPath = request.nextUrl.pathname.startsWith('/form/');

  // If user is not authenticated and trying to access protected routes
  if (
    !userAuthenticated && 
    !isPublicPath && 
    !isFormPath
  ) {
    console.log('Middleware - No user, redirecting to login');
    // Redirect to login page
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (
    userAuthenticated && 
    (request.nextUrl.pathname === '/auth/login' || 
     request.nextUrl.pathname === '/auth/register')
  ) {
    console.log('Middleware - Authenticated user accessing login page, redirecting to dashboard');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  console.log('Middleware - Continuing with request');
  
  // For authenticated users accessing protected routes, continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};