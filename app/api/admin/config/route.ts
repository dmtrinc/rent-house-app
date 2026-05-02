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
      phongtrongTitle:    doc?.phongtrongTitle      ?? "Phong tro Angiahouse - danh sach phong trong",
      phongtrongFooter:   doc?.phongtrongFooter     ?? "Angiahouse 090.222.5314 - Phi sale 50% (HD6th) 70% (HD12th)",
      version:            doc?.version             ?? "1.0.0",
    };

    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      }
    });
  } catch (error: any) {
    console.error("Loi GET /api/admin/config:", error);
    return NextResponse.json({ message: "Khong the tai cau hinh" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    const { _id, ...updateData } = body;

    await db?.collection(CONFIG_COLLECTION).updateOne(
      { _id: CONFIG_ID as any },
      { $set: { ...updateData, updatedAt: new Date() } },
      { upsert: true }
    );

    const updated = await db?.collection(CONFIG_COLLECTION).findOne({ _id: CONFIG_ID as any });

    return NextResponse.json(updated, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      }
    });
  } catch (error: any) {
    console.error("Loi POST /api/admin/config:", error);
    return NextResponse.json({ message: "Loi khi cap nhat cau hinh" }, { status: 500 });
  }
}
