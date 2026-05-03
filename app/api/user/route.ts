import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    await connectMongoDB();
    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ message: "Lỗi kết nối database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, email, password, role } = await req.json();
    if (!username || !email || !password)
      return NextResponse.json({ message: "Thiếu thông tin bắt buộc" }, { status: 400 });

    await connectMongoDB();

    const exists = await User.findOne({
      $or: [{ email: email.trim().toLowerCase() }, { username: username.trim() }],
    });
    if (exists)
      return NextResponse.json({ message: "Username hoặc Email đã tồn tại" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      plainPassword: password.trim(), // ⚠️ Xóa dòng này khi go live
      role: role || "user",
    });

    return NextResponse.json({ message: "Tạo thành công" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Lỗi Server khi tạo" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId)
      return NextResponse.json({ message: "Không tìm thấy ID người dùng" }, { status: 400 });

    await connectMongoDB();

    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ message: "Người dùng không tồn tại" }, { status: 404 });

    const update: Record<string, any> = {};

    // Cập nhật thông tin cơ bản
    if (body.username)  update.username = body.username.trim();
    if (body.email)     update.email    = body.email.trim().toLowerCase();
    if (body.role)      update.role     = body.role;
    if (body.canPost    !== undefined) update.canPost  = body.canPost;
    if (body.status     !== undefined) update.status   = body.status;

    // ── Suspend / unsuspend ───────────────────────────────────────────────
    if (body.suspended !== undefined) update.suspended = body.suspended;

    if (body.password && body.password.trim() !== "") {
      update.password      = await bcrypt.hash(body.password.trim(), 10);
      update.plainPassword = body.password.trim(); // ⚠️ Xóa dòng này khi go live
    }

    await User.findByIdAndUpdate(userId, { $set: update });
    return NextResponse.json({ message: "Cập nhật thành công" });
  } catch (error: any) {
    return NextResponse.json({ message: "Lỗi cập nhật: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "Thiếu ID" }, { status: 400 });

    await connectMongoDB();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "Xóa thành công" });
  } catch {
    return NextResponse.json({ message: "Lỗi xóa" }, { status: 500 });
  }
}