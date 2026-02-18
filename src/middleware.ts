import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/customer", "/vendor"];
const authRoutes = ["/login", "/register"];

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Redirect to login if trying to access protected routes without session
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check user type access
    const userType = (session.user as any)?.userType;

    // If user doesn't have a userType, redirect to register
    if (!userType) {
      return NextResponse.redirect(new URL("/register", req.url));
    }

    // Prevent cross-role access
    if (pathname.startsWith("/customer") && userType !== "customer") {
      return NextResponse.redirect(new URL("/vendor", req.url));
    }

    if (pathname.startsWith("/vendor") && userType !== "vendor") {
      return NextResponse.redirect(new URL("/customer", req.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (session && (session.user as any)?.userType) {
      const userType = (session.user as any)?.userType;
      const dashboardRoute = userType === "vendor" ? "/vendor" : "/customer";
      return NextResponse.redirect(new URL(dashboardRoute, req.url));
    }
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
