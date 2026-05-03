import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { listingId, action } = await req.json();
    if (!listingId || !["save", "unsave"].includes(action))
      return NextResponse.json({ error: "Thiếu tham số" }, { status: 400 });

    await connectMongoDB();

    if (action === "save") {
      await User.findByIdAndUpdate(userId, { $addToSet: { savedListings: listingId } });
    } else {
      await User.findByIdAndUpdate(userId, { $pull: { savedListings: listingId } });
    }

    return NextResponse.json({ success: true, action });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}