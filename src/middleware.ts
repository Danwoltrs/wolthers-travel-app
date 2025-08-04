import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequestWithAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Allow access to auth pages
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next()
    }

    // Protect admin routes
    if (pathname.startsWith("/admin")) {
      if (!token?.role || !["global_admin", "wolthers_staff"].includes(token.role as string)) {
        return NextResponse.redirect(new URL("/auth/signin?error=AccessDenied", req.url))
      }
    }

    // Protect user management routes
    if (pathname.startsWith("/users")) {
      if (!token?.role || !["global_admin", "wolthers_staff"].includes(token.role as string)) {
        return NextResponse.redirect(new URL("/auth/signin?error=AccessDenied", req.url))
      }
    }

    // Protect company management routes
    if (pathname.startsWith("/companies")) {
      if (!token?.role || !["global_admin", "wolthers_staff", "company_admin"].includes(token.role as string)) {
        return NextResponse.redirect(new URL("/auth/signin?error=AccessDenied", req.url))
      }
    }

    // Protect fleet management routes
    if (pathname.startsWith("/fleet")) {
      if (!token?.role || !["global_admin", "wolthers_staff"].includes(token.role as string)) {
        return NextResponse.redirect(new URL("/auth/signin?error=AccessDenied", req.url))
      }
    }

    // Protect trip creation (allow company admins and above)
    if (pathname.startsWith("/trips/new")) {
      if (!token?.role || !["global_admin", "wolthers_staff", "company_admin"].includes(token.role as string)) {
        return NextResponse.redirect(new URL("/auth/signin?error=AccessDenied", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow access to auth pages
        if (pathname.startsWith("/auth/")) {
          return true
        }

        // Always allow access to api/auth (NextAuth endpoints)
        if (pathname.startsWith("/api/auth")) {
          return true
        }

        // For protected routes, require authentication
        const protectedRoutes = [
          "/dashboard",
          "/trips",
          "/companies", 
          "/users",
          "/fleet",
          "/admin",
          "/profile"
        ]

        const isProtectedRoute = protectedRoutes.some(route => 
          pathname.startsWith(route)
        )

        if (isProtectedRoute) {
          return !!token
        }

        // Allow access to public routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images|logos).*)",
  ],
}