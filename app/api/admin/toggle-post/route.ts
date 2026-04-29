import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get("user_role")?.value;

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Quyen han khong du" }, { status: 403 });
    }

    const { targetUserId, canPost } = await req.json();

    if (!targetUserId || canPost === undefined) {
      return NextResponse.json({ error: "Thieu thong tin" }, { status: 400 });
    }

    const conn = await connectDB();
    await conn.connection.db?.collection("users").updateOne(
      { _id: new ObjectId(targetUserId) },
      { $set: { canPost: canPost } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
