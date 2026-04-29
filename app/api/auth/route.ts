import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    const { action, username, password } = await req.json();

    if (!action || !username || !password) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. XỬ LÝ ĐĂNG KÝ
    if (action === "register") {
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser) {
        return NextResponse.json(
          { error: "Username đã tồn tại" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username: username.trim(),
        password: hashedPassword,
        plainPassword: password.trim(), // ⚠️ Xóa khi go live
        role: "user",
        canPost: true,
      });

      return NextResponse.json({
        success: true,
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      });
    }

    // 2. XỬ LÝ ĐĂNG NHẬP
    if (action === "login") {
      const user = await User.findOne({ username: username.trim() });

      if (!user) {
        return NextResponse.json(
          { error: "Sai tài khoản hoặc mật khẩu" },
          { status: 401 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Sai tài khoản hoặc mật khẩu" },
          { status: 401 }
        );
      }

      const { password: _, ...safeUser } = user.toObject();

      // Set cookie để middleware đọc được
      const res = NextResponse.json(safeUser);
      res.cookies.set("user_role", safeUser.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 ngày
        path: "/",
      });
      res.cookies.set("user_id", String(safeUser._id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return res;
    }

    return NextResponse.json(
      { error: "Action không hợp lệ" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Lỗi /api/auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}