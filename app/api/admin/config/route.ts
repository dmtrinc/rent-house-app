import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

const CONFIG_COLLECTION = "system_config";
const CONFIG_ID = "main";

export async function GET() {
  try {
    const conn = await connectDB();
    const db = conn.connection.db;
    const doc = await db?.collection(CONFIG_COLLECTION).findOne({ _id: CONFIG_ID as any });

    const config = {
      globalPostEnabled:  doc?.globalPostEnabled  ?? true,
      maintenanceMode:    doc?.maintenanceMode     ?? false,
      contactHotline:     doc?.contactHotline      ?? "0902225314",
      autoDeleteDays:     doc?.autoDeleteDays      ?? 30,
      phongtrongTitle:    doc?.phongtrongTitle      ?? "Phòng trọ Angiahouse - danh sách phòng trống",
      phongtrongFooter:   doc?.phongtrongFooter     ?? "Angiahouse 090.222.5314 - Phí sale 50% (HĐ6th) 70% (HĐ12th)",
      version:            doc?.version             ?? "1.0.0",
    };

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/config:", error);
    return NextResponse.json({ message: "Không thể tải cấu hình" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    // Chỉ lưu các field được phép, loại bỏ _id nếu client gửi lên
    const { _id, ...updateData } = body;

    await db?.collection(CONFIG_COLLECTION).updateOne(
      { _id: CONFIG_ID as any },
      { $set: { ...updateData, updatedAt: new Date() } },
      { upsert: true }
    );

    const updated = await db?.collection(CONFIG_COLLECTION).findOne({ _id: CONFIG_ID as any });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Lỗi POST /api/admin/config:", error);
    return NextResponse.json({ message: "Lỗi khi cập nhật cấu hình" }, { status: 500 });
  }
}