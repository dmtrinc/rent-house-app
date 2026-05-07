import { NextResponse } from "next/server";
import connectMongoDB from "../../../lib/mongodb";
import Listing from "../../../models/listing";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "0")); // 0 = tất cả

    const cookieStore = await cookies();
    const userRole = cookieStore.get("user_role")?.value;
    const isPrivileged = userRole === "admin" || userRole === "mod";

    const query = isPrivileged ? {} : { status: "active" };

    // Chỉ lấy fields cần thiết cho trang chủ
    const fields = "title address price coverImage status availableDate highlights updatedAt createdAt deviceId userId";

    let dbQuery = Listing.find(query).sort({ updatedAt: -1 }).select(fields);

    if (limit > 0) {
      dbQuery = dbQuery.skip((page - 1) * limit).limit(limit);
    }

    const listings = await dbQuery.lean();
    const total = limit > 0 ? await Listing.countDocuments(query) : listings.length;

    return NextResponse.json(listings || [], {
      headers: {
        "X-Total-Count": String(total),
        "X-Page": String(page),
        "X-Limit": String(limit),
        // Cache 30s, revalidate ngầm
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
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
