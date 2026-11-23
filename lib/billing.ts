/* Tính hóa đơn tiền nhà — dùng chung cho API, trang in và trang khách xem.
 * Không import mongoose ở đây để client component cũng dùng được. */

/* ─── Tháng ──────────────────────────────────────────────────────────────── */

/** "2026-12" */
export type MonthKey = string;

export function monthKey(year: number, month1to12: number): MonthKey {
  return `${year}-${String(month1to12).padStart(2, "0")}`;
}

export function isMonthKey(s: unknown): s is MonthKey {
  return typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return monthKey(Math.floor(idx / 12), (idx % 12) + 1);
}

/** "12/2026" */
export function monthLabel(key: MonthKey): string {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

/** Tháng của hóa đơn sẽ lập. Chốt điện từ ngày 15 trở đi → hóa đơn tháng sau
 *  (chốt 23–25/11 → hóa đơn tháng 12, tiền điện là của tháng 11). */
export function defaultBillMonth(now = new Date()): MonthKey {
  const vn = new Date(now.getTime() + 7 * 3600_000); // giờ Việt Nam
  const key = monthKey(vn.getUTCFullYear(), vn.getUTCMonth() + 1);
  return vn.getUTCDate() >= 15 ? addMonths(key, 1) : key;
}

/* ─── Số tiền ────────────────────────────────────────────────────────────── */

/** 4800000 → "4,800,000" (giống phiếu Excel) */
export function money(n: number): string {
  return Math.round(n || 0).toLocaleString("en-US");
}

/** Lấy số từ chuỗi kiểu "4,800,000 ₫" / "4.800.000" / "13803". */
export function parseNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const digits = v.replace(/[^\d-]/g, "");
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

/* ─── Tính hóa đơn ───────────────────────────────────────────────────────── */

export type BillInput = {
  rent: number;           // tiền phòng
  electricPrice: number;  // đ/kWh
  oldMeter: number;
  newMeter: number;
  waterPrice: number;     // đ/người, hoặc đ/m³ nếu phòng có đồng hồ nước
  people: number;
  waterMeter?: boolean;   // true = tính nước theo đồng hồ (m³)
  waterOld?: number;
  waterNew?: number;
  serviceFee: number;     // phí quản lý / dịch vụ (đ/phòng)
  parkingPrice: number;   // đ/xe
  vehicles: number;
  otherAmount: number;    // khác (có thể âm = giảm trừ)
  otherNote: string;
};

export type BillLine = { label: string; price: number | null; qty: number | null; amount: number };

export function electricUsage(oldMeter: number, newMeter: number): number {
  return Math.max(0, (newMeter || 0) - (oldMeter || 0));
}

export function billLines(b: BillInput): BillLine[] {
  const kwh = electricUsage(b.oldMeter, b.newMeter);
  const water = b.waterMeter ? electricUsage(b.waterOld ?? 0, b.waterNew ?? 0) : b.people;
  return [
    { label: "Tiền phòng", price: b.rent, qty: 1, amount: b.rent },
    { label: "Điện", price: b.electricPrice, qty: kwh, amount: kwh * b.electricPrice },
    { label: b.waterMeter ? "Nước (m³)" : "Nước", price: b.waterPrice, qty: water, amount: b.waterPrice * water },
    { label: "Phí quản lý", price: b.serviceFee, qty: 1, amount: b.serviceFee },
    { label: "Chỗ để xe", price: b.parkingPrice, qty: b.vehicles, amount: b.parkingPrice * b.vehicles },
    {
      label: b.otherNote ? `Khác: ${b.otherNote}` : "Khác:",
      price: null,
      qty: null,
      amount: b.otherAmount || 0,
    },
  ];
}

export function billTotal(b: BillInput): number {
  return billLines(b).reduce((s, l) => s + l.amount, 0);
}

/* ─── Ngân hàng & VietQR ─────────────────────────────────────────────────── */

export const BANKS: { bin: string; name: string }[] = [
  { bin: "970436", name: "Vietcombank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970405", name: "Agribank" },
  { bin: "970422", name: "MB Bank" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970441", name: "VIB" },
  { bin: "970443", name: "SHB" },
  { bin: "970437", name: "HDBank" },
  { bin: "970448", name: "OCB" },
  { bin: "970426", name: "MSB" },
];

export function bankName(bin: string): string {
  return BANKS.find((b) => b.bin === bin)?.name ?? "";
}

function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

function crc16(s: string): string {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Bỏ dấu tiếng Việt, chỉ giữ ký tự an toàn cho nội dung chuyển khoản. */
export function asciiNote(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

/** Chuỗi VietQR (chuẩn EMVCo/NAPAS) — app ngân hàng quét ra sẵn số tiền + nội dung. */
export function vietQrPayload(opts: { bin: string; account: string; amount?: number; note?: string }): string {
  const account = opts.account.replace(/\s/g, "");
  const merchant =
    tlv("00", "A000000727") +
    tlv("01", tlv("00", opts.bin) + tlv("01", account)) +
    tlv("02", "QRIBFTTA");
  const amount = Math.round(opts.amount || 0);
  const note = opts.note ? asciiNote(opts.note) : "";
  let s =
    tlv("00", "01") +
    tlv("01", amount > 0 ? "12" : "11") +
    tlv("38", merchant) +
    tlv("53", "704") +
    (amount > 0 ? tlv("54", String(amount)) : "") +
    tlv("58", "VN") +
    (note ? tlv("62", tlv("08", note)) : "");
  s += "6304";
  return s + crc16(s);
}

/* ─── Nhà (cơ sở) — mỗi nhà có địa chỉ + tài khoản nhận tiền riêng ──────── */

export type BillingSettings = {
  address: string;       // ĐỊA CHỈ CĂN HỘ
  dueDay: number;        // thanh toán trước ngày
  bankBin: string;
  bankAccount: string;
  accountName: string;
  transferNote: string;  // dòng hướng dẫn nội dung chuyển khoản
  city: string;          // "Tp.Hồ Chí Minh"
};

export const DEFAULT_SETTINGS: BillingSettings = {
  address: "",
  dueDay: 5,
  bankBin: "970436",
  bankAccount: "",
  accountName: "",
  transferNote: "Ghi nội dung chuyển tiền: Tên phòng. (Vui lòng chụp lại hình)",
  city: "Tp.Hồ Chí Minh",
};

export type Building = BillingSettings & {
  _id?: string;
  code: string;   // mã ngắn: "NTL", "XVNT"
  name: string;   // tên hiển thị: "Nơ Trang Long"
  order: number;
};

export const BUILDING_FIELDS = ["code", "name", "order", ...(Object.keys(DEFAULT_SETTINGS) as (keyof BillingSettings)[])] as const;

/** Nội dung chuyển khoản ghi trong mã QR. */
export function qrNote(buildingCode: string, roomCode: string, month: MonthKey): string {
  return `${buildingCode} ${roomCode} T${monthLabel(month).replace("/", " ")}`;
}
