import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const update: Record<string, any> = {};

    if (typeof body.username === "string" && body.username.trim())
      update.username = body.username.trim();
    if (typeof body.email === "string")
      update.email = body.email.trim().toLowerCase() || undefined;
    if (typeof body.phone === "string")
      update.phone = body.phone.trim();
    if (typeof body.newPassword === "string" && body.newPassword.trim()) {
      update.password = await bcrypt.hash(body.newPassword.trim(), 10);
      update.plainPassword = body.newPassword.trim(); // ⚠️ Xóa khi go live
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
    }

    await connectMongoDB();

    if (update.username) {
      const exists = await User.findOne({ username: update.username, _id: { $ne: userId } });
      if (exists) {
        return NextResponse.json({ error: "Username đã tồn tại" }, { status: 400 });
      }
    }

    await User.findByIdAndUpdate(userId, { $set: update });
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("POST /api/user/update-profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}