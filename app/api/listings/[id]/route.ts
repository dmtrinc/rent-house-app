import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Ai cũng có thể xem chi tiết
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();
    const item = await conn.connection.db?.collection("listings").findOne({ _id: new ObjectId(id) });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Chỉ máy đã đăng mới được xóa
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    const conn = await connectDB();
    const db = conn.connection.db;

    const listing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });
    if (!listing) return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });

    if (listing.deviceId !== deviceId) {
      return NextResponse.json({ error: "Bạn không có quyền xóa tin này" }, { status: 403 });
    }

    await db?.collection("listings").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Chỉ máy đã đăng mới được sửa
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { deviceId, ...updateData } = body;

    const conn = await connectDB();
    const db = conn.connection.db;

    const listing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });
    if (listing?.deviceId !== deviceId) {
      return NextResponse.json({ error: "Không có quyền chỉnh sửa" }, { status: 403 });
    }

    await db?.collection("listings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}