import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    if (!db) throw new Error("Database connection failed");

    // Thực hiện xóa với ID được chuyển về dạng ObjectId của Mongoose
    const result = await db.collection("listings").deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Không tìm thấy bản ghi" });
    }
  } catch (error: any) {
    console.error("API Delete Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}