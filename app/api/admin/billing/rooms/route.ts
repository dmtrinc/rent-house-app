import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/room";
import { guard, cleanRoom } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  await connectDB();
  const rooms = await Room.find().sort({ order: 1, code: 1 }).lean();
  return NextResponse.json(rooms);
}

/** Tạo 1 phòng ({...room}) hoặc nhập nhiều phòng ({ rooms: [...] }, cập nhật theo mã phòng). */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = await req.json();
    await connectDB();

    if (Array.isArray(body.rooms)) {
      let created = 0, updated = 0;
      for (let i = 0; i < body.rooms.length; i++) {
        const data = cleanRoom(body.rooms[i]);
        if (!data.code) continue;
        if (data.order === undefined) data.order = i + 1;
        const res = await Room.updateOne({ code: data.code }, { $set: data }, { upsert: true });
        if (res.upsertedCount) created++;
        else updated++;
      }
      return NextResponse.json({ created, updated });
    }

    const data = cleanRoom(body);
    if (!data.code) return NextResponse.json({ error: "Thiếu số phòng" }, { status: 400 });
    if (await Room.exists({ code: data.code }))
      return NextResponse.json({ error: `Phòng ${data.code} đã có` }, { status: 400 });
    if (data.order === undefined) data.order = (await Room.countDocuments()) + 1;
    const room = await Room.create(data);
    return NextResponse.json(room);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
