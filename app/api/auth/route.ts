import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/user";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 ngày
  path: "/",
};

export async function POST(req: Request) {
  try {
    const { action, username, password } = await req.json();
    if (!action || !username || !password)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });

    await connectDB();

    // ── ĐĂNG KÝ ────────────────────────────────────────────────────────────
    if (action === "register") {
      const exists = await User.findOne({ username: username.trim() });
      if (exists)
        return NextResponse.json({ error: "Username đã tồn tại" }, { status: 400 });

      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username: username.trim(),
        password: hashed,
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

    // ── ĐĂNG NHẬP ──────────────────────────────────────────────────────────
    if (action === "login") {
      const user = await User.findOne({ username: username.trim() });
      if (!user)
        return NextResponse.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return NextResponse.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });

      const { password: _pw, plainPassword: _pp, ...safeUser } = user.toObject();

      const res = NextResponse.json(safeUser);
      res.cookies.set("user_id",        String(safeUser._id),          COOKIE_OPTS);
      res.cookies.set("user_role",      safeUser.role,                 COOKIE_OPTS);
      // ── Cookie này middleware dùng để chặn API khi bị đình chỉ ──────────
      res.cookies.set("user_suspended", String(!!safeUser.suspended),  COOKIE_OPTS);

      return res;
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("Lỗi /api/auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}