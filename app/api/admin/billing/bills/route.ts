import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import connectDB from "@/lib/mongodb";
import Room from "@/models/room";
import Bill from "@/models/bill";
import { billTotal, isMonthKey, parseNumber, type BillInput } from "@/lib/billing";
import { guard } from "../_shared";

export const dynamic = "force-dynamic";

/** Chỉ số điện cũ của từng phòng cho hóa đơn tháng `month`:
 *  = số mới của hóa đơn gần nhất trước tháng đó, nếu chưa có thì lấy chỉ số gốc của phòng. */
async function previousMeters(month: string): Promise<Map<string, number>> {
  const rows = await Bill.aggregate([
    { $match: { month: { $lt: month } } },
    { $sort: { month: -1 } },
    { $group: { _id: "$roomId", newMeter: { $first: "$newMeter" } } },
  ]);
  return new Map(rows.map((r: any) => [String(r._id), r.newMeter as number]));
}

/** GET ?month=2026-12 → các phòng + hóa đơn (nếu đã lập) + chỉ số cũ gợi ý. */
export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const month = new URL(req.url).searchParams.get("month");
  if (!isMonthKey(month)) return NextResponse.json({ error: "Sai tháng" }, { status: 400 });

  await connectDB();
  const [rooms, bills, prev] = await Promise.all([
    Room.find().sort({ order: 1, code: 1 }).lean(),
    Bill.find({ month }).lean(),
    previousMeters(month),
  ]);
  const billByRoom = new Map(bills.map((b: any) => [b.roomId, b]));
  const rows = rooms
    .filter((r: any) => r.active || billByRoom.has(String(r._id)))
    .map((r: any) => ({
      room: r,
      bill: billByRoom.get(String(r._id)) ?? null,
      prevMeter: prev.get(String(r._id)) ?? r.meterStart ?? 0,
    }));
  return NextResponse.json({ month, rows });
}

/** POST { month, readingDate, entries: [{ roomId, oldMeter, newMeter, otherAmount, otherNote }] }
 *  Lập (hoặc lập lại) hóa đơn. Giá lấy theo thông tin phòng hiện tại; giữ nguyên số đã thu + link khách. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { month, readingDate, entries } = await req.json();
    if (!isMonthKey(month)) return NextResponse.json({ error: "Sai tháng" }, { status: 400 });
    if (!Array.isArray(entries) || !entries.length)
      return NextResponse.json({ error: "Chưa nhập số điện phòng nào" }, { status: 400 });

    await connectDB();
    const rooms = await Room.find({ _id: { $in: entries.map((e: any) => e.roomId) } }).lean();
    const roomById = new Map(rooms.map((r: any) => [String(r._id), r]));
    const date = readingDate ? new Date(readingDate) : new Date();

    const errors: string[] = [];
    let saved = 0;
    for (const e of entries) {
      const room: any = roomById.get(String(e.roomId));
      if (!room) continue;
      const oldMeter = parseNumber(e.oldMeter);
      const newMeter = parseNumber(e.newMeter);
      if (newMeter < oldMeter) {
        errors.push(`Phòng ${room.code}: số mới (${newMeter}) nhỏ hơn số cũ (${oldMeter})`);
        continue;
      }
      const input: BillInput = {
        rent: room.rent,
        electricPrice: room.electricPrice,
        oldMeter,
        newMeter,
        waterPrice: room.waterPrice,
        people: room.people,
        serviceFee: room.serviceFee,
        parkingPrice: room.parkingPrice,
        vehicles: room.vehicles,
        otherAmount: parseNumber(e.otherAmount),
        otherNote: String(e.otherNote ?? "").trim(),
      };
      await Bill.updateOne(
        { month, roomId: String(room._id) },
        {
          $set: {
            ...input,
            roomCode: room.code,
            total: billTotal(input),
            readingDate: isNaN(date.getTime()) ? new Date() : date,
          },
          $setOnInsert: { token: randomBytes(12).toString("base64url") },
        },
        { upsert: true }
      );
      saved++;
    }
    return NextResponse.json({ saved, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
