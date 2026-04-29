import { NextResponse } from "next/server";
import connectMongoDB from "../../../lib/mongodb";
import User from "../../../models/user";

export async function GET() {
  try {
    await connectMongoDB();

    // Lấy tất cả người dùng, bao gồm cả password (đã mã hóa) để kiểm tra
    const users = await User.find().sort({ createdAt: -1 });

    // Trả về danh sách chi tiết
    return NextResponse.json({
      total: users.length,
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        passwordHash: u.password, // Đây là mật khẩu đã hash bằng bcrypt
        createdAt: u.createdAt
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Lỗi kết nối hoặc truy vấn", 
      details: error.message 
    }, { status: 500 });
  }
}