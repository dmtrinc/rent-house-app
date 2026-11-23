import type React from "react";

/* Style dùng chung cho các tab quản lý hóa đơn (theo tông tối của trang quản trị). */
export const input: React.CSSProperties = {
  width: "100%", padding: "10px", background: "#222", color: "#fff",
  border: "1px solid #444", borderRadius: 8, boxSizing: "border-box", fontSize: 15,
};
export const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
  background: bg, color, border: "none", padding: "10px 16px", borderRadius: 8,
  cursor: "pointer", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
});
export const smallBtn: React.CSSProperties = {
  background: "#1f1f1f", color: "#ddd", border: "1px solid #333", padding: "6px 10px",
  borderRadius: 6, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
};
export const card: React.CSSProperties = {
  background: "#111", border: "1px solid #222", borderRadius: 12, padding: 14,
};
export const th: React.CSSProperties = {
  padding: "10px 12px", textAlign: "left", background: "#1a1a1a", color: "#aaa",
  fontSize: 13, fontWeight: 500, borderBottom: "1px solid #222", whiteSpace: "nowrap",
};
export const td: React.CSSProperties = {
  padding: "10px 12px", borderBottom: "1px solid #1a1a1a", verticalAlign: "middle",
};
export const label: React.CSSProperties = { fontSize: 12, color: "#888", display: "block", marginBottom: 4 };

export type Room = {
  _id: string;
  code: string;
  tenantName: string;
  phone: string;
  people: number;
  vehicles: number;
  rent: number;
  deposit: number;
  electricPrice: number;
  waterPrice: number;
  parkingPrice: number;
  serviceFee: number;
  contractStart: string | null;
  contractEnd: string | null;
  meterStart: number;
  note: string;
  active: boolean;
  order: number;
};

export type Bill = {
  _id: string;
  month: string;
  roomId: string;
  roomCode: string;
  rent: number;
  electricPrice: number;
  oldMeter: number;
  newMeter: number;
  waterPrice: number;
  people: number;
  serviceFee: number;
  parkingPrice: number;
  vehicles: number;
  otherAmount: number;
  otherNote: string;
  total: number;
  paidAmount: number;
  paidAt: string | null;
  readingDate: string | null;
  token: string;
};

export type MonthRow = { room: Room; bill: Bill | null; prevMeter: number };

export async function api<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.json !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data as T;
}
