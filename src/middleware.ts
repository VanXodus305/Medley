import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/customer", "/vendor"];

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Login page - redirect authenticated users to register
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/register", req.url));
    }
  }

  // Register page - redirect unauthenticated users to login
  if (pathname === "/register") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // If authenticated, allow access - client-side will handle redirect if already registered
  }

  // Redirect to login if trying to access protected routes without session
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Client-side will handle registration status check via useUserInfo hook
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
