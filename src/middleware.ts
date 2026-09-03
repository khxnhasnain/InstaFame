import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "instafame_secret_key_default_384729184719284712",
  });
  const { pathname } = req.nextUrl;

  const isAuth = !!token;
  const isLoginPage = pathname === "/login";

  const protectedRoutes = ["/dashboard", "/instagram", "/youtube", "/wallet", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // If user is not authenticated and tries to access protected route -> redirect to /login
  if (isProtectedRoute && !isAuth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already authenticated and tries to visit /login -> redirect to /dashboard
  if (isLoginPage && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/instagram/:path*",
    "/youtube/:path*",
    "/wallet/:path*",
    "/admin/:path*",
    "/login",
  ],
};
