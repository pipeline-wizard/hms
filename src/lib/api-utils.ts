import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Standard API error response
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Standard API success response
export function apiSuccess(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

// Get authenticated session or return error
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: apiError("Unauthorized", 401) };
  }
  return { session, error: null };
}

// Role check helper
export function requireRole(session: any, roles: string[]) {
  if (!roles.includes(session.user.role)) {
    return apiError("Forbidden: Insufficient permissions", 403);
  }
  return null;
}

// Parse pagination params
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "10"))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
