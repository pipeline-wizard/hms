import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Role-based route protection
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only routes
    if (path.startsWith("/api/users") && token?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/patients/:path*",
    "/api/prescriptions/:path*",
    "/api/billing/:path*",
    "/api/settings/:path*",
    "/api/templates/:path*",
    "/api/users/:path*",
    "/api/dashboard/:path*",
    "/api/admissions/:path*",
    "/onboarding/:path*",
  ],
};
