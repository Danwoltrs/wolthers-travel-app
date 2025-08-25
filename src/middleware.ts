import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to public routes
  const publicRoutes = [
    "/",
    "/auth/callback",
    "/auth/reset-password",
    "/api/auth",
    "/api/test",
    "/api/companies",
    "/api/users",
    "/api/trips",
    "/_next/static",
    "/_next/image",
    "/favicon.ico",
    "/images",
    "/logos"
  ]

  // Check if the path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === "/"
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For now, let the AuthContext handle authentication checks
  // We'll implement proper session verification here later if needed
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js endpoints)
     * - api/test (test endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api/auth|api/test|_next/static|_next/image|favicon.ico|images|logos).*)",
  ],
}