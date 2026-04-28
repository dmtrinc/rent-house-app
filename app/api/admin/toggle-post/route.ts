import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { adminRole, targetUserId, canPost } = await req.json();

    if (adminRole !== "admin") {
      return NextResponse.json({ error: "Quyền hạn không đủ" }, { status: 403 });
    }

    const conn = await connectDB();
    // Cập nhật trạng thái cho phép đăng tin của user
    await conn.connection.db?.collection("users").updateOne(
      { _id: new ObjectId(targetUserId) },
      { $set: { canPost: canPost } } // canPost: true/false
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}