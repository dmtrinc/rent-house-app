/* Logic thuần của tab Chốt điện (không có React) — dễ đọc, dễ sửa, dễ test. */
import { billTotal, electricUsage, money, parseNumber } from "../../../../lib/billing";
import type { MonthRow } from "../ui";

/** Giá trị đang gõ trong 1 dòng (giữ dạng chuỗi để gõ dở "1,2" không bị nhảy). */
export type Entry = {
  oldMeter: string;
  newMeter: string;
  waterOld: string;
  waterNew: string;
  otherAmount: string;
  otherNote: string;
};
export type Field = keyof Entry;

/** Các dòng người dùng đã sửa (roomId → Entry). Dòng chưa sửa lấy theo dữ liệu máy chủ. */
export type Edits = Record<string, Entry>;

/** Giá trị ban đầu của 1 dòng: đã lập hóa đơn → số đã lập; chưa → số cũ = số mới tháng trước. */
export function entryFromRow(r: MonthRow): Entry {
  const b = r.bill;
  if (!b) {
    return { oldMeter: String(r.prevMeter ?? 0), newMeter: "", waterOld: String(r.prevWater ?? 0), waterNew: "", otherAmount: "", otherNote: "" };
  }
  return {
    oldMeter: String(b.oldMeter),
    newMeter: String(b.newMeter),
    waterOld: String(b.waterMeter ? b.waterOld : r.prevWater ?? 0),
    waterNew: b.waterMeter ? String(b.waterNew) : "",
    otherAmount: b.otherAmount ? money(b.otherAmount) : "",
    otherNote: b.otherNote,
  };
}

export type RowStatus = "saved" | "edited" | "new" | "empty";

export type Computed = {
  wm: boolean;          // phòng có đồng hồ nước
  filled: boolean;      // đã nhập đủ số mới
  bad: boolean;         // số mới < số cũ
  badE: boolean;
  badW: boolean;
  kwh: number;
  m3: number;
  total: number;
  changed: boolean;     // khác hóa đơn đã lập → cần lưu
  status: RowStatus;
  payload: {
    roomId: string;
    oldMeter: number;
    newMeter: number;
    waterOld: number;
    waterNew: number;
    otherAmount: number;
    otherNote: string;
  };
};

/** Tính tiền + trạng thái của 1 dòng. */
export function computeRow(r: MonthRow, e: Entry): Computed {
  const wm = !!r.room.waterMeter;
  const hasE = e.newMeter.trim() !== "";
  const hasW = e.waterNew.trim() !== "";
  const filled = hasE && (!wm || hasW);
  const payload = {
    roomId: r.room._id,
    oldMeter: parseNumber(e.oldMeter),
    newMeter: parseNumber(e.newMeter),
    waterOld: wm ? parseNumber(e.waterOld) : 0,
    waterNew: wm ? parseNumber(e.waterNew) : 0,
    otherAmount: parseNumber(e.otherAmount),
    otherNote: e.otherNote.trim(),
  };
  const total = billTotal({ ...r.room, ...payload });
  const badE = hasE && payload.newMeter < payload.oldMeter;
  const badW = wm && hasW && payload.waterNew < payload.waterOld;
  const bad = badE || badW;
  const b = r.bill;
  const changed =
    !b ||
    b.total !== total || // giá phòng đã sửa sau khi lập
    b.oldMeter !== payload.oldMeter ||
    b.newMeter !== payload.newMeter ||
    (wm && (b.waterOld !== payload.waterOld || b.waterNew !== payload.waterNew)) ||
    (b.otherAmount || 0) !== payload.otherAmount ||
    (b.otherNote || "") !== payload.otherNote;
  const status: RowStatus = b && !changed ? "saved" : b ? "edited" : filled && !bad ? "new" : "empty";
  return {
    wm, filled, bad, badE, badW, changed, status, total, payload,
    kwh: electricUsage(payload.oldMeter, payload.newMeter),
    m3: electricUsage(payload.waterOld, payload.waterNew),
  };
}

/** Dòng hợp lệ và khác hóa đơn đã lập → sẽ gửi lên khi bấm Lưu. */
export const shouldSave = (c: Computed) => c.filled && !c.bad && c.changed;

/* ─── Nháp: tự lưu số đang nhập trên máy này (F5 / đổi tab / đổi nhà không mất) ─── */

export type Draft = { edits: Edits; readingDate: string | null };

const draftKey = (building: string, month: string) => `hoa-don:nhap:${building}:${month}`;

export function loadDraft(building: string, month: string): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(building, month));
    const d = raw ? (JSON.parse(raw) as Draft) : null;
    return d && typeof d.edits === "object" ? d : null;
  } catch {
    return null;
  }
}

export function saveDraft(building: string, month: string, d: Draft) {
  try {
    const key = draftKey(building, month);
    if (!Object.keys(d.edits).length && !d.readingDate) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(d));
  } catch {
    /* hết bộ nhớ / chế độ ẩn danh: bỏ qua, chỉ mất tính năng nháp */
  }
}
