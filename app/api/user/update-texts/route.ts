import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const body = await req.json();
    const update: Record<string, string> = {};
    if (typeof body.headerText === "string") update.headerText = body.headerText.trim();
    if (typeof body.footerText === "string") update.footerText = body.footerText.trim();

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error: "Không có dữ liệu" }, { status: 400 });

    await connectMongoDB();
    await User.findByIdAndUpdate(userId, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}