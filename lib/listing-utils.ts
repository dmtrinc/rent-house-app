/* Hàm thuần dùng chung cho cả server và client (KHÔNG import mongoose ở đây,
 * vì file này được bundle vào client). Logic truy vấn DB nằm ở lib/listings.ts. */

export interface ListingDoc {
  _id: string;
  title: string;
  address: string;
  price: number;
  description?: string;
  coverImage?: string;
  images?: string[];
  status?: "active" | "hide" | string;
  category?: string;
  amenities?: string[];
  furniture?: unknown[];
  contactPhone?: string;
  deviceId?: string | null;
  userId?: string | null;
  availableDate?: string | null;
  highlights?: string[];
  autoHideDays?: number | null;
  autoDeleteDays?: number | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const VN_TZ = "Asia/Ho_Chi_Minh";

/** Định dạng giá kiểu Việt Nam: 4500000 → "4.500.000".
 * Ép locale cố định để HTML server và client giống nhau (tránh lỗi hydration). */
export function formatPrice(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString("vi-VN");
}

/** Định dạng ngày dd/mm/yyyy theo giờ Việt Nam, bất kể timezone máy chạy. */
export function formatDateVN(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: VN_TZ,
  });
}

/** Số ngày từ hôm nay tới ngày trống (âm = đã qua). null nếu không có ngày. */
export function daysUntilAvailable(availableDate: string | Date | null | undefined): number | null {
  if (!availableDate) return null;
  const avail = availableDate instanceof Date ? availableDate : new Date(availableDate);
  if (isNaN(avail.getTime())) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((avail.getTime() - now.getTime()) / 86400000);
}

/** Nhãn tình trạng phòng dùng cho mô tả SEO: "Dọn vào ngay" / "Trống từ dd/mm/yyyy". */
export function availabilityLabel(availableDate: string | Date | null | undefined): string {
  const diff = daysUntilAvailable(availableDate);
  if (diff === null || diff < 2) return "Dọn vào ngay";
  return `Trống từ ${formatDateVN(availableDate)}`;
}

/** Sắp xếp trang chủ: tin rẻ nhất lên đầu, tin mới nhất thứ hai, còn lại theo mới → cũ. */
export function sortItems<T extends { price: number; updatedAt?: string; createdAt?: string }>(arr: T[]): T[] {
  if (!arr.length) return arr;
  const ts = (i: T) => new Date(i.updatedAt || i.createdAt || 0).getTime();
  const rest = [...arr];
  const cheapestIdx = rest.reduce((min, item, idx) => item.price < rest[min].price ? idx : min, 0);
  const [cheapest] = rest.splice(cheapestIdx, 1);
  const newestIdx = rest.reduce((max, item, idx) => ts(item) > ts(rest[max]) ? idx : max, 0);
  const [second] = rest.splice(newestIdx, 1);
  rest.sort((a, b) => ts(b) - ts(a));
  return [cheapest, second, ...rest].filter(Boolean);
}
