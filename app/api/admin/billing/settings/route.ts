import { NextResponse } from "next/server";
import { getBillingSettings, saveBillingSettings } from "@/lib/billing-server";
import { guard } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json(await getBillingSettings());
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    return NextResponse.json(await saveBillingSettings(await req.json()));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
