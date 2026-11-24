"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { api, type Bill, type MonthRow } from "./ui";

/* Bộ nhớ đệm dữ liệu tháng (phòng + hóa đơn) theo từng nhà, dùng chung cho mọi tab.
 * - Chuyển nhà / tháng: hiện ngay dữ liệu đã có, tải lại ngầm (stale-while-revalidate).
 * - Lưu hóa đơn / thu tiền: vá thẳng vào bộ đệm bằng kết quả API, không tải lại cả tháng.
 * - Kết quả tải về muộn (đã có dữ liệu mới hơn) bị bỏ qua → không bị nhảy dữ liệu cũ. */

type Snap = { rows: MonthRow[] | null; loading: boolean; error: string; fetchedAt: number };

const EMPTY: Snap = { rows: null, loading: false, error: "", fetchedAt: 0 };
const NO_ROWS: MonthRow[] = [];
const FRESH_MS = 30_000; // trong 30s coi như mới, không tải lại khi quay lại nhà/tháng đó

const snaps = new Map<string, Snap>();
const versions = new Map<string, number>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

const keyOf = (building: string, month: string) => `${building}|${month}`;

function setSnap(key: string, patch: Partial<Snap>) {
  snaps.set(key, { ...(snaps.get(key) ?? EMPTY), ...patch });
  listeners.forEach((l) => l());
}

function bump(key: string): number {
  const v = (versions.get(key) ?? 0) + 1;
  versions.set(key, v);
  return v;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** Tải dữ liệu tháng của 1 nhà (building="*" = tất cả nhà). Bỏ qua nếu vừa tải xong, trừ khi force. */
export function fetchMonth(building: string, month: string, force = false): Promise<void> {
  const key = keyOf(building, month);
  const cur = snaps.get(key);
  const running = inflight.get(key);
  if (!force && running) return running;
  if (!force && cur?.rows && Date.now() - cur.fetchedAt < FRESH_MS) return Promise.resolve();

  const ver = bump(key);
  setSnap(key, { loading: true, error: "" });
  const p: Promise<void> = api<{ rows: MonthRow[] }>(
    `/api/admin/billing/bills?month=${month}&building=${encodeURIComponent(building)}`
  )
    .then(
      (d) => { if (versions.get(key) === ver) setSnap(key, { rows: d.rows, fetchedAt: Date.now() }); },
      (e: Error) => { if (versions.get(key) === ver) setSnap(key, { error: e.message }); }
    )
    .finally(() => {
      if (inflight.get(key) !== p) return;
      inflight.delete(key);
      setSnap(key, { loading: false });
    });
  inflight.set(key, p);
  return p;
}

/** Tải trước lúc trình duyệt rảnh (không tranh tài nguyên với thao tác của người dùng). */
export function prefetch(jobs: [building: string, month: string][]): () => void {
  const run = () => jobs.forEach(([b, m]) => { if (b) fetchMonth(b, m).catch(() => {}); });
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const t = setTimeout(run, 500);
  return () => clearTimeout(t);
}

/** Sửa dữ liệu trong bộ đệm (kết quả GET đang chạy sẽ bị bỏ để không ghi đè). */
export function updateMonth(building: string, month: string, fn: (rows: MonthRow[]) => MonthRow[]) {
  const key = keyOf(building, month);
  const cur = snaps.get(key);
  if (!cur?.rows) return;
  bump(key);
  setSnap(key, { rows: fn(cur.rows) });
}

/** Ghép hóa đơn vừa lưu / vừa thu tiền vào dữ liệu tháng. */
export function applyBills(building: string, month: string, bills: Bill[]) {
  if (!bills.length) return;
  const byRoom = new Map(bills.map((b) => [b.roomId, b]));
  updateMonth(building, month, (rows) =>
    rows.map((r) => (byRoom.has(r.room._id) ? { ...r, bill: byRoom.get(r.room._id)! } : r))
  );
}

export function removeBill(building: string, month: string, billId: string) {
  updateMonth(building, month, (rows) => rows.map((r) => (r.bill?._id === billId ? { ...r, bill: null } : r)));
}

/** Đánh dấu dữ liệu đã cũ → lần mở sau tải lại (vẫn hiện dữ liệu cũ trong lúc chờ). */
export function invalidate(match: (building: string, month: string) => boolean = () => true) {
  for (const [key, s] of snaps) {
    const [b, m] = key.split("|");
    if (match(b, m)) snaps.set(key, { ...s, fetchedAt: 0 });
  }
}

/** Số cũ của tháng sau = số mới tháng này → lưu / xóa hóa đơn tháng này làm cũ các tháng sau. */
export function invalidateAfter(building: string, month: string) {
  invalidate((b, m) => (b === building || b === "*") && m > month);
}

export function useMonthRows(building: string, month: string) {
  const key = keyOf(building, month);
  const snap = useSyncExternalStore(subscribe, () => snaps.get(key) ?? EMPTY, () => EMPTY);

  useEffect(() => {
    if (building) fetchMonth(building, month).catch(() => {});
  }, [building, month]);

  const reload = useCallback(() => fetchMonth(building, month, true), [building, month]);

  return {
    rows: snap.rows ?? NO_ROWS,
    ready: snap.rows !== null, // đã có dữ liệu (có thể đang tải lại ngầm)
    loading: snap.loading,
    error: snap.error,
    reload,
  };
}
