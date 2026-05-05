// app/api/user/me/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId)
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    await connectMongoDB();

    const user = await User.findById(userId)
      .select("_id username role")
      .lean();

    if (!user)
      return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}