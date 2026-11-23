import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import QRCode from "qrcode";
import connectDB from "./mongodb";
import BuildingModel from "../models/building";
import { DEFAULT_SETTINGS, vietQrPayload, type BillingSettings, type Building } from "./billing";

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

/** Thông tin in phiếu của 1 nhà (địa chỉ, tài khoản...). Không có thì dùng mặc định trống. */
export async function getBuildingSettings(code: string): Promise<BillingSettings & Partial<Building>> {
  await connectDB();
  const b = await BuildingModel.findOne({ code }).lean<Building>();
  return { ...DEFAULT_SETTINGS, ...(b ?? {}) };
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
