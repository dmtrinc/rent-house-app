import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Bill from "@/models/bill";
import { parseNumber } from "@/lib/billing";
import { guard } from "../../_shared";

type Ctx = { params: Promise<{ id: string }> };

/** Ghi nhận thu tiền: { paidAmount } hoặc { paid: true } (= thu đủ) / { paid: false }. */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Sai mã hóa đơn" }, { status: 400 });
  try {
    const body = await req.json();
    await connectDB();
    const bill: any = await Bill.findById(id);
    if (!bill) return NextResponse.json({ error: "Không tìm thấy hóa đơn" }, { status: 404 });

    let paidAmount: number | undefined;
    if (body.paid === true) paidAmount = bill.total;
    else if (body.paid === false) paidAmount = 0;
    else if (body.paidAmount !== undefined) paidAmount = Math.max(0, parseNumber(body.paidAmount));
    if (paidAmount === undefined) return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });

    bill.paidAmount = paidAmount;
    bill.paidAt = paidAmount > 0 ? bill.paidAt ?? new Date() : null;
    await bill.save();
    return NextResponse.json(bill);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Sai mã hóa đơn" }, { status: 400 });
  await connectDB();
  await Bill.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
