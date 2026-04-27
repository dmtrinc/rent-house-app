import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log ra để kiểm tra dữ liệu thực tế nhận được từ Form
    console.log("Dữ liệu nhận được:", body);

    const { title, price, address, imageUrl, description } = body;

    // Kết nối Database
    const conn = await connectDB();
    const db = conn.connection.db;

    if (!db) throw new Error("Không thể kết nối Database");

    // Thực hiện chèn dữ liệu
    const result = await db.collection("listings").insertOne({
      title: title || "Không tiêu đề",
      price: Number(price) || 0,
      address: address || "",
      imageUrl: imageUrl || "",
      description: description || "",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error: any) {
    console.error("❌ LỖI TẠI SERVER:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}