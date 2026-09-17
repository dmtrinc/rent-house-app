import { NextResponse } from "next/server";
import connectMongoDB from "../../../lib/mongodb";
import Listing from "../../../models/listing";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectMongoDB();

    const cookieStore = await cookies();
    const userRole = cookieStore.get("user_role")?.value;

    const isPrivileged = userRole === "admin" || userRole === "mod";

    // Admin/Mod thấy toàn bộ, user thường chỉ thấy active
    const query = isPrivileged ? {} : { status: "active" };

    const listings = await Listing.find(query).sort({ updatedAt: -1 });

    return NextResponse.json(listings || []);
  } catch (error: any) {
    console.error("Lỗi fetch listings:", error);
    return NextResponse.json(
      { message: "Lỗi hệ thống khi tải danh sách tin đăng", error: error.message },
      { status: 500 }
    );
  }
}

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