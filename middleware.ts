import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_COOKIE, hashPassword, safeEqual } from '@/lib/auth'

// Paths that don't require authentication
const PUBLIC_PATHS = new Set([
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  // Static assets
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/api/auth/')) return true
  if (
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/sw.') ||
    pathname.startsWith('/workbox-')
  ) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value

  if (!token) {
    return redirectToLogin(request)
  }

  // Validate token: must equal SHA-256(AUTH_PASSWORD)
  const envPassword = process.env.AUTH_PASSWORD
  if (!envPassword) {
    // Misconfigured — let the request through to avoid lockout, log the issue
    console.error('[middleware] AUTH_PASSWORD is not set')
    return NextResponse.next()
  }

  const expectedToken = await hashPassword(envPassword)

  if (!safeEqual(token, expectedToken)) {
    return redirectToLogin(request)
  }

  return NextResponse.next()
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Run on all paths except Next.js internals and static files handled above
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?|ttf)).*)'],
}
