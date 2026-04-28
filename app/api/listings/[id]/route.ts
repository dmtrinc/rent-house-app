import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Lấy chi tiết tin
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();
    const item = await conn.connection.db?.collection("listings").findOne({ _id: new ObjectId(id) });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });
  }
}

// PUT: Sửa tin (Chỉ cho phép nếu khớp deviceId)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { deviceId, ...updateData } = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    const existing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });
    
    if (!existing || existing.deviceId !== deviceId) {
      return NextResponse.json({ error: "Bạn không có quyền chỉnh sửa tin này!" }, { status: 403 });
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

// DELETE: Xóa tin (Chỉ cho phép nếu khớp deviceId)
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
    return NextResponse.json({ message: "Đã xóa tin" });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi khi xóa" }, { status: 500 });
  }
}