import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Building from "@/models/building";
import Room from "@/models/room";
import Bill from "@/models/bill";
import { guard, cleanBuilding } from "../../_shared";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Sai mã nhà" }, { status: 400 });
  try {
    const data = cleanBuilding(await req.json());
    await connectDB();
    const before: any = await Building.findById(id).lean();
    if (!before) return NextResponse.json({ error: "Không tìm thấy nhà" }, { status: 404 });
    if (data.code && data.code !== before.code) {
      if (await Building.exists({ code: data.code }))
        return NextResponse.json({ error: `Mã nhà ${data.code} đã có` }, { status: 400 });
      // Đổi mã nhà → cập nhật phòng + hóa đơn đang dùng mã cũ
      await Room.updateMany({ building: before.code }, { $set: { building: data.code } });
      await Bill.updateMany({ building: before.code }, { $set: { building: data.code } });
    }
    return NextResponse.json(await Building.findByIdAndUpdate(id, { $set: data }, { returnDocument: "after" }));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Sai mã nhà" }, { status: 400 });
  await connectDB();
  const b: any = await Building.findById(id).lean();
  if (!b) return NextResponse.json({ ok: true });
  if (await Room.exists({ building: b.code }))
    return NextResponse.json({ error: "Nhà còn phòng — xóa hết phòng trước" }, { status: 400 });
  await Building.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
