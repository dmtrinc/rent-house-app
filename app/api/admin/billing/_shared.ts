import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/billing-server";
import { parseNumber } from "@/lib/billing";

export function forbidden() {
  return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
}

export async function guard(): Promise<NextResponse | null> {
  return (await isAdmin()) ? null : forbidden();
}

const NUM_FIELDS = [
  "people", "vehicles", "rent", "deposit", "electricPrice",
  "waterPrice", "parkingPrice", "serviceFee", "meterStart", "order",
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
  for (const k of ["tenantName", "phone", "note"] as const) {
    if (body[k] !== undefined) out[k] = String(body[k] ?? "").trim();
  }
  for (const k of NUM_FIELDS) {
    if (body[k] !== undefined) out[k] = parseNumber(body[k]);
  }
  if (body.contractStart !== undefined) out.contractStart = toDate(body.contractStart);
  if (body.contractEnd !== undefined) out.contractEnd = toDate(body.contractEnd);
  if (body.active !== undefined) out.active = Boolean(body.active);
  return out;
}
