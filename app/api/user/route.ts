import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const conn = await connectDB();
    const users = await conn.connection.db
      ?.collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, password, role, email } = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    // Kiểm tra username đã tồn tại chưa
    const existingUser = await db?.collection("users").findOne({ username });
    if (existingUser) return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 400 });

    // Kiểm tra email đã tồn tại chưa (vì index email là unique)
    const finalEmail = email || `${username}@angiahouse.com`;
    const existingEmail = await db?.collection("users").findOne({ email: finalEmail });
    if (existingEmail) return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 400 });

    await db?.collection("users").insertOne({
      username,
      password,
      email: finalEmail,
      role: role || "user",
      canPost: true,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Xử lý lỗi trùng lặp từ MongoDB (mã 11000)
    if (error.code === 11000) {
      return NextResponse.json({ error: "Lỗi: Email hoặc Username này đã tồn tại trong hệ thống." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, username, password, role, email } = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    if (!userId) return NextResponse.json({ error: "Thiếu ID người dùng" }, { status: 400 });

    await db?.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          username, 
          password, 
          role,
          email: email || `${username}@angiahouse.com`
        } 
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}