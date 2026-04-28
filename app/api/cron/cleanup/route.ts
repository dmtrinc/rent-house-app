import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    const conn = await connectDB();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Tìm và xóa các tin có status 'hide' và ngày ẩn cũ hơn 30 ngày
    const result = await conn.connection.db?.collection("listings").deleteMany({
      status: "hide",
      hiddenAt: { $lte: thirtyDaysAgo }
    });

    return NextResponse.json({ 
      message: "Cleanup successful", 
      deletedCount: result?.deletedCount 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}