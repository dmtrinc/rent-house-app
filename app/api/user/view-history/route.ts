import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { listingId } = await req.json();
    if (!listingId) return NextResponse.json({ error: "Thiếu listingId" }, { status: 400 });

    await connectMongoDB();

    // Xóa nếu đã có (tránh trùng), thêm vào đầu, giới hạn 50
    await User.findByIdAndUpdate(userId, {
      $pull: { viewHistory: listingId },
    });
    await User.findByIdAndUpdate(userId, {
      $push: { viewHistory: { $each: [listingId], $position: 0, $slice: 50 } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}