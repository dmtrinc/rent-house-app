import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.cookies.get("user_role")?.value;

  // Bảo vệ trang /admin
  if (pathname.startsWith("/admin")) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Bảo vệ /api/admin/* — NGOẠI TRỪ GET /api/admin/config (public, dùng cho mọi user)
  if (pathname.startsWith("/api/admin")) {
    const isPublicConfigRead =
      pathname === "/api/admin/config" && request.method === "GET";

    if (!isPublicConfigRead && userRole !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};