import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import connectDB from "@/lib/mongodb";
import Room from "@/models/room";
import Bill from "@/models/bill";
import Building from "@/models/building";
import { billTotal, isMonthKey, parseNumber, type BillInput } from "@/lib/billing";
import { guard } from "../_shared";

export const dynamic = "force-dynamic";

/** Chỉ số cũ (điện + nước) của từng phòng cho hóa đơn tháng `month`:
 *  = số mới của hóa đơn gần nhất trước tháng đó; chưa có thì lấy chỉ số gốc của phòng. */
async function previousMeters(month: string, roomIds: string[]) {
  const rows = await Bill.aggregate([
    { $match: { month: { $lt: month }, roomId: { $in: roomIds } } },
    { $sort: { month: -1 } },
    { $group: { _id: "$roomId", newMeter: { $first: "$newMeter" }, waterNew: { $first: "$waterNew" }, waterMeter: { $first: "$waterMeter" } } },
  ]);
  return new Map(rows.map((r: any) => [String(r._id), r]));
}

/** GET ?month=2026-12&building=NTL → các phòng + hóa đơn (nếu đã lập) + chỉ số cũ gợi ý.
 *  building=* → tất cả nhà (xếp theo thứ tự nhà rồi thứ tự phòng). */
export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const sp = new URL(req.url).searchParams;
  const month = sp.get("month");
  const building = sp.get("building");
  if (!isMonthKey(month)) return NextResponse.json({ error: "Sai tháng" }, { status: 400 });
  if (!building) return NextResponse.json({ error: "Chưa chọn nhà" }, { status: 400 });

  await connectDB();
  const all = building === "*";
  const [rooms, bills, buildings] = await Promise.all([
    Room.find(all ? {} : { building }).sort({ order: 1, code: 1 }).lean(),
    Bill.find(all ? { month } : { month, building }).lean(),
    all ? Building.find({}, { code: 1, order: 1 }).lean() : Promise.resolve([]),
  ]);
  if (all) {
    const bOrder = new Map(buildings.map((b: any) => [b.code, b.order ?? 0]));
    rooms.sort((a: any, b: any) => (bOrder.get(a.building) ?? 99) - (bOrder.get(b.building) ?? 99));
  }
  const prev = await previousMeters(month, rooms.map((r: any) => String(r._id)));
  const billByRoom = new Map(bills.map((b: any) => [b.roomId, b]));
  const rows = rooms
    .filter((r: any) => r.active || billByRoom.has(String(r._id)))
    .map((r: any) => {
      const p: any = prev.get(String(r._id));
      return {
        room: r,
        bill: billByRoom.get(String(r._id)) ?? null,
        prevMeter: p?.newMeter ?? r.meterStart ?? 0,
        prevWater: p?.waterMeter ? p.waterNew : r.waterMeterStart ?? 0,
      };
    });
  return NextResponse.json({ month, rows });
}

/** POST { month, readingDate, entries: [{ roomId, oldMeter, newMeter, waterOld, waterNew, otherAmount, otherNote }] }
 *  → { saved, errors, bills } (bills = các hóa đơn vừa lưu).
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
    const ops: any[] = [];
    const savedIds: string[] = [];
    for (const e of entries) {
      const room: any = roomById.get(String(e.roomId));
      if (!room) continue;
      const oldMeter = parseNumber(e.oldMeter);
      const newMeter = parseNumber(e.newMeter);
      const waterOld = parseNumber(e.waterOld);
      const waterNew = parseNumber(e.waterNew);
      if (newMeter < oldMeter) {
        errors.push(`Phòng ${room.code}: số điện mới (${newMeter}) nhỏ hơn số cũ (${oldMeter})`);
        continue;
      }
      if (room.waterMeter && waterNew < waterOld) {
        errors.push(`Phòng ${room.code}: số nước mới (${waterNew}) nhỏ hơn số cũ (${waterOld})`);
        continue;
      }
      const input: BillInput = {
        rent: room.rent,
        electricPrice: room.electricPrice,
        oldMeter,
        newMeter,
        waterPrice: room.waterPrice,
        people: room.people,
        waterMeter: !!room.waterMeter,
        waterOld: room.waterMeter ? waterOld : 0,
        waterNew: room.waterMeter ? waterNew : 0,
        serviceFee: room.serviceFee,
        parkingPrice: room.parkingPrice,
        vehicles: room.vehicles,
        otherAmount: parseNumber(e.otherAmount),
        otherNote: String(e.otherNote ?? "").trim(),
      };
      ops.push({
        updateOne: {
          filter: { month, roomId: String(room._id) },
          update: {
            $set: {
              ...input,
              roomCode: room.code,
              building: room.building,
              total: billTotal(input),
              readingDate: isNaN(date.getTime()) ? new Date() : date,
            },
            $setOnInsert: { token: randomBytes(12).toString("base64url") },
          },
          upsert: true,
        },
      });
      savedIds.push(String(room._id));
    }
    // Ghi 1 lần cho cả nhà (thay vì từng phòng) rồi trả lại hóa đơn để trình duyệt cập nhật tại chỗ
    if (ops.length) await Bill.bulkWrite(ops, { ordered: false });
    const bills = ops.length ? await Bill.find({ month, roomId: { $in: savedIds } }).lean() : [];
    return NextResponse.json({ saved: savedIds.length, errors, bills });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
