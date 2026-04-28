import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { action, username, password } = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    // 1. Xử lý ĐĂNG KÝ
    if (action === "register") {
      const existingUser = await db?.collection("users").findOne({ username });
      if (existingUser) {
        return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 400 });
      }

      // Tự động kiểm tra để cấp quyền Admin cho tài khoản mong muốn
      // Nếu username là 'admintri', hệ thống sẽ gán role là 'admin'
      const role = (username === "admintri") ? "admin" : "user";

      const result = await db?.collection("users").insertOne({
        username,
        password, // Lưu ý: Trong thực tế nên sử dụng thư viện bcrypt để mã hóa mật khẩu
        role: role,
        canPost: true,
        createdAt: new Date()
      });

      return NextResponse.json({ 
        success: true, 
        _id: result?.insertedId, 
        role, 
        username 
      });
    }

    // 2. Xử lý ĐĂNG NHẬP
    if (action === "login") {
      const user = await db?.collection("users").findOne({ username, password });
      
      if (!user) {
        return NextResponse.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
      }
      
      // Loại bỏ mật khẩu trước khi trả về dữ liệu cho trình duyệt để đảm bảo an toàn
      const { password: _, ...safeUser } = user;
      return NextResponse.json(safeUser);
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}