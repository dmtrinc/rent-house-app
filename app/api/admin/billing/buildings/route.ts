import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Building from "@/models/building";
import { guard, cleanBuilding } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  await connectDB();
  return NextResponse.json(await Building.find().sort({ order: 1, code: 1 }).lean());
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const data = cleanBuilding(await req.json());
    if (!data.code) return NextResponse.json({ error: "Thiếu mã nhà" }, { status: 400 });
    await connectDB();
    if (await Building.exists({ code: data.code }))
      return NextResponse.json({ error: `Mã nhà ${data.code} đã có` }, { status: 400 });
    if (data.order === undefined) data.order = (await Building.countDocuments()) + 1;
    return NextResponse.json(await Building.create(data));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
