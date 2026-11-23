import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/billing-server";
import { DEFAULT_SETTINGS, parseNumber } from "@/lib/billing";

export function forbidden() {
  return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
}

export async function guard(): Promise<NextResponse | null> {
  return (await isAdmin()) ? null : forbidden();
}

const NUM_FIELDS = [
  "people", "vehicles", "rent", "deposit", "electricPrice", "waterPrice",
  "parkingPrice", "serviceFee", "meterStart", "waterMeterStart", "order",
] as const;

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

/** Lọc dữ liệu phòng gửi lên — chỉ nhận các trường hợp lệ. */
export function cleanRoom(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body.code !== undefined) out.code = String(body.code).trim();
  if (body.building !== undefined) out.building = String(body.building).trim();
  for (const k of ["tenantName", "phone", "note"] as const) {
    if (body[k] !== undefined) out[k] = String(body[k] ?? "").trim();
  }
  for (const k of NUM_FIELDS) {
    if (body[k] !== undefined) out[k] = parseNumber(body[k]);
  }
  if (body.contractStart !== undefined) out.contractStart = toDate(body.contractStart);
  if (body.contractEnd !== undefined) out.contractEnd = toDate(body.contractEnd);
  if (body.active !== undefined) out.active = Boolean(body.active);
  if (body.waterMeter !== undefined) out.waterMeter = Boolean(body.waterMeter);
  return out;
}

/** Lọc dữ liệu nhà gửi lên. */
export function cleanBuilding(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body.code !== undefined) out.code = String(body.code).trim().toUpperCase();
  if (body.name !== undefined) out.name = String(body.name).trim();
  if (body.order !== undefined) out.order = parseNumber(body.order);
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]) {
    if (body[k] === undefined) continue;
    out[k] = k === "dueDay" ? Math.min(28, Math.max(1, parseNumber(body[k]) || 5)) : String(body[k] ?? "").trim();
  }
  return out;
}
