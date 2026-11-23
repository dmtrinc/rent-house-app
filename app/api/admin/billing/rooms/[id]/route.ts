import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Room from "@/models/room";
import Bill from "@/models/bill";
import { guard, cleanRoom } from "../../_shared";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Sai mã phòng" }, { status: 400 });
  try {
    const data = cleanRoom(await req.json());
    await connectDB();
    if (data.code && (await Room.exists({ code: data.code, _id: { $ne: id } })))
      return NextResponse.json({ error: `Phòng ${data.code} đã có` }, { status: 400 });
    const room = await Room.findByIdAndUpdate(id, { $set: data }, { returnDocument: "after" });
    if (!room) return NextResponse.json({ error: "Không tìm thấy phòng" }, { status: 404 });
    if (data.code) await Bill.updateMany({ roomId: id }, { $set: { roomCode: data.code } });
    return NextResponse.json(room);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** Xóa phòng. Phòng đã có hóa đơn thì không xóa (chỉ cho chuyển sang "trống"). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Sai mã phòng" }, { status: 400 });
  await connectDB();
  if (await Bill.exists({ roomId: id }))
    return NextResponse.json(
      { error: "Phòng đã có hóa đơn — hãy đánh dấu phòng trống thay vì xóa" },
      { status: 400 }
    );
  await Room.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
