import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Lấy dữ liệu 1 tin
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();
    const item = await conn.connection.db?.collection("listings").findOne({ _id: new ObjectId(id) });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi GET" }, { status: 500 });
  }
}

// PUT: Cập nhật tin
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const conn = await connectDB();
    
    await conn.connection.db?.collection("listings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { 
          title: data.title,
          price: data.price,
          address: data.address,
          description: data.description,
          imageUrl: data.imageUrl,
          updatedAt: new Date()
        } 
      }
    );
    return NextResponse.json({ message: "Updated" });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi PUT" }, { status: 500 });
  }
}

// DELETE: Xóa tin (nếu cần)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();
    await conn.connection.db?.collection("listings").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi DELETE" }, { status: 500 });
  }
}