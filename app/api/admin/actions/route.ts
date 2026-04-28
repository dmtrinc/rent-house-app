import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { action, targetId, status, days } = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    if (!db) return NextResponse.json({ error: "Database error" }, { status: 500 });

    // 1. Logic Ẩn/Hiện vô thời hạn
    if (action === "toggle-hide") {
      await db.collection("listings").updateOne(
        { _id: new ObjectId(targetId) },
        { 
          $set: { status: status },
          $unset: { scheduledDelete: "" } // Nếu có lịch xóa cũ thì xóa bỏ khi người dùng thay đổi trạng thái này
        }
      );
      return NextResponse.json({ success: true });
    }

    // 2. Logic Xóa có hẹn giờ
    if (action === "schedule-delete") {
      const deleteDate = new Date();
      deleteDate.setDate(deleteDate.getDate() + (days || 30));

      await db.collection("listings").updateOne(
        { _id: new ObjectId(targetId) },
        { 
          $set: { 
            status: "hide", 
            scheduledDelete: deleteDate 
          } 
        }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}