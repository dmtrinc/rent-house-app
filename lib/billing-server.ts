import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import QRCode from "qrcode";
import connectDB from "./mongodb";
import { DEFAULT_SETTINGS, vietQrPayload, type BillingSettings } from "./billing";

/** Kiểm tra quyền admin bằng DB (không tin riêng cookie user_role). */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const userId = store.get("user_id")?.value;
  if (!userId || !ObjectId.isValid(userId)) return false;
  const conn = await connectDB();
  const user = await conn.connection.db
    ?.collection("users")
    .findOne({ _id: new ObjectId(userId) }, { projection: { role: 1 } });
  return user?.role === "admin";
}

const SETTINGS_ID = "billing";

export async function getBillingSettings(): Promise<BillingSettings> {
  const conn = await connectDB();
  const doc = await conn.connection.db?.collection("system_config").findOne({ _id: SETTINGS_ID as any });
  const out = { ...DEFAULT_SETTINGS };
  if (doc) {
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof BillingSettings)[]) {
      if (doc[k] !== undefined && doc[k] !== null) (out as any)[k] = doc[k];
    }
  }
  return out;
}

export async function saveBillingSettings(input: Partial<BillingSettings>): Promise<BillingSettings> {
  const clean: Partial<BillingSettings> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof BillingSettings)[]) {
    if (input[k] === undefined) continue;
    (clean as any)[k] = k === "dueDay" ? Math.min(28, Math.max(1, Number(input[k]) || 5)) : String(input[k]).trim();
  }
  const conn = await connectDB();
  await conn.connection.db
    ?.collection("system_config")
    .updateOne({ _id: SETTINGS_ID as any }, { $set: { ...clean, updatedAt: new Date() } }, { upsert: true });
  return getBillingSettings();
}

/** Mã QR chuyển khoản dạng SVG (đã điền sẵn số tiền + nội dung). null nếu chưa cài STK. */
export async function billQrSvg(s: BillingSettings, amount: number, note: string): Promise<string | null> {
  if (!s.bankBin || !s.bankAccount) return null;
  return QRCode.toString(vietQrPayload({ bin: s.bankBin, account: s.bankAccount, amount, note }), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
}
