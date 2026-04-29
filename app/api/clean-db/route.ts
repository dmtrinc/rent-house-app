import { NextResponse } from "next/server";
import connectMongoDB from "../../../lib/mongodb";
import User from "../../../models/user";

export async function GET() {
  try {
    await connectMongoDB();
    
    // Xóa tất cả các user có email là null hoặc chuỗi rỗng
    const result = await User.deleteMany({
      $or: [
        { email: null },
        { email: "" }
      ]
    });

    return NextResponse.json({
      message: "Dọn dẹp thành công!",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Lỗi: " + error.message }, { status: 500 });
  }
}