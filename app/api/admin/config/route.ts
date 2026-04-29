// BẮT BUỘC: Import từ next/server cho API Route
import { NextResponse } from "next/server";

/**
 * GET: Lấy cấu hình hệ thống
 * Phục vụ việc kiểm tra xem hệ thống có đang cho phép đăng tin hay không
 */
export async function GET() {
  try {
    // Trong thực tế, bạn có thể lưu cấu hình này vào MongoDB
    // Hiện tại, chúng ta trả về giá trị mặc định để Frontend không bị lỗi fetch
    const config = {
      globalPostEnabled: true, // true: cho phép đăng tin, false: bảo trì
      maintenanceMode: false,
      contactHotline: "090xxxxxxx",
      version: "1.0.0"
    };

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/config:", error);
    return NextResponse.json(
      { message: "Không thể tải cấu hình hệ thống" },
      { status: 500 }
    );
  }
}

/**
 * POST: Cập nhật cấu hình hệ thống (Dành cho trang Admin cài đặt)
 */
export async function POST(req: Request) {
  try {
    const newConfig = await req.json();
    
    // Ở đây bạn có thể thêm logic lưu vào Database
    console.log("Cấu hình mới nhận được:", newConfig);

    return NextResponse.json({ 
      message: "Cập nhật cấu hình thành công",
      data: newConfig 
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Lỗi khi cập nhật cấu hình" },
      { status: 500 }
    );
  }
}