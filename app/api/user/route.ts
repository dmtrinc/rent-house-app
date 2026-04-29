import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongoDB from "../../../lib/mongodb";
import User from "../../../models/user";

export async function GET() {
  try {
    await connectMongoDB();
    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: "Lỗi kết nối database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, email, password, role } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    await connectMongoDB();

    const userExists = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { username: username.trim() }
      ]
    });

    if (userExists) {
      return NextResponse.json({ message: "Username hoặc Email đã tồn tại" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      plainPassword: password.trim(), // ⚠️ Xóa dòng này khi go live
      role: role || "user",
    });

    return NextResponse.json({ message: "Tạo thành công" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Lỗi Server khi tạo" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, username, email, password, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "Không tìm thấy ID người dùng" }, { status: 400 });
    }

    await connectMongoDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "Người dùng không tồn tại" }, { status: 404 });
    }

    const updateData: any = {};
    if (username) updateData.username = username.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (role) updateData.role = role;

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password.trim(), 10);
      updateData.plainPassword = password.trim(); // ⚠️ Xóa dòng này khi go live
    }

    await User.findByIdAndUpdate(userId, { $set: updateData });

    return NextResponse.json({ message: "Cập nhật thành công" }, { status: 200 });
  } catch (error: any) {
    console.error("Lỗi PATCH API:", error);
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
  } catch (error) {
    return NextResponse.json({ message: "Lỗi xóa" }, { status: 500 });
  }
}