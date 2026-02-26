import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/issue",
  "/issue-batch",
  "/verify",
  "/revoke",
];
const authRoutes = ["/login"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Kalau akses halaman admin tapi belum login → redirect ke login
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Kalau sudah login tapi akses halaman login → redirect ke dashboard
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|verify).*)"],
};
