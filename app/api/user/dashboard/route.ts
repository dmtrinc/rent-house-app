import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import Listing from "@/models/listing";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    await connectMongoDB();

    const user = await User.findById(userId)
      .select("-password -plainPassword")
      .lean();
    if (!user) return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

    const myListings = await Listing.find({ userId }).sort({ createdAt: -1 }).lean();

    const savedIds: string[] = (user as any).savedListings || [];
    const savedListings = savedIds.length > 0
      ? await Listing.find({ _id: { $in: savedIds } }).sort({ createdAt: -1 }).lean()
      : [];

    const historyIds: string[] = (user as any).viewHistory || [];
    const viewHistory = historyIds.length > 0
      ? await Listing.find({ _id: { $in: historyIds } }).lean().then(items => {
          // Giữ đúng thứ tự mới nhất trước
          const map = new Map(items.map(i => [String((i as any)._id), i]));
          return historyIds.map(id => map.get(id)).filter(Boolean);
        })
      : [];

    return NextResponse.json({ user, myListings, savedListings, viewHistory });
  } catch (error: any) {
    console.error("GET /api/user/dashboard:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}