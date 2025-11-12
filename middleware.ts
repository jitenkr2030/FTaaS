import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // If no token, redirect to sign in
  if (!token) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(url)
  }

  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/models',
    '/datasets',
    '/fine-tuning',
    '/evaluations',
    '/api-keys',
    '/billing',
    '/team'
  ]

  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !token) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(url)
  }

  // Admin-only routes
  const adminPaths = ['/admin', '/team']
  const isAdminPath = adminPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAdminPath && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // API key authentication for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (apiKey) {
      try {
        // Validate API key and check permissions
        // This would be implemented in the API route handlers
        // For now, we'll let the request proceed
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
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
}