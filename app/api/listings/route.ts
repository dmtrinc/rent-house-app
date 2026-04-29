// BẮT BUỘC: Import NextResponse từ next/server cho các file route.ts
import { NextResponse } from "next/server"; 
import connectMongoDB from "../../../lib/mongodb";
import Listing from "../../../models/listing";

/**
 * GET: Lấy danh sách toàn bộ tin đăng
 */
export async function GET() {
  try {
    // 1. Kết nối cơ sở dữ liệu
    await connectMongoDB();

    // 2. Truy vấn dữ liệu từ bảng Listing
    // Sắp xếp theo updatedAt: -1 để tin mới sửa/đăng luôn hiện lên đầu
    const listings = await Listing.find().sort({ updatedAt: -1 });

    // 3. Trả về phản hồi JSON
    // Sử dụng (listings || []) để đảm bảo luôn trả về mảng, tránh lỗi parse JSON ở Frontend
    return NextResponse.json(listings || []);

  } catch (error: any) {
    console.error("Lỗi fetch listings:", error);
    
    // Trả về lỗi 500 kèm thông báo chi tiết nếu có sự cố
    return NextResponse.json(
      { 
        message: "Lỗi hệ thống khi tải danh sách tin đăng", 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST: Tạo tin đăng mới
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.title || !data.address) {
      return NextResponse.json(
        { message: "Tiêu đề và địa chỉ là bắt buộc" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const newListing = await Listing.create(data);
    
    return NextResponse.json(
      { message: "Tạo tin đăng thành công", id: newListing._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lỗi POST listing:", error);
    return NextResponse.json(
      { message: "Không thể tạo tin đăng", error: error.message },
      { status: 500 }
    );
  }
}