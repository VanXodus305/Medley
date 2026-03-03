import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

const protectedRoutes = ["/customer", "/vendor"];
const authRoutes = ["/login", "/register"];

// Helper function to check if user is registered
async function isUserRegistered(email: string): Promise<boolean> {
  try {
    await connectDB();
    const User = await import("@/models/User").then((m) => m.default);
    const user = await User.findOne({ email });
    return !!user;
  } catch (error) {
    console.error("Error checking user registration:", error);
    return false;
  }
}

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

    // Note: Client-side will handle the final registration status check
    // This prevents logged-in but unregistered users from accessing dashboards
    // The dashboard pages should also check registration status and redirect if needed
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
