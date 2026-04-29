import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongoDB from "../../../lib/mongodb";
import User from "../../../models/user";

export async function GET() {
  try {
    await connectMongoDB();

    // 1. Kiểm tra xem username hoặc email đã tồn tại chưa để tránh lỗi Duplicate
    const existingUser = await User.findOne({ 
      $or: [
        { username: "admintri" },
        { email: "admin@angiahouse.vn" }
      ] 
    });

    if (existingUser) {
      return NextResponse.json({ message: "Tài khoản đã tồn tại rồi!" }, { status: 400 });
    }

    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash("poiuytre", 10);

    // 3. Tạo User với vai trò admin
    const newAdmin = await User.create({
      username: "admintri",
      email: "admin@angiahouse.vn", // Đảm bảo email hợp lệ để không bị lỗi null
      password: hashedPassword,
      role: "admin",
      status: "active"
    });

    return NextResponse.json({
      message: "Tạo Admin thành công!",
      user: {
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Lỗi: " + error.message }, { status: 500 });
  }
}