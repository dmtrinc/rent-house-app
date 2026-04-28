import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Lấy chi tiết tin (Công khai)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();
    const listing = await conn.connection.db?.collection("listings").findOne({ 
      _id: new ObjectId(id) 
    });

    if (!listing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Cập nhật nội dung (Có bảo mật ở tầng Edit Page)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const conn = await connectDB();
    
    // Tách action ẩn/hiện của Admin
    const { role, action, ...updateData } = body;
    const updateQuery = action 
      ? { $set: { status: action } } 
      : { $set: { ...updateData, updatedAt: new Date() } };

    await conn.connection.db?.collection("listings").updateOne(
      { _id: new ObjectId(id) },
      updateQuery
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}