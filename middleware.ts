import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.cookies.get("user_role")?.value;
  const userSuspended = request.cookies.get("user_suspended")?.value;

  // ─── Bảo vệ /admin ───────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ─── Bảo vệ /mod ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/mod")) {
    if (userRole !== "mod" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ─── Bảo vệ /api/admin/* ─────────────────────────────────────────────────
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

  // ─── Bảo vệ /api/mod/* ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/mod")) {
    if (userRole !== "mod" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }
  }

  // ─── Chặn user bị đình chỉ khỏi các API đăng/sửa/xóa tin ───────────────
  // User vẫn đăng nhập được, vẫn xem được trang chủ và trang phòng
  // Nhưng không thể gọi các API tạo/sửa/xóa listing
  const isSuspended = userSuspended === "true";

  if (isSuspended) {
    const blockedPaths = [
      { path: "/api/listings", methods: ["POST"] },           // tạo tin mới
      { path: "/api/listings/", methods: ["PATCH", "DELETE"] }, // sửa/xóa tin
    ];

    for (const rule of blockedPaths) {
      if (
        pathname.startsWith(rule.path) &&
        rule.methods.includes(request.method)
      ) {
        return NextResponse.json(
          { error: "Tài khoản của bạn đang bị đình chỉ. Vui lòng liên hệ quản trị viên." },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/mod/:path*",
    "/api/admin/:path*",
    "/api/mod/:path*",
    "/api/listings/:path*",
    "/api/listings",
  ],
};