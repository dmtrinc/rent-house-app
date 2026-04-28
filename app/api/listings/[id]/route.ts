import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Lấy chi tiết một tin cụ thể
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();
    const item = await conn.connection.db?.collection("listings").findOne({ _id: new ObjectId(id) });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy chi tiết" }, { status: 404 });
  }
}

// PUT: Cập nhật tin (Chỉ máy chủ tin mới sửa được)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { deviceId, ...updateData } = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    const existing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });

    // KIỂM TRA QUYỀN TRUY CẬP
    if (!existing || existing.deviceId !== deviceId) {
      return NextResponse.json({ error: "Bạn không có quyền sửa tin này!" }, { status: 403 });
    }

    await db?.collection("listings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return NextResponse.json({ message: "Cập nhật thành công" });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

// DELETE: Xóa tin (Chỉ máy chủ tin mới xóa được)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    
    const conn = await connectDB();
    const db = conn.connection.db;

    const existing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });

    if (!existing || existing.deviceId !== deviceId) {
      return NextResponse.json({ error: "Bạn không có quyền xóa tin này!" }, { status: 403 });
    }

    await db?.collection("listings").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Đã xóa tin vĩnh viễn" });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xóa tin" }, { status: 500 });
  }
}